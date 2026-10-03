import React from "react";
import LegalPage from "@/features/shell/LegalPage";

const supportEmail = "morphiclabsdata@gmail.com";

export default function Support() {
  return (
    <LegalPage title="Support">
      <p><strong>Need to talk to someone now?</strong> <a className="touch-link underline" href="/support-now">Free crisis and safety services</a> are listed on one page, with a safety plan you can keep. This email address isn't watched around the clock and can't help in an emergency.</p>
      <p>For help with signing in, exports, privacy, or account deletion, contact the Vibe Check team.</p>
      <p><a className="ink-button inline-flex items-center" href={`mailto:${supportEmail}?subject=Vibe%20Check%20support`}>Email support</a></p>
      <p>{supportEmail}</p>

      <h2>Before contacting support</h2>
      <ul>
        <li>Confirm you are using the same email address you used to create the account.</li>
        <li>Use “Forgot your password?” on the sign-in screen if you cannot sign in.</li>
        <li>Check-ins save a draft as you write. A check-in or journal entry saved without a connection is kept on this device and saved to your account when you're back online, even if you close the tab. Signing out from Settings deletes anything not yet saved, after telling you how much there is.</li>
        <li>If you set an app lock and forgot the PIN, choose “Forgot your PIN?” on the lock screen. It signs you out and removes the lock on that device; your records stay in your account.</li>
      </ul>

      <h2>Account deletion</h2>
      <p>Open Settings & privacy, scroll to Support & account deletion, and choose Delete Vibe Check account. If you cannot access the app, email support from the address associated with the account.</p>
    </LegalPage>
  );
}
