import jwt_decode from "jwt-decode";
import { sdk } from "@farcaster/miniapp-sdk";
import { wallet } from "lib/blockchain/wallet";
import { syncPlayerToSupabase } from "lib/supabaseClient";

type Request = {
  address: string;
  signature: string;
  transactionId: string;
};

export async function getRealFarcasterFid(): Promise<number> {
  const cachedFid = sessionStorage.getItem("farcaster_real_fid");
  if (cachedFid && Number(cachedFid) !== 1001) {
    return Number(cachedFid);
  }

  try {
    const context = (await Promise.race([
      sdk.context,
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ])) as any;

    if (context?.user?.fid != null) {
      const fid = Number(context.user.fid);
      sessionStorage.setItem("farcaster_real_fid", String(fid));
      return fid;
    }
  } catch (_) {}

  try {
    const res = (await Promise.race([
      sdk.quickAuth.getToken(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
    ])) as any;

    if (res?.token) {
      const decoded = decodeToken(res.token);
      if (decoded?.sub != null) {
        const fid = Number(decoded.sub);
        sessionStorage.setItem("farcaster_real_fid", String(fid));
        return fid;
      }
    }
  } catch (_) {}

  return 1001;
}

export async function loginRequest(request: Request) {
  void request;
  let token = "";

  const realFid = await getRealFarcasterFid();
  try {
    await syncPlayerToSupabase(realFid);
  } catch (syncErr) {
    // eslint-disable-next-line no-console
    console.error("Error syncing player in loginRequest:", syncErr);
  }

  try {
    const res = (await Promise.race([
      sdk.quickAuth.getToken(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Token timeout")), 3500),
      ),
    ])) as any;
    token = res?.token || "";
  } catch (_) {
    token = "farcaster_dev_token";
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;

  try {
    const response = await window.fetch(`${window.location.origin}/api/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${token}`,
        "x-farcaster-fid": String(realFid),
      },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new Error("NO_FARM");
    }

    if (response.status >= 400) {
      throw new Error("NO_FARM");
    }

    return { token };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}

const host = window.location.host.replace(/^www\./, "");
const LOCAL_STORAGE_KEY = `sb_wiz.zpc.v.${host}-${window.location.pathname}`;

type Session = {
  token: string;
};

type Sessions = Record<string, Session>;

function getSession(address: string): Session | null {
  const item = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!item) return null;
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
  provider?: string;
  sub?: string;
  email?: string;
  iat?: number;
};

export function decodeToken(token: string): Token {
  let decoded = jwt_decode(token) as any;

  decoded = {
    ...decoded,
    ...decoded.properties,
  };

  const fid = decoded.sub != null ? Number(decoded.sub) : 1001;
  return {
    ...decoded,
    address: `fid:${fid}`,
    farmId: fid,
    userAccess: {
      withdraw: false,
      createFarm: true,
      sync: true,
      mintCollectible: false,
      verified: true,
    },
  };
}

const TOKEN_BUFFER_MS = 1000 * 60 * 5;

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
