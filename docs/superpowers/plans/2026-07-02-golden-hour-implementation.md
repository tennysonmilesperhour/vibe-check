# Golden Hour Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild vibe-check per the 2026-07-02 Golden Hour spec: new visual system, 5-item IA, state-adaptive Today, Resonance Engine, the Loom, all 20 innovations, 13 bug fixes.

**Architecture:** Base44 React/Vite app. Pure logic in `src/lib/` (TDD, vitest). Feature UI in `src/features/<area>/`. Pages become thin compositions. One token system in `index.css` consumed via Tailwind vars. Spec: `docs/superpowers/specs/2026-07-02-golden-hour-redesign-design.md` (authoritative for anything not restated here).

**Tech Stack:** React 18, Vite, Tailwind + shadcn/Radix, framer-motion, date-fns, recharts, vitest (+ @testing-library/react where needed), Base44 SDK (`@/entities/all`, `@/functions`, `@/integrations/Core` virtual modules — alias-mocked in tests).

**Working rules for every task:** TDD for `src/lib/**`. Run `command npm run lint && command npm run build` at each workstream boundary. Commit per completed task with conventional messages. No italics, no dark purple, no em dashes in copy, square corners, tokens only (no hex literals in JSX).

---

## File structure (target)

```
src/
├── lib/
│   ├── dates.js            # ONLY date entry point (parseLocalDate, todayKey, isTodayKey, getPeriodKey, addDaysKey)
│   ├── geometry.js         # polar, starPoints, ringPoints, arcPath (shared by loom/tarot)
│   ├── deeplink.js         # useSearchParamState(key, default)
│   ├── crypto.js           # encryptJson/decryptJson (AES-GCM via WebCrypto)
│   └── resonance/
│       ├── numerology.js   # lifePath, expression, soulUrge, personalYear/Month/Day
│       ├── moon.js         # moonPhase(dateKey) → {phase, name, illumination}
│       ├── tables.js       # GATE_WHEEL, ARCANA_ASTRO, CENTER_CHAKRA, LIFE_PATH_CARD, CORRESPONDENCE_PAIRS (single source)
│       ├── derive.js       # deriveAll(profile) → {values, conflicts}
│       └── graph.js        # resonanceGraph(profile, dateKey) → {nodes, edges}
├── features/
│   ├── today/    (TodayHero, CheckInCeremony, StreakMoment, AlertInline, TodaySummary)
│   ├── loom/     (Loom, LoomThread, LoomNode, MiniLoom, useLoomLayout)
│   ├── patterns/ (TrendCharts, CorrelationCards, WisdomArchive, WeekInReview)
│   ├── people/   (PersonPicker, PersonCard, PersonDetail, SynergyPanel)
│   ├── practice/ (TarotTable, ReadingHistory, HealingBoard sections)
│   ├── cosmos/   (ProfileSections, SystemToggles, DeepDives, ConflictNotice)
│   └── shell/    (Sidebar, SettingsSheet, PageTransition, SkyField, VeilField)
└── pages/        (Today, Patterns, People, Practice, Cosmos — thin)
base44/
├── entities/ Person.jsonc, Reading.jsonc (+ DailyCheckIn additions)
└── functions/ generateDailyWeather/entry.ts (+ periodKey.shared.js copied from src/lib)
```

---

## W1 — Foundations

### Task 1.1: Vitest setup + Base44 virtual-module mocks
**Files:** Modify `package.json`; Create `vitest.config.js`, `src/test/mocks/entities.js`
- [ ] `command npm i -D vitest` ; add script `"test": "vitest run"`
- [ ] `vitest.config.js`: node env, alias `@/entities/all`→`src/test/mocks/entities.js` (exports Proxy returning no-op entity objects), same for `@/functions` and `@/integrations/Core`; alias `@`→`/src`
- [ ] Smoke test `src/lib/__tests__/smoke.test.js`: `expect(1+1).toBe(2)`; run `command npm test` → PASS; commit `chore: vitest + base44 mocks`

