import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import PageTransition from '@/features/shell/PageTransition';
import PlantVoice from '@/features/shell/PlantVoice';
import { useLivingData } from '@/features/patterns/useLivingData';
import Journal from '@/features/patterns/Journal';
import Reports from '@/features/patterns/Reports';
import StressPatternCards from '@/features/patterns/StressPatternCards';
import ExportHistory from '@/features/patterns/ExportHistory';
import PatternCalendar from '@/features/patterns/PatternCalendar';
import { todayKey, addDaysKey, parseLocalDate, diffDaysKeys } from '@/lib/dates';
import { filterEntries, historyChart, stateCards, stressPatterns, validDateKey } from '@/lib/living-patterns';
import { STRESS_STATES } from '@/lib/practices';
import { INTERACTION_FEELINGS } from '@/lib/people';

const RANGES = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['365', 'Year'], ['all', 'All time'], ['custom', 'Custom']];

// Symbolic wisdom lives in Cosmos now. Old links go there before the full
// history starts loading.
export default function Analytics() {
  const [params] = useSearchParams();
  if (params.get('tab') === 'wisdom') return <Navigate to="/CosmicAddons?tab=readings" replace />;
  return <Patterns />;
}

function Patterns() {
  const living = useLivingData();
  const [params, setParams] = useSearchParams();
  const [exporting, setExporting] = useState(null);
  const tab = params.get('tab') || 'patterns';
  const range = params.get('range') || '90';
  const data = living.data;
  const lastDay = todayKey();
  const firstDay = data?.entries.at(-1)?.date || lastDay;
  const end = range === 'custom' ? params.get('end') || lastDay : lastDay;
  const start = range === 'all' ? firstDay : range === 'custom' ? params.get('start') || firstDay : addDaysKey(lastDay, -(Number(range) || 30) + 1);
  const valid = validDateKey(start) && validDateKey(end) && start <= end && end <= lastDay;
  const filters = { start, end, person: params.get('person') || '', habit: params.get('habit') || '', state: params.get('state') || '', search: params.get('search') || '' };
  const filtered = useMemo(() => valid && data ? filterEntries(data.entries, filters) : [], [data, start, end, valid, filters.person, filters.habit, filters.state, filters.search]);
  const chart = useMemo(() => valid ? historyChart(filtered.filter((entry) => entry.kind === 'day'), start, end) : [], [filtered, start, end, valid]);
  // Connections are worked out on every day in the date range: filtering days
  // by a state, person, habit, or words first would pick them by what is being
  // compared. The filters then narrow which connections show. State cards are
  // plain counts of the days the person, habit, and words filters leave; the
  // feeling filter only picks which card shows, so its count keeps every day
  // as its base.
  const inRange = useMemo(() => valid && data ? filterEntries(data.entries, { start, end }) : [], [data, start, end, valid]);
  const rangePatterns = useMemo(() => stressPatterns(inRange, data?.people, data?.preferences?.pattern_feedback), [inRange, data]);
  const counts = useMemo(() => stateCards(filterEntries(inRange, { person: filters.person, habit: filters.habit, search: filters.search }), data?.preferences?.pattern_feedback), [inRange, filters.person, filters.habit, filters.search, data]);
  const patterns = useMemo(() => [
    ...rangePatterns.filter((pattern) => pattern.context.type !== 'state' && (!filters.state || pattern.state === filters.state)
      && (!filters.person || (pattern.context.type === 'person' && pattern.context.id === filters.person))
      && (!filters.habit || (pattern.context.type === 'habit' && pattern.context.id === filters.habit))),
    ...counts.filter((pattern) => !filters.state || pattern.state === filters.state),
  ], [rangePatterns, counts, filters.state, filters.person, filters.habit]);
  const habits = [...new Set((data?.entries || []).flatMap((entry) => entry.activities || []))].sort();
  const moods = filtered.filter((entry) => entry.kind === 'day' && entry.mood_score != null).map((entry) => Number(entry.mood_score));
  const recordedDays = new Set(filtered.map((entry) => entry.date)).size;
  const feedback = (key, value) => living.savePreferences((stored) => ({ pattern_feedback: { ...(stored.pattern_feedback || {}), [key]: value } }));
  function change(key, value) {
    setParams((previous) => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; });
  }
  function openExport(initial = { start, end }) { setExporting(initial); }

  if (living.isLoading) return <div className="living-page" role="status" aria-busy="true">Gathering your whole history…</div>;
  if (living.isError || !data) return <div className="living-page"><h1>Your history is still yours.</h1><p className="living-error mt-4" role="alert">We could not load it right now. {living.error?.message}</p><button className="ink-button mt-4" onClick={() => living.refetch()}>Try loading again</button></div>;

  const showExport = exporting || (params.get('export') === '1' ? { start, end } : null);
  return <div className="field-wash min-h-screen"><PageTransition className="living-page space-y-8">
    <header className="flex flex-wrap justify-between items-end gap-4"><div><p className="sanctuary-eyebrow">YOUR HISTORY BELONGS TO YOU · ALWAYS FREE</p><h1>The whole pattern.</h1><p className="living-muted mt-3">People, habits, hard days, good days. Keep them in view together.</p></div><div className="flex flex-wrap gap-3"><Link className="living-secondary" to={`/Summary?${new URLSearchParams(valid ? { start, end } : {})}`}><FileText size={16} aria-hidden="true" />A summary to share</Link><button className="living-secondary" onClick={() => openExport()}><Download size={16} />Choose an export</button></div></header>
    {living.reloadFailed && <p className="living-error" role="alert">Your record couldn't refresh, so what shows may be out of date. <button type="button" className="underline" onClick={() => living.refetch()}>{living.isFetching ? 'Trying…' : 'Try again'}</button></p>}
    <nav className="living-tabs" aria-label="Patterns sections">{[['patterns', 'Patterns'], ['reports', 'Weekly & monthly'], ['journal', 'Journal & history']].map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => change('tab', id)}>{label}</button>)}</nav>
    {['patterns', 'journal'].includes(tab) && <section className="living-card space-y-4" aria-label="History filters"><div className="living-chips" aria-label="Date range">{RANGES.map(([value, label]) => <button type="button" className="living-chip" key={value} aria-pressed={range === value} onClick={() => change('range', value)}>{label}</button>)}</div>
      {range === 'custom' && <div className="grid sm:grid-cols-2 gap-4"><label className="living-label">From<input type="date" className="living-input mt-2" max={lastDay} value={start} onChange={(e) => change('start', e.target.value)} /></label><label className="living-label">Through<input type="date" className="living-input mt-2" max={lastDay} value={end} onChange={(e) => change('end', e.target.value)} /></label></div>}
      <div className="grid sm:grid-cols-3 gap-3"><label className="living-label">Person<select className="living-input mt-2" value={filters.person} onChange={(e) => change('person', e.target.value)}><option value="">Everyone</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="living-label">Habit or activity<select className="living-input mt-2" value={filters.habit} onChange={(e) => change('habit', e.target.value)}><option value="">All habits</option>{habits.map((habit) => <option key={habit}>{habit}</option>)}</select></label><label className="living-label">Recorded feeling<select className="living-input mt-2" value={filters.state} onChange={(e) => change('state', e.target.value)}><option value="">All feelings</option>{STRESS_STATES.map((state) => <option value={state.id} key={state.id}>{state.label}</option>)}</select></label></div>
      <label className="living-label">Search your words<input className="living-input mt-2" type="search" value={filters.search} onChange={(e) => change('search', e.target.value)} placeholder="Find a phrase you want to revisit" /></label>
      <p className="living-muted text-xs">{start} – {end} · {filtered.length} of {data.entries.length} saved entries match. Untagged days do not establish that a person or habit was absent.</p>{!valid && <p role="alert" className="living-error">Choose a valid date range through today.</p>}
    </section>}
    {tab === 'reports' ? <Reports data={data} onChanged={living.refresh} savePreferences={living.savePreferences} onExport={openExport} /> : tab === 'journal' ? <Journal data={data} entries={filtered} onChanged={living.refresh} /> : <>
      <PlantVoice>A good day is part of your story. So are the difficult days that came before. Let us look at what repeats, what supports you, and where you want more choice.</PlantVoice>
      <div className="living-stats"><div><span>RECORDED DAYS IN VIEW</span><strong>{recordedDays}<small> / {valid ? diffDaysKeys(end, start) + 1 : '—'}</small></strong></div><div><span>DAILY MOOD RANGE</span><strong>{moods.length ? `${Math.min(...moods)}–${Math.max(...moods)}` : '—'}<small>{moods.length ? ' / 10' : ''}</small></strong></div><div><span>DAILY MOOD AVERAGE</span><strong>{moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : '—'}</strong></div></div>
      {valid && <PatternCalendar entries={filtered} start={start} end={end} weekStart={data.preferences.week_start === 0 ? 0 : 1} />}
      <section className="living-card space-y-5" aria-labelledby="history-chart-heading"><div><h2 id="history-chart-heading">Your days over time</h2><p className="living-muted mt-2">Daily mood, energy, sleep, and recorded stress. Gaps show days without a matching check-in.</p></div>
        {chart.some((point) => point.mood != null || point.stress != null) ? <><div className="flex flex-wrap gap-4 text-xs" aria-label="Chart legend">{[['Mood', 'var(--gh-accent)', 'solid'], ['Energy', 'var(--plot-energy)', 'dashed'], ['Sleep', 'var(--plot-sleep)', 'dotted'], ['Stress', 'var(--plot-stress)', 'dashed']].map(([label, color, style]) => <span key={label} className="inline-flex items-center gap-2"><span aria-hidden="true" style={{ width: 18, borderTop: `2px ${style} ${color}` }} />{label}</span>)}</div><ResponsiveContainer width="100%" height={290}><LineChart accessibilityLayer data={chart} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}><XAxis dataKey="date" tickFormatter={(value) => format(parseLocalDate(value), 'MMM d')} minTickGap={45} tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(value) => String(value)} contentStyle={{ borderRadius: 12, background: 'var(--gh-cream)', fontSize: 12 }} /><Line type="linear" dataKey="mood" name="Daily mood" stroke="var(--gh-accent)" strokeWidth={2} connectNulls={false} dot={chart.length < 40 ? { r: 2 } : false} /><Line type="linear" dataKey="energy" name="Energy" stroke="var(--plot-energy)" strokeDasharray="6 3" connectNulls={false} dot={false} /><Line type="linear" dataKey="sleep" name="Sleep" stroke="var(--plot-sleep)" strokeDasharray="2 3" connectNulls={false} dot={false} /><Line type="linear" dataKey="stress" name="Recorded stress" stroke="var(--plot-stress)" strokeDasharray="8 3" connectNulls={false} dot={false} /></LineChart></ResponsiveContainer><details><summary className="living-text-link cursor-pointer">Read chart values as a table</summary><div className="max-h-72 overflow-auto mt-4"><table className="living-table"><thead><tr><th>Date</th><th>Mood</th><th>Energy</th><th>Sleep</th><th>Stress</th></tr></thead><tbody>{chart.map((point) => <tr key={point.date}><th>{point.date}</th>{['mood', 'energy', 'sleep', 'stress'].map((field) => <td key={field}>{point[field] ?? 'Not recorded'}</td>)}</tr>)}</tbody></table></div></details></> : <p className="living-muted py-8">No daily scores in this view. Journal moments and individual interaction feelings are available below.</p>}
        {chart.some((point) => point.stressKind === 'at-check-in') && chart.some((point) => point.stressKind === 'highest-today') && <p className="living-muted text-xs">This view mixes two kinds of check-in stress: older check-ins rated stress at that moment, newer ones rate the day's highest. Each check-in in your journal says which.</p>}
        <Link className="living-text-link" to={`/Analytics?${new URLSearchParams({ ...Object.fromEntries(params), tab: 'journal' })}`}>Read the entries behind this view <ArrowRight size={15} /></Link>
      </section>
      {filtered.some((entry) => entry.interaction_feeling) && <section className="living-card space-y-4"><h2>How interactions felt</h2><p className="living-muted">Your labels for individual encounters, kept separate from the day’s mood.</p><div className="living-chips">{INTERACTION_FEELINGS.map((feeling) => <span key={feeling} className={`living-tag ${feeling === 'unsafe' ? 'living-tag-alert' : ''}`}>{feeling}: {filtered.filter((entry) => entry.interaction_feeling === feeling).length}</span>)}</div><Link className="living-text-link" to={`/Analytics?${new URLSearchParams({ ...Object.fromEntries(params), tab: 'journal' })}`}>Read these moments <ArrowRight size={15} /></Link></section>}
      <StressPatternCards patterns={patterns} data={data} onFeedback={feedback} />
      <div className="living-card flex flex-wrap justify-between items-center gap-4"><div><h2>See the week or month together.</h2><p className="living-muted mt-2">Source entries, recurring themes, and relevant practices.</p></div><button className="ink-button" onClick={() => change('tab', 'reports')}>Open your reports <ArrowRight size={15} /></button></div>
    </>}
    {showExport && <ExportHistory data={data} initial={showExport} onClose={() => { setExporting(null); change('export', ''); }} />}
  </PageTransition></div>;
}
