import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { recordKey, putRecordRow, dropRecordRow } from '../record-cache';

const withPart = (part, rows) => {
  const client = new QueryClient();
  if (rows) client.setQueryData(recordKey('u1', part), rows);
  return client;
};

describe('changes written into the cached record', () => {
  it('puts a kept check-in in date order, replacing the one for that date', () => {
    const client = withPart('checkIns', [{ id: 'c3', date: '2026-09-28' }, { id: 'c1', date: '2026-09-26' }]);
    putRecordRow(client, 'u1', 'checkIns', { id: 'c2', date: '2026-09-27', mood_score: 6 });
    putRecordRow(client, 'u1', 'checkIns', { id: 'c3', date: '2026-09-28', mood_score: 4 });
    putRecordRow(client, 'u1', 'checkIns', { id: 'c4', date: '2026-09-29' });
    expect(client.getQueryData(recordKey('u1', 'checkIns'))).toEqual([
      { id: 'c4', date: '2026-09-29' },
      { id: 'c3', date: '2026-09-28', mood_score: 4 },
      { id: 'c2', date: '2026-09-27', mood_score: 6 },
      { id: 'c1', date: '2026-09-26' },
    ]);
  });

  it('keeps one check-in per date even when the saved row has a new id', () => {
    const client = withPart('checkIns', [{ id: 'old', date: '2026-09-29' }]);
    putRecordRow(client, 'u1', 'checkIns', { id: 'new', date: '2026-09-29' });
    expect(client.getQueryData(recordKey('u1', 'checkIns'))).toEqual([{ id: 'new', date: '2026-09-29' }]);
  });

  it('updates a person in place and puts someone new first, as the list is ordered', () => {
    const client = withPart('people', [{ id: 'p2', name: 'Sam' }, { id: 'p1', name: 'Ada' }]);
    putRecordRow(client, 'u1', 'people', { id: 'p1', name: 'Ada L.' });
    putRecordRow(client, 'u1', 'people', { id: 'p3', name: 'Robin' });
    expect(client.getQueryData(recordKey('u1', 'people')).map((person) => person.name)).toEqual(['Robin', 'Sam', 'Ada L.']);
  });

  it('takes a removed row out', () => {
    const client = withPart('people', [{ id: 'p2' }, { id: 'p1' }]);
    dropRecordRow(client, 'u1', 'people', 'p2');
    expect(client.getQueryData(recordKey('u1', 'people'))).toEqual([{ id: 'p1' }]);
  });

  it('leaves a part no page has loaded to load whole', () => {
    const client = withPart('people');
    putRecordRow(client, 'u1', 'people', { id: 'p1' });
    dropRecordRow(client, 'u1', 'people', 'p1');
    expect(client.getQueryData(recordKey('u1', 'people'))).toBeUndefined();
  });

  it('keeps each account to its own record', () => {
    const client = withPart('people', [{ id: 'p1' }]);
    putRecordRow(client, 'u2', 'people', { id: 'x' });
    expect(client.getQueryData(recordKey('u1', 'people'))).toEqual([{ id: 'p1' }]);
  });
});
