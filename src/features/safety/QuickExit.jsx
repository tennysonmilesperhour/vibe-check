import { DoorOpen } from 'lucide-react';
import { allowLeaving } from '@/hooks/use-before-unload';
import { noteQuickExit } from '@/lib/app-lock';
import { coverForExit } from './page-cover';

// A neutral page to land on. replace() swaps out this history entry, so Back
// doesn't return to the page that was open.
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

export function quickExit() {
  try {
    // Every tab, this one included, locks again and forgets a recent password
    // check, so coming back (or Back) asks again. Done while the page still
    // shows, so a lock screen can take focus.
    noteQuickExit();
    window.dispatchEvent(new Event('vibe:lock-changed'));
  } catch {
    // Storage full or blocked: leave anyway.
  }
  coverForExit(); // nothing stays on screen while the next page loads
  allowLeaving();
  window.location.replace(QUICK_EXIT_URL);
}

/** Leave the app at once for a neutral page. */
export default function QuickExit({ className = 'living-secondary', label = 'Quick exit' }) {
  return (
    <button type="button" className={className} onClick={quickExit} aria-label="Quick exit: leave for a neutral page">
      <DoorOpen size={16} aria-hidden="true" />{label}
    </button>
  );
}
