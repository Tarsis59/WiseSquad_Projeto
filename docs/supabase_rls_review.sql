-- WiseSquad - RLS baseline for critical tables
-- Run manually in Supabase SQL editor after reviewing your role strategy.

-- 1) Enable RLS
alter table if exists public.temas enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.linkedin_posts enable row level security;
alter table if exists public.youtube_scripts enable row level security;
alter table if exists public.reels_copies enable row level security;
alter table if exists public.short_video_scripts enable row level security;
alter table if exists public.agentes_customizados enable row level security;

-- 2) Service role full access (used by backend server)
drop policy if exists "service_role_full_temas" on public.temas;
create policy "service_role_full_temas"
on public.temas
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_blog_posts" on public.blog_posts;
create policy "service_role_full_blog_posts"
on public.blog_posts
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_linkedin_posts" on public.linkedin_posts;
create policy "service_role_full_linkedin_posts"
on public.linkedin_posts
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_youtube_scripts" on public.youtube_scripts;
create policy "service_role_full_youtube_scripts"
on public.youtube_scripts
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_reels_copies" on public.reels_copies;
create policy "service_role_full_reels_copies"
on public.reels_copies
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_short_video_scripts" on public.short_video_scripts;
create policy "service_role_full_short_video_scripts"
on public.short_video_scripts
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_agentes_customizados" on public.agentes_customizados;
create policy "service_role_full_agentes_customizados"
on public.agentes_customizados
for all
to service_role
using (true)
with check (true);

-- 3) Optional read-only authenticated policies (if you expose direct client reads later)
-- Example:
-- create policy "authenticated_read_temas"
-- on public.temas
-- for select
-- to authenticated
-- using (true);
