# Vibe Check launch audit

Audit date: September 4, 2026

This is the pre-fix technical and product-quality snapshot for the Sunday launch pass. It covers the public acquisition surface, authentication, daily check-in, Patterns, People, Practice, Cosmos, Settings, legal pages, PWA assets, and the Capacitor iOS shell.

## Audit health score

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 3/4 | Core semantics are sound, but some secondary controls are under 44 points, Cosmos fields lack reliable programmatic labels, and charts need a text alternative. |
| 2 | Performance | 3/4 | Route splitting and dynamic imports are good; the font stylesheet still blocks through a CSS import and the initial shared bundle remains the largest chunk. |
| 3 | Responsive design | 3/4 | The primary flow is fluid down to 320 px, but mobile Cosmos tabs and some Practice controls need more room. |
| 4 | Theming | 2/4 | Golden Hour tokens are strong, but legacy Cosmos surfaces still contain undefined tokens, low-opacity text, and scattered hard-coded colors. |
| 5 | Anti-patterns | 3/4 | The product is visually distinctive; legacy glass-card naming/shadows and mystical overstatement weaken trust in optional features. |
| **Total** | | **14/20** | **Good, with release issues concentrated in optional secondary surfaces.** |

## Anti-pattern verdict

The primary product does not look generically AI-generated. The sunset ritual, field workspace, and dusk table form a coherent identity. Cosmos is the exception: repeated bordered cards, soft wide shadows, low-contrast pastel text, and inflated copy make it feel less deliberate than Today and Patterns.

## Executive summary

- Audit health: **14/20, Good**
- Issues: **0 P0, 4 P1, 5 P2, 3 P3**
- Launch priority: make all controls reliably tappable; give Cosmos fields accessible names; expose chart data to assistive technology; repair legacy contrast and tokens.
- Product priority: preserve the short daily ritual and keep AI, tarot, and cosmic systems optional.

## P1 findings

### Secondary controls do not consistently meet the 44-point target

- **Location:** mobile drawer, authentication mode links, Practice deck choices, check-in chips, Cosmos profile chips and shared Slider.
- **Category:** Accessibility / Responsive design
- **Impact:** users with limited dexterity can miss controls, especially on smaller iPhones.
- **Standard:** Apple 44 by 44 point guidance; WCAG 2.2 Target Size.
- **Recommendation:** give every interactive control a minimum 44-point hit region without visually inflating dense layouts.
- **Suggested command:** `$impeccable adapt`

### Cosmos form controls lack dependable accessible names

- **Location:** `ProfileForm.jsx` and the name/birth fields in `CosmicAddons.jsx`.
- **Category:** Accessibility
- **Impact:** screen-reader users can encounter selects and inputs without a useful announced label.
- **Standard:** WCAG 1.3.1 and 3.3.2.
- **Recommendation:** associate labels with controls or provide a semantic fieldset/legend grouping where a compound control is used.
- **Suggested command:** `$impeccable harden`

### Pattern charts have no equivalent data representation

- **Location:** mood timeline and moon-phase chart in `Analytics.jsx`.
- **Category:** Accessibility
- **Impact:** screen-reader users receive the section name but cannot inspect the values conveyed visually.
- **Standard:** WCAG 1.1.1.
- **Recommendation:** add concise summaries and visually hidden data tables alongside the charts.
- **Suggested command:** `$impeccable harden`

### Legacy Cosmos text misses dependable contrast

- **Location:** `CosmicAddons.jsx`, `SystemToggle.jsx`, `SystemReport.jsx`, `CorrespondenceMap.jsx`, and `ProfileForm.jsx`.
- **Category:** Accessibility / Theming
- **Impact:** small descriptive copy is difficult to read on bright surfaces and can fail WCAG AA.
- **Standard:** WCAG 1.4.3.
- **Recommendation:** replace low-opacity purple/gray values and undefined warm-gray variables with Golden Hour ink tokens.
- **Suggested command:** `$impeccable colorize`

## P2 findings

- **Mobile Cosmos tabs:** four equal columns are cramped around 320 px. Use two rows on narrow screens.
- **External font import:** move Google Fonts from CSS `@import` to preconnected document links to reduce stylesheet blocking.
- **Settings organization:** reminder preferences save through a separate button positioned in the Boundaries section. Rename the action so its broader scope is clear.
- **Chart interpretation:** add a compact legend so sighted users do not have to infer line colors.
- **Mystical certainty:** optional AI prompts sometimes ask for an “irreducible truth.” Reframe outputs as reflection and possibility, not authoritative identity claims.

