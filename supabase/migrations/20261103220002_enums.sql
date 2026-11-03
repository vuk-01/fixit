-- DB.md §3. A new value is a new migration (`alter type … add value`) plus a label in lib/constants.ts.

create type public.user_role as enum ('citizen', 'official', 'admin');

create type public.report_status as enum (
  'draft', 'routing', 'sent', 'acknowledged', 'in_progress', 'resolved', 'not_competent', 'rejected'
);

create type public.report_category as enum (
  'pothole', 'sidewalk', 'traffic_sign', 'street_light', 'traffic_light', 'manhole',
  'water_leak', 'illegal_dump', 'waste_container', 'greenery', 'graffiti', 'other'
);

create type public.report_severity as enum ('low', 'medium', 'high');

create type public.source_type as enum (
  'official_document', 'official_page', 'written_confirmation', 'phone_confirmation'
);

create type public.jurisdiction_outcome as enum ('matched', 'no_rule', 'no_email');

create type public.routing_reason as enum ('no_rule', 'no_email');

create type public.analysis_status as enum ('pending', 'done', 'failed', 'timed_out');

create type public.category_source as enum ('ai', 'citizen');

create type public.report_event_kind as enum (
  'submitted', 'routed', 'assigned', 'acknowledged', 'status_changed', 'not_competent', 'redirected', 'reopened'
);

create type public.event_actor as enum ('reporter', 'institution', 'fixit');

create type public.letter_kind as enum ('initial', 'assignment', 'redirect');

create type public.dispatch_status as enum ('pending', 'succeeded', 'failed');

create type public.agent_step as enum ('classify', 'jurisdiction', 'duplicates', 'letter', 'send');

create type public.agent_run_outcome as enum ('ok', 'fallback', 'error');

create type public.moderation_action as enum ('hide_report', 'unhide_report', 'hide_photo', 'unhide_photo');
