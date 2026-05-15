-- Track when the profile owner last opened the Connections tab so we can show
-- a badge for new followers (follows created after that time) and pending network requests.

alter table public.community_profiles
  add column if not exists last_connections_activity_seen_at timestamptz;
