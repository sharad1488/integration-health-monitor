# Integration Health Dashboard frontend

The dashboard reads authoritative health, request log, and trend data from the Java service. Bundled fixture data is identified as seeded demonstration data. Insight notes are rule-based and derived from the Java health response; the UI does not fabricate AI analysis.

## Run locally

1. Start the Java service from `../backend-java` with `mvn spring-boot:run`.
2. From this folder run `npm run dev` and open the Vite URL.

Vite proxies `/api/*` to `http://localhost:8080` during development. Set `VITE_API_BASE_URL` to the Java API base (for example `https://api.example.test/api/v1`) when deploying behind a separately hosted API. `npm run build` creates the production frontend bundle.

The UI uses `GET /api/v1/health`, `GET /api/v1/integrations/{integration}/logs`, and `GET /api/v1/integrations/{integration}/trends`. Refresh requests the Java service again. The sidebar links to Swagger UI on the local backend.
