# EduAgents Backend API Specification

This document provides the complete API specification for the **EduAgents** backend developer. It details all endpoints, request and response contracts, authentication requirements, background job processing, and AI pipeline integration.

---

## 1. System Overview & Architecture Context

EduAgents is a Human-AI Co-Learning platform where:
1. **Students** submit assignments (PDF or Markdown) via the Next.js frontend.
2. **FastAPI Backend** accepts the file, writes it to **Supabase Storage**, inserts a record in the database with status `pending`, and returns **HTTP 201** immediately.
3. **GitHub Actions Runner** calls `POST /internal/process-jobs` on a **2-minute cron schedule** to drain pending jobs from the queue.
4. **AI Pipeline** evaluates submissions using a sequential two-stage Google Gemini model:
   - **Step 1 (Gemini Flash-Lite):** Document parsing, text extraction, layout normalization into structured JSON.
   - **Step 2 (Gemini Flash):** Deep pedagogical evaluation against faculty rubrics, numerical scoring, constructive feedback.
5. **Supabase Realtime** pushes WebSocket updates to both student and faculty portals as soon as evaluation records are written to Postgres.
6. **Faculty** review class roster submissions, inspect criteria-level scores, override grades with justification rationale, and export CSV/JSON reports.

### Base URLs
- **Local Development:** `http://localhost:8000`
- **FastAPI Interactive Docs (Swagger):** `http://localhost:8000/docs`
- **Production / Staging API:** `https://api.eduagents.app`

---

## 2. Authentication & Authorization

### 2.1 User Authentication (Client Endpoints)
The Next.js frontend authenticates against Supabase Auth. The client passes the Supabase JWT in the standard `Authorization` header:
```http
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```
The FastAPI backend verifies the token using the Supabase JWT Secret or PyJWT and extracts the user claims:
- `sub` (User ID / `student_id` or `faculty_id`)
- `email`
- `role` / `app_metadata.role`: `'student'` | `'faculty'` | `'admin'`

### 2.2 Internal Cron Runner Authentication
The scheduled job runner (`POST /internal/process-jobs`) is invoked by GitHub Actions or an internal cron service. It does not use user sessions; instead, it is secured via a shared secret header:
```http
X-Internal-Secret: <INTERNAL_CRON_SECRET>
```
If the header is missing or does not match `os.getenv("INTERNAL_CRON_SECRET")`, return `401 Unauthorized`.

---

## 3. Standard Response Formats

### 3.1 Standard Success Envelope
For standard single-resource responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource retrieved successfully"
}
```

For list responses:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### 3.2 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file type. Only PDF and Markdown (.md) files are accepted.",
    "details": {
      "fileName": "assignment.docx",
      "allowedTypes": ["application/pdf", "text/markdown", "text/plain"]
    }
  },
  "timestamp": "2026-10-09T01:30:00Z"
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (e.g., submission uploaded).
- `400 Bad Request`: Invalid payload or parameters.
- `401 Unauthorized`: Missing or invalid JWT or internal token.
- `403 Forbidden`: User does not have permission (e.g., student attempting to override a grade).
- `404 Not Found`: Resource ID not found.
- `413 Payload Too Large`: Submission file exceeds maximum limit (default: 25 MB).
- `422 Unprocessable Entity`: Pydantic validation failure.
- `429 Too Many Requests`: Rate limit reached.
- `500 Internal Server Error`: Server exception.

---

## 4. Database Schema & State Lifecycle

### 4.1 Job Lifecycle States (`JobStatus`)
```
[ student upload ] ──> 'pending' ──> [ cron runner picks up ] ──> 'processing'
                                                                       │
                         ┌─────────────────────────────────────────────┴────────┐
                         ▼                                                      ▼
                      'done' (evaluation written)                         'failed' / 'flagged'
                         │                                                      │
                         ▼                                                      ▼
               [ faculty override ]                                    [ retry or manual review ]
