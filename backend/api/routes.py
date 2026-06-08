"""Thin HTTP wrappers around the kernel functions."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

BACKEND = Path(__file__).resolve().parents[1]
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

from .schemas import (  # noqa: E402
    CouplingRequest,
    CouplingResponse,
    PatternsOverlapRequest,
    PatternsOverlapResponse,
    ReportRequest,
    ReportResponse,
    RollingCouplingRequest,
    RollingCouplingResponse,
    RollingMetricRow,
    ScenarioRequest,
    ScenarioResponse,
    ScenarioRow,
    StaticCouplingRequest,
    StaticCouplingResponse,
    ValidateRequest,
    ValidateResponse,
    ValidationCheck,
)

router = APIRouter()


def rows_to_spins(rows: list[dict[str, float]]) -> np.ndarray:
    if not rows:
        raise HTTPException(status_code=400, detail="payload.rows is empty")
    missing = [f for f in FEATURES if f not in rows[0]]
    if missing:
        raise HTTPException(status_code=400, detail=f"missing required columns: {missing}")
    arr = np.array([[float(r[f]) for f in FEATURES] for r in rows], dtype=float)
    medians = np.median(arr, axis=0)
    is_binary = np.all((arr == 0) | (arr == 1), axis=0)
    cutoff = np.where(is_binary, 0.0, medians)
    return np.where(arr > cutoff, 1, -1).astype(int)


@router.post("/couplings", response_model=CouplingResponse)
def couplings(req: CouplingRequest) -> CouplingResponse:
    spins = rows_to_spins(req.rows)
    if req.mode == "mi":
        matrix = mi_couplings(spins, signed=True, scale=req.scale)
    else:
        matrix = corr_couplings(spins, mode=req.mode, scale=req.scale)
    return CouplingResponse(features=list(FEATURES), matrix=matrix.tolist(), mode=req.mode)


@router.post("/simulate", response_model=ScenarioResponse)
def simulate(req: ScenarioRequest) -> ScenarioResponse:
    if len(req.target_pattern) != len(FEATURES) or len(req.competitor_pattern) != len(FEATURES):
        raise HTTPException(status_code=400, detail=f"patterns must have length {len(FEATURES)}")
    spins = rows_to_spins(req.rows)
    j_sg = corr_couplings(spins, mode="spin_glass", scale=0.55)
    h0 = infer_mean_field_baseline(spins, j_sg, beta=1.0)
    target = np.asarray(req.target_pattern, dtype=int)
    competitor = np.asarray(req.competitor_pattern, dtype=int)
    j_campaign = j_sg + memory_couplings(target.reshape(1, -1), strength=req.memory_strength)
    rows: list[ScenarioRow] = []
    rng = np.random.default_rng(42)
    for spend in req.spend_levels:
        h = h0 + spend * target + rng.normal(0.0, 0.03, size=len(FEATURES))
        samples = glauber_sample(j_campaign, h, beta=1.0, seed=int(1000 * spend + 5))
        name = (
            "baseline" if spend == 0
            else "moderate_campaign" if spend < 0.35
            else "heavy_campaign"
        )
        result = summarize_scenario(name, samples, target, competitor, j_campaign)
        rows.append(ScenarioRow(
            name=result.name,
            spend=spend,
            target_overlap=result.target_overlap,
            competitor_overlap=result.competitor_overlap,
            mean_consideration=result.mean_consideration,
            purchase_probability=result.purchase_probability,
            frustration=result.frustration,
        ))
    return ScenarioResponse(scenarios=rows)


@router.post("/report", response_model=ReportResponse)
def report(_req: ReportRequest) -> ReportResponse:
    raise HTTPException(status_code=501, detail="PDF generation on uploaded data is not yet wired up")


# ----- V2 paper-aligned endpoints -----


def _mutual_information_matrix(values: np.ndarray, n_bins: int = 4) -> np.ndarray:
    bins = []
    for i in range(values.shape[1]):
        col = values[:, i]
        edges = np.unique(np.quantile(col, np.linspace(0.0, 1.0, n_bins + 1)))
        if len(edges) <= 2:
            bins.append((col > np.median(col)).astype(int))
        else:
            bins.append(np.digitize(col, edges[1:-1], right=True))
    binned = np.column_stack(bins)
    n = values.shape[1]
    out = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i + 1, n):
            joint = pd.crosstab(binned[:, i], binned[:, j], normalize=True).to_numpy()
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            expected = px @ py
            mask = joint > 0
            mi = float(np.sum(joint[mask] * np.log(joint[mask] / expected[mask])))
            out[i, j] = out[j, i] = mi
    return out


def _panel_to_frame(req_rows: list[dict[str, float | str]], asset_columns: list[str] | None, date_column: str) -> tuple[pd.DataFrame, list[str]]:
    if not req_rows:
        raise HTTPException(status_code=400, detail="payload.rows is empty")
    df = pd.DataFrame(req_rows)
    if asset_columns is None:
        asset_columns = [c for c in df.columns if c != date_column and pd.api.types.is_numeric_dtype(pd.to_numeric(df[c], errors="coerce"))]
    if not asset_columns:
        raise HTTPException(status_code=400, detail="no numeric asset columns detected")
    missing = [c for c in asset_columns if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"missing asset columns: {missing}")
    for c in asset_columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    if date_column in df.columns:
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df = df.sort_values(date_column).reset_index(drop=True)
    df = df.dropna(subset=asset_columns)
    return df, asset_columns


@router.post("/validate", response_model=ValidateResponse)
def validate(req: ValidateRequest) -> ValidateResponse:
    checks: list[ValidationCheck] = []
    if not req.rows:
        return ValidateResponse(
            row_count=0,
            columns=[],
            has_errors=True,
            checks=[ValidationCheck(id="empty", level="error", label="Payload is empty")],
        )
    df = pd.DataFrame(req.rows)
    columns = list(df.columns)

    if req.expected_columns:
        missing = [c for c in req.expected_columns if c not in columns]
        if missing:
            checks.append(ValidationCheck(id="schema", level="error", label=f"Missing required columns: {missing}"))
        else:
            checks.append(ValidationCheck(id="schema", level="ok", label="All required columns present"))

    if len(df) >= req.min_rows:
        checks.append(ValidationCheck(id="rows", level="ok", label=f"{len(df)} rows (>= {req.min_rows})"))
    else:
        checks.append(ValidationCheck(id="rows", level="error", label=f"{len(df)} rows (< {req.min_rows})"))

    if req.date_column in columns:
        dates = pd.to_datetime(df[req.date_column], errors="coerce")
        nans = int(dates.isna().sum())
        if nans:
            checks.append(ValidationCheck(id="dates", level="warning", label=f"{nans} unparseable dates"))
        else:
            checks.append(ValidationCheck(id="dates", level="ok", label="Dates parse cleanly"))

    numeric_cols = [c for c in columns if c != req.date_column]
    nan_share = float(df[numeric_cols].isna().mean().max()) if numeric_cols else 0.0
    if nan_share > 0.05:
        checks.append(
            ValidationCheck(id="nans", level="warning", label=f"Max column NaN rate is {nan_share*100:.1f} % (> 5 %)"),
        )
    else:
        checks.append(ValidationCheck(id="nans", level="ok", label="Missing-value rate below 5 % across columns"))

    has_errors = any(c.level == "error" for c in checks)
    return ValidateResponse(row_count=len(df), columns=columns, has_errors=has_errors, checks=checks)


@router.post("/couplings/static", response_model=StaticCouplingResponse)
def couplings_static(req: StaticCouplingRequest) -> StaticCouplingResponse:
    df, asset_cols = _panel_to_frame(req.rows, req.asset_columns, "date")
    x = df[asset_cols].to_numpy(dtype=float)
    if req.mode == "mi":
        matrix = _mutual_information_matrix(x)
    else:
        corr = np.corrcoef(x, rowvar=False)
        corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
        np.fill_diagonal(corr, 0.0)
        matrix = np.abs(corr) if req.mode == "ising" else corr
    return StaticCouplingResponse(asset_columns=asset_cols, matrix=matrix.tolist(), mode=req.mode)


@router.post("/couplings/rolling", response_model=RollingCouplingResponse)
def couplings_rolling(req: RollingCouplingRequest) -> RollingCouplingResponse:
    df, asset_cols = _panel_to_frame(req.rows, req.asset_columns, req.date_column)
    if len(df) < req.window:
        raise HTTPException(status_code=400, detail=f"need at least {req.window} rows; got {len(df)}")
    records: list[RollingMetricRow] = []
    for start in range(0, len(df) - req.window + 1, req.step):
        frame = df.iloc[start:start + req.window]
        x = frame[asset_cols].to_numpy(dtype=float)
        corr = np.corrcoef(x, rowvar=False)
        corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
        np.fill_diagonal(corr, 0.0)
        ising = np.abs(corr)
        mi = _mutual_information_matrix(x)
        upper = np.triu_indices_from(corr, k=1)
        records.append(
            RollingMetricRow(
                window_start=str(frame[req.date_column].iloc[0].date()) if req.date_column in frame.columns else str(start),
                window_end=str(frame[req.date_column].iloc[-1].date()) if req.date_column in frame.columns else str(start + req.window - 1),
                window_size=req.window,
                step=req.step,
                avg_signed_coupling=float(corr[upper].mean()),
                avg_abs_coupling_ising=float(ising[upper].mean()),
                avg_mutual_information=float(mi[upper].mean()),
                largest_eigenvalue_signed=float(np.linalg.eigvalsh(corr).max()),
                largest_eigenvalue_ising=float(np.linalg.eigvalsh(ising).max()),
                negative_edge_share=float(np.mean(corr[upper] < 0)),
            )
        )
    return RollingCouplingResponse(asset_columns=asset_cols, records=records)


@router.post("/patterns/overlap", response_model=PatternsOverlapResponse)
def patterns_overlap(req: PatternsOverlapRequest) -> PatternsOverlapResponse:
    spins = np.asarray(req.spins, dtype=int)
    if spins.ndim != 2:
        raise HTTPException(status_code=400, detail="spins must be a 2-D array")
    n_samples, n_features = spins.shape
    target = np.asarray(req.target_pattern, dtype=int)
    competitor = np.asarray(req.competitor_pattern, dtype=int)
    if target.shape != (n_features,) or competitor.shape != (n_features,):
        raise HTTPException(
            status_code=400,
            detail=f"pattern length must equal spin width ({n_features})",
        )
    target_overlap = float((spins @ target).mean() / n_features)
    competitor_overlap = float((spins @ competitor).mean() / n_features)
    target_share = float(np.mean((spins @ target) > 0))
    competitor_share = float(np.mean((spins @ competitor) > 0))
    return PatternsOverlapResponse(
        target_overlap=target_overlap,
        competitor_overlap=competitor_overlap,
        target_share=target_share,
        competitor_share=competitor_share,
        samples=n_samples,
    )
