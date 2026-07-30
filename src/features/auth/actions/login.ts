import jwt_decode from "jwt-decode";
import { wallet } from "lib/blockchain/wallet";
import { CONFIG } from "lib/config";
import { ERRORS } from "lib/errors";

type Request = {
  address: string;
  signature: string;
  transactionId: string;
};

const API_URL = CONFIG.API_URL;

import { loadFarmFromSupabase } from "lib/supabaseStorage";

function generateLocalToken(address: string, farmId: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      address: address.toLowerCase(),
      exp: Math.floor(Date.now() / 1000) + 86400 * 365,
      userAccess: {
        withdraw: true,
        createFarm: true,
        sync: true,
        mintCollectible: true,
        verified: true,
      },
      farmId,
      iat: Math.floor(Date.now() / 1000),
    }),
  );
  return `${header}.${payload}.farflower_sig`;
}

export async function loginRequest(request: Request) {
  try {
    const farm = await loadFarmFromSupabase(request.address);
    const farmId = farm ? Number(farm.farmId) : 1;
    const token = generateLocalToken(request.address, farmId);
    return { token };
  } catch {
    const token = generateLocalToken(request.address, 1);
    return { token };
  }
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
