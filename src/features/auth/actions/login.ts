import jwt_decode from "jwt-decode";
import { sdk } from "@farcaster/miniapp-sdk";
import { wallet } from "lib/blockchain/wallet";
import { ERRORS } from "lib/errors";

type Request = {
  address: string;
  signature: string;
  transactionId: string;
};

export async function loginRequest(request: Request) {
  // A wallet signature by itself is not a Farcaster identity. Quick Auth gives
  // us a short-lived Farcaster JWT which the API verifies against our domain.
  // `request` remains part of the function signature to keep the existing
  // wallet UI contract intact while the auth flow is migrated.
  void request;
  const { token } = await sdk.quickAuth.getToken();
  const response = await window.fetch(`${window.location.origin}/api/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status >= 400) {
    throw new Error(ERRORS.LOGIN_SERVER_ERROR);
  }

  return { token };
}

const host = window.location.host.replace(/^www\./, "");
const LOCAL_STORAGE_KEY = `sb_wiz.zpc.v.${host}-${window.location.pathname}`;

type Session = {
  token: string;
};

/**
 * Address -> Session
 */
type Sessions = Record<string, Session>;

function getSession(address: string): Session | null {
  const item = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!item) {
    return null;
  }

  const sessions = JSON.parse(item) as Sessions;

  return sessions[address];
}

export type Token = {
  address: string;
  exp: number;
  userAccess: {
    withdraw: boolean;
    createFarm: boolean;
    sync: boolean;
    mintCollectible: boolean;
    admin?: boolean;
    landExpansion?: boolean;
    verified?: boolean;
  };
  farmId?: number;
  /** SSO provider this session was issued for (e.g. "google"). Absent for wallet sessions. */
  provider?: string;
  sub?: string;
  email?: string;
  /** JWT "issued at" (epoch seconds) — usable as a proxy for "last signed in on this device". */
  iat?: number;
};

export function decodeToken(token: string): Token {
  let decoded = jwt_decode(token) as any;

  decoded = {
    ...decoded,
    // SSO token puts fields in the properties so we need to elevate them
    ...decoded.properties,
  };

  // Quick Auth tokens identify players by Farcaster FID (`sub`). Convert that
  // identity into the small session shape expected by the existing auth UI.
  // The API remains authoritative: a session is accepted only after
  // `/api/session` verifies the original JWT.
  if (!decoded.userAccess && typeof decoded.sub === "number") {
    return {
      ...decoded,
      address: `fid:${decoded.sub}`,
      farmId: decoded.sub,
      userAccess: {
        withdraw: false,
        createFarm: true,
        sync: true,
        mintCollectible: false,
        verified: true,
      },
    };
  }

  return decoded;
}

/**
 * Reduce 4 hours as a buffer for a user session
 * This will mitigate people in the middle of their session becoming unauthorised
 */
const TOKEN_BUFFER_MS = 1000 * 60 * 60 * 4;

export function hasValidSession(): boolean {
  const address = wallet.getConnection();
  const session = getSession(address as string);

  if (session) {
    const token = decodeToken(session.token);
    const isFresh = token.exp * 1000 > Date.now() + TOKEN_BUFFER_MS;
    const isValid = !!token.userAccess;

    if (isFresh && isValid) {
      return true;
    }
  }
  return false;
}

export async function login({
  transactionId,
  address,
  signature,
}: {
  transactionId: string;
  address: string;
  signature: string;
}): Promise<{ token: string }> {
  const { token } = await loginRequest({
    address,
    signature,
    transactionId,
  });

  return { token };
}
