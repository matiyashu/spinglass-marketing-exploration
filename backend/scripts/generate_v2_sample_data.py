"""
Generate V2 demo datasets with explicit scientific labels.

The commodity files are synthetic but paper-aligned: they mimic the 15-asset
commodity system used for rolling Ising / spin-glass / MI coupling analysis.

The brand files are synthetic application data: useful for testing live
dashboard computation, not for claiming marketing effectiveness.
"""
from __future__ import annotations

from pathlib import Path
import json

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sample_data"
OUT.mkdir(parents=True, exist_ok=True)

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

COMMODITIES = [
    ("gold", "precious_metals", 1900.0),
    ("silver", "precious_metals", 24.0),
    ("platinum", "precious_metals", 950.0),
    ("palladium", "precious_metals", 1800.0),
    ("copper", "industrial_metals", 3.8),
    ("wti_crude", "energy", 62.0),
    ("brent_crude", "energy", 66.0),
    ("natural_gas", "energy", 3.2),
    ("heating_oil", "energy", 2.1),
    ("wheat", "grains", 6.0),
    ("corn", "grains", 4.8),
    ("soybeans", "grains", 12.5),
    ("coffee", "softs", 1.5),
    ("sugar", "softs", 0.16),
    ("cotton", "softs", 0.78),
]


def sigmoid(x: np.ndarray | float) -> np.ndarray | float:
    return 1.0 / (1.0 + np.exp(-x))


def mutual_information_matrix(values: np.ndarray, n_bins: int = 4) -> np.ndarray:
    bins = []
    for i in range(values.shape[1]):
        col = values[:, i]
        edges = np.unique(np.quantile(col, np.linspace(0.0, 1.0, n_bins + 1)))
        if len(edges) <= 2:
            bins.append((col > np.median(col)).astype(int))
        else:
            bins.append(np.digitize(col, edges[1:-1], right=True))
    binned = np.column_stack(bins)
    out = np.zeros((values.shape[1], values.shape[1]), dtype=float)
    for i in range(values.shape[1]):
        for j in range(i + 1, values.shape[1]):
            joint = pd.crosstab(binned[:, i], binned[:, j], normalize=True).to_numpy()
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            expected = px @ py
            mask = joint > 0
            mi = float(np.sum(joint[mask] * np.log(joint[mask] / expected[mask])))
            out[i, j] = out[j, i] = mi
    return out


def write_rolling_commodity_metrics(returns: pd.DataFrame, window: int = 90, step: int = 30) -> None:
    asset_cols = [name for name, _group, _start in COMMODITIES]
    rows = []
    for start in range(0, len(returns) - window + 1, step):
        stop = start + window
        frame = returns.iloc[start:stop]
        x = frame[asset_cols].to_numpy(dtype=float)
        corr = np.corrcoef(x, rowvar=False)
        corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
        np.fill_diagonal(corr, 0.0)
        ising = np.abs(corr)
        mi = mutual_information_matrix(x)
        upper = np.triu_indices_from(corr, k=1)
        rows.append(
            {
                "window_start": frame["date"].iloc[0].date().isoformat(),
                "window_end": frame["date"].iloc[-1].date().isoformat(),
                "window_size": window,
                "step": step,
                "avg_signed_coupling": float(corr[upper].mean()),
                "avg_abs_coupling_ising": float(ising[upper].mean()),
                "avg_mutual_information": float(mi[upper].mean()),
                "largest_eigenvalue_signed": float(np.linalg.eigvalsh(corr).max()),
                "largest_eigenvalue_ising": float(np.linalg.eigvalsh(ising).max()),
                "negative_edge_share": float(np.mean(corr[upper] < 0)),
            }
        )
    pd.DataFrame(rows).to_csv(OUT / "commodity_paper_aligned_rolling_metrics.csv", index=False)


def stress_bump(day_index: np.ndarray, center: int, width: float) -> np.ndarray:
    return np.exp(-0.5 * ((day_index - center) / width) ** 2)


