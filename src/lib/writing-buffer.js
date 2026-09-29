// Unsaved writing survives a reload or an OS tab eviction, in this tab only.
// sessionStorage keeps it out of other tabs and drops it when the tab closes;
// signing out clears it immediately. Storage can be blocked or full, so every
// call degrades to a no-op.
const PREFIX = 'vibe:unsaved:';

/** @returns {{ value: any, basedOn: string | null } | null} */
export function readBuffer(key) {
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string | null} key
 * @param {any} value
 * @param {string | null} basedOn the server `updated_at` of the version these edits started from
 */
export function writeBuffer(key, value, basedOn = null) {
  writeSerializedBuffer(key, JSON.stringify(value), basedOn);
}

/** Same as writeBuffer for a value the caller already serialized. */
export function writeSerializedBuffer(key, serialized, basedOn = null) {
  if (!key || serialized == null) return;
  try {
    window.sessionStorage.setItem(PREFIX + key, `{"value":${serialized},"basedOn":${JSON.stringify(basedOn || null)}}`);
  } catch {
    // storage blocked or full; the page still holds the words
  }
}

export function clearBuffer(key) {
  if (!key) return;
  try {
    window.sessionStorage.removeItem(PREFIX + key);
  } catch {
    // storage blocked
  }
}

export function clearAllBuffers() {
  try {
    const storage = window.sessionStorage;
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) storage.removeItem(key);
    }
  } catch {
    // storage blocked
  }
}

/**
 * Server versions are `updated_at` strings from one clock and one format, so
 * they order correctly as strings. Never compare them with the device clock.
 * @param {...(string | null | undefined)} times
 */
export function latestVersion(...times) {
  return times.filter(Boolean).sort().at(-1) || null;
}

/** True when server version `a` is strictly newer than `b` (a missing `b` counts as oldest). */
export function isNewerVersion(a, b) {
  return Boolean(a) && (!b || a > b);
}

/**
 * A tab copy can be restored automatically only when the server holds nothing
 * newer than the version it was based on. When this is false the copy may
 * still be the newest words (for example, an autosave whose reply was lost),
 * so callers offer it back instead of dropping it.
 * @param {{ basedOn?: string | null } | null} buffer
 * @param {...(string | null | undefined)} serverTimes `updated_at` values the server holds now
 */
export function bufferRestorable(buffer, ...serverTimes) {
  if (!buffer) return false;
  return (buffer.basedOn || '') >= (latestVersion(...serverTimes) || '');
}
