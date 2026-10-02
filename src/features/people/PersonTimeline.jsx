import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import EntryLink from '@/features/patterns/EntryLink';
import { describeInteractionMix, personTimeline } from '@/lib/people';
import { entryKindLabel, personExcerpt } from '@/lib/living-patterns';
import { formatDay } from '@/lib/dates';

const PAGE = 8;

/**
 * Your timeline with one person, newest first. Keyed by the person where it
 * is used, so each person starts from their most recent entries.
 * @param {{ person: any, entries: any[], mix: Record<string, number>, harm: boolean }} props
 */
export default function PersonTimeline({ person, entries, mix, harm }) {
  const [shown, setShown] = useState(PAGE);
  const timeline = useMemo(() => personTimeline(person, entries), [person, entries]);
  return (
    <section className="space-y-3" aria-labelledby="person-timeline-heading">
      <h3 id="person-timeline-heading" className="text-xl">Your timeline with {person.name}</h3>
      {mix.total > 0 && <p className="text-sm">Interactions you recorded: {describeInteractionMix(mix)}.</p>}
      {/* An unsafe interaction or a crossed boundary leads to help, Cosmos or not. */}
      {harm && <Link className="living-text-link text-sm" to="/support-now?focus=relationship">Support for relationships <ArrowRight size={14} aria-hidden="true" /></Link>}
      {timeline.length ? (
        <ol className="person-timeline">
          {timeline.slice(0, shown).map((entry) => {
            const excerpt = personExcerpt(entry, person);
            return (
              <li key={entry.key}>
                <p className="living-label">
                  {formatDay(entry.date)} · {entryKindLabel(entry)}{entry.interaction_feeling ? ` · ${entry.interaction_feeling}` : ''}
                  {entry.interaction_feeling === 'unsafe' && <span aria-hidden="true"> ◆</span>}
                  {entry.mood_score != null ? ` · ${entry.kind === 'day' ? 'day' : 'moment'} mood ${entry.mood_score}/10` : ''}
                </p>
                {excerpt && <p className="person-timeline-text">{excerpt}</p>}
                <EntryLink entry={entry} className="text-sm">Read the entry</EntryLink>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="living-muted text-sm">Nothing recorded with {person.name} yet. Tag them in a check-in or a moment, and those entries gather here.</p>
      )}
      {timeline.length > shown && (
        <button type="button" className="living-secondary" onClick={() => setShown((count) => count + PAGE)}>Show earlier entries ({timeline.length - shown})</button>
      )}
      {timeline.length > 0 && <Link className="living-text-link text-sm" to={`/Analytics?tab=journal&person=${person.id}&range=all`}>Read the full relationship history <ArrowRight size={14} aria-hidden="true" /></Link>}
    </section>
  );
}