def generate_commodity_data(seed: int = 2026) -> None:
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range("2020-01-02", "2024-12-31")
    n = len(dates)
    idx = np.arange(n)

    covid_center = int(np.argmin(np.abs(dates - pd.Timestamp("2020-03-16"))))
    energy_center = int(np.argmin(np.abs(dates - pd.Timestamp("2022-03-01"))))
    stress = 0.8 * stress_bump(idx, covid_center, 28.0) + 1.1 * stress_bump(idx, energy_center, 45.0)

    common = rng.normal(0.0, 0.006 + 0.009 * stress, n)
    group_factors = {
        "precious_metals": rng.normal(0.0, 0.007 + 0.004 * stress, n),
        "industrial_metals": rng.normal(0.0, 0.008 + 0.006 * stress, n),
        "energy": rng.normal(0.0, 0.012 + 0.014 * stress, n),
        "grains": rng.normal(0.0, 0.009 + 0.006 * stress, n),
        "softs": rng.normal(0.0, 0.010 + 0.004 * stress, n),
    }

    # Event shocks intentionally create rolling-regime changes, similar to what
    # a commodity interdependence study is meant to detect.
    covid_shock = -0.020 * stress_bump(idx, covid_center, 9.0)
    energy_shock = 0.025 * stress_bump(idx, energy_center, 18.0)
    safe_haven_shock = 0.011 * stress_bump(idx, covid_center, 18.0)

    returns = pd.DataFrame({"date": dates})
    prices = pd.DataFrame({"date": dates})
    groups = []

    for name, group, start_price in COMMODITIES:
        idio = rng.normal(0.0, 0.006 if group != "energy" else 0.010, n)
        loading_common = 0.50 + rng.normal(0, 0.05)
        loading_group = 0.75 + rng.normal(0, 0.08)
        drift = 0.00005 + rng.normal(0, 0.00003)
        r = drift + loading_common * common + loading_group * group_factors[group] + idio

        if group == "energy":
            r = r + 1.35 * energy_shock + 0.80 * covid_shock
        elif group == "precious_metals":
            r = r + safe_haven_shock - 0.25 * covid_shock
        elif group in {"industrial_metals", "grains"}:
            r = r + 0.35 * energy_shock + 0.65 * covid_shock
        else:
            r = r + 0.20 * energy_shock + 0.25 * covid_shock

        # Avoid pathological synthetic jumps while preserving stress regimes.
        r = np.clip(r, -0.12, 0.12)
        returns[name] = r
        prices[name] = start_price * np.exp(np.cumsum(r))
        groups.append({"asset": name, "group": group, "start_price": start_price})

    spin_frame = returns.copy()
    for name, _group, _start in COMMODITIES:
        spin_frame[name] = np.where(returns[name] > 0, 1, -1)

    prices.to_csv(OUT / "commodity_paper_aligned_prices.csv", index=False)
    returns.to_csv(OUT / "commodity_paper_aligned_returns.csv", index=False)
    spin_frame.to_csv(OUT / "commodity_paper_aligned_spins.csv", index=False)
    pd.DataFrame(groups).to_csv(OUT / "commodity_groups.csv", index=False)
    write_rolling_commodity_metrics(returns)


