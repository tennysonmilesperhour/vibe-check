# Vibe Check: Golden Hour

Vibe Check is a private one-minute evening mood journal. It records mood, energy, sleep, feelings, activities, relationships, and optional reflections, then helps people notice patterns across their own history. Tarot, Cosmos, and AI interpretations are optional reflection tools.

## Local development

Requirements: Node.js 22+, npm, and Xcode 26 for the iOS shell.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide the frontend values.
3. Start the web app with `npm run dev`.

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

## Backend

The app uses Supabase Auth, Postgres, Row Level Security, and Edge Functions. Apply `supabase/migrations/20260703000001_initial_schema.sql`, deploy the functions under `supabase/functions`, and set the `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` function secrets before enabling AI features.

## Web release

Deploy to Vercel with every variable from `.env.example`. `VITE_PUBLIC_APP_URL` must be the final HTTPS origin; it drives canonical URLs and native sharing. After the origin is known, create `public/sitemap.xml` with absolute URLs and add it to `public/robots.txt`.

## iOS release

The version 1.0 target is intentionally iPhone-only.

```sh
npm run ios:sync
npm run ios:open
```

Use the App Store packet in `docs/app-store/` for metadata, screenshots, privacy disclosures, accessibility testing, review notes, and the release checklist.
