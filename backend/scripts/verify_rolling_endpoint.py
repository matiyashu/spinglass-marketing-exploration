"""Smoke-test: /couplings/rolling reproduces the bundled QA CSV row-for-row."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from api.routes import couplings_rolling  # noqa: E402
from api.schemas import RollingCouplingRequest  # noqa: E402

SAMPLE = BACKEND / "sample_data"
RETURNS = pd.read_csv(SAMPLE / "commodity_paper_aligned_returns.csv")
QA = pd.read_csv(SAMPLE / "commodity_paper_aligned_rolling_metrics.csv")

asset_cols = [c for c in RETURNS.columns if c != "date"]
req = RollingCouplingRequest(
    rows=RETURNS.to_dict(orient="records"),
    asset_columns=asset_cols,
    date_column="date",
    window=90,
    step=30,
)
resp = couplings_rolling(req)
got = pd.DataFrame([r.model_dump() for r in resp.records])

print(f"endpoint returned {len(got)} windows; QA has {len(QA)} windows")
assert len(got) == len(QA), "row count mismatch"

cols = [
    "window_start", "window_end", "window_size", "step",
    "avg_signed_coupling", "avg_abs_coupling_ising", "avg_mutual_information",
    "largest_eigenvalue_signed", "largest_eigenvalue_ising", "negative_edge_share",
]
for c in cols:
    if got[c].dtype == object:
        match = (got[c].astype(str) == QA[c].astype(str)).all()
        print(f"  {c}: exact string match = {match}")
        assert match, f"{c} mismatch"
    else:
        diff = float(np.max(np.abs(got[c].to_numpy() - QA[c].to_numpy())))
        print(f"  {c}: max abs diff = {diff:.2e}")
        assert diff < 1e-9, f"{c} drift {diff}"

print("PASS — endpoint reproduces QA CSV within 1e-9")
