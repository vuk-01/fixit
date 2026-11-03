-- DB.md §4.3–§4.5. `reports` and everything public about a report carry no user id (DB.md §1, §5).
-- RLS is enabled without policies; policies come in helpers_policies_triggers (DB.md §13).

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  code text null unique,
  status public.report_status not null default 'draft',
  category public.report_category null,
  lat double precision null,
  lng double precision null,
  location extensions.geography(Point, 4326) null,
  municipality_id uuid null references public.municipalities (id),
  address text null,
  address_source text null,
  description text null,
  institution_id uuid null references public.institutions (id),
  cc_institution_id uuid null references public.institutions (id),
  jurisdiction_rule_id uuid null references public.jurisdiction_rules (id),
  routing_reason public.routing_reason null,
  like_count integer not null default 0,
  is_demo boolean not null default false,
  hidden_at timestamptz null,
  is_hidden boolean generated always as (hidden_at is not null) stored,
  submitted_at timestamptz null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_code_format check (code ~ '^FX-[0-9]{4}-[0-9]{5}$'),
  constraint reports_address_source check (address_source in ('nominatim', 'photon')),
  constraint reports_description_length check (description is null or char_length(description) between 1 and 1000),
  constraint reports_like_count_non_negative check (like_count >= 0),
  constraint reports_submitted_unless_draft check ((status = 'draft') = (submitted_at is null)),
  constraint reports_closed_iff_final check ((status in ('resolved', 'rejected')) = (closed_at is not null)),
  constraint reports_complete_unless_draft check (
    status = 'draft'
    or (code is not null and category is not null and location is not null and municipality_id is not null)
  ),
  constraint reports_recipient_when_sent check (
    status not in ('sent', 'acknowledged', 'in_progress', 'not_competent') or institution_id is not null
  ),
  constraint reports_no_recipient_before_sent check (
    status not in ('draft', 'routing')
    or (institution_id is null and cc_institution_id is null and jurisdiction_rule_id is null)
  ),
  constraint reports_routing_has_reason check (status <> 'routing' or routing_reason is not null),
  constraint reports_cc_differs check (cc_institution_id is null or cc_institution_id <> institution_id),
  constraint reports_lat_lng_together check ((lat is null) = (lng is null)),
  constraint reports_lat_lng_range check (lat is null or (lat between -90 and 90 and lng between -180 and 180))
);

create index reports_location_public_idx on public.reports using gist (location)
  where status <> 'draft' and hidden_at is null;
create index reports_institution_status_idx on public.reports (institution_id, status);
create index reports_status_submitted_idx on public.reports (status, submitted_at);
create index reports_is_demo_idx on public.reports (is_demo) where is_demo;

create table public.report_details (
  report_id uuid primary key references public.reports (id) on delete cascade,
  analysis_status public.analysis_status not null default 'pending',
  is_municipal_problem boolean null,
  ai_category public.report_category null,
  ai_confidence numeric(3, 2) null,
  category_source public.category_source null,
  title text null,
  severity public.report_severity null,
  immediate_danger boolean not null default false,
  image_contains_instructions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_details_confidence_range check (ai_confidence between 0 and 1),
  constraint report_details_title_length check (title is null or char_length(title) between 1 and 120)
);

create table public.report_private (
  report_id uuid primary key references public.reports (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id),
  share_contact boolean not null default false,
  created_at timestamptz not null default now()
);

create index report_private_reporter_id_idx on public.report_private (reporter_id);

create table public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null unique,
  position smallint not null,
  sent_to_model boolean not null default false,
  has_personal_data boolean not null default false,
  hidden_at timestamptz null,
  created_at timestamptz not null default now(),
  -- `<uuid>.jpg` at the bucket root, no user or report id (DB.md §10)
  constraint report_photos_path_format
    check (storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'),
  constraint report_photos_position_range check (position between 1 and 3),
  unique (report_id, position)
);

