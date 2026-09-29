import ReadingPause from './ReadingPause';

/**
 * A symbolic reading, or the pause in its place after a hard moment. The
 * choice to read anyway is kept by the page, so it holds across its tabs.
 */
export default function GuardedReading({ guard, readAnyway, onReadAnyway, children }) {
  if (guard.checking) return <p className="living-muted text-sm text-center py-10" role="status">One moment…</p>;
  if (guard.moment && !readAnyway) return <ReadingPause moment={guard.moment} onShowAnyway={onReadAnyway} />;
  return children;
}
