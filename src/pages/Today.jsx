import React, { useCallback, useEffect, useState } from "react";
import { Leaf, Sprout, Orbit, ArrowRight } from "lucide-react";
import SanctuaryMark from "@/features/shell/SanctuaryMark";
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
import MoonGlyph from "@/features/loom/MoonGlyph";
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

  // Ambient tab title: a quiet nudge while today is unwritten.
  useEffect(() => {
    document.title = !loading && !entry ? "Vibe Check — your evening awaits" : "Vibe Check";
    return () => { document.title = "Vibe Check"; };
  }, [loading, entry]);

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

  // ── pre-check-in: the invitation (first-run gets the welcome) ──
  if (!entry && mode !== "peek") {
    const isFirstRun = !lastEntryAt && streak === 0;
    return (
      <SkyField className="today-invitation" film>
        <PageTransition className="today-content">
          <div className="today-date"><span>{dateLine}</span><span>{moon.name}{lastEntryAt ? ` · ${hoursSince(lastEntryAt)} hours since your last entry` : ""}</span></div>
          <div className="today-heading">
            <p className="sanctuary-eyebrow">A MOMENT, JUST FOR YOU</p>
            <h1>{isFirstRun ? "Welcome to your sanctuary." : "Come back to yourself."}</h1>
            <p>{isFirstRun ? "Take a breath. Notice how you feel. Start a small daily ritual, and discover the patterns that make you, you." : "Let the day settle. What felt good, what felt heavy, and what would you like to carry forward?"}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="cream-button gap-5" onClick={() => setMode("ceremony")}>{isFirstRun ? "Begin your first check-in" : "Begin check-in"}<ArrowRight size={16} aria-hidden="true" /></button>
              <button type="button" className="ghost-cream-button" onClick={() => setMode("peek")}>Explore your reflections</button>
            </div>
            {streak > 0 && <p className="mt-6 text-xs">{streakLabel(streak)} kept. There is room for tonight.</p>}
          </div>
          <nav className="today-paths" aria-label="Explore your sanctuary">
            <Link to={createPageUrl("Analytics")}><Sprout size={24} aria-hidden="true" /><strong>Your patterns</strong><span>See what helps you grow.</span></Link>
            <Link to={createPageUrl("Practice")}><Leaf size={24} aria-hidden="true" /><strong>A little practice</strong><span>Make room for reflection.</span></Link>
            <Link to={createPageUrl("CosmicAddons")}><Orbit size={24} aria-hidden="true" /><strong>Your cosmos</strong><span>Explore your inner connections.</span></Link>
          </nav>
        </PageTransition>
      </SkyField>
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
          <Link to={createPageUrl("Practice")} style={{ color: "var(--gh-accent)" }}>Pull a card</Link>
          <Link to={createPageUrl("CosmicAddons")} style={{ color: "var(--gh-accent)" }}>Visit your cosmos</Link>
        </nav>
      </PageTransition>
    </div>
  );
}
