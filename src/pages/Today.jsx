import React, { useCallback, useEffect, useState } from "react";
import { Leaf, Sprout, Orbit, ArrowRight } from "lucide-react";
import SanctuaryMark from "@/features/shell/SanctuaryMark";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import { format } from "date-fns";
import { todayKey, parseLocalDate, hoursSince } from "@/lib/dates";
import { moonPhase } from "@/lib/resonance/moon";
import MoonGlyph from "@/features/loom/MoonGlyph";
import { computeStreak, streakLabel } from "@/lib/streaks";
import { migratePeople } from "@/lib/people";
import { Person, Relationship, Connection } from "@/entities/all";
import SkyField from "@/features/shell/SkyField";
import PageTransition from "@/features/shell/PageTransition";
import CheckInCeremony from "@/features/today/CheckInCeremony";
import TodaySummary from "@/features/today/TodaySummary";
import AlertInline from "@/features/today/AlertInline";
import DailySupport from '@/features/today/DailySupport';
import { validDateKey } from '@/lib/living-patterns';
import { createPageUrl } from "@/utils";
import { useSearchParamState } from "@/lib/deeplink";

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
  // ?date=yyyy-MM-dd lets you write a past day (never a future one).
  const [dateParam, setDateParam] = useSearchParamState("date", "");
  const targetDate = validDateKey(dateParam) && dateParam <= todayKey() ? dateParam : todayKey();
  const isBackfill = targetDate !== todayKey();
  const [backfillEntry, setBackfillEntry] = useState(null);
  const [loadedBackfillDate, setLoadedBackfillDate] = useState(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isBackfill) { setBackfillEntry(null); setBackfillLoading(false); return; }
    let active = true;
    setBackfillLoading(true);
    DailyCheckIn.filter({ date: targetDate }).then(([e]) => { if (active) { setBackfillEntry(e || null); setLoadedBackfillDate(targetDate); } }).catch((err) => { if (active) setLoadError(err.message); }).finally(() => { if (active) setBackfillLoading(false); });
    setMode("ceremony");
    return () => { active = false; };
  }, [targetDate, isBackfill]);

  useEffect(() => { if (dateParam === todayKey()) setMode("ceremony"); }, [dateParam]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [checkIns, openAlerts, me] = await Promise.all([
        DailyCheckIn.all("-date"),
        BoundaryAlert.filter({ is_acknowledged: false }).catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      const today = checkIns.find((c) => c.date === todayKey()) || null;
      setEntry(today);
      // Notices are opt-in; older ones stay hidden unless the person turned them on.
      setAlerts(me?.boundary_settings?.notices_enabled ? openAlerts : []);
      setStreak(computeStreak(checkIns, todayKey()));
      if (!today && checkIns[0]?.created_date) setLastEntryAt(checkIns[0].created_date);
    } catch (err) {
      setLoadError(err.message || 'Could not load your check-ins.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // one-time data migration, safe to call every mount
    migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
  }, [load]);

  // Ambient tab title: a quiet nudge while today is unwritten.
  useEffect(() => {
    document.title = !loading && !entry ? "Vibe Check — your evening awaits" : "Vibe Check";
    return () => { document.title = "Vibe Check"; };
  }, [loading, entry]);

  const moon = moonPhase(todayKey());
  const dateLine = format(parseLocalDate(todayKey()), "EEEE, MMMM d");

  if (loadError) return <div className="living-page"><p className="living-error" role="alert">{loadError}</p><button className="ink-button mt-4" onClick={() => window.location.reload()}>Reload your history</button></div>;
  if (loading || (isBackfill && loadedBackfillDate !== targetDate) || backfillLoading) return <div className="living-page" role="status">Opening this day's record…</div>;

  if (mode === "ceremony") {
    return (
      <CheckInCeremony
        key={`${targetDate}:${(isBackfill ? backfillEntry : entry)?.id || 'new'}`}
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

  // ── pre-check-in: the invitation (first-run gets the welcome) ──
  if (!entry && mode !== "peek") {
    const isFirstRun = !lastEntryAt && streak === 0;
    return (
      <><SkyField className="today-invitation" film>
        <PageTransition className="today-content">
          <div className="today-date"><span>{dateLine}</span><span>{moon.name}{lastEntryAt ? ` · ${hoursSince(lastEntryAt)} hours since your last entry` : ""}</span></div>
          <div className="today-heading">
            <p className="sanctuary-eyebrow">A MOMENT, JUST FOR YOU</p>
            <h1>{isFirstRun ? "Welcome to your sanctuary." : "Come back to yourself."}</h1>
            <p>{isFirstRun ? "Keep a private record of your days. See your patterns over time, with the plants guiding you toward practices that fit what you need." : "What happened, how did it feel, and what do you want to remember? A short check-in is enough."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="cream-button gap-5" onClick={() => setMode("ceremony")}>{isFirstRun ? "Begin your first check-in" : "Begin check-in"}<ArrowRight size={16} aria-hidden="true" /></button>
              <button type="button" className="ghost-cream-button" onClick={() => setMode("peek")}>Explore your reflections</button>
            </div>
            {streak > 0 && <p className="mt-6 text-xs">{streakLabel(streak)} kept. There is room for tonight.</p>}
          </div>
          <nav className="today-paths" aria-label="Explore your sanctuary">
            <Link to={createPageUrl("Analytics")}><Sprout size={24} aria-hidden="true" /><strong>Your patterns</strong><span>See what helps you grow.</span></Link>
            <Link to={createPageUrl("Practice")}><Leaf size={24} aria-hidden="true" /><strong>Help for this moment</strong><span>A practice for how you feel.</span></Link>
            <Link to="/Analytics?tab=reports"><Orbit size={24} aria-hidden="true" /><strong>Weekly & monthly reports</strong><span>The whole story stays in view.</span></Link>
          </nav>
        </PageTransition>
      </SkyField><div className="living-page"><DailySupport welcome={isFirstRun} /></div></>
    );
  }

  // ── post-check-in (or peeking): reflection surface ──
  return (
    <div className="field-wash min-h-screen">
      <PageTransition className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <header>
          <div className="reflection-header"><div><p className="sanctuary-eyebrow">YOUR DAILY SANCTUARY</p><h1>A little more understanding.</h1></div><SanctuaryMark size={62} /></div>
          <p className="text-sm" style={{ color: "var(--gh-ink-muted)" }}>
            {dateLine} · <span className="inline-flex items-center gap-1.5"><MoonGlyph name={moon.name} illumination={moon.illumination} />{moon.name}</span> · {streakLabel(streak)}
          </p>
          {!entry && (
            <div className="mt-4 p-4 flex items-center justify-between" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}>
              <span className="text-sm" style={{ color: "var(--gh-ink)" }}>Today is still unwritten.</span>
              <button type="button" className="ink-button text-sm py-2" onClick={() => setMode("ceremony")}>
                Begin check-in
              </button>
            </div>
          )}
        </header>

        <AlertInline alerts={alerts} onAcknowledged={(id) => setAlerts((a) => a.filter((x) => x.id !== id))} />

        {entry && <TodaySummary entry={entry} onEdit={() => setMode("ceremony")} />}
        <DailySupport />

        <nav aria-label="Continue" className="flex flex-wrap gap-4 hairline pt-6 text-sm font-medium">
          <Link to={createPageUrl("Analytics")} style={{ color: "var(--gh-accent)" }}>See your patterns</Link>
          <Link to={createPageUrl("Practice")} style={{ color: "var(--gh-accent)" }}>Find a practice</Link>
          <Link to={createPageUrl("CosmicAddons")} style={{ color: "var(--gh-accent)" }}>Explore optional systems</Link>
        </nav>
      </PageTransition>
    </div>
  );
}
