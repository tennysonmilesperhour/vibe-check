# Vibe Check — Market Readiness Roadmap

**Date:** 2026-07-07 · **Status:** Proposed
**Basis:** Full-repo audit (frontend, backend/platform, dev flow) on commit `7b01439`.

---

## 1. Where the product is

The intent baked into this codebase is clear and worth finishing: a **cosmic wellness
tracker with computed truth at its core**. Seven wisdom systems connected by a real
resonance engine (pure, exhaustively tested), visualized in a living mandala (the Loom)
that genuinely looks different every day, wrapped in the Golden Hour visual language,
driven by a daily check-in ritual. That is a differentiated product: most apps in this
category are prose horoscopes; this one *computes* its correspondences and shows its work.

State of the build, honestly:

**Production-grade already**
- The resonance engine (`src/lib/resonance/`), date spine, streaks, boundaries,
  correlations — 118 passing unit tests across 15 suites. This is the moat; protect it.
- The core loop: state-adaptive Today, multi-step check-in ceremony, confetti milestones,
  auto boundary detection, person picker.
- The Loom, with genuinely good accessibility (role="img", aria-live detail panel,
  reduced-motion paths).
- Honest encrypted export (AES-256-GCM, truthful copy), share cards, deep links.
- Supabase schema: clean RLS on every table, correct uniqueness on
  `(user_id, date)` check-ins, hardened `handle_new_user` trigger.

**Not ready for strangers**
- **Uncapped LLM spend:** any self-signup account can hammer three edge functions calling
  `claude-opus-4-8` with zero rate limiting (`supabase/functions/`). This is the single
  largest launch risk.
- **Auth is incomplete:** no password reset, no OAuth; the invite email button throws by
  design (`src/api/base44Client.js:50`).
- **Production identity is embarrassing:** `<title>Base44 APP</title>`, no meta
  description, no OG tags, a `manifest.json` link that 404s (`index.html`), package still
  named `base44-app`, README still tells people to edit the app on Base44.com.
- **The Cosmos surface — the first thing a new user configures — was never repainted.**
  138 hex literals across 13 JSX files, the rejected purple palette
  (`rgba(61,52,80)` etc.) in 9 files, `rounded-xl` corners against the square-corner
  mandate. Concentrated in `src/pages/CosmicAddons.jsx`, `src/components/cosmic/*`,
  `HealingBoard.jsx`, `Layout.jsx`, `InviteModal.jsx`, `src/components/tarot/*`.
- **No CI at all** (no `.github/` directory), despite CLAUDE.md documenting a merge flow
  that waits for CI. Typecheck emits 244 errors because `jsconfig.json` lacks the vite
  aliases. The main bundle is 1.34 MB (~402 KB gzip) and the chunk-size warning is
  silenced by `logLevel: 'error'` in `vite.config.js`.
- **Mobile is functional but not native-feeling:** no safe-area handling, no
  `viewport-fit=cover`, no PWA, no home-screen icon, no reminders.
- AI features are stubbed until the `ANTHROPIC_API_KEY` secret is set in Supabase
  (the app says so honestly — good — but launch requires it live, and capped).

## 2. How to use this document

Each work item below has a **copy-pasteable prompt** written for a Claude Code session in
this repo. The intended cadence, per the CLAUDE.md working agreement:

1. Paste one prompt per session. One prompt ≈ one PR.
2. Claude pushes a branch, opens the PR, self-reviews (`/code-review`), waits for CI +
   Vercel green, squash-merges.
3. Run phases in order — Phase 0 and 1 are prerequisites for safely shipping everything
   after them. Within a phase, items are ordered but mostly independent.

Sizes: **S** ≈ under an hour of agent work, **M** ≈ a focused session, **L** ≈ a
multi-session workstream worth splitting into the sub-steps given.

---

## Phase 0 — Launch blockers (protect the wallet, complete auth, fix the front door)

The gate for letting strangers sign up. Everything here is S/M.

### 0.1 LLM cost controls (M) — *do this first*

**Why:** All three edge functions require a JWT but signup is open and unlimited, so any
account can run up Anthropic spend at Opus rates (`invoke-llm` accepts a 24,000-char
prompt, 4,096 max output tokens, no throttle). Also fixes a real bug: `force_regenerate`
in `generate-cosmic-wisdom` deletes cached rows by `(period_type, period_key)` without
`systems_key`, wiping sibling caches.

**Prompt:**

