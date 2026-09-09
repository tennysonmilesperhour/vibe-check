import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { dateKey, parseLocalDate, addDaysKey } from './dates';
import { validDateKey } from './living-patterns';

export const CALENDAR_METRICS = {
  mood: { label: 'Mood', title: 'Daily mood', field: 'mood_score', description: 'The mood from your daily check-in. Individual moments stay separate.', ends: ['Lower mood', 'Higher mood'], colors: ['#79513A', '#B69674', '#D8D2B9', '#929F79', '#304B35'], ink: ['#FFFFFF', '#25190F', '#243426', '#163321', '#FFFFFF'] },
  stress: { label: 'Stress', title: 'Recorded stress', description: 'The highest stress score recorded each day, across daily check-ins and journal moments.', ends: ['Less stress', 'More stress'], colors: ['#E1DBC4', '#D0BC99', '#BB976E', '#A2734D', '#71432F'], ink: ['#243426', '#32241B', '#322017', '#16110C', '#FFFFFF'] },
  energy: { label: 'Energy', title: 'Daily energy', field: 'energy_level', description: 'The energy score from your daily check-in.', ends: ['Lower energy', 'Higher energy'], colors: ['#E1DBC4', '#CCD1AE', '#A7B18B', '#7C9168', '#304B35'], ink: ['#243426', '#243426', '#183522', '#0D2214', '#FFFFFF'] },
  sleep: { label: 'Sleep', title: 'Sleep quality', field: 'sleep_quality', description: 'The sleep quality score from your daily check-in.', ends: ['Lower quality', 'Higher quality'], colors: ['#E1DBC4', '#CCD1AE', '#A7B18B', '#7C9168', '#304B35'], ink: ['#243426', '#243426', '#183522', '#0D2214', '#FFFFFF'] },
};

function score(value) {
  if (value == null || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
}

export function scoreBand(value) {
  return value == null ? null : Math.max(0, Math.min(4, Math.ceil(value / 2) - 1));
}

/** One point per date. Moment mood must never stand in for daily mood. */
export function calendarDays(entries, start, end, metric = 'mood') {
  if (!validDateKey(start) || !validDateKey(end) || start > end) return [];
  const spec = CALENDAR_METRICS[metric] || CALENDAR_METRICS.mood;
  const grouped = new Map();
  for (const entry of entries) {
    if (entry.is_draft || !validDateKey(entry.date) || entry.date < start || entry.date > end) continue;
    if (!grouped.has(entry.date)) grouped.set(entry.date, []);
    grouped.get(entry.date).push(entry);
  }
  const days = [];
  for (let date = start; date <= end; date = addDaysKey(date, 1)) {
    const rows = grouped.get(date) || [];
    const daily = rows.filter((entry) => entry.kind === 'day').sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')))[0];
    const stresses = rows.map((entry) => score(entry.stress_context?.stress_score)).filter((value) => value != null);
    const value = metric === 'stress' ? (stresses.length ? Math.max(...stresses) : null) : score(daily?.[spec.field]);
    days.push({ date, value, rows, unsafe: rows.filter((entry) => entry.interaction_feeling === 'unsafe').length, weekday: parseLocalDate(date).getDay() });
  }
  return days;
}

export function calendarMonths(start, end, weekStartsOn = 1) {
  if (!validDateKey(start) || !validDateKey(end) || start > end) return [];
  const months = [];
  for (let cursor = startOfMonth(parseLocalDate(start)); dateKey(cursor) <= end; cursor = addMonths(cursor, 1)) {
    const first = dateKey(cursor);
    const last = dateKey(endOfMonth(cursor));
    const dates = [];
    for (let day = first; day <= last; day = addDaysKey(day, 1)) dates.push(day);
    months.push({ key: first.slice(0, 7), first, last, dates, offset: (cursor.getDay() - weekStartsOn + 7) % 7 });
  }
  return months;
}

export function calendarSummary(days, metric = 'mood') {
  const recorded = days.filter((day) => day.value != null);
  const distribution = Array.from({ length: 5 }, (_, band) => recorded.filter((day) => scoreBand(day.value) === band).length);
  const weekdays = Array.from({ length: 7 }, (_, weekday) => {
    const rows = recorded.filter((day) => day.weekday === weekday);
    return { weekday, count: rows.length, mean: rows.length >= 3 ? rows.reduce((sum, day) => sum + day.value, 0) / rows.length : null };
  });
  /** @type {{start: string, end: string, count: number} | null} */
  let run = null;
  /** @type {{start: string, end: string, count: number} | null} */
  let longest = null;
  for (const day of days) {
    const matches = day.value != null && (metric === 'stress' ? day.value >= 7 : day.value <= 4);
    if (!matches) { run = null; continue; }
    run = run && addDaysKey(run.end, 1) === day.date ? { ...run, end: day.date, count: run.count + 1 } : { start: day.date, end: day.date, count: 1 };
    if (!longest || run.count > longest.count) longest = { ...run };
  }
  return { recorded: recorded.length, missing: days.length - recorded.length, distribution, weekdays, longest: longest?.count >= 2 ? longest : null };
}
