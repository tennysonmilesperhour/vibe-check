import React from 'react';
import { deriveAstrology } from '@/lib/resonance/astrology';
import { ZODIAC } from '@/lib/wisdom/content/zodiac';
import { PLANETS, HOUSES, ASPECTS } from '@/lib/wisdom/content/astrology';

function PlacementField({ planet, data, set, estimatedSun }) {
  const legacySun = planet.id === 'sun' && data.sun_sign && !data.sun_source;
  const value = planet.id !== 'sun' ? data[planet.key] || ''
    : data.sun_source === 'unknown' ? ''
    : legacySun ? 'saved'
    : !data.sun_sign || data.sun_source === 'date_estimate' ? (estimatedSun ? 'estimate' : '')
    : data.sun_sign;
  return <div className="astro-placement-field">
    <label htmlFor={`astro-${planet.id}`} className="font-semibold text-sm">{planet.symbol} {planet.label}</label>
    <p className="text-xs mb-2">{planet.focus}</p>
    <select id={`astro-${planet.id}`} value={value} onChange={event => {
      const val = event.target.value;
      if (val === 'saved') return;
      if (planet.id === 'sun') set({ sun_sign: val === 'estimate' ? estimatedSun : val, sun_source: val === 'estimate' ? 'date_estimate' : val ? 'entered' : 'unknown' });
      else set({ [planet.key]: val });
    }}>
      <option value="">Unknown / not entered</option>
      {legacySun && <option value="saved">{data.sun_sign} · saved, source unconfirmed</option>}
      {planet.id === 'sun' && estimatedSun && <option value="estimate">{estimatedSun} · date estimate</option>}
      {Object.keys(ZODIAC).map(sign => <option key={sign} value={sign}>{sign}</option>)}
    </select>
    {planet.id !== 'rising' && <label className="astro-house-label">House (optional)
      <select aria-label={`${planet.label} house`} value={data[`${planet.id}_house`] || ''} onChange={event => set({ [`${planet.id}_house`]: event.target.value })}>
        <option value="">Unknown / not entered</option>
        {HOUSES.map(house => <option key={house.number} value={house.number}>{house.number} · {house.label}</option>)}
      </select>
    </label>}
  </div>;
}

export default function AstrologyProfile({ data = {}, onChange, birthDate }) {
  const set = updates => onChange({ ...data, ...updates });
  const estimatedSun = deriveAstrology(birthDate).sun_sign;
  const aspects = Array.isArray(data.aspects) ? data.aspects : [];
  const setAspect = (i, changes) => set({ aspects: aspects.map((row, index) => index === i ? { ...row, ...changes } : row) });
  return <div className="astro-profile space-y-5">
    <p className="text-sm">Begin with the placements you know. Select signs and houses from a birth chart you trust. Rising and houses depend on an accurate birth time and place. Moon and other planets require a chart calculation; they are not inferred here.</p>
    {estimatedSun && <p className="astro-note">Your birth date suggests a {estimatedSun} Sun. This calendar estimate can differ from an accurate chart near a sign boundary. Choose a known Sun sign to override it, or leave it unknown.</p>}
    {data.sun_sign && !data.sun_source && <p className="text-xs">Your saved Sun has no source information. Select a sign from your accurate birth chart to confirm it, or choose the date estimate.</p>}
    <div className="grid md:grid-cols-3 gap-4">{PLANETS.slice(0, 3).map(p => <PlacementField key={p.id} planet={p} data={data} set={set} estimatedSun={estimatedSun} />)}</div>
    <details className="astro-disclosure">
      <summary>More planets &amp; the North Node</summary>
      <p className="text-sm my-3">Add depth at your own pace. A planet describes a function, its sign a possible style, and its house an area of life. Leave anything uncertain blank.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{PLANETS.slice(3).map(p => <PlacementField key={p.id} planet={p} data={data} set={set} />)}</div>
    </details>
    <details className="astro-disclosure">
      <summary>Aspects from your chart ({aspects.length})</summary>
      <p className="text-sm my-3">Enter connections shown in your birth chart. Signs alone cannot establish an aspect. Vibe Check does not calculate angles or orbs.</p>
      <div className="space-y-3">{aspects.map((row, i) => <fieldset key={i} className="astro-aspect-row">
        <legend className="text-xs mb-1">Aspect {i + 1}</legend>
        <select aria-label={`Aspect ${i + 1} first placement`} value={row.planet_a || ''} onChange={e => setAspect(i, { planet_a: e.target.value })}>
          <option value="">First placement</option>{PLANETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select aria-label={`Aspect ${i + 1} connection`} value={row.aspect || ''} onChange={e => setAspect(i, { aspect: e.target.value })}>
          <option value="">Connection</option>{Object.entries(ASPECTS).map(([key, aspect]) => <option key={key} value={key}>{aspect.label} · {aspect.angle}</option>)}
        </select>
        <select aria-label={`Aspect ${i + 1} second placement`} value={row.planet_b || ''} onChange={e => setAspect(i, { planet_b: e.target.value })}>
          <option value="">Second placement</option>{PLANETS.filter(p => p.id !== row.planet_a).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button type="button" className="underline text-xs" aria-label={`Remove aspect ${i + 1}`} onClick={() => set({ aspects: aspects.filter((_, index) => index !== i) })}>Remove</button>
        {(!row.planet_a || !row.planet_b || !row.aspect || row.planet_a === row.planet_b) && <p className="text-xs col-span-full">Choose two different placements and a connection to include this aspect in your reading.</p>}
      </fieldset>)}</div>
      <button type="button" className="ink-button text-sm mt-3" onClick={() => set({ aspects: [...aspects, { planet_a: '', aspect: '', planet_b: '' }] })}>Add an aspect</button>
    </details>
    <label className="block text-sm font-semibold" htmlFor="astro-notes">Your chart notes</label>
    <textarea id="astro-notes" rows={3} value={data.custom_notes || ''} onChange={e => set({ custom_notes: e.target.value })} placeholder="Chart source, house system, questions, or what fits your experience…" />
  </div>;
}
