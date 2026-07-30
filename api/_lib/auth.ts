import { createClient } from "@farcaster/quick-auth";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

const quickAuth = createClient();

function appDomain() {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("APP_ORIGIN is not configured");

  return new URL(origin).host;
}

export async function requireFarcasterUser(request: RequestLike) {
  const value = request.headers.authorization;
  const authorization = Array.isArray(value) ? value[0] : value;

  if (!authorization?.startsWith("Bearer ")) {
    const error = new Error("Missing Farcaster authorization token");
    error.name = "UnauthorizedError";
    throw error;
  }

  return quickAuth.verifyJwt({
    token: authorization.slice("Bearer ".length),
    domain: appDomain(),
  });
}
