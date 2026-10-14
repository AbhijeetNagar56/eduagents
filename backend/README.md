# EduAgents Backend (FastAPI)

FastAPI backend for EduAgents Human-AI Co-Learning platform. Integrates with Supabase (Database, Storage, Realtime) and Google Gemini (Flash-Lite and Flash) for asynchronous assignment evaluation.

## Architecture

- **Ingestion & Queue:** `POST /api/v1/submissions` accepts student PDF/Markdown uploads, writes file to Supabase Storage, and registers a `pending` job in `grading_jobs`.
- **Scheduled Batch Runner:** `POST /internal/process-jobs` (triggered on a 2-minute cron by GitHub Actions) processes batches of pending jobs with shared secret authentication (`X-Internal-Secret`).
- **Two-Step AI Pipeline:**
  - **Stage 1 (Gemini Flash-Lite):** Document parsing, text extraction, layout normalization into validated JSON schema.
  - **Stage 2 (Gemini Flash):** Deep pedagogical rubric evaluation, criterion point scoring, constructive feedback generation.
- **Realtime Broadcast:** Emits WebSocket notifications over Supabase Realtime channel `eduagents-realtime` upon evaluation completion.
- **Faculty Portal Operations:** Grade review, analytics roster filtering, grade override audit logs, Rubric CRUD.

## Quick Start

### 1. Requirements & Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STORAGE_BUCKET_NAME=submissions
INTERNAL_CRON_SECRET=super-secret-cron-token-123
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_LITE=gemini-2.5-flash-lite
GEMINI_MODEL_FLASH=gemini-2.5-flash
PORT=8000
ENVIRONMENT=development
```

### 3. Run FastAPI Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Swagger Interactive Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Diagnostic Check: `http://localhost:8000/health`

### 4. Run Test Suite
```bash
python -m pytest tests -v
```
All 19 test cases validate health check, submission upload, faculty roster, rubric CRUD, overrides, internal cron runner, and the two-stage AI pipeline.
