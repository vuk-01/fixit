-- DB.md §7 (helpers), §9 (RLS policies), §6 (triggers).
-- An anonymous session has the `authenticated` role, so no permission depends on that role alone:
-- every helper returns null/false for anonymous sessions (DB.md §1, §7).

------------------------------------------------------------------------------------------------
-- Helpers (private, stable, security definer, empty search_path)
------------------------------------------------------------------------------------------------

-- null for anonymous sessions, guests and users without a profile; a missing
-- is_anonymous claim counts as anonymous
create function private.current_user_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
$$;

create function private.current_institution_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.institution_id
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'official'
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_user_role() = 'admin', false)
$$;

create function private.is_reporter(p_report_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
     and exists (
       select 1 from public.report_private rp
       where rp.report_id = p_report_id and rp.reporter_id = auth.uid()
     )
$$;

create function private.is_public_report(p_status public.report_status, p_hidden_at timestamptz)
returns boolean
language sql stable security definer set search_path = '' as $$
  select p_status <> 'draft' and p_hidden_at is null
$$;

-- "open report" (GLOSSARY, FR-18): the only place this set is defined
create function private.is_open(p_status public.report_status, p_hidden_at timestamptz)
returns boolean
language sql stable security definer set search_path = '' as $$
  select p_status in ('routing', 'sent', 'acknowledged', 'in_progress', 'not_competent')
     and p_hidden_at is null
$$;

-- status transition table from ticket 10 (DB.md §6, trigger 5). Who may make a transition is
-- checked by the RPC functions (DB.md §8.4).
create function private.is_allowed_transition(p_from public.report_status, p_to public.report_status)
returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_from
    when 'draft' then p_to in ('sent', 'routing')
    when 'routing' then p_to in ('sent', 'rejected')
    when 'sent' then p_to in ('acknowledged', 'in_progress', 'resolved', 'rejected', 'not_competent')
    when 'acknowledged' then p_to in ('in_progress', 'resolved', 'rejected', 'not_competent', 'sent')
    when 'in_progress' then p_to in ('resolved', 'rejected', 'not_competent', 'sent')
    when 'not_competent' then p_to in ('rejected', 'sent')
    when 'resolved' then p_to = 'in_progress'
    when 'rejected' then p_to = 'in_progress'
    else false
  end
$$;

-- Policies run these as the caller, so the API roles need EXECUTE (DB.md §2).
revoke execute on function private.current_user_role() from public, anon, authenticated;
revoke execute on function private.current_institution_id() from public, anon, authenticated;
revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function private.is_reporter(uuid) from public, anon, authenticated;
revoke execute on function private.is_public_report(public.report_status, timestamptz) from public, anon, authenticated;
revoke execute on function private.is_open(public.report_status, timestamptz) from public, anon, authenticated;
revoke execute on function private.is_allowed_transition(public.report_status, public.report_status) from public, anon, authenticated;

grant execute on function private.current_user_role() to anon, authenticated, service_role;
grant execute on function private.current_institution_id() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.is_reporter(uuid) to anon, authenticated, service_role;
grant execute on function private.is_public_report(public.report_status, timestamptz) to anon, authenticated, service_role;
grant execute on function private.is_open(public.report_status, timestamptz) to anon, authenticated, service_role;
grant execute on function private.is_allowed_transition(public.report_status, public.report_status) to service_role;

------------------------------------------------------------------------------------------------
-- RLS policies (SELECT only; no INSERT/UPDATE/DELETE policy for anon or authenticated anywhere)
------------------------------------------------------------------------------------------------

create policy "public read" on public.municipalities
  for select to anon, authenticated using (true);

create policy "public read" on public.institutions
  for select to anon, authenticated using (true);

create policy "admin read" on public.jurisdiction_rules
  for select to authenticated using ((select private.is_admin()));

create policy "own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "admin read" on public.profiles
  for select to authenticated using ((select private.is_admin()));

-- reports
create policy "public reports" on public.reports
  for select to anon, authenticated using (status <> 'draft' and hidden_at is null);

create policy "reporter" on public.reports
  for select to authenticated using (private.is_reporter(id));

create policy "recipient official" on public.reports
  for select to authenticated using (institution_id = (select private.current_institution_id()));

create policy "admin read" on public.reports
  for select to authenticated using ((select private.is_admin()));

-- report_details: reporter, recipient official, admin (FR-6: severity only in the panel)
create policy "reporter, recipient official, admin" on public.report_details
  for select to authenticated using (
    private.is_reporter(report_id)
    or exists (
      select 1 from public.reports r
      where r.id = report_id and r.institution_id = (select private.current_institution_id())
    )
    or (select private.is_admin())
  );

-- report_private: reporter and admin only
create policy "reporter" on public.report_private
  for select to authenticated using (
    reporter_id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, true) = false
  );

create policy "admin read" on public.report_private
  for select to authenticated using ((select private.is_admin()));

-- report_photos
create policy "public photos" on public.report_photos
  for select to anon, authenticated using (
    hidden_at is null
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.status <> 'draft' and r.hidden_at is null
    )
  );

