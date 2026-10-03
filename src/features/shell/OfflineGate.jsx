import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import SanctuaryMark from "./SanctuaryMark";
import RetryButton from "./RetryButton";

/** Shown when the account can't be reached at startup; never a sign-out. */
export default function OfflineGate() {
  const { checkUserAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    await checkUserAuth();
    setBusy(false);
  };
  return (
    <main className="field-wash min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center" role="status" aria-live="polite">
        <SanctuaryMark size={56} className="mx-auto" />
        <p className="sanctuary-eyebrow mt-6">{typeof navigator !== "undefined" && navigator.onLine === false ? "YOU ARE OFFLINE" : "STILL CONNECTING"}</p>
        <h1 className="text-4xl mt-2">Your account can't be reached right now.</h1>
        <p className="living-muted mt-4">
          Anything you were writing stays in this tab. Vibe Check reconnects as soon as you're back online.
        </p>
        <p className="living-muted mt-3">
          <a className="underline" href="/support-now">Support now</a> and <a className="underline" href="/help-now">help now</a> open without a connection.
        </p>
        <RetryButton className="ink-button mt-6" busy={busy} onRetry={retry} />
      </div>
    </main>
  );
}
