import { Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { SUPPORT_REGIONS, supportLinesFor, findAHelplineUrl, telHref, smsHref } from '@/lib/support-resources';
import useSupportRegion from './useSupportRegion';

/** Free, confidential services for where the person is, with a way to change region. */
export default function SupportResources({ focus = 'crisis' }) {
  const [region, setRegion] = useSupportRegion();
  const known = SUPPORT_REGIONS[region];
  const lines = supportLinesFor(region, focus);
  return (
    <div className="space-y-4">
      <p className="living-label">
        {known ? `If you are in immediate danger, call ${known.emergency}.` : 'If you are in immediate danger, call your local emergency number.'}
      </p>
      {lines.map((line) => (
        <div key={line.id} className="living-inset space-y-2">
          <p className="font-semibold">{line.label}</p>
          <p className="living-muted text-sm">{line.detail}</p>
          <div className="flex flex-wrap gap-3">
            {line.call && <a className="living-secondary" href={telHref(line.call)} aria-label={`Call: ${line.label}`}><Phone size={15} aria-hidden="true" />Call</a>}
            {line.text && <a className="living-secondary" href={smsHref(line.text)} aria-label={`Text: ${line.label}`}><MessageSquare size={15} aria-hidden="true" />Text</a>}
            {line.url && <a className="living-text-link" href={line.url} target="_blank" rel="noreferrer" aria-label={`Website: ${line.label} (opens in a new tab)`}>Website <ExternalLink size={13} aria-hidden="true" /></a>}
          </div>
        </div>
      ))}
      <p className="text-sm">
        <a className="living-text-link" href={findAHelplineUrl(known ? region : null)} target="_blank" rel="noreferrer">
          {known ? `More free services in ${known.name}` : 'Find a free helpline in your country'} <ExternalLink size={13} aria-hidden="true" />
        </a>
      </p>
      <label className="living-label block text-sm">
        Showing services for
        <select className="living-input mt-2" value={region} onChange={(event) => setRegion(event.target.value)}>
          {Object.entries(SUPPORT_REGIONS).map(([code, entry]) => <option key={code} value={code}>{entry.name}</option>)}
          <option value="other">Somewhere else</option>
        </select>
      </label>
      <p className="living-muted text-xs">These services are independent of Vibe Check. Vibe Check never contacts anyone for you.</p>
    </div>
  );
}
