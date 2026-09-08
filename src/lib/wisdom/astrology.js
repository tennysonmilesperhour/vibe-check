import { getPeriodKey } from '@/lib/dates';
import { ZODIAC } from './content/zodiac';
import { PLANETS, HOUSES, ASPECTS, ELEMENT_TEMPERAMENT, MODALITY_MODE } from './content/astrology';

export function astrologyPlacements(data = {}, computed = {}) {
  return PLANETS.flatMap(planet => {
    // An explicitly unknown Sun stays unknown; legacy profiles without a Sun use the date estimate.
    if (planet.id === 'sun' && data.sun_source === 'unknown') return [];
    const estimated = planet.id === 'sun' && (data.sun_source === 'date_estimate' || (!data.sun_sign && data.sun_source !== 'unknown'));
    const sign = estimated ? computed.sun_sign : data[planet.key];
    if (!Object.hasOwn(ZODIAC, sign)) return [];
    const houseValue = String(data[`${planet.id}_house`] ?? '');
    const house = /^(?:[1-9]|1[0-2])$/.test(houseValue) ? HOUSES[Number(houseValue) - 1] : null;
    const source = estimated ? 'date estimate' : planet.id === 'sun' && data.sun_source !== 'entered' ? 'source unconfirmed' : 'entered';
    return [{ ...planet, source, sign, zodiac: ZODIAC[sign], house: planet.id === 'rising' ? null : house, estimated }];
  });
}

export function astrologyAspects(data = {}) {
  const seen = new Set();
  return (Array.isArray(data.aspects) ? data.aspects : []).flatMap(row => {
    const a = PLANETS.find(p => p.id === row?.planet_a);
    const b = PLANETS.find(p => p.id === row?.planet_b);
    const aspect = Object.hasOwn(ASPECTS, row?.aspect) ? ASPECTS[row.aspect] : null;
    if (!a || !b || a.id === b.id || !aspect) return [];
    const key = [a.id, b.id].sort().join(':') + ':' + row.aspect;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ a, b, ...aspect }];
  });
}

function placementText(p) {
  const { zodiac: z } = p;
  const personal = ({ sun: z.sun, moon: z.moon, rising: z.rising, north_node: z.node })[p.id];
  const body = personal || `${p.label} represents ${p.focus}. In ${p.sign}, explore that function through ${z.style}. The opportunity is ${z.gift}; watch whether ${z.shadow} gets in the way. ${p.question}`;
  const outer = ['uranus', 'neptune', 'pluto'].includes(p.id)
    ? ' This slow-moving planet shares a sign with many people in a generation; its sign alone says little about an individual.' : '';
  return body + outer + (p.house ? `\nHouse ${p.house.number} brings the reflection into ${p.house.context}.` : '');
}

