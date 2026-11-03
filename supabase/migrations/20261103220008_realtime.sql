-- DB.md §11. Only `reports` is published: it carries no user id, and Realtime checks RLS per
-- subscriber, so guests only get events for public reports.
alter publication supabase_realtime add table public.reports;
