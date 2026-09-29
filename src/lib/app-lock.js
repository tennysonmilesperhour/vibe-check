// Optional app lock: a PIN checked on this device before the journal shows.
// It keeps the journal from someone who picks up an unlocked device. It is not
// strong protection against someone who controls or monitors the device, and
// the settings copy says so.
const LOCK_PREFIX = 'vibe:lock:';
const UNLOCK_PREFIX = 'vibe:unlocked:';
const ATTEMPTS_PREFIX = 'vibe:lock-attempts:';
const ITERATIONS = 150_000;
export const RELOCK_AFTER_MS = 5 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const ATTEMPT_PAUSE_MS = 30 * 1000;
const MAX_PAUSE_MS = 15 * 60 * 1000;

/**
 * @param {'localStorage' | 'sessionStorage'} kind
 * @returns {Storage | null}
 */
function store(kind) {
  try {
    return globalThis.window?.[kind] ?? null;
  } catch {
    return null;
  }
}

const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => Uint8Array.from(hex.match(/../g) || [], (pair) => parseInt(pair, 16));

async function derive(pin, salt, iterations) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
  return new Uint8Array(bits);
}

export const validPin = (pin) => /^\d{4,8}$/.test(String(pin));

export function hasAppLock(userId) {
  return Boolean(userId && store('localStorage')?.getItem(LOCK_PREFIX + userId));
}

export async function setAppLock(userId, pin) {
  if (!validPin(pin)) throw new Error('Use 4 to 8 digits.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(String(pin), salt, ITERATIONS);
  store('localStorage')?.setItem(LOCK_PREFIX + userId, JSON.stringify({ v: 1, salt: toHex(salt), hash: toHex(hash), iterations: ITERATIONS }));
  clearFailedAttempts(userId);
  markUnlocked(userId);
}

export async function pinMatches(userId, pin) {
  const raw = store('localStorage')?.getItem(LOCK_PREFIX + userId);
  if (!raw) return true;
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return false; // a damaged lock can't be opened; "Forgot your PIN" still works
  }
  const actual = await derive(String(pin), fromHex(record.salt), record.iterations);
  const expected = fromHex(record.hash);
  // Compare every byte so timing reveals nothing about a partial match.
  let difference = actual.length ^ expected.length;
  for (let i = 0; i < Math.min(actual.length, expected.length); i += 1) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

export function removeAppLock(userId) {
  store('localStorage')?.removeItem(LOCK_PREFIX + userId);
  clearFailedAttempts(userId);
  store('sessionStorage')?.removeItem(UNLOCK_PREFIX + userId);
}

export function markUnlocked(userId) {
  store('sessionStorage')?.setItem(UNLOCK_PREFIX + userId, '1');
}

export function isUnlocked(userId) {
  return store('sessionStorage')?.getItem(UNLOCK_PREFIX + userId) === '1';
}

export function relock(userId) {
  store('sessionStorage')?.removeItem(UNLOCK_PREFIX + userId);
}

/** Lock every account on this tab again, e.g. on quick exit. */
export function relockAll() {
  const session = store('sessionStorage');
  if (!session) return;
  const keys = [];
  for (let i = 0; i < session.length; i += 1) {
    const key = session.key(i);
    if (key?.startsWith(UNLOCK_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => session.removeItem(key));
}

// Wrong PINs are counted on the device, so reloading the page doesn't reset
// the pause. Every fifth miss pauses entry, twice as long each time.
/** @returns {{ count: number, pausedUntil: number }} */
export function failedAttempts(userId) {
  try {
    const saved = JSON.parse(store('localStorage')?.getItem(ATTEMPTS_PREFIX + userId) || 'null');
    if (saved && Number.isFinite(saved.count) && Number.isFinite(saved.pausedUntil)) return saved;
  } catch {
    // unreadable; start over
  }
  return { count: 0, pausedUntil: 0 };
}

export function recordFailedAttempt(userId, now = Date.now()) {
  const count = failedAttempts(userId).count + 1;
  let { pausedUntil } = failedAttempts(userId);
  if (count % MAX_ATTEMPTS === 0) {
    const round = count / MAX_ATTEMPTS;
    pausedUntil = now + Math.min(ATTEMPT_PAUSE_MS * 2 ** (round - 1), MAX_PAUSE_MS);
  }
  const next = { count, pausedUntil };
  store('localStorage')?.setItem(ATTEMPTS_PREFIX + userId, JSON.stringify(next));
  return next;
}

export function clearFailedAttempts(userId) {
  store('localStorage')?.removeItem(ATTEMPTS_PREFIX + userId);
}

/** "30 seconds", "1 minute", "8 minutes". */
export function waitLabel(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}
