import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { hasAppLock, isUnlocked, markUnlocked, relock, removeAppLock, pinMatches, failedAttempts, recordFailedAttempt, clearFailedAttempts, waitLabel, RELOCK_AFTER_MS } from '@/lib/app-lock';
import SanctuaryMark from '@/features/shell/SanctuaryMark';
import QuickExit from './QuickExit';

function LockScreen({ userId, onUnlock, onForgot }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(() => failedAttempts(userId).pausedUntil);
  const paused = pausedUntil > Date.now();
  const timer = useRef(null);

  useEffect(() => {
    const remaining = pausedUntil - Date.now();
    if (remaining <= 0) return undefined;
    setError(`Too many tries. Wait ${waitLabel(remaining)}, then try again.`);
    timer.current = setTimeout(() => { setPausedUntil(0); setError(''); }, remaining);
    return () => clearTimeout(timer.current);
  }, [pausedUntil]);

  async function submit(event) {
    event.preventDefault();
    if (paused || busy) return;
    setBusy(true);
    const ok = await pinMatches(userId, pin).catch(() => false);
    setBusy(false);
    if (ok) {
      clearFailedAttempts(userId);
      onUnlock();
      return;
    }
    setPin('');
    const next = recordFailedAttempt(userId);
    if (next.pausedUntil > Date.now()) setPausedUntil(next.pausedUntil);
    else setError('That PIN did not match.');
  }
  async function forgot() {
    setBusy(true); setError('');
    try {
      await onForgot();
    } catch {
      setBusy(false);
      setError('Could not sign out. Check your connection and try again.');
    }
  }
  return (
    <div className="fixed inset-0 z-[100] field-wash flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-labelledby="lock-title">
      <form onSubmit={submit} className="w-full max-w-sm text-center space-y-4">
        <SanctuaryMark size={56} className="mx-auto" />
        <h1 id="lock-title" className="text-4xl">Vibe Check is locked</h1>
        <label className="living-label block">
          Enter your PIN
          <input className="living-input mt-2 text-center tracking-[0.4em]" type="password" inputMode="numeric" autoComplete="off" maxLength={8} autoFocus value={pin} disabled={paused} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} />
        </label>
        {error && <p className="living-error" role="alert">{error}</p>}
        <button type="submit" className="ink-button w-full justify-center" disabled={busy || paused || pin.length < 4}>{busy ? 'Checking…' : 'Unlock'}</button>
        <div className="flex flex-col items-center gap-3 pt-2">
          <button type="button" className="underline text-sm" disabled={busy} onClick={forgot}>Forgot your PIN? Sign out and remove the lock</button>
          <a className="underline text-sm" href="/support-now">Need support now?</a>
          <QuickExit className="underline text-sm inline-flex items-center gap-2" />
        </div>
      </form>
    </div>
  );
}

/**
 * Covers the app with a PIN screen when this device has an app lock, and
 * again after the app has been in the background for five minutes. The pages
 * stay mounted underneath (inert), so nothing being written is lost.
 */
export default function LockGate({ children }) {
  const { user, logout } = useAuth();
  const userId = user?.id;
  const [locked, setLocked] = useState(() => Boolean(userId) && hasAppLock(userId) && !isUnlocked(userId));

  useEffect(() => {
    setLocked(Boolean(userId) && hasAppLock(userId) && !isUnlocked(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let hiddenAt = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS && hasAppLock(userId)) {
        relock(userId);
        setLocked(true);
      }
    };
    // Settings changes the lock in this tab; pick that up without a reload.
    const onLockChange = () => setLocked(hasAppLock(userId) && !isUnlocked(userId));
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('vibe:lock-changed', onLockChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('vibe:lock-changed', onLockChange);
    };
  }, [userId]);

  return (
    <>
      <div inert={locked ? '' : undefined} aria-hidden={locked || undefined}>{children}</div>
      {locked && (
        <LockScreen
          userId={userId}
          onUnlock={() => { markUnlocked(userId); setLocked(false); }}
          // Stay covered until the sign-out lands; then the lock can go.
          onForgot={async () => { await logout('local'); removeAppLock(userId); }}
        />
      )}
    </>
  );
}
