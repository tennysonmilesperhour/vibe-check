# Vibe Check

See how the people and habits in your life affect you. A free, private
journal with patterns, weekly and monthly reports, and practices for hard
moments. No AI reads your journal.

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
| `npm run build` | Production build into `dist/` (also emits `/version.json` for the update toast and `/sw.js`, the service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the repo |
| `npm test` | Vitest unit suites (the resonance/wisdom engines are exhaustively tested) |
| `npm run typecheck` | `tsc` over `jsconfig.json` |
| `npm run check:bundle` | First-load JavaScript budget; run after `npm run build` |
| `npm run test:e2e` | Browser tests: every page, the main flows and WCAG A/AA checks, on desktop and phone |

### Browser tests

`npm run test:e2e` builds the app into `dist-e2e/` and runs Playwright against
it, under the production headers from `vercel.json` (`vite preview` sends
them, Content-Security-Policy included). The app talks to a stand-in Supabase
(`e2e/support/mock-supabase.js`): auth is answered in JavaScript, and table
requests run as SQL in an in-process Postgres (PGlite) built from
`supabase/migrations/` (`e2e/support/database.js`), as the signed-in person
with their JWT claims. Types, NOT NULL, CHECK, unique keys and the migrations'
row-level security policies apply as they do live. Each test starts from an
invented person (`e2e/support/persona.js`) at a fixed clock, so no network or
account is needed. A migration that needs something more from the Supabase
platform fails the tests with a pointer to `PLATFORM` in `database.js`.

A test fails when a page throws or logs an error, when one of the app's files
fails to load, when the app makes a request the mock refuses or doesn't
model, or when it contacts any other site. The first run needs a browser:
`npx playwright install chromium`.

`e2e/offline.spec.js` checks opening without a connection. Each of its tests
starts its own server for the test build and stops it partway through, since
Playwright's offline switch doesn't reach the service worker.
`e2e/kept-saves.spec.js` checks saves kept without a connection, with the
stand-in Supabase out of reach (`backend.control.offline`) or losing answers
on the way back (`backend.control.loseAnswers`).

## Offline

The service worker (`src/service-worker.js`, built into `/sw.js` by
`vite.config.js`) lets the app open without a connection. It keeps app files
only, never records: sign-in, records, and other sites always go to the
network.

- Pages come from the network first, so a deploy arrives as before. Without
  a connection, or when the network gives no answer in 4 seconds, the app's
  page from the worker's build opens instead. An address that asks for the
  latest version (`_vibe_version`, from the update notice) always waits for
  the network.
- Each build keeps its first-load files, fonts, and icons from the start,
  plus Support now, help now, Practice, and the policies (`OFFLINE_PAGES` in
  `vite.config.js`). Other pages are kept once they've been opened.
- A new build's worker takes over at once. Pages kept before stay kept:
  unchanged files are copied over, and a changed page's new version is
  fetched (or, without a connection then, the next time it opens online).
  The previous build's files stay too, so a tab still open from before a
  deploy can load what that build kept. The build id lives in index.html
  (a `vibe-build` meta tag), not in the scripts, so the libraries, styles,
  and fonts keep their file names across builds.
- When a page's files fail to load, the app asks the server (`/version.json`)
  rather than trusting `navigator.onLine`, which stays true on a network
  without internet: no answer means no connection, a different build means
  an update, and otherwise the load just failed.

To switch it off for everyone: in `src/main.jsx`, replace the registration
with code that unregisters any existing worker, and deploy a worker that
deletes the `vibe-app-` and `vibe-meta` caches and unregisters itself (see
the comment at the top of `src/service-worker.js`).

Saves made without a connection are kept on the device and sent later
(`src/lib/kept-saves.js`, sent by `src/features/shell/KeptSaves.jsx`):

- A check-in or journal entry whose save fails for want of a connection is
  kept in localStorage, per person, and sent when the connection returns,
  when the tab comes back into view, and every minute while any wait.
- Sending twice changes nothing: a check-in writes its day again, and a new
  journal entry carries an id made on the device, inserted only if it isn't
  there yet.
- Each kept check-in and journal edit records which stored version it
  started from (`base`, its `updated_at`), and earlier versions kept here
  (`prior`). If the account holds a different version, saved somewhere else,
  it isn't written over: the person chooses on Today (or in the journal) to
  save their version or discard it. A check-in begun while Today couldn't
  load the history, and a kept check-in or journal change reopened and saved
  again, go through the same check, even once the connection is back.
- Nothing is sent until requests go out signed in: after a long time offline
  the Supabase client waits up to a minute to renew the session, and sends
  requests signed out meanwhile (reads come back empty, writes are refused).
  Today waits for the session the same way before trusting what it reads.
- An answer about the save itself (a database refusal) leaves it for the
  person too, with the reason. A server error or an expired session is
  tried again later.
- Signing out from Settings or deleting the account removes kept saves;
  Settings says how many there are first. An expired session or a forgotten
  app-lock PIN keeps them for when the person signs back in.
- Reads through `src/api/entities.js` are tried again on a dropped connection
  (the Supabase client waits 1, 2 and 4 seconds), except while the device
  reports it's offline: then they fail at once, so Today and the check-in
  open without the wait.

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
Fonts (Instrument Serif and Manrope, SIL Open Font License) are bundled from
Fontsource packages, so pages request nothing from other sites.
See [asset provenance and playback behavior](docs/design/sanctuary-assets.md).

## Account deletion and shared infrastructure

Without signing in, visitors get the front page with the free pledge (`/`),
help-now practices (`/help-now`), Support now, and the privacy, terms, and
support pages. `/signin` and `/signup` open the sign-in form in either mode.
Deletion covers the full Vibe Check history, including journal entries, drafts,
practice sessions, report reflections, and preferences. Campground and Daily
Digest records and their shared sign-in remain protected.

The completion migration is
`supabase/migrations/20260908235730_complete_vibe_account_deletion.sql`; it and
the updated `delete-account` Edge Function were applied for this release.
`supabase/tests/delete_vibe_data.sql` verifies generated fixtures inside a
rolled-back subtransaction. The shared project has migration history from
multiple apps: reconcile remote history before any broad `supabase db push`.
