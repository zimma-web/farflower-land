-- Run this script in your Supabase Dashboard -> SQL Editor

-- 1. Add status tracking columns for land purchase
alter table public.players add column if not exists has_land boolean not null default false;
alter table public.players add column if not exists land_activated_at timestamptz;

-- 2. Create admin_settings table for database-backed Admin Password storage
create table if not exists public.admin_settings (
  id integer primary key default 1,
  admin_password text not null default 'Akuasw12',
  updated_at timestamptz default now()
);

-- Insert default admin password row if not exists
insert into public.admin_settings (id, admin_password)
values (1, 'Akuasw12')
on conflict (id) do nothing;

-- 3. Disable Row Level Security (Recommended for simple open setup)
alter table public.players disable row level security;
alter table public.game_farms disable row level security;
alter table public.admin_settings disable row level security;

grant all on table public.players to anon, authenticated, service_role;
grant all on table public.game_farms to anon, authenticated, service_role;
grant all on table public.admin_settings to anon, authenticated, service_role;
