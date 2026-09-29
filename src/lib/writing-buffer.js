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
  if (!key) return;
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify({ value, basedOn: basedOn || null }));
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
 * Restore a tab copy only when the server holds nothing newer than the version
 * it was based on. This compares server timestamps with each other and never
 * with the device clock, which may be wrong.
 * @param {{ basedOn?: string | null } | null} buffer
 * @param {...(string | null | undefined)} serverTimes `updated_at` values the server holds now
 */
export function bufferRestorable(buffer, ...serverTimes) {
  if (!buffer) return false;
  const latest = serverTimes.filter(Boolean).sort().at(-1) || '';
  return (buffer.basedOn || '') >= latest;
}
