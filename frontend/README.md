# Integration Health Dashboard frontend

The dashboard reads authoritative health, request log, and trend data from the Java service. Integration insights are returned by the Python FastAPI service, which fetches health metrics from Java and sends them to the configured OpenAI model.

## Run locally

1. Start the Java service from `../backend-java` with `mvn spring-boot:run`.
2. From this folder run `npm run dev` and open the Vite URL.

Vite proxies `/api/*` to `http://localhost:8080` and `/ai/*` to `http://localhost:8000` during development, so the browser uses same-origin requests by default. Start FastAPI from `../intelligence-python` with `uvicorn app.main:app --reload --port 8000`, with `SPRING_BOOT_BASE_URL` set to `http://localhost:8080/api/v1` and `OPENAI_API_KEY` / `OPENAI_MODEL` configured. If the frontend calls FastAPI directly, set `VITE_INTELLIGENCE_API_BASE_URL` and include the frontend origin in FastAPI's comma-separated `CORS_ALLOWED_ORIGINS` setting. `npm run build` creates the production frontend bundle.

The UI uses `GET /api/v1/health`, `GET /api/v1/integrations/{integration}/logs`, and `GET /api/v1/integrations/{integration}/trends`. Submitting a supported integration name calls `GET /ai/integrations/{integration}/insights`; unsupported names are rejected in the browser without calling FastAPI. The sidebar links to Swagger UI on the local backend.
