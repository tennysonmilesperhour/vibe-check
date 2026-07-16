import React, { useEffect, useState } from "react";

const POLL_MS = 3 * 60 * 1000;

// The public production origin — keep in sync with the og: URLs in index.html,
// and update both when a custom domain lands. Polling must be absolute: every
// other alias of this app (vibe-check-tennysonmilesperhour.vercel.app, the
// git-main alias, per-deployment URLs) sits behind Vercel Deployment
// Protection, where a background fetch of /version.json gets a 302 to the SSO
// login and dies on CORS. This origin serves version.json publicly with
// Access-Control-Allow-Origin: *, so the check works from any origin.
const CANONICAL_ORIGIN = "https://vibe-check-flame-nu.vercel.app";

/**
 * Notices when a newer deployment exists (by polling version.json on the
 * public production origin, which every build stamps) and offers a one-tap
 * reload. Checks on an interval and whenever the tab regains focus. Dev
 * builds and local previews of production builds skip it.
 */
export default function UpdateToast() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (typeof __BUILD_ID__ === "undefined" || import.meta.env.DEV) return;
    // `vite preview` runs a production build whose stamp never matches the
    // deployed one; don't nag about updates there.
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;

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
