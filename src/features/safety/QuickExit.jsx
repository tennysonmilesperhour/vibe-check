import { DoorOpen } from 'lucide-react';
import { allowLeaving } from '@/hooks/use-before-unload';
import { noteQuickExit } from '@/lib/app-lock';

// A neutral page to land on. replace() swaps out this history entry, so Back
// doesn't return to the page that was open.
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

export function quickExit() {
  // Nothing stays on screen while the next page loads.
  document.documentElement.style.visibility = 'hidden';
  // Every tab, this one included, locks again and forgets a recent password
  // check, so coming back (or Back) asks again.
  noteQuickExit();
  window.dispatchEvent(new Event('vibe:lock-changed'));
  allowLeaving();
  window.location.replace(QUICK_EXIT_URL);
}

// Brought back from the browser's page cache: show the page again (locked, if a lock is set).
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => { if (event.persisted) document.documentElement.style.visibility = ''; });
}

/** Leave the app at once for a neutral page. */
export default function QuickExit({ className = 'living-secondary', label = 'Quick exit' }) {
  return (
    <button type="button" className={className} onClick={quickExit} aria-label="Quick exit: leave for a neutral page">
      <DoorOpen size={16} aria-hidden="true" />{label}
    </button>
  );
}
