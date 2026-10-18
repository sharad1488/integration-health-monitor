from pydantic import BaseModel
from typing import Literal


class IntegrationHealth(BaseModel):
    integration: str
    status: str
    healthScore: int
    errorRate: float
    averageLatencyMs: float
    requestVolume: int
    failureCount: int
    consecutiveFailures: int
    windowStart: str
    generatedAt: str


class PossibleCause(BaseModel):
    cause: str
    evidence: str
    confidence: Literal["LOW", "MEDIUM", "HIGH"]


class RecommendedAction(BaseModel):
    priority: Literal["HIGH", "MEDIUM", "LOW"]
    action: str


class IntegrationInsight(BaseModel):
    integrationName: str
    assessment: Literal[
        "HEALTHY", "WARNING", "CRITICAL", "UNKNOWN"
    ]
    summary: str
    keyFindings: list[str]
    possibleCauses: list[PossibleCause]
    recommendedActions: list[RecommendedAction]
    dataLimitations: list[str]
