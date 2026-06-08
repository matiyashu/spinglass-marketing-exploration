"""Publish V2 demo artifacts to the Next.js public/demo/v2 tree.

Reads the CSV outputs from generate_v2_sample_data.py and emits the JSON the
commodity and brand dashboards consume in demo mode.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "sample_data"
DEST = ROOT.parent / "frontend" / "public" / "demo" / "v2"
COMMODITY = DEST / "commodity"
BRAND = DEST / "brand"

ASSETS = [
    "gold", "silver", "platinum", "palladium", "copper",
    "wti_crude", "brent_crude", "natural_gas", "heating_oil",
    "wheat", "corn", "soybeans", "coffee", "sugar", "cotton",
]


def _coupling_snapshot(returns_window: pd.DataFrame) -> dict:
    x = returns_window[ASSETS].to_numpy(dtype=float)
    corr = np.corrcoef(x, rowvar=False)
    corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
    np.fill_diagonal(corr, 0.0)
    ising = np.abs(corr)
    # Bin-based MI for the snapshot
    n = x.shape[1]
    mi = np.zeros((n, n))
    n_bins = 4
    bins = []
    for i in range(n):
        col = x[:, i]
        edges = np.unique(np.quantile(col, np.linspace(0.0, 1.0, n_bins + 1)))
        if len(edges) <= 2:
            bins.append((col > np.median(col)).astype(int))
        else:
            bins.append(np.digitize(col, edges[1:-1], right=True))
    binned = np.column_stack(bins)
    for i in range(n):
        for j in range(i + 1, n):
            joint = pd.crosstab(binned[:, i], binned[:, j], normalize=True).to_numpy()
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            expected = px @ py
            mask = joint > 0
            m = float(np.sum(joint[mask] * np.log(joint[mask] / expected[mask])))
            mi[i, j] = mi[j, i] = m
    return {"spinglass": corr.tolist(), "ising": ising.tolist(), "mi": mi.tolist()}


def write_commodity() -> None:
    COMMODITY.mkdir(parents=True, exist_ok=True)
    returns = pd.read_csv(SRC / "commodity_paper_aligned_returns.csv", parse_dates=["date"])
    groups = pd.read_csv(SRC / "commodity_groups.csv")
    rolling = pd.read_csv(SRC / "commodity_paper_aligned_rolling_metrics.csv")

    # Three reference windows
    window = 90
    covid_anchor = pd.Timestamp("2020-03-16")
    energy_anchor = pd.Timestamp("2022-03-01")
    last_idx = len(returns) - 1

    def window_for(anchor: pd.Timestamp) -> pd.DataFrame:
        idx = int(np.argmin(np.abs(returns["date"] - anchor)))
        start = max(0, idx - window // 2)
        stop = min(len(returns), start + window)
        return returns.iloc[start:stop]

    snapshots = {
        "latest": _coupling_snapshot(returns.iloc[max(0, last_idx - window + 1):last_idx + 1]),
        "covid_stress": _coupling_snapshot(window_for(covid_anchor)),
        "energy_stress": _coupling_snapshot(window_for(energy_anchor)),
    }
    for key, payload in snapshots.items():
        payload["assets"] = ASSETS
        payload["window_size"] = window
        (COMMODITY / f"couplings_{key}.json").write_text(json.dumps(payload), encoding="utf-8")

    (COMMODITY / "rolling_metrics.json").write_text(
        json.dumps({"records": rolling.to_dict(orient="records")}, indent=None),
        encoding="utf-8",
    )
    (COMMODITY / "groups.json").write_text(
        json.dumps({"records": groups.to_dict(orient="records")}, indent=None),
        encoding="utf-8",
    )
    sample_returns = returns.tail(260).copy()
    sample_returns["date"] = sample_returns["date"].dt.strftime("%Y-%m-%d")
    (COMMODITY / "returns_recent.json").write_text(
        json.dumps({"records": sample_returns.to_dict(orient="records")}, indent=None),
        encoding="utf-8",
    )


def write_brand() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    tracker = pd.read_csv(SRC / "brand_tracker_v2_demo.csv")
    campaign = pd.read_csv(SRC / "campaign_calendar_v2_demo.csv")
    patterns = pd.read_csv(SRC / "target_memory_patterns_v2.csv")

    (BRAND / "tracker_sample.csv").write_text(
        tracker.head(72).to_csv(index=False), encoding="utf-8"
    )
    (BRAND / "campaign_calendar.json").write_text(
        json.dumps({"records": campaign.to_dict(orient="records")}, indent=None),
        encoding="utf-8",
    )
    (BRAND / "patterns.json").write_text(
        json.dumps({"records": patterns.to_dict(orient="records")}, indent=None),
        encoding="utf-8",
    )


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    write_commodity()
    write_brand()
    print(f"wrote V2 frontend demo to {DEST}")


if __name__ == "__main__":
    main()
