/* eslint-disable @typescript-eslint/no-var-requires */
const { getAdminDatabase } = require("./_lib/supabase");
const { requireFarcasterUser } = require("./_lib/auth");

module.exports = async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const identity = await requireFarcasterUser(request);
    const database = getAdminDatabase();
    const fid = Number(identity.sub);
    const { data, error } = await database
      .from("players")
      .upsert(
        { farcaster_fid: fid, last_seen_at: new Date().toISOString() },
        { onConflict: "farcaster_fid" },
      )
      .select("id, farcaster_fid, created_at, last_seen_at")
      .single();

    if (error) throw error;

    response.status(200).json({ player: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      error instanceof Error && error.name === "UnauthorizedError" ? 401 : 500;

    // eslint-disable-next-line no-console
    console.error("GET /api/me failed", error);
    response
      .status(status)
      .json({ error: status === 401 ? message : "Unable to load player" });
  }
};
