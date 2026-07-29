# Deploy Farflower Land as a Farcaster Mini App

The playable client is in `src/miniapp/MiniFarm.tsx`. It is local-first: the garden save is stored in the player's browser and does not need external APIs.

## Before deployment

1. Replace the inherited `fc:miniapp` and `fc:frame` tags in `index.html` with your own HTTPS domain, title, and preview image.
2. Deploy the Vite `dist` directory. The included `wrangler.jsonc` supports Cloudflare Workers assets after `wrangler deploy`.
3. Create `https://YOUR_DOMAIN/.well-known/farcaster.json`. Generate the `accountAssociation` signature using your own Farcaster developer account.

Example manifest (replace every placeholder):

```json
{
  "accountAssociation": {
    "header": "YOUR_SIGNED_HEADER",
    "payload": "YOUR_SIGNED_PAYLOAD",
    "signature": "YOUR_SIGNATURE"
  },
  "miniapp": {
    "version": "1",
    "name": "Farflower Land",
    "homeUrl": "https://YOUR_DOMAIN/",
    "iconUrl": "https://YOUR_DOMAIN/pwa/icons/pwa-512x512.png",
    "splashImageUrl": "https://YOUR_DOMAIN/pwa/icons/pwa-512x512.png",
    "splashBackgroundColor": "#9cdef5",
    "subtitle": "Grow, harvest, share",
    "description": "A tiny social farming game.",
    "primaryCategory": "games",
    "tagline": "Grow a pocket farm",
    "heroImageUrl": "https://YOUR_DOMAIN/YOUR_PREVIEW_IMAGE.png",
    "ogTitle": "Sunny Garden",
    "ogDescription": "Plant, harvest, and challenge your friends.",
    "ogImageUrl": "https://YOUR_DOMAIN/YOUR_PREVIEW_IMAGE.png"
  }
}
```

## Current game scope

- Mobile-first 3×3 farming board
- Two crops with 30-second growth timers
- Persistent local progress, XP and seed balance
- Native share sheet when supported
- `sdk.actions.ready()` on launch, so the Farcaster host dismisses its loader

The original repository is a full Sunflower Land client and still contains its old source code and configuration. The new entry point no longer imports that networked game. Keep only assets you are licensed to redistribute.
