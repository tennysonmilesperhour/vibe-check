import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLivingData } from '@/features/patterns/useLivingData';
import PlantVoice from '@/features/shell/PlantVoice';
import { STRESS_STATES } from '@/lib/practices';
import { todayKey } from '@/lib/dates';
import { reportPeriod, previousPeriod, validDateKey } from '@/lib/living-patterns';

export default function DailySupport({ welcome = false }) {
  const living = useLivingData();
  const [intention, setIntention] = useState('');
  const [revisitDate, setRevisitDate] = useState(todayKey());
  const [tracking, setTracking] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const prefs = living.data?.preferences;
  useEffect(() => { setIntention(prefs?.intention || ''); setTracking(prefs?.tracking || []); }, [prefs]);
  async function save() {
    setBusy(true); setMessage('');
    try { await living.savePreferences({ intention: intention.trim(), tracking, welcome_complete: true }); setMessage('Your intention is kept. You can change it whenever you need.'); }
    catch (err) { setMessage(`Could not save: ${err.message}`); }
    setBusy(false);
  }
  const week = previousPeriod(reportPeriod('weekly', undefined, prefs?.week_start ?? 1), prefs?.week_start ?? 1);
  const month = previousPeriod(reportPeriod('monthly'));
  return <div className="space-y-6">
    <PlantVoice>{welcome ? 'We are the plants of this sanctuary. Keep what happened and how it felt. We will return to your record together, notice what repeats, and find practices that leave more room for you.' : 'Your feelings can change while your history stays here to be seen. What would help you feel more connected to your own needs today?'}</PlantVoice>
    <section className="living-card space-y-4" aria-labelledby="daily-help-heading"><div><p className="sanctuary-eyebrow">SUPPORT FOR THIS MOMENT</p><h2 id="daily-help-heading">What would help you come back to yourself?</h2><p className="living-muted mt-2">Choose what feels present. A short practice is available even before a check-in.</p></div><div className="living-chips">{STRESS_STATES.map((state) => <Link className="living-chip inline-flex items-center" key={state.id} to={`/Practice?tab=somatic&state=${state.id}`}>{state.label}</Link>)}</div><Link className="living-text-link" to="/Analytics?tab=journal&compose=1"><BookOpen size={16} />Keep a moment in your journal</Link></section>
    <section className="grid sm:grid-cols-2 gap-4" aria-label="Your latest completed reports"><Link className="living-card block" to={`/Analytics?tab=reports&period=weekly&reportDate=${week.start}`}><p className="sanctuary-eyebrow">LAST WEEK</p><h2 className="mt-2">See the week together.</h2><p className="living-muted mt-2">{week.start} – {week.end}</p><span className="living-text-link mt-4">Read your weekly report <ArrowRight size={15} /></span></Link><Link className="living-card block" to={`/Analytics?tab=reports&period=monthly&reportDate=${month.start}`}><p className="sanctuary-eyebrow">LAST MONTH</p><h2 className="mt-2">Return to the wider view.</h2><p className="living-muted mt-2">{month.start} – {month.end}</p><span className="living-text-link mt-4">Read your monthly report <ArrowRight size={15} /></span></Link></section>
    <details className="living-card" open={prefs && !prefs.welcome_complete}><summary className="cursor-pointer font-display text-2xl">{prefs?.welcome_complete ? 'What you want to notice' : 'Begin with what matters to you'}</summary><div className="space-y-4 mt-5"><p className="living-muted">All optional. Your journal, people and habit patterns, full history, reports, and these practices are free.</p><label className="living-label">What does feeling like yourself mean to you?<textarea className="living-input mt-2" rows={3} maxLength={1000} value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="Having time to decide. Respecting my boundaries. Making room for rest…" /></label><fieldset><legend className="living-label">What would you like to notice?</legend><div className="living-chips">{['Relationships', 'Habits', 'Stress & body cues', 'Mood', 'Energy & sleep', 'My choices & boundaries'].map((item) => <button key={item} type="button" className="living-chip" aria-pressed={tracking.includes(item)} onClick={() => setTracking((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item])}>{item}</button>)}</div></fieldset><button type="button" className="ink-button" disabled={busy || living.isLoading} onClick={save}>{busy ? 'Saving…' : 'Keep my intention'}</button>{message && <p className="living-muted" role="status">{message}</p>}</div></details>
    <details className="living-card"><summary className="cursor-pointer font-display text-xl">Revisit another day</summary><div className="flex flex-wrap items-end gap-3 mt-4"><label className="living-label">Check-in date<input className="living-input mt-2" type="date" max={todayKey()} value={revisitDate} onChange={(e) => setRevisitDate(e.target.value)} /></label>{validDateKey(revisitDate) && revisitDate <= todayKey() && <Link className="living-secondary" to={`/Today?date=${revisitDate}`}>Open this day</Link>}</div><p className="living-muted text-xs mt-3">Add a missed check-in or edit an existing one. Your original journal entries stay separate.</p></details>
    <details className="living-muted text-xs"><summary className="cursor-pointer">About the plants' voice</summary><p className="mt-3">Nature connects this experience. The plants speak together as Vibe Check's authored voice, written for reflection. It does not represent any one tradition, teacher, or plant medicine. Our chakra companions are creative reflections. No plant use is required.</p></details>
  </div>;
}
