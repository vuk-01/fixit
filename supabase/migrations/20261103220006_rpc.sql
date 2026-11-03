-- DB.md §8. Every function: public, security definer, empty search_path, fully qualified names,
-- and an explicit revoke/grant pair (DB.md §8.1, AGENTS.md rule 4).
-- Client functions take the user only from auth.uid()/JWT; server functions (service_role only)
-- take p_user_id from getClaims() and check in the database that the account is not anonymous.
-- Errors are stable codes in the message (DB.md §8.1); lib/constants.ts maps them to text.

------------------------------------------------------------------------------------------------
-- Internal helper for server functions
------------------------------------------------------------------------------------------------

-- role of a permanent account, null for anonymous users and users without a profile
create function private.account_role(p_user_id uuid) returns public.user_role
language sql stable security definer set search_path = '' as $$
  select p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = p_user_id
    and u.is_anonymous = false
$$;

revoke execute on function private.account_role(uuid) from public, anon, authenticated;

------------------------------------------------------------------------------------------------
-- Location and jurisdiction
------------------------------------------------------------------------------------------------

-- null = outside Podgorica (FR-4); no buffer and no "nearest municipality"
create function public.resolve_municipality(p_lat double precision, p_lng double precision) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.id
  from public.municipalities m
  where extensions.st_covers(
    m.boundary,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)
  )
  limit 1
$$;

-- the only source of a recipient (AGENTS.md rule 1): one level, no ranking, no AI.
-- A cc without a verified email is dropped and is not a reason for routing (ticket 14 Q8).
create function public.resolve_jurisdiction(p_category public.report_category, p_municipality_id uuid)
returns table (
  outcome public.jurisdiction_outcome,
  rule_id uuid,
  institution_id uuid,
  cc_institution_id uuid
)
language sql stable security definer set search_path = '' as $$
  select
    case when r.id is null then 'no_rule'
         when i.email is null or not i.is_active then 'no_email'
         else 'matched' end::public.jurisdiction_outcome,
    r.id,
    case when i.email is not null and i.is_active then r.institution_id end,
    case when i.email is not null and i.is_active
          and cc.email is not null and cc.is_active then r.cc_institution_id end
  from (select 1) as one
  left join public.jurisdiction_rules r
         on r.category = p_category and r.municipality_id = p_municipality_id
  left join public.institutions i on i.id = r.institution_id
  left join public.institutions cc on cc.id = r.cc_institution_id
$$;

-- public part of a rule for "Zašto ova institucija?"; never notes or verified_by (ticket 14 Q7)
create function public.get_jurisdiction_source(p_rule_id uuid)
returns table (
  institution_name text,
  cc_institution_name text,
  source_type public.source_type,
  source_title text,
  source_url text,
  source_excerpt text,
  verified_at date
)
language sql stable security definer set search_path = '' as $$
  select i.name, cc.name, r.source_type, r.source_title, r.source_url, r.source_excerpt, r.verified_at
  from public.jurisdiction_rules r
  join public.institutions i on i.id = r.institution_id
  left join public.institutions cc on cc.id = r.cc_institution_id
  where r.id = p_rule_id
$$;

