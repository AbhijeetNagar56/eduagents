# Phases
| Phase                  | Goal                                          | Status |
|------------------------|-----------------------------------------------|--------|
| 1 – Foundation         | Repo, Supabase schema, RLS, auth              | Y      |
| 2 – Upload flow        | Student portal UI + FastAPI upload + queue    | Y (Done) |
| 3 – AI pipeline        | Cron, `/internal/process-jobs`, Gemini 2-step grading | Y (Done) |
| 4 – Realtime + Faculty | Live sync, rubrics, override, export          | Y (Done) |
| 5 – Harden & deploy    | Tests (19/19 passing), CI/CD, rate limits     | Y (Done) |