-- 02_table_policies.sql
-- Enable RLS + per-table policies. Requires 01_helper_functions.sql.

alter table profiles enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table concepts enable row level security;
alter table concept_edges enable row level security;
alter table assignments enable row level security;
alter table assignment_concepts enable row level security;
alter table submissions enable row level security;
alter table submission_concept_feedback enable row level security;
alter table student_concept_mastery enable row level security;

-- profiles
create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "faculty read profiles" on profiles for select using (is_faculty());
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated;
grant update (full_name) on profiles to authenticated;   -- role can't be changed from the client

-- courses / enrollments
create policy "view courses" on courses for select using (can_access_course(id));
create policy "faculty create courses" on courses for insert with check (is_faculty() and faculty_id = auth.uid());
create policy "faculty edit courses" on courses for update using (faculty_id = auth.uid());
create policy "view enrollments" on enrollments for select using (student_id = auth.uid() or owns_course(course_id));
create policy "faculty manage enrollments" on enrollments for all using (owns_course(course_id)) with check (owns_course(course_id));

-- concepts / edges / assignments
create policy "view concepts" on concepts for select using (can_access_course(course_id));
create policy "faculty write concepts" on concepts for all using (owns_course(course_id)) with check (owns_course(course_id));
create policy "view edges" on concept_edges for select using (can_access_course(course_id));
create policy "faculty write edges" on concept_edges for all using (owns_course(course_id)) with check (owns_course(course_id));
create policy "view assignments" on assignments for select using (can_access_course(course_id));
create policy "faculty write assignments" on assignments for all using (owns_course(course_id)) with check (owns_course(course_id));
create policy "view assignment concepts" on assignment_concepts for select
  using (exists (select 1 from assignments a where a.id = assignment_id and can_access_course(a.course_id)));
create policy "faculty write assignment concepts" on assignment_concepts for all
  using (exists (select 1 from assignments a where a.id = assignment_id and owns_course(a.course_id)))
  with check (exists (select 1 from assignments a where a.id = assignment_id and owns_course(a.course_id)));

-- submissions: students insert pending rows only; no client UPDATE at all
create policy "student view own submissions" on submissions for select using (student_id = auth.uid());
create policy "faculty view course submissions" on submissions for select
  using (exists (select 1 from assignments a where a.id = assignment_id and owns_course(a.course_id)));
create policy "student insert own pending" on submissions for insert
  with check (student_id = auth.uid() and status = 'pending' and attempts = 0);

-- feedback and mastery
create policy "student view own feedback" on submission_concept_feedback for select
  using (exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));
create policy "faculty view feedback" on submission_concept_feedback for select
  using (exists (select 1 from submissions s join assignments a on a.id = s.assignment_id
                 where s.id = submission_id and owns_course(a.course_id)));
create policy "student view own mastery" on student_concept_mastery for select using (student_id = auth.uid());
create policy "faculty view course mastery" on student_concept_mastery for select
  using (exists (select 1 from concepts c where c.id = concept_id and owns_course(c.course_id)));
create policy "faculty insert override" on student_concept_mastery for insert
  with check (source = 'faculty_override' and exists (select 1 from concepts c where c.id = concept_id and owns_course(c.course_id)));