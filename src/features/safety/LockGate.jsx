import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/AuthContext';
import { removeAppLock, pinMatches, failedAttempts, recordFailedAttempt, clearFailedAttempts, waitLabel } from '@/lib/app-lock';
import SanctuaryMark from '@/features/shell/SanctuaryMark';
import QuickExit from './QuickExit';
import SupportResources from './SupportResources';
import useLockState from './useLockState';

const opensDialog = (node) => node instanceof Element && !node.matches('[data-app-lock]')
  && (node.matches('[role="dialog"], [role="alertdialog"]') || Boolean(node.querySelector('[role="dialog"], [role="alertdialog"]')));

/** The PIN screen. A modal of its own, above any dialog that was open underneath. */
export function LockScreen({ userId, onUnlock, onForgot, onClosed = () => {}, onCancel = null }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [confirmForgot, setConfirmForgot] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(() => failedAttempts(userId).pausedUntil);
  const paused = pausedUntil > Date.now();
  const inputRef = useRef(null);
  const titleRef = useRef(null);
  // Closed (say, "Not now") while a PIN was being checked: don't unlock afterwards.
  const gone = useRef(false);
  useEffect(() => { gone.current = false; return () => { gone.current = true; }; }, []);

  useEffect(() => {
    const remaining = pausedUntil - Date.now();
    if (remaining <= 0) return undefined;
    setError(`Too many tries. Wait ${waitLabel(remaining)}, then try again.`);
    const timer = setTimeout(() => { setPausedUntil(0); setError(''); }, remaining);
    return () => clearTimeout(timer);
  }, [pausedUntil]);

  const focusStart = () => (inputRef.current && !inputRef.current.disabled ? inputRef.current : titleRef.current)?.focus();

  // When a pause ends, go back to the PIN field (unless the person moved on).
  useEffect(() => {
    if (!paused && [titleRef.current, document.body].includes(document.activeElement)) inputRef.current?.focus();
  }, [paused]);

  // Opened while the page was hidden (a hidden page can't take focus): focus on return.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || document.activeElement?.closest('[data-app-lock]')) return;
      (inputRef.current && !inputRef.current.disabled ? inputRef.current : titleRef.current)?.focus();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // The pages underneath don't follow the address while locked (see LockGate),
  // so nothing should open under this screen. If a dialog still does, it would
  // take the top layer, and with it every tap and key: open again above it.
  const [layer, setLayer] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes].some(opensDialog))) setLayer((count) => count + 1);
    });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (paused || busy) return;
    // Another tab may have started a pause since this screen opened.
    const storedPause = failedAttempts(userId).pausedUntil;
    if (storedPause > Date.now()) { setPausedUntil(storedPause); return; }
    setBusy(true);
    setError(''); // so a repeated message is announced again
    const ok = await pinMatches(userId, pin).catch(() => false);
    if (gone.current) return;
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
    <DialogPrimitive.Root key={layer} open modal>
      <DialogPrimitive.Portal>
        {/* The overlay carries the scroll lock, so this screen scrolls even over another dialog. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] field-wash" />
        <DialogPrimitive.Content
          data-app-lock=""
          className="fixed inset-0 z-[100] overflow-y-auto flex px-6 py-10"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusStart(); // during a pause the PIN field is disabled; don't land on sign-out instead
          }}
          onEscapeKeyDown={onCancel ? () => { if (!busy) onCancel(); } : undefined}
          onCloseAutoFocus={(event) => { event.preventDefault(); onClosed(); }}
        >
          <form onSubmit={submit} className="m-auto w-full max-w-sm text-center space-y-4">
            <SanctuaryMark size={56} className="mx-auto" />
            <DialogPrimitive.Title asChild><h1 ref={titleRef} tabIndex={-1} className="text-4xl outline-none">Vibe Check is locked</h1></DialogPrimitive.Title>
            <label className="living-label block">
              Enter your PIN
              <input ref={inputRef} className="living-input mt-2 text-center tracking-[0.4em]" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} disabled={paused} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} />
            </label>
            {error && <p className="living-error" role="alert">{error}</p>}
            <button type="submit" className="ink-button w-full justify-center" disabled={busy || paused || pin.length < 4}>{busy ? 'Checking…' : 'Unlock'}</button>
            <div className="flex flex-col items-center gap-3 pt-2">
              {confirmForgot ? (
                <div className="living-inset space-y-3 text-sm">
                  <p>This signs you out on this device and removes the lock. Unsaved words in an open form are lost. Your saved journal stays in your account, and anything kept on this device while offline is saved to it when you sign back in.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" className="living-secondary" disabled={busy} onClick={forgot}>Sign out and remove the lock</button>
                    <button type="button" className="underline" disabled={busy} onClick={() => setConfirmForgot(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="underline text-sm" disabled={busy} onClick={() => setConfirmForgot(true)}>Forgot your PIN?</button>
              )}
              {/* Shown here rather than on another page, so nothing under the lock is lost. */}
              <button type="button" className="underline text-sm" aria-expanded={showSupport} onClick={() => setShowSupport((open) => !open)}>Need support now?</button>
              <QuickExit className="underline text-sm inline-flex items-center gap-2" />
              {onCancel && <button type="button" className="underline text-sm" disabled={busy} onClick={onCancel}>Not now</button>}
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
  const { locked, lockedRef, unlock, lastFocus } = useLockState(userId);
  // Opening locked, the pages wait for the PIN: mounted underneath, one could
  // open a dialog of its own (a draft restored from the address) above the lock.
  // Once shown they stay mounted through later relocks, keeping unsaved words.
  const [contentReady, setContentReady] = useState(() => !locked);
  useEffect(() => { if (!locked) setContentReady(true); }, [locked]);
  // While locked, the pages keep the address they had, so the Back button
  // can't open a dialog underneath. They catch up after unlocking. A location
  // is always passed (the live one when unlocked): switching between none and
  // one would change the tree's shape and remount every page, losing words.
  const location = useLocation();
  const [shownLocation, setShownLocation] = useState(location);
  useEffect(() => { if (!locked) setShownLocation(location); }, [locked, location]);
  const content = typeof children === 'function' ? children(locked ? shownLocation : location) : children;

  return (
    <>
      {contentReady && <div inert={locked ? '' : undefined} aria-hidden={locked || undefined}>{content}</div>}
      {locked && (
        <LockScreen
          userId={userId}
          onUnlock={() => { unlock(); setContentReady(true); }}
          // Stay covered until the sign-out lands; then the lock can go.
          onForgot={async () => { await logout('local', { keepSaves: true }); removeAppLock(userId); }}
          onClosed={() => {
            // Only after a real unlock (the lock can reopen itself), and only into
            // the top dialog if one is open, which otherwise keeps its own focus.
            const target = lastFocus.current;
            if (lockedRef.current || !target?.isConnected) return;
            const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter((node) => !node.closest('[data-app-lock]'));
            if (!dialogs.length || dialogs.at(-1).contains(target)) target.focus();
          }}
        />
      )}
    </>
  );
}
