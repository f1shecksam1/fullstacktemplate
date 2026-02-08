from fastapi.testclient import TestClient


def test_math_add_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/math/add", params={"a": 2, "b": 3.5})

    assert response.status_code == 200
    assert response.json() == {"a": 2.0, "b": 3.5, "result": 5.5}
