// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { requireFarcasterUser } = require("./_lib/auth");
const { getAdminDatabase } = require("./_lib/supabase");
const { OFFLINE_FARM } = require("../src/features/game/lib/landData");

module.exports = async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Extract real numeric Farcaster FID from request header or JWT identity
    const headerFid = request.headers["x-farcaster-fid"] || request.headers?.["x-farcaster-fid"];
    let fid = headerFid ? Number(headerFid) : null;

    if (!fid || isNaN(fid)) {
      let identity;
      try {
        identity = await requireFarcasterUser(request);
      } catch (_) {
        identity = null;
      }
      fid = Number(identity?.sub || 1001);
    }

    const database = getAdminDatabase();
    const now = new Date().toISOString();

    // 1. Auto-insert/update player data into Supabase `players` table
    let player;
    try {
      const { data: existingPlayer } = await database
        .from("players")
        .select("id, farcaster_fid, has_land")
        .eq("farcaster_fid", fid)
        .maybeSingle();

      if (!existingPlayer) {
        const { data: newPlayer, error: insErr } = await database
          .from("players")
          .insert({ farcaster_fid: fid, last_seen_at: now, has_land: false })
          .select("id, farcaster_fid, has_land")
          .single();

        if (insErr) {
          // eslint-disable-next-line no-console
          console.error("Player insert error in Supabase:", insErr);
        }
        player = newPlayer;
      } else {
        await database
          .from("players")
          .update({ last_seen_at: now })
          .eq("id", existingPlayer.id);

        player = existingPlayer;
      }
    } catch (dbErr) {
      // eslint-disable-next-line no-console
      console.error("Supabase player insert error:", dbErr);
    }

    // 2. Check if player has created a land in `game_farms`
    let farm;
    if (player && player.id) {
      try {
        const { data: existingFarm } = await database
          .from("game_farms")
          .select("id, state, revision")
          .eq("player_id", player.id)
          .maybeSingle();

        farm = existingFarm;

        // Auto-create farm row if player.has_land is true but no farm row exists yet
        if (!farm && player.has_land) {
          const { data: newFarm } = await database
            .from("game_farms")
            .insert({ player_id: player.id, state: OFFLINE_FARM })
            .select("id, state, revision")
            .single();

          farm = newFarm;
        }
      } catch (farmDbErr) {
        // eslint-disable-next-line no-console
        console.error("Supabase farm fetch error:", farmDbErr);
      }
    }

    // 3. If player has NO land created yet and has_land is false, return 404 NO_FARM
    if (!farm && !player?.has_land) {
      response.status(404).json({
        error: "NO_FARM",
        message: "Player registered in Supabase, but land not purchased yet.",
        hasFarm: false,
        fid,
      });
      return;
    }

    // Fallback default state if farm is empty
    const gameState = farm?.state || OFFLINE_FARM;
    const farmId = farm?.id ? String(farm.id) : String(player?.id || 1);
    const revision = farm?.revision || 1;

    // 4. Player has an active land! Return farm state and session
    response.status(200).json({
      farmId,
      farmAddress: `fid:${fid}`,
      game: gameState,
      deviceTrackerId: `fid:${fid}`,
      announcements: {},
      verified: true,
      moderation: { muted: false },
      sessionId: `fid:${fid}:${revision}`,
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
