# Vibe Check — Function & Beauty Plan

September 8 update: The [product foundation](../design/product-foundation.md)
now governs free access, the daily/weekly/monthly journey, and optional paid
depth. Use that direction where this historical plan conflicts with it.

**Date:** 2026-07-16 · **Status:** Proposed
**Basis:** Fresh audit on commit `59ecd7e` (lint, tests, build, live Supabase/Vercel
state, and rendered screenshots of every surface at desktop + phone widths against
fixture data). Companion to the 2026-07-07 market-readiness roadmap — this document
re-sequences it for one goal: **the app fully functioning and genuinely beautiful,
soon.** Items here reference roadmap sections where a detailed prompt already exists.

---

## 1. What changed since the July 7 roadmap

The biggest strategic shift: **PR #10 moved the product to a local, deterministic
wisdom engine.** Every reading surface (deep dives, tarot spreads, blueprint, synergy,
patterns, period wisdom) now composes from `src/lib/wisdom/` with zero API calls.
That quietly resolved the roadmap's #1 launch blocker (uncapped LLM spend) — almost.

What remains of the LLM layer today:

- `generate-cosmic-wisdom` — **deployed but has zero callers.** Dead in prod.
- `generate-daily-weather` — called by `WeatherLine.jsx`, but `ANTHROPIC_API_KEY`
  is unset, so it stubs and the weather line **silently never renders in prod**.
- `invoke-llm` — called only by the Cosmos "AI calculate" button
  (`CosmicAddons.jsx:153`), same unset-key stub. Note the resonance engine already
  auto-populates everything date/name-derivable (PR #3), so the button's honest
  value is near zero.
- All three functions are still live with `verify_jwt` but **no rate limits** —
  any signed-in account could hammer them if a key were ever set.

Current health, verified this session: `npm run lint` clean, 145/145 tests pass,
build succeeds, prod deploy on Vercel is current `main`. Supabase advisors show
only warnings (see §4). RLS is complete and correct on every table.

## 2. The decision this plan is built on (needs Tennyson's yes/no)

**Go fully computed for v1.** Delete all three edge functions and the client
plumbing (`api/integrations.js`, `api/functions.js`, the `WeatherLine` server
round-trip), and:

- Rebuild the daily **cosmic weather** on the local engine (`periodWisdom` +
  `resonanceGraph` already produce daily material) so it *always* renders —
  today it never does.
- Replace the Cosmos **"AI calculate"** with the deterministic auto-populate that
  already exists, presented honestly ("Computed from your birth date").

Why: it matches the brand line the roadmap itself drew — *computed honesty is the
brand* — and it makes the whole cost-control workstream (roadmap 0.1) unnecessary.
Zero spend, zero quota UX, no Anthropic dependency, and the app's most-repeated
copy bug ("AI-generated deep reading", "AI insights") becomes a simple copy fix.
If a generative layer returns later (e.g. a paid tier), it re-enters through one
gated function with quotas, per roadmap 0.1/5.4.

## 3. What the screenshots showed (the beauty audit, with receipts)

Rendered at 1440×900 and 390×844 against a full fixture profile:

**Already beautiful:** the AuthGate sky, Today's hero + ceremony (sky register,
Instrument Serif, the wave hairline), the Practice dusk register, the Loom with the
new sacred-geometry figures, Patterns' warm field register. The core loop feels
crafted.

**Where it visibly breaks character:**

1. **Cosmos below the Loom hero** — the first thing a new user configures — is
   off-brand admin UI: colored emoji system icons (🐏 🧬 🃏 🌀), per-system pastel
   "Active" pill badges, gray boxed cards with `rounded-xl`, stock toggle switches,
   a floating dark "Save Settings" pill, and copy that says "appear in your AI
   insights."
2. **Deep Dive tab** promises "an AI-generated deep reading" — false since PR #10,
   and against the brand either way.
3. **CosmicWisdomCard** (rendered on Today *and* Analytics) still wears the rejected
   purple palette (`rgba(61,52,80)`), `rounded-2xl`, emoji header, pulsing glow —
   and still returns `null` when the profile is empty instead of inviting setup.
4. **Sidebar**: the placeholder "Your Journey / Aligned & expanding" pill (should be
   real: streak + moon phase), plus legacy hex accents in `Layout.jsx`.
5. **Ceremony step 1**: the 1–10 mood squares are washed-out white-on-amber — the
   single most-touched control in the app deserves a real anatomy (selected state,
   hover, numbers with contrast).
6. **Browser chrome**: `<title>Base44 APP</title>`, no meta/OG, manifest link 404s,
   package named `base44-app`, README onboards to Base44.com.
7. **Mobile**: hamburger-only nav, no safe-area handling, not installable. Fine in a
   browser tab; not yet a daily-ritual app on a phone.

