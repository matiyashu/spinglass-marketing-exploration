"""V3 marketing compute layer — the single source of truth for marketing metrics.

The generator (writes expected_outputs), the demo-JSON dump, and the FastAPI
endpoints all import from here so that bundled demo data and live computation
agree by construction.

This module intentionally builds on the paper-clean kernel in
``brand_ising_spin_glass.py`` (couplings, MI, Hopfield memory, Glauber sampling)
and adds only the marketing-specific extensions called for in the V3 plan:
context filtering, triad frustration, competitive leakage, segment overlap,
replica overlap P(q), a labeled rigidity proxy, campaign pressure / field
construction, susceptibility, and a data-sufficiency method-status model.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd

from brand_ising_spin_glass import (
    FEATURES,
    binarize_to_spins,
    corr_couplings,
    frustration_rate,
    glauber_sample,
    infer_mean_field_baseline,
    memory_couplings,
    memory_overlap,
    mutual_information_matrix,
)

# --- Feature metadata (group + business label) -----------------------------

FEATURE_GROUP: dict[str, str] = {
    "ad_recall": "awareness",
    "brand_link": "linkage",
    "distinctive_asset": "linkage",
    "trust": "meaning",
    "value_for_money": "meaning",
    "premium": "meaning",
    "fun": "meaning",
    "personal_relevance": "relevance",
    "consideration": "funnel",
    "competitor_salience": "competition",
}

FEATURE_LABEL: dict[str, str] = {
    "ad_recall": "Ad recall",
    "brand_link": "Brand link",
    "distinctive_asset": "Distinctive asset",
    "trust": "Trust",
    "value_for_money": "Value for money",
    "premium": "Premium",
    "fun": "Fun",
    "personal_relevance": "Personal relevance",
    "consideration": "Consideration",
    "competitor_salience": "Competitor salience",
}

# Likert (1-5, top-box >=4) vs binary (0/1) encoding in the tracker panel.
BINARY_FEATURES = ["ad_recall", "brand_link", "distinctive_asset", "consideration", "competitor_salience"]
LIKERT_FEATURES = ["trust", "value_for_money", "premium", "fun", "personal_relevance"]

CONTEXT_KEYS = ["brand_id", "product_id", "vertical_id", "market", "segment"]


# --- Context filtering ------------------------------------------------------


def filter_context(df: pd.DataFrame, context: dict[str, str | None] | None) -> pd.DataFrame:
    """Apply a brand/product/vertical/market/segment filter. None / 'all' = no filter."""
    if not context:
        return df
    out = df
    for key in CONTEXT_KEYS:
        val = context.get(key)
        if val and val != "all" and key in out.columns:
            out = out[out[key] == val]
    return out


def tracker_spins(df: pd.DataFrame) -> np.ndarray:
    """Binarize the canonical feature columns of a tracker frame to {-1,+1}."""
    return binarize_to_spins(df[FEATURES])


# --- Static + rolling couplings --------------------------------------------


def coupling_matrix(spins: np.ndarray, mode: str) -> np.ndarray:
    """mode in {spin_glass, ising, mi}. Returns an N×N matrix, zero diagonal."""
    if spins.shape[0] < 2:
        return np.zeros((len(FEATURES), len(FEATURES)))
    if mode == "mi":
        mi = mutual_information_matrix(spins.astype(float))
        if mi.max() > 0:
            mi = mi / mi.max()
        np.fill_diagonal(mi, 0.0)
        return mi
    return corr_couplings(spins, mode=mode, scale=1.0)


def _summary_metrics(corr: np.ndarray) -> dict[str, float]:
    ising = np.abs(corr)
    upper = np.triu_indices_from(corr, k=1)
    return {
        "avg_signed_coupling": float(corr[upper].mean()),
        "avg_abs_coupling_ising": float(ising[upper].mean()),
        "largest_eigenvalue_signed": float(np.linalg.eigvalsh(corr).max()),
        "largest_eigenvalue_ising": float(np.linalg.eigvalsh(ising).max()),
        "negative_edge_share": float(np.mean(corr[upper] < 0)),
    }


def static_summary(df: pd.DataFrame) -> dict[str, float]:
    """Single-window coherence summary for a (filtered) tracker frame."""
    spins = tracker_spins(df)
    corr = coupling_matrix(spins, "spin_glass")
    mi = coupling_matrix(spins, "mi")
    upper = np.triu_indices_from(corr, k=1)
    out = _summary_metrics(corr)
    out["avg_mutual_information"] = float(mi[upper].mean())
    out["n_respondents"] = int(df.shape[0])
    return out


def rolling_couplings(df: pd.DataFrame, window: int = 6, step: int = 1) -> list[dict]:
    """Rolling coherence metrics over tracker waves (monthly).

    Waves are pooled in windows of ``window`` consecutive dates, stepped by
    ``step``. Mirrors the commodity rolling-metric shape so the frontend
    RollingMetricsLine can render it unchanged.
    """
    if "date" not in df.columns:
        return []
    waves = sorted(df["date"].unique())
    records: list[dict] = []
    for start in range(0, len(waves) - window + 1, step):
        win = waves[start:start + window]
        frame = df[df["date"].isin(win)]
        spins = tracker_spins(frame)
        corr = coupling_matrix(spins, "spin_glass")
        mi = coupling_matrix(spins, "mi")
        upper = np.triu_indices_from(corr, k=1)
        rec = _summary_metrics(corr)
        rec.update(
            window_start=str(win[0]),
            window_end=str(win[-1]),
            window_size=window,
            step=step,
            avg_mutual_information=float(mi[upper].mean()),
        )
        records.append(rec)
    return records


# --- Tensions: signed edges + frustrated triads ----------------------------


def top_couplings(corr: np.ndarray, k: int = 8) -> dict[str, list[dict]]:
    pairs = []
    for i in range(len(FEATURES)):
        for j in range(i + 1, len(FEATURES)):
            pairs.append({"a": FEATURES[i], "b": FEATURES[j], "j": float(corr[i, j])})
    pos = sorted([p for p in pairs if p["j"] > 0], key=lambda p: p["j"], reverse=True)[:k]
    neg = sorted([p for p in pairs if p["j"] < 0], key=lambda p: p["j"])[:k]
    return {"reinforcing": pos, "conflicting": neg}


def triad_frustration(corr: np.ndarray, min_abs: float = 0.12) -> list[dict]:
    """Contradictory triads: sign(J_ij * J_jk * J_ik) < 0 with all |J| >= min_abs."""
    n = len(FEATURES)
    out = []
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                jij, jjk, jik = corr[i, j], corr[j, k], corr[i, k]
                if min(abs(jij), abs(jjk), abs(jik)) < min_abs:
                    continue
                if np.sign(jij) * np.sign(jjk) * np.sign(jik) < 0:
                    out.append(
                        {
                            "features": [FEATURES[i], FEATURES[j], FEATURES[k]],
                            "couplings": [float(jij), float(jjk), float(jik)],
                            "min_abs": float(min(abs(jij), abs(jjk), abs(jik))),
                        }
                    )
    return sorted(out, key=lambda t: t["min_abs"], reverse=True)


# --- Competitive leakage ----------------------------------------------------


def competitive_leakage(df: pd.DataFrame, competitor_pattern: np.ndarray) -> dict:
    """Mean overlap of observed spins with a competitor memory pattern."""
    spins = tracker_spins(df)
    if spins.shape[0] == 0:
        return {"competitor_overlap": 0.0, "leak_share": 0.0, "n": 0}
    overlaps = spins @ np.asarray(competitor_pattern) / len(competitor_pattern)
    return {
        "competitor_overlap": float(overlaps.mean()),
        "leak_share": float(np.mean(overlaps > 0)),
        "n": int(spins.shape[0]),
    }


# --- Segment overlap matrix -------------------------------------------------


def segment_overlap_matrix(df: pd.DataFrame, segments: list[str]) -> dict:
    """Cosine-style overlap of per-segment mean spin vectors."""
    means = {}
    for seg in segments:
        sub = df[df["segment"] == seg]
        if sub.shape[0] == 0:
            means[seg] = np.zeros(len(FEATURES))
        else:
            means[seg] = tracker_spins(sub).mean(axis=0)
    mat = np.zeros((len(segments), len(segments)))
    for a, sa in enumerate(segments):
        for b, sb in enumerate(segments):
            va, vb = means[sa], means[sb]
            denom = (np.linalg.norm(va) * np.linalg.norm(vb)) or 1.0
            mat[a, b] = float(va @ vb / denom)
    return {"segments": segments, "matrix": mat.tolist()}


# --- Method status (data-sufficiency) --------------------------------------

METHODS = [
    ("brand_couplings", "Brand memory couplings", ["tracker"]),
    ("product_comparison", "Product / vertical comparison", ["tracker"]),
    ("rolling_regime", "Rolling regime", ["tracker"]),
    ("replica_estimation", "Replica / fragmentation", ["tracker"]),
    ("campaign_field", "Campaign field simulation", ["campaigns", "creative_map"]),
    ("observed_response", "Observed pulse response", ["tracker", "campaigns"]),
    ("outcome_validation", "Outcome calibration", ["outcomes"]),
    ("competitive_leakage", "Competitive leakage", ["tracker", "competitor"]),
]


def method_status(tables_present: set[str]) -> list[dict]:
    out = []
    for mid, label, requires in METHODS:
        missing = [r for r in requires if r not in tables_present]
        out.append(
            {
                "method": mid,
                "label": label,
                "requires": requires,
                "enabled": not missing,
                "missing": missing,
            }
        )
    return out


# --- Replicas & rigidity (Phase 4) -----------------------------------------


def _overlap_pairs(states: np.ndarray) -> np.ndarray:
    """All a<b overlaps q_ab = (1/N) sum_i s_i^a s_i^b for a state stack."""
    n = states.shape[0]
    qs = []
    for a in range(n):
        for b in range(a + 1, n):
            qs.append(float(states[a] @ states[b] / states.shape[1]))
    return np.asarray(qs)


def pq_histogram(qs: np.ndarray, bins: int = 21) -> dict:
    counts, edges = np.histogram(qs, bins=bins, range=(-1.0, 1.0), density=True)
    centers = (edges[:-1] + edges[1:]) / 2.0
    return {
        "q": centers.tolist(),
        "pq": counts.tolist(),
        "mean": float(qs.mean()) if qs.size else 0.0,
        "std": float(qs.std()) if qs.size else 0.0,
    }


def landscape_replicas(j: np.ndarray, h: np.ndarray, beta: float, n_chains: int = 12, seed: int = 7) -> dict:
    """Independent Glauber chains under fixed quenched disorder (J,h,beta).

    A broad/multimodal P(q) is a *descriptive* competing-states signal, not RSB
    proof in a finite panel — the UI must label it as simulation.
    """
    finals = []
    for c in range(n_chains):
        samples = glauber_sample(j, h, beta=beta, n_steps=6000, burn_in=2000, sample_every=200, seed=seed + c)
        finals.append(samples[-1])
    states = np.asarray(finals)
    return pq_histogram(_overlap_pairs(states))


def bootstrap_replicas(spins: np.ndarray, n_replicas: int = 24, seed: int = 13) -> dict:
    """Estimation-stability replicas: resample respondents, compare coupling
    structure via overlap of vectorized upper-triangle couplings."""
    rng = np.random.default_rng(seed)
    upper = np.triu_indices(len(FEATURES), k=1)
    vecs = []
    for _ in range(n_replicas):
        idx = rng.integers(0, spins.shape[0], size=spins.shape[0])
        corr = coupling_matrix(spins[idx], "spin_glass")
        v = corr[upper]
        norm = np.linalg.norm(v) or 1.0
        vecs.append(v / norm)
    vecs = np.asarray(vecs)
    qs = []
    for a in range(len(vecs)):
        for b in range(a + 1, len(vecs)):
            qs.append(float(vecs[a] @ vecs[b]))
    return pq_histogram(np.asarray(qs), bins=21)


def rigidity_proxy(spins: np.ndarray) -> float:
    """(1/N) sum_i <s_i>^2 — a PROXY, not a full Edwards-Anderson order parameter."""
    if spins.shape[0] == 0:
        return 0.0
    m = spins.mean(axis=0)
    return float(np.mean(m ** 2))


# --- Campaign field, simulation, susceptibility (Phase 5) ------------------


def z(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 0 else np.zeros_like(x)


def campaign_pressure(spend: np.ndarray, reach: np.ndarray | None = None, frequency: np.ndarray | None = None) -> np.ndarray:
    """Scalar external-field intensity per the doc's pressure index (delivery only)."""
    pressure = z(np.log1p(np.asarray(spend, dtype=float)))
    if reach is not None:
        pressure = pressure + 0.5 * z(reach)
    if frequency is not None:
        pressure = pressure + 0.3 * (1.0 - np.exp(-0.5 * np.asarray(frequency, dtype=float)))
    return pressure


