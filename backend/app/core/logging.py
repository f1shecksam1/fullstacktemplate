import contextvars
import logging
import logging.config
import time
from datetime import datetime, timezone
from pathlib import Path

from .config import Settings

_request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)


def set_request_id(value: str) -> contextvars.Token[str]:
    return _request_id_var.set(value)


def reset_request_id(token: contextvars.Token[str]) -> None:
    _request_id_var.reset(token)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_var.get()
        return True


class StaticFieldsFilter(logging.Filter):
    def __init__(self, service: str, version: str, environment: str) -> None:
        super().__init__()
        self._service = service
        self._version = version
        self._environment = environment

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "service"):
            record.service = self._service
        if not hasattr(record, "version"):
            record.version = self._version
        if not hasattr(record, "environment"):
            record.environment = self._environment
        return True


class UTCFormatter(logging.Formatter):
    def formatTime(self, record: logging.LogRecord, datefmt: str | None = None) -> str:
        ct = time.gmtime(record.created)
        if datefmt:
            return time.strftime(datefmt, ct)
        return time.strftime("%Y-%m-%d %H:%M:%S", ct)


class DailyPrefixFileHandler(logging.Handler):
    def __init__(self, log_dir: str | Path, prefix: str) -> None:
        super().__init__()
        self._log_dir = Path(log_dir)
        self._prefix = prefix
        self._current_date = ""
        self._handler: logging.FileHandler | None = None

    def _ensure_handler(self) -> None:
        today = datetime.now().strftime("%Y-%m-%d")
        if today == self._current_date and self._handler is not None:
            return

        if self._handler is not None:
            self._handler.close()

        self._current_date = today
        filename = self._log_dir / f"{self._prefix}-{today}.log"
        self._handler = logging.FileHandler(filename, encoding="utf-8")

    def emit(self, record: logging.LogRecord) -> None:
        self._ensure_handler()
        if self._handler is None:
            return
        self._handler.setFormatter(self.formatter)
        self._handler.emit(record)

    def close(self) -> None:
        if self._handler is not None:
            self._handler.close()
        super().close()


def _cleanup_old_logs(
    log_dir: Path, prefix: str, retention_days: int, use_utc: bool
) -> None:
    if retention_days <= 0:
        return

    now = datetime.now(timezone.utc if use_utc else None)
    today = now.date()

    for file in log_dir.glob(f"{prefix}-*.log"):
        date_str = file.stem[len(prefix) + 1 :]
        try:
            file_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        if (today - file_date).days > retention_days:
            try:
                file.unlink()
            except OSError:
                continue


def setup_logging(settings: Settings) -> None:
    log_path = Path(settings.log_file_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_dir = log_path.parent
    log_prefix = log_path.stem

    _cleanup_old_logs(
        log_dir=log_dir,
        prefix=log_prefix,
        retention_days=settings.log_retention_days,
        use_utc=settings.log_use_utc,
    )

    formatter_class = (
        "backend.app.core.logging.UTCFormatter"
        if settings.log_use_utc
        else "logging.Formatter"
    )

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "()": formatter_class,
                    "format": (
                        "%(asctime)s | %(levelname)s | %(name)s | "
                        "%(request_id)s | service=%(service)s | "
                        "version=%(version)s | environment=%(environment)s | "
                        "%(message)s"
                    ),
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
            },
            "filters": {
                "request_id": {"()": "backend.app.core.logging.RequestIdFilter"},
                "static_fields": {
                    "()": "backend.app.core.logging.StaticFieldsFilter",
                    "service": settings.service_name,
                    "version": settings.app_version,
                    "environment": settings.app_env,
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "filters": ["request_id", "static_fields"],
                },
                "file": {
                    "()": "backend.app.core.logging.DailyPrefixFileHandler",
                    "formatter": "default",
                    "filters": ["request_id", "static_fields"],
                    "log_dir": str(log_dir),
                    "prefix": log_prefix,
                },
            },
            "root": {
                "handlers": ["console", "file"],
                "level": settings.log_level,
            },
        }
    )
