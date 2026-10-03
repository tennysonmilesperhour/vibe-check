import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkyField from "./SkyField";
import SanctuaryMark from "./SanctuaryMark";
import { ArrowUpRight, Leaf, Orbit, Sprout, ArrowRight } from "lucide-react";

/** Turn Supabase's terse auth errors into something a beta tester can act on. */
function friendlyAuthError(err) {
  const raw = err?.message || "";
  const msg = raw.toLowerCase();
  if (msg.includes("email not confirmed")) {
    return "This email hasn't been confirmed yet. Check your inbox for the confirmation link, or use \"Email me a magic link instead\" below.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Email or password is incorrect. If you just signed up, confirm your email first (or use a magic link).";
  }
  if (msg.includes("rate limit") || msg.includes("after")) {
    return "Too many attempts in a row. Wait a minute and try again.";
  }
  return raw || "That did not work. Try again.";
}

/**
 * Why a confirmation or magic link didn't sign the person in, from the
 * reason Supabase puts in the address; null when there isn't one.
 */
export function authLinkError(location = window.location) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const code = params.get('error_code') || query.get('error_code');
  if (!code && !params.get('error_description') && !query.get('error_description')) return null;
  if (code === 'otp_expired') return "That link has expired or was already used. Sign in, or ask for a new link below.";
  return "That link didn't sign you in. Sign in, or ask for a new link below.";
}

const LINK_ERROR_PARAMS = ['error', 'error_code', 'error_description'];

