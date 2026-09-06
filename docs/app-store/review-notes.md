# App Review notes draft

Vibe Check is a private mood journal with optional reflection tools.

## Reviewer access

- Demo email: `app-review@vibecheck.invalid`
- Demo password: copy `REVIEWER_PASSWORD` from the untracked local `.env.review` file into App Store Connect.

The production demo account contains fourteen check-ins, two people, and one saved reading so Patterns can be reviewed immediately. Rerun `npm run seed:reviewer` if the dataset needs refreshing.

## Suggested review path

1. Sign in with the demo account.
2. Open Today and begin a check-in.
3. Complete the check-in or use “Save draft and close,” then reopen it.
4. Open Patterns to review existing history.
5. Open Settings to see reminders, export, sign out, legal links, and Delete account.
6. Open Practice for tarot and oracle reflection.
7. Open Cosmos for the deterministic Loom and optional AI interpretation.

## Important behavior

- Local notification permission is requested only when a reviewer enables the evening reminder.
- AI interpretations require network access and are rate limited.
- Cosmic profile values requiring specialist chart computation are user-provided. The app does not claim AI-generated chart values are factual.
- Account deletion is available in Settings and permanently deletes the Supabase Auth user. Related app records are removed by database cascade.

The password is intentionally excluded from version control. Paste it into App Store Connect only over the signed-in HTTPS session.
