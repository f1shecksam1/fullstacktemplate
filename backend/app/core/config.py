import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:5500",
    "http://localhost:5500",
)
PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _parse_cors_origins(raw_value: str | None) -> tuple[str, ...]:
    if raw_value is None:
        return DEFAULT_CORS_ORIGINS

    parsed = tuple(origin.strip() for origin in raw_value.split(",") if origin.strip())
    if not parsed:
        return DEFAULT_CORS_ORIGINS

    return parsed


def _parse_bool(raw_value: str | None, default: bool) -> bool:
    if raw_value is None:
        return default

    normalized = raw_value.strip().lower()
    return normalized in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    service_name: str
    app_version: str
    app_name: str
    app_env: str
    api_prefix: str
    api_v1_prefix: str
    cors_origins: tuple[str, ...]
    log_level: str
    log_file_path: str
    log_retention_days: int
    log_use_utc: bool


@lru_cache
def get_settings() -> Settings:
    configured_log_file_path = Path(os.getenv("LOG_FILE_PATH", "logs/backend.log"))
    if not configured_log_file_path.is_absolute():
        configured_log_file_path = (PROJECT_ROOT / configured_log_file_path).resolve()

    log_retention_days = int(os.getenv("LOG_RETENTION_DAYS", "30"))

    return Settings(
        service_name=os.getenv("SERVICE_NAME", "fullstack-template-backend"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        app_name=os.getenv("APP_NAME", "Fullstack Template"),
        app_env=os.getenv("APP_ENV", "development"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        api_v1_prefix=os.getenv("API_V1_PREFIX", "/v1"),
        cors_origins=_parse_cors_origins(os.getenv("CORS_ORIGINS")),
        log_level=os.getenv("LOG_LEVEL", "DEBUG").upper(),
        log_file_path=str(configured_log_file_path),
        log_retention_days=log_retention_days,
        log_use_utc=_parse_bool(os.getenv("LOG_USE_UTC"), True),
    )
