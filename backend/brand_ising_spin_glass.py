"""
Prototype: Ising / spin-glass model for campaign and brand-memory measurement.

The code is deliberately small and data-shape oriented. Replace the synthetic
panel in demo() with a real brand tracker table where columns are brand
associations, message memories, or binary behavioral states.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


FEATURES = [
    "ad_recall",
    "brand_link",
    "distinctive_asset",
    "trust",
    "value_for_money",
    "premium",
    "fun",
    "personal_relevance",
    "consideration",
    "competitor_salience",
]


def sigmoid(x: np.ndarray | float) -> np.ndarray | float:
    return 1.0 / (1.0 + np.exp(-x))


def binarize_to_spins(frame: pd.DataFrame, thresholds: dict[str, float] | None = None) -> np.ndarray:
    """
    Convert numeric survey columns into spins {-1, +1}.

    For a binary column, values above 0 are +1. For a continuous/ordinal column,
    the default threshold is the column median unless thresholds supplies one.
    """
    thresholds = thresholds or {}
    spins = []
    for col in frame.columns:
        values = frame[col].to_numpy(dtype=float)
        unique = np.unique(values[~np.isnan(values)])
        cutoff = thresholds.get(col, 0.0 if set(unique).issubset({0.0, 1.0}) else float(np.nanmedian(values)))
        spins.append(np.where(values > cutoff, 1, -1))
    return np.column_stack(spins).astype(int)


def corr_couplings(spins: np.ndarray, mode: str = "spin_glass", scale: float = 1.0) -> np.ndarray:
    """
    Estimate pairwise couplings from observed co-activation.

    mode="spin_glass" keeps signed correlations: conflict and reinforcement.
    mode="ising" uses abs(correlation): total synchronization strength only.
    """
    corr = np.corrcoef(spins, rowvar=False)
    corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
    np.fill_diagonal(corr, 0.0)
    if mode == "ising":
        j = np.abs(corr)
    elif mode == "spin_glass":
        j = corr
    else:
        raise ValueError("mode must be 'ising' or 'spin_glass'")
    return scale * j


def _quantile_bins(values: np.ndarray, n_bins: int = 4) -> np.ndarray:
    edges = np.unique(np.quantile(values, np.linspace(0.0, 1.0, n_bins + 1)))
    if len(edges) <= 2:
        return (values > np.median(values)).astype(int)
    return np.digitize(values, edges[1:-1], right=True)


def mutual_information_matrix(values: np.ndarray, n_bins: int = 4) -> np.ndarray:
    """
    Plug-in mutual information estimator using quantile bins.

    Useful when relationships are nonlinear. MI is non-negative, so use it as an
    Ising-like strength, or multiply by sign(correlation) to create a signed
    nonlinear spin-glass coupling.
    """
    x = np.asarray(values)
    bins = np.column_stack([_quantile_bins(x[:, i], n_bins=n_bins) for i in range(x.shape[1])])
    out = np.zeros((x.shape[1], x.shape[1]), dtype=float)
    for i in range(x.shape[1]):
        for j in range(i + 1, x.shape[1]):
            xi, yi = bins[:, i], bins[:, j]
            joint = pd.crosstab(xi, yi, normalize=True).to_numpy()
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            expected = px @ py
            mask = joint > 0
            mi = float(np.sum(joint[mask] * np.log(joint[mask] / expected[mask])))
            out[i, j] = out[j, i] = mi
    return out


def mi_couplings(values: np.ndarray, signed: bool = True, scale: float = 1.0) -> np.ndarray:
    mi = mutual_information_matrix(values)
    if mi.max() > 0:
        mi = mi / mi.max()
    if signed:
        signs = np.sign(corr_couplings(values, mode="spin_glass", scale=1.0))
        mi = mi * signs
    np.fill_diagonal(mi, 0.0)
    return scale * mi


def memory_couplings(patterns: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """
    Hopfield/Amit-style memory term.

    patterns shape: (n_patterns, n_features), entries in {-1, +1}.
    A target campaign memory becomes an attractor when this matrix is added to J.
    """
    patterns = np.asarray(patterns, dtype=float)
    n_features = patterns.shape[1]
    j = strength * (patterns.T @ patterns) / n_features
    np.fill_diagonal(j, 0.0)
    return j


def infer_mean_field_baseline(spins: np.ndarray, j: np.ndarray, beta: float = 1.0) -> np.ndarray:
    """
    Approximate baseline fields h from observed means using m = tanh(beta(h + Jm)).
    """
    m = np.clip(spins.mean(axis=0), -0.95, 0.95)
    return np.arctanh(m) / beta - j @ m


def glauber_sample(
    j: np.ndarray,
    h: np.ndarray,
    beta: float = 1.0,
    n_steps: int = 80_000,
    burn_in: int = 20_000,
    sample_every: int = 50,
    seed: int = 7,
    initial: np.ndarray | None = None,
) -> np.ndarray:
    """
    Draw states from an Ising/spin-glass system with single-spin Glauber updates.
    """
    rng = np.random.default_rng(seed)
    n = len(h)
    s = rng.choice([-1, 1], size=n) if initial is None else initial.astype(int).copy()
    samples = []
    for step in range(n_steps):
        i = int(rng.integers(n))
        local_field = h[i] + float(j[i] @ s)
        delta_e = 2.0 * s[i] * local_field
        flip_prob = 1.0 / (1.0 + np.exp(np.clip(beta * delta_e, -60.0, 60.0)))
        if rng.random() < flip_prob:
            s[i] *= -1
        if step >= burn_in and (step - burn_in) % sample_every == 0:
            samples.append(s.copy())
    return np.asarray(samples, dtype=int)


def memory_overlap(samples: np.ndarray, pattern: np.ndarray) -> float:
    """Mean overlap with a target memory: -1 opposite, 0 unrelated, +1 retrieved."""
    return float(np.mean(samples @ pattern / len(pattern)))


def frustration_rate(samples: np.ndarray, j: np.ndarray) -> float:
    """
    Share of active edges whose preferred relation is violated.

    A positive J wants equal spins; a negative J wants opposite spins.
    """
    idx_i, idx_j = np.triu_indices_from(j, k=1)
    edge_sign = np.sign(j[idx_i, idx_j])
    active = edge_sign != 0
    if not np.any(active):
        return 0.0
    violations = []
    for s in samples:
        satisfied = edge_sign[active] * s[idx_i][active] * s[idx_j][active] > 0
        violations.append(1.0 - satisfied.mean())
    return float(np.mean(violations))


@dataclass
class ScenarioResult:
    name: str
    target_overlap: float
    competitor_overlap: float
    mean_consideration: float
    purchase_probability: float
    frustration: float


def summarize_scenario(
    name: str,
    samples: np.ndarray,
    target_pattern: np.ndarray,
    competitor_pattern: np.ndarray,
    j: np.ndarray,
) -> ScenarioResult:
    target = memory_overlap(samples, target_pattern)
    competitor = memory_overlap(samples, competitor_pattern)
    mean_consideration = float(samples[:, FEATURES.index("consideration")].mean())
    frustration = frustration_rate(samples, j)

    # Example downstream KPI layer. In real work, fit these coefficients from
    # conversion, sales lift, choice-model, or experiment data.
    logit_purchase = -0.35 + 1.60 * target + 0.90 * mean_consideration - 0.75 * competitor - 0.80 * frustration
    purchase_probability = float(sigmoid(logit_purchase))
    return ScenarioResult(name, target, competitor, mean_consideration, purchase_probability, frustration)


def demo() -> None:
    rng = np.random.default_rng(42)

    target_pattern = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
    competitor_pattern = np.array([-1, -1, -1, -1, -1, 1, -1, -1, -1, 1])

    # Synthetic "true" brand landscape: target memory + competitor memory +
    # a few strategic tensions.
    j_true = memory_couplings(np.vstack([target_pattern, competitor_pattern]), strength=0.32)
    tensions = {
        ("value_for_money", "premium"): -0.35,
        ("fun", "trust"): -0.12,
        ("brand_link", "competitor_salience"): -0.36,
        ("consideration", "competitor_salience"): -0.30,
        ("trust", "consideration"): 0.25,
    }
    for (a, b), value in tensions.items():
        ia, ib = FEATURES.index(a), FEATURES.index(b)
        j_true[ia, ib] = j_true[ib, ia] = value

    baseline_h = np.array([-0.35, -0.30, -0.10, 0.02, 0.04, -0.03, -0.02, -0.15, -0.25, 0.10])
    observed_panel = glauber_sample(j_true, baseline_h, beta=0.70, n_steps=160_000, burn_in=20_000, sample_every=40, seed=11)

    # What you would estimate from a real brand tracker.
    j_spin_glass = corr_couplings(observed_panel, mode="spin_glass", scale=0.55)
    j_ising = corr_couplings(observed_panel, mode="ising", scale=0.55)
    h0 = infer_mean_field_baseline(observed_panel, j_spin_glass, beta=1.0)

    # Add campaign-memory attractor from the planned strategic message.
    j_memory = memory_couplings(target_pattern.reshape(1, -1), strength=0.18)
    j_campaign_model = j_spin_glass + j_memory

    rows = []
    for name, spend in [("baseline", 0.00), ("moderate_campaign", 0.22), ("heavy_campaign", 0.45)]:
        # External field: campaign pressure makes target-aligned associations
        # easier to activate and competitor salience harder to activate.
        h_campaign = h0 + spend * target_pattern + rng.normal(0.0, 0.03, size=len(FEATURES))
        samples = glauber_sample(j_campaign_model, h_campaign, beta=1.0, seed=int(1000 * spend + 5))
        rows.append(summarize_scenario(name, samples, target_pattern, competitor_pattern, j_campaign_model).__dict__)

    results = pd.DataFrame(rows)
    print("\nScenario results")
    print(results.to_string(index=False, float_format=lambda x: f"{x:0.3f}"))

    print("\nTop signed spin-glass couplings estimated from the synthetic tracker")
    pairs = []
    for i in range(len(FEATURES)):
        for j in range(i + 1, len(FEATURES)):
            pairs.append((FEATURES[i], FEATURES[j], j_spin_glass[i, j], j_ising[i, j]))
    top = sorted(pairs, key=lambda row: abs(row[2]), reverse=True)[:8]
    print(pd.DataFrame(top, columns=["feature_a", "feature_b", "J_spin_glass", "J_ising_strength"]).to_string(index=False))

    print("\nTemplate for real tracker data")
    print("survey = pd.read_csv('brand_tracker.csv')")
    print("spins = binarize_to_spins(survey[FEATURES])")
    print("J_sg = corr_couplings(spins, mode='spin_glass', scale=0.55)")
    print("J_mi = mi_couplings(spins, signed=True, scale=0.55)")


if __name__ == "__main__":
    demo()
