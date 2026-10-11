-- 01_user_migrations.down.sql
-- Reverts 01_user_migrations.up.sql AND the policies in ../policies.

-- Storage policies live on storage.objects, so they are not removed with the tables
drop policy if exists "students upload own files" on storage.objects;
drop policy if exists "students read own files" on storage.objects;
drop policy if exists "faculty read all submissions" on storage.objects;

alter publication supabase_realtime drop table submissions, student_concept_mastery;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Dropping tables also drops their RLS policies
drop table if exists student_concept_mastery;
drop table if exists submission_concept_feedback;
drop table if exists submissions;
drop table if exists assignment_concepts;
drop table if exists assignments;
drop table if exists concept_edges;
drop table if exists concepts;
drop table if exists enrollments;
drop table if exists courses;
drop table if exists profiles;

-- Helpers (after tables/policies that use them are gone)
drop function if exists is_faculty();
drop function if exists can_access_course(uuid);
drop function if exists owns_course(uuid);

-- The bucket is left in place on purpose (it may contain files). Remove manually if needed:
-- delete from storage.buckets where id = 'submissions';