import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setAppLock, pinMatches, hasAppLock, removeAppLock, isUnlocked, relock, relockAll, validPin, failedAttempts, recordFailedAttempt, clearFailedAttempts, waitLabel } from '../app-lock.js';

function fakeStorage() {
  const map = new Map();
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

describe('app lock', () => {
  beforeEach(() => { globalThis.window = /** @type {any} */ ({ localStorage: fakeStorage(), sessionStorage: fakeStorage() }); });
  afterEach(() => { delete globalThis.window; });

  it('accepts only 4 to 8 digits', () => {
    expect(validPin('1234')).toBe(true);
    expect(validPin('12345678')).toBe(true);
    expect(validPin('123')).toBe(false);
    expect(validPin('12a4')).toBe(false);
    expect(validPin('123456789')).toBe(false);
  });

  it('stores a salted hash, never the PIN, and checks it', async () => {
    await setAppLock('u1', '2468');
    expect(hasAppLock('u1')).toBe(true);
    expect(window.localStorage.getItem('vibe:lock:u1')).not.toContain('2468');
    expect(await pinMatches('u1', '2468')).toBe(true);
    expect(await pinMatches('u1', '1357')).toBe(false);
  });

  it('keeps each person separate and unlocks per tab', async () => {
    await setAppLock('u1', '2468');
    expect(hasAppLock('u2')).toBe(false);
    expect(isUnlocked('u1')).toBe(true);
    relock('u1');
    expect(isUnlocked('u1')).toBe(false);
    removeAppLock('u1');
    expect(hasAppLock('u1')).toBe(false);
  });

  it('relocks every account on quick exit and leaves other tab data alone', async () => {
    await setAppLock('u1', '2468');
    await setAppLock('u2', '1357');
    window.sessionStorage.setItem('vibe:unsaved:ceremony:u1:2026-09-29', 'words');
    relockAll();
    expect(isUnlocked('u1')).toBe(false);
    expect(isUnlocked('u2')).toBe(false);
    expect(hasAppLock('u1')).toBe(true);
    expect(window.sessionStorage.getItem('vibe:unsaved:ceremony:u1:2026-09-29')).toBe('words');
  });

  it('treats a damaged lock record as a mismatch', async () => {
    window.localStorage.setItem('vibe:lock:u1', '{not json');
    expect(await pinMatches('u1', '2468')).toBe(false);
  });

  it('pauses after every fifth wrong PIN, longer each time, and survives a reload', () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i += 1) expect(recordFailedAttempt('u1', now).pausedUntil).toBe(0);
    expect(recordFailedAttempt('u1', now).pausedUntil).toBe(now + 30_000);
    // Stored on the device, not in the page.
    expect(failedAttempts('u1')).toEqual({ count: 5, pausedUntil: now + 30_000 });
    for (let i = 0; i < 4; i += 1) recordFailedAttempt('u1', now);
    expect(recordFailedAttempt('u1', now).pausedUntil).toBe(now + 60_000);
    clearFailedAttempts('u1');
    expect(failedAttempts('u1')).toEqual({ count: 0, pausedUntil: 0 });
  });

  it('caps the pause at 15 minutes and labels waits plainly', () => {
    const now = 0;
    for (let i = 0; i < 50; i += 1) recordFailedAttempt('u1', now);
    expect(failedAttempts('u1').pausedUntil).toBe(15 * 60 * 1000);
    expect(waitLabel(30_000)).toBe('30 seconds');
    expect(waitLabel(60_000)).toBe('1 minute');
    expect(waitLabel(61_000)).toBe('2 minutes');
  });

  it('rejects an invalid PIN when setting a lock', async () => {
    await expect(setAppLock('u1', '12')).rejects.toThrow('4 to 8 digits');
  });
});
