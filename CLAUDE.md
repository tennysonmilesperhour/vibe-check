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

- Vite + React app (former Base44 project) on a Supabase backend, deployed on
  Vercel. Auth lives in `src/features/shell/AuthGate.jsx` and
  `src/lib/AuthContext.jsx`, over the Supabase client in `src/api/supabase.js`.
- Before committing non-trivial changes: `npm run lint` and `npm run build`.
- Some auth behaviour depends on Supabase project config (Site URL, Redirect
  URLs allow-list, custom SMTP), which lives outside this repo — flag those to
  the user when a fix needs them.
