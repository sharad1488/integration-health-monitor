from fastapi import FastAPI

from app.analysis import analyze
from app.llm import LlmConfig, enrich
from app.models import Evidence, Insight

app = FastAPI(title="Integration Health Intelligence API", version="0.1.0",
    description="Stateless advisory analysis of Java-supplied evidence. No database access; authoritative health remains with Java.")
_llm_config = LlmConfig.from_env()


@app.get("/healthz", tags=["operations"])
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/analyze", response_model=Insight, tags=["analysis"])
async def analyze_evidence(evidence: Evidence) -> Insight:
    return await enrich(analyze(evidence), _llm_config)
