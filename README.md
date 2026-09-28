# EduAgents – Human-AI Co-Learning Agent
Students submit assignments (PDF/MD); AI grades them against faculty rubrics; faculty review and override.

**Stack:** Next.js · FastAPI · Supabase · Gemini · GitHub Actions
**Docs:** [Architecture](docs/architecture.md) · [Design](docs/design.md) · [Phases](docs/phases.md)

## Quick start
1. Copy `backend/.env.example` → `.env` and fill in the keys
2. `cd backend && uvicorn app.main:app --reload`
3. `cd frontend && npm i && npm run dev`