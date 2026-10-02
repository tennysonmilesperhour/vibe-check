import React from 'react';
import { PLANETS, HOUSES, ASPECTS, ASTROLOGY_SOURCES } from '@/lib/wisdom/content/astrology';

export function AstrologySources() {
  return <details className="astro-disclosure mt-4">
    <summary>Reading roots · Miller &amp; Forrest</summary>
    <p className="text-sm my-3">These original Vibe Check reflections draw on approachable planetary symbolism and an emphasis on development and choice. Explore the authors’ own work for their full teachings.</p>
    <ul className="space-y-3">{ASTROLOGY_SOURCES.map(source => <li key={source.title}>
      <a className="underline font-medium" href={source.url} target="_blank" rel="noreferrer">{source.title} · {source.author}</a>
      <p className="text-sm mt-1">{source.context}</p>
    </li>)}</ul>
    <p className="text-xs mt-3">Independent, original writing; no book excerpts or author endorsement. Astrology is offered as symbolic reflection, not a scientific assessment or a prediction.</p>
  </details>;
}

export default function AstrologyGuide() {
  return <section className="astro-guide" aria-label="Learn the language of your chart">
    <p className="text-xs uppercase tracking-widest">The sky as a companion</p>
    <h3 className="font-display text-2xl mt-2">A chart leaves room for choice</h3>
    <p className="text-sm leading-relaxed mt-3">Approach the sky with curiosity. Begin with the Sun for purpose, the Moon for care, and the Rising sign for how you meet the world. Then look at the rest of the chart. Let each symbol lead to a question you can carry into your own life.</p>
    <div className="grid sm:grid-cols-3 gap-3 mt-4">
      {[['Planet · what', 'A function to explore: communicating, caring, acting, or making a commitment.'], ['Sign · how', 'A symbolic style with possibilities and tensions. It does not describe every person who shares it.'], ['House · where', 'An area of life where you can explore a placement. It depends on a calculated chart and house system.']].map(([title, body]) => <div className="astro-note" key={title}><h4 className="font-semibold mb-1">{title}</h4><p className="text-sm">{body}</p></div>)}
    </div>
    <details className="astro-disclosure mt-4"><summary>Meet the planets</summary>
      <p className="text-xs my-3">Astrology also uses the Sun and Moon as luminaries, and the Ascendant and North Node as chart points. They are not all physical planets.</p>
      <div className="grid sm:grid-cols-2 gap-4">{PLANETS.map(p => <div key={p.id}><h4 className="font-semibold">{p.symbol} {p.label}</h4><p className="text-sm capitalize">{p.focus}</p><p className="text-sm mt-1">{p.question}</p></div>)}</div>
    </details>
    <details className="astro-disclosure mt-3"><summary>The twelve houses</summary>
      <div className="grid sm:grid-cols-2 gap-4 mt-3">{HOUSES.map(h => <div key={h.number}><h4 className="font-semibold">{h.number} · {h.label}</h4><p className="text-sm capitalize">{h.context}</p></div>)}</div>
    </details>
    <details className="astro-disclosure mt-3"><summary>Aspects · how chart functions meet</summary>
      <p className="text-sm my-3">Aspects describe angular relationships between chart positions. Their interpretation also depends on the planets involved and the allowed distance from the exact angle, called the orb.</p>
      <div className="space-y-3">{Object.values(ASPECTS).map(a => <div key={a.label}><h4 className="font-semibold">{a.label} · {a.angle}</h4><p className="text-sm">{a.meaning}</p></div>)}</div>
    </details>
    <AstrologySources />
  </section>;
}