### Task 1.2: dates.js (TDD)
**Files:** Create `src/lib/dates.js`, `src/lib/__tests__/dates.test.js`
- [ ] Failing tests first: parseLocalDate returns local midnight (assert `.getDate()` equals day component for `2026-07-02` regardless of TZ); todayKey/isTodayKey round-trip; period keys: `getPeriodKey('daily', d)==='2026-07-02'`, `('weekly')==='2026-W27'` (ISO week), `('monthly')==='2026-07'`, `('yearly')==='2026'`; DST boundary (Mar 8 2026) stays same-day.
- [ ] Implement:
```js
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
export const parseLocalDate = (key) => { const [y,m,d] = key.split('-').map(Number); return new Date(y, m-1, d); };
export const dateKey = (date=new Date()) => format(date, 'yyyy-MM-dd');
export const todayKey = () => dateKey();
export const isTodayKey = (key) => key === todayKey();
export const getPeriodKey = (type, date=new Date()) => {
  if (type === 'daily') return dateKey(date);
  if (type === 'weekly') return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2,'0')}`;
  if (type === 'monthly') return format(date, 'yyyy-MM');
  return format(date, 'yyyy');
};
```
- [ ] Parity: copy body into `base44/functions/shared/periodKey.ts` (Deno-safe, no date-fns: implement ISO week manually there) + test asserting both produce identical keys for 40 sampled dates incl. year boundaries (Dec 29–Jan 4).
- [ ] Run tests → PASS; commit `feat: timezone-safe date spine with shared period keys`

### Task 1.3: Golden Hour tokens
**Files:** Rewrite `src/index.css`; modify `tailwind.config.js`
- [ ] Replace Watercolor Dawn: keep shadcn var names, remap values — background `40 45% 98%` (#FFFDFA field), foreground/ink `348 43% 25%` (#5A2430), primary `9 51% 50%` (#C2503C accent), muted-foreground `343 29% 54%` (#A6606E), border `348 20% 88%`, `--radius: 0rem`. Add `--gh-*` custom props exactly per spec §2 table. Charts: chart-1 rose, 2 amber, 3 accent, 4 peach, 5 ink-soft.
- [ ] Fonts: `Instrument+Serif` + `Space+Grotesk` import replaces Inter; `h1,h2,h3,.font-display{font-family:'Instrument Serif';font-style:normal}` + global `em,i{font-style:normal}` guard.
- [ ] Utility classes: `.sky-surface` (165deg 4-stop gradient), `.field-wash` (radial rose/gold/peach washes on --gh-field), `.hairline` (1px ink/30 top border), `.ink-button`, `.cream-button`. Delete `.glass-card*`, orbs, motes, `.gradient-text*`, `.mood-ring`, `.sidebar-cosmic`, `!important` input overrides. Keyframes kept: none (framer-motion takes over); add `@media (prefers-reduced-motion: reduce){ *{animation:none!important;transition-duration:.01ms!important} }`.
- [ ] `command npm run build` → green; visual smoke via dev server; commit `feat: golden hour token system`

### Task 1.4: geometry.js extraction (TDD light)
**Files:** Create `src/lib/geometry.js` + test; modify `CardGeometry.jsx`, `TarotCard.jsx`, `CosmicBlueprint.jsx` to import
- [ ] `polar(cx,cy,r,angleDeg)`, `ringPoints(cx,cy,r,n,startDeg)`, `starPoints`, `arcPath(cx,cy,r,a1,a2)`; tests: polar(0,0,1,0)≈{x:1,y:0}, ringPoints length/n spacing.
- [ ] Replace the three duplicated helper sets with imports (no behavior change); build green; commit `refactor: shared geometry utils`

### Task 1.5: motion + shell primitives
**Files:** Create `src/features/shell/PageTransition.jsx`, `SkyField.jsx`, `VeilField.jsx`
- [ ] `PageTransition`: framer-motion `motion.div` fade + y:4→0, 250ms easeOut, `useReducedMotion()` → duration 0.
- [ ] `SkyField` (sky register wrapper: gradient + sun glow div + `VeilField` SVG translucent paths, aria-hidden) and `VeilField` accepting `intensity`.
- [ ] Commit `feat: motion + register primitives`

### Task 1.6: deeplink util
**Files:** Create `src/lib/deeplink.js`
- [ ] `useSearchParamState(key, defaultValue)` — reads from `useSearchParams`, writes with `setSearchParams(prev => …, {replace:true})`. Commit `feat: url state hook`

### Task 1.7: dependency + route hygiene
**Files:** Modify `package.json`, `src/pages.config.js`, `src/App.jsx`, `src/Layout.jsx`
- [ ] `command npm rm three moment react-leaflet react-quill @stripe/react-stripe-js @stripe/stripe-js @hello-pangea/dnd`
- [ ] Register Constellation/TarotReading/CosmicWisdom in `pages.config.js`; remove hand-wired routes from App.jsx (temporary until W7 merges pages); fix `useInviteState` dead import; build green; commit `chore: prune deps, register orphan routes`

## W2 — Data

### Task 2.1: entities
**Files:** Create `base44/entities/Person.jsonc`, `base44/entities/Reading.jsonc`; modify `base44/entities/DailyCheckIn.jsonc`
- [ ] Person: `{name*, person_type(enum: family|friend|partner|colleague|other), linked_user_email, cosmic_snapshot(object), snapshot_updated_at(date-time), qualities(array), concerns(array), boundary_notes, legacy_names(array)}` — legacy_names carries old free-text aliases for matching.
- [ ] Reading: `{date*, deck(enum tarot|oracle), spread, question, cards(array of {card_id, position, reversed}), interpretation, linked_checkin_date}`.
- [ ] DailyCheckIn add: `moon_phase(string)`, `personal_day(number)`, `person_ids(array)`. Commit `feat: person + reading entities`

### Task 2.2: person store + migration
**Files:** Create `src/lib/people.js` + test (pure matching logic), `src/features/people/PersonPicker.jsx`
- [ ] Pure fn `matchPersonByText(text, people)` → exact name → legacy_names → case-insensitive whole-word (NOT substring) — tests: "Mom" ≠ "Tom's mom"'s Tom, "Mom" matches "mom".
- [ ] `migratePeople()` idempotent: Relationship→Person (name+qualities+concerns+boundary_notes), Connection→Person (linked_user_email+cosmic_snapshot, snapshot_updated_at=created), dedupe by lowercase name; stores marker in user metadata `people_migrated_at`. Runs lazily from People/Today mount.
- [ ] PersonPicker: cmdk combobox listing Persons + inline "Add <name>"; multi-select chips. Commit `feat: unified person model + picker`

### Task 2.3: honest export + crypto
**Files:** Create `src/lib/crypto.js` + test; modify export flow (lives in SettingsSheet after W3; interim: Boundaries page)
- [ ] `encryptJson(obj, password)` → `{v:1, salt, iv, data}` base64 (PBKDF2 100k + AES-GCM); `decryptJson` round-trip test (vitest node webcrypto).
- [ ] Export ALL check-ins (paginate `DailyCheckIn.list` until exhausted) + alerts + profile; if password set → encrypted file `.vibecheck.enc.json`, else plain; remove `password_protected` flag lie and "legal documentation" copy. Commit `feat: honest full-history export with real encryption`

### Task 2.4: synergy persistence
**Files:** Modify Constellation logic (merges into People in W7): store `synergy_reading` + `synergy_generated_at` on Person; regenerate only when stale (snapshot newer) or user taps refresh; refresh `cosmic_snapshot` on detail open when linked user profile `updated_date` > `snapshot_updated_at`. Commit `feat: persist synergy readings`

## W3 — Core loop

### Task 3.1: streaks + boundary logic (TDD)
**Files:** Create `src/lib/streaks.js`, `src/lib/boundaries.js` + tests
- [ ] `computeStreak(checkIns, todayKey)` → consecutive-day count ending today/yesterday (tests: gap breaks, today missing counts yesterday-anchored, uses dateKey math not Date parsing). Milestones `[7,30,100]`, `isMilestone(n)`.
- [ ] `evaluateBoundaries(checkIns, settings)` → array of `{type:'low_mood'|'declining', date, message}`; `dedupeAlerts(newAlerts, existing)` keyed `type+date` (tests cover both). Commit `feat: streak + boundary engines`

### Task 3.2: ceremony
**Files:** Create `src/features/today/CheckInCeremony.jsx` (+ step components ≤120 lines each)
- [ ] Steps: mood → energy → sleep (large tap-dial 1–10, serif number display) → emotions (chips) → activities (chips) → optional moments (high/low: description + PersonPicker + intensity) → reflection → settle. One step visible; framer-motion slide; progress = thin gold line; sky gradient shifts one stop deeper per step (`SkyField intensity`). Esc/back preserves state; date change prompts.
- [ ] On save: create/update by dateKey; stamp `moon_phase` + `personal_day` (from resonance lib, W4 — until then leave undefined-safe); run `evaluateBoundaries` + create deduped alerts; toast (sonner) not redirect; confetti at milestone (dynamic import canvas-confetti, respect reduced motion). Commit `feat: ceremonial check-in`

### Task 3.3: Today page
**Files:** Create `src/pages/Today.jsx`, `src/features/today/*`; retire Dashboard.jsx + DailyLog.jsx (redirect)
- [ ] No entry today → SkyField hero: date/moon/context line, "Begin check-in", "Skip to reflection" (reveals summary below). Entry exists → field register: TodaySummary (scores, emotions, edit re-enters ceremony pre-filled), StreakMoment ("N evenings"), AlertInline (acknowledge in place), daily wisdom card, MiniLoom placeholder slot, quick links. 7-day average computed over 7 *days* not entries. Commit `feat: state-adaptive Today`

## W4 — Resonance + Loom

### Task 4.1: numerology.js (TDD)
- [ ] Tests: lifePath('1990-07-15')=5 *(1+9+9+0+7+1+5=32→5)*, master preservation lifePath('1992-11-29')… assert 11/22/33 kept at final reduce and component reduce; expression('Tennyson')…Pythagorean table; personalYear(birth '07-15', on '2026-07-02') uses 2025 pre-birthday year? NO — convention: personal year = reduce(birth_month+birth_day+current_year), rolls Jan 1 in classic system, birthday-roll per spec — implement birthday-roll and test both sides of birthday; personalMonth = reduce(PY+month), personalDay = reduce(PM+day).
- [ ] Implement with `reduceKeepMasters(n)` helper. Commit `feat: numerology engine`

### Task 4.2: moon.js (TDD)
- [ ] Synodic algorithm: epoch new moon `Date.UTC(2000,0,6,18,14)`, synodic 29.53058867d; `moonPhase(dateKey)` → `{index0to7, name, emoji, illumination}`; tests: 2026-06-14 ≈ new moon (within ±1 phase step of known ephemeris), full ≈ 2026-06-29; monotonic wrap. Commit `feat: moon phase engine`

### Task 4.3: tables.js + derive.js (TDD)
- [ ] `LIFE_PATH_CARD` (1..9,11,22,33 → arcana ids; 11→Justice(11), 22→Fool(0), 33→Empress via 3), `ARCANA_ASTRO` (22 rows, Golden Dawn), `CENTER_CHAKRA` (9→7), `GATE_WHEEL` (standard HD mandala sequence of 64 gates clockwise from 0° Aries — visualization-grade), `SIGN_DEGREES`, `CORRESPONDENCE_PAIRS` (the 11 pairs, single source; delete the 3 drifted copies and re-import everywhere).
- [ ] `deriveAll(profile)` → `{numerology:{...computed}, tarot:{birth_card, shadow_card}, gene_keys:{life_work_from_hd}, conflicts:[{field, entered, computed, source}]}` — tests: derivation, conflict detection (life path 7 + entered birth card 'The Hermit' vs computed 'The Chariot'), graceful missing birth_time. Commit `feat: derivation + validation engine`

### Task 4.4: graph.js (TDD)
- [ ] `resonanceGraph(profile, dateKey)` → nodes `{id, system, label, wheelDeg|null}` for each filled placement; edges kinds: `hexagram` (gate==key numbers), `number` (life path↔birth card), `planet/sign` (arcana↔astrology), `center` (HD↔chakra), `today` edges from moonPhase + personalDay touching matching nodes; `strength` 1|2 (2 when user filled both ends), `isActiveToday`. Tests on a fixture profile. Commit `feat: resonance graph`

### Task 4.5: Loom
**Files:** Create `src/features/loom/*`; retire CosmicBlueprint (Loom replaces; keep file until Cosmos rewire)
- [ ] `useLoomLayout(graph, size)`: zodiac ring (12 arcs, sign glyph text), gate ring (64 ticks via GATE_WHEEL), nodes at wheelDeg (fallback: inner ring for degree-less systems e.g. enneagram/chakras), curved threads (quadratic through center offset by kind).
- [ ] Render: SVG on SkyField; progressive tiers preserved from Blueprint logic (1+ ring…7 Flower of Life) in cream/gold translucent strokes; framer-motion draw-on (`pathLength` 0→1 staggered), bloom for circles; today layer pulses (scale 1→1.04 loop 4s) on active nodes, gold ignite on isActiveToday threads; reduced-motion → static + opacity fades.
- [ ] Interaction: node tap → popover (what/links/Deep dive→Cosmos deep-link); thread tap → correspondence text from tables. `MiniLoom` (compact, non-interactive, ~160px) wired into Today. Commit `feat: the Loom`

### Task 4.6: wire engine into app
- [ ] Ceremony save stamps moon_phase/personal_day (backfill helper for existing entries on Patterns mount); `buildCosmicContext` (server fn) receives serialized graph summary appended to prompt; ConflictNotice on Cosmos profile with one-tap "Use computed". Commit `feat: resonance engine wired`

## W5 — Intelligence

### Task 5.1: correlations.js (TDD): pearson(xs,ys) + `insightCards(checkIns, people)` → sleep→mood lag-1, moon-phase mood deltas, per-person mood delta (via person_ids), activity lift; thresholds |r|>0.3 & n≥7; plain-language card copy generator (no buzzwords). Commit.
### Task 5.2: `generateDailyWeather` function (clone wisdom fn shape; cache key `daily-YYYY-MM-DD` + systems_key; prompt = natal placements + date + moon phase; output {headline, guidance, active_points[]}) + Today context line + Loom today-layer input. Commit.
### Task 5.3: Patterns page: merge Analytics + wisdom archive tabs (`useSearchParamState('tab')`); charts on tokens; memoized filtering; insights precomputed on mount (cached per filter in sessionStorage); WeekInReview card appears Sundays (or `?review=last`) composed from week aggregates + wisdom theme; empty states with CTAs. Retire Analytics.jsx + CosmicWisdom.jsx pages. Commit.

## W6 — Practice

### Task 6.1: TarotCard controlled (`flipped` prop; remove internal state) — fixes Reveal All; dusk register palette swap (umber-burgundy #2E1418→#4A1E28 grounds, gold #FDC94E accents, cream faces; NO violet); geometry imports from lib. Commit.
### Task 6.2: honest shuffle (single "Shuffle & deal" action; optional seed input labeled "Ritual seed (repeatable)"); fixed Celtic Cross coordinates (no overlap at sm); remove `animatingCards`. Commit.
### Task 6.3: Reading persistence: save on deal (question optional), ReadingHistory list + reopen; "Interpret this spread" → InvokeLLM with cards + week context + resonance summary → stored `interpretation`; link to today's check-in; birth card badge in deck ("Your card") + Loom node. Commit.
### Task 6.4: HealingBoard: delete items (app dialog), milestones editable/removable via dialog (kill `prompt()`), Radix slider, tokens. Practice page composes TarotTable + HealingBoard tabs (`?tab=`). Retire TarotReading.jsx/HealingBoard.jsx pages. Commit.

## W7 — Polish & verification

### Task 7.1: People page: merged Person cards (mood-delta stat from person_ids matching, not substring), detail sheet (qualities/concerns/boundary notes/synergy panel with persisted reading + refresh), add/edit dialogs, styled delete confirm, "View in Patterns" cross-link (deep-linked person filter). Retire Relationships.jsx + Constellation.jsx. Commit.
### Task 7.2: Cosmos page: Loom hero; below: system toggles + profile sections (single form state, dirty indicator, one save), ConflictNotice, correspondences (from tables.js), deep dives (SystemReport kept, jsPDF), tab/url sync both ways. Retire CosmicAddons.jsx. Commit.
### Task 7.3: shell: 5-item Sidebar (Sun/ChartLine/Users/Layers/Sparkle icons — distinct), SettingsSheet (boundary thresholds, export, invite), PageTransition wrapper, redirects from all legacy routes, pages.config regenerated to 5 pages. Commit.
### Task 7.4: onboarding: first-run (no profile) → 3-step sky sequence (name/birth → systems pick → geometry assembles into first Loom render); wisdom empty states CTA here. Commit.
### Task 7.5: share cards: `shareCard(node, {title})` via html2canvas → downloads PNG (1080×1350 layout component: Loom snapshot / today summary / reading) from Today, Loom, ReadingHistory. Commit.
### Task 7.6: verification sweep: `command npm run lint && command npm run build` green; vitest suite green; Playwright (`command npx playwright screenshot` or minimal spec) at 320/768/1024/1440 on Today (both states), ceremony, Loom, Patterns, tarot; contrast audit of ink-on-field + cream-on-gold band (fix with deep-ink where <4.5); reduced-motion manual pass; grep bans: `italic`, `#8A72B8|purple`, `new Date\(['"]` outside lib/dates, hex literals in features/. Fix findings. Commit `chore: verification sweep`.

## Self-review notes
- Spec coverage: all §9 bugs land in tasks (1:1.2/3.x, 2:1.2, 3:6.1, 4:6.2, 5:6.2, 6:3.1, 7:2.3, 8:5.3, 9:7.4, 10:5.3, 11:6.4/7.1, 12:6.4, 13:7.2). Innovations 1–20 → tasks (1:3.3, 2:4.5, 3:3.2, 4:2.2, 5:1.2, 6:4.2, 7:3.1, 8:5.2, 9:6.3, 10:6.3, 11:7.4, 12:3.2, 13:5.1, 14:1.5, 15:1.3, 16:7.5, 17:2.4, 18:1.6+pages, 19:2.3, 20:5.3).
- Types consistent: dateKey strings everywhere; Person.person_ids on check-ins; graph node/edge shapes defined once (4.4) consumed by 4.5/5.2.
