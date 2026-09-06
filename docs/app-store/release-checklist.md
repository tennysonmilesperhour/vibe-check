# Release checklist

## Required external setup

- [ ] Create the App Store Connect app record for **Vibe Check: Golden Hour** and `com.vibecheck.goldenhour`.
- [x] Use the active Supabase `vibe-check` project (`xyhbuqsxglfjbounogdz`).
- [x] Apply the initial schema, hardening migration, and AI quota migration.
- [x] Deploy all four Edge Functions with JWT verification enabled.
- [ ] Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` Edge Function secrets.
- [x] Keep public email/password sign-up enabled with email confirmation; no admin approval is required.
- [ ] Confirm the Supabase Auth redirect allowlist contains `https://vibe-check-flame-nu.vercel.app/**`.
- [x] Set production `VITE_SUPABASE_URL`, publishable key, `VITE_AUTH_REDIRECT_URL`, and `VITE_PUBLIC_APP_URL`.
- [ ] Set production `VITE_SUPPORT_EMAIL` after choosing the monitored support mailbox.
- [x] Add the production sitemap and its absolute URL to `public/robots.txt`.
- [ ] Confirm the support mailbox is monitored.

## Product verification

- [ ] Sign up, confirm email, sign in, reset password, and sign out.
- [ ] Start a check-in, close it as a draft, reopen it, save it, edit it, and reload.
- [ ] Turn off the network and confirm the offline notice and draft behavior.
- [ ] Enable, receive, change, and disable the evening reminder on a physical iPhone.
- [ ] Export plain and encrypted history; confirm all record groups are present.
- [x] Run the production release smoke test: authenticated CRUD, three reflection functions, account deletion, and cascade verification.
- [x] Delete a test account and verify Auth plus database records are gone.
- [ ] Exercise every AI action through the daily rate limit.
- [ ] Test VoiceOver and Voice Control through every common task on a physical iPhone.
- [ ] Test browser text zoom, reduced motion, sufficient contrast, color-independent cues, and the smallest supported iPhone layout.

## App Store Connect

- [ ] Capture and upload 6.9-inch iPhone screenshots using `screenshot-plan.md`; one to ten are allowed and one accepted 6.9-inch set can scale down.
- [ ] Confirm the target remains iPhone-only and portrait-only for version 1.0. If iPad or landscape support is enabled later, complete the additional layout testing and provide any newly required screenshots.
- [ ] Complete the age-rating questionnaire truthfully. Recommended from the current build: Health or Wellness Topics = Yes; Medical or Treatment Information = None; Unrestricted Web Access = No; User-Generated Content = No (content is private, not broadly distributed); Messaging/Social Media/Advertising = No; Gambling/Simulated Gambling/Loot Boxes = No. Tarot cards are randomized reflection prompts with no betting, wagering, purchases, or prizes. Expect Apple to calculate the final regional ratings (Health or Wellness Topics maps to 9+ on iOS 26).
- [ ] Enter the data disclosures from `privacy-labels.md` and recheck them against the production SDKs.
- [ ] Publish only accessibility labels that pass all common-task tests in `accessibility.md`.
- [ ] Complete export-compliance questions based on the final binary and counsel/account-owner guidance.
- [ ] Provide a seeded reviewer account and the review notes.
- [x] Replace production-domain placeholders in `metadata.md` and create a seeded reviewer account.
- [x] Build and visually inspect the Release app on an iPhone 17 Pro Max simulator.
- [x] Produce an Xcode 26 archive and signed App Store `.ipa` export.
- [ ] Upload build 1 after the matching App Store Connect app record exists; then select manual release.
