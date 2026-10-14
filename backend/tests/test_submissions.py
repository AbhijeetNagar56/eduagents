import io


def test_create_submission_text_content(client):
    payload = {
        "student_id": "STU-2024-999",
        "student_name": "Test Student",
        "student_email": "test@university.edu",
        "assignment_id": "assign-1",
        "assignment_title": "Assignment 1: Sorting Algorithms",
        "course_code": "CS101",
        "rubric_id": "rubric-1",
        "text_content": "# Sorting Analysis\n\n## Implementation\n```python\ndef quicksort(arr): return arr\n```\n## Complexity\nO(N log N) average case.",
    }
    response = client.post("/api/v1/submissions", data=payload)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    sub_data = res_json["data"]
    assert sub_data["studentId"] == "STU-2024-999"
    assert sub_data["courseCode"] == "CS101"
    assert sub_data["status"] == "pending"
    assert sub_data["processingStep"] == "queued"


def test_create_submission_pdf_file(client):
    # Minimal valid PDF bytes
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    files = {"file": ("test_report.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {
        "student_id": "STU-2024-888",
        "student_name": "PDF Student",
        "student_email": "pdf@university.edu",
        "assignment_id": "assign-1",
        "assignment_title": "Assignment 1: Sorting Algorithms",
        "course_code": "CS101",
        "rubric_id": "rubric-1",
    }
    response = client.post("/api/v1/submissions", data=data, files=files)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["fileName"] == "test_report.pdf"
    assert res_json["data"]["fileType"] == "pdf"


def test_create_submission_invalid_file_extension(client):
    files = {"file": ("unsupported.exe", io.BytesIO(b"binary"), "application/octet-stream")}
    data = {
        "student_id": "STU-2024-777",
        "student_name": "Bad File Student",
        "student_email": "bad@university.edu",
        "assignment_id": "assign-1",
        "assignment_title": "Assignment 1",
        "course_code": "CS101",
        "rubric_id": "rubric-1",
    }
    response = client.post("/api/v1/submissions", data=data, files=files)
    assert response.status_code == 400
    res_json = response.json()
    assert res_json["success"] is False
    assert res_json["error"]["code"] == "VALIDATION_ERROR"


def test_list_student_submissions(client):
    response = client.get("/api/v1/submissions")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert "data" in res_json
    assert "meta" in res_json
    assert isinstance(res_json["data"], list)


def test_get_submission_detail(client):
    # Retrieve existing seed submission
    response = client.get("/api/v1/submissions/sub-101")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["id"] == "sub-101"
    assert res_json["data"]["evaluation"] is not None
    assert res_json["data"]["evaluation"]["score"] == 92.0


def test_get_nonexistent_submission_404(client):
    response = client.get("/api/v1/submissions/sub-nonexistent-999")
    assert response.status_code == 404
    res_json = response.json()
    assert res_json["success"] is False
    assert res_json["error"]["code"] == "NOT_FOUND"
