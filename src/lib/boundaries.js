// Boundary detection: pure evaluation + dedupe. Runs automatically after
// every check-in save (the old design required pressing a button on a
// different page). Alerts are gentle observations, not alarms.
import { diffDaysKeys } from './dates.js';

/**
 * Evaluate boundary conditions over check-ins (any order; latest matters).
 * settings: { mood_threshold, consecutive_days }
 * Returns candidate alerts [{alert_type, date, severity, message}].
 */
export function evaluateBoundaries(checkIns, settings) {
  const sorted = [...checkIns].sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  if (sorted.length === 0) return [];

  const alerts = [];
  const latest = sorted[0];
  const threshold = settings.mood_threshold ?? 4;
  const runLength = settings.consecutive_days ?? 3;

  if ((latest.mood_score ?? 10) <= threshold) {
    alerts.push({
      alert_type: 'low_mood',
      date: latest.date,
      severity: 'high',
      message: `Mood landed at ${latest.mood_score} today. That is at or below the line you set for yourself.`,
    });
  }

  // Declining run: strictly decreasing mood across day-adjacent entries.
  let declines = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const newer = sorted[i];
    const older = sorted[i + 1];
    const adjacent = diffDaysKeys(newer.date, older.date) === 1;
    if (adjacent && (newer.mood_score ?? 0) < (older.mood_score ?? 0)) {
      declines += 1;
      if (declines >= runLength - 1) break;
    } else {
      break;
    }
  }
  if (declines >= runLength - 1) {
    alerts.push({
      alert_type: 'declining',
      date: latest.date,
      severity: 'medium',
      message: `Mood has slipped ${runLength} days in a row. Worth a gentle look at what changed.`,
    });
  }

  return alerts;
}

/** Drop candidates that already exist for the same alert_type + date. */
export function dedupeAlerts(candidates, existing) {
  const seen = new Set(existing.map((a) => `${a.alert_type}|${a.date}`));
  return candidates.filter((a) => !seen.has(`${a.alert_type}|${a.date}`));
}