/** Takes a failed link's reason out of the address once it has been read. */
export function clearAuthLinkError(location = window.location, history = window.history) {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  for (const key of LINK_ERROR_PARAMS) { hash.delete(key); query.delete(key); }
  const search = query.toString();
  const fragment = hash.toString();
  history.replaceState(history.state, '', `${location.pathname}${search ? `?${search}` : ''}${fragment ? `#${fragment}` : ''}`);
}

/**
 * The front door: email + password sign in / sign up, or a magic link.
 * Rendered inline whenever there is no session.
 */
const NEUTRAL_SIGNUP_NOTICE = "Check your email. If this address is new, there's a link to confirm your account. If you already have an account, sign in or reset your password instead.";

export default function AuthGate({ initialMode = "signin", initialError = null }) {
  const [mode, setMode] = useState(initialMode); // signin | signup | magic | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  // Vibe Check is for adults; sign-up asks for confirmation.
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(initialError);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          // Come back to this origin; the app shows the new-password screen
          // when it detects the recovery session.
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setNotice("Check your email. The link brings you back here to set a new password.");
      } else if (mode === "magic") {
        // A magic link creates the account when the address is new, so it asks the same question.
        if (!adult) throw new Error("Please confirm you are 18 or older to continue.");
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          // Come back to whatever origin the person is actually using, not the
          // project's configured Site URL (which may be a dev localhost).
          options: { emailRedirectTo: window.location.origin, data: { adult_confirmed_at: new Date().toISOString() } },
        });
        if (err) throw err;
        setNotice("Check your email. The link signs you straight in.");
      } else if (mode === "signup") {
        if (!adult) throw new Error("Please confirm you are 18 or older to create an account.");
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || undefined, adult_confirmed_at: new Date().toISOString() },
            // Without this, the confirmation email's link falls back to the
            // project Site URL and can bounce testers to a dead localhost page.
            emailRedirectTo: window.location.origin,
          },
        });
        // One message whether or not the address already has an account, so
        // nobody can use this form to learn whether someone else uses Vibe Check.
        // With email confirmation on (keep it on), Supabase hides existing
        // accounts; with it off it says so, and that answer is folded in here.
        if (err?.code === "user_already_exists") {
          setNotice(NEUTRAL_SIGNUP_NOTICE);
        } else if (err) {
          throw err;
        } else if (data?.session) {
          // Confirmation is off: the signup already signed us in. The auth
          // listener will pick up the session and render the app.
          setNotice("You're in. One moment…");
        } else {
          setNotice(NEUTRAL_SIGNUP_NOTICE);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    }
    setBusy(false);
  };

  const changeMode = (next) => { setMode(next); setError(null); setNotice(null); };
  const title = mode === "signup" ? "Make space for you."
    : mode === "reset" ? "A fresh start."
    : mode === "magic" ? "Sign in by email."
    : "Welcome back.";

  return (
    <main className="welcome-page">
      <SkyField className="welcome-landscape" film>
        <div className="welcome-brand"><SanctuaryMark size={50} /><span>vibe check</span></div>
        <div className="welcome-story">
          <p className="sanctuary-eyebrow">YOUR DAILY SANCTUARY</p>
          <h1>Free forever.<br />No AI reads your journal.</h1>
          <p className="welcome-description">See how the people and habits in your life affect you, with a private journal, patterns, weekly and monthly reports, and practices for hard moments.</p>
          <a href="#welcome-form" className="welcome-invitation">Your moment starts here <ArrowUpRight size={18} aria-hidden="true" /></a>
        </div>
        <div className="welcome-caption"><span className="caption-rule" />Rooted in nature. Made for reflection.</div>
      </SkyField>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-topline"><a href="/">What is Vibe Check?</a><a href="mailto:morphiclabsdata@gmail.com">Need a hand? <ArrowUpRight size={13} aria-hidden="true" /></a></div>
        <div id="welcome-form" className="welcome-form-wrap">
          <SanctuaryMark className="welcome-form-mark" size={64} />
          <p className="sanctuary-eyebrow">PAUSE. NOTICE. BEGIN AGAIN.</p>
          <h2 id="welcome-title">{title}</h2>
          <p className="welcome-form-intro">{mode === "signup" ? "Begin a daily ritual, entirely your own."
            : mode === "reset" ? "A link to reset your password goes to your inbox."
            : mode === "magic" ? "One link in your inbox. No password needed."
            : "Your space for a softer landing, every day."}</p>
          {(mode === "signin" || mode === "signup") && (
            <div className="auth-mode-switch" aria-label="Account options">
              <button type="button" aria-pressed={mode === "signin"} onClick={() => changeMode("signin")}>Sign in</button>
              <button type="button" aria-pressed={mode === "signup"} onClick={() => changeMode("signup")}>Create account</button>
            </div>
          )}
          {!isSupabaseConfigured && <p className="auth-notice" role="status">Sign-in is temporarily unavailable. Please try again later or contact support.</p>}
          <form onSubmit={submit} className="sanctuary-auth-form">
            {mode === "signup" && <div><Label htmlFor="auth-name">Your name</Label><Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" /></div>}
            <div><Label htmlFor="auth-email">Email address</Label><Input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></div>
            {mode !== "magic" && mode !== "reset" && <div>
              <div className="auth-label-row"><Label htmlFor="auth-password">Password</Label>{mode === "signin" && <button type="button" onClick={() => changeMode("reset")}>Forgot password?</button>}</div>
              <Input id="auth-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} />
            </div>}
            {(mode === "signup" || mode === "magic") && <label className="flex items-start gap-3 text-sm text-left"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={adult} onChange={(e) => setAdult(e.target.checked)} required /><span>I am 18 or older and agree to the <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy policy</a>.</span></label>}
            {error && <p className="auth-notice auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-notice" role="status">{notice}</p>}
            <button type="submit" className="ink-button auth-submit" disabled={busy || !isSupabaseConfigured}>
              <span>{busy ? "One moment…" : mode === "signup" ? "Create your account" : mode === "magic" ? "Send magic link" : mode === "reset" ? "Send reset link" : "Enter your sanctuary"}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
          <div className="auth-alternative"><span />or<span /></div>
          <button type="button" className="auth-magic" onClick={() => changeMode(mode === "magic" || mode === "reset" ? "signin" : "magic")}>
            {mode === "magic" || mode === "reset" ? "Sign in with a password" : "Email me a magic link"}
          </button>
          <p className="auth-footnote">Free forever: your journal, full history, patterns, reports, practices, app lock and export. No AI account needed.</p>
        </div>
          <div className="welcome-pillars" aria-label="How it works"><span><Leaf size={18} aria-hidden="true" />Check in</span><span><Orbit size={18} aria-hidden="true" />See your patterns</span><span><Sprout size={18} aria-hidden="true" />Find what helps</span></div>
          <nav className="flex flex-wrap justify-center gap-5 text-xs py-3" aria-label="App information"><a className="underline underline-offset-4 py-2" href="/privacy">Privacy</a><a className="underline underline-offset-4 py-2" href="/terms">Terms</a><a className="underline underline-offset-4 py-2" href="/support">Support</a><a className="underline underline-offset-4 py-2" href="/support-now">Support now</a><a className="underline underline-offset-4 py-2" href="/help-now">Help now</a></nav>
      </section>
    </main>
  );
}
