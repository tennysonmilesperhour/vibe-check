import { useEffect } from 'react';

/** Ask the browser to confirm leaving while `active` (unsaved words on the page). */
export default function useBeforeUnload(active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
