// Keep in sync with the public URLs in index.html. The public origin works
// even when the page itself is an immutable or SSO-protected Vercel alias.
export const LIVE_ORIGIN = "https://vibe-check-flame-nu.vercel.app";
export const UPDATE_POLL_MS = 60 * 1000;
export const UPDATE_SNOOZE_MS = 15 * 60 * 1000;

/**
 * Production is the authority, including after a rollback. A preview may be
 * newer than production, so call it a preview rather than claiming it is old.
 * Accept the legacy { build } manifest until the first new release is live.
 * @param {{ build: string, environment: string }} current
 * @param {unknown} manifest
 * @returns {{ build: string, kind: 'preview' | 'update' } | null}
 */
export function getVersionNotice(current, manifest) {
  if (!["production", "preview"].includes(current.environment)) return null;
  if (!manifest || typeof manifest !== "object" || !("build" in manifest)) return null;
  const build = manifest.build;
  if (typeof build !== "string" || !/^[\w.-]{1,128}$/.test(build)) return null;
  // The canonical endpoint is authoritative: promoting a deployment preserves
  // its original baked environment, which may still say "preview".
  if (build === current.build) return null;
  return { build, kind: current.environment === "preview" ? "preview" : "update" };
}

/**
 * Keep the current page and app filters, never copy preview-access or auth tokens
 * to another origin. Construct the URL from the trusted origin, not a manifest.
 * The version query also avoids reusing a cached document on production.
 * @param {string} currentHref
 * @param {string} build
 */
export function latestVersionUrl(currentHref, build) {
  const current = new URL(currentHref);
  const target = new URL(LIVE_ORIGIN);
  target.pathname = current.pathname;
  for (const key of ["tab", "date", "range", "person", "review", "start", "end", "habit", "search", "calendarMetric", "calendarMonth", "calendarDay", "period", "reportDate", "entry", "practice", "pattern", "sources", "compose", "prompt", "kind", "export"]) {
    const value = current.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  // OAuth also uses `state`: only retain the app's explicit stress-state IDs.
  const state = current.searchParams.get("state");
  if (["/Analytics", "/Practice"].includes(current.pathname) && ["confusion", "on-edge", "anger", "shutdown", "numbness", "procrastination", "unsure"].includes(state)) {
    target.searchParams.set("state", state);
  }
  if (/^#[A-Za-z][\w-]*$/.test(current.hash)) target.hash = current.hash;
  target.searchParams.set("_vibe_version", build);
  return target.href;
}
