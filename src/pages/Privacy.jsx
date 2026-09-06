import React from "react";
import LegalPage from "@/features/shell/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="September 4, 2026">
      <p>This policy explains what Vibe Check collects, why it is used, where it is processed, and the choices available to you.</p>

      <h2>Information you provide</h2>
      <p>Vibe Check stores the information you choose to enter so it can provide your account, history, and personal patterns. This can include your email address, optional name, mood, energy and sleep scores, feelings, activities, journal text, relationship notes, questions, birth details, cosmic profile settings, and saved readings.</p>

      <h2>How we use information</h2>
      <p>We use your information to operate the app, sync your history, calculate your personal summaries, provide exports and account controls, prevent abuse, and generate a reflection when you ask for one. We do not sell personal information, use it for advertising, or track you across other companies' apps or websites.</p>

      <h2>Where your information goes</h2>
      <p>Your account and app records are stored with Supabase. When you explicitly request an AI reflection, the profile details, saved context, or question needed for that request are sent through our server to Anthropic. Supabase and Anthropic process information as service providers so Vibe Check can provide these features.</p>

      <h2>Device information</h2>
      <p>Unfinished check-in drafts stay on your device. Notification permission is requested only when you enable a reminder, and the reminder itself is scheduled by your device. Vibe Check does not read HealthKit, your contacts, your device location, photos, microphone, or advertising identifier.</p>

      <h2>Your choices</h2>
      <p>You can export your history from Settings. You can correct information inside the app and delete your account from Settings. Account deletion permanently removes your authentication record and the app records attached to it. Device drafts are removed when you sign out or delete your account.</p>

      <h2>Security and retention</h2>
      <p>App records are protected by account-based access controls and encrypted network connections. We retain them while your account is active, then delete them when the account is deleted, except where a limited record must be kept to meet legal or security obligations. An exported file is under your control; encrypted exports cannot be recovered if you lose the password.</p>

      <h2>Children</h2>
      <p>Vibe Check is not designed for children. If you believe a child has provided personal information without appropriate permission, contact us so we can review and delete it.</p>

      <h2>Wellness information</h2>
      <p>Vibe Check is a reflection and entertainment tool, not a medical device or a substitute for professional care. If you are in immediate danger or crisis, contact local emergency services or a qualified crisis service.</p>

      <h2>Questions</h2>
      <p>Visit the <a className="touch-link" href="/support">support page</a> to contact us about privacy, access, correction, or deletion. We may update this policy as the product or legal requirements change; the date above identifies the current version.</p>
    </LegalPage>
  );
}