```text
Add cost controls to the Supabase edge functions in supabase/functions/.

1. Create a migration adding an `llm_usage` table: user_id, day (date), call_count,
   token_estimate, unique(user_id, day), RLS user-scoped select only (writes happen
   server-side in the functions via the user-bound client — verify RLS allows the
   function's insert/update under the caller's JWT, or use an RPC with security definer).
2. In supabase/functions/_shared/common.ts add a checkAndIncrementQuota(userClient,
   userId) helper: reject with 429 + friendly JSON when the user exceeds 20 LLM calls
   per UTC day (constant, easy to tune). Apply it in all three functions before calling
   Anthropic.
3. Enforce prompt-size limits server-side: reject invoke-llm bodies over 8,000 chars
   with 413.
4. Fix the force_regenerate bug in generate-cosmic-wisdom: the delete must filter on
   systems_key as well as period_type + period_key, so regenerating one system
   combination doesn't wipe others.
5. Add systems_key to the cosmic_wisdom_lookup index (new migration) since every cache
   lookup filters on all four columns.
6. Client: in src/api/functions.js and the callers (CosmicWisdomCard, WeatherLine,
   TarotTable AI interpretation), surface the 429 as calm copy ("You've reached today's
   reading limit — more tomorrow") rather than an error state.

Deploy functions with the Supabase MCP tools if available; otherwise leave exact deploy
commands in the PR description. Run npm run lint, npm test, npm run build before pushing.
```

### 0.2 Password reset + auth hardening (M)

**Why:** `AuthGate.jsx` supports signup/login/magic-link but there is no "forgot
password" path at all. Beta testers already hit auth friction (see commits `7fea0d3`,
`3da11fb`).

**Prompt:**

```text
Complete the auth flows in src/features/shell/AuthGate.jsx + src/lib/AuthContext.jsx.

1. Add a "Forgot password?" flow: supabase.auth.resetPasswordForEmail with
   redirectTo: window.location.origin, a confirmation screen, and a new-password form
   shown when the app loads with a recovery session (onAuthStateChange PASSWORD_RECOVERY
   event — mind the existing setTimeout(0) auth-lock workaround in AuthContext.jsx:47,
   use the same pattern).
2. Add Google OAuth as a second sign-in option (supabase.auth.signInWithOAuth) behind a
   feature check so it renders only when configured; keep the golden-hour styling and
   friendlyAuthError mapping.
3. Fix the concurrent check-in save hazard: CheckInCeremony.jsx:73-75 does
   read-then-create/update; switch to a single upsert on (user_id, date) via the
   entities layer (add an upsert method to makeEntity in src/api/entities.js using
   supabase .upsert with onConflict).

Flag in the PR description which Supabase dashboard settings the user must configure
(Site URL, Redirect URLs allow-list for the reset link, Google provider credentials,
custom SMTP for reliable delivery) — those live outside the repo.
```

### 0.3 Production identity: title, meta, OG, icons, manifest (S)

**Why:** The deployed app is titled "Base44 APP", has no description or social preview,
and links a manifest that 404s. First impressions and every shared link depend on this.

**Prompt:**

```text
Give the deployed app its real identity. In index.html: title "Vibe Check", meta
description (one warm sentence about daily check-ins woven with your cosmic map), theme-
color matching --gh-gold, full OG + Twitter card tags. Generate a favicon set and app
icons (SVG source: a minimal golden-hour sun/loom mark — draw it as inline SVG, square
corners, using the --gh-* palette from src/index.css; render PNG sizes with a small node
script into public/). Create a real public/manifest.json (name, icons, standalone
display, background #FFFDFA, theme #FDC94E) or remove the link if deferring PWA. Add an
OG image (1200x630, sky-register gradient + wordmark) as a static PNG in public/.
Rename the package from "base44-app" to "vibe-check" in package.json. Verify npm run
build outputs everything into dist/ and vercel.json needs no changes.
```

### 0.4 README + repo truth (S)

**Why:** README still onboards contributors to Base44; the platform is Supabase + Vercel.

**Prompt:**

```text
Rewrite README.md for what the app actually is: Vibe Check, a cosmic wellness tracker
(one-paragraph pitch), Vite + React + Tailwind/shadcn frontend, Supabase (Postgres, RLS,
edge functions in supabase/functions/), deployed on Vercel. Cover: prerequisites, env
vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in .env.local; ANTHROPIC_API_KEY as a
Supabase function secret), npm scripts (dev/build/lint/test/typecheck), how migrations
in supabase/migrations/ are applied, how edge functions deploy, and the docs/ layout
(specs, plans, this roadmap). Delete the stale Base44 instructions. Also delete the
base44/ directory and scripts/import-base44-export.mjs (one-time migration artifacts,
already superseded — note their removal in the PR description so they're recoverable
from history).
```

---

## Phase 1 — Development flow: make shipping safe

The CLAUDE.md agreement ("wait for CI green, then squash-merge") assumes CI that doesn't
exist. Build the rails before the heavy feature work in Phases 2–5.

### 1.1 CI pipeline (S)

**Prompt:**

