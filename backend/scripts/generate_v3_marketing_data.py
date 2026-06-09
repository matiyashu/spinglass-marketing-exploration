"""Generate the V3 marketing-shaped synthetic demo dataset.

Writes backend/sample_data/v3_marketing/*.csv plus an expected_outputs/ folder
of QA targets computed via marketing_kernel (the same code the backend and the
demo-JSON dump use), so bundled demo data and live compute agree by construction.

Dimensions (per the V3 plan):
    2 brands x 3 products x 2 verticals x 3 markets x 4 segments
    x 24 monthly waves x 6 campaigns, 10 canonical features, partial outcomes.

Run:  python backend/scripts/generate_v3_marketing_data.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from brand_ising_spin_glass import FEATURES, memory_couplings  # noqa: E402
import marketing_kernel as mk  # noqa: E402

OUT = BACKEND / "sample_data" / "v3_marketing"
EXP = OUT / "expected_outputs"

# --- Dimensions -------------------------------------------------------------

BRANDS = {"brand_a": "Aurora", "brand_b": "Borealis"}
VERTICALS = {"rtd_beverages": "RTD beverages", "snacks": "Snacks"}
PRODUCTS = {
    # product_id: (brand_id, vertical_id, name, price_tier, target_segment)
    "aurora_rtd_coffee": ("brand_a", "rtd_beverages", "Aurora Cold Brew", "premium", "premium_loyalists"),
    "aurora_rtd_tea": ("brand_a", "rtd_beverages", "Aurora Sparkling Tea", "mainstream", "millennial_urban"),
    "aurora_protein_bar": ("brand_a", "snacks", "Aurora Protein Bar", "premium", "gen_z_urban"),
    "borealis_energy": ("brand_b", "rtd_beverages", "Borealis Energy", "mainstream", "gen_z_urban"),
    "borealis_sparkling": ("brand_b", "rtd_beverages", "Borealis Sparkling", "value", "value_seekers"),
    "borealis_trail_mix": ("brand_b", "snacks", "Borealis Trail Mix", "value", "value_seekers"),
}
MARKETS = {"ID": "Indonesia", "PH": "Philippines", "VN": "Vietnam"}
SEGMENTS = ["gen_z_urban", "millennial_urban", "value_seekers", "premium_loyalists"]
N_WAVES = 24
RESPONDENTS_PER_CELL = 10

# Canonical brand vs competitor memory patterns (order matches FEATURES).
#                ad brand dist trust value prem fun  pers cons  comp
BRAND_TARGET = np.array([1, 1, 1, 1, 1, 1, 1, 1, 1, -1])
COMPETITOR = np.array([-1, -1, -1, -1, -1, -1, -1, -1, -1, 1])

# Brand-specific strategic tensions (feature_a, feature_b): J value.
BRAND_TENSIONS = {
    "brand_a": {
        ("value_for_money", "premium"): -0.42,
        ("trust", "consideration"): 0.30,
        ("brand_link", "competitor_salience"): -0.34,
        ("fun", "trust"): -0.14,
    },
    "brand_b": {
        ("value_for_money", "premium"): -0.30,
        ("fun", "personal_relevance"): 0.34,
        ("consideration", "competitor_salience"): -0.36,
        ("premium", "trust"): 0.28,
    },
}

# Segment random fields eta_i (priors): boosts/dampens specific associations.
# Kept modest so they bias the *means* (segment differentiation) without pinning
# features to a constant — pinned features lose variance and their couplings vanish.
SEGMENT_FIELDS = {
    "gen_z_urban": {"fun": 0.28, "personal_relevance": 0.22, "premium": -0.12, "trust": -0.08},
    "millennial_urban": {"consideration": 0.15, "trust": 0.10, "competitor_salience": 0.08},
    "value_seekers": {"value_for_money": 0.30, "premium": -0.22, "trust": -0.05},
    "premium_loyalists": {"premium": 0.26, "trust": 0.20, "value_for_money": -0.16, "ad_recall": 0.08},
}

PRICE_TIER_TILT = {
    "premium": {"premium": 0.18, "trust": 0.10, "value_for_money": -0.10},
    "mainstream": {},
    "value": {"value_for_money": 0.20, "premium": -0.15},
}

MARKET_FIELDS = {
    "ID": {},
    "PH": {"trust": -0.10, "fun": 0.10},
    "VN": {"competitor_salience": 0.18, "value_for_money": 0.10},
}

# Campaigns: id -> dict. start/end are wave indices (0..23). Creative targets a
# subset of features. Only campaigns with `has_outcomes` emit outcomes rows.
CAMPAIGNS = {
    "C001": dict(brand="brand_a", product="aurora_rtd_coffee", creative="CR001", start=3, end=8,
                 channel="paid_social", market="ID", segment="premium_loyalists", has_outcomes=True,
                 targets={"premium": 1.0, "trust": 0.7, "ad_recall": 1.0, "value_for_money": -0.4}),
    "C002": dict(brand="brand_a", product="aurora_protein_bar", creative="CR002", start=6, end=12,
                 channel="video", market="ID", segment="gen_z_urban", has_outcomes=True,
                 targets={"fun": 1.0, "personal_relevance": 0.8, "brand_link": 0.9, "competitor_salience": -1.0}),
    "C003": dict(brand="brand_b", product="borealis_energy", creative="CR003", start=9, end=15,
                 channel="paid_social", market="PH", segment="gen_z_urban", has_outcomes=True,
                 targets={"ad_recall": 1.0, "fun": 0.9, "brand_link": 1.0, "competitor_salience": -0.8}),
    "C004": dict(brand="brand_b", product="borealis_sparkling", creative="CR004", start=12, end=18,
                 channel="ooh", market="VN", segment="value_seekers", has_outcomes=False,
                 targets={"value_for_money": 1.0, "consideration": 0.7, "premium": -0.5}),
    "C005": dict(brand="brand_a", product="aurora_rtd_tea", creative="CR005", start=15, end=20,
                 channel="search", market="PH", segment="millennial_urban", has_outcomes=False,
                 targets={"distinctive_asset": 1.0, "brand_link": 0.8, "trust": 0.5}),
    "C006": dict(brand="brand_b", product="borealis_trail_mix", creative="CR006", start=18, end=23,
                 channel="video", market="ID", segment="value_seekers", has_outcomes=False,
                 targets={"value_for_money": 0.9, "fun": 0.6, "personal_relevance": 0.6}),
}


def target_vector(targets: dict[str, float]) -> np.ndarray:
    v = np.zeros(len(FEATURES))
    for feat, strength in targets.items():
        v[FEATURES.index(feat)] = strength
    return v


def brand_true_j(brand: str) -> np.ndarray:
    j = memory_couplings(np.vstack([BRAND_TARGET, COMPETITOR]), strength=0.42)
    for (a, b), val in BRAND_TENSIONS[brand].items():
        ia, ib = FEATURES.index(a), FEATURES.index(b)
        j[ia, ib] = j[ib, ia] = val
    return j


def field_offsets(mapping: dict[str, float]) -> np.ndarray:
    v = np.zeros(len(FEATURES))
    for feat, val in mapping.items():
        v[FEATURES.index(feat)] = val
    return v


def glauber_batch(j, h_batch, beta, n_chains, burn_in, seed):
    """Vectorized single-spin Glauber: one final snapshot per chain."""
    rng = np.random.default_rng(seed)
    n = j.shape[0]
    s = rng.choice([-1, 1], size=(n_chains, n)).astype(float)
    for step in range(burn_in):
        i = int(rng.integers(n))
        local = h_batch[:, i] + s @ j[:, i]
        delta_e = 2.0 * s[:, i] * local
        flip_p = 1.0 / (1.0 + np.exp(np.clip(beta * delta_e, -60.0, 60.0)))
        flip = rng.random(n_chains) < flip_p
        s[flip, i] *= -1
    return s.astype(int)


def spins_to_observed(spins_row: np.ndarray, rng: np.random.Generator) -> dict:
    obs = {}
    for i, feat in enumerate(FEATURES):
        spin = spins_row[i]
        if feat in mk.BINARY_FEATURES:
            obs[feat] = int(1 if spin > 0 else 0)
        else:
            obs[feat] = int(rng.choice([4, 5]) if spin > 0 else rng.choice([1, 2, 3]))
    return obs


def wave_date(w: int) -> str:
    year = 2024 + (w // 12)
    month = (w % 12) + 1
    return f"{year}-{month:02d}-01"


def campaign_pressure_for(product: str, market: str, segment: str, wave: int) -> tuple[float, np.ndarray]:
    """Return (pressure, target_vector) summed over active campaigns for the cell."""
    pressure_vec = np.zeros(len(FEATURES))
    total = 0.0
    for cid, c in CAMPAIGNS.items():
        if c["product"] != product or not (c["start"] <= wave <= c["end"]):
            continue
        # Ramp pressure: peak mid-flight.
        span = c["end"] - c["start"]
        rel = (wave - c["start"]) / max(span, 1)
        ramp = float(np.sin(np.pi * rel))  # 0 -> 1 -> 0
        market_mult = 1.0 if c["market"] == market else 0.45
        seg_mult = 1.0 if c["segment"] == segment else 0.5
        intensity = 0.55 * ramp * market_mult * seg_mult
        pressure_vec += intensity * target_vector(c["targets"])
        total += intensity
    return total, pressure_vec


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    EXP.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(2026)

    tracker_rows: list[dict] = []
    seed = 1000
    for product, (brand, vertical, _name, tier, _seg) in PRODUCTS.items():
        j_true = brand_true_j(brand)
        tier_off = field_offsets(PRICE_TIER_TILT[tier])
        for market in MARKETS:
            market_off = field_offsets(MARKET_FIELDS[market])
            for segment in SEGMENTS:
                seg_off = field_offsets(SEGMENT_FIELDS[segment])
                base_h = (
                    np.array([-0.30, -0.25, -0.10, 0.05, 0.00, -0.05, 0.00, -0.15, -0.20, 0.10])
                    + tier_off + market_off + seg_off
                )
                for wave in range(N_WAVES):
                    _, pressure_vec = campaign_pressure_for(product, market, segment, wave)
                    drift = 0.04 * np.sin(2 * np.pi * wave / N_WAVES) * BRAND_TARGET
                    h = base_h + pressure_vec + drift
                    h_batch = np.tile(h, (RESPONDENTS_PER_CELL, 1))
                    seed += 1
                    states = glauber_batch(j_true, h_batch, beta=1.15,
                                           n_chains=RESPONDENTS_PER_CELL, burn_in=900, seed=seed)
                    cell_rng = np.random.default_rng(seed + 500_000)
                    for r in range(RESPONDENTS_PER_CELL):
                        obs = spins_to_observed(states[r], cell_rng)
                        tracker_rows.append({
                            "respondent_id": f"R{len(tracker_rows):06d}",
                            "date": wave_date(wave),
                            "wave_id": f"{wave_date(wave)[:7]}",
                            "brand_id": brand,
                            "product_id": product,
                            "vertical_id": vertical,
                            "market": market,
                            "segment": segment,
                            **obs,
                        })

    tracker = pd.DataFrame(tracker_rows)
    tracker.to_csv(OUT / "brand_tracker_panel.csv", index=False)

    # product_catalog.csv
    cat = pd.DataFrame([
        {"product_id": pid, "brand_id": b, "vertical_id": v, "product_name": name,
         "price_tier": tier, "target_segment": seg, "launch_date": "2023-06-01"}
        for pid, (b, v, name, tier, seg) in PRODUCTS.items()
    ])
    cat.to_csv(OUT / "product_catalog.csv", index=False)

    # campaign_calendar.csv  (+ delivery metrics)
    cal_rows = []
    for cid, c in CAMPAIGNS.items():
        for wave in range(c["start"], c["end"] + 1):
            span = c["end"] - c["start"]
            rel = (wave - c["start"]) / max(span, 1)
            ramp = float(np.sin(np.pi * rel))
            spend = round(40_000 + 60_000 * ramp, 2)
            cal_rows.append({
                "campaign_id": cid, "brand_id": c["brand"], "product_id": c["product"],
                "vertical_id": PRODUCTS[c["product"]][1], "creative_id": c["creative"],
                "channel": c["channel"], "market": c["market"], "segment": c["segment"],
                "date": wave_date(wave), "start_date": wave_date(c["start"]), "end_date": wave_date(c["end"]),
                "spend": spend, "impressions": int(spend * 75), "reach": int(spend * 25),
                "frequency": round(2.0 + 2.5 * ramp, 2), "clicks": int(spend * 2.2),
            })
    pd.DataFrame(cal_rows).to_csv(OUT / "campaign_calendar.csv", index=False)

    # creative_memory_map.csv
    cm_rows = []
    for cid, c in CAMPAIGNS.items():
        for feat, strength in c["targets"].items():
            cm_rows.append({
                "creative_id": c["creative"], "feature_name": feat,
                "target_spin": int(np.sign(strength)), "intended_strength": abs(round(strength, 2)),
                "evidence_source": "strategy",
            })
    pd.DataFrame(cm_rows).to_csv(OUT / "creative_memory_map.csv", index=False)

    # competitor_context.csv
    comp_rows = []
    for market in MARKETS:
        for vertical in VERTICALS:
            for wave in range(N_WAVES):
                spend = round(30_000 + 20_000 * np.sin(2 * np.pi * (wave + 3) / N_WAVES) ** 2, 2)
                comp_rows.append({
                    "date": wave_date(wave), "market": market, "vertical_id": vertical,
                    "competitor_id": f"comp_{market.lower()}", "competitor_spend": spend,
                    "share_of_voice": round(0.3 + 0.2 * (spend / 50_000), 3),
                    "category_demand": round(0.5 + 0.3 * np.sin(2 * np.pi * wave / N_WAVES), 3),
                })
    pd.DataFrame(comp_rows).to_csv(OUT / "competitor_context.csv", index=False)

    # outcomes_partial.csv  (only campaigns with has_outcomes)
    out_rows = []
    for cid, c in CAMPAIGNS.items():
        if not c["has_outcomes"]:
            continue
        for wave in range(c["start"], c["end"] + 1):
            rel = (wave - c["start"]) / max(c["end"] - c["start"], 1)
            lift = 0.01 + 0.03 * np.sin(np.pi * rel)
            out_rows.append({
                "date": wave_date(wave), "brand_id": c["brand"], "product_id": c["product"],
                "vertical_id": PRODUCTS[c["product"]][1], "market": c["market"], "segment": c["segment"],
                "campaign_id": cid, "conversions": int(800 + 600 * rel),
                "cvr": round(0.03 + 0.02 * rel, 4), "cpa": round(12 - 3 * rel, 2),
                "revenue": int(38_000 + 18_000 * rel), "roas": round(3.0 + 1.2 * rel, 2),
                "brand_lift": round(lift, 4),
            })
    pd.DataFrame(out_rows).to_csv(OUT / "outcomes_partial.csv", index=False)

    # dimensions.json — the canonical lists the frontend context selector reads.
    dimensions = {
        "brands": [{"id": k, "label": v} for k, v in BRANDS.items()],
        "verticals": [{"id": k, "label": v} for k, v in VERTICALS.items()],
        "products": [{"id": pid, "label": name, "brand_id": b, "vertical_id": v, "price_tier": tier}
                     for pid, (b, v, name, tier, _s) in PRODUCTS.items()],
        "markets": [{"id": k, "label": v} for k, v in MARKETS.items()],
        "segments": [{"id": s, "label": s.replace("_", " ").title()} for s in SEGMENTS],
        "campaigns": [{"id": cid, "label": cid, "brand_id": c["brand"], "product_id": c["product"],
                       "creative_id": c["creative"], "market": c["market"], "segment": c["segment"],
                       "start_date": wave_date(c["start"]),
                       "end_date": wave_date(c["end"]), "has_outcomes": c["has_outcomes"]}
                      for cid, c in CAMPAIGNS.items()],
        "features": [{"id": f, "label": mk.FEATURE_LABEL[f], "group": mk.FEATURE_GROUP[f]} for f in FEATURES],
        "n_waves": N_WAVES,
    }
    (OUT / "dimensions.json").write_text(json.dumps(dimensions, indent=2))

    write_expected_outputs(tracker)
    print(f"tracker rows: {len(tracker)}  ->  {OUT}")


def write_expected_outputs(tracker: pd.DataFrame) -> None:
    # brand_memory_summary.csv — per brand static coherence summary.
    rows = []
    for brand in BRANDS:
        summary = mk.static_summary(mk.filter_context(tracker, {"brand_id": brand}))
        rows.append({"brand_id": brand, **summary})
    pd.DataFrame(rows).to_csv(EXP / "brand_memory_summary.csv", index=False)

    # rolling_couplings.csv — canonical context: brand_a, all segments.
    rolling = mk.rolling_couplings(mk.filter_context(tracker, {"brand_id": "brand_a"}), window=6, step=1)
    pd.DataFrame(rolling).to_csv(EXP / "rolling_couplings.csv", index=False)

    # replica_overlap.csv — bootstrap estimation-stability P(q) for brand_a.
    spins = mk.tracker_spins(mk.filter_context(tracker, {"brand_id": "brand_a"}))
    boot = mk.bootstrap_replicas(spins, n_replicas=24, seed=13)
    pd.DataFrame({"q": boot["q"], "pq": boot["pq"]}).to_csv(EXP / "replica_overlap.csv", index=False)

    # campaign_validation.csv — simulated scenario sweep for campaign C001's brand.
    sim = mk.simulate_campaign(
        mk.tracker_spins(mk.filter_context(tracker, {"brand_id": "brand_a"})),
        BRAND_TARGET, COMPETITOR, spend_levels=[0.0, 0.22, 0.45],
    )
    pd.DataFrame(sim).to_csv(EXP / "campaign_validation.csv", index=False)


if __name__ == "__main__":
    main()
