import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://arknbagrkoeslhudyien.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya25iYWdya29lc2xodWR5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzg2OTAsImV4cCI6MjEwMDkxNDY5MH0.ljVy0lU843HdJCGgCqP1pF9oNkpkbIV9K5Hkto5oye8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function syncPlayerToSupabase(fidInput?: number | string) {
  try {
    const fid = Number(fidInput || 1001);
    const now = new Date().toISOString();

    let { data: player } = await supabase
      .from("players")
      .select("id, farcaster_fid")
      .eq("farcaster_fid", fid)
      .maybeSingle();

    if (!player) {
      const { data: created, error } = await supabase
        .from("players")
        .insert({ farcaster_fid: fid, last_seen_at: now })
        .select("id, farcaster_fid")
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase insert player error:", error);
      }
      player = created;
    } else {
      await supabase
        .from("players")
        .update({ last_seen_at: now })
        .eq("id", player.id);
    }

    return player;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("syncPlayerToSupabase error:", err);
    return null;
  }
}

export async function syncFarmToSupabase(fidInput: number | string, gameState: any) {
  try {
    const player = await syncPlayerToSupabase(fidInput);
    if (!player || !player.id) return null;

    const { data: existingFarm } = await supabase
      .from("game_farms")
      .select("id")
      .eq("player_id", player.id)
      .maybeSingle();

    if (!existingFarm) {
      await supabase
        .from("game_farms")
        .insert({ player_id: player.id, state: gameState });
    } else {
      await supabase
        .from("game_farms")
        .update({ state: gameState, updated_at: new Date().toISOString() })
        .eq("player_id", player.id);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("syncFarmToSupabase error:", err);
  }
}
