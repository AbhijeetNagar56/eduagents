# Architecture
Flow: Student Portal → FastAPI → Supabase (file + `pending` job)
→ Cron (2 min) → `/internal/process-jobs` → Gemini (Flash-Lite → Flash)
→ grades written to DB → Realtime pushes to both portals.

| Component | Tech | Role |
|---|---|---|
| Student / Faculty Portal | Next.js (Vercel) | Submit, review, live status |
| Backend API | FastAPI (Render/Fly) | Validate, store, queue |
| DB + Storage + Realtime | Supabase | State, files, live sync, RLS |
| Job runner | GitHub Actions | Drains queue every 2 min |
| AI pipeline | Gemini Flash-Lite + Flash | Extract, then grade |

Job states: `pending → processing → done` (failed jobs retry).
Diagram: [assets/architecture.html](assets/architecture.html)