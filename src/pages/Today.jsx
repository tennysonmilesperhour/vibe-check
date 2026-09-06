import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import { format } from "date-fns";
import { todayKey, parseLocalDate, hoursSince } from "@/lib/dates";
import { moonPhase } from "@/lib/resonance/moon";
import { computeStreak, streakLabel } from "@/lib/streaks";
import { migratePeople } from "@/lib/people";
import { Person, Relationship, Connection } from "@/entities/all";
import SkyField from "@/features/shell/SkyField";
import PageTransition from "@/features/shell/PageTransition";
import CheckInCeremony from "@/features/today/CheckInCeremony";
import TodaySummary from "@/features/today/TodaySummary";
import AlertInline from "@/features/today/AlertInline";
import CosmicWisdomCard from "@/components/cosmic/CosmicWisdomCard";
import MiniLoom from "@/features/loom/MiniLoom";
import WeatherLine from "@/features/today/WeatherLine";
import { createPageUrl } from "@/utils";
import { useSearchParamState } from "@/lib/deeplink";
import { useAuth } from "@/lib/AuthContext";
import { isNativeApp } from "@/lib/native";
import { Bell } from "lucide-react";

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * State-adaptive landing:
 *   not yet checked in  -> sky register, the ceremony invitation
 *   checked in          -> field register, reflection surface
 */
