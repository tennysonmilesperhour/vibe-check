import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { hasAppLock, isUnlocked, markUnlocked, noteHidden, noteVisible, affectsLock } from '@/lib/app-lock';

const lockedNow = (userId) => Boolean(userId) && hasAppLock(userId) && !isUnlocked(userId);

// With a lock set, nothing shows while the tab is in the background, dialogs
// included, so the app switcher's snapshot doesn't show the journal.
const coverPage = (hidden) => { document.documentElement.style.visibility = hidden ? 'hidden' : ''; };

/**
 * Whether this device's app lock is closed for the person, kept current as the
 * tab goes to the background and comes back, reloads, or the lock changes in
 * Settings or another tab.
 */
export default function useLockState(userId) {
  const [locked, setLockedState] = useState(() => lockedNow(userId));
  const lockedRef = useRef(locked);
  const setLocked = useCallback((value) => { lockedRef.current = value; setLockedState(value); }, []);
  // Where focus was when the lock closed, to return to after unlocking.
  const lastFocus = useRef(null);

  const lock = useCallback(() => {
    if (lockedRef.current) return;
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Render the lock before the browser paints the page again.
    flushSync(() => setLocked(true));
  }, [setLocked]);

  useEffect(() => {
    setLocked(lockedNow(userId));
    if (!userId) return undefined;
    // A background time left from before a reload no longer applies once the page is in view.
    if (document.visibilityState === 'visible' && hasAppLock(userId) && isUnlocked(userId)) noteVisible(userId);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (!hasAppLock(userId)) return;
        noteHidden(userId);
        coverPage(true);
      } else {
        // Uncover first: a hidden page can't take focus, and the lock focuses its
        // PIN field. Both happen before the next paint, so nothing shows between.
        coverPage(false);
        if (hasAppLock(userId) && !noteVisible(userId)) lock();
      }
    };
    const onPageHide = () => { if (hasAppLock(userId)) noteHidden(userId); };
    const recheck = () => { if (lockedNow(userId)) lock(); else setLocked(false); };
    const onStorage = (event) => { if (affectsLock(event.key)) recheck(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('vibe:lock-changed', recheck);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('vibe:lock-changed', recheck);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId, lock, setLocked]);

  const unlock = useCallback(() => {
    markUnlocked(userId);
    setLocked(false);
  }, [userId, setLocked]);

  return { locked, lockedRef, unlock, lastFocus };
}
