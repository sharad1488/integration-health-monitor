from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Identifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
NonNegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class AdvisoryStatus(StrEnum):
    NORMAL = "NORMAL"
    ANOMALY = "ANOMALY"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class MetricSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_volume: Annotated[int, Field(ge=0)]
    error_rate: Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]
    average_latency_ms: NonNegative


class MetricBaseline(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mean: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    standard_deviation: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    sample_count: Annotated[int, Field(ge=0)]


class Evidence(BaseModel):
    model_config = ConfigDict(extra="forbid")
    integration_id: Identifier
    integration_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
    observed_at: datetime
    current_window_start: datetime
    current: MetricSnapshot
    historical_window_start: datetime | None = None
    historical_window_end: datetime | None = None
    historical: dict[Identifier, MetricBaseline] = Field(default_factory=dict, max_length=20)
    error_code_counts: dict[Identifier, Annotated[int, Field(ge=0)]] = Field(default_factory=dict, max_length=100)
    minimum_baseline_samples: Annotated[int, Field(ge=1, le=10000)] = 5
    z_score_threshold: Annotated[float, Field(gt=0, le=20, allow_inf_nan=False)] = 3.0
    authoritative_health_status: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=32)]
    demonstration_data: bool = False


class MetricComparison(BaseModel):
    current: float
    historical_mean: float | None
    absolute_change: float | None
    percent_change: float | None
    z_score: float | None
    samples: int
    anomalous: bool


class Anomaly(BaseModel):
    metric: str
    direction: str
    severity: str
    evidence: str


class Insight(BaseModel):
    model_config = ConfigDict(extra="forbid")
    integration_id: str
    generated_at: datetime
    status: AdvisoryStatus
    summary: str
    likely_cause: str
    supporting_evidence: list[str]
    recommendations: list[str]
    anomalies: list[Anomaly]
    comparisons: dict[str, MetricComparison]
    error_code_counts: dict[str, int]
    authoritative_health_status: str = Field(description="Echoed from Java; never inferred or changed by this service.")
    demonstration_data: bool
    llm_used: bool
    llm_fallback_reason: str | None = None
