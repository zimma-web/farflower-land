// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { password } = request.body || {};
    const expectedPassword = process.env.ADMIN_PASSWORD || "Akuasw12";

    if (password === expectedPassword) {
      response.status(200).json({
        success: true,
        adminToken: `admin_token_${Date.now()}_farflower_authorized`,
      });
    } else {
      response.status(401).json({
        success: false,
        error: "Password Admin Salah!",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";
    response.status(500).json({ error: message });
  }
};
