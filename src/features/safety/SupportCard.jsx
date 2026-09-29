import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { SUPPORT_REGIONS, supportLinesFor, telHref } from '@/lib/support-resources';
import useSupportRegion from './useSupportRegion';

/**
 * A quiet offer of support, shown where someone has recorded something hard.
 * Never an alarm and never a diagnosis; the person decides whether to open it.
 */
export default function SupportCard({ focus = 'crisis', title = 'Support is here if you want it.', children, onDismiss }) {
  const [region] = useSupportRegion();
  const known = SUPPORT_REGIONS[region];
  const first = supportLinesFor(region, focus)[0];
  return (
    <aside className="living-card space-y-3" aria-label="Support options">
      <div className="flex justify-between gap-3">
        <p className="font-display text-xl">{title}</p>
        {onDismiss && <button type="button" className="living-icon-button" aria-label="Dismiss support options" onClick={onDismiss}><X size={18} /></button>}
      </div>
      {children && <p className="living-muted text-sm">{children}</p>}
      {first && (
        <p className="text-sm">
          {first.label}: {first.detail}{' '}
          {first.call && <a className="underline" href={telHref(first.call)} aria-label={`Call now: ${first.label}`}>Call now</a>}
        </p>
      )}
      <p className="text-sm">{known ? `In immediate danger, call ${known.emergency}.` : 'In immediate danger, call your local emergency number.'}</p>
      <Link className="living-text-link" to={focus === 'relationship' ? '/support-now?focus=relationship' : '/support-now'}>All support options and a safety plan <ArrowRight size={15} /></Link>
    </aside>
  );
}
