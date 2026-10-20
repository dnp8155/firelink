-- 0004_storage_buckets.sql
-- Two buckets replace the two Base44 file stores:
--   media     -> public uploads (logos, product/service images)  [Base44 UploadPublicFile]
--   documents -> private uploads (verification docs, contracts)  [Base44 UploadPrivateFile]

insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- media: world-readable, only the uploader can change their own files
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated using (bucket_id = 'media' and owner = auth.uid());
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));

-- documents: private. Owner or admin only.
drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects for select to authenticated using (bucket_id = 'documents' and (owner = auth.uid() or public.is_admin()));
drop policy if exists documents_insert on storage.objects;
create policy documents_insert on storage.objects for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists documents_update on storage.objects;
create policy documents_update on storage.objects for update to authenticated using (bucket_id = 'documents' and (owner = auth.uid() or public.is_admin()));
drop policy if exists documents_delete on storage.objects;
create policy documents_delete on storage.objects for delete to authenticated using (bucket_id = 'documents' and (owner = auth.uid() or public.is_admin()));
