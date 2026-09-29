// Unsaved writing survives a reload or an OS tab eviction, in this tab only.
// sessionStorage keeps it out of other tabs and drops it when the tab closes;
// signing out clears it immediately. Storage can be blocked or full, so every
// call degrades to a no-op.
const PREFIX = 'vibe:unsaved:';

/** @returns {{ value: any, savedAt: number } | null} */
export function readBuffer(key) {
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeBuffer(key, value) {
  if (!key) return;
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify({ value, savedAt: Date.now() }));
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

/** True when a buffered copy is newer than every saved copy we know about. */
export function bufferIsNewer(buffer, ...savedTimes) {
  if (!buffer?.savedAt) return false;
  const latest = Math.max(0, ...savedTimes.map((time) => Date.parse(time || '') || 0));
  return buffer.savedAt > latest;
}