```text
Add .github/workflows/ci.yml running on pull_request and push to main: checkout, setup
node 22 with npm cache, npm ci, then three parallel jobs — lint (npm run lint), test
(npm test), build (npm run build). Don't gate on typecheck yet (it has 244 known errors;
Phase 1.2 fixes that). Add a .github/pull_request_template.md with sections: What
changed, Why, How verified (lint/test/build/manual). Also add .github/dependabot.yml
for weekly npm + github-actions updates, grouped minor/patch.
```

### 1.2 Make typecheck real (M)

**Why:** `npm run typecheck` emits 244 errors, almost all environmental: `jsconfig.json`
lacks the `@/entities/all`, `@/functions/*`, `@/integrations/Core` aliases that
vite/vitest define, and its include/exclude list is a leftover. A typecheck that always
fails protects nothing.

**Prompt:**

```text
Make npm run typecheck a real signal. In jsconfig.json: add paths for @/* -> src/* plus
the virtual aliases @/entities/all -> src/api/entities.js, @/functions/* ->
src/api/functions.js (match the resolution in vite.config.js:28-33), include all of
src/, drop the stale excludes (keep excluding src/components/ui — vendored shadcn).
Then fix the residual real errors until tsc passes; where a fix would mean refactoring
runtime code, prefer targeted // @ts-expect-error with a reason. Finally add typecheck
as a fourth job in .github/workflows/ci.yml. Report the before/after error count in
the PR description.
```

### 1.3 Bundle diet (M)

**Why:** Main chunk is 1.34 MB (~402 KB gzip) against the spec's own 300 KB budget;
jspdf (390 KB) and html2canvas (202 KB) ship to everyone up front; `logLevel: 'error'`
hides the warning.

**Prompt:**

```text
Cut the bundle. 1) Remove logLevel: 'error' from vite.config.js so size warnings show.
2) Lazy-load the export/share path: jspdf and html2canvas must only load on user action
(share.js already dynamic-imports html2canvas — verify; find and fix whatever imports
jspdf statically). 3) Route-level code splitting: React.lazy each page in
src/pages.config.js with a Suspense fallback that matches the golden-hour field register
(plain wash, no spinner theater). 4) Add rollup-plugin-visualizer as a dev dep with an
"analyze" script. 5) Set build.chunkSizeWarningLimit to 350 and get the main chunk
under it (manualChunks for recharts and framer-motion if needed). Report before/after
gzip sizes per chunk in the PR description. Verify the app still boots through auth,
Today, a check-in, and a tarot draw (npm run build + preview).
```

### 1.4 E2E smoke + visual regression (L)

**Why:** 65 components, 6 pages, the API layer, and all edge functions have zero test
coverage; the 118 unit tests only cover pure logic. The spec (§13) already calls for
Playwright screenshots that were never built. Chromium is pre-installed in Claude
sessions (`/opt/pw-browsers/chromium`).

**Prompt:**

```text
Add Playwright e2e to vibe-check. Setup: @playwright/test as dev dep (use the
preinstalled browser via PLAYWRIGHT_BROWSERS_PATH or executablePath
/opt/pw-browsers/chromium — never playwright install), playwright.config.js running
against vite preview, a "test:e2e" script, and a CI job.

Auth strategy: the app requires Supabase auth. Add a test-mode seam — when
VITE_E2E_MOCK=1, src/api/supabase.js swaps in an in-memory stub client (auth always
signed in as a fixture user, from/insert/upsert backed by a Map keyed by table) so e2e
runs hermetically with no network. Keep the stub in src/test/e2e-stub.js and make the
production path completely unaffected.

Specs, in order of value:
1. first-run: sign-in stub -> Today shows the welcome state -> "Begin your first
   check-in" -> complete every ceremony step -> Today flips to the checked-in summary
   with streak "1 evening".
2. edit flow: re-enter ceremony pre-filled, change mood, save, summary updates.
3. practice: draw a three-card spread, reveal all (asserts the controlled flip fix),
   dusk register renders.
4. deep links: /Analytics?tab=archive&range=90 restores state.
5. Visual: screenshots of Today (both states), ceremony step 1, Cosmos, Practice at
   360/768/1280 widths with toHaveScreenshot and a sane maxDiffPixelRatio; commit the
   baselines.
```

### 1.5 Formatting + hooks + hygiene (S)

**Prompt:**

```text
Add Prettier (config matching the existing code style: 2-space, semicolons, double
quotes in JSX — inspect src/ first and pick what minimizes diff), a format script, and
one-time format of src/ (isolated commit). Add husky + lint-staged running
eslint --fix + prettier on staged files. Add "npm run format:check" to CI. Keep eslint
as the source of truth for correctness rules; prettier only for layout.
```

---

## Phase 2 — Finish the Golden Hour (the beauty debt)

The token system, motion, and registers are done and good. What remains is the
un-repainted third of the app — unfortunately including the exact surfaces a new user
meets while setting up. This is the highest-leverage *visual* work in the repo.

