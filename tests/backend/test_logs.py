from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from backend.app.core.config import get_settings


def test_frontend_log_ingestion_with_mock_logger(
    client: TestClient,
    frontend_log_payload: dict[str, object],
    mock_frontend_logger: Any,
) -> None:
    response = client.post("/api/v1/logs/frontend", json=frontend_log_payload)

    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    assert len(mock_frontend_logger.calls) >= 1


def test_log_file_contains_request_id_and_endpoint_entries(
    client: TestClient,
    frontend_log_payload: dict[str, object],
) -> None:
    client.get("/api/v1/health")
    client.post("/api/v1/logs/frontend", json=frontend_log_payload)

    settings = get_settings()
    log_path = _today_log_file(Path(settings.log_file_path))

    assert log_path.exists()

    content = log_path.read_text(encoding="utf-8")
    assert "| backend.http |" in content
    assert "http.request.completed" in content
    assert "frontend.log.event" in content
    assert "service=backend-test-service" in content
    assert "version=9.9.9-test" in content
    assert "environment=development" in content

    lines = [line for line in content.splitlines() if line.strip()]
    assert any(_line_has_request_id(line) for line in lines)


def _line_has_request_id(line: str) -> bool:
    parts = [segment.strip() for segment in line.split("|")]
    if len(parts) < 4:
        return False
    request_id = parts[3]
    return request_id not in {"", "-"}


def _today_log_file(log_file_path: Path) -> Path:
    prefix = log_file_path.stem
    today = datetime.now().strftime("%Y-%m-%d")
    return log_file_path.parent / f"{prefix}-{today}.log"
