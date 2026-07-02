# Vibe Check — Golden Hour Redesign

**Date:** 2026-07-02 · **Status:** Approved direction, pending spec review
**Scope:** Full redesign in one run: visual system, IA, core loop, Resonance Engine, the Loom, all 20 approved innovations, bug fixes, housekeeping.

## 1. Vision

Vibe check becomes a shareable product with portfolio-piece polish: a cosmic wellness tracker whose seven wisdom systems (astrology, human design, gene keys, numerology, tarot archetype, enneagram, chakras) connect through *computed* correspondences rather than loose prose, visualized in a living sacred-geometry mandala ("the Loom"), wrapped in a Golden Hour visual language, navigated through five intuitive surfaces.

Platform stays **Base44** (React 18 + Vite + Tailwind + shadcn/Radix, Base44 SDK entities/functions). No framework migration.

## 2. Visual system — "Golden Hour"

Chosen via mockup review (option 4). The surface commits to light: saturated rose-to-gold gradient skies, flowing translucent veils, soft sun glow. Ink is warm rose-brown, never black, never dark purple.

### Tokens (single source of truth; kills all hardcoded hexes)

| Token | Value | Role |
|---|---|---|
| `--gh-rose` | #F48CA0 | gradient top, accents |
| `--gh-peach` | #F79E7E | gradient mid |
| `--gh-amber` | #FAB05E | gradient mid-low |
| `--gh-gold` | #FDC94E | gradient horizon, highlights |
| `--gh-cream` | #FFFDF6 | text on gradient, light surfaces |
| `--gh-ink` | #5A2430 | primary text ink (rose-brown) |
| `--gh-ink-soft` | #7A3040 | secondary text |
| `--gh-ink-muted` | #A6606E | captions, labels |
| `--gh-accent` | #C2503C | emphasis, links, active states |
| `--gh-field` | #FFFDFA | app body background (etheric register) |

