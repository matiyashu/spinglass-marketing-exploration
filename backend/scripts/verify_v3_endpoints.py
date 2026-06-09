"""Verify V3: endpoints reproduce the bundled demo JSON and expected_outputs.

Because the generator, the demo-JSON dump, and the FastAPI endpoints all compute
through marketing_kernel, they must agree to machine precision. This asserts it.

Run:  python backend/scripts/verify_v3_endpoints.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "api"))

from api.routes import (  # noqa: E402
    data_status, marketing_couplings_static, marketing_couplings_rolling,
    verticals_segment_differences, replicas_bootstrap, campaigns_simulate, stability_susceptibility,
)
from api.schemas import MarketingRequest, MarketingContextModel, DataStatusRequest, CampaignSimRequest  # noqa: E402

EXP = BACKEND / "sample_data" / "v3_marketing" / "expected_outputs"
DEMO = BACKEND.parents[0] / "frontend" / "public" / "demo" / "v3"


def _maxdiff(a, b) -> float:
    return float(np.max(np.abs(np.asarray(a, dtype=float) - np.asarray(b, dtype=float))))


def main() -> None:
    ctx = MarketingContextModel(brand_id="brand_a")

    # 1. couplings/static reproduces the demo bundle couplings/brand_a.json.
    ep = marketing_couplings_static(MarketingRequest(context=ctx, use_sample=True))
    bundle = json.loads((DEMO / "couplings" / "brand_a.json").read_text())
    d = _maxdiff(ep["spin_glass"], bundle["spin_glass"])
    print(f"couplings/static vs demo bundle: max|d| = {d:.2e}")
    assert d < 1e-9, "endpoint and demo bundle disagree"

    # 2. couplings/rolling reproduces expected_outputs/rolling_couplings.csv.
    rl = marketing_couplings_rolling(MarketingRequest(context=ctx, use_sample=True, window=6, step=1))
    got = pd.DataFrame(rl["records"])
    exp = pd.read_csv(EXP / "rolling_couplings.csv")
    assert len(got) == len(exp), f"rolling row mismatch {len(got)} vs {len(exp)}"
    for col in ["avg_signed_coupling", "largest_eigenvalue_signed", "negative_edge_share", "avg_mutual_information"]:
        d = _maxdiff(got[col], exp[col])
        print(f"  rolling {col}: max|d| = {d:.2e}")
        assert d < 1e-9, f"{col} drift"

    # 3. brand_memory_summary reproduction.
    summ = ep["summary"]
    exp_summ = pd.read_csv(EXP / "brand_memory_summary.csv").set_index("brand_id").loc["brand_a"]
    d = abs(summ["largest_eigenvalue_signed"] - exp_summ["largest_eigenvalue_signed"])
    print(f"brand_memory_summary lambda_max: |d| = {d:.2e}")
    assert d < 1e-9

    # 4. Smoke the rest.
    ds = data_status(DataStatusRequest(use_sample=True))
    assert any(m["method"] == "outcome_validation" for m in ds["methods"])
    sd = verticals_segment_differences(MarketingRequest(context=ctx, use_sample=True))
    assert len(sd["per_segment"]) == 4
    bs = replicas_bootstrap(MarketingRequest(context=ctx, use_sample=True))
    assert -1.0 <= bs["estimation"]["mean"] <= 1.0
    sim = campaigns_simulate(CampaignSimRequest(context=ctx, use_sample=True))
    assert len(sim["simulation"]) == 3
    su = stability_susceptibility(MarketingRequest(context=ctx, use_sample=True))
    assert len(su["susceptibility"]) == 10
    print("smoke: data/status, segment-diff, replicas, simulate, susceptibility OK")

    print("PASS - V3 endpoints reproduce demo bundle + expected_outputs")


if __name__ == "__main__":
    main()
