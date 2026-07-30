import { getAdminDatabase } from "./_lib/supabase";
import { requireFarcasterUser } from "./_lib/auth";

type Request = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type Response = {
  status: (code: number) => Response;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(request: Request, response: Response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const identity = await requireFarcasterUser(request);
    const database = getAdminDatabase();
    const { data, error } = await database
      .from("players")
      .upsert(
        { farcaster_fid: identity.sub, last_seen_at: new Date().toISOString() },
        { onConflict: "farcaster_fid" },
      )
      .select("id, farcaster_fid, created_at, last_seen_at")
      .single();

    if (error) throw error;

    response.status(200).json({ player: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof Error && error.name === "UnauthorizedError" ? 401 : 500;

    // Do not expose database or token-verification details to a game client.
    console.error("GET /api/me failed", error);
    response.status(status).json({ error: status === 401 ? message : "Unable to load player" });
  }
}
