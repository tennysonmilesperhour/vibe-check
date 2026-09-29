import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { isTransientAuthError } from '@/lib/auth-session';
import { confirmedRecently, markConfirmed } from '@/lib/recent-auth';

/**
 * Asks for the account password before a sensitive action (deleting the
 * account, downloading the journal), so someone holding an unlocked device
 * can't do it. Skipped when the password was confirmed in this tab recently.
 */
export default function ConfirmIdentity({ action, onConfirmed }) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recent = Boolean(user?.id) && confirmedRecently(user.id);

  // Confirm once, even if the parent passes a new callback each render.
  const called = useRef(false);
  useEffect(() => {
    if (recent && !called.current) {
      called.current = true;
      onConfirmed();
    }
  }, [recent, onConfirmed]);
  if (recent) return null;

  async function confirm(event) {
    event.preventDefault();
    if (!user?.email) { setError('Sign in again to continue.'); return; }
    setBusy(true); setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    setBusy(false);
    if (signInError) {
      setError(isTransientAuthError(signInError) ? 'Could not reach your account. Try again in a moment.' : 'That password did not match.');
      return;
    }
    setPassword('');
    markConfirmed(user.id);
    called.current = true;
    onConfirmed();
  }

  async function sendPasswordLink() {
    if (!user?.email) return;
    setBusy(true); setError(''); setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin });
    setBusy(false);
    if (resetError) setError(resetError.message);
    else setNotice('Check your email for a link to set a password, then return here.');
  }

  return (
    <form onSubmit={confirm} className="living-inset space-y-3">
      <p className="text-sm">To {action}, confirm it's you with your Vibe Check password.</p>
      <label className="living-label block">
        Password
        <input className="living-input mt-2" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error && <p className="living-error" role="alert">{error}</p>}
      {notice && <p className="living-muted text-sm" role="status">{notice}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="ink-button" disabled={busy || !password}>{busy ? 'Checking…' : 'Confirm'}</button>
        <button type="button" className="underline text-sm" disabled={busy} onClick={sendPasswordLink}>I sign in with email links</button>
      </div>
    </form>
  );
}