def build_field(h0: np.ndarray, pressure: float, target_vector: np.ndarray) -> np.ndarray:
    """h_i(t) = h_i^0 + pressure * a_c,i  (creative memory map a_c,i)."""
    return h0 + pressure * np.asarray(target_vector, dtype=float)


@dataclass
class SimResult:
    spend: float
    target_overlap: float
    competitor_overlap: float
    frustration: float
    rigidity_proxy: float


def simulate_campaign(
    spins: np.ndarray,
    target_pattern: np.ndarray,
    competitor_pattern: np.ndarray,
    spend_levels: list[float],
    memory_strength: float = 0.18,
    beta: float = 1.0,
    seed: int = 21,
) -> list[dict]:
    """Declared-field scenario simulation. Labeled simulation, not a forecast."""
    j_sg = corr_couplings(spins, mode="spin_glass", scale=0.55)
    h0 = infer_mean_field_baseline(spins, j_sg, beta=1.0)
    target = np.asarray(target_pattern, dtype=int)
    competitor = np.asarray(competitor_pattern, dtype=int)
    j_campaign = j_sg + memory_couplings(target.reshape(1, -1), strength=memory_strength)
    rng = np.random.default_rng(seed)
    out = []
    for spend in spend_levels:
        h = h0 + spend * target + rng.normal(0.0, 0.03, size=len(FEATURES))
        samples = glauber_sample(j_campaign, h, beta=beta, seed=int(1000 * spend + 5))
        out.append(
            asdict(
                SimResult(
                    spend=float(spend),
                    target_overlap=memory_overlap(samples, target),
                    competitor_overlap=memory_overlap(samples, competitor),
                    frustration=frustration_rate(samples, j_campaign),
                    rigidity_proxy=rigidity_proxy(samples),
                )
            )
        )
    return out


def susceptibility(spins: np.ndarray, beta: float = 1.0, dh: float = 0.15, seed: int = 31) -> list[dict]:
    """Numerical chi_i = d<s_i>/dh_i — which associations are easiest to move."""
    j_sg = corr_couplings(spins, mode="spin_glass", scale=0.55)
    h0 = infer_mean_field_baseline(spins, j_sg, beta=1.0)
    base = glauber_sample(j_sg, h0, beta=beta, seed=seed).mean(axis=0)
    out = []
    for i, feat in enumerate(FEATURES):
        h_pert = h0.copy()
        h_pert[i] += dh
        pert = glauber_sample(j_sg, h_pert, beta=beta, seed=seed + i + 1).mean(axis=0)
        out.append({"feature": feat, "chi": float((pert[i] - base[i]) / dh)})
    return sorted(out, key=lambda r: r["chi"], reverse=True)
