import pytest
from pydantic import ValidationError

from app.analysis import analyze
from app.models import AdvisoryStatus


def test_detects_anomalies_and_uses_supplied_evidence(evidence, fixed_now):
    result = analyze(evidence, fixed_now)
    assert result.status == AdvisoryStatus.ANOMALY
    assert {item.metric for item in result.anomalies} == {"error_rate", "average_latency_ms"}
    assert any("503" in line for line in result.supporting_evidence)
    assert "code 503" in result.likely_cause
    assert result.demonstration_data is True
    assert result.authoritative_health_status == "DEGRADED"


def test_normal_metrics_stay_normal(evidence, fixed_now):
    evidence.current.request_volume = 95
    evidence.current.error_rate = 0.02
    evidence.current.average_latency_ms = 400
    assert analyze(evidence, fixed_now).status == AdvisoryStatus.NORMAL


def test_low_traffic_and_missing_history_are_insufficient(evidence, fixed_now):
    evidence.current.request_volume = 0
    evidence.current.error_rate = 0
    evidence.current.average_latency_ms = 0
    evidence.historical = {}
    evidence.error_code_counts = {}
    result = analyze(evidence, fixed_now)
    assert result.status == AdvisoryStatus.INSUFFICIENT_DATA
    assert result.anomalies == []
    assert "No requests" in result.supporting_evidence[0]


def test_under_sampled_baseline_is_ignored(evidence, fixed_now):
    evidence.historical["error_rate"].sample_count = 2
    result = analyze(evidence, fixed_now)
    assert result.comparisons["error_rate"].anomalous is False
    assert result.comparisons["error_rate"].historical_mean is None


def test_zero_variance_baseline_flags_different_value(evidence, fixed_now):
    evidence.historical["error_rate"].mean = 0
    evidence.historical["error_rate"].standard_deviation = 0
    result = analyze(evidence, fixed_now)
    assert result.comparisons["error_rate"].anomalous is True
    assert result.comparisons["error_rate"].z_score is None


def test_request_rejects_out_of_range_error_rate(evidence):
    payload = evidence.model_dump(mode="json")
    payload["current"]["error_rate"] = 1.5
    with pytest.raises(ValidationError):
        type(evidence).model_validate(payload)
