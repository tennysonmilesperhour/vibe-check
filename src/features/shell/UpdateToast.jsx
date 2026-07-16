import React, { useEffect, useState } from "react";

const POLL_MS = 3 * 60 * 1000;

// The public production origin — keep in sync with the og: URLs in index.html,
// and update both when a custom domain lands. Polling must be absolute: the
// production deployment is also reachable at aliases behind Vercel Deployment
// Protection (vibe-check-tennysonmilesperhour.vercel.app, the git-main alias),
// where a same-origin fetch of /version.json gets a 302 to the SSO login and
// dies. This origin serves version.json publicly (Access-Control-Allow-Origin
// pinned in vercel.json), so the check works from any production alias.
const CANONICAL_ORIGIN = "https://vibe-check-flame-nu.vercel.app";

/**
 * Notices when a newer deployment exists (by polling version.json on the
 * public production origin, which every build stamps) and offers a one-tap
 * reload. Checks on an interval and whenever the tab regains focus. Runs only
 * on the production deployment — preview/local builds carry a one-off stamp
 * that can never match production, so they'd nag forever.
 */
export default function UpdateToast() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    // Gate on the build-time flag, not the current hostname: the production
    // build is served from several aliases (public origin + SSO-gated ones),
    // while every origin that would false-nag (preview deploys, `vite preview`
    // on any host, forks) is a non-production build.
    if (typeof __BUILD_ID__ === "undefined" || !__IS_PRODUCTION_BUILD__) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${CANONICAL_ORIGIN}/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { build } = await res.json();
        if (!cancelled && build && build !== __BUILD_ID__) setStale(true);
      } catch {
        // offline or transient; try again next tick
      }
    };

    check();
    const interval = setInterval(check, POLL_MS);
    const onFocus = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!stale) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 shadow-lg"
      style={{
        background: "var(--gh-ink)",
        color: "var(--gh-field)",
        zIndex: "var(--z-toast)",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <span className="text-sm">A newer version of vibe check is live.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-sm font-bold px-3 py-1.5 shrink-0"
        style={{ background: "var(--gh-gold)", color: "var(--gh-ink)" }}
      >
        Update now
      </button>
    </div>
  );
}
