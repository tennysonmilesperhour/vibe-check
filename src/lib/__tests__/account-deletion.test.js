import { describe, expect, it, vi } from 'vitest';
import { deleteVibeAccount } from '../../../supabase/functions/delete-account/operation';

describe('app-scoped account deletion', () => {
  it('preserves shared identities after erasing Vibe records', async () => {
    const remove = vi.fn();
    expect(await deleteVibeAccount(async () => ({ data: true, error: null }), remove)).toEqual({ status: 200, body: { deleted: true, sharedAccountRetained: true } });
    expect(remove).not.toHaveBeenCalled();
  });
  it('never deletes an identity when record deletion fails', async () => {
    const remove = vi.fn();
    expect((await deleteVibeAccount(async () => ({ data: null, error: new Error('unavailable') }), remove)).status).toBe(500);
    expect(remove).not.toHaveBeenCalled();
  });
  it('reports committed erasure when the shared-identity guard blocks Auth deletion', async () => {
    const result = await deleteVibeAccount(async () => ({ data: false, error: null }), async () => ({ error: new Error('Shared identity') }));
    expect(result.status).toBe(500);
    expect(result.body.recordsDeleted).toBe(true);
    expect(result.body.deleted).toBeUndefined();
  });
  it('reports committed erasure if Auth throws after the RPC succeeds', async () => {
    const result = await deleteVibeAccount(async () => ({ data: false, error: null }), async () => { throw new Error('offline'); });
    expect(result.body.recordsDeleted).toBe(true);
  });
  it('removes an unshared identity only after record deletion succeeds', async () => {
    const calls = [];
    const result = await deleteVibeAccount(async () => { calls.push('records'); return { data: false, error: null }; }, async () => { calls.push('identity'); return { error: null }; });
    expect(calls).toEqual(['records', 'identity']);
    expect(result.body).toEqual({ deleted: true, sharedAccountRetained: false });
  });
});
