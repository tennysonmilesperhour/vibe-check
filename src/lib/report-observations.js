// What stood out in a weekly or monthly report: up to three plain
// observations, each pointing to where its evidence is. Nothing here
// interprets; it counts what was recorded.
import { practiceById, ALIGNMENTS } from './practices.js';
import { INTERACTION_FEELINGS, describeInteractionMix } from './people.js';
import { describePattern } from './living-patterns.js';
import { todayKey } from './dates.js';

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {any} report from buildReport (it carries the period's start and end)
 * @param {{ type?: 'weekly' | 'monthly', themeLabels?: Record<string, string | false>, today?: string }} [options]
 *   themeLabels: the names people gave themes, or false for themes they hid.
 * @returns {{ id: string, text: string, to?: string, href?: string, label: string }[]}
 */
export function reportObservations(report, { type = 'weekly', themeLabels = {}, today = todayKey() } = {}) {
  const span = type === 'monthly' ? 'month' : 'week';
  // Every entry in the period, in the journal (the report lists only those with words).
  const journal = `/Analytics?${new URLSearchParams({ tab: 'journal', range: 'custom', start: report.start, end: report.end < today ? report.end : today })}`;
  const found = [];
  if (report.days > 0) {
    found.push({ id: 'days', text: `You recorded ${plural(report.rows.length, 'entry', 'entries')} on ${report.days} of the ${plural(report.calendarDays, 'day')} this ${span}${report.partial ? ' so far' : ''}.`, to: journal, label: 'Read them' });
  }

  const interactions = report.interactions || [];
  const unsafe = interactions.filter((entry) => entry.interaction_feeling === 'unsafe').length;
  if (interactions.length) {
    const mix = Object.fromEntries(INTERACTION_FEELINGS.map((feeling) => [feeling, interactions.filter((entry) => entry.interaction_feeling === feeling).length]));
    const text = `You recorded ${plural(interactions.length, 'interaction')}: ${describeInteractionMix(mix)}.`;
    found.push(unsafe
      ? { id: 'interactions', text: `${text} What you wrote about ${unsafe === 1 ? 'the unsafe one' : 'the unsafe ones'} stays exactly as you wrote it.`, to: '/support-now?focus=relationship', label: 'Support for relationships' }
      : { id: 'interactions', text, to: journal, label: 'Read them' });
  }

  // A theme someone hid stays out; a renamed one goes by their name for it.
  const feeling = (report.emotions || []).find((theme) => theme.sources.length > 1 && themeLabels[`feeling:${theme.label}`] !== false);
  if (feeling) found.push({ id: 'feeling', text: `“${themeLabels[`feeling:${feeling.label}`] || feeling.label}” came up in ${plural(feeling.sources.length, 'entry', 'entries')}.`, href: '#themes-heading', label: 'See where' });

  const pattern = (report.patterns || [])[0];
  if (pattern) found.push({ id: 'pattern', text: describePattern(pattern), href: '#stress-patterns-heading', label: 'See the pattern' });

  const helped = (report.practices || []).find((practice) => practice.helpful.length > 0);
  if (helped) found.push({ id: 'practice', text: `After ${practiceById(helped.id)?.title || 'a practice'}, you felt clearer, more connected, more able to begin, or more settled ${plural(helped.helpful.length, 'time')}.`, href: '#practice-review-heading', label: 'See your responses' });

  const alignments = report.alignments || [];
  if (alignments.length) {
    const counts = ALIGNMENTS.map((item) => [item.label, alignments.filter((entry) => entry.stress_context?.alignment === item.id).length]).filter(([, count]) => count);
    found.push({ id: 'alignment', text: `How your responses felt, in ${plural(alignments.length, 'entry', 'entries')}: ${counts.map(([label, count]) => `${count} “${label}”`).join(', ')}.`, href: '#practice-review-heading', label: 'See them' });
  }

  // Interactions come right after the days, so an unsafe one, and its support
  // link, is always among the three.
  return found.slice(0, 3);
}
