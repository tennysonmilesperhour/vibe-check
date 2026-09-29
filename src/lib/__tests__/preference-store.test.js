import { describe, it, expect } from 'vitest';
import { mergePreferences, OTHER_ACCOUNT } from '../preference-store';

// A stored row that moves its updated_at on every write, like the database,
// with a pause before each write so changes started together overlap.
function fakeStore(values = {}, owner = 'me') {
  let row = { id: 'row', user_id: owner, values, updated_at: 0 };
  let signedIn = owner;
  const pause = () => new Promise((resolve) => setTimeout(resolve, 1));
  const api = {
    read: async () => (row && row.user_id === signedIn ? { ...row } : undefined),
    swap: async (seen, next) => {
      await pause();
      if (!row || row.id !== seen.id || row.updated_at !== seen.updated_at || row.user_id !== signedIn) return undefined;
      row = { ...row, values: next, updated_at: row.updated_at + 1 };
      return { ...row };
    },
    create: async () => null,
  };
  return { api, stored: () => row?.values, signIn: (id) => { signedIn = id; } };
}

describe('preferences change from many places without losing one another', () => {
  it('keeps every change when several start at once', async () => {
    const { api, stored } = fakeStore({ theme: 'moss' });
    await Promise.all([
      mergePreferences(api, 'me', { safety_plan: { steps: 'Call Sam' } }),
      mergePreferences(api, 'me', (current) => ({ hidden_practices: [...(current.hidden_practices || []), 'breath'] })),
      mergePreferences(api, 'me', (current) => ({ hidden_practices: [...(current.hidden_practices || []), 'orient'] })),
      mergePreferences(api, 'me', { quick_exit: true }),
    ]);
    expect(stored()).toMatchObject({ theme: 'moss', safety_plan: { steps: 'Call Sam' }, quick_exit: true });
    expect([...stored().hidden_practices].sort()).toEqual(['breath', 'orient']);
  });

  it('never writes a change into another account', async () => {
    const { api, signIn, stored } = fakeStore({ theme: 'moss' }, 'other');
    signIn('other');
    await expect(mergePreferences(api, 'me', { safety_plan: { steps: 'mine' } })).rejects.toThrow(OTHER_ACCOUNT);
    expect(stored()).toEqual({ theme: 'moss' });
    await expect(mergePreferences(api, undefined, { quick_exit: true })).rejects.toThrow('Sign in');
  });

  it('creates the first row, and merges into one that appeared meanwhile', async () => {
    /** @type {any} */
    let row;
    const api = {
      read: async () => row,
      swap: async (seen, values) => { row = { ...seen, values, updated_at: seen.updated_at + 1 }; return row; },
      create: async (values) => {
        if (!row) { row = { id: 'late', user_id: 'me', values: { week_start: 0 }, updated_at: 1 }; return null; }
        row = { id: 'new', user_id: 'me', values, updated_at: 1 };
        return row;
      },
    };
    await mergePreferences(api, 'me', { quick_exit: true });
    expect(row.values).toEqual({ week_start: 0, quick_exit: true });
  });

  it('gives up with a clear message rather than writing over a busy row', async () => {
    const api = { read: async () => ({ id: 'row', user_id: 'me', values: {}, updated_at: 0 }), swap: async () => undefined, create: async () => null };
    await expect(mergePreferences(api, 'me', { quick_exit: true })).rejects.toThrow('changing somewhere else');
  });
});
