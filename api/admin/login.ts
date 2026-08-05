// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */

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
    const expectedPassword = String(process.env.ADMIN_PASSWORD || "Akuasw12").trim();

    if (inputPassword === expectedPassword) {
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
