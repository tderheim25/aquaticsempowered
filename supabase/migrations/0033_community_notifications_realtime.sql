-- Enable Supabase Realtime for community notification sources (bell icon).
do $$
declare
  t text;
begin
  foreach t in array array[
    'community_network_requests',
    'community_follows',
    'community_post_comments',
    'community_likes'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
