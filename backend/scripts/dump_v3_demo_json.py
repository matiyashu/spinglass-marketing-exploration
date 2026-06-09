"""Publish V3 demo artifacts to the Next.js frontend.

Reads backend/sample_data/v3_marketing/*.csv and writes
frontend/public/demo/v3/*.json using marketing_kernel — the same compute the
FastAPI backend runs in Live mode, so demo and live agree by construction.

Precomputed context slices: per-brand and per-(brand, segment). Finer filters
(product / market) fall back to the brand slice in the frontend loader.

Run (after generate_v3_marketing_data.py):
    python backend/scripts/dump_v3_demo_json.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from brand_ising_spin_glass import FEATURES  # noqa: E402
import marketing_kernel as mk  # noqa: E402

SAMPLE = BACKEND / "sample_data" / "v3_marketing"
OUT = BACKEND.parents[0] / "frontend" / "public" / "demo" / "v3"

BRAND_TARGET = np.array([1, 1, 1, 1, 1, 1, 1, 1, 1, -1])
COMPETITOR = np.array([-1, -1, -1, -1, -1, -1, -1, -1, -1, 1])


def _write(rel: str, obj) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2))


def coupling_payload(df: pd.DataFrame) -> dict:
    spins = mk.tracker_spins(df)
    sg = mk.coupling_matrix(spins, "spin_glass")
    ising = mk.coupling_matrix(spins, "ising")
    mi = mk.coupling_matrix(spins, "mi")
    summary = mk.static_summary(df)
    return {
        "features": FEATURES,
        "labels": [mk.FEATURE_LABEL[f] for f in FEATURES],
        "groups": [mk.FEATURE_GROUP[f] for f in FEATURES],
        "spin_glass": sg.tolist(),
        "ising": ising.tolist(),
        "mi": mi.tolist(),
        "top": mk.top_couplings(sg),
        "triads": mk.triad_frustration(sg),
        "rigidity_proxy": mk.rigidity_proxy(spins),
        "summary": summary,
    }


def main() -> None:
    tracker = pd.read_csv(SAMPLE / "brand_tracker_panel.csv")
    creative = pd.read_csv(SAMPLE / "creative_memory_map.csv")
    outcomes = pd.read_csv(SAMPLE / "outcomes_partial.csv")
    dimensions = json.loads((SAMPLE / "dimensions.json").read_text())

    brands = [b["id"] for b in dimensions["brands"]]
    segments = [s["id"] for s in dimensions["segments"]]

    _write("dimensions.json", dimensions)

    # Method status: the demo bundle ships every table.
    tables = {"tracker", "campaigns", "creative_map", "outcomes", "competitor"}
    _write("method_status.json", {"tables_present": sorted(tables), "methods": mk.method_status(tables)})

    # Portfolio summary (per-brand coherence ranking).
    portfolio = []
    for b in brands:
        sub = mk.filter_context(tracker, {"brand_id": b})
        s = mk.static_summary(sub)
        portfolio.append({"brand_id": b, "rigidity_proxy": mk.rigidity_proxy(mk.tracker_spins(sub)), **s})
    _write("portfolio.json", {"brands": portfolio})

    # Couplings: per brand and per (brand, segment).
    for b in brands:
        _write(f"couplings/{b}.json", coupling_payload(mk.filter_context(tracker, {"brand_id": b})))
        for seg in segments:
            sub = mk.filter_context(tracker, {"brand_id": b, "segment": seg})
            if sub.shape[0] >= 50:
                _write(f"couplings/{b}__{seg}.json", coupling_payload(sub))

    # Rolling regime: per brand.
    for b in brands:
        roll = mk.rolling_couplings(mk.filter_context(tracker, {"brand_id": b}), window=6, step=1)
        _write(f"rolling/{b}.json", {"brand_id": b, "records": roll})

    # Segment overlap + per-segment summary.
    for b in brands:
        sub = mk.filter_context(tracker, {"brand_id": b})
        overlap = mk.segment_overlap_matrix(sub, segments)
        per_seg = []
        for seg in segments:
            ss = mk.filter_context(sub, {"segment": seg})
            per_seg.append({"segment": seg, "rigidity_proxy": mk.rigidity_proxy(mk.tracker_spins(ss)),
                            **mk.static_summary(ss)})
        _write(f"segments/{b}.json", {"brand_id": b, "overlap": overlap, "per_segment": per_seg})

    # Verticals: per-product memory fit + leakage within each brand.
    for b in brands:
        products = [p for p in dimensions["products"] if p["brand_id"] == b]
        per_product = []
        for p in products:
            sub = mk.filter_context(tracker, {"brand_id": b, "product_id": p["id"]})
            leak = mk.competitive_leakage(sub, COMPETITOR)
            per_product.append({
                "product_id": p["id"], "label": p["label"], "vertical_id": p["vertical_id"],
                "price_tier": p.get("price_tier"),
                "rigidity_proxy": mk.rigidity_proxy(mk.tracker_spins(sub)),
                "competitor_overlap": leak["competitor_overlap"],
                **mk.static_summary(sub),
            })
        _write(f"verticals/{b}.json", {"brand_id": b, "per_product": per_product})

    # Competitive leakage over waves (overlap with competitor pattern by wave).
    for b in brands:
        sub = mk.filter_context(tracker, {"brand_id": b})
        waves = sorted(sub["date"].unique())
        series = []
        for w in waves:
            leak = mk.competitive_leakage(sub[sub["date"] == w], COMPETITOR)
            series.append({"date": w, **leak})
        _write(f"leakage/{b}.json", {"brand_id": b, "series": series})

    # Replicas: landscape (fixed J,h,beta) + estimation-stability (bootstrap).
    for b in brands:
        spins = mk.tracker_spins(mk.filter_context(tracker, {"brand_id": b}))
        from brand_ising_spin_glass import corr_couplings, infer_mean_field_baseline
        j = corr_couplings(spins, mode="spin_glass", scale=0.55)
        h = infer_mean_field_baseline(spins, j, beta=1.0)
        _write(f"replicas/{b}.json", {
            "brand_id": b,
            "landscape": mk.landscape_replicas(j, h, beta=1.0, n_chains=12),
            "estimation": mk.bootstrap_replicas(spins, n_replicas=24),
            "rigidity_proxy": mk.rigidity_proxy(spins),
        })

    # Stability: campaign-sensitivity (susceptibility) per brand.
    for b in brands:
        spins = mk.tracker_spins(mk.filter_context(tracker, {"brand_id": b}))
        _write(f"stability/{b}.json", {"brand_id": b, "susceptibility": mk.susceptibility(spins)})

    # Campaigns: creative target, field response (pre/during/post), simulation, validation.
    for camp in dimensions["campaigns"]:
        cid = camp["id"]
        creative_id = camp["creative_id"]
        cmap = creative[creative["creative_id"] == creative_id]
        target = np.zeros(len(FEATURES))
        for _, row in cmap.iterrows():
            target[FEATURES.index(row["feature_name"])] = row["target_spin"] * row["intended_strength"]
        target_sign = np.sign(target).astype(int)
        target_sign[target_sign == 0] = 1  # padded vector used only by the simulation
        # Overlap is scored ONLY on the features the creative actually targets, so
        # untouched (and competitor) associations don't dilute the campaign signal.
        targeted = np.flatnonzero(target)
        tvec = np.sign(target[targeted])

        # Measure the campaign on the audience it actually targeted (its market +
        # segment), where the pressure field is strongest — not diluted across all.
        prod_ctx = {
            "brand_id": camp["brand_id"], "product_id": camp["product_id"],
            "market": camp.get("market"), "segment": camp.get("segment"),
        }
        sub = mk.filter_context(tracker, prod_ctx)
        start, end = camp["start_date"], camp["end_date"]
        phase_overlap = {}
        phase_means = {}
        for label, mask in {
            "pre": sub["date"] < start,
            "during": (sub["date"] >= start) & (sub["date"] <= end),
            "post": sub["date"] > end,
        }.items():
            frame = sub[mask]
            if frame.shape[0]:
                sp = mk.tracker_spins(frame)
                phase_overlap[label] = float((sp[:, targeted] @ tvec / len(targeted)).mean())
                phase_means[label] = sp.mean(axis=0).tolist()
            else:
                phase_overlap[label] = None
                phase_means[label] = None

        brand_spins = mk.tracker_spins(mk.filter_context(tracker, {"brand_id": camp["brand_id"]}))
        sim = mk.simulate_campaign(brand_spins, target_sign, COMPETITOR, spend_levels=[0.0, 0.22, 0.45])

        payload = {
            "campaign": camp,
            "creative_map": cmap.to_dict(orient="records"),
            "target_vector": target.tolist(),
            "phase_overlap": phase_overlap,
            "phase_means": phase_means,
            "features": FEATURES,
            "simulation": sim,
            "has_outcomes": bool(camp["has_outcomes"]),
        }
        if camp["has_outcomes"]:
            co = outcomes[outcomes["campaign_id"] == cid]
            payload["outcomes"] = co[["date", "brand_lift", "roas", "cpa", "conversions"]].to_dict(orient="records")
        _write(f"campaigns/{cid}.json", payload)

    n_files = sum(1 for _ in OUT.rglob("*.json"))
    print(f"wrote {n_files} demo JSON files  ->  {OUT}")


if __name__ == "__main__":
    main()
