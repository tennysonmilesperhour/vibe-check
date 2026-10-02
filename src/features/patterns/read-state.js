import { useState } from 'react';

/** The error to show for a set of reads (TanStack results): one with nothing loaded first. */
export const failureOf = (/** @type {any[]} */ reads) => (
  reads.find((read) => read.isError && read.data === undefined) || reads.find((read) => read.isError)
)?.error ?? null;

/** What a retry reads again: what failed or never loaded, unless it is already on its way. */
export const retryTargets = (/** @type {any[]} */ reads) => reads.filter((read) => !read.isFetching && (read.isError || read.data === undefined));

/**
 * What a page shows while a retry the person asked for runs. TanStack puts a
 * read with nothing loaded back to pending and clears its error while it
 * retries; a page that switched to its loading state would drop the retry
 * button and the keyboard focus on it. So while the reads are still under
 * way and `done` doesn't say what was missing has loaded, `showing` stays
 * what the page showed when the button was pressed and `error` the failure
 * being retried. Only fetching counts as retrying: a read paused for want of
 * a connection keeps the failure on screen with the button free to press.
 * @template T
 * @param {any[]} reads @param {T} shown @param {boolean} done
 * @param {{ shown: T, error: any } | null} pending set when the button was pressed
 */
export function retryView(reads, shown, done, pending) {
  const fetching = reads.some((read) => read.fetchStatus === 'fetching');
  const underWay = Boolean(pending) && (fetching || reads.some((read) => read.fetchStatus === 'paused'));
  const loadFailure = reads.find((read) => read.isError && read.data === undefined)?.error;
  return {
    retrying: underWay && fetching,
    showing: underWay && !done ? pending.shown : shown,
    error: loadFailure || (underWay ? pending.error : failureOf(reads)) || null,
  };
}

/**
 * A retry the person asked for, over a set of reads: reads again what failed
 * or never loaded, and reports what to show meanwhile (see retryView). Loads
 * that aren't a retry keep their usual states.
 * @template T
 * @param {any[]} reads @param {T} shown @param {boolean} done
 */
export function useRetry(reads, shown, done) {
  const [pending, setPending] = useState(/** @type {{ shown: T, error: any, token: object } | null} */ (null));
  const view = retryView(reads, shown, done, pending);
  const retry = async () => {
    if (view.retrying) return;
    const token = {};
    setPending({ shown, error: failureOf(reads), token });
    try {
      await Promise.all(retryTargets(reads).map((read) => read.refetch()));
    } finally {
      setPending((current) => (current?.token === token ? null : current));
    }
  };
  return { ...view, retry };
}
