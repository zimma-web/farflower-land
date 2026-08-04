-- Run this script in your Supabase Dashboard -> SQL Editor

-- 1. Add status tracking columns for land purchase
alter table public.players add column if not exists has_land boolean not null default false;
alter table public.players add column if not exists land_activated_at timestamptz;

-- 2. Disable Row Level Security (Recommended for simple open setup)
alter table public.players disable row level security;
alter table public.game_farms disable row level security;

grant all on table public.players to anon, authenticated, service_role;
grant all on table public.game_farms to anon, authenticated, service_role;
