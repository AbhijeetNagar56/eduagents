def test_list_faculty_submissions_and_meta(faculty_client):
    response = faculty_client.get("/api/v1/faculty/submissions")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert "data" in res_json
    assert "meta" in res_json
    meta = res_json["meta"]
    assert "total" in meta
    assert "evaluated" in meta
    assert "pending" in meta
    assert "overridden" in meta
    assert "classAverage" in meta


def test_faculty_override_grade(faculty_client):
    override_payload = {
        "overriddenScore": 96.0,
        "overriddenBy": "Dr. Sarah Lin",
        "overrideReason": "Bonus awarded for innovative parallelization benchmarks.",
        "criterionAdjustments": {"crit-1": 35.0, "crit-3": 25.0},
    }
    response = faculty_client.post("/api/v1/faculty/submissions/sub-101/override", json=override_payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["finalScore"] == 96.0
    assert res_json["data"]["isOverridden"] is True

    # Verify updated submission detail reflects override
    detail_res = faculty_client.get("/api/v1/submissions/sub-101")
    detail_json = detail_res.json()
    assert detail_json["data"]["override"]["overriddenScore"] == 96.0


def test_rubrics_crud_lifecycle(faculty_client):
    # 1. List rubrics
    list_res = faculty_client.get("/api/v1/faculty/rubrics")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 3

    # 2. Create new rubric
    create_payload = {
        "courseCode": "CS201",
        "assignmentTitle": "Assignment 4: Dynamic Programming",
        "description": "Memoization and Tabulation techniques assessment.",
        "totalPoints": 100.0,
        "criteria": [
            {
                "title": "Optimal Substructure Proof",
                "description": "Clear recurrence relation equations.",
                "maxPoints": 50.0,
            },
            {
                "title": "Space & Time Complexity Analysis",
                "description": "1D vs 2D state arrays trade-offs.",
                "maxPoints": 50.0,
            },
        ],
    }
    create_res = faculty_client.post("/api/v1/faculty/rubrics", json=create_payload)
    assert create_res.status_code == 201
    created_rubric = create_res.json()["data"]
    rubric_id = created_rubric["id"]
    assert created_rubric["courseCode"] == "CS201"
    assert len(created_rubric["criteria"]) == 2

    # 3. Update rubric
    update_payload = {
        "description": "Updated memoization and tabulation description.",
        "totalPoints": 100.0,
    }
    update_res = faculty_client.put(f"/api/v1/faculty/rubrics/{rubric_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["description"] == "Updated memoization and tabulation description."

    # 4. Delete rubric
    del_res = faculty_client.delete(f"/api/v1/faculty/rubrics/{rubric_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
