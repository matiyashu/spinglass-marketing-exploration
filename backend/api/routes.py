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
    CampaignSimRequest,
    CouplingRequest,
    CouplingResponse,
    DataStatusRequest,
    MarketingRequest,
    MarketingValidateRequest,
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

import marketing_kernel as mk  # noqa: E402

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


# ----- V3 marketing endpoints (compute via marketing_kernel) -----

_SAMPLE_DIR = BACKEND / "sample_data" / "v3_marketing"
_BRAND_TARGET = np.array([1, 1, 1, 1, 1, 1, 1, 1, 1, -1])
_COMPETITOR = np.array([-1, -1, -1, -1, -1, -1, -1, -1, -1, 1])
_tracker_cache: pd.DataFrame | None = None


def _sample_tracker() -> pd.DataFrame:
    global _tracker_cache
    if _tracker_cache is None:
        path = _SAMPLE_DIR / "brand_tracker_panel.csv"
        if not path.exists():
            raise HTTPException(status_code=503, detail="v3 marketing sample not generated; run generate_v3_marketing_data.py")
        _tracker_cache = pd.read_csv(path)
    return _tracker_cache


def _resolve_tracker(req: MarketingRequest) -> pd.DataFrame:
    if req.rows:
        df = pd.DataFrame(req.rows)
    elif req.use_sample:
        df = _sample_tracker()
    else:
        raise HTTPException(status_code=400, detail="supply rows or set use_sample=true")
    ctx = req.context.model_dump() if req.context else None
    return mk.filter_context(df, ctx)


@router.post("/data/status")
def data_status(req: DataStatusRequest) -> dict:
    if req.tables_present is not None:
        tables = set(req.tables_present)
    elif req.use_sample:
        tables = {"tracker", "campaigns", "creative_map", "outcomes", "competitor"}
    else:
        tables = set()
    return {"tables_present": sorted(tables), "methods": mk.method_status(tables)}


@router.post("/data/validate")
def data_validate(req: MarketingValidateRequest) -> dict:
    if not req.rows:
        return {"row_count": 0, "has_errors": True, "checks": [{"id": "empty", "level": "error", "label": "Payload is empty"}]}
    df = pd.DataFrame(req.rows)
    checks = []
    missing = [f for f in mk.FEATURES if f not in df.columns]
    checks.append(
        {"id": "features", "level": "error" if missing else "ok",
         "label": f"Missing feature columns: {missing}" if missing else "All 10 canonical features present"}
    )
    has_ctx = any(c in df.columns for c in ("brand_id", "date"))
    checks.append({"id": "context", "level": "ok" if has_ctx else "warning",
                   "label": "Context columns present" if has_ctx else "No brand_id/date columns — context filtering disabled"})
    checks.append({"id": "rows", "level": "ok" if len(df) >= req.min_rows else "error",
                   "label": f"{len(df)} rows ({'>=' if len(df) >= req.min_rows else '<'} {req.min_rows})"})
    has_errors = any(c["level"] == "error" for c in checks)
    return {"row_count": len(df), "has_errors": has_errors, "checks": checks}


def _coupling_payload(df: pd.DataFrame) -> dict:
    spins = mk.tracker_spins(df)
    sg = mk.coupling_matrix(spins, "spin_glass")
    return {
        "features": FEATURES,
        "labels": [mk.FEATURE_LABEL[f] for f in FEATURES],
        "groups": [mk.FEATURE_GROUP[f] for f in FEATURES],
        "spin_glass": sg.tolist(),
        "ising": mk.coupling_matrix(spins, "ising").tolist(),
        "mi": mk.coupling_matrix(spins, "mi").tolist(),
        "top": mk.top_couplings(sg),
        "triads": mk.triad_frustration(sg),
        "rigidity_proxy": mk.rigidity_proxy(spins),
        "summary": mk.static_summary(df),
    }


@router.post("/marketing/couplings/static")
def marketing_couplings_static(req: MarketingRequest) -> dict:
    return _coupling_payload(_resolve_tracker(req))


@router.post("/marketing/couplings/rolling")
def marketing_couplings_rolling(req: MarketingRequest) -> dict:
    df = _resolve_tracker(req)
    brand = req.context.brand_id if req.context else None
    return {"brand_id": brand, "records": mk.rolling_couplings(df, window=req.window, step=req.step)}


@router.post("/marketing/couplings/compare-estimators")
def marketing_compare_estimators(req: MarketingRequest) -> dict:
    spins = mk.tracker_spins(_resolve_tracker(req))
    sg = mk.coupling_matrix(spins, "spin_glass")
    mi = mk.coupling_matrix(spins, "mi")
    return {"features": FEATURES, "spin_glass": mk.top_couplings(sg), "mi": mk.top_couplings(mi)}


@router.post("/patterns/competitive-leakage")
def patterns_competitive_leakage(req: MarketingRequest) -> dict:
    df = _resolve_tracker(req)
    waves = sorted(df["date"].unique()) if "date" in df.columns else []
    series = [{"date": str(w), **mk.competitive_leakage(df[df["date"] == w], _COMPETITOR)} for w in waves]
    return {"series": series, "overall": mk.competitive_leakage(df, _COMPETITOR)}


@router.post("/verticals/segment-differences")
def verticals_segment_differences(req: MarketingRequest) -> dict:
    df = _resolve_tracker(req)
    segments = sorted(df["segment"].unique()) if "segment" in df.columns else []
    per_seg = []
    for seg in segments:
        ss = df[df["segment"] == seg]
        per_seg.append({"segment": seg, "rigidity_proxy": mk.rigidity_proxy(mk.tracker_spins(ss)), **mk.static_summary(ss)})
    return {"overlap": mk.segment_overlap_matrix(df, segments), "per_segment": per_seg}


@router.post("/replicas/bootstrap")
def replicas_bootstrap(req: MarketingRequest) -> dict:
    spins = mk.tracker_spins(_resolve_tracker(req))
    return {"estimation": mk.bootstrap_replicas(spins), "rigidity_proxy": mk.rigidity_proxy(spins)}


@router.post("/replicas/landscape")
def replicas_landscape(req: MarketingRequest) -> dict:
    spins = mk.tracker_spins(_resolve_tracker(req))
    j = corr_couplings(spins, mode="spin_glass", scale=0.55)
    h = infer_mean_field_baseline(spins, j, beta=1.0)
    return {"landscape": mk.landscape_replicas(j, h, beta=1.0, n_chains=12)}


@router.post("/campaigns/simulate")
def campaigns_simulate(req: CampaignSimRequest) -> dict:
    df = _sample_tracker() if req.use_sample else None
    if df is None:
        raise HTTPException(status_code=400, detail="use_sample required")
    ctx = req.context.model_dump() if req.context else None
    spins = mk.tracker_spins(mk.filter_context(df, ctx))
    target = np.asarray(req.target_pattern) if req.target_pattern else _BRAND_TARGET
    competitor = np.asarray(req.competitor_pattern) if req.competitor_pattern else _COMPETITOR
    return {"simulation": mk.simulate_campaign(spins, target, competitor, req.spend_levels, req.memory_strength)}


@router.post("/stability/susceptibility")
def stability_susceptibility(req: MarketingRequest) -> dict:
    spins = mk.tracker_spins(_resolve_tracker(req))
    return {"susceptibility": mk.susceptibility(spins)}
