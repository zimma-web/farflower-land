// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { getAdminDatabase } = require("../_lib/supabase");

module.exports = async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let body = request.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    const inputPassword = String(body?.password || "").trim();
    if (!inputPassword) {
      response.status(401).json({ success: false, error: "Password required." });
      return;
    }

    let isValid = false;

    // 1. Check process.env.ADMIN_PASSWORD in Vercel settings if configured
    if (process.env.ADMIN_PASSWORD && inputPassword === process.env.ADMIN_PASSWORD.trim()) {
      isValid = true;
    }

    // 2. Query Supabase database admin_settings table
    if (!isValid) {
      try {
        const database = getAdminDatabase();
        const { data: settings } = await database
          .from("admin_settings")
          .select("admin_password")
          .eq("id", 1)
          .maybeSingle();

        if (settings && settings.admin_password && inputPassword === String(settings.admin_password).trim()) {
          isValid = true;
        }
      } catch (dbErr) {
        // eslint-disable-next-line no-console
        console.error("Supabase admin_settings query error:", dbErr);
      }
    }

    if (isValid) {
      response.status(200).json({
        success: true,
        adminToken: `admin_token_${Date.now()}_farflower_authorized`,
      });
    } else {
      response.status(401).json({
        success: false,
        error: "Incorrect Admin Password!",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";
    response.status(500).json({ error: message });
  }
};
