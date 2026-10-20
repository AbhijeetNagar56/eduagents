-- EduAgents API schema and policies for the Supabase SQL Editor.
-- Paste and run as a project owner. The FastAPI server uses the service-role key;
-- the policies below protect browser access and are still bypassed by service_role.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student','faculty')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
do $$ begin
  create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
exception when duplicate_object then null;
end $$;

-- Learning graph / course tables from 01_user_migrations.up.sql.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(), code text not null, name text not null,
  faculty_id uuid not null references public.profiles(id), created_at timestamptz default now()
);
create table if not exists public.enrollments (
  course_id uuid references public.courses(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (course_id, student_id)
);
create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  name text not null, description text, pos_x double precision default 0, pos_y double precision default 0, created_at timestamptz default now()
);
create table if not exists public.concept_edges (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  from_concept uuid not null references public.concepts(id) on delete cascade,
  to_concept uuid not null references public.concepts(id) on delete cascade,
  unique (from_concept, to_concept), check (from_concept <> to_concept)
);
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, rubric text, due_date timestamptz not null, created_by uuid references public.profiles(id), created_at timestamptz default now()
);
create table if not exists public.assignment_concepts (
  assignment_id uuid references public.assignments(id) on delete cascade,
  concept_id uuid references public.concepts(id) on delete cascade, primary key (assignment_id, concept_id)
);
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, file_path text not null,
  status text not null default 'pending' check (status in ('pending','processing','graded','failed')),
  attempts int not null default 0, processing_started_at timestamptz, overall_score numeric, feedback_summary text,
  error_message text, is_late boolean default false, created_at timestamptz default now(), unique (assignment_id, student_id)
);
create table if not exists public.submission_concept_feedback (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  mastery_percentage numeric check (mastery_percentage between 0 and 100), feedback_text text
);
create table if not exists public.student_concept_mastery (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  mastery_percentage numeric not null check (mastery_percentage between 0 and 100),
  source text not null default 'ai' check (source in ('ai','faculty_override')), created_at timestamptz default now()
);
create index if not exists legacy_submissions_status_created_idx on public.submissions(status, created_at);
create index if not exists student_concept_mastery_lookup_idx on public.student_concept_mastery(student_id, concept_id, created_at desc);

create table if not exists public.rubrics (
  id text primary key,
  course_code text not null,
  assignment_title text not null,
  description text not null default '',
  total_points numeric not null default 100 check (total_points > 0),
  created_at text not null default to_char(now(), 'YYYY-MM-DD')
);

create table if not exists public.rubric_criteria (
  id text primary key,
  rubric_id text not null references public.rubrics(id) on delete cascade,
  title text not null,
  description text not null default '',
  max_points numeric not null check (max_points >= 0),
  weight_percent numeric,
  order_index integer not null default 0
);

