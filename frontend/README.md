# EduAgents Frontend

Next.js student and faculty portals. The UI authenticates with Supabase Auth and sends authenticated requests to the FastAPI backend. Submission state and rubrics are fetched from the API; the browser does not seed mock data into local storage.

## Setup

1. Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Start the FastAPI service from `../backend` (default `http://localhost:8000`).
3. Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Sign in with a Supabase Auth email and password. The trusted account role in `app_metadata.role` controls the portal; supported roles are `student`, `faculty`, and `admin`. Set faculty/admin roles from the Supabase dashboard or a trusted admin process, never from browser-editable user metadata.

Run `../supabase/console_setup.sql` and then `../supabase/seed.sql` in the Supabase SQL Editor before using the portals. See the root README for backend configuration and the project architecture/API docs for the workflow.
