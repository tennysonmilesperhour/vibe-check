import { describe, it, expect } from 'vitest';
import { QueryClient, QueryObserver, onlineManager } from '@tanstack/react-query';
import { failureOf, retryTargets, retryView } from '../read-state';

const read = (fields) => ({ isError: false, isFetching: false, fetchStatus: 'idle', data: ['row'], error: null, ...fields });
const offline = new Error('Failed to fetch');
const expired = new Error('JWT expired');

describe('what a retry shows and reads again', () => {
  it('shows the error of a read with nothing loaded before a failed reload', () => {
    const reload = read({ isError: true, error: expired });
    const load = read({ isError: true, data: undefined, error: offline });
    expect(failureOf([reload, load])).toBe(offline);
    expect(failureOf([reload, read({})])).toBe(expired);
    expect(failureOf([read({}), read({ data: undefined, isFetching: true })])).toBeNull();
  });

  it('reads again what failed or never loaded, but not what is already on its way', () => {
    const failed = read({ isError: true });
    const neverLoaded = read({ data: undefined });
    const loading = read({ data: undefined, isFetching: true });
    expect(retryTargets([failed, neverLoaded, loading, read({})])).toEqual([failed, neverLoaded]);
  });

  it('shows what loads show when no retry was asked for', () => {
    const view = retryView([read({ isError: true, data: undefined, error: offline })], 'load', false, null);
    expect(view).toEqual({ retrying: false, showing: 'load', error: offline });
    // An ordinary load after an earlier failure is not a retry.
    expect(retryView([read({ data: undefined, fetchStatus: 'fetching', isFetching: true })], null, false, null)).toEqual({ retrying: false, showing: null, error: null });
  });

  it('keeps showing the failure and its error while the retry fetches', () => {
    const pending = { shown: 'load', error: offline };
    const retried = read({ data: undefined, fetchStatus: 'fetching', isFetching: true });
    expect(retryView([retried, read({})], null, false, pending)).toEqual({ retrying: true, showing: 'load', error: offline });
  });

  it('lets go once what was missing has loaded, even if another read is still fetching', () => {
    const pending = { shown: 'load', error: offline };
    const reloading = read({ isError: true, error: expired, fetchStatus: 'fetching', isFetching: true });
    expect(retryView([read({}), reloading], 'reload', true, pending)).toMatchObject({ retrying: true, showing: 'reload' });
  });

  it('keeps the error being retried rather than switching to another part that is reloading', () => {
    const pending = { shown: 'load', error: offline };
    const retried = read({ data: undefined, fetchStatus: 'fetching', isFetching: true });
    const reloading = read({ isError: true, error: expired, fetchStatus: 'fetching', isFetching: true });
    expect(retryView([retried, reloading], 'reload', false, pending).error).toBe(offline);
    // The retried part failing again shows its new error.
    const again = new Error('Still offline');
    expect(retryView([read({ isError: true, data: undefined, error: again }), reloading], 'load', false, pending).error).toBe(again);
  });

  it('gives the button back when the reads are paused waiting for a connection', () => {
    const pending = { shown: true, error: offline };
    const paused = read({ data: undefined, fetchStatus: 'paused' });
    expect(retryView([paused], false, false, pending)).toEqual({ retrying: false, showing: false, error: null });
  });

  // TanStack puts a read with nothing loaded back to pending and clears its
  // error while it retries, which is why a retry holds what the page showed;
  // offline, a read in the default network mode pauses instead of fetching.
  it('matches how TanStack reports a failed read being tried again', async () => {
    const client = new QueryClient();
    client.mount(); // listens for the connection coming back, as the app's provider does
    const calls = [];
    const observer = new QueryObserver(client, { queryKey: ['part'], queryFn: () => new Promise((resolve, reject) => { calls.push({ resolve, reject }); }), retry: false });
    const unsubscribe = observer.subscribe(() => {});
    const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });
    calls[0].reject(offline); await settle();
    const failed = observer.getCurrentResult();
    const pending = { shown: 'load', error: failureOf([failed]) };
    observer.refetch(); await settle();
    const retrying = observer.getCurrentResult();
    expect([retrying.isError, retrying.isPending, retrying.isLoading, retrying.error]).toEqual([false, true, true, null]);
    expect(retryView([retrying], null, false, pending)).toEqual({ retrying: true, showing: 'load', error: offline });
    calls[1].reject(offline); await settle();
    onlineManager.setOnline(false);
    try {
      observer.refetch(); await settle();
      expect(observer.getCurrentResult().fetchStatus).toBe('paused');
      expect(calls).toHaveLength(2);
      expect(retryView([observer.getCurrentResult()], null, false, pending).retrying).toBe(false);
    } finally {
      onlineManager.setOnline(true);
    }
    // Back online, the paused read goes out by itself.
    await settle();
    expect(calls).toHaveLength(3);
    calls[2].resolve(['row']); await settle();
    expect(observer.getCurrentResult().data).toEqual(['row']);
    unsubscribe();
    client.unmount();
  });
});
