# Vibe Check: expert review plan

**Date:** 2026-09-29 · **Status:** In progress
**Basis:** A seven-lens expert review of `main` at `e8e0692` (engineering, product design, visual design, psychology, spiritual and cultural, business, marketing). This plan supersedes the sequencing in the July roadmaps where they conflict.

## Decisions (from the user)

- **Adopt the review's recommendations**, with one exception: Vibe Check keeps the Supabase project it shares with Campground and Daily Digest. No separate project and no schema move.
- **Tobacco is retired as the persona** (September 29, 2026). PR 1 replaced it with the plants' collective voice.
- **The plants' voice is retired too** (October 2, 2026). Notes are plain, with no speaker label and no “we.” Plant companions stay as optional chakra journal prompts. See [plant voice](../design/plant-voice.md).

## Sequence (one PR each, merged per CLAUDE.md)

| # | PR | Scope |
| --- | --- | --- |
| 1 | The plants' voice | Replace Tobacco in UI copy, readings, tests, and docs; this plan |
| 2 | Never lose writing | Silent auth revalidation on refocus; network errors are not sign-outs; autosave and confirm-before-close; stale-deploy chunk recovery; charts off first load; bundle budget |
| 3 | Safety path | Region-aware support resources; unsafe and boundary-not-respected entries lead to help; low-mood notices renamed, opt-in, honest, with a next step; quick exit; optional app lock; re-authentication before deletion or full export; neutral sign-up message; 18+ age gate |
| 4 | Honest patterns | Stress patterns compared against the base rate with with/without counts; only explicitly chosen states; days-recorded continuity instead of streak pressure; no percent-healed; measurement and matching fixes; onboarding choices tailor the check-in |
| 5 | Symbolic content | Contain Cosmos (tarot, symbolic wisdom, synergy); distress guard; rewrite bypassing copy; Human Design and Gene Keys reframing; accuracy fixes; provenance, origin notes, non-affiliation; IP paraphrases |
| 6 | Export and data rights | Encrypted export that scales and can be opened in-app; complete export; therapist summary; stop storing third-party emails, birth time, and birth city |
| 7 | Visual system | Font tokens and weights, 12px floor, one dialog pattern, destructive styles, loading states, mobile fixes, human-readable dates |
| 8 | Navigation and flows | Mobile tab bar and safe areas; one Add entry point; per-person timeline; highlights; one-action first run; help-now steps first; reports letter; orbit meaning; share defaults |
| 9 | Performance and cleanup | Cached per-entity queries; lighter save path; dead code, unused dependencies, and removed-AI leftovers |
| 10 | Tests and CI | Browser smoke tests on a mocked backend, accessibility checks, bundle budget, CI hardening |
| 11 | Landing and trust | Public landing page and free-forever pledge; public help-now pages; consumer health data policy; self-hosted fonts; one message across surfaces |
| 12 | Offline | Service worker, offline shell, save queue, in-app “your week is ready” |

After launch readiness: importers, the affect-grid check-in, the living-plant view of the record, a values card sort, provenance chips with “doesn't fit” votes, end-to-end encrypted notes, reminders, a weekly letter, and membership.

## Needs the user (outside the repo)

- A domain, a support address on it, and the legal entity name for the policies.
- A trademark search and a decision on the name: the App Store already lists “VibeCheck: daily mood journal” in the same category.
- Legal review of the consumer health data policy, privacy policy, and terms.
- Gene Keys: a license, or approval to replace the key names with original reflections, before any paid depth.
- A payment processor that approves astrology and tarot content (Stripe lists psychic services and fortune tellers as restricted), and final pricing.
- Supabase dashboard: leaked-password protection and redirect URLs for the PKCE sign-in flow.
- Vercel: Skew Protection.
- Accounts for error reporting, email (reminders, weekly letter), and web push keys, when those PRs arrive.

## Standing rules from the review

- Never gate history, reports, export, or practices. Never show an upgrade after a distressing or unsafe entry.
- No ad pixels or third-party tracking SDKs. Analytics stay first-party, aggregate, consented, and free of journal content, names, and health events.
- No “therapy,” “heal,” “cure,” or “reset your nervous system” claims.
- Symbolic readings never override the user's record of what happened.
