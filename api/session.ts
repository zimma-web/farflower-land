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
    const identity = await requireFarcasterUser(request);
    if (!identity || identity.sub == null) {
      const error = new Error("Invalid Farcaster identity payload");
      error.name = "UnauthorizedError";
      throw error;
    }
    const database = getAdminDatabase();
    const now = new Date().toISOString();

    const fid = Number(identity.sub);
    const { data: player, error: playerError } = await database
      .from("players")
      .upsert(
        { farcaster_fid: fid, last_seen_at: now },
        { onConflict: "farcaster_fid" },
      )
      .select("id, farcaster_fid")
      .single();
    if (playerError || !player)
      throw playerError ?? new Error("Player missing");

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
        throw created.error ?? new Error("Farm creation failed");
      }
      farm = created.data;
    }

    response.status(200).json({
      farmId: String(farm.id),
      farmAddress: `fid:${identity.sub}`,
      game: farm.state,
      deviceTrackerId: `fid:${identity.sub}`,
      announcements: {},
      verified: true,
      moderation: { muted: false },
      sessionId: `fid:${identity.sub}:${farm.revision}`,
      analyticsId: `fid:${identity.sub}`,
      purchases: [],
      oauthNonce: "",
      prices: { sfl: { usd: 0, timestamp: Date.now() } },
      apiKey: "",
      totalHelpedToday: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("API /api/session error:", error);
    const isAuthError =
      error instanceof Error &&
      (error.name === "UnauthorizedError" ||
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("authorization") ||
        message.toLowerCase().includes("farcaster") ||
        message.toLowerCase().includes("jwt"));
    const status = isAuthError ? 401 : 500;
    response.status(status).json({ error: message });
  }
};
export {};
