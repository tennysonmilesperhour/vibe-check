import { useEffect } from 'react';

// Quick exit must never stop at a "Leave site?" prompt.
let leavingNow = false;
export function allowLeaving() {
  leavingNow = true;
}
/** The page came back after a quick exit; prompts work again. */
export function resetLeaving() {
  leavingNow = false;
}

/** Ask the browser to confirm leaving while `active` (unsaved words on the page). */
export default function useBeforeUnload(active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      if (leavingNow) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