create policy "reporter, recipient official, admin" on public.report_photos
  for select to authenticated using (
    private.is_reporter(report_id)
    or exists (
      select 1 from public.reports r
      where r.id = report_id and r.institution_id = (select private.current_institution_id())
    )
    or (select private.is_admin())
  );

-- report_events
create policy "public timeline" on public.report_events
  for select to anon, authenticated using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.status <> 'draft' and r.hidden_at is null
    )
  );

create policy "reporter, recipient official, admin" on public.report_events
  for select to authenticated using (
    private.is_reporter(report_id)
    or exists (
      select 1 from public.reports r
      where r.id = report_id and r.institution_id = (select private.current_institution_id())
    )
    or (select private.is_admin())
  );

-- report_likes: only the owner of the row (anonymous sessions included), not even the admin
create policy "own likes" on public.report_likes
  for select to authenticated using (user_id = (select auth.uid()));

-- letters: an official sees only the letter addressed to their institution, and only while the
-- report is currently addressed to it
create policy "recipient official" on public.letters
  for select to authenticated using (
    institution_id = (select private.current_institution_id())
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.institution_id = letters.institution_id
    )
  );

create policy "reporter, admin" on public.letters
  for select to authenticated using (private.is_reporter(report_id) or (select private.is_admin()));

create policy "admin read" on public.dispatches
  for select to authenticated using ((select private.is_admin()));

create policy "admin read" on public.agent_runs
  for select to authenticated using ((select private.is_admin()));

create policy "admin read" on public.moderation_log
  for select to authenticated using ((select private.is_admin()));

-- report_code_counters: no policy; only next_report_code() touches it

------------------------------------------------------------------------------------------------
-- Triggers (DB.md §6). Functions are private, security definer, empty search_path.
------------------------------------------------------------------------------------------------

-- 1. location and municipality; a point outside Podgorica cannot exist (FR-4)
create function private.set_report_location() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.lat is null or new.lng is null then
    new.location := null;
    new.municipality_id := null;
    return new;
  end if;

  new.location := extensions.st_setsrid(extensions.st_makepoint(new.lng, new.lat), 4326)::extensions.geography;
  new.municipality_id := public.resolve_municipality(new.lat, new.lng);

  if new.municipality_id is null then
    raise exception 'outside_area';
  end if;

  return new;
end;
$$;

-- 2. like counter; every UPDATE on reports is a Realtime event (FR-17)
create function private.update_like_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.reports set like_count = like_count + 1 where id = new.report_id;
  else
    update public.reports set like_count = greatest(like_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end;
$$;

-- 3. role protection: role, institution and demo flag change only outside a user JWT
-- (service key, SQL editor, migrations)
create function private.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.role is distinct from old.role
      or new.institution_id is distinct from old.institution_id
      or new.is_demo is distinct from old.is_demo)
     and coalesce(auth.jwt() ->> 'role', '') in ('anon', 'authenticated')
  then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

-- 4. new user: profile from metadata; the role is never read from metadata (the user writes it)
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_anonymous then
    return new;
  end if;

  -- missing or blank names fail the NOT NULL / CHECK constraints, so sign-up fails (FR-1)
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), '')
  );

  return new;
end;
$$;

-- 5. status transitions and closed_at
create function private.check_status_transition() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not private.is_allowed_transition(old.status, new.status) then
      raise exception 'transition_not_allowed';
    end if;

    if new.status in ('resolved', 'rejected') then
      new.closed_at := now();
    elsif old.status in ('resolved', 'rejected') then
      new.closed_at := null;
    end if;
  end if;
  return new;
end;
$$;

-- 6. at most 3 photos per report
create function private.enforce_photo_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.reports where id = new.report_id for update;

  if (select count(*) from public.report_photos where report_id = new.report_id) >= 3 then
    raise exception 'photo_limit';
  end if;

  return new;
end;
$$;

-- 7. updated_at
create function private.set_updated_at() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trigger functions are never called directly.
revoke execute on function private.set_report_location() from public, anon, authenticated;
revoke execute on function private.update_like_count() from public, anon, authenticated;
revoke execute on function private.protect_profile_role() from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
revoke execute on function private.check_status_transition() from public, anon, authenticated;
revoke execute on function private.enforce_photo_limit() from public, anon, authenticated;
revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger set_location
  before insert or update of lat, lng on public.reports
  for each row execute function private.set_report_location();

create trigger update_like_count
  after insert or delete on public.report_likes
  for each row execute function private.update_like_count();

create trigger protect_role
  before update on public.profiles
  for each row execute function private.protect_profile_role();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger check_status_transition
  before update of status on public.reports
  for each row execute function private.check_status_transition();

create trigger enforce_photo_limit
  before insert on public.report_photos
  for each row execute function private.enforce_photo_limit();

create trigger set_updated_at before update on public.reports
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.report_details
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.institutions
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.jurisdiction_rules
  for each row execute function private.set_updated_at();
