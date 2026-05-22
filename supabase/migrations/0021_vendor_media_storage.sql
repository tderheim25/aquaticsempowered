-- Public vendor media (product photos, optional logos) — readable by anon; writes via service role / super-admin app
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-media',
  'vendor-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vendor_media_select_public" on storage.objects;
drop policy if exists "vendor_media_insert_authenticated" on storage.objects;
drop policy if exists "vendor_media_update_authenticated" on storage.objects;
drop policy if exists "vendor_media_delete_authenticated" on storage.objects;

create policy "vendor_media_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'vendor-media');

create policy "vendor_media_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vendor-media' and public.current_role() = 'super_admin');

create policy "vendor_media_update_authenticated"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vendor-media' and public.current_role() = 'super_admin')
  with check (bucket_id = 'vendor-media');

create policy "vendor_media_delete_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vendor-media' and public.current_role() = 'super_admin');
