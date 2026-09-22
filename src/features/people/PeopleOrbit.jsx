import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { arrangeOrbitRing, orderPeopleForOrbit } from '@/lib/people';

const PAGE = 12;

export default function PeopleOrbit({ people, entries = [], onChoose }) {
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
    return (
      <button
        type="button"
        className="orbit-person"
        key={person.id}
        aria-label={`Open ${person.name}`}
        style={{ left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }}
        onClick={() => onChoose(person)}
      >
        <span aria-hidden="true">{name.charAt(0)}</span>
        {name.split(' ')[0]}
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
          <span className="text-xs">{current + 1} / {Math.max(1, Math.ceil(ordered.length / PAGE))}</span>
          <button className="living-icon-button" disabled={(current + 1) * PAGE >= ordered.length} aria-label="Next people in orbit" onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="orbit-map">
        <div className="orbit-center">You</div>
        {place(innerPeople, true)}
        {place(outerPeople, false)}
      </div>
      <p className="living-muted text-xs text-center">Inner names are people you recorded more often with the people picker. Names next to each other were often tagged in the same entries. Every person is also in the list below.</p>
    </section>
  );
}
