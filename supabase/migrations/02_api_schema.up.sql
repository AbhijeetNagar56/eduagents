-- 02_api_schema.up.sql
-- Schema matching docs/api.md section 4.2 for EduAgents Human-AI Co-Learning Platform

-- Rubrics Table
create table if not exists rubrics (
  id text primary key,
  course_code text not null,
  assignment_title text not null,
  description text,
  total_points numeric not null default 100,
  created_at text default to_char(now(), 'YYYY-MM-DD')
);

-- Rubric Criteria Table
create table if not exists rubric_criteria (
  id text primary key,
  rubric_id text not null references rubrics(id) on delete cascade,
  title text not null,
  description text,
  max_points numeric not null,
  weight_percent numeric,
  order_index int default 0
);

-- Submissions Table (Extended fields for Student & Faculty Portals)
create table if not exists submissions_v2 (
  id text primary key,
  student_id text not null,
  student_name text not null,
  student_email text not null,
  assignment_id text not null,
  assignment_title text not null,
  course_code text not null,
  file_name text not null,
  file_size text not null,
  file_type text not null,
  file_url text,
  content_preview text,
  rubric_id text not null references rubrics(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed', 'flagged')),
  processing_step text check (processing_step in ('queued', 'extracting', 'grading', 'synced')),
  submitted_at timestamptz default now()
);

-- Grading Jobs Table (Async Cron Queue)
create table if not exists grading_jobs (
  id text primary key,
  submission_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed', 'flagged')),
  retry_count int not null default 0,
  error_log text,
  started_at timestamptz,
  completed_at timestamptz
);

-- Evaluations Table (Gemini AI Evaluation Output)
create table if not exists evaluations (
  id text primary key default gen_random_uuid()::text,
  submission_id text not null,
  score numeric not null,
  max_score numeric not null default 100,
  percentage numeric not null,
  summary_feedback text,
  strengths jsonb default '[]'::jsonb,
  improvements jsonb default '[]'::jsonb,
  ai_model_extraction text default 'Gemini Flash-Lite',
  ai_model_grading text default 'Gemini Flash',
  evaluated_at timestamptz default now()
);

-- Criterion Evaluations Table
create table if not exists criterion_evaluations (
  id text primary key default gen_random_uuid()::text,
  evaluation_id text not null references evaluations(id) on delete cascade,
  criterion_id text not null,
  score_awarded numeric not null,
  max_points numeric not null,
  feedback text,
  strengths text,
  improvements text
);

-- Faculty Overrides Table (Audit Trail)
create table if not exists faculty_overrides (
  id text primary key default gen_random_uuid()::text,
  submission_id text not null,
  is_overridden boolean not null default true,
  original_score numeric not null,
  overridden_score numeric not null,
  overridden_by text not null,
  override_reason text not null,
  criterion_adjustments jsonb,
  overridden_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_grading_jobs_status on grading_jobs (status);
create index if not exists idx_submissions_v2_status on submissions_v2 (status);
create index if not exists idx_submissions_v2_course on submissions_v2 (course_code);
create index if not exists idx_submissions_v2_student on submissions_v2 (student_id);

-- Realtime publication
alter publication supabase_realtime add table rubrics, grading_jobs;