### 2.1 Repaint Cosmos + the cosmic components (L)

**Why:** `CosmicAddons.jsx` (411 lines) and `src/components/cosmic/*` (SystemToggle,
CorrespondenceMap, SystemReport, ProfileForm, CosmicContextBar, CosmicWisdomCard,
CosmicInsightBadge) still carry the rejected Watercolor Dawn palette: `orb-purple`
(CosmicAddons:217), dozens of `rgba(61,52,80)`/`rgba(105,95,128)` inline colors,
`glass-card`, `rounded-xl`, `btn-cosmic`, emoji glyphs (`✦`, `💡`), and "Save Settings"
copy. Spec §2 says: no dark purple anywhere, square corners, tokens only, verb+object
buttons.

**Prompt (split into two PRs if the diff exceeds ~800 lines):**

```text
Repaint the Cosmos surface to the Golden Hour system, per
docs/superpowers/specs/2026-07-02-golden-hour-redesign-design.md §2.

Scope: src/pages/CosmicAddons.jsx and all of src/components/cosmic/*. Rules:
- Zero hex/rgba color literals in JSX: replace every one with the --gh-* custom props
  or the mapped Tailwind semantic classes from src/index.css. Grep to zero when done
  (allow-list: none in this scope).
- Kill the purple: rgba(61,52,80), rgba(82,72,104), rgba(105,95,128), rgba(186,124,164)
  must not survive anywhere in the repo's cosmic/ files.
- Square corners: remove rounded-xl/rounded-lg (max rounded-sm on small controls).
- Field register styling: hairlines + alignment instead of boxed cards where the spec
  allows; remove glass-card/btn-cosmic/orb classes.
- Replace emoji glyphs (✦, 💡) with lucide icons already used elsewhere.
- Copy voice: verb+object buttons ("Save your cosmos", not "Save Settings"); warm,
  specific, second person; no em dashes; no italics.
- Do not change behavior: form state, dirty indicator, URL-synced tabs, AI calculate,
  ConflictNotice all keep working. This is a repaint, not a refactor.

Also fix bug fix #9 from the spec while in here: CosmicWisdomCard currently returns
null when the profile is empty (CosmicWisdomCard.jsx:90,156) — render an inviting
blank-state card instead ("Weave your cosmos to receive daily wisdom") linking to
createPageUrl("CosmicAddons").

Verify with the Playwright visual specs (update baselines deliberately) and manual
screenshots at 360/1280 in the PR description.
```

### 2.2 Repaint Layout, HealingBoard, tarot chrome, InviteModal (M)

**Prompt:**

```text
Finish the Golden Hour palette sweep outside Cosmos. Targets, per the audit:
- src/Layout.jsx: hardcoded #C2503C/#F2952E/#C4699A/#8FA8D8 (lines ~47/59/93/195/215),
  the purple active-nav gradient (rgba(61,52,80)...), rounded-xl, gradient-text mobile
  title, decorative ✦ avatar, and the placeholder "Your Journey / Aligned & expanding"
  pill — replace the pill with something true: current streak ("6 evenings") and moon
  phase glyph from src/features/loom/MoonGlyph.jsx.
- src/pages/HealingBoard.jsx: 13 rounded-* and its hex literals -> tokens, square
  corners; keep the dusk-adjacent warmth but on-token.
- src/components/tarot/*: hex literals -> the dusk register tokens in index.css.
- src/components/InviteModal.jsx: tokens + copy voice.
After this PR, `grep -rn "#[0-9A-Fa-f]\{6\}" src --include=*.jsx | grep -v index.css`
should return only the ceremony confetti color array — assert that in the PR
description. Then delete the transitional legacy-class remap block in index.css
(L185-212) if nothing references those classes anymore.
```

### 2.3 Micro-polish pass: the details that read as "crafted" (M)

**My additions** — small things that separate a polished product from a good prototype:

**Prompt:**

```text
A craft pass across vibe-check. Each item is small; do them all in one PR:
1. Today.jsx:172 links via the legacy name createPageUrl("TarotReading") — use
   createPageUrl("Practice") directly.
2. Focus management in the ceremony: on each step change, move focus to the step
   heading (tabIndex={-1} + ref.focus()) so keyboard/screen-reader users track
   progress; on save, return focus to the Today summary heading.
3. Add ambient tab-title state: document.title = "Vibe Check" normally, "Vibe Check —
   your evening awaits" when today has no check-in yet (set in Today, reset in Layout).
4. Empty-state art: the Loom "unwoven" state and Analytics empty state currently use
   plain copy — add a faint, static SVG of the loom's ring geometry (reuse
   src/lib/geometry.js ringPoints) as a background hint of what's coming.
5. Toast consistency: the app has both react-hot-toast and sonner installed — pick one
   (sonner, already themed), migrate the ~handful of call sites, remove the other dep.
6. Prefetch: on hover/focus of nav items, dynamically import the target page chunk
   (pairs with route-splitting from Phase 1.3).
7. 404 page (src/lib/PageNotFound.jsx) — restyle to field register with a "Return to
   Today" action if it isn't already.
Verify: lint, test, build, e2e; screenshot the ceremony and empty states.
```

