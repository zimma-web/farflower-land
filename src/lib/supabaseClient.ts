import { createClient } from "@supabase/supabase-js";
import { sdk } from "@farcaster/miniapp-sdk";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  "https://arknbagrkoeslhudyien.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya25iYWdya29lc2xodWR5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzg2OTAsImV4cCI6MjEwMDkxNDY5MH0.ljVy0lU843HdJCGgCqP1pF9oNkpkbIV9K5Hkto5oye8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getFarcasterFid(fidOverride?: number | string): Promise<number> {
  if (fidOverride && !isNaN(Number(fidOverride))) {
    return Number(fidOverride);
  }

  try {
    const context = (await Promise.race([
      sdk.context,
      new Promise((resolve) => setTimeout(() => resolve(null), 500)),
    ])) as any;
    if (context?.user?.fid) {
      return Number(context.user.fid);
    }
  } catch (_) {}

  try {
    const res = (await Promise.race([
      sdk.quickAuth.getToken(),
      new Promise((resolve) => setTimeout(() => resolve(null), 500)),
    ])) as any;
    if (res?.token) {
      const parts = res.token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (payload?.sub) return Number(payload.sub);
      }
    }
  } catch (_) {}

  return 1001;
}

export async function syncPlayerToSupabase(fidInput?: number | string) {
  try {
    const fid = await getFarcasterFid(fidInput);
    const now = new Date().toISOString();

    let { data: player, error: selectErr } = await supabase
      .from("players")
      .select("id, farcaster_fid")
      .eq("farcaster_fid", fid)
      .maybeSingle();

    if (selectErr) {
      // eslint-disable-next-line no-console
      console.error("Supabase select player error:", selectErr);
    }

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
      const { error: farmInsErr } = await supabase
        .from("game_farms")
        .insert({ player_id: player.id, state: gameState });

      if (farmInsErr) {
        // eslint-disable-next-line no-console
        console.error("Supabase insert game_farms error:", farmInsErr);
      }
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
