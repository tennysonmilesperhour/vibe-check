import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { usePreferences } from '@/features/patterns/useLivingData';
import PlantVoice from '@/features/shell/PlantVoice';
import { STRESS_STATES } from '@/lib/practices';
import { todayKey } from '@/lib/dates';
import { reportPeriod, previousPeriod, validDateKey } from '@/lib/living-patterns';

// Values in the person's own words; a short list is easier to hold in mind.
const MAX_VALUES = 7;
const MAX_VALUE_LENGTH = 80;

export default function DailySupport({ welcome = false }) {
  const living = usePreferences();
  const [intention, setIntention] = useState('');
  const [valuesText, setValuesText] = useState('');
  const [revisitDate, setRevisitDate] = useState(todayKey());
  const [tracking, setTracking] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const prefs = living.data;
  const values = [...new Set(valuesText.split('\n').map((line) => line.trim()).filter(Boolean))];
  const valuesProblem = values.length > MAX_VALUES ? `Keep it to ${MAX_VALUES} values (you have ${values.length}).`
    : values.some((value) => value.length > MAX_VALUE_LENGTH) ? `Keep each value under ${MAX_VALUE_LENGTH} characters.` : '';
  // A refresh never replaces what the person is still writing here.
  const edited = useRef(false);
  const edit = (setter) => (value) => { edited.current = true; setter(value); };
  useEffect(() => {
    if (edited.current) return;
    setIntention(prefs?.intention || ''); setTracking(prefs?.tracking || []); setValuesText((prefs?.personal_values || []).join('\n'));
  }, [prefs]);
  async function save() {
    setBusy(true); setMessage('');
    try {
      await living.savePreferences({ intention: intention.trim(), personal_values: values, tracking, tracking_shapes_check_in: true, welcome_complete: true });
      edited.current = false;
      setMessage('Kept. You can change these whenever you need.');
    } catch (err) { setMessage(`Could not save: ${err.message}`); }
    setBusy(false);
  }
  const week = previousPeriod(reportPeriod('weekly', undefined, prefs?.week_start ?? 1), prefs?.week_start ?? 1);
  const month = previousPeriod(reportPeriod('monthly'));
  return <div className="space-y-6">
    <PlantVoice>{welcome ? 'We are the plants of this sanctuary. Keep what happened and how it felt. We will return to your record together, notice what repeats, and find practices that leave more room for you.' : 'Your feelings can change while your history stays here to be seen. What would help you feel more connected to your own needs today?'}</PlantVoice>
    <section className="living-card space-y-4" aria-labelledby="daily-help-heading"><div><p className="sanctuary-eyebrow">SUPPORT FOR THIS MOMENT</p><h2 id="daily-help-heading">What would help you come back to yourself?</h2><p className="living-muted mt-2">Choose what feels present. A short practice is available even before a check-in.</p></div><div className="living-chips">{STRESS_STATES.map((state) => <Link className="living-chip inline-flex items-center" key={state.id} to={`/Practice?tab=somatic&state=${state.id}`}>{state.label}</Link>)}</div><Link className="living-text-link" to="/Analytics?tab=journal&compose=1"><BookOpen size={16} />Keep a moment in your journal</Link><Link className="living-text-link" to="/support-now">I might not be safe right now <ArrowRight size={15} /></Link></section>
    <section className="grid sm:grid-cols-2 gap-4" aria-label="Your latest completed reports"><Link className="living-card block" to={`/Analytics?tab=reports&period=weekly&reportDate=${week.start}`}><p className="sanctuary-eyebrow">LAST WEEK</p><h2 className="mt-2">See the week together.</h2><p className="living-muted mt-2">{week.start} – {week.end}</p><span className="living-text-link mt-4">Read your weekly report <ArrowRight size={15} /></span></Link><Link className="living-card block" to={`/Analytics?tab=reports&period=monthly&reportDate=${month.start}`}><p className="sanctuary-eyebrow">LAST MONTH</p><h2 className="mt-2">Return to the wider view.</h2><p className="living-muted mt-2">{month.start} – {month.end}</p><span className="living-text-link mt-4">Read your monthly report <ArrowRight size={15} /></span></Link></section>
    <details className="living-card" open={prefs && !prefs.welcome_complete}><summary className="cursor-pointer font-display text-2xl">{prefs?.welcome_complete ? 'What you want to notice' : 'Begin with what matters to you'}</summary><div className="space-y-4 mt-5"><p className="living-muted">All optional. Your journal, people and habit patterns, full history, reports, and these practices are free.</p>{!prefs && (living.isError
  ? <p className="living-error" role="alert">What you saved here couldn't load. <button type="button" className="underline" disabled={living.isFetching} onClick={() => living.refetch()}>Try again</button></p>
  : <p className="living-muted" role="status">Loading what you saved…</p>)}<label className="living-label">What does feeling like yourself mean to you?<textarea className="living-input mt-2" rows={3} maxLength={1000} value={intention} disabled={!prefs} onChange={(e) => edit(setIntention)(e.target.value)} placeholder="Having time to decide. Respecting my boundaries. Making room for rest…" /></label><label className="living-label">Your values, in your own words<textarea className="living-input mt-2" rows={4} maxLength={800} value={valuesText} disabled={!prefs} onChange={(e) => edit(setValuesText)(e.target.value)} placeholder={'One per line, up to seven. For example:\nHonesty\nTime with my family\nRest without guilt'} /><span className="living-muted text-xs block mt-1">{values.length} of {MAX_VALUES}. They appear beside the question "Did your response feel like you?", so you can answer by your own measure.</span>{valuesProblem && <span className="living-error block mt-1" role="alert">{valuesProblem}</span>}</label><fieldset><legend className="living-label">What would you like to notice?</legend><div className="living-chips">{['Relationships', 'Habits', 'Stress & body cues', 'Mood', 'Energy & sleep', 'My choices & boundaries'].map((item) => <button key={item} type="button" className="living-chip" aria-pressed={tracking.includes(item)} disabled={!prefs} onClick={() => edit(setTracking)(tracking.includes(item) ? tracking.filter((value) => value !== item) : [...tracking, item])}>{item}</button>)}</div><p className="living-muted text-xs mt-2">Your check-in asks about what you choose here. Choose nothing to be asked about everything.</p></fieldset><button type="button" className="ink-button" disabled={busy || !living.isSuccess || Boolean(valuesProblem)} onClick={save}>{busy ? 'Saving…' : 'Keep these'}</button>{message && <p className="living-muted" role="status">{message}</p>}</div></details>
    <details className="living-card"><summary className="cursor-pointer font-display text-xl">Revisit another day</summary><div className="flex flex-wrap items-end gap-3 mt-4"><label className="living-label">Check-in date<input className="living-input mt-2" type="date" max={todayKey()} value={revisitDate} onChange={(e) => setRevisitDate(e.target.value)} /></label>{validDateKey(revisitDate) && revisitDate <= todayKey() && <Link className="living-secondary" to={`/Today?date=${revisitDate}`}>Open this day</Link>}</div><p className="living-muted text-xs mt-3">Add a missed check-in or edit an existing one. Your original journal entries stay separate.</p></details>
    <details className="living-muted text-xs"><summary className="cursor-pointer">About the plants' voice</summary><p className="mt-3">Nature connects this experience. The plants speak together as Vibe Check's authored voice, written for reflection. It does not represent any one tradition, teacher, or plant medicine. Our chakra companions are creative reflections. No plant use is required.</p></details>
  </div>;
}
