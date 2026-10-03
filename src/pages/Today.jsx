import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Sprout, Orbit, ArrowRight } from "lucide-react";
import SanctuaryMark from "@/features/shell/SanctuaryMark";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert, JournalEntry, PracticeSession, Person } from "@/api/entities";
import { formatDay, todayKey } from "@/lib/dates";
import { LOW_MOOD } from "@/lib/symbolic-guard";
import { moonPhase } from "@/lib/resonance/moon";
import MoonGlyph from "@/features/loom/MoonGlyph";
import { daysKeptThisMonth, daysKeptLabel } from "@/lib/record-days";
import SkyField from "@/features/shell/SkyField";
import PageTransition from "@/features/shell/PageTransition";
import CheckInCeremony from "@/features/today/CheckInCeremony";
import TodaySummary from "@/features/today/TodaySummary";
import AlertInline from "@/features/today/AlertInline";
import DailySupport from '@/features/today/DailySupport';
import { validDateKey, weekStartOf } from '@/lib/living-patterns';
import { createPageUrl } from "@/utils";
import { useSearchParamState } from "@/lib/deeplink";
import { useAuth } from "@/lib/AuthContext";
import { fetchRecordPart, recordKey, usePreferences, useRecentJournalDays } from "@/features/patterns/useLivingData";
import LoadingState from "@/features/shell/LoadingState";
import { useKeptSaves } from "@/features/shell/KeptSaves";
import { isConnectionError, needsChoice } from "@/lib/kept-saves";
import { signedInAs } from "@/api/supabase";
import WeekReady from "@/features/today/WeekReady";
import { RECENT_DAYS, markWeekSeen, readyWeek, weekSeen, weekSeenKey } from "@/lib/week-ready";