Two registers, one palette:
- **Sky register** (ritual moments: check-in ceremony, Loom hero, onboarding): full `linear-gradient(165deg, rose → peach → amber → gold)` surfaces, cream text, translucent veils (SVG paths at 16–30% cream).
- **Field register** (working surfaces: Patterns, People, lists, forms): near-white `--gh-field` ground with drifting radial washes of rose/gold/peach at 24–30% alpha, ribbon hairlines, ink text. No boxes where hairlines + alignment suffice.
- **Dusk register** (tarot table only): warm deep umber-burgundy ground (#2E1418 → #4A1E28 gradient) with gold — replaces the current violet/purple tarot palette. No dark purple anywhere in the app.

Existing shadcn HSL vars are remapped to these tokens so ui/ components inherit automatically. The old Watercolor Dawn tokens, `.glass-card`, orbs, and the three competing palettes are removed.

### Type, shape, motion

- **Display:** Instrument Serif, roman only. *Italics are banned app-wide, especially in heroes.* Scale ceiling 6rem; letter-spacing ≥ -0.01em; `text-wrap: balance` on headings.
- **Body/UI:** Space Grotesk (retained from current app) 400/500/700.
- **Corners:** square. `--radius: 0` base; 2px max on small controls. Circles are reserved for meaning: suns, moons, mandala geometry.
- **Motion:** framer-motion (already a dependency). Ease-out expo curves, no bounce. Page transitions = 250ms fade+4px rise. The Loom animates by drawing (stroke-dashoffset) and blooming (scale+opacity from center). Every animation has a `prefers-reduced-motion` fallback (crossfade or none). Content never gated behind animation triggers.
- **Copy voice:** warm, specific, second person. No em dashes. No marketing buzzwords. Buttons are verb+object ("Begin check-in", "Save today").

## 3. Information architecture — 10 nav items → 5

| Nav item | Absorbs | Job |
|---|---|---|
| **Today** | Dashboard + DailyLog + daily/weekly wisdom + alert display | The daily ritual and its afterglow |
| **Patterns** | Analytics + wisdom archive (monthly/yearly) + correlation insights | Reflection over time |
| **People** | Relationships + Constellation (merged) | Everyone you're in orbit with |
| **Practice** | TarotReading + HealingBoard | Active inner work |
| **Cosmos** | CosmicAddons + CosmicWisdom deep content + the Loom | Your map: profile, systems, resonances |

- Boundaries page is dissolved: thresholds/settings → a Settings sheet (gear in sidebar footer); alerts surface inline on Today with acknowledge-in-place; detection runs automatically on check-in save.
- All five pages registered properly in `pages.config.js` (no more hand-wired routes). Old routes 301-redirect to their new homes.
- Every surface is deep-linkable: tab, filter, spread, and period state live in the URL (search params), written on change.
- Sidebar: five items, five distinct icons (no more triple-Sparkles), Invite a Friend retained, settings gear in footer.

## 4. Core loop — state-adaptive Today (chosen: "narrative hybrid")

- **Not yet checked in:** Today opens in sky register. Date + moon phase + "22 hours since your last entry" context line, then the ceremony CTA. Secondary path "Skip to reflection" for viewing without logging.
- **Checked in:** Today becomes field register: today's entry summary, streak, mini-Loom pulse, daily wisdom card, any boundary alerts (acknowledgeable inline), quick links.
- **Check-in ceremony:** multi-step, one question per screen (mood → energy → sleep → emotions → activities → optional high/low/reflection), the sky gradient deepening subtly with each step; person picker (not free text) on high/low moments; saves with a settle animation + toast, no hard redirect; editing today re-enters the ceremony pre-filled. Date changes prompt before discarding dirty state.
- Streaks framed as "N evenings"; canvas-confetti (already installed) fires once at 7/30/100 milestones, reduced-motion aware.

## 5. The Resonance Engine (new, pure client-side module `src/lib/resonance/`)

The seven systems share real structure; the engine makes it computable:

1. **Derivations (auto-compute, no LLM):**
   - Numerology: life path, expression, soul urge, personal year/month/day from birth date + name. Personal Year rolls on the user's birthday; Personal Month/Day roll on calendar boundaries.
   - Moon phase: local astronomical calc (no API); stamped onto every DailyCheckIn at save.
   - Tarot birth card + shadow card from life path (fixed Major Arcana mapping).
   - Gene Key ↔ HD Gate equivalence (same 64 hexagrams): Life's Work Key = Conscious Sun Gate; derive one from the other when only one is present.
   - HD centers ↔ chakras (fixed 9→7 table); Major Arcana ↔ planets/signs (fixed table).
2. **Validations:** when entered data contradicts a derivation (life path says Chariot, user entered Hermit), surface a gentle, dismissible notice with "use computed" one-tap fix. Never block saves.
3. **Resonance graph:** a serializable structure `{nodes: [system placements], edges: [{a, b, kind: hexagram|planet|number|center, strength, isActiveToday}]}` — computed from profile + today's moon phase + personal day + (when available) daily transits. Feeds the Loom and replaces the flat-text LLM context.
4. **Single source of truth for correspondences:** the three drifted pair-lists (5/8/11 copies) collapse into one module consumed by Analytics, Cosmos, and the wisdom function.

The engine is pure functions over plain data → unit-tested exhaustively (this is the TDD centerpiece).

## 6. The Loom (signature visualization, `src/components/loom/`)

Evolves `CosmicBlueprint.jsx` from 7 abstract nodes into a true map:

- **Coordinate system:** the zodiac wheel (12 signs) with the 64-hexagram/gate ring around it. The user's actual placements (sun, moon, rising, north node, gates/keys, birth card, life path anchor) are plotted at their true wheel positions.
- **Threads:** edges from the resonance graph drawn as flowing curves between placements that share a hexagram, planet, number, or center. Thread weight = resonance strength.
- **Progressive reveal retained:** profile completeness still unlocks geometry tiers (rings → interlocking triangles → hexagon → full Flower of Life), now rendered in Golden Hour light (translucent cream/gold strokes on sky) with draw-on animation.
- **Today layer:** current moon phase and personal day gently pulse the placements they touch; corroborating threads ignite gold. The Loom looks different every day, truthfully.
- **Interaction:** tap any node → what it is, which systems it links, "Deep dive" → Cosmos detail. Tap a thread → the correspondence explained (from the single correspondence module).
- **Tech:** inline SVG + framer-motion; shared polar/geometry utils extracted to `src/lib/geometry.js` (deduplicating CardGeometry/TarotCard/CosmicBlueprint helpers). No three.js (dependency removed). Reduced-motion: static render, opacity crossfades only.
- **Placement:** hero of Cosmos; a live miniature on Today (post-check-in state); share-card export.

## 7. Data model & integration changes

- **Person entity (new):** `{name, type, avatar_seed, linked_user_email?, cosmic_snapshot?, boundary_notes}` — merges Relationship + Connection. Check-ins store `person_ids[]` (picker with inline-create). One-time migration maps existing relationships/connections and best-effort matches historical `who_involved` strings, leaving unmatched strings intact.
- **Reading entity (new):** persisted tarot/oracle readings `{date, deck, spread, cards[{id, position, reversed}], question?, ai_interpretation?, linked_checkin_date?}`.
- **DailyCheckIn additions:** `moon_phase`, `personal_day`, `person_ids[]` (backfilled where computable).
- **CosmicWisdom:** unchanged schema; generation now receives the resonance graph serialization; period keys computed by one shared util (see dates).
- **Synergy readings:** persisted on Connection→Person; friend cosmic snapshots refreshed on view when the linked user's profile is newer.
- **Cosmic weather (new function `generateDailyWeather`):** once-daily cached LLM read of current transits vs natal placements, keyed like wisdom, feeding Today's context line and the Loom's today layer.

## 8. Date/time spine (fixes the off-by-one-day class of bugs)

New `src/lib/dates.js`, the only allowed date entry point:
- `parseLocalDate(yyyyMmDd)` — never `new Date(string)` on date-only strings anywhere (ESLint rule to enforce).
- `todayKey()`, `isTodayKey(key)` — local-day boundaries.
- `getPeriodKey(type, date)` — one implementation shared verbatim between client and the server function (copied into `base44/functions/` at build; drift covered by a unit test asserting identical outputs).
- Wisdom/weather rollover happens on the user's local midnight: the client requests with its local period key; server generates for the requested key.
- moment.js removed; date-fns only.

## 9. Bug fixes (all in scope)

1. `new Date(dateString)` UTC parsing → `parseLocalDate` everywhere (Dashboard:26,225; DailyLog:199; ProfileForm ×4).
2. Client/server period-key drift → shared util + test.
3. Tarot "Reveal All" doesn't flip card faces → `TarotCard` becomes controlled (`flipped` prop).
4. Shuffle-button theater → one honest action; seeded mode relabeled "Ritual seed (repeatable)".
5. Celtic Cross overlapping coordinates at small sizes → corrected layout table + responsive scaling.
6. Boundary alert dedupe (no duplicate alerts per condition per day); detection automatic on save.
7. "Password-protected" export claim removed; export includes full history; real encryption (WebCrypto AES-GCM) if a password is set.
8. Analytics `getFilteredData()` memoized; insights cached per filter-set in session.
9. CosmicWisdom page blank-state → onboarding CTA into Cosmos profile setup.
10. Empty-state charts hidden until data exists; every empty state gets copy + a next action.
11. `window.confirm`/`prompt()` replaced with app dialogs (Relationships delete, HealingBoard milestones); Constellation delete gains confirmation.
12. HealingBoard items become deletable; milestones editable; raw range input → Radix slider.
13. CosmicAddons dual-save race → single profile form state with dirty indicator; tab changes write URL.

## 10. Housekeeping

- Remove unused deps: three, moment, html2canvas*, react-leaflet, react-quill, @stripe/*, @hello-pangea/dnd (*html2canvas stays — used by share cards, #16).
- Remove dead CSS (`.mood-ring`, `.sidebar-cosmic`, `.gradient-text-gold`), dead states (`animatingCards`), dead import alias (`useInviteState`).
- All pages registered in `pages.config.js`; `createPageUrl` used consistently.
- File-size rule: pages become thin compositions; sections extracted to feature folders (`src/features/today/`, `src/features/loom/`, ...); 800-line cap respected.

## 11. The 20 innovations → workstreams

| # | Innovation | Workstream |
|---|---|---|
| 1 | State-adaptive Today | W3 core loop |
| 2 | The Loom | W4 |
| 3 | Ceremony check-in | W3 |
| 4 | Person model + picker | W2 data |
| 5 | Date/time spine | W1 foundations |
| 6 | Moon phase engine | W1 |
| 7 | Auto boundary detection | W3 |
| 8 | Daily cosmic weather | W5 intelligence |
| 9 | Persisted readings + AI interpretation | W6 practice |
| 10 | Birth card in deck + Loom | W4 |
| 11 | Onboarding where geometry assembles | W7 polish |
| 12 | Streak ritual + confetti | W3 |
| 13 | Precomputed correlation insights | W5 |
| 14 | Motion system | W1 |
| 15 | Golden Hour tokens | W1 |
| 16 | Share cards (html2canvas) | W7 |
| 17 | Synergy persistence + refresh | W2 |
| 18 | Deep links everywhere | W1 |
| 19 | Honest export + real encryption | W2 |
| 20 | Week in Review ritual | W5 |

Build order: W1 foundations → W2 data → W3 core loop → W4 Loom → W5 intelligence → W6 practice → W7 polish. Each workstream lands as a coherent commit series; app stays runnable between workstreams.

## 12. Error handling & resilience

- Every LLM call: loading state, friendly failure copy, retry affordance; failures never blank a page.
- Resonance Engine: derivations return `{value, confidence, source}`; missing birth time degrades gracefully (rising sign marked unavailable, not wrong).
- Migrations: idempotent, additive-first (new fields/entities before any removal), dry-run logged.
- Base44 virtual modules (`@/entities/all`, functions) mocked in tests via Vite alias.

## 13. Testing & verification

- **Unit (vitest):** Resonance Engine (every derivation table), date spine (period keys incl. client/server parity, timezone edges, DST), streak logic, boundary detection. TDD for all pure modules.
- **Visual:** Playwright screenshots at 320/768/1024/1440 for Today (both states), ceremony steps, Loom, Patterns, tarot table; both registers.
- **A11y:** contrast ≥4.5:1 verified for ink-on-field and cream-on-gradient (the gradient's lightest band is the risk point — cream text there gets the deep-ink treatment instead); keyboard nav through ceremony and Loom; reduced-motion paths tested.
- **Perf:** landing JS budget <300KB gzipped (app page); Loom animation on compositor properties only; dead-dep removal measured.
- **Build:** `npm run build` + `npm run lint` green at every workstream boundary.

## 14. Out of scope (this run)

Native/PWA packaging, push notifications (the settings toggle is removed until a real delivery mechanism exists), multi-language, paid tiers, real-time multiplayer features beyond existing invite/connection flows.
