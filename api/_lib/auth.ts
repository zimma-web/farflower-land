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

  try {
    return await quickAuth.verifyJwt({
      token: authorization.slice("Bearer ".length),
      domain: appDomain(),
    });
  } catch (err) {
    const error = new Error(
      err instanceof Error ? err.message : "Invalid or expired Farcaster token",
    );
    error.name = "UnauthorizedError";
    throw error;
  }
}

module.exports = { requireFarcasterUser };
export {};
