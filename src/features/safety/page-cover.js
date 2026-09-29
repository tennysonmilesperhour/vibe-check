import { resetLeaving } from '@/hooks/use-before-unload';

// One place covers the whole page (dialogs included) and uncovers it. With an
// app lock the page is covered in the background, so the app switcher's
// snapshot doesn't show the journal; quick exit covers it at once.
// An opaque layer rather than hiding the page: hidden elements can't take
// focus, and the lock screen focuses its PIN field as the page comes back.
const COVER_ID = 'vibe-page-cover';
let exiting = false;

export function coverPage() {
  if (document.getElementById(COVER_ID)) return;
  const cover = document.createElement('div');
  cover.id = COVER_ID;
  cover.className = 'field-wash';
  cover.setAttribute('aria-hidden', 'true');
  cover.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';
  document.body.appendChild(cover);
}

function uncoverPage() {
  if (!exiting) document.getElementById(COVER_ID)?.remove();
}

/** Quick exit: covered until the next page loads, or until the person comes back. */
export function coverForExit() {
  exiting = true;
  coverPage();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') uncoverPage(); });
  // Back from the neutral page (from the page cache, or a Back press that
  // stopped the exit): show the page again, locked if a lock is set.
  const cameBack = () => { exiting = false; resetLeaving(); uncoverPage(); };
  window.addEventListener('pageshow', (event) => { if (event.persisted) cameBack(); });
  window.addEventListener('popstate', () => { if (exiting) cameBack(); });
}
