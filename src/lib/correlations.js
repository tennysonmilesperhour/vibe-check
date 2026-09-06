// Precomputed correlation insights: plain-language cards computed locally,
// replacing the button-triggered LLM round trip for basic pattern facts.
import { addDaysKey } from './dates.js';
import { personCheckInStats } from './people.js';

const MIN_SAMPLES = 7;
const MIN_R = 0.3;

/** Pearson correlation; null when undefined (mismatch, tiny n, zero variance). */
export function pearson(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * insightCards(checkIns, people) -> [{kind, text, strength}]
 * Only speaks when the data actually supports it (n >= 7, |r| >= 0.3
 * for correlations; >= 1.5 point deltas for averages).
 */
export function insightCards(checkIns, people = []) {
  const cards = [];
  if (!checkIns || checkIns.length < MIN_SAMPLES) return cards;

  const byDate = Object.fromEntries(checkIns.map((c) => [c.date, c]));

  // ── sleep tonight -> mood tomorrow (lag-1) ──
  const sleepX = [];
  const moodY = [];
  for (const entry of checkIns) {
    const next = byDate[addDaysKey(entry.date, 1)];
    if (next && entry.sleep_quality != null && next.mood_score != null) {
      sleepX.push(entry.sleep_quality);
      moodY.push(next.mood_score);
    }
  }
  const rSleep = sleepX.length >= MIN_SAMPLES ? pearson(sleepX, moodY) : null;
  if (rSleep !== null && Math.abs(rSleep) >= MIN_R) {
    cards.push({
      kind: 'sleep_lag',
      strength: Math.abs(rSleep),
      text: rSleep > 0
        ? `Your sleep writes tomorrow's weather: better nights are followed by brighter days (r ${round1(rSleep)}).`
        : `Oddly, your rougher nights precede brighter days here (r ${round1(rSleep)}). Worth watching.`,
    });
  }

  // ── moon phase mood deltas ──
  const withMoon = checkIns.filter((c) => c.moon_phase && c.mood_score != null);
  if (withMoon.length >= MIN_SAMPLES * 2) {
    const overall = withMoon.reduce((a, c) => a + c.mood_score, 0) / withMoon.length;
    const phases = {};
    for (const c of withMoon) {
      (phases[c.moon_phase] ||= []).push(c.mood_score);
    }
    for (const [phase, moods] of Object.entries(phases)) {
      if (moods.length < 4) continue;
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      if (Math.abs(avg - overall) >= 1.2) {
        cards.push({
          kind: 'moon',
          strength: Math.abs(avg - overall) / 3,
          text: avg > overall
            ? `${phase} days run ${round1(avg - overall)} points above your usual mood.`
            : `${phase} days sit ${round1(overall - avg)} points below your usual mood. Plan softly there.`,
        });
      }
    }
  }

  // ── activity lift ──
  const withMood = checkIns.filter((c) => c.mood_score != null);
  const activityDays = {};
  for (const c of withMood) {
    for (const activity of c.activities || []) {
      (activityDays[activity] ||= []).push(c.mood_score);
    }
  }
  const baseline = withMood.reduce((a, c) => a + c.mood_score, 0) / Math.max(withMood.length, 1);
  for (const [activity, moods] of Object.entries(activityDays)) {
    if (moods.length < 5) continue;
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    if (avg - baseline >= 1.5) {
      cards.push({
        kind: 'activity',
        strength: (avg - baseline) / 3,
        text: `Days with ${activity} average ${round1(avg)}, against your usual ${round1(baseline)}. Your body already voted.`,
      });
    }
  }

  // ── people deltas (uses person_ids or whole-word fallback) ──
  for (const person of people) {
    const stats = personCheckInStats(person, withMood);
    if (stats.mentions >= 5 && stats.avgMood != null) {
      const delta = stats.avgMood - baseline;
      if (Math.abs(delta) >= 1.5) {
        cards.push({
          kind: 'person',
          strength: Math.abs(delta) / 3,
          text: delta > 0
            ? `Days that include ${person.name} land ${round1(delta)} points above your usual.`
            : `Days that include ${person.name} land ${round1(-delta)} points below your usual. That is information, not a verdict.`,
        });
      }
    }
  }

  return cards.sort((a, b) => b.strength - a.strength).slice(0, 6);
}