```
- `pending`: Submission stored, queued for grading.
- `processing`: Job currently locked and undergoing Gemini Flash-Lite/Flash evaluation.
- `done`: AI grading completed; results stored.
- `flagged`: AI or faculty marked submission for manual review (e.g., low confidence or anomaly).
- `failed`: Temporary error (e.g., Gemini rate limit); will be retried up to `max_retries = 3`.

### 4.2 Database Tables
1. `courses`: `(id, code, name, instructor_id, created_at)`
2. `rubrics`: `(id, course_code, assignment_title, description, total_points, created_at)`
3. `rubric_criteria`: `(id, rubric_id, title, description, max_points, order_index)`
4. `submissions`: `(id, student_id, student_name, student_email, assignment_id, assignment_title, course_code, file_name, file_size, file_type, file_url, rubric_id, status, submitted_at)`
5. `grading_jobs`: `(id, submission_id, status, retry_count, error_log, started_at, completed_at)`
6. `evaluations`: `(id, submission_id, score, max_score, percentage, summary_feedback, strengths, improvements, ai_model_extraction, ai_model_grading, evaluated_at)`
7. `criterion_evaluations`: `(id, evaluation_id, criterion_id, score_awarded, max_points, feedback, strengths, improvements)`
8. `faculty_overrides`: `(id, submission_id, is_overridden, original_score, overridden_score, overridden_by, override_reason, criterion_adjustments, overridden_at)`

---

## 5. Endpoints Specification

### 5.1 Student Endpoints

#### `POST /api/v1/submissions`
**Description:** Accepts student assignment file upload (PDF or Markdown) or raw text content, stores raw file in Supabase Storage (`bucket: "submissions"`), records submission metadata, and creates a `pending` grading job.

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Auth:** Bearer JWT (`student` role)
- **Form Data Parameters:**
  - `file` (UploadFile, optional if `text_content` is provided): Binary file (`.pdf`, `.md`, `.txt`). Max 25 MB.
  - `text_content` (string, optional if `file` is provided): Raw markdown or plain text string.
  - `student_id` (string, required): e.g., `"STU-2024-302"`
  - `student_name` (string, required): e.g., `"Jordan Taylor"`
  - `student_email` (string, required): e.g., `"jordan.taylor@university.edu"`
  - `assignment_id` (string, required): e.g., `"assign-1"`
  - `assignment_title` (string, required): e.g., `"Assignment 1: Sorting Algorithms"`
  - `course_code` (string, required): e.g., `"CS101"`
  - `rubric_id` (string, required): e.g., `"rubric-1"`

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "sub-9842",
    "studentId": "STU-2024-302",
    "studentName": "Jordan Taylor",
    "studentEmail": "jordan.taylor@university.edu",
    "assignmentId": "assign-1",
    "assignmentTitle": "Assignment 1: Sorting Algorithms",
    "courseCode": "CS101",
    "fileName": "jordan_taylor_sorting.pdf",
    "fileSize": "245.8 KB",
    "fileType": "pdf",
    "fileUrl": "https://<supabase-project>.supabase.co/storage/v1/object/public/submissions/sub-9842.pdf",
    "status": "pending",
    "processingStep": "queued",
    "rubricId": "rubric-1",
    "submittedAt": "2026-10-09T01:30:00Z"
  },
  "message": "Submission uploaded and queued for evaluation"
}
```

---

#### `GET /api/v1/submissions`
**Description:** Returns all submissions submitted by the currently authenticated student.

- **Method:** `GET`
- **Auth:** Bearer JWT (`student` role)
- **Query Parameters:**
  - `course_code` (string, optional): Filter by course (e.g., `CS101`).
  - `limit` (integer, default 20): Page size.
  - `offset` (integer, default 0): Pagination offset.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sub-9842",
      "studentId": "STU-2024-302",
      "studentName": "Jordan Taylor",
      "studentEmail": "jordan.taylor@university.edu",
      "assignmentId": "assign-1",
      "assignmentTitle": "Assignment 1: Sorting Algorithms",
      "courseCode": "CS101",
      "fileName": "jordan_taylor_sorting.pdf",
      "fileSize": "245.8 KB",
      "fileType": "pdf",
      "status": "done",
      "submittedAt": "2026-10-09T01:30:00Z",
      "rubricId": "rubric-1",
      "evaluation": {
        "score": 92,
        "maxScore": 100,
        "percentage": 92,
        "summaryFeedback": "Solid implementation with rigorous mathematical bounds.",
        "aiModelExtraction": "Gemini Flash-Lite",
        "aiModelGrading": "Gemini Flash",
        "evaluatedAt": "2026-10-09T01:32:15Z"
      },
      "override": null
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

#### `GET /api/v1/submissions/{id}`
**Description:** Fetches complete details of a specific submission, including rubric criteria evaluations, feedback, and faculty override status.

