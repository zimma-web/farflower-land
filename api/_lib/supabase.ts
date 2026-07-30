import { createClient } from "@supabase/supabase-js";

export function getAdminDatabase() {
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
