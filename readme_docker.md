# Run with Docker Desktop

This setup runs the dashboard and Java API in containers. You do not need Java, Maven, Node.js, or Python installed on your computer. Docker Desktop must be installed and running. The first build requires an internet connection to download container images and dependencies.

## Start the dashboard and Java API

1. Open PowerShell or a terminal in the project folder (the folder containing docker-compose.yml).
2. Run:

   docker compose up --build

3. Wait for the containers to start, then open http://localhost:3000.

The frontend is served by Nginx in a container. It routes API calls to the Java backend over Docker's private network. The Java API is also published at http://localhost:8080. Swagger UI is available from the dashboard host at http://localhost:3000/swagger-ui/index.html.

## Stop the application

Press Ctrl+C in the terminal running Compose, then run:

   docker compose down

## Optional: enable AI insights

AI insights run in an optional Python container and require an OpenAI API key and model name. Set these in your terminal before starting Compose; do not commit or share your API key.

PowerShell:

   $env:OPENAI_API_KEY = "your-key"
   $env:OPENAI_MODEL = "your-model"
   docker compose --profile ai up --build

macOS/Linux:

   export OPENAI_API_KEY="your-key"
   export OPENAI_MODEL="your-model"
   docker compose --profile ai up --build
   
To check that the container is running, open another terminal and run:
docker compose --profile ai ps
docker compose --profile ai logs -f intelligence

Look for the intelligence service in the running state and a Uvicorn message saying it is running on port 8000. You can also open http://localhost:3000/ai/integrations/PAYROLL/insights; a successful response requires valid credentials and a working backend.

To stop the optional service, use the same Ctrl+C and docker compose down steps. Without --profile ai, the dashboard and Java API run, but AI insight requests are unavailable.

## Troubleshooting

- If Docker reports that it cannot connect to the daemon, start Docker Desktop and retry.
- If host port 3000 or 8080 is already in use, change the host-side port in docker-compose.yml (the number before the colon). For example, 3001:80 serves the frontend on port 3001.
- To inspect service output, run docker compose logs -f. Use docker compose logs -f backend, frontend, or intelligence to inspect one service.
- To rebuild after changing source or Docker configuration, run docker compose up --build again.
- The backend keeps data in memory, so it resets when its container is recreated. The tracked backend-java/sample-logs/integration_log.json fixture is copied into the backend image and loaded at startup. The scheduled generator refreshes it while the service is running.
