-- DB.md §2: PostGIS lives in `extensions` (not `public`, so spatial_ref_sys is not exposed
-- through the Data API); RLS and trigger helpers live in `private`, which is not exposed.

create extension if not exists postgis with schema extensions;

create schema if not exists private;

-- RLS policies call private helpers on behalf of the caller (DB.md §2, §7).
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- New functions in `private` must not be executable by everyone by default;
-- every function still gets an explicit revoke/grant pair (AGENTS.md rule 4).
alter default privileges in schema private revoke execute on functions from public;
