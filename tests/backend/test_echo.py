from fastapi.testclient import TestClient


def test_echo_endpoint(client: TestClient) -> None:
    response = client.post("/api/v1/echo", json={"message": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echoed": "hello", "length": 5}


def test_echo_validation(client: TestClient) -> None:
    response = client.post("/api/v1/echo", json={"message": ""})

    assert response.status_code == 422
