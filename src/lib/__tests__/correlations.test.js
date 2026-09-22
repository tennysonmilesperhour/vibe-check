import { describe, it, expect } from 'vitest';
import { pearson, insightCards } from '../correlations.js';

describe('pearson', () => {
  it('perfect positive correlation', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
  });
  it('perfect negative correlation', () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
  });
  it('zero variance yields null (not NaN)', () => {
    expect(pearson([1, 1, 1], [2, 3, 4])).toBeNull();
  });
  it('mismatched lengths yield null', () => {
    expect(pearson([1, 2], [1, 2, 3])).toBeNull();
  });
});

const mk = (date, mood, sleep, activities = [], moonPhase) => ({
  date, mood_score: mood, sleep_quality: sleep, activities, moon_phase: moonPhase,
});

describe('insightCards', () => {
  it('finds the sleep -> next-day mood link when strong', () => {
    // sleep on day N correlates with mood on day N+1
    const checkIns = [];
    const sleeps = [3, 8, 4, 9, 2, 9, 3, 8, 4, 9];
    for (let i = 0; i < sleeps.length; i++) {
      const day = String(i + 1).padStart(2, '0');
      const nextMood = i > 0 ? (sleeps[i - 1] >= 7 ? 8 : 3) : 5;
      checkIns.push(mk(`2026-06-${day}`, nextMood, sleeps[i]));
    }
    const cards = insightCards(checkIns, []);
    const sleepCard = cards.find((c) => c.kind === 'sleep_lag');
    expect(sleepCard).toBeTruthy();
    expect(sleepCard.text).toMatch(/sleep/i);
  });

  it('finds activity lift with enough samples', () => {
    const checkIns = [];
    for (let i = 1; i <= 14; i++) {
      const day = String(i).padStart(2, '0');
      const hasNature = i % 2 === 0;
      checkIns.push(mk(`2026-06-${day}`, hasNature ? 9 : 4, 6, hasNature ? ['Nature'] : []));
    }
    const cards = insightCards(checkIns, []);
    const lift = cards.find((c) => c.kind === 'activity' && c.text.includes('Nature'));
    expect(lift).toBeTruthy();
  });

  it('stays silent with too little data', () => {
    expect(insightCards([mk('2026-06-01', 5, 5)], [])).toEqual([]);
  });

  it('uses high-moment picker tags when matching a person to check-ins', () => {
    const people = [{ id: 'p1', name: 'Alex', legacy_names: [] }];
    const checkIns = [];
    for (let i = 1; i <= 10; i++) {
      const day = String(i).padStart(2, '0');
      const withAlex = i <= 6;
      checkIns.push({
        date: `2026-06-${day}`,
        mood_score: withAlex ? 9 : 4,
        sleep_quality: 6,
        activities: [],
        high_moment: withAlex ? { person_ids: ['p1'] } : null,
      });
    }
    const card = insightCards(checkIns, people).find((row) => row.kind === 'person');
    expect(card).toBeTruthy();
    expect(card.text).toMatch(/Alex/);
  });


  it('never emits buzzwords or em dashes', () => {
    const checkIns = [];
    for (let i = 1; i <= 20; i++) {
      const day = String(i).padStart(2, '0');
      checkIns.push(mk(`2026-06-${day}`, (i % 10) + 1, ((i + 3) % 10) + 1, i % 3 === 0 ? ['Exercise'] : [], i % 2 ? 'Full Moon' : 'New Moon'));
    }
    for (const card of insightCards(checkIns, [])) {
      expect(card.text).not.toMatch(/—|seamless|empower|supercharge|leverage|unleash/i);
    }
  });
});
