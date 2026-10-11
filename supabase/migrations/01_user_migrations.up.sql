-- 01_user_migrations.up.sql
-- Schema only: tables, indexes, auth trigger, realtime. No RLS here (see ../policies).

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student','faculty')),
  created_at timestamptz default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  faculty_id uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table enrollments (
  course_id uuid references courses(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  primary key (course_id, student_id)
);

create table concepts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  description text,
  pos_x double precision default 0,
  pos_y double precision default 0,
  created_at timestamptz default now()
);

create table concept_edges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  from_concept uuid not null references concepts(id) on delete cascade,
  to_concept uuid not null references concepts(id) on delete cascade,
  unique (from_concept, to_concept),
  check (from_concept <> to_concept)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  rubric text,
  due_date timestamptz not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table assignment_concepts (
  assignment_id uuid references assignments(id) on delete cascade,
  concept_id uuid references concepts(id) on delete cascade,
  primary key (assignment_id, concept_id)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,
  status text not null default 'pending'
    check (status in ('pending','processing','graded','failed')),
  attempts int not null default 0,
  processing_started_at timestamptz,
  overall_score numeric,
  feedback_summary text,
  error_message text,
  is_late boolean default false,
  created_at timestamptz default now(),
  unique (assignment_id, student_id)
);

create table submission_concept_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  mastery_percentage numeric check (mastery_percentage between 0 and 100),
  feedback_text text
);

create table student_concept_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  submission_id uuid references submissions(id) on delete set null,
  mastery_percentage numeric not null check (mastery_percentage between 0 and 100),
  source text not null default 'ai' check (source in ('ai','faculty_override')),
  created_at timestamptz default now()
);

create index on submissions (status, created_at);
create index on student_concept_mastery (student_id, concept_id, created_at desc);

-- Auto-create a profile row for every new auth user
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Realtime
alter publication supabase_realtime add table submissions, student_concept_mastery;

-- Private storage bucket for uploaded submissions
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;