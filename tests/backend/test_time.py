from fastapi.testclient import TestClient


def test_time_endpoint_with_mocked_clock(
    client: TestClient,
    frozen_utc_time: str,
) -> None:
    response = client.get("/api/v1/time")

    assert response.status_code == 200
    assert response.json() == {"utc": frozen_utc_time}
