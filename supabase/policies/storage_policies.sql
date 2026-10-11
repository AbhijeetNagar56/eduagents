-- 03_storage_policies.sql
-- Policies for the 'submissions' bucket. Requires 01_helper_functions.sql.

create policy "students upload own files" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "students read own files" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "faculty read all submissions" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and is_faculty());