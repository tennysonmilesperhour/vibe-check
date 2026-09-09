import { describe, expect, it } from 'vitest';
import { clearLegacyDrafts } from '../legacy-drafts';

describe('legacy device draft cleanup', () => {
  it('removes every Vibe Check draft while preserving other apps and credentials', () => {
    const data = new Map([['vibe-check:check-in-draft:one', 'a'], ['digest:draft', 'b'], ['vibe-check:check-in-draft:two', 'c'], ['sb-auth-token', 'd']]);
    clearLegacyDrafts({ get length() { return data.size; }, key: index => [...data.keys()][index], removeItem: key => data.delete(key) });
    expect([...data.keys()]).toEqual(['digest:draft', 'sb-auth-token']);
  });
  it('does not interrupt sign-out when browser storage is blocked', () => {
    expect(() => clearLegacyDrafts({ get length() { throw new Error('Storage blocked'); } })).not.toThrow();
  });
});
