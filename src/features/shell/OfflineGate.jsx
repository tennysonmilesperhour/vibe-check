import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import SanctuaryMark from "./SanctuaryMark";

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
        <h1 className="text-4xl mt-2">We can't reach your account right now.</h1>
        <p className="living-muted mt-4">
          Anything you were writing stays in this tab. We'll reconnect as soon as you're back online.
        </p>
        <button type="button" className="ink-button mt-6" disabled={busy} onClick={retry}>
          {busy ? "Trying…" : "Try again"}
        </button>
      </div>
    </main>
  );
}
