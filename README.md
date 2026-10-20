# EduAgents – Human-AI Co-Learning Agent
Students submit assignments (PDF/MD); AI grades them against faculty rubrics; faculty review and override.

**Stack:** Next.js · FastAPI · Supabase · Gemini · GitHub Actions
**Docs:** [Architecture](docs/architecture.md) · [Design](docs/design.md) · [Phases](docs/phases.md)

## Quick start
1. Run `supabase/console_setup.sql` in **Supabase → SQL Editor**. For the sample course rubrics, run `supabase/seed.sql` afterward.
2. Copy `backend/.env.example` to `backend/.env` and set the Supabase URL, service-role key, Gemini API key, and a unique internal cron secret.
3. Copy `frontend/.env.example` to `frontend/.env.local` and set the Supabase project URL, anon/publishable key, and API URL.
4. Start the API with `cd backend && uvicorn app.main:app --reload --port 8000`.
5. Start the UI with `cd frontend && npm install && npm run dev`, then sign in with a Supabase Auth account. Set `app_metadata.role` to `faculty` for faculty users; new accounts default to `student`.

The browser calls the FastAPI API for submissions, rubrics, overrides, and queue processing. Do not put the Supabase service-role key in frontend environment variables.
