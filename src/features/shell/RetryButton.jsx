/**
 * Tries something that failed again. While it works it says so and ignores
 * more presses; aria-disabled rather than disabled keeps focus on the button,
 * so a second failure can be read out from where the person already is.
 */
export default function RetryButton({ busy, onRetry, className = 'underline', children = 'Try again' }) {
  return (
    <button type="button" className={className} aria-disabled={busy} onClick={() => { if (!busy) onRetry(); }}>
      {busy ? 'Trying…' : children}
    </button>
  );
}
