# Solution Design: Integration Health Monitor

## Problem restated

Teams need a shared way to see whether their API integrations are behaving reliably. Request outcomes and latency are otherwise spread across logs and service-specific tools, making it harder to spot degradation, compare integrations, and decide what to investigate.

The proposed solution turns request-log evidence into a single dashboard. It summarizes health and trends for supported integrations, exposes the underlying logs through an API, and can provide optional AI-generated explanations and suggested actions. The AI output is advisory; the measured health status remains determined by application logic.

## Assumptions

- The first users are an internal engineering or operations team reviewing a small, known set of integrations: PAYROLL, ATS, E_SIGN, DIRECTORY_SYNC, and NOTIFICATIONS.
- The initial goal is a demonstrable local or team-hosted tool, not a high-availability production monitoring platform.
- Health can initially be estimated from request logs using error rate, latency, request volume, and consecutive failures. It is not a direct guarantee that an integration is currently reachable.
- The checked-in JSON log file is demonstration input. In a real deployment, logs would come from a defined ingestion source.
- AI insights are optional, need an OpenAI credential, and may be unavailable without affecting the core dashboard and Java API.
- Team members should be able to run the application using Docker Desktop, while developers can also run each component locally.

## Proposed approach

Use three components with clear responsibilities:

1. **React dashboard** presents health summaries, integration details, logs, trends, and optional insights. It calls same-origin API paths so the browser does not need container-specific hostnames.
2. **Java Spring Boot API** owns the authoritative health calculations and REST endpoints. At startup it loads the configured JSON log file; scheduled jobs refresh or generate demonstration data. The log file is selected through the LOG_FILE setting, with a project-relative default rather than a developer-specific absolute path. Health thresholds and the analysis window remain configuration values.
3. **Python FastAPI insights service** optionally fetches Java health data and asks the configured language model for structured findings. It does not write health state or replace Java’s calculation.

For local development, run the Java API and frontend in separate terminals; run Python only when AI insights are needed. For team handoff, Docker Compose builds the frontend and backend, copies the sample fixture into the backend image, and routes browser requests through Nginx. The Python service is behind an optional Compose profile and requires credentials supplied at runtime. No secret is stored in the repository.

The request flow is: log fixture or future log source → Java ingestion and health calculation → dashboard API request → React view. When requested, the insights panel calls Python, which reads the Java health result and returns advisory text.

## Ambiguity Findings
- **Definition Of unhealthy integration
- **Amount of Data for status calculation
- **Recalculation time of health calculation
- **How much AI insights needed?

## Trade-offs considered

- **JSON file and in-memory state vs. a database or streaming pipeline:** the file makes the demo portable and simple to inspect, but offers limited durability, concurrency, retention, and ingestion guarantees. A database or message queue would add operational setup.
- **Detection speed vs processing cost:** 
	*Evaluate every minute: detect failures faster, but consume more resources.
	*Evaluate every five minutes: reduce processing, but detection may be delayed.
- **Strict thresholds vs false alarms
	*Strict threshold: detect small problems early, but generate more false alarms.
	*Lenient threshold: fewer false alarms, but some real issues may go undetected.
- **Optional AI vs. mandatory AI:** 
	*keeping AI optional avoids making the core dashboard depend on credentials, external API availability, or model cost. AI explanations can be variable and should remain separate from measured health.
- **Real-time processing vs batch processing:** - 
	*Real-time: quicker detection, but more complex and potentially expensive.
	*Batch: simpler to build and operate, but detection is delayed.
	
- **More historical data vs query performance:** -
	*Analyze all historical logs: gain more context, but increase query cost.
	*Analyze the latest 15 minutes: faster and more focused, but potentially miss longer-term patterns

## With more time and budget

	*Replace the demonstration file flow with a reliable ingestion contract from the systems that produce integration traffic. 
		
	*Persist normalized events in a database, define retention and deduplication behavior, and add migrations and backup procedures. Next, add authentication and role-based access, secret management, structured logs, metrics, alerting, and deployment automation. 
		
	*Add integration-specific thresholds and configurable time windows, then validate them against historical incidents to reduce false alerts. 
		
	*Evaluate AI insights against operator-reviewed examples, record source evidence, and add usage and cost limits before relying on them operationally.

## Success criteria

	*A teammate can start the core application from a clean checkout using the documented Docker command, see health and trend data derived from the supplied fixture, and inspect the Java API. 
	*Enabling AI is a separate, documented step and does not change the authoritative health result.
