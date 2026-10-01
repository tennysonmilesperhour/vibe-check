import { describe, it, expect } from 'vitest';
import { buildCompleteExport, openExportFile, summarizeExport, exportCounts, EXPORT_TABLES } from '../export-file.js';
import { encryptJson } from '../crypto.js';

const tables = {
  daily_check_ins: [
    { id: 'c1', user_id: 'u1', date: '2026-09-01', mood_score: 6, notes: 'Slept well.', gratitude: 'Tea', created_at: '2026-09-01T20:00:00Z', created_date: '2026-09-01T20:00:00Z' },
    { id: 'c2', user_id: 'u1', date: '2026-09-03', mood_score: 4, notes: '', high_moment: { description: 'A walk', person_ids: ['p1'] } },
  ],
  vibe_journal_entries: [
    { id: 'j1', user_id: 'u1', date: '2026-09-02', kind: 'interaction', notes: 'Talked with Sam.', mood_score: 5, is_draft: false },
    { id: 'j2', user_id: 'u1', date: '2026-09-04', kind: 'reflection', notes: 'Unfinished', is_draft: true },
    { id: 'j3', user_id: 'u1', date: '2026-08-30', kind: 'reflection', notes: 'Evening pages.' },
  ],
  people: [{ id: 'p1', user_id: 'u1', name: 'Sam' }],
  vibe_preferences: [{ id: 'v1', user_id: 'u1', values: { safety_plan: { people: 'Ana' } } }],
};
const profile = { email: 'me@example.com', full_name: 'Me', cosmic_profile: null, boundary_settings: null };
const rowsSummary = (summary) => summary.entries.map((e) => [e.date, e.kind, e.key, Boolean(e.is_draft)]);

describe('the complete export', () => {
  const document = buildCompleteExport({ profile, tables, exportedAt: '2026-10-01T12:00:00Z' });

  it('holds every table as stored, without internal owner ids', () => {
    expect(Object.keys(document.tables)).toEqual(EXPORT_TABLES.map(([key]) => key));
    expect(document.tables.daily_check_ins[0]).toEqual({ id: 'c1', date: '2026-09-01', mood_score: 6, notes: 'Slept well.', gratitude: 'Tea', created_at: '2026-09-01T20:00:00Z' });
    expect(JSON.stringify(document)).not.toContain('"user_id"');
    expect(document.tables.readings).toEqual([]);
    expect(document.tables.cosmic_wisdom).toEqual([]);
    expect(document.counts).toMatchObject({ daily_check_ins: 2, vibe_journal_entries: 3, people: 1, readings: 0 });
    expect(document.profile).toEqual(profile);
    expect(document).toMatchObject({ app: 'Vibe Check', format_version: 2, kind: 'complete', exported_at: '2026-10-01T12:00:00Z' });
  });

  it('opens again, plain or encrypted', async () => {
    const text = JSON.stringify(document);
    expect(await openExportFile(text)).toEqual({ document });
    const encrypted = JSON.stringify(await encryptJson(document, 'a long password'));
    expect(await openExportFile(encrypted)).toEqual({ encrypted: true });
    expect(await openExportFile(encrypted, 'a long password')).toEqual({ document });
    await expect(openExportFile(encrypted, 'wrong password')).rejects.toThrow('That password did not open this file.');
  });

  it('refuses a file that is not a Vibe Check export', async () => {
    await expect(openExportFile('not json')).rejects.toThrow('This file is not a Vibe Check export.');
    await expect(openExportFile(JSON.stringify({ app: 'Other' }))).rejects.toThrow('This file is not a Vibe Check export.');
    await expect(openExportFile('null')).rejects.toThrow('This file is not a Vibe Check export.');
  });

  it('lists every check-in and journal entry, unfinished ones too, newest first', () => {
    const summary = summarizeExport(document);
    expect(summary.kind).toBe('complete');
    expect(summary.exportedAt).toBe('2026-10-01T12:00:00Z');
    expect(rowsSummary(summary)).toEqual([
      ['2026-09-04', 'journal', 'journal:j2', true],
      ['2026-09-03', 'day', 'day:c2', false],
      ['2026-09-02', 'journal', 'journal:j1', false],
      ['2026-09-01', 'day', 'day:c1', false],
      ['2026-08-30', 'journal', 'journal:j3', false],
    ]);
    expect(summary.entries[2]).toMatchObject({ entry_kind: 'interaction', notes: 'Talked with Sam.' });
    expect(summary.people).toEqual([{ id: 'p1', name: 'Sam' }]);
  });

  it('counts what the file holds, and a retired feature only when there is some', () => {
    const counts = exportCounts(document);
    expect(summarizeExport(document).counts).toEqual(counts);
    expect(counts.find((c) => c.key === 'vibe_journal_entries')).toEqual({ key: 'vibe_journal_entries', label: 'Journal entries', count: 3 });
    expect(counts.find((c) => c.key === 'readings')?.count).toBe(0);
    expect(counts.some((c) => c.key === 'cosmic_wisdom')).toBe(false);
    const withWisdom = buildCompleteExport({ profile, tables: { cosmic_wisdom: [{ id: 'w1', wisdom: 'Rest.' }] }, exportedAt: '2026-10-01T12:00:00Z' });
    expect(summarizeExport(withWisdom).counts.find((c) => c.key === 'cosmic_wisdom')).toEqual({ key: 'cosmic_wisdom', label: 'Earlier AI wisdom', count: 1 });
  });

  it('summarizes a damaged file without failing', () => {
    const damaged = {
      app: 'Vibe Check', kind: 'complete', exported_at: 7,
      tables: {
        daily_check_ins: [{ date: '2026-09-01', created_at: 5 }, { date: '2026-09-01', created_at: 6 }, { date: 'soon' }, null, 'text'],
        vibe_journal_entries: 'not a list',
        people: [null, { id: 'p1' }],
      },
    };
    const summary = summarizeExport(damaged);
    expect(summary.exportedAt).toBeNull();
    expect(rowsSummary(summary)).toEqual([['2026-09-01', 'day', 'day:0', false], ['2026-09-01', 'day', 'day:1', false]]);
    expect(summary.counts.find((c) => c.key === 'daily_check_ins')?.count).toBe(3);
    expect(summary.counts.find((c) => c.key === 'people')?.count).toBe(1);
    expect(summarizeExport({ app: 'Vibe Check', entries: { 0: 'x' }, range: { start: 1 } })).toMatchObject({ entries: [], range: null });
  });
});

