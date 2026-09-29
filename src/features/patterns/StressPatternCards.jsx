import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { stateById, recommendPractices, hiddenPractices } from '@/lib/practices';
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
  return <section className="space-y-4" aria-labelledby="stress-patterns-heading"><div><p className="sanctuary-eyebrow">NOTICE · PRACTICE · RETURN</p><h2 id="stress-patterns-heading">What repeats in your record</h2><p className="living-muted mt-2">Counts of the states you chose. A person or habit appears when a state shows up clearly more often on compared check-ins with it than on those without, or when you said it fits. Compared check-ins are daily ones that recorded reaching both the people and habits question and the stress question, and tag at least one person (or habit), so this usually takes a few months of records. You decide whether it fits.</p></div>
    {error && <p className="living-error" role="alert">{error}</p>}
    {!unique.length && <div className="living-inset"><p>No state you chose repeats on three or more days in this view.</p><p className="living-muted mt-2">You can still choose a practice for what feels present now.</p><Link className="living-text-link mt-3" to="/Practice?tab=somatic">Find a practice <ArrowRight size={15} /></Link></div>}
    <div className="grid lg:grid-cols-2 gap-4">{unique.map((pattern) => {
      const state = stateById(pattern.state);
      const connection = pattern.context.type !== 'state';
      const others = pattern.context.type === 'person' ? 'other people' : 'other habits';
      const practice = recommendPractices(pattern.state, data.sessions, hiddenPractices(data.preferences, data.sessions)).find((option) => !option.uncomfortable);
      const target = new URLSearchParams({ tab: 'somatic', state: pattern.state, pattern: pattern.key, sources: pattern.entries.map((entry) => entry.key).slice(0, 10).join(',') });
      if (practice) target.set('practice', practice.id);
      return <article key={pattern.key} className="living-card space-y-4"><div><span className="living-tag">{pattern.status === 'confirmed' ? 'You confirmed this' : connection ? 'Shows up more with this' : 'What you recorded'}</span><h3 className="mt-3">{state?.label}{connection ? ` · ${pattern.context.label}` : ''}</h3>
        <p className="living-muted mt-2">{connection
          ? `${state?.label} on ${pattern.days} of the ${pattern.total} compared check-ins with ${pattern.context.label}${pattern.without.total ? `, and on ${pattern.without.days} of the ${pattern.without.total} with ${others} but not ${pattern.context.label}.` : `. None of the compared check-ins in this view tag ${others} without ${pattern.context.label}, so there is nothing to compare with.`}`
          : `You chose ${state?.label} on ${pattern.days} of the ${pattern.total} days recorded in this view.`}</p></div>
        {connection && <p className="text-sm">{pattern.significant
          ? "In this view, that gap is larger than chance would easily explain. It doesn't show a cause, and the days behind it can hold other things too."
          : pattern.without.total ? "In this view the gap could be chance. It's here because you said it fits your experience." : "It's here because you said it fits your experience."}</p>}
        <details><summary className="living-text-link cursor-pointer">Read the entries behind this</summary><ul className="mt-3 space-y-3">{pattern.entries.map((entry) => <li key={entry.key}><EntryLink entry={entry}>{entry.date} · {entry.kind === 'day' ? 'Check-in' : 'Journal'}</EntryLink>{entry.stress_context?.body_cues?.length > 0 && <p className="living-muted text-xs">Body cues: {entry.stress_context.body_cues.join(', ')}</p>}{entry.stress_context?.need && <p className="text-sm whitespace-pre-wrap mt-1">“{entry.stress_context.need}”</p>}</li>)}</ul></details>
        <div className="living-inset"><p className="living-label">A possible next step</p><p className="text-sm mt-1">{practice ? practice.purpose : 'Choose an option that fits your needs and past experience.'}</p><Link className="living-text-link mt-3" to={`/Practice?${target}`}>{practice ? `Try ${practice.title.toLowerCase()}` : 'Choose a practice'} <ArrowRight size={15} /></Link></div>
        <div className="flex flex-wrap gap-4 text-sm">{connection
          ? <><button className="underline" disabled={busy === pattern.key} onClick={() => feedback(pattern.key, 'confirmed')}>{pattern.status === 'confirmed' ? 'Connection confirmed' : 'This fits my experience'}</button><button className="underline" disabled={busy === pattern.key} onClick={() => feedback(pattern.key, 'dismissed')}>This does not fit</button></>
          : <button className="underline" disabled={busy === pattern.key} onClick={() => feedback(pattern.key, 'dismissed')}>Hide this card</button>}</div>
      </article>;
    })}</div>
  </section>;
}
