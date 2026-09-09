import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PeopleOrbit({ people, onChoose }) {
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, Math.ceil(people.length / 12) - 1));
  const visible = people.slice(current * 12, (current + 1) * 12);
  if (!people.length) return null;
  return <section className="living-card mt-7" aria-label="Your people orbit"><div className="flex justify-between items-center gap-4"><div><p className="sanctuary-eyebrow">THE PEOPLE IN YOUR DAYS</p><h2>Your orbit</h2></div><div className="flex items-center gap-2"><button className="living-icon-button" disabled={current === 0} aria-label="Previous people in orbit" onClick={() => setPage(current - 1)}><ChevronLeft size={18} /></button><span className="text-xs">{current + 1} / {Math.ceil(people.length / 12)}</span><button className="living-icon-button" disabled={(current + 1) * 12 >= people.length} aria-label="Next people in orbit" onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button></div></div>
    <div className="orbit-map"><div className="orbit-center">You</div>{visible.map((person, index) => { const inner = index < 6; const angle = (index % 6) / Math.min(6, inner ? visible.length : visible.length - 6) * Math.PI * 2 - Math.PI / 2 + (inner ? 0 : Math.PI / 6); const radius = inner ? 25 : 45; const name = person.name.replace(/^Demo\s+/i, ''); return <button type="button" className="orbit-person" key={person.id} aria-label={`Open ${person.name}`} style={{ left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }} onClick={() => onChoose(person)}><span aria-hidden="true">{name.charAt(0)}</span>{name.split(' ')[0]}</button>; })}</div>
    <p className="living-muted text-xs text-center">Tap a person to revisit their place in your record. Positions are decorative. Every person is also in the list below.</p>
  </section>;
}
