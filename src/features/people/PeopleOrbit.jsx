import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { arrangeOrbitRing, orderPeopleForOrbit, interactionMix, describeInteractionMix } from '@/lib/people';

const PAGE = 12;

// The ring's segments, in a fixed order so the same feeling always sits in
// the same place. Mixed and unsure are one neutral segment, as in the legend.
const SEGMENTS = [
  ['supportive', 'var(--feel-supportive)'],
  ['strained', 'var(--feel-strained)'],
  ['unsafe', 'var(--feel-unsafe)'],
  ['neutral', 'var(--feel-mixed)'],
];
const RADIUS = 20.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring split by how the recorded interactions felt. */
function MixRing({ mix }) {
  const counts = { ...mix, neutral: mix.mixed + mix.unsure };
  const parts = SEGMENTS.filter(([feeling]) => counts[feeling] > 0);
  const gap = parts.length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <svg className="orbit-mix" viewBox="0 0 46 46" aria-hidden="true">
      {parts.map(([feeling, color]) => {
        const length = (counts[feeling] / mix.total) * CIRCUMFERENCE;
        const dash = Math.max(length - gap, 1);
        const segment = <circle key={feeling} cx="23" cy="23" r={RADIUS} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`} strokeDashoffset={-offset} />;
        offset += length;
        return segment;
      })}
    </svg>
  );
}

export default function PeopleOrbit({ people, entries = [], mixes, onChoose }) {
  const [page, setPage] = useState(0);
  const ordered = orderPeopleForOrbit(people, entries);
  const current = Math.min(page, Math.max(0, Math.ceil(ordered.length / PAGE) - 1));
  const slice = ordered.slice(current * PAGE, (current + 1) * PAGE);
  const innerPeople = arrangeOrbitRing(slice.slice(0, 6), entries);
  const outerPeople = arrangeOrbitRing(slice.slice(6), entries);
  if (!people.length) return null;

  const place = (ring, inner) => ring.map((person, index) => {
    const count = Math.max(ring.length, 1);
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + (inner ? 0 : Math.PI / 6);
    const radius = inner ? 25 : 45;
    const name = person.name.replace(/^Demo\s+/i, '');
    const mix = mixes?.get(person.id) || interactionMix(person, entries);
    return (
      <button
        type="button"
        className="orbit-person"
        key={person.id}
        aria-label={`Open ${person.name}${mix.total ? `. Interactions: ${describeInteractionMix(mix)}` : ''}`}
        style={{ left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }}
        onClick={() => onChoose(person)}
      >
        <span className="orbit-avatar" aria-hidden="true">
          {name.charAt(0)}
          {mix.total > 0 && <MixRing mix={mix} />}
          {mix.unsafe > 0 && <b className="orbit-unsafe">◆</b>}
        </span>
        <span className="orbit-name" title={name}>{name}</span>
      </button>
    );
  });

  return (
    <section className="living-card mt-7" aria-label="Your people orbit">
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="sanctuary-eyebrow">THE PEOPLE IN YOUR DAYS</p>
          <h2>Your orbit</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="living-icon-button" disabled={current === 0} aria-label="Previous people in orbit" onClick={() => setPage(current - 1)}><ChevronLeft size={18} /></button>
          <span className="text-xs whitespace-nowrap">{current + 1} / {Math.max(1, Math.ceil(ordered.length / PAGE))}</span>
          <button className="living-icon-button" disabled={(current + 1) * PAGE >= ordered.length} aria-label="Next people in orbit" onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="orbit-map">
        <div className="orbit-center">You</div>
        {place(innerPeople, true)}
        {place(outerPeople, false)}
      </div>
      <ul className="orbit-legend" aria-hidden="true">
        <li><i style={{ background: 'var(--feel-supportive)' }} />Supportive</li>
        <li><i style={{ background: 'var(--feel-strained)' }} />Strained</li>
        <li><i style={{ background: 'var(--feel-unsafe)' }} />Unsafe <span style={{ color: 'var(--feel-unsafe)' }}>◆</span></li>
        <li><i style={{ background: 'var(--feel-mixed)' }} />Mixed or unsure</li>
      </ul>
      <p className="living-muted text-xs text-center mt-3">The ring around a name shows how the interactions you recorded with them felt, as you labeled them. Names nearer the center are people you recorded more often, and names side by side were often tagged in the same entries. Open a name for your timeline together. Everyone is also in the list below.</p>
    </section>
  );
}