---

## Phase 3 — First-run magic and mobile reality

New-user activation and daily retention live here. The daily ritual only works if the
app is on the user's phone and gently reminds them.

### 3.1 Onboarding where the geometry assembles (L)

**Why:** Innovation #11 from the spec was never built — first-run currently drops into a
welcome card + a form. The brand moment is watching *your* Loom weave itself as you give
it your birth data. This is the single best "wow" available with zero new backend.

**Prompt:**

```text
Build the bespoke first-run onboarding for vibe-check (innovation #11 in
docs/superpowers/specs/2026-07-02-golden-hour-redesign-design.md).

Flow (new src/features/onboarding/, launched from Today's isFirstRun state, skippable
at every step, one question per screen in the sky register, same step pattern as
CheckInCeremony):
1. "What should we call you?" (name -> profile).
2. "When did you arrive?" (birth date; optional time + place with an honest note that
   time unlocks the rising sign).
3. As each answer lands, the right side / background shows the Loom assembling LIVE:
   after the name, the empty ring draws itself (stroke-dashoffset); after the birth
   date, the resonance engine (src/lib/resonance/derive.js — it already auto-computes
   everything derivable from date+name) plots numerology + sun placement nodes with a
   bloom animation; threads ignite as correspondences appear. Reuse
   Loom/useLoomLayout/geometry.js; reduced-motion gets crossfades.
4. Final screen: "Your loom is woven. It changes with the sky." -> CTA "Begin your
   first check-in" straight into the ceremony.
Persist answers via the existing cosmic profile save path (single write at the end, no
dual-save race). Mark onboarding complete in the profiles table (new migration:
onboarded_at timestamptz) so it never re-triggers, and add a "Replay welcome" entry in
SettingsSheet. Playwright spec for the full path. This flow must never dead-end: skip
always lands on Today.
```

### 3.2 Mobile: safe areas, PWA, install (M)