- **Method:** `GET`
- **Auth:** Bearer JWT (Student who owns the submission, or any Faculty member).

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sub-9842",
    "studentId": "STU-2024-302",
    "studentName": "Jordan Taylor",
    "studentEmail": "jordan.taylor@university.edu",
    "assignmentId": "assign-1",
    "assignmentTitle": "Assignment 1: Sorting Algorithms",
    "courseCode": "CS101",
    "fileName": "jordan_taylor_sorting.pdf",
    "fileSize": "245.8 KB",
    "fileType": "pdf",
    "status": "done",
    "submittedAt": "2026-10-09T01:30:00Z",
    "rubricId": "rubric-1",
    "evaluation": {
      "score": 92,
      "maxScore": 100,
      "percentage": 92,
      "summaryFeedback": "Excellent implementation of hybrid QuickSort and MergeSort. Clear proof of O(N log N) asymptotic bounds.",
      "strengths": [
        "Optimal pivot selection mitigating quadratic worst-case behavior",
        "Clean modular layout with thorough docstrings"
      ],
      "improvements": [
        "Include standard deviation error bars on empirical benchmarks"
      ],
      "criteriaScores": [
        {
          "criterionId": "crit-1",
          "title": "Algorithm Correctness & Implementation",
          "scoreAwarded": 34,
          "maxPoints": 35,
          "feedback": "All test vectors passed accurately.",
          "strengths": "Clean recursion base case.",
          "improvements": "None noted."
        },
        {
          "criterionId": "crit-2",
          "title": "Theoretical Time & Space Complexity",
          "scoreAwarded": 24,
          "maxPoints": 25,
          "feedback": "Rigorous Master Theorem proof provided.",
          "strengths": "Detailed recurrence relation.",
          "improvements": "Clarify auxiliary memory requirements."
        }
      ],
      "aiModelExtraction": "Gemini Flash-Lite",
      "aiModelGrading": "Gemini Flash",
      "evaluatedAt": "2026-10-09T01:32:15Z"
    },
    "override": {
      "isOverridden": true,
      "originalScore": 92,
      "overriddenScore": 95,
      "overriddenBy": "Dr. Sarah Lin",
      "overrideReason": "Awarded 3 bonus points for extra cache locality optimization proof.",
      "overriddenAt": "2026-10-09T01:45:00Z",
      "criterionAdjustments": {
        "crit-1": 35,
        "crit-2": 25
      }
    }
  }
}
```

---

### 5.2 Faculty Endpoints

#### `GET /api/v1/faculty/submissions`
**Description:** Retrieves submissions across the entire class roster with filtering by course, status, and text search.

- **Method:** `GET`
- **Auth:** Bearer JWT (`faculty` role)
- **Query Parameters:**
  - `course_code` (string, optional): e.g., `CS101`
  - `status` (string, optional): `pending`, `processing`, `done`, `flagged`, `overridden`
  - `search` (string, optional): Search by student name, student ID, or assignment title
  - `limit` (integer, default 50): Page size
  - `offset` (integer, default 0): Offset

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [ ... array of submission objects ... ],
  "meta": {
    "total": 34,
    "evaluated": 30,
    "pending": 2,
    "overridden": 4,
    "classAverage": 86.4
  }
}
```

---

#### `POST /api/v1/faculty/submissions/{id}/override`
**Description:** Allows an instructor to override an AI evaluation score. Updates the submission record, recalculates totals, persists the faculty justification, and marks the audit record.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Auth:** Bearer JWT (`faculty` role)
- **Request Body Schema:**
```json
{
  "overriddenScore": 95,
  "overriddenBy": "Dr. Sarah Lin",
  "overrideReason": "Student provided additional empirical benchmark scripts in repo.",
  "criterionAdjustments": {
    "crit-1": 35,
    "crit-2": 25
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub-9842",
    "finalScore": 95,
    "isOverridden": true,
    "override": {
      "isOverridden": true,
      "originalScore": 92,
      "overriddenScore": 95,
      "overriddenBy": "Dr. Sarah Lin",
      "overrideReason": "Student provided additional empirical benchmark scripts in repo.",
      "overriddenAt": "2026-10-09T01:45:00Z",
      "criterionAdjustments": {
        "crit-1": 35,
        "crit-2": 25
      }
    }
  },
  "message": "Grade successfully overridden with faculty audit justification."
}
```

---

#### `GET /api/v1/faculty/rubrics`
**Description:** Lists all available assignment grading rubrics and their criteria.

