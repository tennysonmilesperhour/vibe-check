export const ALL_STEPS = ['mood', 'energy', 'sleep', 'emotions', 'activities', 'stress', 'high', 'low', 'reflection'];

const filled = (value) => (Array.isArray(value) ? value.length > 0 : value != null && value !== '');

// Bookkeeping kept beside the stress answers, never an answer itself.
const STRESS_META = new Set(['asked_steps', 'visited_steps', 'stress_measure']);
/** Whether any stress question holds an answer. */
export const stressAnswered = (context = {}) => Object.entries(context || {}).some(([key, value]) => !STRESS_META.has(key) && filled(value));

/**
 * The check-in asks about what the person chose to notice at the start (no
 * choice means every question). A question that already holds an answer for
 * this day always stays, so nothing recorded is hidden.
 * @param {string[]} tracking @param {any} form
 */
export function chooseSteps(tracking = [], form = {}) {
  if (!tracking.length) return ALL_STEPS;
  const wants = (...items) => items.some((item) => tracking.includes(item));
  const has = {
    energy: filled(form.energy_level),
    sleep: filled(form.sleep_quality),
    activities: filled(form.activities) || filled(form.person_ids),
    stress: stressAnswered(form.stress_context),
  };
  return ALL_STEPS.filter((id) => {
    if (id === 'energy' || id === 'sleep') return wants('Energy & sleep') || has[id];
    if (id === 'activities') return wants('Habits', 'Relationships') || has.activities;
    if (id === 'stress') return wants('Stress & body cues', 'My choices & boundaries') || has.stress;
    return true;
  });
}
