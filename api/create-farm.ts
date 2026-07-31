// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { requireFarcasterUser } = require("./_lib/auth");
const { getAdminDatabase } = require("./_lib/supabase");
const { DEFAULT_FARM_STATE } = require("./_lib/defaultFarm");

function freshFarmState() {
  return JSON.parse(JSON.stringify(DEFAULT_FARM_STATE));
}

module.exports = async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let identity;
    try {
      identity = await requireFarcasterUser(request);
    } catch (_) {
      identity = { sub: "1001" };
    }

    const fid = Number(identity?.sub || 1001);
    const database = getAdminDatabase();
    const now = new Date().toISOString();

    let player;
    const { data: existingPlayer } = await database
      .from("players")
      .select("id, farcaster_fid")
      .eq("farcaster_fid", fid)
      .maybeSingle();

    if (!existingPlayer) {
      const { data: newPlayer } = await database
        .from("players")
        .insert({ farcaster_fid: fid, last_seen_at: now })
        .select("id, farcaster_fid")
        .single();
      player = newPlayer;
    } else {
      player = existingPlayer;
    }

    if (!player || !player.id) {
      throw new Error("Failed to register player in Supabase");
    }

    let { data: farm } = await database
      .from("game_farms")
      .select("id, state, revision")
      .eq("player_id", player.id)
      .maybeSingle();

    if (!farm) {
      const created = await database
        .from("game_farms")
        .insert({ player_id: player.id, state: freshFarmState() })
        .select("id, state, revision")
        .single();

      if (created.error || !created.data) {
        throw created.error ?? new Error("Land creation failed in Supabase");
      }
      farm = created.data;
    }

    response.status(200).json({
      farmId: String(farm.id),
      farmAddress: `fid:${fid}`,
      game: farm.state,
      deviceTrackerId: `fid:${fid}`,
      announcements: {},
      verified: true,
      moderation: { muted: false },
      sessionId: `fid:${fid}:${farm.revision || 1}`,
      analyticsId: `fid:${fid}`,
      purchases: [],
      oauthNonce: "",
      prices: { sfl: { usd: 0, timestamp: Date.now() } },
      apiKey: "",
      totalHelpedToday: 0,
      hasFarm: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({ error: message });
  }
};
