-- 01_helper_functions.sql
-- Run after migrations (functions reference tables). security definer avoids RLS recursion.

create or replace function is_faculty()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'faculty');
$$;

create or replace function can_access_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from courses where id = cid and faculty_id = auth.uid())
      or exists (select 1 from enrollments where course_id = cid and student_id = auth.uid());
$$;

create or replace function owns_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from courses where id = cid and faculty_id = auth.uid());
$$;