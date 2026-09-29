import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readBuffer, writeBuffer, clearBuffer, clearAllBuffers, bufferIsNewer } from '../writing-buffer.js';

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

  it('keeps unsaved words and returns them with a timestamp', () => {
    writeBuffer('composer:u1:new', { notes: 'half a thought' });
    const saved = readBuffer('composer:u1:new');
    expect(saved.value).toEqual({ notes: 'half a thought' });
    expect(saved.savedAt).toBeGreaterThan(0);
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

  it('restores only when the buffered copy is newer than every saved copy', () => {
    const buffer = { value: {}, savedAt: Date.parse('2026-09-29T20:00:00Z') };
    expect(bufferIsNewer(buffer, '2026-09-29T19:00:00Z', null)).toBe(true);
    expect(bufferIsNewer(buffer, '2026-09-29T21:00:00Z')).toBe(false);
    expect(bufferIsNewer(null, '2026-09-29T19:00:00Z')).toBe(false);
    expect(bufferIsNewer(buffer)).toBe(true);
  });
});
