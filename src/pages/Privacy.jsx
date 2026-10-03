import React from "react";
import LegalPage from "@/features/shell/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="October 2, 2026">
      <p>This policy explains what Vibe Check collects, why it is used, where it is processed, and the choices available to you.</p>

      <h2>Information you provide</h2>
      <p>Vibe Check stores the information you choose to enter so it can provide your account, history, and personal patterns. This can include your email address, optional name, mood, energy and sleep scores, feelings, activities, journal text, relationship notes, questions, birth details, cosmic profile settings, and saved readings, stress states, practice responses, alignment reflections, report notes, preferences, a safety plan if you write one, and saved drafts. When you create an account we record that you confirmed you are 18 or older.</p>

      <h2>How we use information</h2>
      <p>We use your information to operate the app, sync your history, calculate your personal summaries, provide exports and account controls, and prevent abuse. We do not sell personal information, use it for advertising, or track you across other companies' apps or websites.</p>

      <h2>Where your information goes</h2>
      <p>Your account and app records are stored with Supabase, and the web app is hosted on Vercel. The current app calculates its patterns, reports, and symbolic reflections within the app; these features do not send your journal or profile to an external AI provider. The app's pages, fonts, and images come from Vercel with the app itself; they load no ads, analytics, or tracking scripts from other companies.</p>

      <h2>Device information</h2>
      <p>Saved unfinished check-ins and journal drafts sync to your account. While you write, a copy of your words is kept in the open browser tab so a reload or a dropped connection doesn't lose them; it is cleared when you sign out. If you turn on the app lock, your PIN is stored on this device only, as a salted hash, never as the PIN itself; it is not sent to us. To suggest support services for your region, the app reads your device's time zone and language settings on the device; the region you choose is remembered on this device only. If a check-in or journal entry can't reach your account because there's no connection, it's kept in this browser until it can be saved, then removed; signing out from Settings or deleting your account removes it too. The Help now pages work without an account and save nothing you choose there. So it can open without a connection, the app keeps its own files (pages, scripts, fonts, and images) in your browser; they contain none of your records. Vibe Check does not read HealthKit, your contacts, your device location, photos, microphone, or advertising identifier.</p>

      <h2>Your choices</h2>
      <p>You can choose and preview an export from Patterns or Settings. You can correct information inside the app and delete your Vibe Check account from Settings. Deletion permanently removes your Vibe Check records. Vibe Check, Campground, and Daily Digest share a sign-in service. If your sign-in also owns Campground or Daily Digest records, those records and the sign-in remain; otherwise your authentication record is deleted too. Your private journal is not published to the other apps. Any legacy device check-in drafts are removed when you sign out or delete your account. Downloaded exports and browser history remain under your control.</p>

      <h2>Security and retention</h2>
      <p>App records are protected by account-based access controls and encrypted network connections. We retain them while your account is active, then delete them when the account is deleted, except where a limited record must be kept to meet legal or security obligations. An exported file is under your control; encrypted exports cannot be recovered if you lose the password.</p>

      <h2>Age</h2>
      <p>Vibe Check is for adults 18 and older. If you believe someone under 18 has created an account, contact us so we can review and delete it.</p>

      <h2>Wellness information</h2>
      <p>Vibe Check is a reflection and entertainment tool, not a medical device or a substitute for professional care. If you are in immediate danger or crisis, contact local emergency services or a qualified crisis service. The <a className="touch-link underline" href="/support-now">Support now</a> page lists free services by region. Vibe Check never contacts anyone on your behalf.</p>

      <h2>Questions</h2>
      <p>Visit the <a className="touch-link" href="/support">support page</a> to contact us about privacy, access, correction, or deletion. We may update this policy as the product or legal requirements change; the date above identifies the current version.</p>
    </LegalPage>
  );
}
