import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { stateById, recommendPractices } from '@/lib/practices';
import { EntryLink } from './Journal';

export default function StressPatternCards({ patterns, data, onFeedback, max = 6 }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function feedback(key, value) {
    setBusy(key); setError('');
    try { await onFeedback(key, value); } catch (err) { setError(err.message); }
    setBusy('');
  }
  // One useful context per state avoids repeating the same observation on many cards.
  const unique = patterns.filter((pattern, index) => patterns.findIndex((other) => other.state === pattern.state) === index).slice(0, max);
  return <section className="space-y-4" aria-labelledby="stress-patterns-heading"><div><p className="sanctuary-eyebrow">NOTICE · PRACTICE · RETURN</p><h2 id="stress-patterns-heading">Stress patterns worth noticing</h2><p className="living-muted mt-2">Connections between what you recorded. You decide whether they fit.</p></div>
    {error && <p className="living-error" role="alert">{error}</p>}
    {!unique.length && <div className="living-inset"><p>No recurring stress pattern appears across three recorded days in this view.</p><p className="living-muted mt-2">You can still choose a practice for what feels present now.</p><Link className="living-text-link mt-3" to="/Practice?tab=somatic">Find a practice <ArrowRight size={15} /></Link></div>}
    <div className="grid lg:grid-cols-2 gap-4">{unique.map((pattern) => {
      const state = stateById(pattern.state);
      const practice = recommendPractices(pattern.state, data.sessions, data.preferences.hidden_practices || [])[0];
      const target = new URLSearchParams({ tab: 'somatic', state: pattern.state, pattern: pattern.key, sources: pattern.entries.map((entry) => entry.key).slice(0, 10).join(',') });
      if (practice) target.set('practice', practice.id);
      const explicit = pattern.entries.every((entry) => entry.stress_context?.state_ids?.includes(pattern.state));
      return <article key={pattern.key} className="living-card space-y-4"><div><span className="living-tag">{pattern.status === 'confirmed' ? 'You confirmed this connection' : 'Suggested connection'}</span><h3 className="mt-3">{state?.label}{pattern.context.label ? ` · ${pattern.context.label}` : ''}</h3><p className="living-muted mt-2">{pattern.entries.length} of {pattern.total} {pattern.context.type === 'state' ? 'entries' : `entries tagged with ${pattern.context.label}`} include {explicit ? 'this selected state' : 'related feeling tags or a selected state'}, across {pattern.days} days.</p></div>
        <p className="text-sm">An association in your record does not establish a cause. Entries without this tag may contain other experiences.</p>
        <details><summary className="living-text-link cursor-pointer">Read the entries behind this</summary><ul className="mt-3 space-y-3">{pattern.entries.map((entry) => <li key={entry.key}><EntryLink entry={entry}>{entry.date} · {entry.kind === 'day' ? 'Check-in' : 'Journal'}</EntryLink>{entry.stress_context?.body_cues?.length > 0 && <p className="living-muted text-xs">Body cues: {entry.stress_context.body_cues.join(', ')}</p>}{entry.stress_context?.need && <p className="text-sm whitespace-pre-wrap mt-1">“{entry.stress_context.need}”</p>}</li>)}</ul></details>
        <div className="living-inset"><p className="living-label">A possible next step</p><p className="text-sm mt-1">{practice ? practice.purpose : 'Choose an option that fits your needs and past experience.'}</p><Link className="living-text-link mt-3" to={`/Practice?${target}`}>{practice ? `Try ${practice.title.toLowerCase()}` : 'Choose a practice'} <ArrowRight size={15} /></Link></div>
        <div className="flex flex-wrap gap-4 text-sm"><button className="underline" disabled={busy === pattern.key} onClick={() => feedback(pattern.key, 'confirmed')}>{pattern.status === 'confirmed' ? 'Connection confirmed' : 'This fits my experience'}</button><button className="underline" disabled={busy === pattern.key} onClick={() => feedback(pattern.key, 'dismissed')}>This does not fit</button></div>
      </article>;
    })}</div>
  </section>;
}
