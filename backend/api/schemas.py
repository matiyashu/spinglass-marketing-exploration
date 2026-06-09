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


# ----- V2 paper-aligned endpoints -----


class PriceSeriesRow(BaseModel):
    """A single dated row from a price or return panel.

    Free-form to accept any subset of the commodity assets (or other tickers).
    The 'date' key, if present, is preserved on the response for tracebacks.
    """

    model_config = {"extra": "allow"}


class RollingCouplingRequest(BaseModel):
    """Compute rolling couplings on an arbitrary returns panel."""

    rows: list[dict[str, float | str]] = Field(..., description="Wide-format returns table; one row per date.")
    asset_columns: list[str] | None = Field(
        default=None,
        description="Which columns are assets. If omitted, every non-date numeric column is used.",
    )
    date_column: str = "date"
    window: int = 90
    step: int = 30


class RollingMetricRow(BaseModel):
    window_start: str
    window_end: str
    window_size: int
    step: int
    avg_signed_coupling: float
    avg_abs_coupling_ising: float
    avg_mutual_information: float
    largest_eigenvalue_signed: float
    largest_eigenvalue_ising: float
    negative_edge_share: float


class RollingCouplingResponse(BaseModel):
    asset_columns: list[str]
    records: list[RollingMetricRow]


class StaticCouplingRequest(BaseModel):
    """Compute a single coupling matrix on the full-sample returns panel."""

    rows: list[dict[str, float | str]]
    asset_columns: list[str] | None = None
    mode: Literal["spin_glass", "ising", "mi"] = "spin_glass"


class StaticCouplingResponse(BaseModel):
    asset_columns: list[str]
    matrix: list[list[float]]
    mode: str


class ValidateRequest(BaseModel):
    """Lightweight schema validator for a returns or spin panel."""

    rows: list[dict[str, float | str]]
    expected_columns: list[str] | None = None
    date_column: str = "date"
    min_rows: int = 50


class ValidationCheck(BaseModel):
    id: str
    level: Literal["ok", "warning", "error"]
    label: str
    detail: str | None = None


class ValidateResponse(BaseModel):
    row_count: int
    columns: list[str]
    has_errors: bool
    checks: list[ValidationCheck]


class PatternsOverlapRequest(BaseModel):
    """Overlap of a spin panel against declared target / competitor patterns."""

    spins: list[list[int]] = Field(..., description="N × K binary {-1, +1} spin matrix.")
    target_pattern: list[int]
    competitor_pattern: list[int]


class PatternsOverlapResponse(BaseModel):
    target_overlap: float
    competitor_overlap: float
    target_share: float
    competitor_share: float
    samples: int


# ----- V3 marketing endpoints -----


class MarketingContextModel(BaseModel):
    brand_id: str | None = None
    product_id: str | None = None
    vertical_id: str | None = None
    market: str | None = None
    segment: str | None = None
    campaign_id: str | None = None


class MarketingRequest(BaseModel):
    """Generic marketing compute request.

    Either supply ``rows`` (a tracker panel) or set ``use_sample`` to compute
    against the backend's bundled v3 marketing sample. ``context`` filters it.
    """

    context: MarketingContextModel | None = None
    rows: list[dict[str, float | str]] | None = None
    use_sample: bool = False
    mode: Literal["spin_glass", "ising", "mi"] = "spin_glass"
    window: int = 6
    step: int = 1


class CampaignSimRequest(BaseModel):
    context: MarketingContextModel | None = None
    use_sample: bool = True
    target_pattern: list[int] | None = None
    competitor_pattern: list[int] | None = None
    spend_levels: list[float] = [0.0, 0.22, 0.45]
    memory_strength: float = 0.18


class DataStatusRequest(BaseModel):
    use_sample: bool = True
    tables_present: list[str] | None = None


class MarketingValidateRequest(BaseModel):
    rows: list[dict[str, float | str]]
    min_rows: int = 50
