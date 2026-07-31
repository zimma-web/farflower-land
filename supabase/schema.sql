-- Farflower Land Database Schema for Supabase
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  farcaster_fid bigint not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.game_farms (
  id bigint generated always as identity primary key,
  player_id uuid not null unique references public.players(id) on delete cascade,
  state jsonb not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable public access for API serverless functions
grant all on table public.players to anon, authenticated, service_role;
grant all on table public.game_farms to anon, authenticated, service_role;

alter table public.players disable row level security;
alter table public.game_farms disable row level security;
