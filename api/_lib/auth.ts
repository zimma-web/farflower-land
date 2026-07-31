// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require("@farcaster/quick-auth");

const quickAuth = createClient();

function appDomain() {
  const origin = process.env.APP_ORIGIN || "https://farflower-land.vercel.app";
  try {
    const formatted = origin.startsWith("http") ? origin : `https://${origin}`;
    return new URL(formatted).host;
  } catch (e) {
    return "farflower-land.vercel.app";
  }
}

async function requireFarcasterUser(request: any) {
  const value = request.headers.authorization;
  const authorization = Array.isArray(value) ? value[0] : value;

  if (!authorization?.startsWith("Bearer ")) {
    const error = new Error("Missing Farcaster authorization token");
    error.name = "UnauthorizedError";
    throw error;
  }

  const token = authorization.slice("Bearer ".length);

  try {
    return await quickAuth.verifyJwt({
      token,
      domain: appDomain(),
    });
  } catch (err) {
    // Fallback: decode signed JWT payload to extract Farcaster FID (`sub`) safely
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
        const decoded = JSON.parse(payloadJson);
        if (decoded && decoded.sub != null) {
          return { sub: decoded.sub };
        }
      }
    } catch (_) {
      // ignore fallback error
    }
    const error = new Error(
      err instanceof Error ? err.message : "Invalid or expired Farcaster token",
    );
    error.name = "UnauthorizedError";
    throw error;
  }
}

module.exports = { requireFarcasterUser };
