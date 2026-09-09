import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseLocalDate, todayKey } from '@/lib/dates';
import { entryText } from '@/lib/living-patterns';
import { CALENDAR_METRICS, calendarDays, calendarMonths, calendarSummary, scoreBand } from '@/lib/pattern-calendar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BANDS = ['0–2', '>2–4', '>4–6', '>6–8', '>8–10'];
const displayScore = (value) => Number.isInteger(value) ? String(value) : value.toFixed(1);

export default function PatternCalendar({ entries, start, end, weekStart = 1 }) {
  const [params, setParams] = useSearchParams();
  const metric = Object.hasOwn(CALENDAR_METRICS, params.get('calendarMetric')) ? params.get('calendarMetric') : 'mood';
  const chosenMonth = params.get('calendarMonth') || '';
  const chosenDate = params.get('calendarDay') || '';
  function choose(patch) {
    setParams((previous) => { const next = new URLSearchParams(previous); for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key); } return next; }, { replace: true });
  }
  const journalLink = (patch) => `/Analytics?${new URLSearchParams({ ...Object.fromEntries(params), tab: 'journal', ...patch })}`;
  const days = useMemo(() => calendarDays(entries, start, end, metric), [entries, start, end, metric]);
  const months = useMemo(() => calendarMonths(start, end, weekStart), [start, end, weekStart]);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const summary = useMemo(() => calendarSummary(days, metric), [days, metric]);
  const spec = CALENDAR_METRICS[metric];
  const month = months.find((item) => item.key === chosenMonth) || months.at(-1);
  if (!month) return null;
  const monthIndex = months.indexOf(month);
  const selectedDate = month.dates.includes(chosenDate) && byDate.has(chosenDate) ? chosenDate : month.dates.filter((date) => byDate.has(date)).at(-1);
  const selected = byDate.get(selectedDate);
  const weekdayOrder = Array.from({ length: 7 }, (_, index) => (index + weekStart) % 7);
  const styleFor = (day) => day?.value != null ? { backgroundColor: spec.colors[scoreBand(day.value)], color: spec.ink[scoreBand(day.value)] } : undefined;
  const dateLabel = (date) => format(parseLocalDate(date), 'EEEE, MMMM d, yyyy');
  const unsafeDays = days.filter((day) => day.unsafe).length;
  function selectMonth(key) { choose({ calendarMonth: key, calendarDay: '' }); }

  return <section className="pattern-calendar living-card space-y-6" aria-labelledby="pattern-calendar-heading">
    <header className="calendar-heading"><div><p className="sanctuary-eyebrow">SEE WHAT REPEATS</p><h2 id="pattern-calendar-heading">{spec.title} calendar</h2><p className="living-muted mt-2">{spec.description}</p></div><div className="living-chips" aria-label="Calendar measure">{Object.entries(CALENDAR_METRICS).map(([key, item]) => <button type="button" key={key} className="living-chip" aria-pressed={metric === key} onClick={() => choose({ calendarMetric: key })}>{item.label}</button>)}</div></header>
    <div className="calendar-legend" aria-label={`${spec.label} color scale, out of ten`}><div className="calendar-scale"><span>{spec.ends[0]}</span><div className="calendar-scale-bands">{BANDS.map((band, index) => <span key={band}><i aria-hidden="true" style={{ backgroundColor: spec.colors[index] }} /><span>{band}</span></span>)}</div><span>{spec.ends[1]}</span></div><div className="calendar-marker-key"><span><i className="calendar-no-score" aria-hidden="true" />No score</span><span><b aria-hidden="true">◆</b>Interaction marked unsafe</span></div></div>
    <p className="living-muted text-sm">{format(parseLocalDate(start), 'MMM d, yyyy')} – {format(parseLocalDate(end), 'MMM d, yyyy')} · {summary.recorded} scored days · {summary.missing} without a matching score. Colors use the same scale in every month.</p>

    {months.length > 1 && <div><p className="living-label mb-3">Scan the months. Choose one to look closer.</p><div className="calendar-months" aria-label="Monthly pattern overview">{months.map((item) => {
      const scored = item.dates.map((date) => byDate.get(date)).filter((day) => day?.value != null);
      return <button type="button" className="calendar-month-preview" key={item.key} aria-pressed={item.key === month.key} aria-label={`View ${format(parseLocalDate(item.first), 'MMMM yyyy')}, ${scored.length} scored days`} onClick={() => selectMonth(item.key)}><span className="calendar-month-title">{format(parseLocalDate(item.first), 'MMM yyyy')}<span>{scored.length} days</span></span><span className="calendar-mini-grid" aria-hidden="true">{Array.from({ length: item.offset }, (_, index) => <i key={`blank-${index}`} className="calendar-blank" />)}{item.dates.map((date) => <i key={date} className={`${!byDate.has(date) ? 'calendar-outside' : byDate.get(date)?.value == null ? 'calendar-no-score' : ''}`} style={styleFor(byDate.get(date))}>{byDate.get(date)?.unsafe ? <b /> : null}</i>)}</span></button>;
    })}</div></div>}

    <div className="calendar-detail-grid">
      <div><div className="calendar-month-nav"><button type="button" className="calendar-arrow" aria-label="Previous calendar month" disabled={monthIndex === 0} onClick={() => selectMonth(months[monthIndex - 1].key)}><ChevronLeft size={19} /></button><h3>{format(parseLocalDate(month.first), 'MMMM yyyy')}</h3><button type="button" className="calendar-arrow" aria-label="Next calendar month" disabled={monthIndex === months.length - 1} onClick={() => selectMonth(months[monthIndex + 1].key)}><ChevronRight size={19} /></button></div><div className="calendar-day-grid" aria-label={`${format(parseLocalDate(month.first), 'MMMM yyyy')} scored days`}>
        {weekdayOrder.map((day) => <span key={day} className="calendar-weekday">{WEEKDAYS[day]}</span>)}
        {Array.from({ length: month.offset }, (_, index) => <span key={`blank-${index}`} />)}
        {month.dates.map((date) => { const day = byDate.get(date); const label = `${dateLabel(date)}: ${day?.value == null ? `no ${spec.label.toLowerCase()} score` : `${spec.label.toLowerCase()} ${displayScore(day.value)} out of 10`}${day?.unsafe ? `; ${day.unsafe} interaction${day.unsafe === 1 ? '' : 's'} marked unsafe` : ''}`;
          return day ? <button type="button" key={date} className={`calendar-day ${day.value == null ? 'calendar-no-score' : ''}`} style={styleFor(day)} aria-label={label} title={label} aria-pressed={date === selectedDate} aria-current={date === todayKey() ? 'date' : undefined} onClick={() => choose({ calendarDay: date })}><span className="calendar-date">{Number(date.slice(-2))}</span><strong>{day.value == null ? '—' : displayScore(day.value)}</strong>{day.unsafe > 0 && <span className="calendar-unsafe" aria-hidden="true">◆</span>}</button> : <span key={date} className="calendar-day calendar-outside" aria-label={`${dateLabel(date)}: ${date > todayKey() ? 'future day' : 'outside selected range'}`}><span className="calendar-date">{Number(date.slice(-2))}</span></span>;
        })}
      </div><p className="living-muted text-xs mt-3">Large number = {spec.label.toLowerCase()} / 10. Select a day to read its record. Faded dates fall outside this view.</p></div>
      <aside className="calendar-rhythm" aria-labelledby="weekday-rhythm-heading"><h3 id="weekday-rhythm-heading">Does the weekday matter?</h3><p className="living-muted text-sm mt-2">Average {spec.label.toLowerCase()} across this date range. Each weekday needs at least 3 scored days.</p><div className="calendar-weekday-bars">{weekdayOrder.map((weekday) => { const row = summary.weekdays[weekday]; return <div className="calendar-weekday-row" key={weekday}><span>{WEEKDAYS[weekday]}</span><div className="calendar-bar-track" aria-hidden="true">{row.mean != null && <span style={{ width: `${row.mean * 10}%`, backgroundColor: metric === 'stress' ? 'var(--plot-stress)' : 'var(--plot-mood)' }} />}</div><strong>{row.mean == null ? '—' : row.mean.toFixed(1)}</strong><small>{row.count} {row.count === 1 ? 'day' : 'days'}</small></div>; })}</div>
        {summary.longest && <p className="calendar-run"><strong>{summary.longest.count} consecutive days</strong><span>{metric === 'stress' ? 'Stress at 7 or above' : `${spec.label} at 4 or below`} · {format(parseLocalDate(summary.longest.start), 'MMM d')}–{format(parseLocalDate(summary.longest.end), 'MMM d, yyyy')}</span></p>}
        {unsafeDays > 0 && <p className="calendar-run"><strong>◆ {unsafeDays} {unsafeDays === 1 ? 'day includes' : 'days include'} an unsafe interaction</strong><span>This marker stays visible alongside any daily score.</span></p>}
      </aside>
    </div>
    {selected && <section className="calendar-selected" aria-labelledby="calendar-selected-heading" aria-live="polite"><div className="calendar-selected-heading"><h3 id="calendar-selected-heading">{format(parseLocalDate(selectedDate), 'EEEE, MMMM d')}</h3><span>{selected.value == null ? `No ${spec.label.toLowerCase()} score` : `${spec.label}: ${displayScore(selected.value)} / 10`} · {selected.rows.length} {selected.rows.length === 1 ? 'entry' : 'entries'}</span></div>{selected.rows.length ? <div className="calendar-entry-list">{selected.rows.slice(0,4).map((entry) => <article key={entry.key}><p className="living-label">{entry.kind === 'day' ? 'Daily check-in' : entry.interaction_feeling ? `${entry.interaction_feeling === 'unsafe' ? '◆ ' : ''}Interaction · ${entry.interaction_feeling}` : 'Journal moment'}</p>{entryText(entry) ? <p className="calendar-entry-excerpt">{entryText(entry)}</p> : <p className="living-muted text-sm">Scores or tags recorded without a written reflection.</p>}<Link className="living-text-link" to={journalLink({ entry: entry.key })}>Read full entry <ArrowRight size={14} /></Link></article>)}{selected.rows.length > 4 && <Link className="living-text-link" to={journalLink({ range: 'custom', start: selectedDate, end: selectedDate, entry: '' })}>See all {selected.rows.length} entries for this day <ArrowRight size={14} /></Link>}</div> : <p className="living-muted">No entries match this day in the current filters. A gap does not tell us how the day felt.</p>}</section>}
  </section>;
}