export function astrologyReading(data = {}, computed = {}) {
  const placements = astrologyPlacements(data, computed);
  const aspects = astrologyAspects(data);
  if (!placements.length && !aspects.length) return 'I am Tobacco. We can begin with what you know. Enter a placement from your birth chart in Profile Details, or add a birth date for an approximate Sun sign. Leave anything unknown blank. I will use these symbols as questions you can explore, with your own experience as the guide.';
  const sections = [];
  const add = (h, p) => sections.push(`${h.toUpperCase()}\n${p}`);
  add('Tobacco · A chart you can grow with', 'I am Tobacco. I watch plants grow in different conditions. A familiar form still leaves room for an individual life. Let us approach your chart with that same attention: what possibilities interest you, what tensions do you recognize, and what would you like to choose? Astrology offers a symbolic language for that conversation. Your experience has the final say.');
  const known = placements.map(p => `${p.label} in ${p.sign}${p.source !== 'entered' ? ` (${p.source})` : ''}`).join('; ') || 'No signs entered';
  add('What this reading uses', `${known}. ${placements.some(p => p.source === 'source unconfirmed') ? 'Your saved Sun has no source information and may have been estimated by an earlier version. Confirm it against an accurate chart in Profile Details. ' : ''}${placements.some(p => p.estimated) ? 'The Sun is estimated from calendar dates; near a sign boundary, check an accurate birth chart. ' : ''}Other placements are those you entered. Houses and aspects appear only when entered; unknown details remain open. This is a natal reflection, with no calculated transits or predictions of events.`);
  for (const p of placements) add(`${p.label} in ${p.sign}${p.house ? ` · House ${p.house.number}` : ''}`, placementText(p));
  const sun = placements.find(p => p.id === 'sun');
  const moon = placements.find(p => p.id === 'moon');
  const rising = placements.find(p => p.id === 'rising');
  if ([sun, moon, rising].filter(Boolean).length > 1) {
    add('Read the pieces together', `${sun ? `For purpose, your ${sun.sign} Sun offers ${sun.zodiac.style}. ` : ''}${moon ? `For care, your ${moon.sign} Moon offers ${moon.zodiac.style}. ` : ''}${rising ? `When meeting something new, ${rising.sign} Rising offers ${rising.zodiac.style}. ` : ''}Try one real situation: what do you want to do, what support do you need, and how do you want to begin? These answers can differ. Sharing an element does not prove harmony, and different elements do not prove conflict. Sign names alone do not establish an aspect.`);
  }
  if (sun) add('The language behind your Sun', `${ELEMENT_TEMPERAMENT[sun.zodiac.element]} ${MODALITY_MODE[sun.zodiac.modality]} ${sun.zodiac.ruler} is ${sun.sign}’s ruler in modern Western astrology. A ruler is a traditional association, not evidence that a planet controls your choices.`);
  for (const aspect of aspects) add(`Entered aspect · ${aspect.a.label} ${aspect.label.toLowerCase()} ${aspect.b.label}`, `Read ${aspect.a.focus} alongside ${aspect.b.focus}. ${aspect.meaning} This aspect comes from your chart entry; Vibe Check has not calculated its angle or orb.`);
  const focusPlacement = moon || sun || placements[0];
  const focus = focusPlacement || aspects[0].a;
  add('One small experiment', `${focus.action} ${focusPlacement?.zodiac.practice || ''} At your next check-in, record what happened, how you felt, and whether you had more room to choose. You can disagree with the reading and change the experiment.`);
  add('Keep your own record close', 'I will return with you to the whole pattern. A warm day does not erase the difficult days before it. No placement makes mistreatment necessary, excuses harm, or obliges you to stay in a relationship. Your boundaries and what you have lived matter more than a chart.');
  if (typeof data.custom_notes === 'string' && data.custom_notes.trim()) add('Your own notes', data.custom_notes);
  add('Further reading', 'Susan Miller · Planets and Possibilities\nSteven Forrest · The Inner Sky\nOriginal Vibe Check reflections informed by approachable planetary symbolism and an emphasis on development and choice. These are not excerpts or readings written by either author.');
  return sections.join('\n\n');
}

export function astrologyPeriodWisdom(periodType, data, computed, date = new Date()) {
  const placements = astrologyPlacements(data, computed);
  if (!placements.length) return null;
  const type = ['daily', 'weekly', 'monthly', 'yearly'].includes(periodType) ? periodType : 'daily';
  const cadence = { daily: 'today', weekly: 'this week', monthly: 'this month', yearly: 'this year' }[type];
  const seed = [...getPeriodKey(type, date)].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const p = placements[seed % placements.length];
  const review = {
    daily: 'At your next check-in, describe what happened and whether the action fit your needs.',
    weekly: 'Choose one experiment to revisit this week. In your weekly report, compare difficult moments and easier ones; notice what helped and what kept repeating.',
    monthly: 'Return to your journal across the month. What repeated around people, habits, or boundaries? Keep one useful experiment, adapt one, and let go of one that did not fit.',
    yearly: 'Look across the seasons of your own record. Which commitments still matter, which need support, and which would you choose to change? Leave room to revise your plans.',
  }[type];
  return {
    theme: `${p.label} · ${p.focus}`,
    wisdom: `I am Tobacco. Let us give ${p.focus} some attention ${cadence}. Your ${p.label} in ${p.sign} offers ${p.zodiac.style} as a possibility to explore${p.house ? `, especially around ${p.house.context}` : ''}.\n\n${p.action}\n\n${review}`,
    contemplation: `${p.question} What would feel more like a choice of your own?`,
    basis: `Based on ${p.label} in ${p.sign}${p.estimated ? ' (approximate Sun)' : p.source === 'source unconfirmed' ? ' (saved Sun; source unconfirmed)' : ' as entered'}. A rotating natal reflection for ${cadence}; no transits or event forecast are calculated.`,
  };
}
