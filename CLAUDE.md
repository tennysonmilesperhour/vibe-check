# CLAUDE.md

Guidance for Claude Code working in this repository.

## Shipping changes: review + auto-merge

When you make a change and open a pull request for it, carry it all the way to
merged without waiting for the user to click merge — unless the user says
otherwise for a given change. The agreed flow:

1. Push the change and open the PR (ready for review, not draft).
2. Run a self code-review on the diff (the `/code-review` skill).
3. Wait for CI / the Vercel deployment check to go **green**.
4. Once CI passes and the review surfaced nothing real, **squash-merge** into
   `main`.

Do **not** merge if CI fails or the self-review finds a genuine problem — fix
it and re-push instead. Pause and ask the user first only when the change is
ambiguous, architecturally significant, or destructive.

Caveats to be honest about:

- GitHub blocks a PR author from submitting a formal **Approve** review on their
  own PR, so "approve" here means the self code-review + merge, not a GitHub
  approval.
- If `main` has branch protection requiring an approval from another account,
  the merge will be blocked. Report that to the user rather than forcing it.

## Project notes

- Current plan: [Expert review plan](docs/roadmap/2026-09-29-expert-review-plan.md),
  September 29, 2026. The user adopted the review's recommendations except a
  separate backend (the Supabase project stays shared). Work through its PR
  sequence.
- Product foundation: [Free access to your own patterns](docs/design/product-foundation.md).
  Journaling, people and habit patterns, full history, weekly/monthly reports,
  stress pattern recognition, matched somatic recommendations with full
  instructions, and user-reported response and alignment history,
  export, and privacy controls form the free baseline. Optional paid systems
  add depth. ChatGPT or other external AI is never required for the baseline.
  This direction supersedes conflicting priorities in older roadmaps.
  Support the user's movement from “not-self” to “self” through their own
  definitions of needs, values, and choice. Do not infer identity or alignment
  from calmness, mood, a chakra, or a personality system.
  Offer immediate free actions for confusion, fight or flight, anger,
  shutdown, emotional numbness, and procrastination, with a mixed/unsure
  path. Match the user's selected experience and feedback; no journal history
  is required, and no practice guarantees a state will disappear.
- Voice: plain copy with no persona. Notes speak to the user directly, with
  no speaker label and no "we". The user retired Tobacco (September 29, 2026)
  and then the plants' collective voice (October 2, 2026); history in
  [The voice of the plants](docs/design/plant-voice.md). Optional chakra plant
  companions stay as journal prompts. The listed pairings are proposals.
- Current visual direction: [Nature Sanctuary](docs/design/nature-sanctuary.md),
  updated September 8, 2026. Use this for visual work; it supersedes conflicting
  Golden Hour and twilight guidance. The shared visual system is implemented.
- Vite + React app (former Base44 project) on a Supabase backend, deployed on
  Vercel. Auth lives in `src/features/shell/AuthGate.jsx` and
  `src/lib/AuthContext.jsx`, over the Supabase client in `src/api/supabase.js`.
- Before committing non-trivial changes: `npm run lint` and `npm run build`.
- Some auth behaviour depends on Supabase project config (Site URL, Redirect
  URLs allow-list, custom SMTP), which lives outside this repo — flag those to
  the user when a fix needs them.
