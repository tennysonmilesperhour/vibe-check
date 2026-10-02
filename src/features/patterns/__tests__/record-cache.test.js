import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { recordKey, putRecordRow, dropRecordRow, putRecentCheckIns } from '../record-cache';

const withPart = (part, rows, updatedAt) => {
  const client = new QueryClient();
  if (rows) client.setQueryData(recordKey('u1', part), rows, updatedAt ? { updatedAt } : undefined);
  return client;
};
const rowsOf = (client, part) => client.getQueryData(recordKey('u1', part));

describe('changes written into the cached record', () => {
  it('puts a kept check-in in date order, replacing the one for that date', async () => {
    const client = withPart('checkIns', [{ id: 'c3', date: '2026-09-28' }, { id: 'c1', date: '2026-09-26' }]);
    await putRecordRow(client, 'u1', 'checkIns', { id: 'c2', date: '2026-09-27', mood_score: 6 });
    await putRecordRow(client, 'u1', 'checkIns', { id: 'c3', date: '2026-09-28', mood_score: 4 });
    await putRecordRow(client, 'u1', 'checkIns', { id: 'c4', date: '2026-09-29' });
    expect(rowsOf(client, 'checkIns')).toEqual([
      { id: 'c4', date: '2026-09-29' },
      { id: 'c3', date: '2026-09-28', mood_score: 4 },
      { id: 'c2', date: '2026-09-27', mood_score: 6 },
      { id: 'c1', date: '2026-09-26' },
    ]);
  });

  it('keeps one check-in per date even when the saved row has a new id', async () => {
    const client = withPart('checkIns', [{ id: 'old', date: '2026-09-29' }]);
    await putRecordRow(client, 'u1', 'checkIns', { id: 'new', date: '2026-09-29' });
    expect(rowsOf(client, 'checkIns')).toEqual([{ id: 'new', date: '2026-09-29' }]);
  });

  it('keeps every part in the order its query reads it', async () => {
    const client = withPart('people', [{ id: 'p2', name: 'Sam', created_at: '2026-09-02' }, { id: 'p1', name: 'Ada', created_at: '2026-09-01' }]);
    await putRecordRow(client, 'u1', 'people', { id: 'p1', name: 'Ada L.', created_at: '2026-09-01' });
    await putRecordRow(client, 'u1', 'people', { id: 'p3', name: 'Robin', created_at: '2026-09-29' });
    expect(rowsOf(client, 'people').map((person) => person.name)).toEqual(['Robin', 'Sam', 'Ada L.']);
    const sessions = withPart('sessions', [{ id: 's2', date: '2026-09-20' }, { id: 's1', date: '2026-09-10' }]);
    await putRecordRow(sessions, 'u1', 'sessions', { id: 's3', date: '2026-09-15' });
    expect(rowsOf(sessions, 'sessions').map((session) => session.id)).toEqual(['s2', 's3', 's1']);
    const reflections = withPart('reflections', [{ id: 'r1', period_key: '2026-09-01' }]);
    await putRecordRow(reflections, 'u1', 'reflections', { id: 'r0', period_key: '2026-08-01' });
    expect(rowsOf(reflections, 'reflections').map((reflection) => reflection.id)).toEqual(['r1', 'r0']);
  });

  it('takes a removed row out', async () => {
    const client = withPart('people', [{ id: 'p2' }, { id: 'p1' }]);
    await dropRecordRow(client, 'u1', 'people', 'p2');
    expect(rowsOf(client, 'people')).toEqual([{ id: 'p1' }]);
  });

  it('leaves a part no page has loaded to load whole', async () => {
    const client = withPart('people');
    await putRecordRow(client, 'u1', 'people', { id: 'p1' });
    await dropRecordRow(client, 'u1', 'people', 'p1');
    expect(rowsOf(client, 'people')).toBeUndefined();
  });

  it('keeps each account to its own record', async () => {
    const client = withPart('people', [{ id: 'p1' }]);
    await putRecordRow(client, 'u2', 'people', { id: 'x' });
    expect(rowsOf(client, 'people')).toEqual([{ id: 'p1' }]);
  });

  it('drops a read begun before the change, so it cannot land over it, and reads again', async () => {
    const client = withPart('people', [{ id: 'p1', created_at: '2026-09-01' }]);
    let finish;
    const reading = client.fetchQuery({ queryKey: recordKey('u1', 'people'), queryFn: () => new Promise((resolve) => { finish = resolve; }), staleTime: 0 });
    await putRecordRow(client, 'u1', 'people', { id: 'p2', created_at: '2026-09-29' });
    // The read answers with the copy from before it began, and its own rows never land.
    expect(await reading).toEqual([{ id: 'p1', created_at: '2026-09-01' }]);
    finish([{ id: 'p1', created_at: '2026-09-01' }]);
    await Promise.resolve();
    expect(rowsOf(client, 'people').map((person) => person.id)).toEqual(['p2', 'p1']);
    expect(client.getQueryState(recordKey('u1', 'people')).isInvalidated).toBe(true);
  });

  it('keeps the age of a copy it adds a row to, so a reload that was due still comes', async () => {
    const client = withPart('people', [{ id: 'p1' }], 1_000);
    await putRecordRow(client, 'u1', 'people', { id: 'p2' });
    expect(client.getQueryState(recordKey('u1', 'people')).dataUpdatedAt).toBe(1_000);
  });

  it('replaces the cached check-ins from the oldest of the newest ones on, and counts them as just read', async () => {
    const client = withPart('checkIns', [
      { id: 'a', date: '2026-09-29', mood_score: 3 }, { id: 'gone', date: '2026-09-28' }, { id: 'b', date: '2026-09-20' }, { id: 'old', date: '2026-08-01' },
    ], 1_000);
    // From the server: today changed elsewhere, the 28th removed, the 25th kept on another device.
    await putRecentCheckIns(client, 'u1', [{ id: 'a', date: '2026-09-29', mood_score: 6 }, { id: 'c', date: '2026-09-25' }, { id: 'b', date: '2026-09-20' }], 3);
    expect(rowsOf(client, 'checkIns').map((row) => `${row.id}:${row.date}`)).toEqual(['a:2026-09-29', 'c:2026-09-25', 'b:2026-09-20', 'old:2026-08-01']);
    expect(rowsOf(client, 'checkIns')[0].mood_score).toBe(6);
    expect(client.getQueryState(recordKey('u1', 'checkIns')).dataUpdatedAt).toBeGreaterThan(1_000);
  });

  it('takes fewer check-ins than asked for as every one there is', async () => {
    const client = withPart('checkIns', [{ id: 'gone', date: '2026-01-01' }]);
    await putRecentCheckIns(client, 'u1', [{ id: 'a', date: '2026-09-29' }], 31);
    expect(rowsOf(client, 'checkIns')).toEqual([{ id: 'a', date: '2026-09-29' }]);
  });
});
