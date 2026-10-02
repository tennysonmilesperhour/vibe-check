import { describe, it, expect } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { failureOf, retryTargets } from '../read-state';

const read = (fields) => ({ isError: false, isFetching: false, data: ['row'], error: null, ...fields });

describe('what a retry shows and reads again', () => {
  it('shows the error of a read with nothing loaded before a failed reload', () => {
    const reload = read({ isError: true, error: new Error('JWT expired') });
    const load = read({ isError: true, data: undefined, error: new Error('Failed to fetch') });
    expect(failureOf([reload, load]).message).toBe('Failed to fetch');
    expect(failureOf([reload, read({})]).message).toBe('JWT expired');
    expect(failureOf([read({}), read({ data: undefined, isFetching: true })])).toBeNull();
  });

  it('reads again what failed or never loaded, but not what is already on its way', () => {
    const failed = read({ isError: true });
    const neverLoaded = read({ data: undefined });
    const loading = read({ data: undefined, isFetching: true });
    const fine = read({});
    expect(retryTargets([failed, neverLoaded, loading, fine])).toEqual([failed, neverLoaded]);
  });

  // Why a retry holds what the page showed: TanStack puts a read with nothing
  // loaded back to pending and clears its error while it retries.
  it('matches how TanStack reports a failed read being tried again', async () => {
    const client = new QueryClient();
    const calls = [];
    const observer = new QueryObserver(client, { queryKey: ['part'], queryFn: () => new Promise((resolve, reject) => { calls.push({ resolve, reject }); }), retry: false });
    const unsubscribe = observer.subscribe(() => {});
    const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });
    calls[0].reject(new Error('offline')); await settle();
    expect(observer.getCurrentResult().isError).toBe(true);
    observer.refetch(); await settle();
    const retrying = observer.getCurrentResult();
    expect([retrying.isError, retrying.isPending, retrying.isLoading, retrying.error]).toEqual([false, true, true, null]);
    calls[1].resolve(['row']); await settle();
    expect(observer.getCurrentResult().data).toEqual(['row']);
    unsubscribe();
  });
});
