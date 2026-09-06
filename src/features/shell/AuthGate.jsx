import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkyField from "./SkyField";
import { isNativeApp } from "@/lib/native";
import PublicProductIntro from "./PublicProductIntro";
import { AUTH_REDIRECT_URL } from "@/lib/publicConfig";

function authMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "Email and password did not match. Check both fields or reset your password.";
  if (message.includes("already registered") || message.includes("already exists")) return "An account already uses this email. Sign in or reset your password.";
  if (message.includes("rate") || message.includes("too many")) return "Too many attempts were made. Wait a few minutes and try again.";
  if (message.includes("password")) return "Use a password with at least 8 characters.";
  if (message.includes("network") || message.includes("fetch")) return "Vibe Check could not reach the sign-in service. Check your connection and try again.";
  return "Sign-in could not be completed. Check your details and try again.";
}

/**
 * The front door: email + password sign in / sign up, or a magic link.
 * Rendered inline whenever there is no session.
 */
export default function AuthGate() {
  const [accountOpen, setAccountOpen] = useState(isNativeApp);
  const [mode, setMode] = useState("signin"); // signin | signup | magic | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Sign-in is not available in this build yet.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "reset") {
        await base44.auth.resetPassword(email);
        setNotice("Check your email for a secure password reset link.");
      } else if (mode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: AUTH_REDIRECT_URL },
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
      setError(authMessage(err));
    }
    setBusy(false);
  };

  const startAccount = () => {
    setAccountOpen(true);
    setMode("signup");
    window.setTimeout(() => {
      document.getElementById("auth-name")?.focus({ preventScroll: true });
    }, 0);
  };

  const startSignIn = () => {
    setAccountOpen(true);
    setMode("signin");
    window.setTimeout(() => {
      document.getElementById("auth-email")?.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gh-field)" }}>
      {!accountOpen ? (
        <PublicProductIntro onStart={startAccount} onSignIn={startSignIn} />
      ) : (
      <SkyField className="min-h-screen">
      <div className="max-w-5xl min-h-screen mx-auto px-6 py-16 md:py-24 flex items-center" id="account-access">
        <div className="w-full grid md:grid-cols-[minmax(0,1fr)_24rem] gap-10 md:gap-16 items-start">
          <header>
            <h1 className="text-5xl md:text-7xl" style={{ color: "var(--gh-cream)", lineHeight: 0.98 }}>
              vibe check
            </h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
              A private place to notice your inner weather.
            </p>
            <p className="hidden md:block mt-8 max-w-md text-lg leading-relaxed" style={{ color: "rgba(255,253,246,0.88)" }}>
              Record mood, energy, sleep, and the moments that mattered. Your Patterns view becomes more useful with every entry.
            </p>
          </header>

          <div>

        {!isNativeApp && (
          <button type="button" className="ghost-text-action mb-4 text-sm" style={{ color: "var(--gh-cream)" }} onClick={() => setAccountOpen(false)}>
            Back to overview
          </button>
        )}

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 text-sm" role="alert"
            style={{ background: "rgba(90,36,48,0.55)", color: "var(--gh-cream)", border: "1px solid rgba(255,253,246,0.4)" }}>
            This build is missing its database configuration. If you are the
            owner: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel's
            Environment Variables, then redeploy. Sign-in cannot work until then.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="auth-name" style={{ color: "var(--gh-cream)" }}>Name (optional)</Label>
              <Input id="auth-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)}
                autoComplete="name" className="mt-1 bg-white/95" />
            </div>
          )}
          <div>
            <Label htmlFor="auth-email" style={{ color: "var(--gh-cream)" }}>Email</Label>
            <Input id="auth-email" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" className="mt-1 bg-white/95" />
          </div>
          {mode !== "magic" && mode !== "reset" && (
            <div>
              <Label htmlFor="auth-password" style={{ color: "var(--gh-cream)" }}>Password</Label>
              <Input id="auth-password" type="password" required minLength={8} maxLength={128} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 bg-white/95" />
              {mode === "signup" && <p className="mt-1 text-xs" style={{ color: "rgba(255,253,246,0.88)" }}>Use at least 8 characters.</p>}
            </div>
          )}

          {error && <p role="alert" className="text-sm status-message">{error}</p>}
          {notice && <p role="status" className="text-sm status-message">{notice}</p>}

          <button type="submit" className="cream-button w-full" disabled={busy || !isSupabaseConfigured}>
            {busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send magic link" : mode === "reset" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
          {mode !== "signin" && (
            <button type="button" className="ghost-text-action text-left" onClick={() => setMode("signin")}>
              Sign in with a password
            </button>
          )}
          {mode !== "signup" && (
            <button type="button" className="ghost-text-action text-left" onClick={() => setMode("signup")}>
              New here? Create an account
            </button>
          )}
          {!isNativeApp && mode !== "magic" && (
            <button type="button" className="ghost-text-action text-left" onClick={() => setMode("magic")}>
              Email me a magic link instead
            </button>
          )}
          {mode === "signin" && (
            <button type="button" className="ghost-text-action text-left" onClick={() => setMode("reset")}>
              Forgot your password?
            </button>
          )}
        </div>
        <nav aria-label="Legal and support" className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm" style={{ color: "var(--gh-cream)" }}>
          <a href="/privacy" className="touch-link underline underline-offset-4">Privacy</a>
          <a href="/terms" className="touch-link underline underline-offset-4">Terms</a>
          <a href="/support" className="touch-link underline underline-offset-4">Support</a>
        </nav>
          </div>
        </div>
      </div>
      </SkyField>
      )}
    </div>
  );
}
