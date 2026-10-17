import asyncio

from fastapi.testclient import TestClient

from app.analysis import analyze
from app.llm import LlmConfig, LlmNarrative, enrich
from app.main import app
from app.models import AdvisoryStatus

client = TestClient(app)


def test_api_response_contract(evidence):
    response = client.post("/api/v1/analyze", json=evidence.model_dump(mode="json"))
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ANOMALY"
    assert data["authoritative_health_status"] == "DEGRADED"
    assert data["llm_used"] is False


def test_api_validates_invalid_payload(evidence):
    payload = evidence.model_dump(mode="json")
    payload["current"]["error_rate"] = -1
    assert client.post("/api/v1/analyze", json=payload).status_code == 422


def test_llm_success_cannot_change_status_or_authority(evidence, fixed_now, monkeypatch):
    expected = LlmNarrative(summary="Reviewed", likely_cause="Evidence suggests errors.",
        supporting_evidence=["Evidence: 25% errors."], recommendations=["Review failed requests."])
    monkeypatch.setattr("app.llm._request", lambda _config, _prompt: expected)
    original = analyze(evidence, fixed_now)
    result = asyncio.run(enrich(original, LlmConfig(True, "https://example.invalid/v1", "secret", "model", 1)))
    assert result.llm_used is True
    assert result.summary == "Reviewed"
    assert result.status == AdvisoryStatus.ANOMALY
    assert result.authoritative_health_status == "DEGRADED"
    assert result.comparisons == original.comparisons


def test_llm_timeout_returns_deterministic_fallback(evidence, fixed_now, monkeypatch):
    monkeypatch.setattr("app.llm._request", lambda *_args: (_ for _ in ()).throw(TimeoutError()))
    original = analyze(evidence, fixed_now)
    result = asyncio.run(enrich(original, LlmConfig(True, "https://example.invalid/v1", "secret", "model", 1)))
    assert result.llm_used is False
    assert result.summary == original.summary
    assert result.llm_fallback_reason == "LLM request timed out."


def test_llm_missing_configuration_falls_back(evidence, fixed_now):
    result = asyncio.run(enrich(analyze(evidence, fixed_now), LlmConfig(enabled=True)))
    assert result.llm_used is False
    assert "configuration is missing" in result.llm_fallback_reason
