# Integration Health Monitor — Local Setup

This guide runs each service directly on your computer. It is intended for development and does not use Docker.

## Requirements

Install these tools first:

- Java 17 (JDK)
- Maven 3.6.3 or newer
- Node.js with npm (use a current LTS release)
- Python 3.10 or newer with pip, only if you want the AI insights service

The main dashboard and Java API do not require Python or an OpenAI key. AI insights require an OpenAI API key and a model name.

## 1. Start the Java backend

From the project root, open a terminal and run:

   cd backend-java
   mvn spring-boot:run

The API listens on http://localhost:8080. Keep this terminal open. API documentation is at http://localhost:8080/swagger-ui/index.html.

The backend stores its request data in memory. The backend loads the tracked backend-java/sample-logs/integration_log.json fixture at startup. The scheduled generator refreshes that file while the service is running.

## 2. Start the frontend

Open a second terminal at the project root and run:

   cd frontend
   npm ci
   npm run dev

Open the local URL printed by Vite, usually http://localhost:5173. The Vite development server proxies /api requests to the Java service at port 8080 and /ai requests to the Python service at port 8000.

For a production frontend build, run from frontend/:

   npm run build

## 3. Optional: start the Python AI insights service

Python provides AI-generated integration insights. Configure the credentials before starting it.

PowerShell:

   $env:SPRING_BOOT_BASE_URL = "http://localhost:8080/api/v1"
   $env:OPENAI_API_KEY = "your-key"
   $env:OPENAI_MODEL = "your-model"
   cd intelligence-python
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirement.txt
   uvicorn app.main:app --reload --port 8000

macOS/Linux:

   export SPRING_BOOT_BASE_URL="http://localhost:8080/api/v1"
   export OPENAI_API_KEY="your-key"
   export OPENAI_MODEL="your-model"
   cd intelligence-python
   python3 -m venv .venv
   source .venv/bin/activate
   python -m pip install -r requirement.txt
   uvicorn app.main:app --reload --port 8000

Keep the Python service terminal open. It listens on http://localhost:8000. The dashboard's AI Insights section calls this service. Keep the API key private and out of source control.

## Stop the services

Press Ctrl+C in each terminal running a service. If you activated the Python virtual environment, you can leave it with deactivate.

## Troubleshooting

- Check that ports 5173, 8080, and (if using AI) 8000 are not already occupied.
- If the dashboard cannot load health data, confirm the Java terminal started successfully and http://localhost:8080/actuator/health reports UP.
- If AI insights fail, confirm the OPENAI_API_KEY, OPENAI_MODEL, and SPRING_BOOT_BASE_URL values are set in the same terminal session used to launch it.
