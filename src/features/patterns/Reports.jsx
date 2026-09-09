import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, ArrowRight } from 'lucide-react';
import { ReportReflection } from '@/api/entities';
import { reportPeriod, previousPeriod, buildReport, entryText } from '@/lib/living-patterns';
import { addDaysKey, todayKey } from '@/lib/dates';
import { practiceById, ALIGNMENTS } from '@/lib/practices';
import TobaccoGuide from '@/features/shell/TobaccoGuide';
import StressPatternCards from './StressPatternCards';
import { EntryLink } from './Journal';

export default function Reports({ data, onChanged, savePreferences, onExport }) {
  const [params, setParams] = useSearchParams();
  const type = params.get('period') === 'monthly' ? 'monthly' : 'weekly';
  const weekStart = data.preferences.week_start === 0 ? 0 : 1;
  const period = reportPeriod(type, params.get('reportDate') || todayKey(), weekStart);
  const report = useMemo(() => buildReport(data.entries, period, data.sessions, data.people, data.preferences.pattern_feedback), [data, period.start, period.end, type]);
  const previous = previousPeriod(period, weekStart);
  const comparison = buildReport(data.entries, previous, data.sessions, data.people, data.preferences.pattern_feedback);
  const saved = data.reflections.find((item) => item.period_type === type && item.period_key === period.start);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [momentsShown, setMomentsShown] = useState(6);
  const [themeEdit, setThemeEdit] = useState(null);
  useEffect(() => { setReflection(saved?.notes || ''); setError(''); setMomentsShown(6); }, [period.start, type, saved?.notes]);

  const archive = useMemo(() => {
    const dates = [...data.entries.map((entry) => entry.date), ...data.sessions.map((entry) => entry.date), ...data.reflections.filter((entry) => entry.period_type === type).map((entry) => entry.period_key)].sort();
    const first = dates[0] || todayKey();
    const periods = []; let item = reportPeriod(type, todayKey(), weekStart);
    while (item.end >= first) { periods.push(item); item = previousPeriod(item, weekStart); }
    return periods;
  }, [data.entries, data.sessions, data.reflections, type, weekStart]);
  function navigate(anchor, nextType = type) {
    setNotice('');
    setParams((previousParams) => { const next = new URLSearchParams(previousParams); next.set('tab', 'reports'); next.set('period', nextType); next.set('reportDate', anchor); return next; });
  }
  async function saveReflection() {
    setBusy(true); setError('');
    try {
      await ReportReflection.upsert({ period_type: type, period_key: period.start, notes: reflection }, 'user_id,period_type,period_key');
      await onChanged(); setNotice('Your reflection is saved with this report.');
    } catch (err) { setError(err.message); }
    setBusy(false);
  }
  const feedback = (key, value) => savePreferences({ pattern_feedback: { ...(data.preferences.pattern_feedback || {}), [key]: value } });
  async function saveTheme(key, value) {
    setBusy(true); setError('');
    try { await savePreferences({ theme_labels: { ...(data.preferences.theme_labels || {}), [key]: value } }); setThemeEdit(null); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }
  const themes = [...report.emotions.map((theme) => ({ ...theme, field: 'feeling' })), ...report.habits.map((theme) => ({ ...theme, field: 'habit' }))].filter((theme) => theme.sources.length > 1);

  return <div className="space-y-8">
    <section className="living-card space-y-5" aria-labelledby="report-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="sanctuary-eyebrow">YOUR WHOLE RECORD · ALWAYS FREE</p><h2 id="report-heading">{type === 'monthly' ? 'Your month, in perspective' : 'Your week, in perspective'}</h2></div><div className="living-chips" aria-label="Report frequency">{['weekly', 'monthly'].map((value) => <button className="living-chip capitalize" type="button" key={value} aria-pressed={type === value} onClick={() => navigate(period.start, value)}>{value}</button>)}</div></div>
      <div className="report-navigation"><button className="living-icon-button" aria-label="Previous report" onClick={() => navigate(previous.start)}><ChevronLeft size={20} /></button><label className="flex-1"><span className="sr-only">Report archive</span><select className="living-input" value={period.start} onChange={(e) => navigate(e.target.value)}>{!archive.some((item) => item.start === period.start) && <option value={period.start}>{period.start} – {period.end}</option>}{archive.map((item) => <option key={item.start} value={item.start}>{item.start} – {item.end}{item.end >= todayKey() ? ' · In progress' : ''}</option>)}</select></label><button className="living-icon-button" aria-label="Next report" disabled={period.end >= todayKey()} onClick={() => navigate(addDaysKey(period.end, 1))}><ChevronRight size={20} /></button></div>
      <p className="living-muted">{period.start} – {period.end} · {report.partial ? 'In progress; includes entries through today' : 'Completed period'} · Your local calendar{type === 'weekly' ? `, ${weekStart === 0 ? 'Sunday' : 'Monday'} week start` : ''}.</p>
      <div className="living-stats"><div><span>RECORDED DAYS</span><strong>{report.days}<small> / {report.calendarDays}</small></strong></div><div><span>UNRECORDED DAYS</span><strong>{report.missing}</strong></div><div><span>DAILY MOOD RANGE</span><strong>{report.moods ? `${report.moods.min}–${report.moods.max}` : '—'}<small>{report.moods ? ' / 10' : ''}</small></strong></div></div>
      <p className="living-muted text-sm">{report.rows.length} journal and daily entries. Daily mood uses {report.moods?.count || 0} check-ins; interaction feelings remain separate. Page filters do not narrow this full-period report.</p>
      <button className="living-secondary" type="button" onClick={() => onExport({ start: period.start, end: period.end > todayKey() ? todayKey() : period.end, report })}><Download size={16} />Preview a report export</button>
    </section>

    <TobaccoGuide>{report.days ? <>Let us keep the whole {type === 'monthly' ? 'month' : 'week'} in view. You recorded {report.days} days{report.missing ? ` and left ${report.missing} unrecorded` : ''}. A good moment can sit beside a difficult one. What do you want to remember about the pattern?</> : 'This period has no journal entries yet. Nothing needs to be invented to fill the space. You can begin with one moment or choose a practice for now.'}</TobaccoGuide>

    <section className="living-card space-y-4" aria-labelledby="comparison-heading"><h2 id="comparison-heading">Alongside the previous {type === 'monthly' ? 'month' : 'week'}</h2><div className="overflow-x-auto"><table className="living-table"><thead><tr><th>Recorded measure</th><th>This period{report.partial ? ' · partial' : ''}</th><th>{previous.start} – {previous.end}</th></tr></thead><tbody><tr><th>Days with entries</th><td>{report.days} / {report.calendarDays}</td><td>{comparison.days} / {comparison.calendarDays}</td></tr><tr><th>Average daily mood</th><td>{report.moods ? report.moods.mean.toFixed(1) : 'Not recorded'}</td><td>{comparison.moods ? comparison.moods.mean.toFixed(1) : 'Not recorded'}</td></tr><tr><th>Daily mood range</th><td>{report.moods ? `${report.moods.min}–${report.moods.max}` : 'Not recorded'}</td><td>{comparison.moods ? `${comparison.moods.min}–${comparison.moods.max}` : 'Not recorded'}</td></tr><tr><th>Interactions marked unsafe</th><td>{report.interactions.filter((entry) => entry.interaction_feeling === 'unsafe').length} / {report.interactions.length} labeled</td><td>{comparison.interactions.filter((entry) => entry.interaction_feeling === 'unsafe').length} / {comparison.interactions.length} labeled</td></tr></tbody></table></div><p className="living-muted text-xs">Different recording coverage can change these comparisons. An unrecorded experience is unknown.</p></section>

    <StressPatternCards patterns={report.patterns} data={data} onFeedback={feedback} />

    <section className="living-card space-y-5" aria-labelledby="themes-heading"><div><p className="sanctuary-eyebrow">FROM YOUR OWN TAGS</p><h2 id="themes-heading">What kept appearing</h2><p className="living-muted mt-2">Recurring feelings and habits, with the entries behind each. You can give a theme your own name or hide it.</p></div>
      {themes.length === 0 && <p className="living-muted">No repeated feeling or habit tags in this period. Your words are still available below.</p>}
      <div className="grid sm:grid-cols-2 gap-4">{themes.filter((theme) => data.preferences.theme_labels?.[`${theme.field}:${theme.label}`] !== false).map((theme) => {
        const key = `${theme.field}:${theme.label}`; const label = data.preferences.theme_labels?.[key] || theme.label;
        return <div className="living-inset" key={key}><p className="living-label">{label}</p><p className="living-muted text-xs mt-1">{theme.sources.length} entries tagged “{theme.label}” · {theme.field}</p><details className="mt-2"><summary className="text-sm underline cursor-pointer">View source entries</summary><div className="flex flex-wrap gap-3 mt-2">{theme.sources.map((entry) => <EntryLink key={entry.key} entry={entry}>{entry.date}{entry.kind === 'day' ? ' · day' : ' · journal'}</EntryLink>)}</div></details>{themeEdit?.key === key ? <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); saveTheme(key, themeEdit.value.trim() || theme.label); }}><input aria-label="Your name for this theme" className="living-input" value={themeEdit.value} maxLength={100} onChange={(e) => setThemeEdit({ key, value: e.target.value })} /><button className="living-secondary" disabled={busy}>Save</button></form> : <div className="text-xs flex gap-4 mt-3"><button className="underline" onClick={() => setThemeEdit({ key, value: label })}>Rename theme</button><button className="underline" disabled={busy} onClick={() => saveTheme(key, false)}>Hide theme</button></div>}</div>;
      })}</div>
    </section>

    <section className="space-y-4" aria-labelledby="report-words-heading"><div><h2 id="report-words-heading">The moments behind the report</h2><p className="living-muted mt-2">Your original words, including supportive and difficult moments.</p></div>{report.moments.slice(0, momentsShown).map((entry) => <article key={entry.key} className="living-card"><div className="flex flex-wrap justify-between gap-3"><EntryLink entry={entry}>{entry.date} · {entry.kind === 'day' ? 'Daily check-in' : 'Journal'}</EntryLink>{entry.interaction_feeling && <span className={`living-tag ${entry.interaction_feeling === 'unsafe' ? 'living-tag-alert' : ''}`}>{entry.interaction_feeling}</span>}</div><p className="whitespace-pre-wrap mt-4 text-sm">{entryText(entry)}</p>{entry.is_demo && <p className="living-muted text-xs mt-3">Demo entry</p>}</article>)}{report.moments.length > momentsShown && <button className="living-secondary" onClick={() => setMomentsShown((count) => count + 6)}>Read more moments ({report.moments.length - momentsShown})</button>}</section>

    <section className="living-card space-y-5" aria-labelledby="practice-review-heading"><div><p className="sanctuary-eyebrow">WHAT YOU TRIED</p><h2 id="practice-review-heading">Practice & feeling like yourself</h2></div>
      {report.practices.length ? report.practices.map((practice) => <div key={practice.id} className="living-inset"><h3>{practiceById(practice.id)?.title || practice.id}</h3><p className="living-muted mt-2">{practice.attempts.length} recorded attempts · {practice.withFeedback.length} with feedback · {practice.helpful.length} described as clearer, more connected, more able to begin, or more settled · {practice.uncomfortable.length} uncomfortable.</p><details className="mt-3"><summary className="text-sm underline cursor-pointer">Read practice responses</summary><ul className="mt-3 space-y-3">{practice.attempts.map((session) => <li key={session.id} className="text-sm"><strong>{session.date}</strong> · {session.outcome || 'No outcome recorded'}{session.is_demo ? ' · Demo' : ''}{session.alignment && <p>Alignment: {ALIGNMENTS.find((item) => item.id === session.alignment)?.label || session.alignment}</p>}{session.after_notes && <p className="whitespace-pre-wrap mt-1">{session.after_notes}</p>}</li>)}</ul></details></div>) : <p className="living-muted">No practice attempts were saved this period. A report never depends on completing a practice.</p>}
      <div><p className="living-label">Your sense of alignment</p><p className="living-muted mt-1">{report.alignments.length} journal or daily entries include how your response felt to you.</p><div className="living-chips mt-3">{ALIGNMENTS.map((item) => <span className="living-tag" key={item.id}>{item.label}: {report.alignments.filter((entry) => entry.stress_context.alignment === item.id).length}</span>)}</div><details className="mt-3"><summary className="text-sm underline cursor-pointer">Read alignment entries</summary><div className="mt-3 flex flex-wrap gap-3">{report.alignments.map((entry) => <EntryLink key={entry.key} entry={entry}>{entry.date} · {ALIGNMENTS.find((item) => item.id === entry.stress_context.alignment)?.label}</EntryLink>)}</div></details></div>
      <p className="living-muted text-xs">These are your reported experiences. Completing a practice does not prove it caused a change. Feeling calmer and acting in alignment are recorded separately.</p>
      <Link className="living-text-link" to="/Practice?tab=somatic">Choose a practice or revisit your responses <ArrowRight size={15} /></Link>
    </section>

    <section className="living-card space-y-4" aria-labelledby="report-reflection-heading"><h2 id="report-reflection-heading">What do you want to carry forward?</h2><p className="living-muted">{type === 'monthly' ? 'What keeps returning? Where did you have more choice? What would you like to try or protect next month?' : 'What repeated? When did you feel like yourself? What would you like to practice next week?'}</p><label className="living-label">Your optional reflection<textarea className="living-input mt-2" rows={5} maxLength={30000} value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Your understanding may change. Keep what matters to you now." /></label>{saved?.is_demo && <p className="living-muted text-xs">This saved reflection is demo data.</p>}{notice && <p role="status" className="living-success">{notice}</p>}{error && <p role="alert" className="living-error">{error}</p>}<div className="flex flex-wrap gap-3"><button className="ink-button" disabled={busy} onClick={saveReflection}>{busy ? 'Saving…' : 'Save reflection'}</button>{saved && <button className="living-secondary" disabled={busy} onClick={async () => { setBusy(true); try { await ReportReflection.delete(saved.id); await onChanged(); setReflection(''); setNotice('Reflection removed. The report remains available.'); } catch (err) { setError(err.message); } setBusy(false); }}>Remove saved reflection</button>}</div></section>
  </div>;
}
