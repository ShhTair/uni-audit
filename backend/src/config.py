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

    # Cloudflare Browser Rendering (optional)
    # Accepts either CLOUDFLARE_API_TOKEN or CLOUDFLARE_GLOBAL_API_TOKEN (Workers token, cfk_... prefix)
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_GLOBAL_API_TOKEN: str = ""  # alias — used if CLOUDFLARE_API_TOKEN is empty

    @property
    def cf_token(self) -> str:
        """Return whichever CF token is set."""
        return self.CLOUDFLARE_API_TOKEN or self.CLOUDFLARE_GLOBAL_API_TOKEN

    @property
    def cf_ready(self) -> bool:
        return bool(self.CLOUDFLARE_ACCOUNT_ID and self.cf_token)


settings = Settings()
