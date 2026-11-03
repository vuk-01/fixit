-- DB.md §10. Private bucket, JPEG only, 5 MB. Paths are `<uuid>.jpg` at the bucket root.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 5242880, '{image/jpeg}')
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- The only client write in the whole database. current_user_role() is null for anonymous
-- sessions, guests, officials and admins. No SELECT/UPDATE/DELETE policy: clients do not read,
-- overwrite (no upsert) or delete photos; the server signs URLs and deletes with the admin client.
create policy "citizens upload report photos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'report-photos'
  and (select private.current_user_role()) = 'citizen'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
);

-- begin_submission (security definer, owned by postgres) checks that each photo exists and
-- belongs to the reporter. This makes that read independent of whether postgres bypasses RLS;
-- API clients never run as postgres, so nothing opens for them.
create policy "function owner reads report photos" on storage.objects
for select to postgres
using (bucket_id = 'report-photos');