- **Method:** `GET`
- **Auth:** Bearer JWT (`faculty` or `student` role)
- **Query Parameters:**
  - `course_code` (string, optional)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rubric-1",
      "courseCode": "CS101",
      "assignmentTitle": "Assignment 1: Sorting Algorithms & Complexity",
      "description": "Evaluation criteria for empirical sorting analysis and time complexity justifications.",
      "totalPoints": 100,
      "createdAt": "2026-10-01",
      "criteria": [
        {
          "id": "crit-1",
          "title": "Algorithm Correctness & Implementation",
          "description": "Implements QuickSort, MergeSort, and HeapSort correctly with optimal boundary handling.",
          "maxPoints": 35
        },
        {
          "id": "crit-2",
          "title": "Theoretical Time & Space Complexity",
          "description": "Rigorous Big-O derivation for best, average, and worst-case scenarios.",
          "maxPoints": 25
        }
      ]
    }
  ]
}
```

---

#### `POST /api/v1/faculty/rubrics`
**Description:** Creates a new grading rubric with associated weighted criteria.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Auth:** Bearer JWT (`faculty` role)
- **Request Body Schema:**
```json
{
  "courseCode": "CS101",
  "assignmentTitle": "Assignment 3: Dynamic Programming",
  "description": "Rubric evaluating memoization and bottom-up DP implementations.",
  "criteria": [
    {
      "title": "Recurrence Relation & State Formulation",
      "description": "Defines optimal substructure and subproblem overlapping correctly.",
      "maxPoints": 40
    },
    {
      "title": "Implementation & Test Cases",
      "description": "Handles large N within sub-second runtime constraints.",
      "maxPoints": 40
    },
    {
      "title": "Space Optimization Analysis",
      "description": "Identifies 1D vs 2D state transitions.",
      "maxPoints": 20
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "rubric-3",
    "courseCode": "CS101",
    "assignmentTitle": "Assignment 3: Dynamic Programming",
    "description": "Rubric evaluating memoization and bottom-up DP implementations.",
    "totalPoints": 100,
    "createdAt": "2026-10-09",
    "criteria": [ ... ]
  },
  "message": "Rubric created successfully."
}
```

---

#### `PUT /api/v1/faculty/rubrics/{id}`
**Description:** Updates rubric metadata or criteria point distributions.

- **Method:** `PUT`
- **Content-Type:** `application/json`
- **Auth:** Bearer JWT (`faculty` role)

---

#### `DELETE /api/v1/faculty/rubrics/{id}`
**Description:** Deletes a rubric. If submissions already link to this rubric, existing evaluation snapshots are preserved.

- **Method:** `DELETE`
- **Auth:** Bearer JWT (`faculty` role)

---

### 5.3 Internal Cron Runner Endpoint

#### `POST /internal/process-jobs`
**Description:** The heart of the asynchronous batch runner. Invoked every 2 minutes by GitHub Actions or cloud cron.
1. Queries the `grading_jobs` table for jobs with `status = 'pending'`, ordering by `created_at ASC`, with `LIMIT 10` and `FOR UPDATE SKIP LOCKED`.
2. Marks picked jobs as `processing` and sets `started_at = NOW()`.
3. For each job:
   - Fetches submission file content from Supabase Storage.
   - Fetches the assignment's Rubric criteria.
   - Calls **Gemini Flash-Lite** to extract and normalize document text into clean JSON.
   - Calls **Gemini Flash** with the normalized text and rubric criteria to evaluate, compute scores, and generate constructive feedback.
   - Writes results into `evaluations` and `criterion_evaluations` tables.
   - Updates `submissions.status = 'done'` and `grading_jobs.status = 'done'`.
   - Emits a **Supabase Realtime** broadcast event on channel `grading-updates`.
4. If rate-limited (`HTTP 429`), increments `retry_count`, keeps status as `pending` (or leaves for next cron iteration), and logs the warning.

- **Method:** `POST`
- **Headers:**
  - `X-Internal-Secret: <INTERNAL_CRON_SECRET>`
- **Query Parameters:**
  - `batch_size` (integer, default 10, max 25)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "processedCount": 3,
    "succeededCount": 3,
    "failedCount": 0,
    "retriedCount": 0,
    "jobs": [
      {
        "jobId": "job-101",
        "submissionId": "sub-9842",
        "status": "done",
        "score": 92,
        "durationMs": 4820
      }
    ]
  },
  "message": "Batch completed successfully"
}
```

---

### 5.4 Health & Diagnostics

#### `GET /health`
**Description:** Liveness and readiness check. Returns database latency, storage bucket reachability, and pending queue depth.

- **Method:** `GET`
- **Auth:** None

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "storage": "connected",
  "queue": {
    "pendingJobs": 2,
    "processingJobs": 1,
    "oldestPendingJobAgeSeconds": 45
  },
  "geminiApi": "operational",
  "timestamp": "2026-10-09T01:30:00Z"
}
```

---

## 6. Two-Step Gemini AI Pipeline Schema

### 6.1 Step 1: Ingestion & Extraction (Gemini Flash-Lite)
- **Model:** `gemini-2.5-flash-lite` (or latest flash-lite variant)
- **Purpose:** Low-latency parsing of submitted document (extracting headings, code blocks, mathematical expressions, algorithm steps) into structured JSON.
- **System Instruction:**
  > "You are an academic document parser. Parse the provided student assignment text/document into clean JSON schema. Extract sections, problem answers, code blocks, and theoretical proofs."
- **Output JSON Schema:**
```json
{
  "documentTitle": "Sorting Benchmark Report",
  "authorDeclared": "Jordan Taylor",
  "sections": [
    {
      "sectionTitle": "Part 1: Implementation",
      "content": "...",
      "codeBlocks": [
        { "language": "python", "code": "def quicksort(arr): ..." }
      ]
    },
    {
      "sectionTitle": "Part 2: Time Complexity Proof",
      "content": "By recurrence relation T(n) = 2T(n/2) + O(n)..."
    }
  ],
  "formatValidation": {
    "hasExecutableCode": true,
    "hasTheoreticalAnalysis": true,
    "pageCountEstimate": 4
  }
}
```

### 6.2 Step 2: Evaluation & Reasoning (Gemini Flash)
- **Model:** `gemini-2.5-flash`
- **Purpose:** Deep pedagogical assessment against the rubric criteria. Computes scores and formulates constructive feedback.
- **Input Context:**
  1. Rubric criteria definitions and maximum points.
  2. Structured JSON document output from Step 1.
- **System Instruction:**
  > "You are a university computer science grader. Evaluate the student work objectively against each rubric criterion. Award numerical scores strictly within [0, maxPoints]. Provide actionable feedback, highlighting specific strengths and concrete areas for improvement."
- **Output JSON Schema:**
```json
{
  "totalScore": 92,
  "maxScore": 100,
  "summaryFeedback": "Comprehensive analysis with correct implementations...",
  "strengths": [
    "Efficient pivot selection",
    "Clean empirical visualizations"
  ],
  "improvements": [
    "Clarify worst-case space consumption under recursion limits"
  ],
  "criteriaEvaluations": [
    {
      "criterionId": "crit-1",
      "title": "Algorithm Correctness & Implementation",
      "scoreAwarded": 34,
      "maxPoints": 35,
      "feedback": "All algorithmic requirements satisfied.",
      "strengths": "Correct partition logic.",
      "improvements": "Add defensive type assertions."
    }
  ]
}
```

---

## 7. Supabase Realtime Broadcast Specifications

When the background runner completes or updates a submission, it triggers a Supabase Realtime event so the Next.js frontend updates automatically without manual polling.

- **Channel:** `eduagents-realtime`
- **Topic:** `submissions:{submissionId}` or `course:{courseCode}`
- **Event Name:** `submission:updated`
- **Payload:**
```json
{
  "event": "submission:updated",
  "submissionId": "sub-9842",
  "status": "done",
  "processingStep": "synced",
  "score": 92,
  "maxScore": 100,
  "evaluatedAt": "2026-10-09T01:32:15Z"
}
```

---

## 8. Local Setup & Testing Quick Reference

### Environment Variables (`backend/.env`)
```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INTERNAL_CRON_SECRET=super-secret-cron-token-123
GEMINI_API_KEY=AIzaSy...
STORAGE_BUCKET_NAME=submissions
PORT=8000
```

### Run FastAPI Locally
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Test Submission Upload via cURL
```bash
curl -X POST "http://localhost:8000/api/v1/submissions" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@sample_assignment.pdf;type=application/pdf" \
  -F "student_id=STU-2024-302" \
  -F "student_name=Jordan Taylor" \
  -F "student_email=jordan.taylor@university.edu" \
  -F "assignment_id=assign-1" \
  -F "assignment_title=Assignment 1: Sorting Algorithms" \
  -F "course_code=CS101" \
  -F "rubric_id=rubric-1"
```

### Test Cron Runner Trigger via cURL
```bash
curl -X POST "http://localhost:8000/internal/process-jobs" \
  -H "X-Internal-Secret: super-secret-cron-token-123" \
  -H "Content-Type: application/json"
```

---

*This document is maintained for the EduAgents development team. For architectural background, see [architecture.md](architecture.md) and [agentic_ai_architecture.html](assets/agentic_ai_architecture.html).*
