from fastapi.testclient import TestClient

from backend.app.api.v1.endpoints import admin as admin_endpoint


def test_stop_project_endpoint_schedules_shutdown(
    client: TestClient,
    monkeypatch,
) -> None:
    calls: list[str] = []

    def fake_shutdown() -> None:
        calls.append("shutdown")

    monkeypatch.setattr(admin_endpoint, "_request_project_shutdown", fake_shutdown)

    response = client.post("/api/v1/admin/stop-project", json={})

    assert response.status_code == 200
    assert response.json()["status"] == "stopping"
    assert calls == ["shutdown"]
