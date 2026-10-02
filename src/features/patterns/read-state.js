/**
 * Whether a read has failed, counting one being tried again: with nothing
 * loaded, TanStack puts a failed query back to pending while it retries,
 * which would swap an error and its retry button for a loading state.
 * @param {{ isError: boolean, isPending: boolean, errorUpdateCount: number }} result
 */
export const hasFailed = (result) => result.isError || (result.isPending && result.errorUpdateCount > 0);
