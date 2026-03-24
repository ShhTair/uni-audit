from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGODB_URI: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    AZURE_OPENAI_MODEL: str = "gpt-5.4-nano"
    AZURE_OPENAI_API_KEY: str

    DATABASE_NAME: str = "uni_audit"

    # Crawler defaults
    CRAWLER_MAX_DEPTH: int = 5
    CRAWLER_MAX_PAGES: int = 300
    CRAWLER_REQUEST_DELAY: float = 1.5

    # Analyzer defaults
    ANALYZER_MAX_CONCURRENCY: int = 5
    ANALYZER_MAX_TOKENS: int = 4096


settings = Settings()