// The choices load when one waits, as they're rarely needed. The service
// worker keeps them from the start (vite.config.js), so they open offline too.
function KeptChoices(props) {
  const [List, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    import("@/features/shell/KeptSavesList").then((module) => { if (active) setList(() => module.default); }, () => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (failed) return <p className="living-error text-sm" role="alert">The choices couldn't load. Reload the app to see them.</p>;
  return List ? <List {...props} /> : null;
}

/**
 * State-adaptive landing:
 *   not yet checked in  -> sky register, the ceremony invitation
 *   checked in          -> field register, reflection surface
 */
export default function Today() {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [keptDays, setKeptDays] = useState(0);
  const [hasHistory, setHasHistory] = useState(false);
  // The day of someone's first check-in, when the welcome note shows.
  const [firstDay, setFirstDay] = useState(false);
  const [mode, setMode] = useState("landing"); // landing | ceremony | peek
  // ?date=yyyy-MM-dd lets you write a past day (never a future one).
  const [dateParam, setDateParam] = useSearchParamState("date", "");
  const targetDate = validDateKey(dateParam) && dateParam <= todayKey() ? dateParam : todayKey();
  const isBackfill = targetDate !== todayKey();
  const [backfillEntry, setBackfillEntry] = useState(null);
  const [loadedBackfillDate, setLoadedBackfillDate] = useState(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  // The history couldn't load for want of a connection: a check-in can still
  // be kept on this device.
  const [offline, setOffline] = useState(false);
  // The days with a check-in, for the week-ready note.
  const [checkInDates, setCheckInDates] = useState([]);

  useEffect(() => {
    if (!isBackfill) { setBackfillEntry(null); setBackfillLoading(false); return; }
    let active = true;
    setBackfillLoading(true);
    DailyCheckIn.filter({ date: targetDate }).then(([e]) => { if (active) { setBackfillEntry(e || null); setLoadedBackfillDate(targetDate); } }).catch((err) => { if (active) setLoadError(err.message); }).finally(() => { if (active) setBackfillLoading(false); });
    setMode("ceremony");
    return () => { active = false; };
  }, [targetDate, isBackfill]);

  useEffect(() => { if (dateParam === todayKey()) setMode("ceremony"); }, [dateParam]);

  const client = useQueryClient();
  const { user } = useAuth();
  // Opening Today reads the check-ins afresh, since a check-in begun here
  // must start from what is stored; they are kept for the other pages. After
  // a save the cached copy already holds the kept day, so it is shown as is.
  // A background load updates the page without the loading screen, so a
  // check-in open meanwhile stays open: the connection coming back, or a
  // check-in kept on this device reaching the account.
  const load = useCallback(async ({ fresh = true, cached = false, background = false } = {}) => {
    if (!background) setLoading(true);
    try {
      // Requests that would go out signed out (a session waiting to be renewed
      // after a long time offline) come back empty rather than failing, and
      // the day would look unwritten. That counts as no connection yet.
      if (!(await signedInAs(user?.id))) throw Object.assign(new Error('The session is waiting to be renewed.'), { name: 'AuthRetryableFetchError' });
      const [checkIns, openAlerts, me, keptOther] = await Promise.all([
        fetchRecordPart(client, user?.id, 'checkIns', { fresh, cached }),
        BoundaryAlert.filter({ is_acknowledged: false }).catch(() => []),
        base44.auth.me().catch(() => null),
        // Moments, people and practices count as history too, so only a truly
        // first visit gets the one-action welcome. A part another page has
        // loaded answers without asking. Unknown counts as history.
        Promise.all([['journal', JournalEntry], ['people', Person], ['sessions', PracticeSession]].map(([part, entity]) => {
          const rows = client.getQueryData(recordKey(user?.id, part));
          return rows ? rows.length > 0 : entity.list("-created_date", 1).then((list) => list.length > 0);
        })).then((found) => found.some(Boolean), () => true),
      ]);
      const today = checkIns.find((c) => c.date === todayKey()) || null;
      setEntry(today);
      // Notices are opt-in. Turning them on marks older ones as seen (Settings).
      setAlerts(me?.boundary_settings?.notices_enabled ? openAlerts : []);
      setKeptDays(daysKeptThisMonth(checkIns, todayKey()));
      setHasHistory(checkIns.length > 0 || keptOther);
      setFirstDay(checkIns.length === 1 && checkIns[0].date === todayKey());
      setCheckInDates(checkIns.map((row) => row.date));
      setOffline(false);
    } catch (err) {
      if (isConnectionError(err)) {
        // Unknown counts as history, as above.
        setOffline(true);
        setHasHistory(true);
      } else if (!background) {
        setLoadError(err.message || 'Could not load your check-ins.');
      }
    }
    if (!background) setLoading(false);
  }, [client, user?.id]);

  useEffect(() => { load(); }, [load]);
  // The history loads once the connection is back: when the browser says so,
  // and every minute, for a connection that's up but couldn't reach the account.
  useEffect(() => {
    if (!offline) return undefined;
    const retry = () => load({ background: true });
    window.addEventListener('online', retry);
    const timer = window.setInterval(retry, 60_000);
    return () => {
      window.removeEventListener('online', retry);
      window.clearInterval(timer);
    };
  }, [offline, load]);

  // Today's check-in kept on this device shows as kept until it's saved to
  // the account. Once it is, or the account turns out to hold a different
  // version of the day, the stored day is read again; one waiting for the
  // person's choice leaves the stored day in view, with the choice beside it.
  const kept = useKeptSaves(user?.id);
  const choices = kept.filter(needsChoice);
  const keptToday = kept.find((save) => save.kind === 'check-in' && save.payload?.date === todayKey()) || null;
  const keptState = !keptToday ? 'none' : needsChoice(keptToday) ? 'choice' : 'waiting';
  const lastKeptState = useRef(keptState);
  useEffect(() => {
    if (lastKeptState.current === 'waiting' && keptState !== 'waiting') load({ background: true });
    lastKeptState.current = keptState;
  }, [keptState, load]);
  // Opened again, the kept check-in counts as of the newest saved version
  // it holds (updated_at), so an older draft isn't brought back over it.
  const shown = keptState === 'waiting' ? { ...keptToday.payload, keptOnDevice: true, keptPayload: keptToday.payload, keptBase: keptToday.base ?? null, updated_at: keptToday.seen ?? null } : entry;
  // Last week's report, once it holds something, until it's opened (Reports
  // marks it) or the note is hidden. It waits for the person's week start, so
  // the week is theirs, and follows another tab opening the report.
  const preferences = usePreferences().data;
  const journalDays = useRecentJournalDays(RECENT_DAYS);
  const [weekSeenAt, setWeekSeenAt] = useState(() => weekSeen(user?.id));
  useEffect(() => {
    const onStorage = (event) => { if (event.key === null || event.key === weekSeenKey(user?.id)) setWeekSeenAt(weekSeen(user?.id)); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.id]);
  const week = preferences === undefined ? null : readyWeek({ today: todayKey(), weekStartsOn: weekStartOf(preferences), recordedDates: [...checkInDates, ...journalDays], seen: weekSeenAt });
  // The page's heading takes the focus Hide had, as the note goes.
  const headingRef = useRef(null);
  const hideWeek = () => {
    if (!week) return;
    markWeekSeen(user?.id, week.start);
    setWeekSeenAt(week.start);
    headingRef.current?.focus();
  };
  // What a check-in opened with stays its starting point while it's open,
  // so a background load finishing meanwhile doesn't start it over.
  const openedWith = useRef(null);
  if (mode !== "ceremony") openedWith.current = null;

  const moon = moonPhase(todayKey());
  const dateLine = formatDay(todayKey(), { style: 'long' });

  if (loadError) return <div className="living-page"><p className="living-error" role="alert">{loadError}</p><button className="ink-button mt-4" onClick={() => window.location.reload()}>Reload your history</button></div>;
  if (loading || (isBackfill && loadedBackfillDate !== targetDate) || backfillLoading) return <div className="living-page"><LoadingState variant="page" label="Opening this day's record…" /></div>;

  if (mode === "ceremony") {
    // historyKnown: whether the stored day was in view when it opened.
    if (openedWith.current?.date !== targetDate) openedWith.current = { date: targetDate, existing: isBackfill ? backfillEntry : shown, historyKnown: isBackfill || !offline };
    const { existing, historyKnown } = openedWith.current;
    const close = () => { setMode("landing"); setDateParam(""); };
    // A check-in kept on this device changed nothing in the account, so
    // there's nothing to read again.
    return (
      <CheckInCeremony
        key={`${targetDate}:${existing?.id || (existing?.keptOnDevice ? 'kept' : 'new')}`}
        dateKey={targetDate}
        existing={existing}
        historyKnown={historyKnown}
        onDone={(_saved, { kept: keptHere } = {}) => { close(); if (!keptHere) load({ cached: true }); }}
        onCancel={close}
      />
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] field-wash" aria-busy="true" />;
  }

  // ── pre-check-in: the invitation. A first visit gets one thing to do:
  // the first check-in. Paths, reports and preferences wait until there is
  // something to show. ──
  if (!shown && mode !== "peek" && !choices.length) {
    const isFirstRun = !hasHistory;
    return (
      <><SkyField className="today-invitation" film>
        <PageTransition className="today-content">
          <div className="today-date"><span>{dateLine}</span><span>{moon.name}</span></div>
          <div className="today-heading">
            <p className="sanctuary-eyebrow">A MOMENT, JUST FOR YOU</p>
            <h1 ref={headingRef} tabIndex={-1} className="outline-none">{isFirstRun ? "Welcome to your sanctuary." : "Come back to yourself."}</h1>
            <p>{isFirstRun ? "Keep a private record of your days. See your patterns over time, and find practices that fit what you need." : "What happened, how did it feel, and what do you want to remember? A short check-in is enough."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="cream-button gap-5" onClick={() => setMode("ceremony")}>{isFirstRun ? "Begin your first check-in" : "Begin check-in"}<ArrowRight size={16} aria-hidden="true" /></button>
              {!isFirstRun && <button type="button" className="ghost-cream-button" onClick={() => setMode("peek")}>Explore your reflections</button>}
            </div>
            {keptDays > 0 && <p className="mt-6 text-xs">{daysKeptLabel(keptDays, todayKey())}. Any time today works.</p>}
            {offline && <p className="mt-6 text-xs" role="status">Your history will load when you're back online. A check-in now is kept on this device until then.</p>}
            {week && <WeekReady week={week} onHide={hideWeek} tone="sky" />}
          </div>
          {!isFirstRun && <nav className="today-paths" aria-label="Explore your sanctuary">
            <Link to={createPageUrl("Analytics")}><Sprout size={24} aria-hidden="true" /><strong>Your patterns</strong><span>See what helps you grow.</span></Link>
            <Link to={createPageUrl("Practice")}><Leaf size={24} aria-hidden="true" /><strong>Help for this moment</strong><span>A practice for how you feel.</span></Link>
            <Link to="/Analytics?tab=reports"><Orbit size={24} aria-hidden="true" /><strong>Weekly & monthly reports</strong><span>The whole story stays in view.</span></Link>
          </nav>}
        </PageTransition>
      </SkyField>{!isFirstRun && <div className="living-page"><DailySupport /></div>}</>
    );
  }

  // ── post-check-in (or peeking): reflection surface ──
  return (
    <div className="field-wash min-h-screen">
      <PageTransition className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <header>
          <div className="reflection-header"><div><p className="sanctuary-eyebrow">YOUR DAILY SANCTUARY</p><h1 ref={headingRef} tabIndex={-1} className="outline-none">A little more understanding.</h1></div><SanctuaryMark size={62} /></div>
          <p className="text-sm" style={{ color: "var(--gh-ink-muted)" }}>
            {dateLine} · <span className="inline-flex items-center gap-1.5"><MoonGlyph name={moon.name} illumination={moon.illumination} />{moon.name}</span>{keptDays > 0 && ` · ${daysKeptLabel(keptDays, todayKey())}`}
          </p>
          {shown?.keptOnDevice && <p className="mt-3 text-sm" role="status" style={{ color: "var(--gh-ink)" }}>Today's check-in is kept on this device until it's saved to your account.</p>}
          {offline && !shown?.keptOnDevice && <p className="mt-3 text-sm" role="status" style={{ color: "var(--gh-ink)" }}>Your history will load when you're back online.</p>}
          {!shown && (
            <div className="mt-4 p-4 flex items-center justify-between" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}>
              <span className="text-sm" style={{ color: "var(--gh-ink)" }}>Today is still unwritten.</span>
              <button type="button" className="ink-button text-sm py-2" onClick={() => setMode("ceremony")}>
                Begin check-in
              </button>
            </div>
          )}
        </header>

        {choices.length > 0 && (
          <section className="living-inset space-y-3" aria-labelledby="kept-choices-heading">
            <h2 id="kept-choices-heading" className="living-label">Kept on this device: your choice</h2>
            <p className="living-muted text-sm">{choices.length === 1 ? "This was kept on this device while you were offline. Choose what happens to it." : "These were kept on this device while you were offline. Choose what happens to each."}</p>
            <KeptChoices userId={user?.id} saves={choices} />
          </section>
        )}

        <AlertInline alerts={alerts} onAcknowledged={(id) => setAlerts((a) => a.filter((x) => x.id !== id))} />

        {shown && <TodaySummary entry={shown} onEdit={() => setMode("ceremony")} />}
        {week && <WeekReady week={week} onHide={hideWeek} />}
        <DailySupport welcome={firstDay} />

        <nav aria-label="Continue" className="flex flex-wrap gap-4 hairline pt-6 text-sm font-medium">
          <Link to={createPageUrl("Analytics")} style={{ color: "var(--gh-accent)" }}>See your patterns</Link>
          <Link to={createPageUrl("Practice")} style={{ color: "var(--gh-accent)" }}>Find a practice</Link>
          {/* After a hard day, support comes before the optional systems. */}
          {shown?.mood_score != null && Number(shown.mood_score) <= LOW_MOOD
            ? <Link to="/support-now" style={{ color: "var(--gh-accent)" }}>Support now</Link>
            : <Link to={createPageUrl("CosmicAddons")} style={{ color: "var(--gh-accent)" }}>Explore optional systems</Link>}
        </nav>
      </PageTransition>
    </div>
  );
}
