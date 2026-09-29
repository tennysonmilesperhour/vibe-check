// Gentle low-mood notices: pure evaluation + dedupe. Opt-in; they run after a
// check-in is kept only when the person turned them on and chose their line.
// Messages state the dates and scores plainly and never diagnose.
import { format } from 'date-fns';
import { diffDaysKeys, parseLocalDate } from './dates.js';

export const NOTICE_DEFAULTS = { notices_enabled: false, mood_threshold: 4, consecutive_days: 3 };

const dayLabel = (key) => format(parseLocalDate(key), 'EEEE, MMMM d');

/**
 * Evaluate notices over check-ins (any order; latest matters).
 * settings: { notices_enabled, mood_threshold, consecutive_days }
 * Returns candidate alerts [{alert_type, date, severity, message}].
 */
export function evaluateBoundaries(checkIns, settings = {}) {
  if (!settings.notices_enabled) return [];
  const sorted = [...checkIns].filter((entry) => entry.mood_score != null).sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  if (sorted.length === 0) return [];

  const alerts = [];
  const latest = sorted[0];
  const threshold = settings.mood_threshold ?? NOTICE_DEFAULTS.mood_threshold;
  const runLength = settings.consecutive_days ?? NOTICE_DEFAULTS.consecutive_days;

  if (latest.mood_score <= threshold) {
    alerts.push({
      alert_type: 'low_mood',
      date: latest.date,
      severity: 'high',
      message: `On ${dayLabel(latest.date)} your mood was ${latest.mood_score}, at or below the line of ${threshold} you chose.`,
    });
  }

  // Declining run: mood lower at each of `runLength` day-adjacent check-ins.
  const run = [latest];
  for (let i = 0; i < sorted.length - 1 && run.length < runLength; i++) {
    const newer = sorted[i];
    const older = sorted[i + 1];
    if (diffDaysKeys(newer.date, older.date) !== 1 || !(newer.mood_score < older.mood_score)) break;
    run.push(older);
  }
  if (run.length >= runLength) {
    const scores = run.map((entry) => entry.mood_score).reverse().join(' to ');
    alerts.push({
      alert_type: 'declining',
      date: latest.date,
      severity: 'medium',
      message: `Your last ${runLength} check-ins went from ${scores}, ending ${dayLabel(latest.date)}.`,
    });
  }

  return alerts;
}

/** Drop candidates that already exist for the same alert_type + date. */
export function dedupeAlerts(candidates, existing) {
  const seen = new Set(existing.map((a) => `${a.alert_type}|${a.date}`));
  return candidates.filter((a) => !seen.has(`${a.alert_type}|${a.date}`));
}