Remaining off-token color literals (excluding vendored `ui/` and the tarot deck
data, which legitimately encodes suit/card colors): concentrated in `Layout.jsx`,
`components/cosmic/*`, `CosmicWisdomCard`, `InviteModal`, `HealingBoard`,
`CheckInCeremony` (4), and the purple rgba family in 9 files.

## 4. Platform flags (dashboard work, 15 minutes)

- Supabase advisors: `set_updated_at` lacks a pinned `search_path`;
  `handle_new_user` is executable by `anon`/`authenticated` roles (revoke EXECUTE);
  leaked-password protection is off. First two land as a migration in A2; the
  last is a dashboard toggle.
- No CI exists (`.github/` absent) while CLAUDE.md's merge flow assumes it.
- `npm run typecheck` emits ~244 errors (alias config, not real bugs) — a signal
  that protects nothing.
- Main JS chunk is 1.43 MB (jspdf/html2canvas are already split out; the main
  bundle itself has no route splitting).

## 5. The plan — three arcs, one PR each line

Sized S/M/L as in the roadmap. Detailed prompts: where a roadmap section is cited,
use its prompt amended by the notes here.

### Arc A — Make it true (functioning)

| # | What | Size | Notes |
|---|------|------|-------|
| A1 | **Identity + repo truth**: title, meta, OG, favicon set, real manifest, package rename, README rewrite, delete `base44/` + import script | S | Roadmap 0.3 + 0.4, merged |
| A2 | **Go fully computed**: remove the three edge functions + client LLM plumbing; local cosmic weather on Today; deterministic "Calculate from birth data" in Cosmos; fix advisor warnings in the same migration | M | §2 above — supersedes roadmap 0.1/4.1 |
| A3 | **Auth completion**: forgot-password flow, recovery screen, check-in upsert race fix | M | Roadmap 0.2 (skip Google OAuth for now) |
| A4 | **CI + typecheck**: workflow (lint/test/build/typecheck), fix jsconfig aliases, PR template, dependabot | M | Roadmap 1.1 + 1.2, merged |

### Arc B — Make it beautiful (the debt, then the polish)

| # | What | Size | Notes |
|---|------|------|-------|
| B1 | **Repaint Cosmos** (`CosmicAddons` + `components/cosmic/*`): tokens only, square corners, lucide/SVG glyphs replacing emoji, field-register system rows instead of boxed toggles, "Save your cosmos", computed-honesty copy everywhere ("Computed, not generated"), wisdom-card blank state | L | Roadmap 2.1 + the Deep Dive copy fix |
| B2 | **Repaint the chrome**: Layout hexes + purple nav gradient, Journey pill → live streak + moon glyph, CosmicWisdomCard onto Golden Hour (it sits on Today), InviteModal, HealingBoard | M | Roadmap 2.2 |
| B3 | **Craft pass**: ceremony mood-scale anatomy, focus management between steps, single toast lib, 404, empty-state loom art, tab-title state, legacy-class remap deletion | M | Roadmap 2.3 + ceremony scale (§3.5) |
| B4 | **Bundle diet**: route-level code splitting, visualizer, chunk budget, unsilence build warnings | M | Roadmap 1.3 |
| B5 | **E2E + visual baselines**: Playwright smoke + screenshots. This session already proved the approach — a fixture profile + intercepted Supabase REST renders every surface deterministically; port that harness into `src/test/` as the `VITE_E2E_MOCK` seam | L | Roadmap 1.4 |

### Arc C — Make it a daily companion (Theo on his phone)

| # | What | Size | Notes |
|---|------|------|-------|
| C1 | **Onboarding where the Loom assembles live** | L | Roadmap 3.1 — the wow moment, zero new backend |
| C2 | **Mobile reality**: bottom tab bar, safe areas, PWA install, iOS niceties | M | Roadmap 3.2 |
| C3 | **Email reminders** (Resend + pg_cron) | M | Roadmap 3.3; needs dashboard setup |

Everything go-to-market (landing page, legal, analytics, billing, invites) stays
parked in roadmap Phase 5 until the app has earned it with Arcs A–C.

### Suggested order

A1 → A2 → B1 → B2 → A3 → A4 → B3 → B4 → C1 → C2 → B5 → C3.
Front door first (A1), then the truth cleanup (A2) so B1's copy work happens once,
then the two repaints while momentum is visual. CI (A4) lands before the heavier
B3/B4 refactors it protects.

## 6. Standing rules (carried forward)

- Protect `src/lib/` purity: every new derivation ships with exhaustive unit tests.
- Computed honesty: every surface must answer "why am I seeing this?" with real
  structure. After A2 there is no generated content anywhere — say so proudly in
  the UI copy.
- One prompt ≈ one PR ≈ one session, per the CLAUDE.md working agreement.
