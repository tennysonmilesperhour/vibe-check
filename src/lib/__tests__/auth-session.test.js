import { describe, it, expect } from 'vitest';
import { isTransientAuthError, sessionChange, userFromSession } from '../auth-session.js';

const session = (id) => ({ user: { id, email: `${id}@example.com` } });

describe('sessionChange', () => {
  it('treats a re-announced SIGNED_IN for the same person as no change', () => {
    // Supabase fires SIGNED_IN whenever a tab becomes visible again. Treating it
    // as new used to unmount every page and discard writing in progress.
    expect(sessionChange('u1', session('u1'))).toBe('unchanged');
  });
  it('recognizes a different person', () => {
    expect(sessionChange('u1', session('u2'))).toBe('switched');
    expect(sessionChange(null, session('u2'))).toBe('switched');
  });
  it('recognizes a missing session as signed out', () => {
    expect(sessionChange('u1', null)).toBe('signed-out');
    expect(sessionChange(null, {})).toBe('signed-out');
  });
});

describe('userFromSession', () => {
  it('keeps only the id and email', () => {
    expect(userFromSession(session('u1'))).toEqual({ id: 'u1', email: 'u1@example.com' });
    expect(userFromSession(null)).toBeNull();
  });
});

describe('isTransientAuthError', () => {
  it('does not treat an unreachable server as a sign-out', () => {
    expect(isTransientAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toBe(true);
    expect(isTransientAuthError({ name: 'TypeError' })).toBe(true);
    expect(isTransientAuthError({ name: 'AuthApiError', status: 503 })).toBe(true);
    // Timeouts and rate limits are temporary; signing out on them would wipe unsaved words.
    expect(isTransientAuthError({ name: 'AuthApiError', status: 408 })).toBe(true);
    expect(isTransientAuthError({ name: 'AuthApiError', status: 429 })).toBe(true);
  });
  it('treats real rejections as sign-outs', () => {
    expect(isTransientAuthError({ name: 'AuthApiError', status: 401 })).toBe(false);
    expect(isTransientAuthError({ name: 'AuthApiError', status: 403 })).toBe(false);
    expect(isTransientAuthError({ name: 'AuthSessionMissingError', status: 400 })).toBe(false);
  });
  it('treats no error as nothing to handle', () => {
    expect(isTransientAuthError(null)).toBe(false);
  });
});
