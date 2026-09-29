import { format } from 'date-fns';
import { parseLocalDate } from './dates.js';

// A count of days kept this month, never a run: a missed day takes nothing
// away, and there is nothing to lose by resting. Date keys only.

/** Days this month, through today, with a check-in. */
export function daysKeptThisMonth(checkIns, today) {
  const month = today.slice(0, 7);
  return new Set(checkIns.map((entry) => entry.date).filter((date) => typeof date === 'string' && date.startsWith(month) && date <= today)).size;
}

/** "3 days kept in September", or '' when there are none yet. */
export function daysKeptLabel(count, today) {
  if (count <= 0) return '';
  return `${count} ${count === 1 ? 'day' : 'days'} kept in ${format(parseLocalDate(today), 'MMMM')}`;
}
