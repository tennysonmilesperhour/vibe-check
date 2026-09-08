# Vibe Check

One honest check-in each evening, woven into your cosmic map.

Vibe Check is a daily wellness ritual with computed truth at its core: a
multi-step evening check-in, seven wisdom systems (astrology, Human Design,
Gene Keys, numerology, tarot archetypes, Enneagram, chakras) connected by a
deterministic resonance engine, and a living mandala — the Loom — that
genuinely changes with the sky. Readings are composed from local content
tables and your own data, never improvised: the app can always answer
"why am I seeing this?"

## Stack

- **Frontend:** Vite + React 18, Tailwind + shadcn/ui (vendored in
  `src/components/ui/`), framer-motion, recharts.
- **Backend:** Supabase — Postgres with row-level security on every table,
  auth (email/password + magic link). Schema lives in `supabase/migrations/`.
- **Hosting:** Vercel (SPA rewrite + security headers in `vercel.json`).

## Local development

```sh
npm install
npm run dev
```

Create `.env.local` with the Supabase project credentials:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Without these the app boots to a loud misconfiguration notice on the sign-in
screen.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` (also emits `/version.json` for the update toast) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the repo |
| `npm test` | Vitest unit suites (the resonance/wisdom engines are exhaustively tested) |
| `npm run typecheck` | `tsc` over `jsconfig.json` |

## Project layout

- `src/lib/` — pure logic: dates, streaks, boundaries, correlations, crypto
  export, and the resonance + wisdom engines (`src/lib/resonance/`,
  `src/lib/wisdom/`). Keep this layer pure and unit-tested.
- `src/features/` — feature UI grouped by surface (today, loom, practice,
  patterns, people, shell).
- `src/pages/` + `src/pages.config.js` — routed pages.
- `src/api/` — thin Supabase adapters (`supabase.js`, `entities.js`, and the
  Base44-compatibility facade `base44Client.js`).
- `supabase/migrations/` — schema, applied via the Supabase CLI or MCP
  (`supabase db push` / `apply_migration`).
- `docs/` — specs, plans, and roadmaps (see
  `docs/roadmap/2026-07-16-function-and-beauty-plan.md` for current state).

## Design language

The current direction is **Nature Sanctuary**: sage and dark greens, muted
gold accents, cream, and tan; elegant typography, cinematic nature video
backgrounds, generated imagery and symbols, and calm, fluid motion.

See the [current visual guidance](docs/design/nature-sanctuary.md) for palette
roles, art direction, motion, and application by screen. This supersedes the
older Golden Hour and twilight visual guidance. The implementation uses
shared sanctuary colors with compatible `--gh-*` aliases in `src/index.css`.
See [asset provenance and playback behavior](docs/design/sanctuary-assets.md).
