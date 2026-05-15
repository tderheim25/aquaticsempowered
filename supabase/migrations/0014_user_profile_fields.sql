-- Account profile: name fields + avatar storage path on public.users.
-- Run after 0013.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_path text;

-- Backfill first/last from existing full_name when empty.
update public.users u
set
  first_name = coalesce(
    nullif(trim(u.first_name), ''),
    nullif(split_part(trim(coalesce(u.full_name, '')), ' ', 1), ''),
    ''
  ),
  last_name = coalesce(
    nullif(trim(u.last_name), ''),
    nullif(
      trim(
        substring(
          trim(coalesce(u.full_name, ''))
          from length(split_part(trim(coalesce(u.full_name, '')), ' ', 1)) + 1
        )
      ),
      ''
    ),
    ''
  )
where coalesce(u.full_name, '') <> '';

-- ---------------------------------------------------------------------------
-- Storage: avatars (private; signed URLs in app)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_authenticated" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
