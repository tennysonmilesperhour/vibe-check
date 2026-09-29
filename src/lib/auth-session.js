// Pure auth decisions, kept out of React so they can be tested directly.

/**
 * A network failure is not a sign-out. Supabase reports unreachable servers as
 * AuthRetryableFetchError (or with no status); only a real rejection means the
 * session is gone.
 */
export function isTransientAuthError(error) {
  if (!error) return false;
  return error.name === 'AuthRetryableFetchError' || !error.status || error.status >= 500;
}

export const userFromSession = (session) => (session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);

/**
 * What an auth event means for the app. Supabase re-announces SIGNED_IN every
 * time a tab becomes visible; for the same person that must change nothing.
 * @returns {'signed-out' | 'switched' | 'unchanged'}
 */
export function sessionChange(currentUserId, session) {
  const next = userFromSession(session);
  if (!next) return 'signed-out';
  return next.id === currentUserId ? 'unchanged' : 'switched';
}
