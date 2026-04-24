-- WiseSquad - Script Final de Banco de Dados
-- Execute no SQL Editor do Supabase

-- 1. TABELA PRINCIPAL DE TEMAS
create table if not exists public.temas (
    id bigint generated always as identity primary key,
    titulo text not null,
    status text not null default 'pendente',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELAS DE CONTEÚDO
create table if not exists public.blog_posts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.linkedin_posts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.youtube_scripts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    thumbnail_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.reels_copies (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.short_video_scripts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.tiktok_scripts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.substack_posts (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    imagem_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. AGENTES CUSTOMIZADOS
create table if not exists public.agentes_customizados (
    id bigint generated always as identity primary key,
    nome text not null,
    prompt_sistema text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.custom_outputs (
    id bigint generated always as identity primary key,
    agent_id bigint not null references public.agentes_customizados(id) on delete cascade,
    tema_id bigint not null references public.temas(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. AUDITORIA (Opcional V2)
create table if not exists public.agent_runs (
    id bigint generated always as identity primary key,
    tema_id bigint not null references public.temas(id) on delete cascade,
    agent_type text not null,
    status text not null,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. RLS ENABLE
alter table public.temas enable row level security;
alter table public.blog_posts enable row level security;
alter table public.linkedin_posts enable row level security;
alter table public.youtube_scripts enable row level security;
alter table public.reels_copies enable row level security;
alter table public.short_video_scripts enable row level security;
alter table public.tiktok_scripts enable row level security;
alter table public.substack_posts enable row level security;
alter table public.agentes_customizados enable row level security;
alter table public.custom_outputs enable row level security;
alter table public.agent_runs enable row level security;

-- 6. SERVICE ROLE POLICIES
create policy "service_role_full_temas" on public.temas for all to service_role using (true) with check (true);
create policy "service_role_full_blog_posts" on public.blog_posts for all to service_role using (true) with check (true);
create policy "service_role_full_linkedin_posts" on public.linkedin_posts for all to service_role using (true) with check (true);
create policy "service_role_full_youtube_scripts" on public.youtube_scripts for all to service_role using (true) with check (true);
create policy "service_role_full_reels_copies" on public.reels_copies for all to service_role using (true) with check (true);
create policy "service_role_full_short_video_scripts" on public.short_video_scripts for all to service_role using (true) with check (true);
create policy "service_role_full_tiktok_scripts" on public.tiktok_scripts for all to service_role using (true) with check (true);
create policy "service_role_full_substack_posts" on public.substack_posts for all to service_role using (true) with check (true);
create policy "service_role_full_agentes_customizados" on public.agentes_customizados for all to service_role using (true) with check (true);
create policy "service_role_full_custom_outputs" on public.custom_outputs for all to service_role using (true) with check (true);
create policy "service_role_full_agent_runs" on public.agent_runs for all to service_role using (true) with check (true);
