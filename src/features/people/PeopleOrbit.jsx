import React from "react";
import { personCheckInStats } from "@/lib/people";

const INITIALS = (name = "") => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

/** Spatial overview of relational context. Distance represents recency, never value. */
export default function PeopleOrbit({ people, checkIns, onSelect, selectedId }) {
  const orbitPeople = people.slice(0, 12);
  const nodes = orbitPeople.map((person, index) => {
    const stats = personCheckInStats(person, checkIns);
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(orbitPeople.length, 1);
    const ring = index % 3 === 0 ? 34 : index % 3 === 1 ? 43 : 38;
    return {
      person,
      stats,
      x: 50 + Math.cos(angle) * ring,
      y: 50 + Math.sin(angle) * ring,
    };
  });

  return (
    <section className="people-orbit" aria-label="Your people orbit">
      <div className="people-orbit__stage">
        <span className="people-orbit__ring people-orbit__ring--outer" aria-hidden="true" />
        <span className="people-orbit__ring people-orbit__ring--inner" aria-hidden="true" />
        <div className="people-orbit__self" aria-hidden="true"><span>You</span></div>
        {nodes.map(({ person, stats, x, y }) => (
          <button
            key={person.id}
            type="button"
            className="people-orbit__node"
            data-selected={selectedId === person.id}
            style={{ "--orbit-x": `${x}%`, "--orbit-y": `${y}%`, "--orbit-scale": Math.min(1.18, 0.9 + stats.mentions * 0.035) }}
            onClick={() => onSelect(person)}
            aria-label={`${person.name}, ${stats.mentions || "no"} shared days`}
          >
            <span className="people-orbit__initials" aria-hidden="true">{INITIALS(person.name)}</span>
            <span className="people-orbit__name">{person.name}</span>
            <span className="people-orbit__meta">{stats.mentions ? `${stats.mentions} days` : person.person_type}</span>
          </button>
        ))}
      </div>
      <p className="people-orbit__legend">Position varies to keep the orbit legible. It does not rank the relationship.</p>
      <div className="people-orbit__index" aria-label="All people">
        {people.map((person) => (
          <button key={`index-${person.id}`} type="button" data-selected={selectedId === person.id} onClick={() => onSelect(person)}>
            {person.name}
          </button>
        ))}
      </div>
    </section>
  );
}