**Why:** No `viewport-fit=cover`, no `env(safe-area-inset-*)` anywhere, so notch devices
clip; there's no manifest/service worker, so no home-screen presence — fatal for a daily
ritual app. (Spec §14 deferred this; for market it's due.)

**Prompt:**

```text
Make vibe-check installable and correct on phones.
1. index.html: viewport-fit=cover; add env(safe-area-inset-*) padding to Layout's
   mobile top bar, the slide-in drawer, and the ceremony's bottom actions (audit: zero
   env() usage in the repo today).
2. Mobile nav: replace the hamburger-only pattern with a bottom tab bar on <md screens
   (5 items, existing icons, field-register background, safe-area padded, active state
   in --gh-accent). Keep the drawer for settings/invite overflow. Thumb reach beats
   hamburger for a daily-use app.
3. PWA: real manifest.json (icons from Phase 0.3), vite-plugin-pwa with a
   generateSW strategy — precache the app shell, runtime-cache Supabase GETs
   network-first. The existing UpdateToast (src/features/shell/UpdateToast.jsx +
   version.json polling) must keep working — integrate the SW update event with that
   toast rather than adding a second reload prompt.
4. iOS niceties: apple-touch-icon, status-bar-style, splash background #FFFDFA.
Test: Playwright mobile viewport spec (390x844) asserting the tab bar, no horizontal
scroll, and ceremony actions above the home indicator inset.
```

### 3.3 Reminders that respect the ritual (M)

**Why:** A daily check-in product without a reminder loop bleeds retention. Web push is
flaky on iOS Safari; email is the reliable v1. The spec removed the fake notification
toggle — this makes it real.

**Prompt:**

```text
Build real check-in reminders, email-first.
1. Migration: reminders columns on profiles (reminder_enabled bool default false,
   reminder_hour_local int, timezone text — capture Intl.resolvedOptions().timeZone at
   opt-in).
2. New edge function send-reminders, invoked by Supabase pg_cron every hour: select
   users whose local reminder hour is now and who have no check-in for their local
   today (compute with the same period-key logic as
   supabase/functions/_shared/common.ts), send one warm email ("The golden hour is
   here — how did today actually feel?") with a deep link to /Today. Use Resend via a
   RESEND_API_KEY secret; include a stub path like askClaude's when the key is unset.
   Idempotency: log sends in a reminder_log table keyed (user_id, date) so a cron
   retry can't double-send.
3. SettingsSheet: an honest reminder section (enable, hour picker, "email for now —
   push is coming"). Copy voice per spec.
4. Flag for the user in the PR: pg_cron enablement + Resend domain verification happen
   in dashboards outside this repo.
Unit-test the "who is due now" selection logic as a pure function with timezone edge
cases (UTC±, DST) in the vitest suite.
```

---

## Phase 4 — The intelligence layer earns its keep

The AI surface is architecturally sound (cached, JWT-gated, honest stub when unkeyed).
Make it excellent and cost-shaped.

### 4.1 Turn the key, tier the models (S)

**Prompt:**

```text
Prepare the LLM layer for production traffic. In supabase/functions/_shared/common.ts:
1. Parameterize the model per call site instead of the hardcoded claude-opus-4-8:
   daily weather -> claude-haiku-4-5-20251001 (short, daily, cheap), cosmic wisdom
   weekly/monthly/yearly -> claude-sonnet-5, tarot interpretations -> claude-sonnet-5.
   Keep max_tokens proportionate (weather 600, wisdom 2000).
2. Migrate the forced-tool-call structured output pattern to the current
   output_config.format JSON-schema API (check the claude-api skill / docs for exact
   shape) — same schemas, less prompt overhead.
3. Stop leaking raw upstream error text to clients (generate-cosmic-wisdom:114) — log
   it server-side, return a stable friendly message.
Remind the user in the PR description to set ANTHROPIC_API_KEY as a function secret —
until then the app intentionally shows stub copy.
```

### 4.2 Wisdom that proves it knows you (M)

**Why:** The resonance graph is the product's soul; the LLM context should showcase it.
Generic horoscope prose is the failure mode.

**Prompt:**

```text
Upgrade the cosmic wisdom + daily weather prompts in supabase/functions/ to lean on
the resonance graph. The client already sends a resonance summary (WeatherLine.jsx:22);
extend generate-cosmic-wisdom's context to include: active edges today (which
placements the current moon phase + personal day touch, from the serialized graph),
the user's last 7 days of check-in aggregates (mood/energy trend — fetch via the
user-bound client, RLS applies), and any unacknowledged boundary alerts. Rewrite the
system prompts to require: (a) reference at least one *specific* correspondence by
name ("your Chariot birth card squares today's..."), (b) one concrete, small
suggestion tied to the data, (c) 120 words max for daily, (d) the app's copy voice —
warm, specific, second person, no em dashes, no mysticism-as-vagueness. Keep the JSON
schemas. Add a "Why this?" affordance on CosmicWisdomCard that expands to show which
placements and check-in signals fed the reading — the transparency is the brand.
```

### 4.3 Week in Review as a ritual artifact (M)

**Prompt:**

```text
Elevate Week in Review (src/features/patterns/WeekInReview.jsx) into the shareable
weekly ritual: a single beautiful field-register card composing the week's mood/energy
sparkline (recharts), moon-phase strip (MoonGlyph), top correlation insight
(lib/correlations.js), people who appeared most, and the weekly wisdom. Add "Save your
week" via the existing share.js html2canvas path, rendered 1080x1920 (story format)
with the wordmark. Surface it on Today every Sunday post-check-in ("Your week is
woven — see it") and deep-link /Analytics?tab=week. E2E screenshot spec included.
```

### 4.4 Synergy + tarot depth (M)

**Prompt:**

```text
Deepen the two premium-feel readings:
1. Person synergy: People.jsx already persists synergy readings — add resonance-graph
   cross-referencing: compute shared hexagrams/planets/numbers between the user's
   profile and the person's cosmic_snapshot client-side (extend
   src/lib/resonance/graph.js with a synergyEdges(profileA, profileB) pure function +
   tests), display the computed overlaps as a mini correspondence list, and feed them
   into the LLM synergy prompt so the reading cites real structure.
2. Tarot: persist AI interpretations onto the readings row (schema already has the
   column), pass the drawn spread + the user's birth card + today's moon phase into
   the interpretation prompt, and render a reading history list in Practice
   (deep-linkable, deletable with AlertDialog).
Both respect the Phase 0 rate limits. Unit-test synergyEdges exhaustively.
```

---

## Phase 5 — Go to market

### 5.1 The front door: landing experience (L)

**Why:** Today, an anonymous visitor hits the AuthGate. There's no story, no screenshots,
no reason to sign up. The AuthGate is pretty; it is not a pitch.

**Prompt:**

```text
Build the logged-out landing experience for vibe-check as a pre-auth route in the
existing app (no separate site; SPA route "/" when signed out, AuthGate moves to
/signin and modal-from-CTA).

Sections, sky register, Instrument Serif display type, all existing tokens:
1. Hero: "How did today actually feel?" — one sentence of promise ("A daily check-in,
   woven into your cosmic map"), CTA "Begin free", secondary "See how it works". A
   LIVE demo Loom (seeded fixture profile, animating exactly like the real one) as
   the hero visual — the product IS the visual, no stock art.
2. The loop in three beats: check in each evening -> watch patterns emerge -> your
   loom changes with the sky. Use real screenshots (from the Playwright visual
   baselines) in device frames.
3. "Computed, not fortune-cookie": a short section that shows a real correspondence
   with its derivation — the honesty is the differentiator.
4. Privacy promise: your entries are yours; encrypted export anytime; delete anytime.
5. Footer: privacy policy, terms, contact.
Keep it under 60KB of new JS (reuse everything). SEO: real h1, meta from Phase 0.3,
static prerender of this route if trivial with vite (otherwise ensure the SPA shell
has the meta). E2E spec: anonymous visit renders landing; "Begin free" reaches signup;
signed-in visit redirects to /Today.
```

### 5.2 Legal + trust minimum (M)

**Prompt:**

```text
Add the trust layer required to onboard strangers:
1. /privacy and /terms as simple field-register pages (react-markdown over md files in
   src/content/legal/). Draft honest, readable policies for: what's stored (check-ins,
   profile, people), where (Supabase), LLM processing (entries summarized to Anthropic
   for readings — say it plainly), no sale of data, export + deletion rights, contact
   email. Include a clear "this is reflective/entertainment wellness content, not
   medical or mental-health advice" disclaimer, shown also as one line under boundary
   alerts. Mark both docs DRAFT FOR LEGAL REVIEW in a comment.
2. Account deletion: SettingsSheet gains "Delete your account" (type-to-confirm
   AlertDialog, offers export first) calling a new delete-account edge function that
   verifies the JWT and uses the service role to delete the auth user — the schema's
   on delete cascade wipes all rows. Add the missing delete policy on profiles for
   consistency.
3. Consent checkbox at signup linking both docs.
```

### 5.3 Observability + product analytics (M)

**Prompt:**

```text
Instrument vibe-check for launch, privacy-first:
1. Errors: add Sentry (@sentry/react) gated on VITE_SENTRY_DSN, with beforeSend
   scrubbing: never send check-in content, reflections, high/low moments, or people
   names — allow only component stacks and error messages. Wire AppErrorBoundary to
   report. Also add Sentry Deno SDK to the three edge functions.
2. Product analytics: PostHog (EU host) gated on env key, autocapture OFF, explicit
   events only: signup, onboarding_completed, checkin_saved (properties: streak,
   step_count — no content), wisdom_viewed, reading_drawn, share_exported,
   reminder_optin, invite_sent. Add a single src/lib/analytics.js wrapper so no
   component imports posthog directly, and a kill switch in SettingsSheet ("Share
   anonymous usage" toggle, default on, honest copy).
3. A tiny /status heartbeat: version.json already exists — surface build version in
   SettingsSheet footer.
Document the two env keys in README. Both tools no-op silently when unkeyed.
```

### 5.4 Monetization: the Inner Circle tier (L)

**Why:** LLM costs are per-use, so a free tier needs a ceiling and a paid tier funds the
product. The natural split: the computed engine is free forever (it costs nothing and is
the moat); the generative layer is metered free / unlimited paid.

**Prompt:**

```text
Add a subscription tier to vibe-check using Stripe Checkout + customer portal
(hosted — no card UI in-app).

Free: full check-ins, loom, patterns, people, tarot drawing, 5 AI readings/day
(tighten the Phase 0 quota). Inner Circle ($6/mo or $48/yr placeholder pricing):
unlimited daily readings, weekly/monthly/yearly wisdom, synergy readings, tarot AI
interpretations, story-format share exports.

Implementation:
1. Migration: subscriptions table (user_id unique, stripe_customer_id,
   stripe_subscription_id, status, current_period_end), RLS select-own only.
2. Edge functions: create-checkout-session (JWT-verified, creates/reuses customer,
   returns session URL), stripe-webhook (verifies signature with STRIPE_WEBHOOK_SECRET,
   service-role upserts subscription status on checkout.session.completed /
   customer.subscription.updated/deleted), create-portal-session.
3. Quota check in _shared reads subscription status: active -> generous cap (200/day
   abuse ceiling), else free cap.
4. Client: src/lib/subscription.js (useSubscription hook via react-query), an upsell
   card that appears exactly where a free user hits a gate (quota copy from Phase 0
   becomes "That's today's five — Inner Circle is unlimited"), and a Manage
   Subscription row in SettingsSheet -> portal.
5. Copy voice throughout; no dark patterns: the free tier must remain genuinely good.
Flag Stripe dashboard setup (products, prices, webhook endpoint, secrets) for the user.
E2E: mock the subscription row and assert gates open/close.
```

### 5.5 The growth loop: invites that carry meaning (M)

**Why:** `InviteModal` currently copies a bare origin URL and its email button throws.
The product has a built-in viral mechanic nobody's using: synergy readings *require* a
friend.

**Prompt:**

```text
Rebuild invites around the synergy hook.
1. Migration: invites table (id, inviter_user_id, token unique, invitee_email null,
   accepted_by null, created_at), RLS: inviter sees own.
2. Invite URL becomes origin/?invite=<token>; the landing page (Phase 5.1) recognizes
   it: "Tennyson wants to weave your charts together" (inviter first name via a
   SECURITY DEFINER rpc that exposes only first name for a valid token).
3. On signup with a token: create the People link both directions (the schema's
   people.linked_user_email path), mark accepted, and land the new user in onboarding.
4. After both have profiles: both sides get a "Your synergy with <name> is ready"
   card on Today -> People synergy reading.
5. InviteModal: generate + copy the tokenized link, native share sheet on mobile
   (navigator.share), remove the throwing email button. Optional email send can come
   later via the Resend path from Phase 3.3.
Track invite_sent/invite_accepted via the analytics wrapper. Tests for the token rpc
(SQL) and an e2e for the invite landing state.
```

---

## Phase 6 — Full potential (the ideas that make it a brand)

Ordered by leverage; each is a self-contained future PR prompt. Pull these in whenever
the phases above are green.

1. **Loom as a living wallpaper (M):** a `/loom/today` fullscreen route rendering the
   day's loom with slow ambient motion — usable as a phone lock-screen export (tall
   share card) and as the PWA's opening splash. *Prompt seed: "Add a fullscreen ambient
   Loom route with a 9:16 export, reusing useLoomLayout + share.js."*
