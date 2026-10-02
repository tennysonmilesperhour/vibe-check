# Vibe Check

A private record of your days, with the whole pattern in view.

Vibe Check's [product foundation](docs/design/product-foundation.md) makes
daily reflection, the orbit, relationship and habit charts, full history,
and weekly and monthly reports with somatic practices matched to stress
patterns the free baseline for everyone. It helps users notice patterns and
practice responses that fit their own needs and values. Optional paid systems add
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
| `npm run check:bundle` | First-load JavaScript budget; run after `npm run build` |
| `npm run test:e2e` | Browser tests: every page, the main flows and WCAG A/AA checks, on desktop and phone |

### Browser tests

`npm run test:e2e` builds the app into `dist-e2e/` and runs Playwright against
it, under the production headers from `vercel.json` (`vite preview` sends
them, Content-Security-Policy included). The app talks to an in-memory
Supabase (`e2e/support/mock-supabase.js`) filled with an invented person
(`e2e/support/persona.js`), at a fixed clock, so no network or account is
needed. The mock reads the tables from `supabase/migrations/` and refuses what
the real project would: unknown tables or columns, a missing required column,
a duplicate key, a value outside a CHECK list, and anyone else's rows.

A test fails when a page throws or logs an error, when one of the app's files
fails to load, when the app makes a request the mock refuses or doesn't
model, or when it contacts any other site. The first run needs a browser:
`npx playwright install chromium`.

## Project layout

- `src/lib/` — pure logic: dates, record days, boundaries, crypto export, and
  the resonance + wisdom engines (`src/lib/resonance/`,
  `src/lib/wisdom/`). Keep this layer pure and unit-tested.
- `src/features/` — feature UI grouped by surface (today, loom, practice,
  patterns, people, shell).
- `src/pages/` + `src/pages.config.js` — routed pages.
- `src/api/` — thin Supabase adapters (`supabase.js`, `entities.js`, and the
  Base44-compatibility facade `base44Client.js`).
- `supabase/migrations/` — schema, applied via the Supabase CLI or MCP
  (`supabase db push` / `apply_migration`).
- `docs/` — specs, plans, and roadmaps (see
  `docs/roadmap/2026-09-29-expert-review-plan.md` for the current plan).

## Design language

Copy speaks plainly, with no persona (the [plant voice](docs/design/plant-voice.md)
was retired on October 2, 2026). Optional plant companions offer deeper chakra
reflections. The current chakra pairings are authored reflective invitations, not medical or universal traditional claims.

The current direction is **Nature Sanctuary**, with the September 8 woodland
palette: moss, fern, deep forest, warm bark, and weathered brass. The B1/Breath
mark, botanical imagery, fine-line symbols, serif typography, and calm motion
carry this across the app.

See the [current visual guidance](docs/design/nature-sanctuary.md) for palette
roles, art direction, motion, and application by screen. This supersedes the
older Golden Hour and twilight visual guidance. The implementation uses
shared sanctuary colors with compatible `--gh-*` aliases in `src/index.css`.
See [asset provenance and playback behavior](docs/design/sanctuary-assets.md).

## Account deletion and shared infrastructure

Public privacy, terms, and support routes remain available without signing in.
Deletion covers the full Vibe Check history, including journal entries, drafts,
practice sessions, report reflections, and preferences. Campground and Daily
Digest records and their shared sign-in remain protected.

The completion migration is
`supabase/migrations/20260908235730_complete_vibe_account_deletion.sql`; it and
the updated `delete-account` Edge Function were applied for this release.
`supabase/tests/delete_vibe_data.sql` verifies generated fixtures inside a
rolled-back subtransaction. The shared project has migration history from
multiple apps: reconcile remote history before any broad `supabase db push`.
