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

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * State-adaptive landing:
 *   not yet checked in  -> sky register, the ceremony invitation
 *   checked in          -> field register, reflection surface
 */
export default function Today() {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
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

  useEffect(() => {
    if (!isBackfill) { setBackfillEntry(null); return; }
    DailyCheckIn.filter({ date: targetDate }).then(([e]) => setBackfillEntry(e || null)).catch(() => {});
    setMode("ceremony");
  }, [targetDate, isBackfill]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [checkIns, openAlerts] = await Promise.all([
        DailyCheckIn.list("-date", 120),
        BoundaryAlert.filter({ is_acknowledged: false }).catch(() => []),
      ]);
      const today = checkIns.find((c) => c.date === todayKey()) || null;
      setEntry(today);
      setAlerts(openAlerts);
      setStreak(computeStreak(checkIns, todayKey()));
      if (!today && checkIns[0]?.created_date) setLastEntryAt(checkIns[0].created_date);
    } catch {
      // an empty Today is handled below; never blank-screen
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    base44.auth.me().then((me) => setProfile(me?.cosmic_profile || null)).catch(() => {});
    // one-time data migration, safe to call every mount
    migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
  }, [load]);

  const moon = moonPhase(todayKey());
  const dateLine = format(parseLocalDate(todayKey()), "EEEE, MMMM d");

  if (mode === "ceremony") {
    return (
      <CheckInCeremony
        dateKey={targetDate}
        existing={isBackfill ? backfillEntry : entry}
        onDone={() => { setMode("landing"); setDateParam(""); load(); }}
        onCancel={() => { setMode("landing"); setDateParam(""); }}
      />
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] field-wash" aria-busy="true" />;
  }

  // ── pre-check-in: the invitation ──
  if (!entry && mode !== "peek") {
    return (
      <SkyField className="min-h-[calc(100vh-0px)]">
        <PageTransition className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <p className="text-sm" style={{ color: "rgba(255,253,246,0.85)" }}>
            {dateLine} · {moon.emoji} {moon.name}
            {lastEntryAt ? ` · ${hoursSince(lastEntryAt)} hours since your last entry` : ""}
          </p>
          <h1 className="mt-4 text-5xl md:text-7xl" style={{ color: "var(--gh-cream)", maxWidth: "12ch", lineHeight: 0.98 }}>
            How did today actually feel?
          </h1>
          <div className="mt-10 flex flex-wrap gap-3">
            <button type="button" className="cream-button" onClick={() => setMode("ceremony")}>
              Begin check-in
            </button>
            <button type="button" className="ghost-cream-button" onClick={() => setMode("peek")}>
              Skip to reflection
            </button>
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

        {entry && <TodaySummary entry={entry} onEdit={() => setMode("ceremony")} />}

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

        <nav aria-label="Continue" className="flex flex-wrap gap-4 hairline pt-6 text-sm font-medium">
          <Link to={createPageUrl("Analytics")} style={{ color: "var(--gh-accent)" }}>See your patterns</Link>
          <Link to={createPageUrl("TarotReading")} style={{ color: "var(--gh-accent)" }}>Pull a card</Link>
          <Link to={createPageUrl("CosmicAddons")} style={{ color: "var(--gh-accent)" }}>Visit your cosmos</Link>
        </nav>
      </PageTransition>
    </div>
  );
}
