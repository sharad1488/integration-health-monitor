# Integration Health Intelligence

Stateless FastAPI service that analyzes structured evidence supplied by Java. It does not connect to PostgreSQL, retain request evidence, or decide authoritative health status. Results and generated narratives are advisory.

## Run

Requires Python 3.12 or newer. In this directory:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -e '.[test]'
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Copy `.env.example` and set variables in the service environment to enable an OpenAI-compatible chat-completions endpoint. LLM support is disabled by default. It may rewrite only summary, likely cause, evidence text, and recommendations. It cannot change advisory anomaly status, comparisons, or Java's authoritative status. Misconfiguration, timeout, network failure, or invalid response returns deterministic content. Never commit credentials.

## Java REST contract

Java calls `POST /api/v1/analyze` with `Content-Type: application/json`, supplying current metrics, historical aggregates, error-code counts, window boundaries, configurable minimum sample count and z-score threshold, and its authoritative health status. Timestamps are ISO-8601. Rates are fractions in `[0,1]`; latency is milliseconds. Historical metric values include `mean`, population `standard_deviation`, and `sample_count`.

Example request:

```json
{
  "integration_id": "PAYROLL", "integration_name": "Payroll",
  "observed_at": "2026-10-17T10:00:00Z", "current_window_start": "2026-10-17T09:45:00Z",
  "historical_window_start": "2026-10-16T09:45:00Z", "historical_window_end": "2026-10-17T09:45:00Z",
  "current": {"request_volume": 100, "error_rate": 0.25, "average_latency_ms": 1800},
  "historical": {
    "request_volume": {"mean": 95, "standard_deviation": 5, "sample_count": 20},
    "error_rate": {"mean": 0.02, "standard_deviation": 0.01, "sample_count": 20},
    "average_latency_ms": {"mean": 400, "standard_deviation": 100, "sample_count": 20}
  },
  "error_code_counts": {"503": 18, "500": 7}, "minimum_baseline_samples": 5,
  "z_score_threshold": 3, "authoritative_health_status": "DEGRADED", "demonstration_data": true
}
```

The `200` response returns `status` (`NORMAL`, `ANOMALY`, `INSUFFICIENT_DATA`), deterministic `anomalies` and `comparisons`, summary, likely cause, supporting evidence, recommendations, supplied error-code counts, exact echoed `authoritative_health_status`, demonstration-data marker, and LLM usage/fallback metadata. Invalid requests return `422`. `GET /healthz` returns `{"status":"ok"}`; OpenAPI is at `/docs`.

Java WebClient sketch:

```java
webClient.post().uri("/api/v1/analyze")
    .contentType(MediaType.APPLICATION_JSON)
    .bodyValue(evidence)
    .retrieve()
    .bodyToMono(InsightResponse.class)
    .timeout(Duration.ofSeconds(5));
```

Treat this call as optional/best-effort; Java remains the source of health status during a timeout or outage.

## Detection behavior

For metrics with enough samples, the service returns absolute change, percent change (null if undefined for a zero baseline), and z-score. A deviation of at least the configurable threshold is flagged. A zero-variance baseline flags any changed value. Missing/under-sampled history is explicit as null baseline values; no sufficient historical data produces `INSUFFICIENT_DATA`. Recommendations are inspection steps only.

## Tests

```powershell
py -3.12 -m pytest
```