## P3 findings

- Remove obsolete decoration nodes and unused Cosmos constants.
- Replace the legacy wide glass-card shadow with a flat tokenized surface.
- Standardize active and disabled states for custom action buttons.

## Positive findings

- The daily check-in has a clear one-question-per-screen flow and preserves local drafts.
- First-run activation no longer diverts users into profile setup.
- Reduced-motion behavior is global and explicit.
- Private app routes are excluded from indexing while public legal and product surfaces remain discoverable.
- AI features are rate-limited server-side and visually secondary to local pattern computation.
- Data export, encrypted export, password recovery, and in-app account deletion are present.
- Route-level code splitting keeps Analytics, Practice, and Cosmos out of the initial task flow.

## Recommended actions

1. **[P1] `$impeccable harden`:** repair form naming, chart alternatives, error feedback, and settings semantics.
2. **[P1] `$impeccable adapt`:** normalize 44-point targets and mobile Cosmos/Practice layouts.
3. **[P1] `$impeccable colorize`:** migrate legacy Cosmos copy and surfaces to accessible Golden Hour tokens.
4. **[P2] `$impeccable clarify`:** remove authoritative AI language and clarify what settings are saved.
5. **[P3] `$impeccable polish`:** flatten legacy shadows, remove dead decoration, and verify final rhythm.

Re-run the audit after fixes to score the release candidate.

## Post-remediation release-candidate audit

The recommended hardening, responsive, color, copy, and polish changes were applied and verified on September 4, 2026.

| # | Dimension | Pre-fix | Release candidate | Evidence |
|---|---|---:|---:|---|
| 1 | Accessibility | 3/4 | 4/4 | Semantic form labels and states, 44-point targets, chart tables, Loom detail controls, focus states, and reduced-motion behavior are implemented. Physical VoiceOver/Voice Control sign-off remains a submission task. |
| 2 | Performance | 3/4 | 3/4 | Route splitting, deferred PDF/image code, font preconnect, and a 2.4 MB total build are in place. The shared React/Supabase shell remains the largest bundle. |
| 3 | Responsive design | 3/4 | 4/4 | Browser-tested at 320, 768, and 1440 CSS pixels with no horizontal overflow or undersized visible targets. Cosmos and Practice controls reflow at narrow widths. |
| 4 | Theming | 2/4 | 4/4 | Legacy Cosmos surfaces, exports, controls, and copy now use the Golden Hour hierarchy and contrast tokens. |
| 5 | Anti-patterns | 3/4 | 4/4 | Authoritative AI language, decorative glow, dead Cosmos UI, nested clickable cards, and obsolete visual code were removed or replaced. |
| **Total** | | **14/20** | **19/20** | **Release-candidate quality; production infrastructure and physical-device acceptance remain.** |

### Resolved findings

- All four P1 findings were remediated: touch sizing, Cosmos accessible names, chart alternatives, and contrast.
- All five P2 findings were remediated: mobile tabs, font loading, settings save placement, chart legend, and AI certainty.
- All three P3 findings were remediated: dead decoration/code, wide legacy shadow, and inconsistent action states.
- The acquisition flow was additionally improved after browser testing: web visitors now see product value before authentication, while the installed iPhone app opens directly to account access.

### Verification completed

- ESLint and TypeScript checks pass.
- 101 tests across 15 files pass.
- The Vite production build passes and the production dependency audit reports zero vulnerabilities.
- Public, legal, support, and not-found behavior was browser-tested at phone, tablet, and desktop widths.
- The iPhone-only Capacitor release shell synchronizes and the Xcode Release simulator build validates successfully.
- The release app was installed and visually inspected on an iPhone 17 Pro Max simulator.

### Remaining acceptance work

- Configure the production Supabase project, domain, support email, public app URL, and AI secret.
- Test authenticated data and deletion flows against that production-like backend.
- Complete physical-iPhone notification, VoiceOver, Voice Control, text-size, and reduced-motion testing.
- Capture final seeded screenshots, complete App Store Connect privacy/age/export answers, add review credentials, sign, archive, and upload.
