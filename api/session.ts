import { requireFarcasterUser } from "./_lib/auth";
import { getAdminDatabase } from "./_lib/supabase";
import { DEFAULT_FARM_STATE } from "./_lib/defaultFarm";

type Request = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type Response = {
  status: (code: number) => Response;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function freshFarmState() {
  return JSON.parse(JSON.stringify(DEFAULT_FARM_STATE));
}

export default async function handler(request: Request, response: Response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const identity = await requireFarcasterUser(request);
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
    const status =
      error instanceof Error && error.name === "UnauthorizedError" ? 401 : 500;
    response.status(status).json({ error: message });
  }
}
