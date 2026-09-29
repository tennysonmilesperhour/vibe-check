import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readBuffer, writeBuffer, writeSerializedBuffer, clearBuffer, clearAllBuffers, bufferRestorable, latestVersion, isNewerVersion } from '../writing-buffer.js';

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

describe('writing buffer', () => {
  // The module reads window.sessionStorage; tests run in Node, so provide one.
  beforeEach(() => { globalThis.window = /** @type {any} */ ({ sessionStorage: fakeStorage() }); });
  afterEach(() => { delete globalThis.window; });

  it('keeps unsaved words with the server version they were based on', () => {
    writeBuffer('composer:u1:e1', { notes: 'half a thought' }, '2026-09-29T20:00:00.000000+00:00');
    const saved = readBuffer('composer:u1:e1');
    expect(saved.value).toEqual({ notes: 'half a thought' });
    expect(saved.basedOn).toBe('2026-09-29T20:00:00.000000+00:00');
    writeBuffer('composer:u1:new', { notes: 'fresh' });
    expect(readBuffer('composer:u1:new').basedOn).toBeNull();
  });

  it('clears one entry, or every Vibe entry on sign-out, leaving other keys alone', () => {
    writeBuffer('ceremony:u1:2026-09-29', { mood_score: 7 });
    writeBuffer('composer:u1:new', { notes: 'x' });
    window.sessionStorage.setItem('unrelated', 'keep');
    clearBuffer('ceremony:u1:2026-09-29');
    expect(readBuffer('ceremony:u1:2026-09-29')).toBeNull();
    expect(readBuffer('composer:u1:new')).not.toBeNull();
    clearAllBuffers();
    expect(readBuffer('composer:u1:new')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated')).toBe('keep');
  });

  it('degrades to a no-op when storage is unavailable', () => {
    delete globalThis.window;
    expect(() => writeBuffer('k', { a: 1 })).not.toThrow();
    expect(readBuffer('k')).toBeNull();
    expect(() => clearAllBuffers()).not.toThrow();
  });

  it('restores only when the server has nothing newer than the buffer was based on', () => {
    const t1 = '2026-09-29T20:00:00.000000+00:00';
    const t2 = '2026-09-29T20:05:00.000000+00:00';
    // Edits started from the current server version: restore them.
    expect(bufferRestorable({ basedOn: t2 }, t1, t2)).toBe(true);
    // Someone saved a newer version elsewhere: keep the server copy.
    expect(bufferRestorable({ basedOn: t1 }, t2)).toBe(false);
    // A brand-new entry with nothing on the server: restore.
    expect(bufferRestorable({ basedOn: null })).toBe(true);
    expect(bufferRestorable({ basedOn: null }, null, undefined)).toBe(true);
    // Something was saved after a new-entry buffer began: keep the server copy.
    expect(bufferRestorable({ basedOn: null }, t1)).toBe(false);
    expect(bufferRestorable(null, t1)).toBe(false);
  });

  it('stores a pre-serialized value the same way', () => {
    writeSerializedBuffer('ceremony:u1:2026-09-29', JSON.stringify({ mood_score: 6 }), '2026-09-29T20:00:00.000000+00:00');
    expect(readBuffer('ceremony:u1:2026-09-29')).toEqual({ value: { mood_score: 6 }, basedOn: '2026-09-29T20:00:00.000000+00:00' });
  });

  it('orders server versions without the device clock', () => {
    const t1 = '2026-09-29T20:00:00.000000+00:00';
    const t2 = '2026-09-29T20:05:00.000000+00:00';
    expect(latestVersion(t1, null, t2, undefined)).toBe(t2);
    expect(latestVersion()).toBeNull();
    expect(isNewerVersion(t2, t1)).toBe(true);
    expect(isNewerVersion(t1, t2)).toBe(false);
    expect(isNewerVersion(t1, null)).toBe(true);
    expect(isNewerVersion(null, t1)).toBe(false);
  });
});
