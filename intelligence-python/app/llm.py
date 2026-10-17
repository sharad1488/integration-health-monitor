from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
from urllib.request import Request, urlopen

from pydantic import BaseModel, Field, ValidationError

from app.models import Insight


@dataclass(frozen=True)
class LlmConfig:
    enabled: bool = False
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    timeout_seconds: float = 3.0

    @classmethod
    def from_env(cls) -> "LlmConfig":
        return cls(enabled=os.getenv("LLM_ENABLED", "false").lower() in {"1", "true", "yes"},
            base_url=os.getenv("LLM_BASE_URL", ""), api_key=os.getenv("LLM_API_KEY", ""),
            model=os.getenv("LLM_MODEL", ""), timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "3")))

    @property
    def ready(self) -> bool:
        return self.enabled and bool(self.base_url and self.api_key and self.model)


class LlmNarrative(BaseModel):
    summary: str = Field(min_length=1, max_length=500)
    likely_cause: str = Field(min_length=1, max_length=500)
    supporting_evidence: list[str] = Field(min_length=1, max_length=10)
    recommendations: list[str] = Field(min_length=1, max_length=10)


def _request(config: LlmConfig, prompt: str) -> LlmNarrative:
    url = config.base_url.rstrip("/") + "/chat/completions"
    body = json.dumps({"model": config.model, "temperature": 0,
        "messages": [
            {"role": "system", "content": "Write concise advisory text only. Use only supplied evidence. Never assign or change authoritative health status. Return JSON with summary, likely_cause, supporting_evidence (array), recommendations (array). Do not propose automated changes."},
            {"role": "user", "content": prompt}], "response_format": {"type": "json_object"}}).encode()
    request = Request(url, data=body, headers={"Authorization": f"Bearer {config.api_key}", "Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=config.timeout_seconds) as response:
        payload = json.loads(response.read())
    return LlmNarrative.model_validate_json(payload["choices"][0]["message"]["content"])


async def enrich(insight: Insight, config: LlmConfig) -> Insight:
    if not config.enabled:
        return insight
    if not config.ready:
        return insight.model_copy(update={"llm_fallback_reason": "LLM is enabled but required endpoint, key, or model configuration is missing."})
    prompt = json.dumps({"integration_id": insight.integration_id, "advisory_status": insight.status,
        "summary": insight.summary, "likely_cause": insight.likely_cause,
        "supporting_evidence": insight.supporting_evidence, "recommendations": insight.recommendations,
        "anomalies": [a.model_dump() for a in insight.anomalies],
        "comparisons": {k: v.model_dump() for k, v in insight.comparisons.items()},
        "error_code_counts": insight.error_code_counts,
        "authoritative_health_status": insight.authoritative_health_status})
    try:
        result = await asyncio.wait_for(asyncio.to_thread(_request, config, prompt), timeout=config.timeout_seconds)
        # The model cannot modify advisory status, statistical outputs, or Java's authoritative status.
        return insight.model_copy(update={"summary": result.summary, "likely_cause": result.likely_cause,
            "supporting_evidence": result.supporting_evidence, "recommendations": result.recommendations, "llm_used": True})
    except (TimeoutError, OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
        reason = "LLM request timed out." if isinstance(exc, TimeoutError) else "LLM response was unavailable or invalid."
        return insight.model_copy(update={"llm_fallback_reason": reason})
