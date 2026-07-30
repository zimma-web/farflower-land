# Vercel production environment

Set these values in Vercel for Production, Preview and Development as needed.
Do not commit a service-role key or give it a `VITE_`/`NEXT_PUBLIC_` prefix.

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-secret
APP_ORIGIN=https://farflower-land.vercel.app
```

`/api/me` requires the `players` table. Run `supabase/schema.sql` in the
Supabase SQL Editor first. It accepts only a Farcaster Quick Auth Bearer token,
verifies the token audience against `APP_ORIGIN`, and uses the service role only
inside Vercel.
