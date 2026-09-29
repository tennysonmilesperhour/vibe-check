import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { hasAppLock, setAppLock, removeAppLock, pinMatches, validPin, failedAttempts, recordFailedAttempt, clearFailedAttempts, waitLabel } from '@/lib/app-lock';

const announce = () => window.dispatchEvent(new Event('vibe:lock-changed'));

/** Settings: turn the device PIN lock on, change it, or remove it. */
export default function AppLockSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [enabled, setEnabled] = useState(() => hasAppLock(userId));
  const [mode, setMode] = useState(null); // null | set | change | remove
  const [current, setCurrent] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const digits = (setter) => (event) => setter(event.target.value.replace(/\D/g, ''));
  const reset = () => { setMode(null); setCurrent(''); setPin(''); setConfirm(''); };

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      if (mode !== 'set') {
        // Same limit as the lock screen, so the PIN can't be guessed here instead.
        const wait = failedAttempts(userId).pausedUntil - Date.now();
        if (wait > 0) throw new Error(`Too many tries. Wait ${waitLabel(wait)}, then try again.`);
        if (!(await pinMatches(userId, current))) {
          recordFailedAttempt(userId);
          throw new Error('Your current PIN did not match.');
        }
        clearFailedAttempts(userId);
      }
      if (mode === 'remove') {
        removeAppLock(userId);
        setEnabled(false);
        setMessage('The app lock is off on this device.');
      } else {
        if (!validPin(pin)) throw new Error('Use 4 to 8 digits.');
        if (pin !== confirm) throw new Error('The two PINs do not match.');
        await setAppLock(userId, pin);
        setEnabled(true);
        setMessage(mode === 'change' ? 'Your PIN is changed.' : 'The app lock is on for this device.');
      }
      announce();
      reset();
    } catch (err) {
      setMessage(err.message);
    }
    setBusy(false);
  }

  return (
    <section className="space-y-3 hairline pt-6" aria-labelledby="app-lock-heading">
      <h3 id="app-lock-heading" className="font-semibold">App lock on this device</h3>
      <p className="living-muted text-sm">A PIN before your journal shows, and again after the app has been in the background for 5 minutes. It keeps your journal from someone who picks up this device. It can't protect a device someone else controls or monitors, and a forgotten PIN means signing out.</p>
      {!mode && (
        <div className="flex flex-wrap gap-3">
          {enabled
            ? <><button type="button" className="living-secondary" onClick={() => setMode('change')}>Change PIN</button><button type="button" className="living-secondary" onClick={() => setMode('remove')}>Turn off the lock</button></>
            : <button type="button" className="living-secondary" onClick={() => setMode('set')}>Set a PIN</button>}
        </div>
      )}
      {mode && (
        <form onSubmit={submit} className="space-y-3">
          {mode !== 'set' && <label className="living-label block">Current PIN<input className="living-input mt-2" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={current} onChange={digits(setCurrent)} /></label>}
          {mode !== 'remove' && <>
            <label className="living-label block">New PIN (4 to 8 digits)<input className="living-input mt-2" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={digits(setPin)} /></label>
            <label className="living-label block">Repeat the new PIN<input className="living-input mt-2" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={confirm} onChange={digits(setConfirm)} /></label>
          </>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="ink-button" disabled={busy}>{busy ? 'Saving…' : mode === 'remove' ? 'Turn off the lock' : 'Save PIN'}</button>
            <button type="button" className="underline text-sm" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}
      {message && <p className="living-muted text-sm" role="status">{message}</p>}
    </section>
  );
}