export default function Today() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastEntryAt, setLastEntryAt] = useState(null);
  const [mode, setMode] = useState("landing"); // landing | ceremony | peek
  const [profile, setProfile] = useState(null);
  // ?date=yyyy-MM-dd lets you write a past day (never a future one).
  const [dateParam, setDateParam] = useSearchParamState("date", "");
  const targetDate = DATE_SHAPE.test(dateParam) && dateParam <= todayKey() ? dateParam : todayKey();
  const isBackfill = targetDate !== todayKey();
  const [backfillEntry, setBackfillEntry] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderNudgeDismissed, setReminderNudgeDismissed] = useState(false);

  useEffect(() => {
    if (!isBackfill) { setBackfillEntry(null); return; }
    let active = true;
    DailyCheckIn.filter({ date: targetDate })
      .then(([pastEntry]) => {
        if (!active) return;
        setBackfillEntry(pastEntry || null);
        setMode("ceremony");
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || "That day could not be loaded.");
      });
    return () => { active = false; };
  }, [targetDate, isBackfill]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [checkIns, openAlerts] = await Promise.all([
        DailyCheckIn.list("-date", 120),
        BoundaryAlert.filter({ is_acknowledged: false }).catch(() => []),
      ]);
      const today = checkIns.find((c) => c.date === todayKey()) || null;
      setEntry(today);
      setRecentCheckIns(checkIns);
      setAlerts(openAlerts);
      setStreak(computeStreak(checkIns, todayKey()));
      if (!today && checkIns[0]?.created_date) setLastEntryAt(checkIns[0].created_date);
    } catch (error) {
      setLoadError(error?.message || "Your check-ins could not be loaded.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    base44.auth.me().then((me) => {
      setProfile(me?.cosmic_profile || null);
      setReminderEnabled(Boolean(me?.boundary_settings?.reminder_enabled));
    }).catch(() => {});
    // one-time data migration, safe to call every mount
    migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    setReminderNudgeDismissed(
      localStorage.getItem(`vibe-check:reminder-nudge:${user.id}`) === "dismissed",
    );
  }, [user?.id]);

  useEffect(() => {
    const onSettingsSaved = (event) => {
      setReminderEnabled(Boolean(event.detail?.reminderEnabled));
    };
    window.addEventListener("vibe-check:settings-saved", onSettingsSaved);
    return () => window.removeEventListener("vibe-check:settings-saved", onSettingsSaved);
  }, []);

  const dismissReminderNudge = () => {
    if (user?.id) localStorage.setItem(`vibe-check:reminder-nudge:${user.id}`, "dismissed");
    setReminderNudgeDismissed(true);
  };

  const openReminderSettings = () => {
    window.dispatchEvent(new CustomEvent("vibe-check:open-settings"));
  };

  const moon = moonPhase(todayKey());
  const dateLine = format(parseLocalDate(todayKey()), "EEEE, MMMM d");

  if (mode === "ceremony") {
    return (
      <CheckInCeremony
        dateKey={targetDate}
        userId={user?.id}
        existing={isBackfill ? backfillEntry : entry}
        onDone={() => { setMode("landing"); setDateParam(""); load(); }}
        onCancel={() => { setMode("landing"); setDateParam(""); }}
      />
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] field-wash" aria-busy="true"><span className="sr-only">Loading today’s check-in</span></div>;
  }

  if (loadError) {
    return (
      <div className="field-wash min-h-screen">
        <main className="max-w-lg mx-auto px-6 py-20 text-center" role="alert">
          <h1 className="text-3xl" style={{ color: "var(--gh-ink)" }}>Your check-ins could not be loaded</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-soft)" }}>{loadError}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--gh-ink-muted)" }}>Your existing data has not been replaced or erased.</p>
          <button type="button" className="ink-button mt-6" onClick={load}>Try again</button>
        </main>
      </div>
    );
  }

  // ── pre-check-in: the invitation (first-run gets the welcome) ──
  if (!entry && mode !== "peek") {
    const isFirstRun = !lastEntryAt && streak === 0;
    return (
      <SkyField className="min-h-[calc(100vh-0px)]">
        <PageTransition className="weather-invitation max-w-3xl mx-auto px-6 py-16 md:py-24">
          <p className="text-sm" style={{ color: "rgba(255,253,246,0.85)" }}>
            {dateLine} · {moon.emoji} {moon.name}
            {lastEntryAt ? ` · ${hoursSince(lastEntryAt)} hours since your last entry` : ""}
          </p>
          <h1 className="mt-4 text-5xl md:text-7xl" style={{ color: "var(--gh-cream)", maxWidth: "12ch", lineHeight: 0.98 }}>
            {isFirstRun ? "Meet your inner weather" : "What was the atmosphere inside you today?"}
          </h1>
          {isFirstRun && (
            <p className="mt-5 text-base max-w-md" style={{ color: "rgba(255,253,246,0.9)" }}>
              Choose the sky that feels closest. Each evening leaves a small trace, and your patterns become clearer with time.
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <button type="button" className="cream-button" onClick={() => setMode("ceremony")}>
              {isFirstRun ? "Record your first weather" : "Record today's weather"}
            </button>
            {!isFirstRun && (
              <button type="button" className="ghost-cream-button" onClick={() => setMode("peek")}>
                Skip to reflection
              </button>
            )}
          </div>
          {streak > 0 && (
            <p className="mt-10 text-sm" style={{ color: "rgba(255,253,246,0.85)" }}>
              {streakLabel(streak)} kept so far. Tonight continues the run.
            </p>
          )}
        </PageTransition>
      </SkyField>
    );
  }

  // ── post-check-in (or peeking): reflection surface ──
  return (
    <div className="field-wash min-h-screen">
      <PageTransition className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <header>
          <p className="text-sm" style={{ color: "var(--gh-ink-muted)" }}>
            {dateLine} · {moon.emoji} {moon.name} · {streakLabel(streak)}
          </p>
          {!entry && (
            <div className="mt-4 p-4 flex items-center justify-between" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))" }}>
              <span className="text-sm" style={{ color: "var(--gh-ink)" }}>Today is still unwritten.</span>
              <button type="button" className="ink-button text-sm py-2" onClick={() => setMode("ceremony")}>
                Begin check-in
              </button>
            </div>
          )}
        </header>

        <AlertInline alerts={alerts} onAcknowledged={(id) => setAlerts((a) => a.filter((x) => x.id !== id))} />

        <WeatherLine />

        {entry && <TodaySummary entry={entry} checkIns={recentCheckIns} onEdit={() => setMode("ceremony")} />}

        {entry && isNativeApp && !reminderEnabled && !reminderNudgeDismissed && (
          <section
            className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5"
            style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))" }}
            aria-labelledby="reminder-nudge-title"
          >
            <Bell className="w-5 h-5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
            <div className="flex-1">
              <h2 id="reminder-nudge-title" className="font-display text-xl" style={{ color: "var(--gh-ink)" }}>
                Make tomorrow easier
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--gh-ink-soft)" }}>
                Choose a private evening reminder on this iPhone.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 px-4 text-sm" onClick={dismissReminderNudge}>
                Not now
              </button>
              <button type="button" className="ink-button min-h-11 px-4 text-sm" onClick={openReminderSettings}>
                Choose a time
              </button>
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <section aria-label="Today's wisdom">
            <CosmicWisdomCard periodType="daily" />
          </section>
          {profile && (
            <aside aria-label="Your Loom today" className="md:w-56">
              <MiniLoom profile={profile} />
            </aside>
          )}
        </div>

        <nav aria-label="Follow tonight's thread" className="tonight-thread">
          <p>Follow tonight's thread</p>
          <Link to={createPageUrl("Analytics")}><strong>See the climate</strong><span>Place today inside your longer pattern</span></Link>
          <Link to={createPageUrl("People")}><strong>Visit your orbit</strong><span>Notice who has been present lately</span></Link>
          <Link to={createPageUrl("Practice")}><strong>Open the table</strong><span>Reflect with tarot or oracle</span></Link>
          <Link to={createPageUrl("CosmicAddons")}><strong>Enter the Loom</strong><span>See the systems behind your sky</span></Link>
        </nav>
      </PageTransition>
    </div>
  );
}
