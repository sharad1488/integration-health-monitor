import pytest
from app.models import Evidence


@pytest.fixture
def evidence() -> Evidence:
    return Evidence.model_validate({"integration_id": "PAYROLL", "integration_name": "Payroll",
        "observed_at": "2026-10-17T10:00:00Z", "current_window_start": "2026-10-17T09:45:00Z",
        "historical_window_start": "2026-10-16T09:45:00Z", "historical_window_end": "2026-10-17T09:45:00Z",
        "current": {"request_volume": 100, "error_rate": 0.25, "average_latency_ms": 1800},
        "historical": {"request_volume": {"mean": 95, "standard_deviation": 5, "sample_count": 20},
            "error_rate": {"mean": 0.02, "standard_deviation": 0.01, "sample_count": 20},
            "average_latency_ms": {"mean": 400, "standard_deviation": 100, "sample_count": 20}},
        "error_code_counts": {"503": 18, "500": 7}, "minimum_baseline_samples": 5,
        "z_score_threshold": 3, "authoritative_health_status": "DEGRADED", "demonstration_data": True})


@pytest.fixture
def fixed_now():
    from datetime import datetime, timezone
    return datetime(2026, 10, 17, 10, 1, tzinfo=timezone.utc)
