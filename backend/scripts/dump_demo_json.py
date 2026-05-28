"""
Dump demo JSON + sample CSV for the frontend.

Runs the kernel against a seeded synthetic panel and writes:
  frontend/public/demo/couplings_spinglass.json
  frontend/public/demo/couplings_ising.json
  frontend/public/demo/couplings_mi.json
  frontend/public/demo/scenarios.json
  frontend/public/demo/memory.json
  frontend/public/demo/pulse.json
  frontend/public/demo/hysteresis.json
  frontend/public/demo/landscape.json
  frontend/public/demo/sample.csv

Synthetic pulse/hysteresis/landscape curves mirror the shapes used by the PDF
report generator (the kernel itself does not produce time series).
"""
from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from brand_ising_spin_glass import (  # noqa: E402
    FEATURES,
    corr_couplings,
    glauber_sample,
    infer_mean_field_baseline,
    memory_couplings,
    mi_couplings,
    summarize_scenario,
)

OUT = ROOT / "frontend" / "public" / "demo"
OUT.mkdir(parents=True, exist_ok=True)


def round_matrix(matrix: np.ndarray, places: int = 4) -> list[list[float]]:
    return [[round(float(x), places) for x in row] for row in matrix]


def build_synthetic_panel() -> np.ndarray:
    target_pattern = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
    competitor_pattern = np.array([-1, -1, -1, -1, -1, 1, -1, -1, -1, 1])
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
    return glauber_sample(j_true, baseline_h, beta=0.70, n_steps=160_000, burn_in=20_000, sample_every=40, seed=11)


def dump_couplings(panel: np.ndarray) -> dict[str, np.ndarray]:
    j_sg = corr_couplings(panel, mode="spin_glass", scale=0.55)
    j_is = corr_couplings(panel, mode="ising", scale=0.55)
    j_mi = mi_couplings(panel, signed=True, scale=0.55)
    for name, matrix in [("spinglass", j_sg), ("ising", j_is), ("mi", j_mi)]:
        payload = {"features": FEATURES, "matrix": round_matrix(matrix), "mode": name}
        (OUT / f"couplings_{name}.json").write_text(json.dumps(payload, indent=2))
    return {"spin_glass": j_sg, "ising": j_is, "mi": j_mi}


def dump_scenarios_and_memory(panel: np.ndarray, j_sg: np.ndarray) -> None:
    rng = np.random.default_rng(42)
    target_pattern = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
    competitor_pattern = np.array([-1, -1, -1, -1, -1, 1, -1, -1, -1, 1])
    h0 = infer_mean_field_baseline(panel, j_sg, beta=1.0)
    j_campaign = j_sg + memory_couplings(target_pattern.reshape(1, -1), strength=0.18)

    rows = []
    for name, spend in [("baseline", 0.00), ("moderate_campaign", 0.22), ("heavy_campaign", 0.45)]:
        h = h0 + spend * target_pattern + rng.normal(0.0, 0.03, size=len(FEATURES))
        samples = glauber_sample(j_campaign, h, beta=1.0, seed=int(1000 * spend + 5))
        result = summarize_scenario(name, samples, target_pattern, competitor_pattern, j_campaign)
        rows.append(
            {
                "name": result.name,
                "spend": round(spend, 2),
                "target_overlap": round(result.target_overlap, 4),
                "competitor_overlap": round(result.competitor_overlap, 4),
                "mean_consideration": round(result.mean_consideration, 4),
                "purchase_probability": round(result.purchase_probability, 4),
                "frustration": round(result.frustration, 4),
            }
        )
    (OUT / "scenarios.json").write_text(json.dumps({"scenarios": rows}, indent=2))

    (OUT / "memory.json").write_text(
        json.dumps(
            {
                "features": FEATURES,
                "target_pattern": target_pattern.tolist(),
                "competitor_pattern": competitor_pattern.tolist(),
                "scenarios": [
                    {"name": r["name"], "target_overlap": r["target_overlap"], "competitor_overlap": r["competitor_overlap"]}
                    for r in rows
                ],
            },
            indent=2,
        )
    )


def dump_pulse() -> None:
    t = list(range(0, 61))
    short, longterm, pulse = [], [], []
    for ti in t:
        pulse.append(0.05 + (0.9 if 8 <= ti <= 18 else 0.0))
        if ti < 8:
            short.append(0.05); longterm.append(0.05)
        elif ti <= 18:
            short.append(0.05 + 0.75 * (1 - math.exp(-(ti - 8) / 2.2)))
            longterm.append(0.05 + 0.55 * (1 - math.exp(-(ti - 8) / 5.0)))
        else:
            short.append(0.05 + 0.75 * math.exp(-(ti - 18) / 5.0))
            longterm.append(0.25 + 0.35 * math.exp(-(ti - 18) / 28.0))
    points = [
        {"t": ti, "campaign": round(p, 4), "shortterm": round(s, 4), "longterm": round(l, 4)}
        for ti, p, s, l in zip(t, pulse, short, longterm)
    ]
    (OUT / "pulse.json").write_text(json.dumps({"points": points}, indent=2))


def dump_hysteresis() -> None:
    hvals = list(np.linspace(-1.0, 1.0, 60))
    points = [
        {
            "h": round(h, 4),
            "increasing": round(float(np.tanh(3.2 * (h - 0.23))), 4),
            "decreasing": round(float(np.tanh(3.2 * (h + 0.23))), 4),
        }
        for h in hvals
    ]
    (OUT / "hysteresis.json").write_text(json.dumps({"points": points}, indent=2))


def dump_landscape() -> None:
    x = list(np.linspace(-1.0, 1.0, 80))
    def baseline(v): return 1.4 * (v + 0.15) ** 4 - 1.0 * (v + 0.15) ** 2 + 0.10 * v + 0.25
    def campaign(v): return baseline(v) - 0.55 * v
    def memory(v): return 1.35 * (v - 0.38) ** 4 - 1.03 * (v - 0.38) ** 2 - 0.22 * v + 0.05
    points = [
        {
            "m": round(v, 4),
            "baseline": round(baseline(v), 4),
            "campaign": round(campaign(v), 4),
            "memory": round(memory(v), 4),
        }
        for v in x
    ]
    (OUT / "landscape.json").write_text(json.dumps({"points": points}, indent=2))


def dump_sample_csv(panel: np.ndarray) -> None:
    sample = panel[:60].copy()
    binary = ((sample + 1) // 2).astype(int)
    target_path = OUT / "sample.csv"
    with target_path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(FEATURES)
        for row in binary:
            w.writerow(row.tolist())


def main() -> None:
    panel = build_synthetic_panel()
    couplings = dump_couplings(panel)
    dump_scenarios_and_memory(panel, couplings["spin_glass"])
    dump_pulse()
    dump_hysteresis()
    dump_landscape()
    dump_sample_csv(panel)
    print(f"wrote demo JSON + sample CSV to {OUT}")


if __name__ == "__main__":
    main()
