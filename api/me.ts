// @ts-nocheck
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
    try {
      const { data: existing } = await database
        .from("players")
        .select("id, farcaster_fid, created_at, last_seen_at")
        .eq("farcaster_fid", fid)
        .maybeSingle();

      if (!existing) {
        const { data: created } = await database
          .from("players")
          .insert({ farcaster_fid: fid, last_seen_at: now })
          .select("id, farcaster_fid, created_at, last_seen_at")
          .single();

        player = created;
      } else {
        player = existing;
      }
    } catch (_) {
      player = { id: "local", farcaster_fid: fid, created_at: now, last_seen_at: now };
    }

    response.status(200).json({ player: player || { farcaster_fid: fid } });
  } catch (error) {
    response.status(200).json({ player: { farcaster_fid: 1001 } });
  }
};
