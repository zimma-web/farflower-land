// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require("@supabase/supabase-js");

function getAdminDatabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    "https://arknbagrkoeslhudyien.supabase.co";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRole) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel");
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { getAdminDatabase };
