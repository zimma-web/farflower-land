-- Run this script in your Supabase Dashboard -> SQL Editor
-- This resolves the "42501: new row violates row-level security policy" error.

-- Option 1: Disable Row Level Security (Recommended for simple open setup)
alter table public.players disable row level security;
alter table public.game_farms disable row level security;

grant all on table public.players to anon, authenticated, service_role;
grant all on table public.game_farms to anon, authenticated, service_role;

-- Option 2: Add permissive RLS Policies (if RLS is kept enabled)
drop policy if exists "Allow public insert on players" on public.players;
drop policy if exists "Allow public select on players" on public.players;
drop policy if exists "Allow public update on players" on public.players;

create policy "Allow public insert on players" on public.players for insert to anon, authenticated with check (true);
create policy "Allow public select on players" on public.players for select to anon, authenticated using (true);
create policy "Allow public update on players" on public.players for update to anon, authenticated using (true);

drop policy if exists "Allow public insert on game_farms" on public.game_farms;
drop policy if exists "Allow public select on game_farms" on public.game_farms;
drop policy if exists "Allow public update on game_farms" on public.game_farms;

create policy "Allow public insert on game_farms" on public.game_farms for insert to anon, authenticated with check (true);
create policy "Allow public select on game_farms" on public.game_farms for select to anon, authenticated using (true);
create policy "Allow public update on game_farms" on public.game_farms for update to anon, authenticated using (true);