2. **Insight notifications with teeth (M):** when `lib/correlations.js` crosses a
   confidence threshold ("your energy dips 2 days before the full moon — 5 of the last
   6 cycles"), surface it as a Today card and in the weekly email. The engine exists;
   this is packaging honesty as delight.
3. **Voice check-in (M):** a mic button in the ceremony's reflection step —
   MediaRecorder -> a transcribe edge function -> text lands in the reflection field.
   Keeps the evening ritual friction near zero.
4. **Moon circles (L):** small private groups (3–12 people) sharing streaks and moon
   phase only — never entries. A shared "circle loom" showing everyone's placements on
   one wheel. This is the retention + acquisition flywheel after 1:1 invites.
5. **Year in the Loom (M):** an annual generative recap (the "Wrapped" play) — 365 moon
   phases, mood ribbon, the year's strongest thread. Shipped every January; shareable.
6. **Capacitor wrapper (L):** once PWA metrics prove retention, wrap for the App
   Store/Play Store for real push notifications and ambient widgets (today's moon +
   streak). The bottom-tab mobile IA from Phase 3.2 makes this near-free.
7. **Seasonal registers (S):** the sky gradient subtly tracks the actual season/solstice
   (computed, of course — the brand rule: nothing cosmetic that pretends to be cosmic).

---

## Sequencing at a glance

| Order | Phase | Outcome | Size |
|---|---|---|---|
| 1 | 0. Launch blockers | Safe to let strangers in | 4 PRs, S/M |
| 2 | 1. Dev flow | CI-gated, typechecked, e2e-covered, small bundle | 5 PRs |
| 3 | 2. Golden Hour debt | Every surface on-brand | 3 PRs |
| 4 | 3. First-run + mobile | Onboarding wow, installable, reminded | 3 PRs |
| 5 | 4. Intelligence | AI that cites its math, cost-shaped | 4 PRs |
| 6 | 5. Go to market | Landing, legal, analytics, billing, invites | 5 PRs |
| 7 | 6. Full potential | Brand moments + native | ongoing |

Two standing rules as this executes:

- **Protect the engine.** `src/lib/` stays pure and TDD'd; every new derivation
  (synergy edges, reminder due-ness, season register) lands with exhaustive unit tests
  first, like the existing 118.
- **Computed honesty is the brand.** Every feature must be able to answer "why am I
  seeing this?" with real structure — the Loom's threads, the wisdom card's "Why this?",
  the correlation's sample count. The moment the app hand-waves, it's just another
  horoscope app.

## Outside-the-repo checklist (dashboard work the code can't do)

- Supabase: set `ANTHROPIC_API_KEY` (Phase 4.1), `RESEND_API_KEY` (3.3), Stripe secrets
  (5.4); configure Site URL + Redirect URL allow-list for password reset (0.2); custom
  SMTP for auth emails; enable pg_cron (3.3); enable the Google OAuth provider (0.2).
- Vercel: env vars for Sentry/PostHog (5.3); confirm the production domain + rename the
  project off any Base44-era naming.
- Stripe: products/prices/webhook endpoint (5.4).
- A real domain, and a support/contact email for the legal pages (5.2).
