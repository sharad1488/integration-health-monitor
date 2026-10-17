# Integration Health API (Java)

Deterministic Spring Boot backend for the API Integration Health Dashboard. All bundled request logs are **seeded demonstration data**, held in memory only. No database, AI, or external service is used.

## Requirements
Java 17 and Maven 3.6.3 or newer. The installed Maven version is not modified by this project.

## Run
From `backend-java/` run:

```sh
mvn spring-boot:run
```

The service loads the five `.log` fixtures from `backend-java/sample-logs` at startup. Reload them at any time with:

```sh
curl -X POST http://localhost:8080/api/v1/logs/reload
curl http://localhost:8080/api/v1/health
```

Run tests with `mvn test`. Set `LOG_DIRECTORY`, `SERVER_PORT`, and `HEALTH_WINDOW`, `MINIMUM_SAMPLE_SIZE`, `DEGRADED_ERROR_RATE`, `UNHEALTHY_ERROR_RATE`, `DEGRADED_LATENCY_MS`, `UNHEALTHY_LATENCY_MS`, `CONSECUTIVE_FAILURE_THRESHOLD` to configure behavior. A log line contains integration, requestId, ISO-8601 timestamp, method, path, statusCode, latencyMs, optional errorMessage. Duplicate identity is integration plus requestId; malformed/misfiled records are skipped and counted. Repeated reload starts a fresh in-memory snapshot.

## API
- `GET /api/v1/health` — all integration statuses
- `GET /api/v1/integrations/{integration}/health`
- `GET /api/v1/integrations/{integration}/logs?limit=100` (1–1000)
- `GET /api/v1/integrations/{integration}/trends`
- `GET /api/v1/ingestion/stats`
- `POST /api/v1/logs/reload`
- Actuator: `/actuator/health`

Integrations are `PAYROLL`, `ATS`, `E_SIGN`, `DIRECTORY_SYNC`, `NOTIFICATIONS`. HTTP 5xx, 408, and 504 count as failures; ordinary 4xx do not. Status is UNKNOWN below the minimum sample size. Otherwise unhealthy thresholds or enough consecutive failures take precedence, then degraded thresholds. The health score is 100 × (1 − recent failure rate); latency is assessed separately. `Clock` is injected so tests can fix time.

## Incremental development and verification
1. Project setup/configuration: `mvn -q validate`.
2. Domain, in-memory store, ingestion: reload fixtures and inspect ingestion statistics.
3. Health calculations and API: query the endpoints above.
4. Automated unit tests: `mvn test`.

No Maven wrapper is bundled; use a local Maven 3.6.3+ installation.


## Swagger / OpenAPI
Open Swagger UI at http://localhost:8080/swagger-ui/index.html. The OpenAPI JSON document is available at http://localhost:8080/v3/api-docs. The interactive docs cover the /api/v1 integration health endpoints, including log reload (which replaces the current in-memory snapshot).
