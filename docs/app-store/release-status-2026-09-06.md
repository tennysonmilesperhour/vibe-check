# Release candidate status — September 6, 2026

## Ready

- Production web app: `https://vibe-check-flame-nu.vercel.app/`
- Bundle ID: `com.vibecheck.goldenhour`
- Marketing version/build: `1.0 (1)`
- Supabase schema and all four Edge Functions deployed
- Public sign-up enabled; email confirmation required; no admin approval
- Dedicated reviewer account seeded with fourteen check-ins, two people, and one reading
- Automated lint, typecheck, unit tests, production build, and authenticated production smoke test
- iPhone 17 Pro Max Release build launched and visually inspected in Simulator
- Signed App Store `.ipa` exported locally

## Account-owner actions still required

1. Sign in to the App Store Connect tab left open by the release run and create the app record for **Vibe Check: Golden Hour** with bundle ID `com.vibecheck.goldenhour`.
2. Choose and monitor a support mailbox, then set it as `VITE_SUPPORT_EMAIL` in Vercel Production and rebuild the iOS binary.
3. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to Supabase if AI interpretations should be live in version 1.0. Without them, deterministic features work and AI actions return an honest unavailable state.
4. Confirm the Supabase redirect allowlist, export-compliance answers, age rating, privacy labels, and accessibility claims in their account dashboards.
5. Complete physical-iPhone reminder, VoiceOver, Voice Control, and offline testing.

The first direct upload attempt authenticated successfully with App Store Connect but stopped because no app record exists for the bundle ID. No binary was submitted to Apple.
