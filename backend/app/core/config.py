"""Application configuration loaded from environment (.env supported)."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "CoralSwift API"
    environment: str = "development"  # development | staging | production
    debug: bool = True

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Database (optional; reserved for direct Postgres access / Alembic)
    database_url: str | None = None

    # Legacy admin fallback
    admin_email: str | None = None
    admin_password: str | None = None
    admin_session_secret: str | None = None

    # Security
    secret_key: str | None = None  # reserved for future server-side JWT issuing

    # CORS / frontend
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    frontend_url: str | None = None

    # Email (SMTP) — optional; emails are skipped with a log line when unset.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_from_name: str = "CoralSwift"

    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    reload: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_anon_key
            and "your-project" not in self.supabase_url
        )

    @property
    def service_role_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_service_role_key
            and "your-project" not in self.supabase_url
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
