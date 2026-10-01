import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  const state = { store: {}, calls: [], failing: null, cap: 200 };
  const entity = (key) => ({
    async list(sort, limit, offset, { signal } = {}) {
      state.calls.push({ key, sort, limit, offset });
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (signal?.aborted) throw new DOMException('The read was stopped.', 'AbortError');
      if (state.failing === key) throw new Error('network down');
      // Like a server whose row cap is below the page size asked for.
      return (state.store[key] || []).slice(offset, offset + Math.min(limit, state.cap));
    },
  });
  return { state, entity };
});

vi.mock('@/api/entities', () => ({
  DailyCheckIn: h.entity('daily_check_ins'), JournalEntry: h.entity('vibe_journal_entries'), CheckInDraft: h.entity('vibe_checkin_drafts'),
  Person: h.entity('people'), PracticeSession: h.entity('vibe_practice_sessions'), ReportReflection: h.entity('vibe_report_reflections'),
  Reading: h.entity('readings'), BoundaryAlert: h.entity('boundary_alerts'), HealingProgress: h.entity('healing_progress'),
  VibePreference: h.entity('vibe_preferences'), CosmicWisdom: h.entity('cosmic_wisdom'),
}));
vi.mock('@/api/base44Client', () => ({
  base44: { auth: { me: async () => ({ id: 'u1', email: 'me@example.com', full_name: 'Me', cosmic_profile: { birth_date: '1990-07-15' }, boundary_settings: null, people_migrated_at: null, role: 'authenticated' }) } },
}));

const { collectCompleteExport, EXPORT_SOURCES } = await import('../collect.js');
const { EXPORT_TABLES } = await import('@/lib/export-file');

const rows = (n, prefix) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, user_id: 'u1', date: '2026-09-01', created_date: 'x' }));

beforeEach(() => {
  h.state.store = { daily_check_ins: rows(1201, 'c'), people: rows(3, 'p'), cosmic_wisdom: rows(1, 'w') };
  h.state.calls = [];
  h.state.failing = null;
  h.state.cap = 200;
});

describe('collecting the complete export', () => {
  it('reads every exported table', () => {
    expect(EXPORT_SOURCES.map(([key]) => key)).toEqual(EXPORT_TABLES.map(([key]) => key));
  });

  it('keeps reading past short pages, oldest first, until a page comes back empty', async () => {
    const file = await collectCompleteExport();
    expect(file.counts).toMatchObject({ daily_check_ins: 1201, people: 3, cosmic_wisdom: 1, readings: 0 });
    const checkIns = h.state.calls.filter((call) => call.key === 'daily_check_ins');
    expect(checkIns.map((call) => call.offset)).toEqual([0, 200, 400, 600, 800, 1000, 1200, 1201]);
    expect(new Set(h.state.calls.map((call) => call.sort))).toEqual(new Set(['created_date']));
    expect(file.tables.daily_check_ins[0]).toEqual({ id: 'c0', date: '2026-09-01' });
    expect(file.profile).toEqual({ email: 'me@example.com', full_name: 'Me', cosmic_profile: { birth_date: '1990-07-15' }, boundary_settings: null, people_migrated_at: null });
  });

  it('keeps a row seen on two pages once', async () => {
    // A row saved mid-read can push the last row of one page onto the next.
    h.state.store.people = [...rows(200, 'p'), { id: 'p199' }, ...rows(2, 'q')];
    const file = await collectCompleteExport();
    expect(file.tables.people.map((row) => row.id)).toEqual([...rows(200, 'p'), ...rows(2, 'q')].map((row) => row.id));
  });

  it('fails as a whole when one table fails, and stops the other reads', async () => {
    h.state.failing = 'people';
    await expect(collectCompleteExport()).rejects.toThrow('network down');
    const callsAtFailure = h.state.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(h.state.calls.length).toBe(callsAtFailure);
    expect(h.state.calls.filter((call) => call.key === 'daily_check_ins').length).toBeLessThan(8);
  });

  it('stops when the caller gives up', async () => {
    const controller = new AbortController();
    const pending = collectCompleteExport({ signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow('The read was stopped.');
  });
});
