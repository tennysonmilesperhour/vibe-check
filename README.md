# Vibe Check

A private record of your days, with the whole pattern in view.

Vibe Check's [product foundation](docs/design/product-foundation.md) makes
daily reflection, the orbit, relationship and habit charts, full history,
and weekly and monthly reports with somatic practices matched to stress
patterns the free baseline for everyone. Tobacco guides the experience as
the voice of the plants, helping users notice patterns and practice responses
that fit their own needs and values. Optional paid systems add
deeper interpretations; the core experience requires no external AI account.

The free baseline is implemented: short check-ins and drafts, a full journal,
people and habit filters, uncapped history retrieval, weekly/monthly reports,
source-linked stress patterns, eleven practical invitations, saved outcomes,
and a private export preview with optional password encryption. Seven optional
chakra plant companions open journal prompts. All matching and reports run
without sending journal text to an AI provider. Paid packaging is not enabled.

Schema additions are in `supabase/migrations/20260908191348_vibe_living_patterns.sql`.
The report engine recomputes from current entries, so corrections and deletions
carry through to charts, reports, and exports. Missing days stay visible.

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

The [plant voice direction](docs/design/plant-voice.md) gives the app its
narrative: Tobacco introduces the systems as the spokesperson for the plants,
with optional plant companions for deeper chakra reflections. The current chakra pairings are authored reflective invitations, not medical or universal traditional claims.

The current direction is **Nature Sanctuary**: sage and dark greens, muted
gold accents, cream, and tan; elegant typography, cinematic nature video
backgrounds, generated imagery and symbols, and calm, fluid motion.

See the [current visual guidance](docs/design/nature-sanctuary.md) for palette
roles, art direction, motion, and application by screen. This supersedes the
older Golden Hour and twilight visual guidance. The implementation uses
shared sanctuary colors with compatible `--gh-*` aliases in `src/index.css`.
See [asset provenance and playback behavior](docs/design/sanctuary-assets.md).
