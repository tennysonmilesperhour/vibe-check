import { describe, it, expect } from 'vitest';
import { buildCompleteExport, openExportFile, summarizeExport, EXPORT_TABLES } from '../export-file.js';
import { encryptJson } from '../crypto.js';

const tables = {
  daily_check_ins: [
    { id: 'c1', user_id: 'u1', date: '2026-09-01', mood_score: 6, notes: 'Slept well.', gratitude: 'Tea', created_at: '2026-09-01T20:00:00Z', created_date: '2026-09-01T20:00:00Z' },
    { id: 'c2', user_id: 'u1', date: '2026-09-03', mood_score: 4, notes: '', high_moment: { description: 'A walk' }, stress_context: { situation: 'Deadline', need: 'Rest' } },
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

describe('the complete export', () => {
  const document = buildCompleteExport({ profile, tables, exportedAt: '2026-10-01T12:00:00Z' });

  it('holds every table as stored, without internal owner ids', () => {
    expect(Object.keys(document.tables)).toEqual(EXPORT_TABLES.map(([key]) => key));
    expect(document.tables.daily_check_ins[0]).toEqual({ id: 'c1', date: '2026-09-01', mood_score: 6, notes: 'Slept well.', gratitude: 'Tea', created_at: '2026-09-01T20:00:00Z' });
    expect(JSON.stringify(document)).not.toContain('"user_id"');
    expect(document.tables.readings).toEqual([]);
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
  });

  it('summarizes what the file holds, newest first, without drafts', () => {
    const summary = summarizeExport(document);
    expect(summary.complete).toBe(true);
    expect(summary.counts.find((c) => c.key === 'people')).toEqual({ key: 'people', label: 'People', count: 1 });
    expect(summary.entries.map((e) => [e.date, e.label, e.mood, e.text])).toEqual([
      ['2026-09-03', 'Check-in', 4, 'A walk\n\nDeadline\n\nRest'],
      ['2026-09-02', 'Interaction', 5, 'Talked with Sam.'],
      ['2026-09-01', 'Check-in', 6, 'Slept well.\n\nTea'],
      ['2026-08-30', 'Journal', null, 'Evening pages.'],
    ]);
  });

  it('summarizes a damaged file without failing', () => {
    const summary = summarizeExport({ app: 'Vibe Check', kind: 'complete', tables: { daily_check_ins: 'not a list', people: [null, { id: 'p1' }] } });
    expect(summary.entries).toEqual([]);
    expect(summary.counts.find((c) => c.key === 'daily_check_ins')?.count).toBe(0);
    expect(summary.counts.find((c) => c.key === 'people')?.count).toBe(1);
    expect(summarizeExport({ app: 'Vibe Check', entries: { 0: 'x' } }).entries).toEqual([]);
  });

  it('summarizes a chosen-entries export too', () => {
    const selected = { app: 'Vibe Check', format_version: 1, range: { start: '2026-09-01', end: '2026-09-30' }, entries: [{ id: 'c1', kind: 'day', key: 'day:c1', date: '2026-09-01', mood_score: 6, notes: 'Slept well.' }], practice_sessions: [], report_reflections: [] };
    const summary = summarizeExport(selected);
    expect(summary.complete).toBe(false);
    expect(summary.range).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(summary.counts.map((c) => c.count)).toEqual([1, 0, 0]);
    expect(summary.entries).toEqual([{ key: 'day:c1', date: '2026-09-01', label: 'Check-in', mood: 6, text: 'Slept well.' }]);
  });
});
