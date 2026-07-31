// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require("@supabase/supabase-js");

const FALLBACK_URL = "https://arknbagrkoeslhudyien.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya25iYWdya29lc2xodWR5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzg2OTAsImV4cCI6MjEwMDkxNDY5MH0.ljVy0lU843HdJCGgCqP1pF9oNkpkbIV9K5Hkto5oye8";

function getAdminDatabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    FALLBACK_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { getAdminDatabase };
