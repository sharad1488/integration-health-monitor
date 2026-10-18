import os

class LlmConfig:
    enabled: bool = False
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    timeout_seconds: float = 3.0

    @classmethod
    def from_env(cls) -> "LlmConfig":
        return cls(enabled=os.getenv("LLM_ENABLED", "false").lower() in {"1", "true", "yes"},
                   base_url=os.getenv("LLM_BASE_URL", ""),
                   api_key=os.getenv("LLM_API_KEY", ""),
                   model=os.getenv("LLM_MODEL", ""),
                   timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "3")))