import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReadingPause from './ReadingPause';

const SLOW_CHECK_MS = 5000;

/**
 * A symbolic reading, or the pause in its place after a hard moment. The
 * choice to read anyway is kept by the page, so it holds across its tabs.
 * Skipping a slow check opens only this reading: the other tabs still pause
 * if the check then finds a hard moment, and this one stays open.
 */
export default function GuardedReading({ guard, readAnyway, onReadAnyway, compact = false, children }) {
  const [skippedCheck, setSkippedCheck] = useState(false);
  if (readAnyway || skippedCheck) return children;
  if (guard.checking) return <CheckingRecord waitingSince={guard.waitingSince} onSkip={() => setSkippedCheck(true)} compact={compact} />;
  if (guard.moment) return <ReadingPause moment={guard.moment} onShowAnyway={onReadAnyway} compact={compact} />;
  return children;
}

// A slow check never leaves the person with nothing to do. The wait counts
// from when the page began checking, so switching tabs doesn't restart it.
function CheckingRecord({ waitingSince, onSkip, compact }) {
  const waited = Date.now() - (waitingSince ?? Date.now());
  const [slow, setSlow] = useState(waited >= SLOW_CHECK_MS);
  useEffect(() => {
    if (slow) return undefined;
    const timer = setTimeout(() => setSlow(true), SLOW_CHECK_MS - waited);
    return () => clearTimeout(timer);
  }, []); // the remaining wait is set once, when this appears
  return (
    <div className={`living-muted text-sm text-center space-y-3 ${compact ? 'py-3' : 'py-10'}`} role="status">
      <p>One moment…</p>
      {slow && (
        <p>
          Checking your recent entries is taking a while.{' '}
          <button type="button" className="underline underline-offset-4" onClick={onSkip}>Show the reading now</button>
          {' or '}
          <Link className="underline underline-offset-4" to="/support-now">find support</Link>.
        </p>
      )}
    </div>
  );
}
