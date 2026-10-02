import SanctuaryMark from './SanctuaryMark';

/**
 * What shows while something opens: the leaf mark breathing slowly beside a
 * line saying what is on its way. It fades in after a moment, so a quick load
 * never flashes, and it stays still when motion is reduced.
 */
export default function LoadingState({ label, variant = 'inline', className = '' }) {
  return (
    <div className={`loading-state loading-state-${variant} ${className}`} role="status" aria-live="polite">
      <SanctuaryMark size={variant === 'screen' ? 56 : 28} className="loading-mark" />
      <span>{label}</span>
    </div>
  );
}
