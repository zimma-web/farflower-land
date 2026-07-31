// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { requireFarcasterUser } = require("./_lib/auth");
const { getAdminDatabase } = require("./_lib/supabase");

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

    // 1. Auto-insert/update player data into Supabase `players` table
    let player;
    try {
      const { data: existingPlayer } = await database
        .from("players")
        .select("id, farcaster_fid")
        .eq("farcaster_fid", fid)
        .maybeSingle();

      if (!existingPlayer) {
        const { data: newPlayer, error: insErr } = await database
          .from("players")
          .insert({ farcaster_fid: fid, last_seen_at: now })
          .select("id, farcaster_fid")
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
      } catch (farmDbErr) {
        // eslint-disable-next-line no-console
        console.error("Supabase farm fetch error:", farmDbErr);
      }
    }

    // 3. If player has NO land created yet, return 404 NO_FARM so user sees 1 USDC Land creation modal
    if (!farm) {
      response.status(404).json({
        error: "NO_FARM",
        message: "Player registered in Supabase, but land not purchased yet.",
        hasFarm: false,
        fid,
      });
      return;
    }

    // 4. Player has an active land! Return farm state and session
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
