import { useState } from 'react';

/** The error to show for a set of reads (TanStack results): one with nothing loaded first. */
export const failureOf = (/** @type {any[]} */ reads) => (
  reads.find((read) => read.isError && read.data === undefined) || reads.find((read) => read.isError)
)?.error ?? null;

/** What a retry reads again: what failed or never loaded, unless it is already on its way. */
export const retryTargets = (/** @type {any[]} */ reads) => reads.filter((read) => !read.isFetching && (read.isError || read.data === undefined));

/**
 * A retry the person asked for. While it runs, `held` is what the page
 * showed when they pressed it (`shown`) and `error` the failure being
 * retried: TanStack puts a read with nothing loaded back to pending and
 * clears its error while it retries, and a page that switched to its
 * loading state would drop the retry button and the keyboard focus on it.
 * Loads that aren't a retry keep their usual states.
 * @template T
 * @param {any[]} reads @param {T} shown
 */
export function useRetry(reads, shown) {
  const [pending, setPending] = useState(/** @type {{ shown: T, error: any } | null} */ (null));
  const failure = failureOf(reads);
  const retry = async () => {
    if (pending) return;
    setPending({ shown, error: failure });
    try {
      await Promise.all(retryTargets(reads).map((read) => read.refetch()));
    } finally {
      setPending(null);
    }
  };
  return { retry, retrying: Boolean(pending), held: pending?.shown, error: failure || pending?.error || null };
}
