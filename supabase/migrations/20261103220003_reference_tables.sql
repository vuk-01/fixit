-- DB.md §4.1, §4.2. RLS is enabled here without policies (everything closed);
-- policies come in helpers_policies_triggers, right after the helpers they use (DB.md §13).

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  iso_code text not null unique,
  name text not null,
  official_name text not null,
  osm_relation_id bigint not null,
  boundary extensions.geometry(MultiPolygon, 4326) not null,
  boundary_source text not null,
  boundary_snapshot_at date not null,
  created_at timestamptz not null default now()
);

create index municipalities_boundary_idx on public.municipalities using gist (boundary);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  municipality_id uuid null references public.municipalities (id),
  email text null,
  email_source_url text null,
  email_verified_at date null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institutions_email_verified
    check (email is null or (email_source_url is not null and email_verified_at is not null)),
  constraint institutions_email_lowercase check (email = lower(email))
);

create table public.jurisdiction_rules (
  id uuid primary key default gen_random_uuid(),
  category public.report_category not null,
  municipality_id uuid not null references public.municipalities (id),
  institution_id uuid not null references public.institutions (id),
  cc_institution_id uuid null references public.institutions (id),
  source_type public.source_type not null,
  source_url text null,
  source_title text not null,
  source_excerpt text null,
  verified_at date not null,
  verified_by text not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, municipality_id),
  -- "Drugi problem" never has a rule (ticket 13 Q2)
  constraint jurisdiction_rules_no_other check (category <> 'other'),
  constraint jurisdiction_rules_url_for_official
    check (source_type in ('written_confirmation', 'phone_confirmation') or source_url is not null),
  constraint jurisdiction_rules_notes_for_confirmation
    check (source_type in ('official_document', 'official_page') or notes is not null),
  constraint jurisdiction_rules_cc_differs
    check (cc_institution_id is null or cc_institution_id <> institution_id)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role public.user_role not null default 'citizen',
  institution_id uuid null references public.institutions (id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_first_name_valid
    check (char_length(first_name) between 1 and 50 and first_name = btrim(first_name)),
  constraint profiles_last_name_valid
    check (char_length(last_name) between 1 and 50 and last_name = btrim(last_name)),
  constraint profiles_official_has_institution check ((role = 'official') = (institution_id is not null))
);

create index profiles_institution_id_idx on public.profiles (institution_id) where institution_id is not null;

alter table public.municipalities enable row level security;
alter table public.institutions enable row level security;
alter table public.jurisdiction_rules enable row level security;
alter table public.profiles enable row level security;
