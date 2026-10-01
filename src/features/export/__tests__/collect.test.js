import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  const state = { store: {}, calls: [], failing: null, cap: 200, afterFirstPage: null };
  const entity = (key) => ({
    async pageAfter(after, limit, { withTotal = false, signal } = {}) {
      state.calls.push({ key, after, limit, withTotal });
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (signal?.aborted) throw new DOMException('The read was stopped.', 'AbortError');
      if (state.failing === key) throw new Error('network down');
      const sorted = [...(state.store[key] || [])].sort((a, b) => a.id.localeCompare(b.id));
      const rows = sorted.filter((row) => after === null || row.id > after).slice(0, Math.min(limit, state.cap));
      const total = withTotal ? sorted.length : null;
      // Something else changes the table once the first page is read.
      if (after === null && state.afterFirstPage) state.afterFirstPage(key);
      return { rows, total };
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
  base44: { auth: { me: async () => ({ id: 'u1', email: 'me@example.com', full_name: 'Me', cosmic_profile: { birth_date: '1990-07-15' }, boundary_settings: null, people_migrated_at: null, created_date: '2026-07-03T10:00:00Z', updated_date: '2026-09-01T10:00:00Z' }) } },
}));

const { collectCompleteExport, EXPORT_SOURCES } = await import('../collect.js');
const { EXPORT_TABLES } = await import('@/lib/export-file');

// Ids sort the other way from creation time, so the file's order is the export's own.
const rows = (n, prefix) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${String(i).padStart(5, '0')}`, user_id: 'u1', created_at: `2026-09-01T00:00:${String(59 - (i % 60)).padStart(2, '0')}Z`, created_date: 'x' }));
const ids = (list) => list.map((row) => row.id).sort();
const callsFor = (key) => h.state.calls.filter((call) => call.key === key);

beforeEach(() => {
  h.state.store = { daily_check_ins: rows(1201, 'c'), people: rows(3, 'p'), cosmic_wisdom: rows(1, 'w') };
  h.state.calls = [];
  h.state.failing = null;
  h.state.cap = 200;
  h.state.afterFirstPage = null;
});

describe('collecting the complete export', () => {
  it('reads every exported table', () => {
    expect(EXPORT_SOURCES.map(([key]) => key)).toEqual(EXPORT_TABLES.map(([key]) => key));
  });

  it('reads past pages the server caps, until one comes back empty', async () => {
    const file = await collectCompleteExport();
    expect(file.counts).toMatchObject({ daily_check_ins: 1201, people: 3, cosmic_wisdom: 1, readings: 0 });
    expect(ids(file.tables.daily_check_ins)).toEqual(ids(h.state.store.daily_check_ins));
    expect(callsFor('daily_check_ins').map((call) => call.after)).toEqual([null, 'c00199', 'c00399', 'c00599', 'c00799', 'c00999', 'c01199', 'c01200']);
    expect(file.tables.daily_check_ins[0]).not.toHaveProperty('user_id');
    expect(file.profile).toEqual({ email: 'me@example.com', full_name: 'Me', cosmic_profile: { birth_date: '1990-07-15' }, boundary_settings: null, people_migrated_at: null, created_at: '2026-07-03T10:00:00Z', updated_at: '2026-09-01T10:00:00Z' });
  });

  it('reads a table that fits on one page in one request, and lists rows oldest first', async () => {
    const file = await collectCompleteExport();
    expect(callsFor('people')).toHaveLength(1);
    expect(callsFor('readings')).toHaveLength(1);
    expect(file.tables.people.map((row) => row.id)).toEqual(['p00002', 'p00001', 'p00000']);
  });

  it('loses no row that still exists when one is deleted or added mid-read', async () => {
    h.state.afterFirstPage = (key) => {
      if (key !== 'daily_check_ins') return;
      const table = h.state.store.daily_check_ins;
      table.splice(table.findIndex((row) => row.id === 'c00005'), 1);
      table.push({ id: 'c99999', user_id: 'u1', created_at: '2026-09-02T00:00:00Z' });
    };
    const file = await collectCompleteExport();
    const read = new Set(file.tables.daily_check_ins.map((row) => row.id));
    expect(h.state.store.daily_check_ins.every((row) => read.has(row.id))).toBe(true);
    expect(read.has('c01200')).toBe(true);
  });

  it('refuses a file that mixes accounts, as after another sign-in mid-read', async () => {
    h.state.afterFirstPage = (key) => {
      if (key !== 'daily_check_ins') return;
      for (const row of h.state.store.daily_check_ins.slice(600)) row.user_id = 'u2';
    };
    await expect(collectCompleteExport()).rejects.toThrow('The signed-in account changed while your record was being gathered.');
  });

  it('fails as a whole when one table fails, and stops the other reads', async () => {
    h.state.failing = 'people';
    await expect(collectCompleteExport()).rejects.toThrow('network down');
    const callsAtFailure = h.state.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(h.state.calls.length).toBe(callsAtFailure);
    expect(callsFor('daily_check_ins').length).toBeLessThan(8);
  });

  it('stops when the caller gives up, before or during the reads', async () => {
    const controller = new AbortController();
    const pending = collectCompleteExport({ signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow('The read was stopped.');
    h.state.calls = [];
    await expect(collectCompleteExport({ signal: AbortSignal.abort() })).rejects.toThrow('The export was stopped.');
    expect(h.state.calls).toHaveLength(0);
  });
});
