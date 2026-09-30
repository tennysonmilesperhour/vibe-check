import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReadingPause from './ReadingPause';

const SLOW_CHECK_MS = 5000;

/**
 * A symbolic reading, or the pause in its place after a hard moment. The
 * choice to read anyway is kept by the page, so it holds across its tabs.
 */
export default function GuardedReading({ guard, readAnyway, onReadAnyway, compact = false, children }) {
  if (readAnyway) return children;
  if (guard.checking) return <CheckingRecord onReadAnyway={onReadAnyway} compact={compact} />;
  if (guard.moment) return <ReadingPause moment={guard.moment} onShowAnyway={onReadAnyway} compact={compact} />;
  return children;
}

// A slow check never leaves the person with nothing to do.
function CheckingRecord({ onReadAnyway, compact }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_CHECK_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`living-muted text-sm text-center space-y-3 ${compact ? 'py-3' : 'py-10'}`} role="status">
      <p>One moment…</p>
      {slow && (
        <p>
          Checking your recent entries is taking a while.{' '}
          <button type="button" className="underline underline-offset-4" onClick={onReadAnyway}>Show the reading now</button>
          {' or '}
          <Link className="underline underline-offset-4" to="/support-now">find support</Link>.
        </p>
      )}
    </div>
  );
}
