// Period cache keys — MUST stay in exact parity with src/lib/dates.js getPeriodKey.
// Guarded by src/lib/__tests__/periodKeyParity.test.js (imports this file directly).
// Deno-safe: no external deps, no date-fns.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO-8601 week number and week-year (weeks start Monday; week 1 contains Jan 4). */
function isoWeekParts(date: Date): { year: number; week: number } {
  // Work on a UTC-noon copy of the LOCAL calendar day to dodge DST edges.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday decides the week-year
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1, 12));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year, week };
}

export function getPeriodKey(type: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  if (type === 'daily') return `${y}-${m}-${pad(date.getDate())}`;
  if (type === 'weekly') {
    const { year, week } = isoWeekParts(date);
    return `${year}-W${pad(week)}`;
  }
  if (type === 'monthly') return `${y}-${m}`;
  return String(y);
}
