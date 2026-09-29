import { quickExitAt } from './app-lock';

// Deleting the account or downloading the whole journal asks for the
// password again, unless it was confirmed in this tab in the last 10 minutes
// and quick exit hasn't run since. Times come from this device only, so a
// wrong device clock can't skip it.
const KEY = 'vibe:confirmed-at:';
export const CONFIRM_WINDOW_MS = 10 * 60 * 1000;

export function markConfirmed(userId, now = Date.now()) {
  try { window.sessionStorage.setItem(KEY + userId, String(now)); } catch { /* storage blocked */ }
}

export function confirmedRecently(userId, now = Date.now()) {
  try {
    const at = Number(window.sessionStorage.getItem(KEY + userId));
    return Boolean(at) && now >= at && now - at <= CONFIRM_WINDOW_MS && at > quickExitAt();
  } catch {
    return false;
  }
}
