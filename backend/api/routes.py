"""Thin HTTP wrappers around the kernel functions."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
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
    ReportRequest,
    ReportResponse,
    ScenarioRequest,
    ScenarioResponse,
    ScenarioRow,
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
