import "./UpdateToast.css";
import React, { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import { getVersionNotice, latestVersionUrl, LIVE_ORIGIN, UPDATE_POLL_MS, UPDATE_SNOOZE_MS } from "@/lib/app-version";

/** Offer the current live release from any deployed version, without reloading edits. */
export default function UpdateToast() {
  const [notice, setNotice] = useState(null);
  const [snoozed, setSnoozed] = useState(null);

  useEffect(() => {
    if (typeof __BUILD_ID__ === "undefined" || typeof __BUILD_ENVIRONMENT__ === "undefined") return;
    if (!["production", "preview"].includes(__BUILD_ENVIRONMENT__)) return;
    const current = {
      build: __BUILD_ID__,
      environment: window.location.origin === LIVE_ORIGIN ? "production" : __BUILD_ENVIRONMENT__,
    };
    let cancelled = false;
    let controller;
    let timeout;

    const check = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || controller) return;
      controller = new AbortController();
      timeout = window.setTimeout(() => controller?.abort(), 10000);
      try {
        const res = await fetch(`${LIVE_ORIGIN}/version.json?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const manifest = await res.json();
        if (!cancelled) setNotice(getVersionNotice(current, manifest));
      } catch {
        // Offline, SSO HTML or a transient failure: keep the app usable and retry.
      } finally {
        window.clearTimeout(timeout);
        controller = undefined;
      }
    };

    check();
    const interval = window.setInterval(check, UPDATE_POLL_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    return () => {
      cancelled = true;
      controller?.abort();
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
    };
  }, []);

  if (!notice || (snoozed?.build === notice.build && Date.now() < snoozed.until)) return null;

  return (
    <section className="app-update-toast" role="status" aria-live="polite" aria-labelledby="app-update-title">
      <RefreshCw size={19} className="app-update-icon" aria-hidden="true" />
      <div className="app-update-body">
        <p id="app-update-title">{notice.kind === "preview" ? "You’re viewing a preview" : "The live version has changed"}</p>
        <p className="app-update-description">Open the latest Vibe Check on this page. Save any edits first.</p>
        <button className="app-update-action" type="button"
          onClick={() => window.location.assign(latestVersionUrl(window.location.href, notice.build))}>
          Open latest version <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
      <button className="app-update-dismiss" type="button" aria-label="Remind me in 15 minutes"
        title="Remind me in 15 minutes"
        onClick={() => setSnoozed({ build: notice.build, until: Date.now() + UPDATE_SNOOZE_MS })}>
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
