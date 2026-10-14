def test_process_jobs_unauthorized_without_secret(client):
    response = client.post("/internal/process-jobs")
    assert response.status_code == 401
    res_json = response.json()
    assert res_json["success"] is False
    assert res_json["error"]["code"] == "UNAUTHORIZED"


def test_process_jobs_unauthorized_with_wrong_secret(client):
    headers = {"X-Internal-Secret": "wrong-secret-value"}
    response = client.post("/internal/process-jobs", headers=headers)
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_process_jobs_authorized_success(client):
    headers = {"X-Internal-Secret": "test-cron-secret-123"}
    response = client.post("/internal/process-jobs?batch_size=5", headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "processedCount" in data
    assert "succeededCount" in data
    assert "failedCount" in data
    assert "retriedCount" in data
    assert "jobs" in data
    assert isinstance(data["jobs"], list)
