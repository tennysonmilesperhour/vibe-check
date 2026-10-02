import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useLivingData, usePreferences } from '@/features/patterns/useLivingData';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';
import QuickExit from '@/features/safety/QuickExit';
import { buildShareSummary, kindOf } from '@/lib/share-summary';
import { addDaysKey, formatDay, todayKey } from '@/lib/dates';
import { entryText, filterEntries, validDateKey } from '@/lib/living-patterns';
import SummaryDocument from './SummaryDocument';
import LoadingState from '@/features/shell/LoadingState';

const SECTIONS = [
  ['scores', 'Daily check-in scores'],
  ['feelings', 'Feelings and body cues'],
  ['interactions', 'Interactions with people'],
  ['practices', 'Practices you tried and how they went'],
  ['alignment', 'Whether your responses felt like you'],
];
const QUICK_RANGES = [[14, 'Last 2 weeks'], [30, 'Last 30 days'], [90, 'Last 90 days']];

/** A summary of chosen dates to print or save as a PDF and bring to someone. */
export default function ShareSummaryPage() {
  const living = useLivingData();
  // Shown as soon as the preferences load, before the whole history does.
  const quickExitOn = Boolean(usePreferences().data?.quick_exit);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const today = todayKey();
  const start = params.get('start') || addDaysKey(today, -29);
  const end = params.get('end') || today;
  const valid = validDateKey(start) && validDateKey(end) && start <= end && end <= today;
  const [include, setInclude] = useState(() => Object.fromEntries(SECTIONS.map(([key]) => [key, true])));
  const [hideNames, setHideNames] = useState(true);
  const [chosen, setChosen] = useState([]);
  const [note, setNote] = useState('');
  // The summary rebuilds from the whole record, so typing waits for it.
  const shownNote = useDeferredValue(note);
  const [identityOk, setIdentityOk] = useState(false);
  const confirmIdentity = useCallback(() => setIdentityOk(true), []);
  const data = living.data;

  const candidates = useMemo(() => (valid && data ? filterEntries(data.entries.filter((entry) => !entry.is_demo), { start, end }) : []), [data, start, end, valid]);
  const summary = useMemo(() => (valid && data ? buildShareSummary({
    entries: data.entries, sessions: data.sessions, people: data.people, start, end,
    weekStartsOn: data.preferences.week_start === 0 ? 0 : 1, chosen, hideNames, note: shownNote, today,
  }) : null), [data, start, end, valid, chosen, hideNames, shownNote, today]);

  const setRange = (from, to) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set('start', from); next.set('end', to);
    return next;
  }, { replace: true });
  const toggleEntry = (key) => setChosen((keys) => (keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]));
  const chosenInRange = candidates.filter((entry) => chosen.includes(entry.key)).length;
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/Analytics'));
  // A saved PDF takes the page title as its file name, so the title keeps
  // yyyy-MM-dd dates, which sort.
  useEffect(() => {
    const before = document.title;
    if (valid) document.title = `Summary to share, ${start} to ${end}`;
    return () => { document.title = before; };
  }, [valid, start, end]);

  return <div className="summary-page field-wash min-h-screen">
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="summary-screen-only flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="living-secondary" onClick={back}><ArrowLeft size={16} aria-hidden="true" />Back</button>
        <div className="flex flex-wrap gap-3">
          {quickExitOn && <QuickExit />}
          {identityOk && summary && <button type="button" className="ink-button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print or save as PDF</button>}
        </div>
      </div>

      <section className="summary-screen-only living-card space-y-5" aria-labelledby="summary-options-heading">
        <div>
          <p className="sanctuary-eyebrow">YOUR RECORD · YOUR CHOICE</p>
          <h1 id="summary-options-heading" className="text-3xl">A summary to share</h1>
          <p className="living-muted mt-2">Bring a short record of your days to a therapist, a doctor, or anyone you choose. You pick the dates and what goes in. Nothing is sent anywhere: print it, or save it as a PDF from the print window.</p>
        </div>
        {living.isLoading && <LoadingState label="Gathering your record…" />}
        {living.isError && <p className="living-error" role="alert">Your record could not load. <button type="button" className="underline" onClick={() => living.refetch()}>Try again</button></p>}
        {living.reloadFailed && <p className="living-error" role="alert">Your record couldn't refresh, so this summary may be out of date. <button type="button" className="underline" onClick={() => living.refetch()}>{living.isFetching ? 'Trying…' : 'Try again'}</button></p>}
        {data && <>
          <fieldset className="space-y-3">
            <legend className="living-label">Dates</legend>
            <div className="living-chips">{QUICK_RANGES.map(([days, label]) => <button key={days} type="button" className="living-chip" aria-pressed={start === addDaysKey(today, -days + 1) && end === today} onClick={() => setRange(addDaysKey(today, -days + 1), today)}>{label}</button>)}</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="living-label">From<input className="living-input mt-2" type="date" max={today} value={start} onChange={(e) => setRange(e.target.value, end)} /></label>
              <label className="living-label">Through<input className="living-input mt-2" type="date" max={today} value={end} onChange={(e) => setRange(start, e.target.value)} /></label>
            </div>
            {!valid && <p className="living-error" role="alert">Choose a valid date range through today.</p>}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="living-label">What to include</legend>
            {SECTIONS.map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 shrink-0" checked={include[key]} onChange={(e) => setInclude((current) => ({ ...current, [key]: e.target.checked }))} />{label}</label>)}
          </fieldset>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 shrink-0" checked={hideNames} onChange={(e) => setHideNames(e.target.checked)} /><span>Replace people's names with labels such as Person 1<span className="living-muted block text-xs mt-1">Saved names are replaced in any letter case, and a first or last name on its own when it starts with a capital. An everyday word that is also someone's name is replaced too. A name spelled another way, a name with a changed ending (as in languages that decline names), or the name of someone you have removed from your people, can remain, so read the summary before you share it.</span></span></label>
          <details className="space-y-2">
            <summary className="living-label cursor-pointer">Add your words from chosen entries · {chosenInRange} chosen</summary>
            <p className="living-muted text-xs mt-2">Only the entries you tick are included, with their full text.</p>
            {candidates.length ? <div className="max-h-72 overflow-y-auto space-y-2 mt-2">{candidates.map((entry) => <label key={entry.key} className="flex gap-2 items-start text-sm"><input type="checkbox" className="mt-0.5 shrink-0" checked={chosen.includes(entry.key)} onChange={() => toggleEntry(entry.key)} /><span>{formatDay(entry.date)} · {kindOf(entry)} · {(entryText(entry) || 'No written words').slice(0, 80)}</span></label>)}</div> : <p className="living-muted text-sm mt-2">No entries in these dates.</p>}
          </details>
          <label className="living-label">Something you would like to talk about (optional)<textarea className="living-input mt-2" rows={3} maxLength={4000} value={note} onChange={(e) => setNote(e.target.value)} /><span className="living-muted text-xs">Shown at the top of the summary. It is not saved.</span></label>
        </>}
      </section>

      {summary && (identityOk
        ? <>
          <p className="summary-screen-only living-muted text-sm">This is exactly what prints. Read it through before you share it.</p>
          <SummaryDocument summary={summary} include={include} prepared={today} />
          <div className="summary-screen-only flex justify-end"><button type="button" className="ink-button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print or save as PDF</button></div>
        </>
        : <div className="summary-screen-only living-card"><ConfirmIdentity action="prepare a summary to share" onConfirmed={confirmIdentity} /></div>)}
    </div>
  </div>;
}
