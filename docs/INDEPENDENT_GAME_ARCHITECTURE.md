# Independent Farcaster Game Architecture

## Product decision

This project will become an independently operated farming game. The client may
retain only code and assets that the owner is licensed to use. It must not depend
on Sunflower Land APIs, contracts, credentials, player records, or game economy.

The service, database, domain, Farcaster application, source repository and
deployment accounts must be owned by the project owner.

## Why the current fork cannot ship

The current Supabase adaptation allows the browser to create and update a raw
`farm_data` record. It also creates unsigned local session tokens and patches
`Object.prototype`. This means a player can alter their own resources from the
browser and game behaviour can change globally. It is suitable only for a local
experiment, never for a public economy.

## Target architecture

```text
Farcaster client
  -> verified Farcaster sign-in
  -> game API (server-owned)
  -> PostgreSQL database (row access only through API)
  -> action/event log + authoritative game-state projection
```

The client sends an intent such as `crop.harvest`. The API authenticates the
player, validates the action against the latest state and server time, applies
the game rule, writes an immutable event and returns the new state. The client
never writes balances or farm JSON directly.

## Migration phases

1. **Safety baseline**
   - Remove `Object.prototype` and primitive prototype patches.
   - Stop hard-coding Supabase configuration in source; rotate exposed project
     credentials and keep production values in the deployment environment.
   - Disable the browser's direct `farms` table writes.

2. **Owned identity and persistence**
   - Verify Farcaster identity on the server.
   - Create `players`, `farms`, `game_events`, and `sessions` tables with row
     level security.
   - Provision a complete, versioned starter farm server-side.

3. **Authoritative core loop**
   - Implement a small vertical slice first: plant, harvest, inventory and
     currency.
   - Store every accepted action in `game_events`; make duplicate actions safe.
   - Add a migration version to every farm state.

4. **Feature migration**
   - Migrate systems one bounded area at a time: crops, resources, animals,
     crafting, buildings, quests, social and marketplace.
   - Each area needs rules tests and API contract tests before it is enabled.

5. **Farcaster release**
   - Add a signed `/.well-known/farcaster.json` on the production domain.
   - Add mobile performance budgets, error reporting, backups, moderation and
     rate limits.

## Non-negotiable rules

- No fake JWT, fake verification, or client-only authorization.
- No global polyfills to disguise invalid game state.
- Decimal conversion occurs only at the API boundary and through explicit,
  tested serializers.
- No asset or code is shipped without a redistribution license.
- Production secrets never live in the frontend bundle or repository.

## First deliverable

The first public playable release should be a controlled farming vertical slice,
not the entire inherited feature set. Once its API, save system and Farcaster
login are proven, existing licensed gameplay areas can migrate progressively
without breaking player data.