create index report_photos_report_id_idx on public.report_photos (report_id);

create table public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  kind public.report_event_kind not null,
  from_status public.report_status null,
  to_status public.report_status not null,
  actor public.event_actor not null,
  institution_id uuid null references public.institutions (id),
  previous_institution_id uuid null references public.institutions (id),
  message text null,
  created_at timestamptz not null default now(),
  constraint report_events_message_length check (message is null or char_length(message) between 1 and 1000)
);

create index report_events_report_created_idx on public.report_events (report_id, created_at);

create table public.report_likes (
  report_id uuid not null references public.reports (id) on delete cascade,
  -- intentionally no FK to auth.users: deleting an (anonymous) user must not lower the count (ticket 11)
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index report_likes_user_id_idx on public.report_likes (user_id);

create table public.report_code_counters (
  year integer primary key,
  last_value integer not null,
  created_at timestamptz not null default now()
);

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  kind public.letter_kind not null,
  institution_id uuid not null references public.institutions (id),
  cc_institution_id uuid null references public.institutions (id),
  jurisdiction_rule_id uuid null references public.jurisdiction_rules (id),
  to_email text not null,
  cc_email text null,
  subject text not null,
  body_text text not null,
  includes_contact boolean not null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index letters_report_id_idx on public.letters (report_id);
-- at most one unsent letter per institution; a retry reuses the same row
create unique index letters_one_unsent_per_institution on public.letters (report_id, institution_id)
  where sent_at is null;

create table public.dispatches (
  id uuid primary key default gen_random_uuid(), -- also the Resend Idempotency-Key
  letter_id uuid not null references public.letters (id) on delete cascade,
  report_id uuid not null references public.reports (id) on delete cascade,
  status public.dispatch_status not null default 'pending',
  email_mode text not null,
  delivered_to text[] null,
  provider_message_id text null,
  error_code text null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint dispatches_email_mode check (email_mode in ('test', 'live'))
);

create index dispatches_letter_id_idx on public.dispatches (letter_id);
-- no two concurrent sends of the same report (double tap, two admins)
create unique index dispatches_one_pending_per_report on public.dispatches (report_id) where status = 'pending';
-- a letter is successfully sent at most once
create unique index dispatches_one_success_per_letter on public.dispatches (letter_id) where status = 'succeeded';

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  -- the row outlives a deleted draft, so the daily limit still counts it
  report_id uuid null references public.reports (id) on delete set null,
  user_id uuid null references auth.users (id) on delete set null,
  step public.agent_step not null,
  model text null,
  photo_count smallint null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  duration_ms integer null,
  outcome public.agent_run_outcome null,
  stop_reason text null,
  input_tokens integer null,
  output_tokens integer null,
  error_code text null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index agent_runs_daily_limit_idx on public.agent_runs (user_id, step, started_at);
create index agent_runs_report_id_idx on public.agent_runs (report_id);

create table public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  photo_id uuid null references public.report_photos (id) on delete cascade,
  action public.moderation_action not null,
  admin_id uuid not null references public.profiles (id),
  reason text null,
  created_at timestamptz not null default now()
);

create index moderation_log_report_id_idx on public.moderation_log (report_id);

alter table public.reports enable row level security;
alter table public.report_details enable row level security;
alter table public.report_private enable row level security;
alter table public.report_photos enable row level security;
alter table public.report_events enable row level security;
alter table public.report_likes enable row level security;
alter table public.report_code_counters enable row level security;
alter table public.letters enable row level security;
alter table public.dispatches enable row level security;
alter table public.agent_runs enable row level security;
alter table public.moderation_log enable row level security;

-- Table privileges, independent of the project's auto-expose default. Clients only read (through
-- RLS); every write goes through the security definer functions in DB.md §8 or the service key
-- (DB.md §9). Revoking writes is a second lock next to the missing write policies.
grant select on all tables in schema public to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
