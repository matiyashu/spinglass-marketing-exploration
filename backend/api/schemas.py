"""Pydantic shapes mirroring the bundled demo JSON the frontend already loads."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CsvPayload(BaseModel):
    """Caller-supplied tabular data as a list of dicts."""

    rows: list[dict[str, float]] = Field(..., description="List of survey rows keyed by feature name.")


class CouplingRequest(CsvPayload):
    mode: Literal["spin_glass", "ising", "mi"] = "spin_glass"
    scale: float = 0.55


class CouplingResponse(BaseModel):
    features: list[str]
    matrix: list[list[float]]
    mode: str


class ScenarioRequest(CsvPayload):
    target_pattern: list[int]
    competitor_pattern: list[int]
    spend_levels: list[float] = [0.0, 0.22, 0.45]
    memory_strength: float = 0.18


class ScenarioRow(BaseModel):
    name: str
    spend: float
    target_overlap: float
    competitor_overlap: float
    mean_consideration: float
    purchase_probability: float
    frustration: float


class ScenarioResponse(BaseModel):
    scenarios: list[ScenarioRow]


class ReportRequest(ScenarioRequest):
    """Same inputs as a scenario run; response is a binary PDF stream URL."""

    pass


class ReportResponse(BaseModel):
    pdf_url: str
