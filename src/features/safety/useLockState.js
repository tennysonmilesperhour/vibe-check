import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { hasAppLock, isUnlocked, markUnlocked, noteHidden, noteVisible, affectsLock } from '@/lib/app-lock';

const lockedNow = (userId) => Boolean(userId) && hasAppLock(userId) && !isUnlocked(userId);

/**
 * Whether this device's app lock is closed for the person, kept current as the
 * tab goes to the background and comes back, reloads, or the lock changes in
 * Settings or another tab. While the tab is in the background, `coverRef`'s
 * element is hidden so the app switcher's snapshot doesn't show the journal.
 */
export default function useLockState(userId, coverRef = null) {
  const [locked, setLocked] = useState(() => lockedNow(userId));
  // Where focus was when the lock closed, to return to after unlocking.
  const lastFocus = useRef(null);

  const lock = useCallback(() => {
    const active = document.activeElement;
    // Keep the spot in the page, not a field on the lock screen itself.
    if (active instanceof HTMLElement && !active.closest('[data-app-lock]')) lastFocus.current = active;
    // Render the lock before the browser paints the page again.
    flushSync(() => setLocked(true));
  }, []);

  useEffect(() => {
    setLocked(lockedNow(userId));
    if (!userId) return undefined;
    // A background time left from before a reload no longer applies once the page is in view.
    if (document.visibilityState === 'visible' && hasAppLock(userId) && isUnlocked(userId)) noteVisible(userId);
    const cover = (hidden) => { if (coverRef?.current) coverRef.current.style.visibility = hidden ? 'hidden' : ''; };
    const onVisibility = () => {
      if (!hasAppLock(userId)) return;
      if (document.visibilityState === 'hidden') {
        noteHidden(userId);
        cover(true);
      } else {
        if (!noteVisible(userId)) lock();
        cover(false);
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
      cover(false);
    };
  }, [userId, coverRef, lock]);

  const unlock = useCallback(() => {
    markUnlocked(userId);
    setLocked(false);
  }, [userId]);

  return { locked, unlock, lastFocus };
}
