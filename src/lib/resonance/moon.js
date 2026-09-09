// Lunar phase from pure synodic arithmetic — no API, no lookup table.
// Reference epoch: the new moon of 2000-01-06 18:14 UTC.
import { parseLocalDate } from '../dates.js';

const SYNODIC_DAYS = 29.53058867;
const EPOCH_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export const PHASES = [
  { name: 'New Moon' },
  { name: 'Waxing Crescent' },
  { name: 'First Quarter' },
  { name: 'Waxing Gibbous' },
  { name: 'Full Moon' },
  { name: 'Waning Gibbous' },
  { name: 'Last Quarter' },
  { name: 'Waning Crescent' },
];

/**
 * Phase for a local date key ('yyyy-MM-dd'), evaluated at local noon so the
 * answer matches what people see in the sky that evening.
 * Returns { index, name, illumination, ageDays }; render with MoonGlyph.
 */
export function moonPhase(dateKey) {
  const local = parseLocalDate(dateKey);
  const atNoon = new Date(local.getFullYear(), local.getMonth(), local.getDate(), 12);
  const days = (atNoon.getTime() - EPOCH_NEW_MOON) / 86400000;
  const cycle = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const fraction = cycle / SYNODIC_DAYS;

  // 8 bins centered on the exact phase points (new = fraction 0).
  const index = Math.round(fraction * 8) % 8;
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;

  return {
    index,
    name: PHASES[index].name,
    illumination,
    ageDays: cycle,
  };
}
