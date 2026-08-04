import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta?.env?.VITE_SUPABASE_URL as string) ||
  "https://arknbagrkoeslhudyien.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta?.env?.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya25iYWdya29lc2xodWR5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzg2OTAsImV4cCI6MjEwMDkxNDY5MH0.ljVy0lU843HdJCGgCqP1pF9oNkpkbIV9K5Hkto5oye8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function syncPlayerToSupabase(
  fidInput?: number | string,
  extraData: { has_land?: boolean; land_activated_at?: string } = {},
) {
  try {
    const fid = Number(fidInput || 1001);
    const now = new Date().toISOString();

    let { data: player } = await supabase
      .from("players")
      .select("id, farcaster_fid, has_land")
      .eq("farcaster_fid", fid)
      .maybeSingle();

    const payload: any = { last_seen_at: now, ...extraData };

    if (!player) {
      const { data: created, error } = await supabase
        .from("players")
        .insert({ farcaster_fid: fid, has_land: false, ...payload })
        .select("id, farcaster_fid, has_land")
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase insert player error:", error);
      }
      player = created;
    } else {
      await supabase
        .from("players")
        .update(payload)
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

/* =========================================================================
   ADMIN PANEL API FUNCTIONS (Full Database Control)
   ========================================================================= */

export async function fetchAllPlayersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("fetchAllPlayersFromSupabase error:", err);
    return [];
  }
}

export async function updatePlayerLandStatusInSupabase(playerId: string, hasLand: boolean) {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("players")
      .update({
        has_land: hasLand,
        land_activated_at: hasLand ? now : null,
      })
      .eq("id", playerId);

    if (error) throw error;
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("updatePlayerLandStatusInSupabase error:", err);
    return false;
  }
}

export async function deletePlayerFromSupabase(playerId: string) {
  try {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) throw error;
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("deletePlayerFromSupabase error:", err);
    return false;
  }
}

export async function fetchFarmStateFromSupabase(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("game_farms")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("fetchFarmStateFromSupabase error:", err);
    return null;
  }
}

export async function updateFarmStateInSupabase(playerId: string, gameState: any) {
  try {
    const { error } = await supabase
      .from("game_farms")
      .update({
        state: gameState,
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId);

    if (error) throw error;
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("updateFarmStateInSupabase error:", err);
    return false;
  }
}
