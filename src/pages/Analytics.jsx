import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DailyCheckIn, Person } from "@/entities/all";
import { patternReading } from "@/lib/wisdom/readings";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { parseLocalDate, addDaysKey, todayKey } from "@/lib/dates";
import { personCheckInStats } from "@/lib/people";
import { useSearchParamState } from "@/lib/deeplink";
import PageTransition from "@/features/shell/PageTransition";
import CorrelationCards from "@/features/patterns/CorrelationCards";
import WeekInReview from "@/features/patterns/WeekInReview";
import CosmicWisdomCard from "@/components/cosmic/CosmicWisdomCard";
import { createPageUrl } from "@/utils";

const RANGES = { "30": 30, "60": 60, "90": 90 };

/** Patterns: reflection over time. Charts, computed insights, wisdom archive. */
export default function Analytics() {
  const [checkIns, setCheckIns] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useSearchParamState("tab", "patterns");
  const [range, setRange] = useSearchParamState("range", "30");
  const [personId, setPersonId] = useSearchParamState("person", "");
  const [review] = useSearchParamState("review", "");
  const [oracle, setOracle] = useState(null);
  const [oracleBusy, setOracleBusy] = useState(false);
  const [oracleError, setOracleError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [ci, ppl] = await Promise.all([
          DailyCheckIn.list("-date", 120),
          Person.list().catch(() => []),
        ]);
        setCheckIns(ci);
        setPeople(ppl);
      } catch {
        // empty state below covers it
      }
      setLoading(false);
    })();
  }, []);

  const days = RANGES[range] || 30;

  const filtered = useMemo(() => {
    const cutoff = addDaysKey(todayKey(), -days);
    let rows = checkIns.filter((c) => c.date >= cutoff);
    if (personId) {
      const person = people.find((p) => p.id === personId);
      if (person) {
        rows = rows.filter((c) => c.person_ids?.includes(person.id) || personCheckInStats(person, [c]).mentions > 0);
      }
    }
    return rows;
  }, [checkIns, people, days, personId]);

  const chartData = useMemo(
    () => [...filtered].reverse().map((entry) => ({
      date: format(parseLocalDate(entry.date), "MMM d"),
      mood: entry.mood_score,
      energy: entry.energy_level,
      sleep: entry.sleep_quality,
    })),
    [filtered]
  );

  const moonData = useMemo(() => {
    const groups = {};
    for (const c of filtered) {
      if (c.moon_phase && c.mood_score != null) (groups[c.moon_phase] ||= []).push(c.mood_score);
    }
    return Object.entries(groups)
      .filter(([, moods]) => moods.length >= 2)
      .map(([phase, moods]) => ({ phase: phase.replace(" Moon", ""), avg: +(moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) }));
  }, [filtered]);

  const stats = useMemo(() => {
    const moods = filtered.map((c) => c.mood_score).filter((m) => m != null);
    const avg = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "–";
    const best = moods.length ? Math.max(...moods) : "–";
    return { entries: filtered.length, avg, best };
  }, [filtered]);

  const askOracle = async () => {
    const cacheKey = `oracle:${range}:${personId}:${todayKey()}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setOracle(JSON.parse(cached)); return; }
    setOracleBusy(true);
    setOracleError(null);
    try {
      // Read locally from your actual check-in data — no API.
      const result = patternReading(filtered.slice(0, 60));
      setOracle(result);
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      setOracleError(e?.message || "The oracle is quiet right now. Try again in a moment.");
    }
    setOracleBusy(false);
  };

  if (loading) return <div className="min-h-[60vh] field-wash" aria-busy="true" />;

  if (checkIns.length === 0) {
    return (
      <div className="field-wash min-h-screen">
        <PageTransition className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl" style={{ color: "var(--gh-ink)" }}>Patterns need days to grow from</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-muted)" }}>
            After a few evenings of checking in, this page starts telling you things you did not consciously know.
          </p>
          <Link to={createPageUrl("Today")} className="ink-button inline-block mt-6">Begin tonight's check-in</Link>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className="field-wash min-h-screen">
      <PageTransition className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl" style={{ color: "var(--gh-ink)" }}>Patterns</h1>
            <p className="text-sm mt-1" style={{ color: "var(--gh-ink-muted)" }}>What your days keep telling you</p>
          </div>
          <nav className="flex gap-1 text-sm font-medium" aria-label="Patterns sections">
            {[["patterns", "Patterns"], ["wisdom", "Wisdom archive"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className="px-4 py-2"
                style={tab === id
                  ? { background: "var(--gh-ink)", color: "var(--gh-field)" }
                  : { color: "var(--gh-ink-soft)", border: "1px solid hsl(var(--border))" }}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {tab === "wisdom" ? (
          <div className="grid md:grid-cols-2 gap-4">
            {["daily", "weekly", "monthly", "yearly"].map((p) => <CosmicWisdomCard key={p} periodType={p} />)}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-1" role="group" aria-label="Date range">
                {Object.keys(RANGES).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className="px-3 py-1.5 text-sm"
                    style={range === r
                      ? { background: "var(--gh-ink)", color: "var(--gh-field)" }
                      : { color: "var(--gh-ink-soft)", border: "1px solid hsl(var(--border))" }}
                  >
                    {r} days
                  </button>
                ))}
              </div>
              {people.length > 0 && (
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  aria-label="Filter by person"
                  className="px-3 py-1.5 text-sm bg-transparent"
                  style={{ border: "1px solid hsl(var(--border))", color: "var(--gh-ink-soft)" }}
                >
                  <option value="">Everyone</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>

            <div className="flex">
              {[["ENTRIES", stats.entries], ["AVERAGE MOOD", stats.avg], ["BRIGHTEST", stats.best]].map(([label, value], i) => (
                <div key={label} className={`flex-1 hairline pt-3 ${i > 0 ? "pl-4" : ""}`}>
                  <div className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>{label}</div>
                  <div className="font-display text-3xl" style={{ color: "var(--gh-ink)" }}>{value}</div>
                </div>
              ))}
            </div>

            <WeekInReview checkIns={checkIns} people={people} forceShow={review === "last"} />

            {chartData.length > 1 && (
              <section aria-label="Mood, energy and sleep over time">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--gh-ink-muted)" }} tickLine={false} axisLine={{ stroke: "rgba(90,36,48,0.25)" }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--gh-ink-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--gh-cream)", border: "1px solid rgba(90,36,48,0.2)", borderRadius: 0, fontSize: 12 }} />
                    <Line type="monotone" dataKey="mood" stroke="var(--gh-accent)" strokeWidth={2} dot={false} name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke="var(--gh-amber)" strokeWidth={1.5} dot={false} name="Energy" />
                    <Line type="monotone" dataKey="sleep" stroke="var(--gh-rose)" strokeWidth={1.5} dot={false} name="Sleep" />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {moonData.length >= 3 && (
              <section aria-label="Mood by moon phase">
                <h2 className="text-2xl mb-3" style={{ color: "var(--gh-ink)" }}>Mood under each moon</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={moonData} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                    <XAxis dataKey="phase" tick={{ fontSize: 11, fill: "var(--gh-ink-muted)" }} tickLine={false} axisLine={{ stroke: "rgba(90,36,48,0.25)" }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--gh-ink-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--gh-cream)", border: "1px solid rgba(90,36,48,0.2)", borderRadius: 0, fontSize: 12 }} />
                    <Bar dataKey="avg" fill="var(--gh-amber)" maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}

            <CorrelationCards checkIns={filtered} people={people} />

            <section aria-labelledby="oracle-heading" className="hairline pt-6">
              <div className="flex items-center justify-between">
                <h2 id="oracle-heading" className="text-2xl" style={{ color: "var(--gh-ink)" }}>Ask the oracle</h2>
                <button type="button" className="ink-button text-sm py-2" onClick={askOracle} disabled={oracleBusy || filtered.length < 5}>
                  {oracleBusy ? "Reading the threads…" : oracle ? "Read again" : "Read my patterns"}
                </button>
              </div>
              {filtered.length < 5 && (
                <p className="text-sm mt-2" style={{ color: "var(--gh-ink-muted)" }}>The oracle wants at least 5 entries in range before speaking.</p>
              )}
              {oracleError && <p className="text-sm mt-2" style={{ color: "hsl(var(--destructive))" }}>{oracleError}</p>}
              {oracle && (
                <div className="mt-4 p-5 whitespace-pre-line text-sm max-w-prose" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", color: "var(--gh-ink)" }}>
                  {oracle}
                </div>
              )}
            </section>
          </>
        )}
      </PageTransition>
    </div>
  );
}
