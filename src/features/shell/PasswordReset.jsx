import React, { useState } from "react";
import { supabase } from "@/api/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkyField from "./SkyField";

/**
 * Shown when the app loads with a recovery session (the person clicked the
 * reset link in their email). One job: set the new password.
 */
export default function PasswordReset({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match yet.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      onDone?.();
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      setError(msg.includes("should be different")
        ? "That's your current password. Pick a new one."
        : err?.message || "That did not work. Try again.");
      setBusy(false);
    }
  };

  return (
    <SkyField className="min-h-screen">
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-4xl" style={{ color: "var(--gh-cream)", lineHeight: 0.98 }}>
          Choose a new password
        </h1>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
          You followed the reset link — set the new password and you're back in.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-4">
          <div>
            <Label htmlFor="new-password" style={{ color: "var(--gh-cream)" }}>New password</Label>
            <Input id="new-password" type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" className="mt-1 bg-white/95" />
          </div>
          <div>
            <Label htmlFor="confirm-password" style={{ color: "var(--gh-cream)" }}>Same password, once more</Label>
            <Input id="confirm-password" type="password" required minLength={8} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" className="mt-1 bg-white/95" />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--gh-cream)", background: "rgba(90,36,48,0.5)", padding: "8px 10px" }}>{error}</p>}

          <button type="submit" className="cream-button w-full" disabled={busy}>
            {busy ? "One moment…" : "Set the new password"}
          </button>
        </form>
      </div>
    </SkyField>
  );
}