describe('older exports', () => {
  it('summarizes a chosen-entries export, with the labels that replaced names', () => {
    const selected = {
      app: 'Vibe Check', format_version: 1, range: { start: '2026-09-01', end: '2026-09-30' },
      entries: [{ id: 'c1', kind: 'day', key: 'day:c1', date: '2026-09-01', mood_score: 6, notes: 'Saw Person 1.', person_ids: ['Person 1', 'b2c4', 'Removed person 2'] }],
      practice_sessions: [], report_reflections: [],
    };
    const summary = summarizeExport(selected);
    expect(summary.kind).toBe('selected');
    expect(summary.range).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(summary.counts.map((c) => c.count)).toEqual([1, 0, 0]);
    expect(rowsSummary(summary)).toEqual([['2026-09-01', 'day', 'day:c1', false]]);
    expect(summary.people).toEqual([{ id: 'Person 1', name: 'Person 1' }, { id: 'b2c4', name: 'Unnamed person' }, { id: 'Removed person 2', name: 'Removed person 2' }]);
  });

  it('opens the Settings export from before September 2026, plain or encrypted', async () => {
    const earlier = {
      export_date: '2026-08-01T10:00:00Z',
      profile: { full_name: 'Me', cosmic_profile: null, boundary_settings: null },
      check_ins: [{ id: 'c1', date: '2026-07-30', mood_score: 3, notes: 'Long day.' }, { id: 'c2', date: '2026-07-31', mood_score: 5 }],
      people: [{ id: 'p1', name: 'Sam' }], readings: [], wisdom: [{ id: 'w1' }], boundary_alerts: [{ id: 'a1' }], legacy_healing_items: [],
    };
    const encrypted = JSON.stringify(await encryptJson(earlier, 'old password'));
    expect(await openExportFile(encrypted, 'old password')).toEqual({ document: earlier });
    const summary = summarizeExport(earlier);
    expect(summary).toMatchObject({ kind: 'earlier', exportedAt: '2026-08-01T10:00:00Z', range: null, people: [{ id: 'p1', name: 'Sam' }] });
    expect(rowsSummary(summary)).toEqual([['2026-07-31', 'day', 'day:c2', false], ['2026-07-30', 'day', 'day:c1', false]]);
    expect(summary.counts.map((c) => [c.label, c.count])).toEqual([['Check-ins', 2], ['People', 1], ['Card readings', 0], ['Earlier AI wisdom', 1], ['Low-mood notices', 1], ['Practice board items', 0]]);
    // The earliest shape: low-mood notices were "alerts", and people were not included.
    const earliest = { export_date: '2026-07-02T10:00:00Z', cosmic_profile: null, check_ins: [{ id: 'c1', date: '2026-07-01', person_ids: ['0b1c'] }], alerts: [{ id: 'a1' }, { id: 'a2' }] };
    expect(await openExportFile(JSON.stringify(earliest))).toEqual({ document: earliest });
    expect(summarizeExport(earliest).counts.map((c) => [c.label, c.count])).toEqual([['Check-ins', 1], ['Low-mood notices', 2]]);
    expect(summarizeExport(earliest).people).toEqual([{ id: '0b1c', name: 'Unnamed person' }]);
  });
});
