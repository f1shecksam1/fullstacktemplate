from __future__ import annotations

from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from backend.app.api.v1.endpoints import logs as logs_endpoint
from backend.app.api.v1.endpoints import time as time_endpoint
from backend.app.core.config import get_settings
from backend.app.main import create_app


class StubFrontendLogger:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def _record(self, level: str, event: str, *args: Any, **kwargs: Any) -> None:
        payload = {"level": level, "event": event, "args": args, **kwargs}
        self.calls.append(payload)

    def debug(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._record("debug", event, *args, **kwargs)

    def info(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._record("info", event, *args, **kwargs)

    def warning(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._record("warning", event, *args, **kwargs)

    def error(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._record("error", event, *args, **kwargs)


@pytest.fixture(autouse=True)
def isolated_runtime(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[Path]:
    log_dir = tmp_path / "logs"
    monkeypatch.setenv("LOG_FILE_PATH", str(log_dir / "backend.log"))
    monkeypatch.setenv("SERVICE_NAME", "backend-test-service")
    monkeypatch.setenv("APP_VERSION", "9.9.9-test")

    get_settings.cache_clear()
    yield log_dir
    get_settings.cache_clear()


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def frozen_utc_time(monkeypatch: pytest.MonkeyPatch) -> str:
    expected = datetime(2026, 2, 7, 12, 34, 56, tzinfo=timezone.utc)

    class FrozenDateTime(datetime):
        @classmethod
        def now(cls, tz: object = None) -> datetime:
            if tz is None:
                return expected.replace(tzinfo=None)
            return expected

    monkeypatch.setattr(time_endpoint, "datetime", FrozenDateTime)
    return expected.isoformat()


@pytest.fixture
def frontend_log_payload() -> dict[str, Any]:
    return {
        "level": "info",
        "event": "frontend.test.event",
        "message": "frontend payload",
        "page_path": "/pages/health.html",
        "details": {"source": "pytest"},
        "browser_timestamp": "2026-02-07T12:00:00.000Z",
        "user_agent": "pytest-agent",
    }


@pytest.fixture
def mock_frontend_logger(monkeypatch: pytest.MonkeyPatch) -> StubFrontendLogger:
    logger = StubFrontendLogger()
    monkeypatch.setattr(logs_endpoint, "logger", logger)
    return logger