-- The original migration's public.submissions table models a different workflow.
-- The FastAPI API uses submissions_v2 to avoid colliding with that schema.
create table if not exists public.submissions_v2 (
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
  rubric_id text references public.rubrics(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','processing','done','failed','flagged')),
  processing_step text check (processing_step in ('queued','extracting','grading','synced')),
  submitted_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete set null
);

create table if not exists public.grading_jobs (
  id text primary key,
  submission_id text not null references public.submissions_v2(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','done','failed','flagged')),
  retry_count integer not null default 0,
  error_log text,
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.evaluations (
  id text primary key default gen_random_uuid()::text,
  submission_id text not null unique references public.submissions_v2(id) on delete cascade,
  score numeric not null,
  max_score numeric not null default 100,
  percentage numeric not null,
  summary_feedback text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  ai_model_extraction text,
  ai_model_grading text,
  evaluated_at timestamptz not null default now()
);

create table if not exists public.criterion_evaluations (
  id text primary key default gen_random_uuid()::text,
  evaluation_id text not null references public.evaluations(id) on delete cascade,
  criterion_id text not null,
  title text not null default '',
  score_awarded numeric not null,
  max_points numeric not null,
  feedback text not null default '',
  strengths text,
  improvements text
);

create table if not exists public.faculty_overrides (
  id text primary key default gen_random_uuid()::text,
  submission_id text not null references public.submissions_v2(id) on delete cascade,
  is_overridden boolean not null default true,
  original_score numeric not null,
  overridden_score numeric not null,
  overridden_by text not null,
  override_reason text not null,
  criterion_adjustments jsonb,
  overridden_at timestamptz not null default now()
);

-- Bring forward installations that already ran the early 02_api_schema migration.
alter table public.submissions_v2 add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.submissions_v2 alter column rubric_id drop not null;
alter table public.criterion_evaluations add column if not exists title text not null default '';
do $$ begin
  alter table public.grading_jobs add constraint grading_jobs_submission_fk
    foreign key (submission_id) references public.submissions_v2(id) on delete cascade;
exception when duplicate_object then null; when foreign_key_violation then null;
end $$;
do $$ begin
  alter table public.evaluations add constraint evaluations_submission_fk
    foreign key (submission_id) references public.submissions_v2(id) on delete cascade;
exception when duplicate_object then null; when foreign_key_violation then null;
end $$;
do $$ begin
  alter table public.evaluations add constraint evaluations_submission_unique unique (submission_id);
exception when duplicate_object then null; when unique_violation then null;
end $$;

create index if not exists rubric_criteria_rubric_order_idx on public.rubric_criteria(rubric_id, order_index);
create index if not exists submissions_v2_owner_date_idx on public.submissions_v2(owner_id, submitted_at desc);
create index if not exists submissions_v2_course_status_idx on public.submissions_v2(course_code, status);
create index if not exists grading_jobs_status_idx on public.grading_jobs(status);
create index if not exists faculty_overrides_submission_date_idx on public.faculty_overrides(submission_id, overridden_at desc);

create or replace function public.api_is_faculty()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('faculty','admin')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'faculty');
$$;

create or replace function public.owns_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = cid and faculty_id = auth.uid());
$$;
create or replace function public.can_access_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.owns_course(cid) or exists (select 1 from public.enrollments where course_id = cid and student_id = auth.uid());
$$;

alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_edges enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_concepts enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_concept_feedback enable row level security;
alter table public.student_concept_mastery enable row level security;

drop policy if exists "view courses" on public.courses;
create policy "view courses" on public.courses for select to authenticated using (public.can_access_course(id));
drop policy if exists "faculty create courses" on public.courses;
create policy "faculty create courses" on public.courses for insert to authenticated with check (public.api_is_faculty() and faculty_id = auth.uid());
drop policy if exists "faculty edit courses" on public.courses;
create policy "faculty edit courses" on public.courses for update to authenticated using (faculty_id = auth.uid()) with check (faculty_id = auth.uid());
drop policy if exists "view enrollments" on public.enrollments;
create policy "view enrollments" on public.enrollments for select to authenticated using (student_id = auth.uid() or public.owns_course(course_id));
drop policy if exists "faculty manage enrollments" on public.enrollments;
create policy "faculty manage enrollments" on public.enrollments for all to authenticated using (public.owns_course(course_id)) with check (public.owns_course(course_id));
drop policy if exists "view concepts" on public.concepts;
create policy "view concepts" on public.concepts for select to authenticated using (public.can_access_course(course_id));
drop policy if exists "faculty write concepts" on public.concepts;
create policy "faculty write concepts" on public.concepts for all to authenticated using (public.owns_course(course_id)) with check (public.owns_course(course_id));
drop policy if exists "view edges" on public.concept_edges;
create policy "view edges" on public.concept_edges for select to authenticated using (public.can_access_course(course_id));
drop policy if exists "faculty write edges" on public.concept_edges;
create policy "faculty write edges" on public.concept_edges for all to authenticated using (public.owns_course(course_id)) with check (public.owns_course(course_id));
drop policy if exists "view assignments" on public.assignments;
create policy "view assignments" on public.assignments for select to authenticated using (public.can_access_course(course_id));
drop policy if exists "faculty write assignments" on public.assignments;
create policy "faculty write assignments" on public.assignments for all to authenticated using (public.owns_course(course_id)) with check (public.owns_course(course_id));
drop policy if exists "view assignment concepts" on public.assignment_concepts;
create policy "view assignment concepts" on public.assignment_concepts for select to authenticated using (
  exists (select 1 from public.assignments a where a.id = assignment_id and public.can_access_course(a.course_id))
);
drop policy if exists "faculty write assignment concepts" on public.assignment_concepts;
create policy "faculty write assignment concepts" on public.assignment_concepts for all to authenticated using (
  exists (select 1 from public.assignments a where a.id = assignment_id and public.owns_course(a.course_id))
) with check (
  exists (select 1 from public.assignments a where a.id = assignment_id and public.owns_course(a.course_id))
);
drop policy if exists "student view own submissions" on public.submissions;
create policy "student view own submissions" on public.submissions for select to authenticated using (student_id = auth.uid());
drop policy if exists "faculty view course submissions" on public.submissions;
create policy "faculty view course submissions" on public.submissions for select to authenticated using (
  exists (select 1 from public.assignments a where a.id = assignment_id and public.owns_course(a.course_id))
);
drop policy if exists "student insert own pending" on public.submissions;
create policy "student insert own pending" on public.submissions for insert to authenticated with check (
  student_id = auth.uid() and status = 'pending' and attempts = 0
);
drop policy if exists "student view own feedback" on public.submission_concept_feedback;
create policy "student view own feedback" on public.submission_concept_feedback for select to authenticated using (
  exists (select 1 from public.submissions s where s.id = submission_id and s.student_id = auth.uid())
);
drop policy if exists "faculty view feedback" on public.submission_concept_feedback;
create policy "faculty view feedback" on public.submission_concept_feedback for select to authenticated using (
  exists (select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id where s.id = submission_id and public.owns_course(a.course_id))
);
drop policy if exists "student view own mastery" on public.student_concept_mastery;
create policy "student view own mastery" on public.student_concept_mastery for select to authenticated using (student_id = auth.uid());
drop policy if exists "faculty view course mastery" on public.student_concept_mastery;
create policy "faculty view course mastery" on public.student_concept_mastery for select to authenticated using (
  exists (select 1 from public.concepts c where c.id = concept_id and public.owns_course(c.course_id))
);
drop policy if exists "faculty insert override mastery" on public.student_concept_mastery;
create policy "faculty insert override mastery" on public.student_concept_mastery for insert to authenticated with check (
  source = 'faculty_override' and exists (select 1 from public.concepts c where c.id = concept_id and public.owns_course(c.course_id))
);

alter table public.rubrics enable row level security;
alter table public.rubric_criteria enable row level security;
alter table public.submissions_v2 enable row level security;
alter table public.grading_jobs enable row level security;
alter table public.evaluations enable row level security;
alter table public.criterion_evaluations enable row level security;
alter table public.faculty_overrides enable row level security;
alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "authenticated users read rubrics" on public.rubrics;
create policy "authenticated users read rubrics" on public.rubrics for select to authenticated using (true);
drop policy if exists "faculty manage rubrics" on public.rubrics;
create policy "faculty manage rubrics" on public.rubrics for all to authenticated using (public.api_is_faculty()) with check (public.api_is_faculty());
drop policy if exists "authenticated users read rubric criteria" on public.rubric_criteria;
create policy "authenticated users read rubric criteria" on public.rubric_criteria for select to authenticated using (true);
drop policy if exists "faculty manage rubric criteria" on public.rubric_criteria;
create policy "faculty manage rubric criteria" on public.rubric_criteria for all to authenticated using (public.api_is_faculty()) with check (public.api_is_faculty());

drop policy if exists "students read own api submissions" on public.submissions_v2;
create policy "students read own api submissions" on public.submissions_v2 for select to authenticated using (owner_id = auth.uid());
drop policy if exists "faculty read api submissions" on public.submissions_v2;
create policy "faculty read api submissions" on public.submissions_v2 for select to authenticated using (public.api_is_faculty());
drop policy if exists "students create own api submissions" on public.submissions_v2;
create policy "students create own api submissions" on public.submissions_v2 for insert to authenticated with check (owner_id = auth.uid() and status = 'pending');

drop policy if exists "read related grading jobs" on public.grading_jobs;
create policy "read related grading jobs" on public.grading_jobs for select to authenticated using (
  public.api_is_faculty() or exists (select 1 from public.submissions_v2 s where s.id = submission_id and s.owner_id = auth.uid())
);
drop policy if exists "read related evaluations" on public.evaluations;
create policy "read related evaluations" on public.evaluations for select to authenticated using (
  public.api_is_faculty() or exists (select 1 from public.submissions_v2 s where s.id = submission_id and s.owner_id = auth.uid())
);
drop policy if exists "read related criterion evaluations" on public.criterion_evaluations;
create policy "read related criterion evaluations" on public.criterion_evaluations for select to authenticated using (
  public.api_is_faculty() or exists (select 1 from public.evaluations e join public.submissions_v2 s on s.id = e.submission_id where e.id = evaluation_id and s.owner_id = auth.uid())
);
drop policy if exists "read related faculty overrides" on public.faculty_overrides;
create policy "read related faculty overrides" on public.faculty_overrides for select to authenticated using (
  public.api_is_faculty() or exists (select 1 from public.submissions_v2 s where s.id = submission_id and s.owner_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

drop policy if exists "students upload own submissions files" on storage.objects;
create policy "students upload own submissions files" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "students read own submissions files" on storage.objects;
create policy "students read own submissions files" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "faculty read submissions files" on storage.objects;
create policy "faculty read submissions files" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.api_is_faculty());

do $$ begin alter publication supabase_realtime add table public.submissions_v2;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.submissions;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.student_concept_mastery;
exception when duplicate_object then null; when undefined_object then null; end $$;

grant select, insert, update, delete on public.rubrics, public.rubric_criteria to authenticated;
grant select, insert on public.submissions_v2 to authenticated;
grant select on public.grading_jobs, public.evaluations, public.criterion_evaluations, public.faculty_overrides to authenticated;
grant all on public.rubrics, public.rubric_criteria, public.submissions_v2, public.grading_jobs,
  public.evaluations, public.criterion_evaluations, public.faculty_overrides to service_role;
grant select on public.profiles to authenticated;
grant select on public.courses, public.enrollments, public.concepts, public.concept_edges,
  public.assignments, public.assignment_concepts, public.submissions,
  public.submission_concept_feedback, public.student_concept_mastery to authenticated;
grant insert, update, delete on public.courses, public.enrollments, public.concepts,
  public.concept_edges, public.assignments, public.assignment_concepts to authenticated;
grant insert on public.student_concept_mastery to authenticated;
grant all on public.courses, public.enrollments, public.concepts, public.concept_edges,
  public.assignments, public.assignment_concepts, public.submissions,
  public.submission_concept_feedback, public.student_concept_mastery to service_role;
