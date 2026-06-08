"""Smoke-test the remaining three V2 endpoints in-process."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from api.routes import couplings_static, patterns_overlap, validate  # noqa: E402
from api.schemas import (  # noqa: E402
    PatternsOverlapRequest,
    StaticCouplingRequest,
    ValidateRequest,
)

SAMPLE = BACKEND / "sample_data"

# --- /couplings/static ---
returns = pd.read_csv(SAMPLE / "commodity_paper_aligned_returns.csv")
assets = [c for c in returns.columns if c != "date"]
for mode in ("spin_glass", "ising", "mi"):
    resp = couplings_static(
        StaticCouplingRequest(rows=returns.to_dict(orient="records"), asset_columns=assets, mode=mode)
    )
    mat = np.asarray(resp.matrix)
    assert mat.shape == (15, 15), f"{mode}: bad shape {mat.shape}"
    assert np.allclose(np.diag(mat), 0.0), f"{mode}: diagonal not zero"
    assert np.allclose(mat, mat.T), f"{mode}: not symmetric"
    print(f"  /couplings/static mode={mode}: 15x15, sym, zero-diag OK; off-diag mean = {mat[np.triu_indices(15, k=1)].mean():.3f}")

# --- /validate (happy path on returns CSV) ---
v = validate(
    ValidateRequest(
        rows=returns.head(120).to_dict(orient="records"),
        expected_columns=assets,
        date_column="date",
        min_rows=50,
    )
)
print(f"  /validate happy: rows={v.row_count}, has_errors={v.has_errors}, checks={[(c.id, c.level) for c in v.checks]}")
assert not v.has_errors

# --- /validate (missing column) ---
bad = returns.head(120).drop(columns=["gold"]).to_dict(orient="records")
v_bad = validate(ValidateRequest(rows=bad, expected_columns=assets, date_column="date", min_rows=50))
print(f"  /validate missing-col: has_errors={v_bad.has_errors}, schema check = {next(c for c in v_bad.checks if c.id == 'schema').label!r}")
assert v_bad.has_errors

# --- /validate (too few rows) ---
v_short = validate(ValidateRequest(rows=returns.head(20).to_dict(orient="records"), expected_columns=assets, min_rows=50))
print(f"  /validate short: has_errors={v_short.has_errors}")
assert v_short.has_errors

# --- /patterns/overlap ---
spins_df = pd.read_csv(SAMPLE / "commodity_paper_aligned_spins.csv")
spin_cols = [c for c in spins_df.columns if c != "date"]
spins = spins_df[spin_cols].to_numpy(dtype=int).tolist()
k = len(spin_cols)
target = [1] * k
competitor = [-1 if i % 2 == 0 else 1 for i in range(k)]
po = patterns_overlap(PatternsOverlapRequest(spins=spins, target_pattern=target, competitor_pattern=competitor))
print(
    f"  /patterns/overlap: samples={po.samples}, "
    f"target_overlap={po.target_overlap:.3f}, competitor_overlap={po.competitor_overlap:.3f}, "
    f"target_share={po.target_share:.3f}, competitor_share={po.competitor_share:.3f}"
)
assert po.samples == len(spins)
assert -1.0 <= po.target_overlap <= 1.0
assert -1.0 <= po.competitor_overlap <= 1.0

print("PASS - all V2 endpoints respond correctly")
