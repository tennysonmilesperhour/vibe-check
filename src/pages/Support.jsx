import React from "react";
import LegalPage from "@/features/shell/LegalPage";

const supportEmail = "morphiclabsdata@gmail.com";

export default function Support() {
  return (
    <LegalPage title="Support">
      <p>For help with signing in, exports, privacy, or account deletion, contact the Vibe Check team.</p>
      <p><a className="ink-button inline-flex items-center" href={`mailto:${supportEmail}?subject=Vibe%20Check%20support`}>Email support</a></p>
      <p>{supportEmail}</p>

      <h2>Before contacting support</h2>
      <ul>
        <li>Confirm you are using the same email address you used to create the account.</li>
        <li>Use “Forgot your password?” on the sign-in screen if you cannot sign in.</li>
        <li>If saving fails, keep the page open and retry when your connection returns. Unsaved text may be lost if you close the page.</li>
      </ul>

      <h2>Account deletion</h2>
      <p>Open Settings & privacy, scroll to Support & account deletion, and choose Delete Vibe Check account. If you cannot access the app, email support from the address associated with the account.</p>
    </LegalPage>
  );
}
