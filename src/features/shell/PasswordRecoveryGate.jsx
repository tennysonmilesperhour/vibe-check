import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkyField from "./SkyField";

export default function PasswordRecoveryGate() {
  const { finishPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await base44.auth.updatePassword(password);
      finishPasswordRecovery();
    } catch (err) {
      setError(err?.message || "Your password could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SkyField className="min-h-screen">
      <main className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-4xl" style={{ color: "var(--gh-cream)" }}>Choose a new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="recovery-password" style={{ color: "var(--gh-cream)" }}>New password</Label>
            <Input id="recovery-password" type="password" minLength={8} maxLength={128} required autoComplete="new-password"
              value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 bg-white/95" />
            <p className="mt-1 text-xs" style={{ color: "rgba(255,253,246,0.88)" }}>Use at least 8 characters.</p>
          </div>
          {error && <p role="alert" className="text-sm status-message">{error}</p>}
          <button type="submit" className="cream-button w-full" disabled={busy}>
            {busy ? "Updating password…" : "Update password"}
          </button>
        </form>
      </main>
    </SkyField>
  );
}
