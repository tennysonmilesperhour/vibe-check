import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkyField from "./SkyField";

/**
 * The front door: email + password sign in / sign up, or a magic link.
 * Rendered inline whenever there is no session.
 */
export default function AuthGate() {
  const [mode, setMode] = useState("signin"); // signin | signup | magic
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setNotice("Check your email. The link signs you straight in.");
      } else if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() || undefined } },
        });
        if (err) throw err;
        setNotice("Account created. If confirmation is on, check your email first.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err?.message || "That did not work. Try again.");
    }
    setBusy(false);
  };

  return (
    <SkyField className="min-h-screen">
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-5xl" style={{ color: "var(--gh-cream)", lineHeight: 0.98 }}>
          vibe check
        </h1>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
          One honest check-in each evening.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 text-sm" role="alert"
            style={{ background: "rgba(90,36,48,0.55)", color: "var(--gh-cream)", border: "1px solid rgba(255,253,246,0.4)" }}>
            This build is missing its database configuration. If you are the
            owner: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel's
            Environment Variables, then redeploy. Sign-in cannot work until then.
          </div>
        )}

        <form onSubmit={submit} className="mt-10 space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="auth-name" style={{ color: "var(--gh-cream)" }}>Name</Label>
              <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="name" className="mt-1 bg-white/95" />
            </div>
          )}
          <div>
            <Label htmlFor="auth-email" style={{ color: "var(--gh-cream)" }}>Email</Label>
            <Input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" className="mt-1 bg-white/95" />
          </div>
          {mode !== "magic" && (
            <div>
              <Label htmlFor="auth-password" style={{ color: "var(--gh-cream)" }}>Password</Label>
              <Input id="auth-password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 bg-white/95" />
            </div>
          )}

          {error && <p className="text-sm" style={{ color: "var(--gh-cream)", background: "rgba(90,36,48,0.5)", padding: "8px 10px" }}>{error}</p>}
          {notice && <p className="text-sm" style={{ color: "var(--gh-cream)", background: "rgba(255,253,246,0.18)", padding: "8px 10px" }}>{notice}</p>}

          <button type="submit" className="cream-button w-full" disabled={busy}>
            {busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send magic link" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
          {mode !== "signin" && (
            <button type="button" className="underline underline-offset-4 text-left" onClick={() => setMode("signin")}>
              Sign in with a password
            </button>
          )}
          {mode !== "signup" && (
            <button type="button" className="underline underline-offset-4 text-left" onClick={() => setMode("signup")}>
              New here? Create an account
            </button>
          )}
          {mode !== "magic" && (
            <button type="button" className="underline underline-offset-4 text-left" onClick={() => setMode("magic")}>
              Email me a magic link instead
            </button>
          )}
        </div>
      </div>
    </SkyField>
  );
}
