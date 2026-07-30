-- Run this in the Supabase SQL Editor before deploying /api/me.
-- Browser roles are intentionally denied access; Vercel's service-role key is
-- the only credential allowed to create or update player records.

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  farcaster_fid bigint not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.players enable row level security;
revoke all on table public.players from anon, authenticated;

create table if not exists public.game_farms (
  id bigint generated always as identity primary key,
  player_id uuid not null unique references public.players(id) on delete cascade,
  state jsonb not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_farms enable row level security;
revoke all on table public.game_farms from anon, authenticated;