-- duplicates within 50 m (FR-9); the same 50 is in lib/constants.ts
create function public.find_nearby_open_reports(
  p_category public.report_category,
  p_lat double precision,
  p_lng double precision,
  p_exclude_report_id uuid default null
)
returns table (
  id uuid,
  code text,
  status public.report_status,
  like_count integer,
  submitted_at timestamptz,
  distance_m double precision,
  is_own boolean
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_point extensions.geography;
begin
  if private.current_user_role() is distinct from 'citizen' then
    raise exception 'not_allowed';
  end if;

  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  return query
    select r.id, r.code, r.status, r.like_count, r.submitted_at,
           extensions.st_distance(r.location, v_point),
           private.is_reporter(r.id)
    from public.reports r
    where r.category = p_category
      and private.is_open(r.status, r.hidden_at)
      and r.status <> 'draft' and r.hidden_at is null -- matches the partial gist index
      and (p_exclude_report_id is null or r.id <> p_exclude_report_id)
      and extensions.st_dwithin(r.location, v_point, 50)
    order by extensions.st_distance(r.location, v_point)
    limit 3;
end;
$$;

------------------------------------------------------------------------------------------------
-- Likes (FR-16): the only write an anonymous session can make
------------------------------------------------------------------------------------------------

create function public.like_report(p_report_id uuid)
returns table (liked boolean, already_liked boolean, like_count integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_status public.report_status;
  v_hidden_at timestamptz;
  v_inserted integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- a permanent account must be a citizen; officials, admins and accounts without a profile may not
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
     and private.current_user_role() is distinct from 'citizen' then
    raise exception 'not_allowed';
  end if;

  select r.status, r.hidden_at into v_status, v_hidden_at
  from public.reports r
  where r.id = p_report_id;

  if not found or not private.is_open(v_status, v_hidden_at) then
    raise exception 'report_not_open';
  end if;

  if private.is_reporter(p_report_id) then
    raise exception 'own_report';
  end if;

  insert into public.report_likes (report_id, user_id)
  values (p_report_id, v_uid)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  return query
    select true, v_inserted = 0, r.like_count
    from public.reports r
    where r.id = p_report_id;
end;
$$;

------------------------------------------------------------------------------------------------
-- Draft editing by the reporter (client functions; the Server Action deletes returned paths)
------------------------------------------------------------------------------------------------

create function public.delete_draft(p_report_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.report_status;
  v_paths text[];
begin
  select r.status into v_status from public.reports r where r.id = p_report_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if not private.is_reporter(p_report_id) then
    raise exception 'not_allowed';
  end if;
  if v_status <> 'draft' then
    raise exception 'invalid_state';
  end if;

  select coalesce(array_agg(ph.storage_path order by ph.position), '{}')
  into v_paths
  from public.report_photos ph
  where ph.report_id = p_report_id;

  -- cascades to details, private, photos, unsent letters and dispatches;
  -- agent_runs stays (report_id = null) and still counts toward the daily limit
  delete from public.reports where id = p_report_id;

  return v_paths;
end;
$$;

-- like an existing report and delete the draft in one transaction (ticket 15)
create function public.support_existing_report(p_draft_id uuid, p_report_id uuid)
returns table (like_count integer, removed_paths text[])
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_like_count integer;
  v_paths text[];
begin
  select l.like_count into v_like_count from public.like_report(p_report_id) l;
  v_paths := public.delete_draft(p_draft_id);

  return query select v_like_count, v_paths;
end;
$$;

create function public.add_report_photo(p_report_id uuid, p_storage_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.report_status;
  v_position smallint;
  v_photo_id uuid;
begin
  select r.status into v_status from public.reports r where r.id = p_report_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if not private.is_reporter(p_report_id) then
    raise exception 'not_allowed';
  end if;
  if v_status <> 'draft' then
    raise exception 'invalid_state';
  end if;
  if p_storage_path is null
     or p_storage_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$' then
    raise exception 'invalid_state';
  end if;

  select min(p)::smallint into v_position
  from generate_series(1, 3) as p
  where p not in (select ph.position from public.report_photos ph where ph.report_id = p_report_id);

  if v_position is null then
    raise exception 'photo_limit';
  end if;

  -- the file may still be uploading; begin_submission checks that it exists
  insert into public.report_photos (report_id, storage_path, position)
  values (p_report_id, p_storage_path, v_position)
  returning id into v_photo_id;

  return v_photo_id;
end;
$$;

create function public.remove_report_photo(p_photo_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_report_id uuid;
  v_path text;
  v_status public.report_status;
begin
  select ph.report_id, ph.storage_path into v_report_id, v_path
  from public.report_photos ph
  where ph.id = p_photo_id;
  if not found then
    raise exception 'not_found';
  end if;

  select r.status into v_status from public.reports r where r.id = v_report_id for update;
  if not private.is_reporter(v_report_id) then
    raise exception 'not_allowed';
  end if;
  if v_status <> 'draft' then
    raise exception 'invalid_state';
  end if;
  if (select count(*) from public.report_photos ph where ph.report_id = v_report_id) <= 1 then
    raise exception 'photos_required';
  end if;

  delete from public.report_photos where id = p_photo_id;

  return v_path;
end;
$$;

------------------------------------------------------------------------------------------------
-- Institution panel and /admin (client functions)
------------------------------------------------------------------------------------------------

-- transition 7 (FR-22); in every other case it does nothing and returns the current status
create function public.acknowledge_report(p_report_id uuid) returns public.report_status
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.report_status;
  v_institution_id uuid;
begin
  select r.status, r.institution_id into v_status, v_institution_id
  from public.reports r
  where r.id = p_report_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  if v_status = 'sent' and v_institution_id = private.current_institution_id() then
    update public.reports set status = 'acknowledged' where id = p_report_id;

    insert into public.report_events (report_id, kind, from_status, to_status, actor, institution_id)
    values (p_report_id, 'acknowledged', 'sent', 'acknowledged', 'institution', v_institution_id);

    return 'acknowledged';
  end if;

  return v_status;
end;
$$;

-- transitions 8–12 and 14 (DB.md §8.4); everything else is transition_not_allowed
create function public.set_report_status(
  p_report_id uuid,
  p_to public.report_status,
  p_message text default null
) returns public.report_status
language plpgsql security definer set search_path = '' as $$
declare
  v_from public.report_status;
  v_institution_id uuid;
  v_is_admin boolean := private.is_admin();
  v_is_official boolean;
  v_message text := nullif(btrim(p_message), '');
  v_needs_message boolean := false;
  v_kind public.report_event_kind := 'status_changed';
begin
  select r.status, r.institution_id into v_from, v_institution_id
  from public.reports r
  where r.id = p_report_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  v_is_official := v_institution_id is not null
                   and v_institution_id = private.current_institution_id();

  if not (v_is_admin or v_is_official) then
    raise exception 'not_allowed';
  end if;

  if p_to = 'in_progress' and v_from in ('sent', 'acknowledged') then
    null; -- 8
  elsif p_to = 'resolved' and v_from in ('sent', 'acknowledged', 'in_progress') then
    null; -- 9
  elsif p_to = 'rejected' and v_from in ('sent', 'acknowledged', 'in_progress') then
    v_needs_message := true; -- 10
  elsif p_to = 'rejected' and v_from in ('routing', 'not_competent') and v_is_admin then
    v_needs_message := true; -- 11
  elsif p_to = 'not_competent' and v_from in ('sent', 'acknowledged', 'in_progress') then
    v_needs_message := true; -- 12
    v_kind := 'not_competent';
  elsif p_to = 'in_progress' and v_from in ('resolved', 'rejected') and v_is_admin then
    v_needs_message := true; -- 14
    v_kind := 'reopened';
    -- a report rejected from routing has no recipient to reopen with
    if v_institution_id is null then
      raise exception 'invalid_state';
    end if;
  else
    raise exception 'transition_not_allowed';
  end if;

  if v_needs_message and v_message is null then
    raise exception 'message_required';
  end if;

  -- the transition trigger sets or clears closed_at
  update public.reports set status = p_to where id = p_report_id;

  insert into public.report_events (report_id, kind, from_status, to_status, actor, institution_id, message)
  values (
    p_report_id, v_kind, v_from, p_to,
    case when v_is_official then 'institution' else 'fixit' end::public.event_actor,
    v_institution_id, v_message
  );

  return p_to;
end;
$$;

-- moderation; hiding is not a status (GLOSSARY)
create function public.set_report_hidden(p_report_id uuid, p_hidden boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.reports
  set hidden_at = case when p_hidden then coalesce(hidden_at, now()) end
  where id = p_report_id;
  if not found then
    raise exception 'not_found';
  end if;

  insert into public.moderation_log (report_id, action, admin_id, reason)
  values (
    p_report_id,
    case when p_hidden then 'hide_report' else 'unhide_report' end::public.moderation_action,
    auth.uid(),
    nullif(btrim(p_reason), '')
  );
end;
$$;

create function public.set_photo_hidden(p_photo_id uuid, p_hidden boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_report_id uuid;
begin
  if not private.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.report_photos
  set hidden_at = case when p_hidden then coalesce(hidden_at, now()) end
  where id = p_photo_id
  returning report_id into v_report_id;
  if not found then
    raise exception 'not_found';
  end if;

  insert into public.moderation_log (report_id, photo_id, action, admin_id, reason)
  values (
    v_report_id,
    p_photo_id,
    case when p_hidden then 'hide_photo' else 'unhide_photo' end::public.moderation_action,
    auth.uid(),
    nullif(btrim(p_reason), '')
  );
end;
$$;

------------------------------------------------------------------------------------------------
-- Server functions (service_role only)
------------------------------------------------------------------------------------------------

-- FX-{year}-{number} (FR-24); gaps are allowed
create function public.next_report_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_year integer;
  v_n integer;
begin
  insert into public.report_code_counters as c (year, last_value)
  values (extract(year from now() at time zone 'Europe/Podgorica')::int, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.year, c.last_value into v_year, v_n;

  if v_n > 99999 then
    raise exception 'code_overflow';
  end if;

  return format('FX-%s-%s', v_year, lpad(v_n::text, 5, '0'));
end;
$$;

-- transition 1 and the daily limit (ticket 10 Q11)
create function public.create_draft(p_user_id uuid, p_photo_paths text[])
returns table (report_id uuid, agent_run_id uuid)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_count integer := coalesce(cardinality(p_photo_paths), 0);
  v_is_demo boolean;
  v_report_id uuid;
  v_agent_run_id uuid;
begin
  if private.account_role(p_user_id) is distinct from 'citizen' then
    raise exception 'not_allowed';
  end if;

  if v_count = 0 then
    raise exception 'photos_required';
  end if;
  if v_count > 3 then
    raise exception 'photo_limit';
  end if;
  if exists (
       select 1 from unnest(p_photo_paths) as p(path)
       where p.path is null
          or p.path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
     )
     or (select count(distinct p.path) from unnest(p_photo_paths) as p(path)) <> v_count then
    raise exception 'photos_required';
  end if;

  -- serialise per user so two concurrent requests cannot both pass the limit
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- counts started analyses, not reports, because abandoned drafts are deleted
  if (select count(*) from public.agent_runs a
      where a.user_id = p_user_id and a.step = 'classify'
        and a.started_at >= (date_trunc('day', now() at time zone 'Europe/Podgorica')
                             at time zone 'Europe/Podgorica')) >= 10 then
    raise exception 'daily_limit_reached';
  end if;

  select p.is_demo into v_is_demo from public.profiles p where p.id = p_user_id;

  insert into public.reports (is_demo) values (v_is_demo) returning id into v_report_id;

  insert into public.report_private (report_id, reporter_id) values (v_report_id, p_user_id);

  insert into public.report_details (report_id) values (v_report_id);

  insert into public.report_photos (report_id, storage_path, position, sent_to_model)
  select v_report_id, t.path, t.ord::smallint, true
  from unnest(p_photo_paths) with ordinality as t(path, ord);

  insert into public.agent_runs (report_id, user_id, step, photo_count)
  values (v_report_id, p_user_id, 'classify', v_count)
  returning id into v_agent_run_id;

  return query select v_report_id, v_agent_run_id;
end;
$$;

-- Model result for a draft. p_result is already validated by zod and sanitised (Tech.md §7);
-- personal_data_photos holds photo positions (1–3, as report_photos.position).
-- p_usage: model, stop_reason, input_tokens, output_tokens, duration_ms, error_code, outcome.
-- The agent_runs row is always finished; report data is written only while the report is a draft.
-- reports.category is never set here (only update_draft does that).
create function public.record_classification(
  p_report_id uuid,
  p_agent_run_id uuid,
  p_analysis_status public.analysis_status,
  p_result jsonb,
  p_usage jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.report_status;
begin
  if p_analysis_status = 'pending' then
    raise exception 'invalid_state';
  end if;

  update public.agent_runs a
  set finished_at = now(),
      duration_ms = coalesce(
        (p_usage ->> 'duration_ms')::integer,
        (extract(epoch from now() - a.started_at) * 1000)::integer
      ),
      outcome = coalesce(
        (p_usage ->> 'outcome')::public.agent_run_outcome,
        case when p_analysis_status = 'done' then 'ok' else 'fallback' end::public.agent_run_outcome
      ),
      model = p_usage ->> 'model',
      stop_reason = p_usage ->> 'stop_reason',
      input_tokens = (p_usage ->> 'input_tokens')::integer,
      output_tokens = (p_usage ->> 'output_tokens')::integer,
      error_code = p_usage ->> 'error_code'
  where a.id = p_agent_run_id
    and a.step = 'classify'
    and (a.report_id = p_report_id or a.report_id is null);
  if not found then
    raise exception 'not_found';
  end if;

  select r.status into v_status from public.reports r where r.id = p_report_id for update;
  if not found or v_status <> 'draft' then
    return; -- deleted or already submitted: only the log is written
  end if;

  if p_analysis_status <> 'done' then
    update public.report_details set analysis_status = p_analysis_status where report_id = p_report_id;
    return;
  end if;

  update public.report_details
  set analysis_status = 'done',
      is_municipal_problem = (p_result ->> 'is_municipal_problem')::boolean,
      ai_category = lower(p_result ->> 'category')::public.report_category,
      ai_confidence = round((p_result ->> 'confidence')::numeric, 2),
      title = left(nullif(btrim(p_result ->> 'title'), ''), 120),
      severity = (p_result ->> 'severity')::public.report_severity,
      immediate_danger = coalesce((p_result ->> 'immediate_danger')::boolean, false),
      image_contains_instructions = coalesce((p_result ->> 'image_contains_instructions')::boolean, false)
  where report_id = p_report_id;

  update public.reports
  set description = left(nullif(btrim(p_result ->> 'description'), ''), 1000)
  where id = p_report_id;

  update public.report_photos ph
  set has_personal_data = ph.position in (
    select (x)::smallint
    from jsonb_array_elements_text(coalesce(p_result -> 'personal_data_photos', '[]'::jsonb)) as x
  )
  where ph.report_id = p_report_id and ph.sent_to_model;
end;
$$;

-- confirmed pin, address and current category; the location trigger sets the municipality
-- or raises outside_area
create function public.update_draft(
  p_report_id uuid,
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_address text,
  p_address_source text,
  p_category public.report_category
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.report_status;
  v_address text := nullif(btrim(p_address), '');
begin
  select r.status into v_status from public.reports r where r.id = p_report_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if private.account_role(p_user_id) is distinct from 'citizen'
     or not exists (
       select 1 from public.report_private rp
       where rp.report_id = p_report_id and rp.reporter_id = p_user_id
     ) then
    raise exception 'not_allowed';
  end if;
  if v_status <> 'draft' then
    raise exception 'invalid_state';
  end if;

  update public.reports
  set lat = p_lat,
      lng = p_lng,
      address = v_address,
      address_source = case when v_address is null then null else p_address_source end,
      category = p_category
  where id = p_report_id;
end;
$$;

-- first step of "Pošalji prijavu": final category and description, code, jurisdiction;
-- routing ends here (transition 5), matched continues with start_dispatch
create function public.begin_submission(
  p_report_id uuid,
  p_user_id uuid,
  p_category public.report_category,
  p_description text,
  p_share_contact boolean
)
returns table (
  code text,
  outcome public.jurisdiction_outcome,
  rule_id uuid,
  institution_id uuid,
  cc_institution_id uuid
)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_status public.report_status;
  v_municipality_id uuid;
  v_has_location boolean;
  v_code text;
  v_photos integer;
  v_missing integer;
  v_jurisdiction record;
begin
  select r.status, r.municipality_id, r.location is not null, r.code
  into v_status, v_municipality_id, v_has_location, v_code
  from public.reports r
  where r.id = p_report_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;
  if private.account_role(p_user_id) is distinct from 'citizen'
     or not exists (
       select 1 from public.report_private rp
       where rp.report_id = p_report_id and rp.reporter_id = p_user_id
     ) then
    raise exception 'not_allowed';
  end if;
  if v_status <> 'draft' or not v_has_location or v_municipality_id is null or p_category is null then
    raise exception 'invalid_state';
  end if;

  -- every photo must exist in Storage and be uploaded by this reporter
  select count(*),
         count(*) filter (where not exists (
           select 1 from storage.objects o
           where o.bucket_id = 'report-photos'
             and o.name = ph.storage_path
             and o.owner_id = p_user_id::text
         ))
  into v_photos, v_missing
  from public.report_photos ph
  where ph.report_id = p_report_id;

  if v_photos = 0 then
    raise exception 'photos_required';
  end if;
  if v_missing > 0 then
    raise exception 'photo_missing';
  end if;

  -- the code is assigned on the first press and kept when sending fails (FR-24)
  v_code := coalesce(v_code, public.next_report_code());

  update public.reports r
  set category = p_category,
      description = nullif(btrim(p_description), ''),
      code = v_code
  where r.id = p_report_id;

  update public.report_details d
  set category_source = case when d.ai_category = p_category then 'ai' else 'citizen' end::public.category_source
  where d.report_id = p_report_id;

  update public.report_private rp
  set share_contact = coalesce(p_share_contact, false)
  where rp.report_id = p_report_id;

  select j.outcome, j.rule_id, j.institution_id, j.cc_institution_id
  into v_jurisdiction
  from public.resolve_jurisdiction(p_category, v_municipality_id) j;

  if v_jurisdiction.outcome in ('no_rule', 'no_email') then
    update public.reports r
    set status = 'routing',
        routing_reason = v_jurisdiction.outcome::text::public.routing_reason,
        submitted_at = now()
    where r.id = p_report_id;

    insert into public.report_events (report_id, kind, from_status, to_status, actor)
    values (p_report_id, 'routed', 'draft', 'routing', 'reporter');
  end if;

  return query
    select v_code, v_jurisdiction.outcome, v_jurisdiction.rule_id,
           v_jurisdiction.institution_id, v_jurisdiction.cc_institution_id;
end;
$$;

-- a letter and one send attempt; the server then sends through lib/email/send.ts
create function public.start_dispatch(
  p_report_id uuid,
  p_kind public.letter_kind,
  p_institution_id uuid,
  p_cc_institution_id uuid,
  p_rule_id uuid,
  p_subject text,
  p_body_text text,
  p_includes_contact boolean,
  p_actor_id uuid
)
returns table (letter_id uuid, dispatch_id uuid, to_email text, cc_email text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_status public.report_status;
  v_code text;
  v_category public.report_category;
  v_municipality_id uuid;
  v_current_institution_id uuid;
  v_share_contact boolean;
  v_jurisdiction record;
  v_to_email text;
  v_cc_email text;
  v_cc_institution_id uuid := p_cc_institution_id;
  v_letter_id uuid;
  v_dispatch_id uuid;
begin
  select r.status, r.code, r.category, r.municipality_id, r.institution_id
  into v_status, v_code, v_category, v_municipality_id, v_current_institution_id
  from public.reports r
  where r.id = p_report_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  if p_kind = 'initial' then
    if v_status <> 'draft' or v_code is null then
      raise exception 'invalid_state';
    end if;
    if private.account_role(p_actor_id) is distinct from 'citizen'
       or not exists (
         select 1 from public.report_private rp
         where rp.report_id = p_report_id and rp.reporter_id = p_actor_id
       ) then
      raise exception 'not_allowed';
    end if;
    -- the server cannot substitute another recipient
    select j.outcome, j.rule_id, j.institution_id, j.cc_institution_id
    into v_jurisdiction
    from public.resolve_jurisdiction(v_category, v_municipality_id) j;
    if v_jurisdiction.outcome <> 'matched'
       or v_jurisdiction.institution_id is distinct from p_institution_id
       or v_jurisdiction.rule_id is distinct from p_rule_id
       or v_jurisdiction.cc_institution_id is distinct from p_cc_institution_id then
      raise exception 'not_allowed';
    end if;
  elsif p_kind = 'assignment' then
    if v_status <> 'routing' or p_rule_id is not null then
      raise exception 'invalid_state';
    end if;
    if private.account_role(p_actor_id) is distinct from 'admin' then
      raise exception 'not_allowed';
    end if;
  elsif p_kind = 'redirect' then
    if v_status not in ('not_competent', 'sent', 'acknowledged', 'in_progress') or p_rule_id is not null then
      raise exception 'invalid_state';
    end if;
    if private.account_role(p_actor_id) is distinct from 'admin' then
      raise exception 'not_allowed';
    end if;
    if p_institution_id = v_current_institution_id then
      raise exception 'same_institution';
    end if;
  end if;

  -- the contact is in the letter only with the citizen's consent
  select rp.share_contact into v_share_contact from public.report_private rp where rp.report_id = p_report_id;
  if coalesce(p_includes_contact, false) and not coalesce(v_share_contact, false) then
    raise exception 'not_allowed';
  end if;

  select i.email into v_to_email
  from public.institutions i
  where i.id = p_institution_id and i.is_active;
  if v_to_email is null then
    raise exception 'no_verified_email';
  end if;

  -- a cc goes only to a verified address
  if v_cc_institution_id is not null then
    select i.email into v_cc_email
    from public.institutions i
    where i.id = v_cc_institution_id and i.is_active and i.id <> p_institution_id;
    if v_cc_email is null then
      v_cc_institution_id := null;
    end if;
  end if;

  -- an attempt that has been pending for over 2 minutes must not lock the report forever
  update public.dispatches d
  set status = 'failed', error_code = 'stale', finished_at = now()
  where d.report_id = p_report_id
    and d.status = 'pending'
    and d.started_at < now() - interval '2 minutes';

  insert into public.letters as l (
    report_id, kind, institution_id, cc_institution_id, jurisdiction_rule_id,
    to_email, cc_email, subject, body_text, includes_contact
  )
  values (
    p_report_id, p_kind, p_institution_id, v_cc_institution_id, p_rule_id,
    v_to_email, v_cc_email, p_subject, p_body_text, coalesce(p_includes_contact, false)
  )
  on conflict (report_id, institution_id) where sent_at is null
  do update set
    kind = excluded.kind,
    cc_institution_id = excluded.cc_institution_id,
    jurisdiction_rule_id = excluded.jurisdiction_rule_id,
    to_email = excluded.to_email,
    cc_email = excluded.cc_email,
    subject = excluded.subject,
    body_text = excluded.body_text,
    includes_contact = excluded.includes_contact
  returning l.id into v_letter_id;

  -- email_mode is a placeholder until complete_dispatch records what send.ts actually applied
  begin
    insert into public.dispatches (letter_id, report_id, email_mode)
    values (v_letter_id, p_report_id, 'test')
    returning id into v_dispatch_id;
  exception when unique_violation then
    raise exception 'dispatch_in_progress';
  end;

  return query select v_letter_id, v_dispatch_id, v_to_email, v_cc_email;
end;
$$;

-- outcome of a send attempt; on success, transitions 3, 6 or 13 in the same transaction
create function public.complete_dispatch(
  p_dispatch_id uuid,
  p_succeeded boolean,
  p_email_mode text,
  p_delivered_to text[],
  p_provider_message_id text,
  p_error_code text
) returns public.report_status
language plpgsql security definer set search_path = '' as $$
declare
  v_report_id uuid;
  v_dispatch_status public.dispatch_status;
  v_letter_id uuid;
  v_status public.report_status;
  v_previous_institution_id uuid;
  v_letter public.letters;
begin
  select d.report_id into v_report_id from public.dispatches d where d.id = p_dispatch_id;
  if not found then
    raise exception 'not_found';
  end if;

  -- same lock order as start_dispatch: report first, then dispatch
  select r.status, r.institution_id into v_status, v_previous_institution_id
  from public.reports r
  where r.id = v_report_id
  for update;

  select d.status, d.letter_id into v_dispatch_status, v_letter_id
  from public.dispatches d
  where d.id = p_dispatch_id
  for update;
  if v_dispatch_status <> 'pending' then
    raise exception 'invalid_state';
  end if;

  if not coalesce(p_succeeded, false) then
    -- transition 4: the draft keeps its code, submitted_at stays null
    update public.dispatches
    set status = 'failed', finished_at = now(), email_mode = p_email_mode,
        delivered_to = p_delivered_to, error_code = p_error_code
    where id = p_dispatch_id;
    return v_status;
  end if;

  update public.dispatches
  set status = 'succeeded', finished_at = now(), email_mode = p_email_mode,
      delivered_to = p_delivered_to, provider_message_id = p_provider_message_id
  where id = p_dispatch_id;

  update public.letters
  set sent_at = coalesce(sent_at, now())
  where id = v_letter_id
  returning * into v_letter;

  -- if the status changed meanwhile (e.g. an admin rejected it), the attempt is still recorded
  -- as succeeded but no transition is made
  if v_letter.kind = 'initial' and v_status = 'draft' then
    update public.reports
    set status = 'sent', submitted_at = now(),
        institution_id = v_letter.institution_id,
        cc_institution_id = v_letter.cc_institution_id,
        jurisdiction_rule_id = v_letter.jurisdiction_rule_id
    where id = v_report_id;

    insert into public.report_events (report_id, kind, from_status, to_status, actor, institution_id)
    values (v_report_id, 'submitted', 'draft', 'sent', 'reporter', v_letter.institution_id);

    v_status := 'sent';
  elsif v_letter.kind = 'assignment' and v_status = 'routing' then
    update public.reports
    set status = 'sent',
        institution_id = v_letter.institution_id,
        cc_institution_id = v_letter.cc_institution_id,
        jurisdiction_rule_id = null
    where id = v_report_id;

    insert into public.report_events (report_id, kind, from_status, to_status, actor, institution_id)
    values (v_report_id, 'assigned', 'routing', 'sent', 'fixit', v_letter.institution_id);

    v_status := 'sent';
  elsif v_letter.kind = 'redirect'
        and v_status in ('not_competent', 'sent', 'acknowledged', 'in_progress')
        and v_previous_institution_id is distinct from v_letter.institution_id then
    update public.reports
    set status = 'sent',
        institution_id = v_letter.institution_id,
        cc_institution_id = v_letter.cc_institution_id,
        jurisdiction_rule_id = null
    where id = v_report_id;

    insert into public.report_events (
      report_id, kind, from_status, to_status, actor, institution_id, previous_institution_id
    )
    values (
      v_report_id, 'redirected', v_status, 'sent', 'fixit',
      v_letter.institution_id, v_previous_institution_id
    );

    v_status := 'sent';
  end if;

  return v_status;
end;
$$;

-- "Ranije prijave…" line of the letter (FR-11): earlier submitted, non-hidden reports of the
-- same category within 50 m, resolved and rejected included (ticket 10 Q10)
create function public.count_previous_reports(p_report_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer
  from public.reports r
  join public.reports o
    on o.id <> r.id
   and o.category = r.category
   and o.status <> 'draft'
   and o.hidden_at is null
   and o.submitted_at < coalesce(r.submitted_at, now())
   and extensions.st_dwithin(o.location, r.location, 50)
  where r.id = p_report_id
$$;

-- FR-25; the code counter is never wound back
create function public.clear_demo_data() returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
begin
  select coalesce(array_agg(ph.storage_path), '{}')
  into v_paths
  from public.report_photos ph
  join public.reports r on r.id = ph.report_id
  where r.is_demo;

  delete from public.agent_runs a
  where a.user_id in (select p.id from public.profiles p where p.is_demo);

  delete from public.reports where is_demo;

  return v_paths;
end;
$$;

------------------------------------------------------------------------------------------------
-- Grants (DB.md §8.2)
------------------------------------------------------------------------------------------------

revoke execute on function public.resolve_municipality(double precision, double precision) from public, anon, authenticated;
grant execute on function public.resolve_municipality(double precision, double precision) to authenticated, service_role;

revoke execute on function public.resolve_jurisdiction(public.report_category, uuid) from public, anon, authenticated;
grant execute on function public.resolve_jurisdiction(public.report_category, uuid) to authenticated, service_role;

revoke execute on function public.get_jurisdiction_source(uuid) from public, anon, authenticated;
grant execute on function public.get_jurisdiction_source(uuid) to anon, authenticated, service_role;

revoke execute on function public.find_nearby_open_reports(public.report_category, double precision, double precision, uuid) from public, anon, authenticated;
grant execute on function public.find_nearby_open_reports(public.report_category, double precision, double precision, uuid) to authenticated;

revoke execute on function public.like_report(uuid) from public, anon, authenticated;
grant execute on function public.like_report(uuid) to authenticated;

revoke execute on function public.support_existing_report(uuid, uuid) from public, anon, authenticated;
grant execute on function public.support_existing_report(uuid, uuid) to authenticated;

revoke execute on function public.add_report_photo(uuid, text) from public, anon, authenticated;
grant execute on function public.add_report_photo(uuid, text) to authenticated;

revoke execute on function public.remove_report_photo(uuid) from public, anon, authenticated;
grant execute on function public.remove_report_photo(uuid) to authenticated;

revoke execute on function public.delete_draft(uuid) from public, anon, authenticated;
grant execute on function public.delete_draft(uuid) to authenticated;

revoke execute on function public.acknowledge_report(uuid) from public, anon, authenticated;
grant execute on function public.acknowledge_report(uuid) to authenticated;

revoke execute on function public.set_report_status(uuid, public.report_status, text) from public, anon, authenticated;
grant execute on function public.set_report_status(uuid, public.report_status, text) to authenticated;

revoke execute on function public.set_report_hidden(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.set_report_hidden(uuid, boolean, text) to authenticated;

revoke execute on function public.set_photo_hidden(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.set_photo_hidden(uuid, boolean, text) to authenticated;

revoke execute on function public.create_draft(uuid, text[]) from public, anon, authenticated;
grant execute on function public.create_draft(uuid, text[]) to service_role;

revoke execute on function public.record_classification(uuid, uuid, public.analysis_status, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_classification(uuid, uuid, public.analysis_status, jsonb, jsonb) to service_role;

revoke execute on function public.update_draft(uuid, uuid, double precision, double precision, text, text, public.report_category) from public, anon, authenticated;
grant execute on function public.update_draft(uuid, uuid, double precision, double precision, text, text, public.report_category) to service_role;

revoke execute on function public.begin_submission(uuid, uuid, public.report_category, text, boolean) from public, anon, authenticated;
grant execute on function public.begin_submission(uuid, uuid, public.report_category, text, boolean) to service_role;

revoke execute on function public.start_dispatch(uuid, public.letter_kind, uuid, uuid, uuid, text, text, boolean, uuid) from public, anon, authenticated;
grant execute on function public.start_dispatch(uuid, public.letter_kind, uuid, uuid, uuid, text, text, boolean, uuid) to service_role;

revoke execute on function public.complete_dispatch(uuid, boolean, text, text[], text, text) from public, anon, authenticated;
grant execute on function public.complete_dispatch(uuid, boolean, text, text[], text, text) to service_role;

revoke execute on function public.count_previous_reports(uuid) from public, anon, authenticated;
grant execute on function public.count_previous_reports(uuid) to service_role;

revoke execute on function public.next_report_code() from public, anon, authenticated;
grant execute on function public.next_report_code() to service_role;

revoke execute on function public.clear_demo_data() from public, anon, authenticated;
grant execute on function public.clear_demo_data() to service_role;
