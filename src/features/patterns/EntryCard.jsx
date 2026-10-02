import { useEffect, useRef } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { entryPeople, entryStates } from '@/lib/living-patterns';
import { stateById, ALIGNMENTS } from '@/lib/practices';
import { formatDay } from '@/lib/dates';

/** One check-in or journal entry, read-only unless onEdit or onDelete is given. */
export default function EntryCard({ entry, people = [], selected = false, highlighted = false, onHighlight, onEdit, onDelete }) {
  const ref = useRef(null);
  useEffect(() => { if (selected) ref.current?.scrollIntoView({ block: 'center', behavior: 'instant' }); }, [selected]);
  const names = entryPeople(entry).map((id) => people.find((person) => person.id === id)?.name || 'Removed person');
  const context = entry.stress_context || {};
  const day = formatDay(entry.date, { style: 'long' });
  return <article ref={ref} className={`living-card journal-entry ${selected ? 'journal-entry-selected' : ''}`} id={`entry-${entry.id}`}>
    <div className="flex flex-wrap justify-between items-start gap-3"><div><p className="sanctuary-eyebrow">{entry.kind === 'day' ? 'DAILY CHECK-IN' : entry.interaction_feeling ? 'INTERACTION' : 'JOURNAL'}{entry.is_draft ? ' · UNFINISHED' : ''}{entry.is_demo ? ' · DEMO' : ''}</p><h3 className="mt-1">{day}</h3></div><div className="flex gap-3">{onHighlight && <button type="button" className="living-icon-button" aria-pressed={highlighted} aria-label={`Highlight the entry from ${day}`} onClick={() => onHighlight(entry)}><Star size={16} fill={highlighted ? 'currentColor' : 'none'} aria-hidden="true" /></button>}{onEdit && <button type="button" className="living-icon-button" aria-label={`Edit entry from ${day}`} onClick={() => onEdit(entry)}><Pencil size={16} /></button>}{onDelete && <button type="button" className="living-icon-button danger-icon" aria-label={`Delete entry from ${day}`} onClick={() => onDelete(entry)}><Trash2 size={16} /></button>}</div></div>
    <div className="living-chips mt-3">{entry.mood_score != null && <span className="living-tag">{entry.kind === 'day' ? 'Day mood' : 'Moment mood'} {entry.mood_score}/10</span>}{context.stress_score != null && <span className="living-tag">{context.stress_measure === 'highest-today' ? 'Highest stress' : entry.kind === 'day' ? 'Stress at check-in' : 'Stress'} {context.stress_score}/10</span>}{entry.interaction_feeling && <span className={`living-tag ${entry.interaction_feeling === 'unsafe' ? 'living-tag-alert' : ''}`}>Interaction: {entry.interaction_feeling}</span>}{entry.boundary_respected && <span className="living-tag">Boundary respected: {entry.boundary_respected}</span>}{names.map((name, i) => <span className="living-tag" key={`${name}:${i}`}>{name}</span>)}</div>
    {entry.high_moment?.description && <div className="mt-4"><p className="living-label">A supportive moment</p><p className="whitespace-pre-wrap mt-1">{entry.high_moment.description}</p></div>}
    {entry.low_moment?.description && <div className="mt-4"><p className="living-label">A difficult moment</p><p className="whitespace-pre-wrap mt-1">{entry.low_moment.description}</p></div>}
    {entry.notes && <p className="whitespace-pre-wrap mt-4">{entry.notes}</p>}
    {entry.gratitude && <p className="whitespace-pre-wrap mt-3"><span className="living-label">Gratitude · </span>{entry.gratitude}</p>}
    {(entry.activities?.length > 0 || entry.emotions?.length > 0) && <p className="living-muted text-sm mt-3">{[...(entry.emotions || []), ...(entry.activities || [])].join(' · ')}</p>}
    {entryStates(entry).length > 0 && <p className="living-muted text-sm mt-3">What felt present: {entryStates(entry).map((id) => stateById(id)?.label).join(' · ')}</p>}
    {context.body_cues?.length > 0 && <p className="text-sm mt-3"><strong>Body cues:</strong> {context.body_cues.join(', ')}</p>}
    {[['situation', 'What happened before'], ['response', 'My response'], ['need', 'What I needed']].map(([field, label]) => context[field] ? <p className="text-sm whitespace-pre-wrap mt-3" key={field}><strong>{label}: </strong>{context[field]}</p> : null)}
    {context.alignment && <p className="text-sm mt-3"><strong>How it felt:</strong> {ALIGNMENTS.find((a) => a.id === context.alignment)?.label}</p>}
    {entry.occurred_at && <p className="living-muted text-xs mt-3">Experience time: {new Date(entry.occurred_at).toLocaleString()}</p>}
    {entry.created_at && <p className="living-muted text-xs mt-4">Recorded {new Date(entry.created_at).toLocaleString()}{entry.updated_at !== entry.created_at && entry.updated_at ? ` · Edited ${new Date(entry.updated_at).toLocaleDateString()}` : ''}</p>}
  </article>;
}
