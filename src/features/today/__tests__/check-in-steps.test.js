import { describe, it, expect } from 'vitest';
import { chooseSteps, ALL_STEPS, stressAnswered } from '../check-in-steps';

describe('check-in steps follow what the person chose to notice', () => {
  it('asks everything when nothing was chosen', () => {
    expect(chooseSteps([], {})).toEqual(ALL_STEPS);
  });

  it('keeps the core questions and adds the chosen areas', () => {
    expect(chooseSteps(['Relationships'], {})).toEqual(['mood', 'emotions', 'activities', 'high', 'low', 'reflection']);
    expect(chooseSteps(['Energy & sleep', 'Stress & body cues'], {})).toEqual(['mood', 'energy', 'sleep', 'emotions', 'stress', 'high', 'low', 'reflection']);
  });

  it('never hides a question that already has an answer', () => {
    const form = { energy_level: 4, person_ids: ['p'], stress_context: { stress_score: 0 } };
    expect(chooseSteps(['Mood'], form)).toEqual(['mood', 'energy', 'emotions', 'activities', 'stress', 'high', 'low', 'reflection']);
    expect(chooseSteps(['Mood'], { stress_context: { state_ids: [] } })).not.toContain('stress');
  });

  it('does not take bookkeeping for a stress answer', () => {
    const saved = { stress_context: { visited_steps: ['mood', 'emotions', 'activities'], stress_measure: 'highest-today' } };
    expect(stressAnswered(saved.stress_context)).toBe(false);
    expect(chooseSteps(['Relationships'], saved)).not.toContain('stress');
    expect(stressAnswered({ visited_steps: ['stress'], stress_score: 0 })).toBe(true);
  });
});