def generate_brand_application_data(seed: int = 3030) -> None:
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2024-01-01", "2024-12-31", freq="W-MON")
    segments = ["gen_z", "millennial", "family", "premium_seekers"]
    markets = ["ID"]
    target_pattern = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
    competitor_pattern = np.array([-1, -1, -1, -1, -1, 1, -1, -1, -1, 1])

    campaign_rows = []
    for i, date in enumerate(dates):
        pressure = 0.0
        if 12 <= i <= 22:
            pressure = 0.25 + 0.02 * (i - 12)
        elif 23 <= i <= 34:
            pressure = 0.48 - 0.012 * (i - 23)
        spend = round(20000 * pressure + rng.normal(1200, 250), 2) if pressure > 0 else round(rng.uniform(0, 500), 2)
        campaign_rows.append(
            {
                "date": date.date().isoformat(),
                "campaign_id": "C2024_MEMORY_FIELD" if pressure > 0 else "none",
                "channel": "mixed_video_social" if pressure > 0 else "none",
                "spend": max(0.0, spend),
                "campaign_pressure": round(float(pressure), 4),
            }
        )
    campaign = pd.DataFrame(campaign_rows)
    pressure_by_date = dict(zip(campaign["date"], campaign["campaign_pressure"]))

    rows = []
    respondent_id = 1
    segment_bias = {
        "gen_z": 0.10,
        "millennial": 0.00,
        "family": -0.05,
        "premium_seekers": 0.04,
    }
    for date in dates:
        date_key = date.date().isoformat()
        pressure = pressure_by_date[date_key]
        for segment in segments:
            for _ in range(18):
                base_memory = -0.20 + segment_bias[segment] + 1.35 * pressure + rng.normal(0, 0.55)
                competitor_pull = 0.15 - 0.85 * pressure + rng.normal(0, 0.45)

                latent = base_memory * target_pattern + competitor_pull * competitor_pattern + rng.normal(0, 0.75, len(FEATURES))
                probs = sigmoid(latent)
                binary = rng.binomial(1, probs)

                row = {
                    "respondent_id": f"R{respondent_id:05d}",
                    "date": date_key,
                    "market": markets[0],
                    "segment": segment,
                    "brand": "brand_a",
                    "ad_recall": binary[0],
                    "brand_link": binary[1],
                    "distinctive_asset": binary[2],
                    "trust": int(np.clip(round(1 + 4 * probs[3] + rng.normal(0, 0.4)), 1, 5)),
                    "value_for_money": int(np.clip(round(1 + 4 * probs[4] + rng.normal(0, 0.4)), 1, 5)),
                    "premium": int(np.clip(round(1 + 4 * probs[5] + rng.normal(0, 0.4)), 1, 5)),
                    "fun": int(np.clip(round(1 + 4 * probs[6] + rng.normal(0, 0.4)), 1, 5)),
                    "personal_relevance": int(np.clip(round(1 + 4 * probs[7] + rng.normal(0, 0.4)), 1, 5)),
                    "consideration": binary[8],
                    "competitor_salience": binary[9],
                }
                rows.append(row)
                respondent_id += 1

    tracker = pd.DataFrame(rows)
    patterns = pd.DataFrame(
        [
            {"pattern_name": "target_memory", **dict(zip(FEATURES, target_pattern.tolist()))},
            {"pattern_name": "competitor_memory", **dict(zip(FEATURES, competitor_pattern.tolist()))},
        ]
    )

    tracker.to_csv(OUT / "brand_tracker_v2_demo.csv", index=False)
    campaign.to_csv(OUT / "campaign_calendar_v2_demo.csv", index=False)
    patterns.to_csv(OUT / "target_memory_patterns_v2.csv", index=False)

    api_rows = tracker[FEATURES].head(600).to_dict(orient="records")
    (OUT / "live_couplings_request_example.json").write_text(
        json.dumps({"mode": "spin_glass", "scale": 0.55, "rows": api_rows}, indent=2),
        encoding="utf-8",
    )
    (OUT / "live_simulation_request_example.json").write_text(
        json.dumps(
            {
                "rows": api_rows,
                "target_pattern": target_pattern.tolist(),
                "competitor_pattern": competitor_pattern.tolist(),
                "spend_levels": [0.0, 0.22, 0.45],
                "memory_strength": 0.18,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def write_readme() -> None:
    (OUT / "README.md").write_text(
        """# V2 sample data

These files are generated by `backend/scripts/generate_v2_sample_data.py`.

## Paper-aligned commodity demo

Files:

- `commodity_paper_aligned_prices.csv`
- `commodity_paper_aligned_returns.csv`
- `commodity_paper_aligned_spins.csv`
- `commodity_groups.csv`
- `commodity_paper_aligned_rolling_metrics.csv`

These are synthetic commodity-like time series inspired by the 15-asset
commodity system described in the Entropy paper. They are designed for rolling
correlation, Ising, spin-glass, and mutual-information demos. They are not
downloaded market data and must not be cited as empirical prices.

Recommended default:

- window length: 90 business days
- step: 30 business days
- coupling modes: signed correlation, absolute correlation, mutual information

`commodity_paper_aligned_rolling_metrics.csv` is a QA target for the V2 live
dashboard: if the backend computes rolling metrics from the prices/returns
files, it should reproduce these values.

## Marketing application demo

Files:

- `brand_tracker_v2_demo.csv`
- `campaign_calendar_v2_demo.csv`
- `target_memory_patterns_v2.csv`
- `live_couplings_request_example.json`
- `live_simulation_request_example.json`

These are synthetic brand-tracker rows for testing live dashboard computation.
They are not evidence that the model predicts marketing outcomes.

The tracker contains the 10 required feature columns used by the current
backend kernel, plus respondent/date/segment metadata.

The JSON request examples can be POSTed directly to the optional FastAPI
sidecar endpoints `/couplings` and `/simulate` once the API dependencies are
installed.
""",
        encoding="utf-8",
    )


def main() -> None:
    generate_commodity_data()
    generate_brand_application_data()
    write_readme()
    print(f"wrote V2 sample data to {OUT}")


if __name__ == "__main__":
    main()
