// The letter that opens a weekly or monthly report: up to three things the
// plants noticed in the period, each in plain numbers and each pointing to
// where its evidence is. Nothing here interprets; it counts what was recorded.
import { practiceById, stateById } from './practices.js';
import { INTERACTION_FEELINGS } from './people.js';

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {any} report from buildReport
 * @param {{ type?: 'weekly' | 'monthly' }} [options]
 * @returns {{ id: string, text: string, href: string, label: string }[]}
 */
export function letterObservations(report, { type = 'weekly' } = {}) {
  const span = type === 'monthly' ? 'month' : 'week';
  const found = [];
  if (report.days > 0) {
    found.push({ id: 'days', text: `You kept ${report.days} of ${plural(report.calendarDays, 'day')} this ${span}${report.partial ? ' so far' : ''}, in ${plural(report.rows.length, 'entry', 'entries')}.`, href: '#report-words-heading', label: 'Read the moments' });
  }

  const interactions = report.interactions || [];
  const unsafe = interactions.filter((entry) => entry.interaction_feeling === 'unsafe').length;
  if (interactions.length) {
    const counts = INTERACTION_FEELINGS.map((feeling) => [feeling, interactions.filter((entry) => entry.interaction_feeling === feeling).length]).filter(([, count]) => count);
    const described = counts.map(([feeling, count]) => `${count} ${feeling}`).join(', ');
    found.push(unsafe
      ? { id: 'interactions', text: `You recorded ${plural(interactions.length, 'interaction')}: ${described}. What you wrote about ${unsafe === 1 ? 'the unsafe one' : 'the unsafe ones'} stays exactly as you wrote it.`, href: '/support-now?focus=relationship', label: 'Support for relationships' }
      : { id: 'interactions', text: `You recorded ${plural(interactions.length, 'interaction')}: ${described}.`, href: '#report-words-heading', label: 'Read them' });
  }

  const feeling = (report.emotions || []).find((theme) => theme.sources.length > 1);
  if (feeling) found.push({ id: 'feeling', text: `“${feeling.label}” came up in ${plural(feeling.sources.length, 'entry', 'entries')}.`, href: '#themes-heading', label: 'See where' });

  // Worded as the pattern cards word it: a connection compares check-ins with
  // and without a person or habit; a state card counts the days it was chosen.
  const pattern = (report.patterns || [])[0];
  if (pattern) {
    const state = stateById(pattern.state)?.label || 'A state you chose';
    const connection = pattern.context && pattern.context.type !== 'state';
    const others = pattern.context?.type === 'person' ? 'other people' : 'other habits';
    found.push({
      id: 'pattern',
      text: connection
        ? `${state} on ${pattern.days} of the ${pattern.total} compared check-ins with ${pattern.context.label}${pattern.without?.total ? `, and on ${pattern.without.days} of the ${pattern.without.total} with ${others} but not ${pattern.context.label}` : ''}.`
        : `You chose ${state} on ${pattern.days} of the ${plural(pattern.total, 'day')} recorded.`,
      href: '#stress-patterns-heading',
      label: 'See the pattern',
    });
  }

  const helped = (report.practices || []).find((practice) => practice.helpful.length > 0);
  if (helped) found.push({ id: 'practice', text: `After ${practiceById(helped.id)?.title || 'a practice'}, you felt clearer, more connected, more able to begin, or more settled ${plural(helped.helpful.length, 'time')}.`, href: '#practice-review-heading', label: 'See your responses' });

  const alignments = report.alignments || [];
  if (alignments.length) {
    const aligned = alignments.filter((entry) => entry.stress_context?.alignment === 'aligned').length;
    found.push({ id: 'alignment', text: `In ${aligned} of the ${plural(alignments.length, 'response')} you described, it felt like you.`, href: '#practice-review-heading', label: 'See them' });
  }

  // Interactions come right after the days, so an unsafe one, and its support
  // link, is always among the three.
  return found.slice(0, 3);
}
