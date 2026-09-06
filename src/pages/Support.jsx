import React from "react";
import LegalPage from "@/features/shell/LegalPage";

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;

export default function Support() {
  return (
    <LegalPage title="Support">
      <p>For help with signing in, exports, privacy, or account deletion, contact the Vibe Check team.</p>
      {supportEmail ? (
        <p><a className="ink-button inline-flex items-center" href={`mailto:${supportEmail}?subject=Vibe%20Check%20support`}>Email support</a></p>
      ) : (
        <p role="status" className="support-warning">The support email has not been configured for this build. The app owner must set <code>VITE_SUPPORT_EMAIL</code> before release.</p>
      )}

      <h2>Before contacting support</h2>
      <ul>
        <li>Confirm you are using the same email address you used to create the account.</li>
        <li>Use “Forgot your password?” on the sign-in screen if you cannot sign in.</li>
        <li>If saving fails, keep the check-in as a device draft and try again when your connection returns.</li>
      </ul>

      <h2>Account deletion</h2>
      <p>Open Settings, scroll to Account, and choose Delete account. If you cannot access the app, email support from the address associated with the account.</p>
    </LegalPage>
  );
}
