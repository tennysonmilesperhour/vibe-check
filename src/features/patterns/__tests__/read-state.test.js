import { describe, it, expect } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { hasFailed } from '../read-state';

// A read whose answers are handed out one call at a time, watched the way a page watches it.
const watched = (data) => {
  const client = new QueryClient();
  const calls = [];
  const queryKey = ['part'];
  if (data) client.setQueryData(queryKey, data);
  const observer = new QueryObserver(client, { queryKey, queryFn: () => new Promise((resolve, reject) => { calls.push({ resolve, reject }); }), retry: false, staleTime: Infinity });
  const unsubscribe = observer.subscribe(() => {});
  return { observer, calls, unsubscribe };
};
const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('a failed read being tried again', () => {
  it('still counts as failed while the retry runs with nothing loaded', async () => {
    const { observer, calls, unsubscribe } = watched();
    calls[0].reject(new Error('offline')); await settle();
    expect(hasFailed(observer.getCurrentResult())).toBe(true);
    observer.refetch(); await settle();
    const retrying = observer.getCurrentResult();
    // TanStack puts it back to pending and clears the error while it retries.
    expect(retrying.isPending && retrying.isFetching && retrying.error === null).toBe(true);
    expect(hasFailed(retrying)).toBe(true);
    calls[1].resolve(['row']); await settle();
    expect(hasFailed(observer.getCurrentResult())).toBe(false);
    unsubscribe();
  });

  it('still counts as failed while a reload of a loaded copy is retried', async () => {
    const { observer, calls, unsubscribe } = watched(['old']);
    observer.refetch(); await settle();
    calls[0].reject(new Error('offline')); await settle();
    observer.refetch(); await settle();
    const retrying = observer.getCurrentResult();
    expect(retrying.data).toEqual(['old']);
    expect(hasFailed(retrying)).toBe(true);
    calls[1].resolve(['new']); await settle();
    expect(hasFailed(observer.getCurrentResult())).toBe(false);
    unsubscribe();
  });

  it('is not a failure on a first read', async () => {
    const { observer, calls, unsubscribe } = watched();
    expect(hasFailed(observer.getCurrentResult())).toBe(false);
    calls[0].resolve(['row']); await settle();
    expect(hasFailed(observer.getCurrentResult())).toBe(false);
    unsubscribe();
  });
});
