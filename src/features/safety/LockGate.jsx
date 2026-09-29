import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/AuthContext';
import { removeAppLock, pinMatches, failedAttempts, recordFailedAttempt, clearFailedAttempts, waitLabel } from '@/lib/app-lock';
import SanctuaryMark from '@/features/shell/SanctuaryMark';
import QuickExit from './QuickExit';
import SupportResources from './SupportResources';
import useLockState from './useLockState';

const keepOpen = (event) => event.preventDefault();

function LockScreen({ userId, onUnlock, onForgot, onClosed }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(() => failedAttempts(userId).pausedUntil);
  const paused = pausedUntil > Date.now();

  useEffect(() => {
    const remaining = pausedUntil - Date.now();
    if (remaining <= 0) return undefined;
    setError(`Too many tries. Wait ${waitLabel(remaining)}, then try again.`);
    const timer = setTimeout(() => { setPausedUntil(0); setError(''); }, remaining);
    return () => clearTimeout(timer);
  }, [pausedUntil]);

  async function submit(event) {
    event.preventDefault();
    if (paused || busy) return;
    // Another tab may have started a pause since this screen opened.
    const storedPause = failedAttempts(userId).pausedUntil;
    if (storedPause > Date.now()) { setPausedUntil(storedPause); return; }
    setBusy(true);
    setError(''); // so a repeated message is announced again
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

  // A modal of its own, so it sits above any dialog that was open underneath
  // and takes the focus and pointer from it.
  return (
    <DialogPrimitive.Root open modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          data-app-lock=""
          className="fixed inset-0 z-[100] field-wash overflow-y-auto flex px-6 py-10"
          aria-describedby={undefined}
          onEscapeKeyDown={keepOpen}
          onPointerDownOutside={keepOpen}
          onInteractOutside={keepOpen}
          onCloseAutoFocus={(event) => { event.preventDefault(); onClosed(); }}
        >
          <form onSubmit={submit} className="m-auto w-full max-w-sm text-center space-y-4">
            <SanctuaryMark size={56} className="mx-auto" />
            <DialogPrimitive.Title asChild><h1 className="text-4xl">Vibe Check is locked</h1></DialogPrimitive.Title>
            <label className="living-label block">
              Enter your PIN
              <input className="living-input mt-2 text-center tracking-[0.4em]" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} disabled={paused} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} />
            </label>
            {error && <p className="living-error" role="alert">{error}</p>}
            <button type="submit" className="ink-button w-full justify-center" disabled={busy || paused || pin.length < 4}>{busy ? 'Checking…' : 'Unlock'}</button>
            <div className="flex flex-col items-center gap-3 pt-2">
              <button type="button" className="underline text-sm" disabled={busy} onClick={forgot}>Forgot your PIN? Sign out and remove the lock</button>
              {/* Shown here rather than on another page, so nothing under the lock is lost. */}
              <button type="button" className="underline text-sm" aria-expanded={showSupport} onClick={() => setShowSupport((open) => !open)}>Need support now?</button>
              <QuickExit className="underline text-sm inline-flex items-center gap-2" />
            </div>
            {showSupport && <div className="living-card text-left"><SupportResources /></div>}
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
  const contentRef = useRef(null);
  const { locked, unlock, lastFocus } = useLockState(userId, contentRef);
  // Opening locked, the pages wait for the PIN: mounted underneath, one could
  // open a dialog of its own (a draft restored from the address) above the lock.
  // Once shown they stay mounted through later relocks, keeping unsaved words.
  const [contentReady, setContentReady] = useState(() => !locked);
  useEffect(() => { if (!locked) setContentReady(true); }, [locked]);

  return (
    <>
      {contentReady && <div ref={contentRef} inert={locked ? '' : undefined} aria-hidden={locked || undefined}>{children}</div>}
      {locked && (
        <LockScreen
          userId={userId}
          onUnlock={() => { unlock(); setContentReady(true); }}
          // Stay covered until the sign-out lands; then the lock can go.
          onForgot={async () => { await logout('local'); removeAppLock(userId); }}
          onClosed={() => { if (lastFocus.current?.isConnected) lastFocus.current.focus(); }}
        />
      )}
    </>
  );
}
