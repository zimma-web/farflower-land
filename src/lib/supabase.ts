import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://arknbagrkoeslhudyien.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya25iYWdya29lc2xodWR5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzg2OTAsImV4cCI6MjEwMDkxNDY5MH0.ljVy0lU843HdJCGgCqP1pF9oNkpkbIV9K5Hkto5oye8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
