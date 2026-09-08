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

## Shared backend accounts

The active project `xyhbuqsxglfjbounogdz` also hosts Campground (`camp_*`), Dialogue (`dialogue_waitlist`), AI Catch Up (`aicu_subscribers`), and Daily Digest (`digest_*` plus the private `digest-evidence` bucket). Existing Vibe Check tables, users, and inference functions remain in place. Each app's data stays isolated by RLS.

The `protect_shared_accounts` migration and updated `delete-account` function erase Vibe Check data atomically. If Campground or Daily Digest also uses the identity, that identity and their records remain. A database trigger prevents accidental shared-identity deletion. If no data from these other apps remains, the Auth identity is deleted normally. Deploy the Campground schema before this migration and deploy the migration before the function. This branch follows the currently deployed `release/v1.0.0-rc.1` code, rather than replacing it with the divergent main branch.

Shared migration history contains multiple repositories' changes. Never reset the database or replace its history from one partial checkout. Auth callback URLs include both apps; email verification stays enabled. Custom SMTP remains unconfigured.

The `preserve_daily_digest_identity` migration extends the existing deletion guard to Daily Digest bylines and uploads. Apply Daily Digest's `daily_digest_shared_backend` migration first. It preserves existing Vibe Check tables and the deployed deletion function.
