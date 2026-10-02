import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Note from '@/features/shell/Note';
import QuickExit from '@/features/safety/QuickExit';
import { STRESS_STATES, PRACTICES, PRACTICE_SOURCES, stateById, practiceById, recommendPractices } from '@/lib/practices';

const minutes = (count) => `About ${count} ${count === 1 ? 'minute' : 'minutes'}`;

/**
 * Public: the practices for a hard moment, open to anyone, signed in or out.
 * Each feeling and practice has its own address to share. Nothing is saved
 * here; keeping what changed happens in the app's Practice page.
 */
export default function HelpNow() {
  const { user } = useAuth();
  const { stateId, practiceId } = useParams();
  const state = stateById(stateId) ?? null;
  const active = state && practiceId ? practiceById(practiceId) ?? null : null;
  const suggestions = state ? recommendPractices(state.id) : [];
  const practiceHeading = useRef(null);
  const optionsHeading = useRef(null);

  useEffect(() => {
    const before = document.title;
    document.title = active ? `${active.title}: help now · Vibe Check` : state ? `${state.label}: help now · Vibe Check` : 'Help now · Vibe Check';
    return () => { document.title = before; };
  }, [state, active]);

  // Focus goes to what a choice opened, which also brings it into view: on a
  // phone the options sit below all seven feelings.
  const shownState = state?.id;
  const shownPractice = active?.id;
  useEffect(() => {
    if (shownPractice) practiceHeading.current?.focus();
    else if (shownState) optionsHeading.current?.focus();
  }, [shownState, shownPractice]);

  return (
    <div className="field-wash min-h-screen">
      <main className="living-page space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <a href="/" className="touch-link text-sm underline underline-offset-4">Back to Vibe Check</a>
          <QuickExit />
        </div>
        <header>
          <p className="sanctuary-eyebrow">HELP NOW · FREE · NO ACCOUNT NEEDED</p>
          <h1>Help for this moment.</h1>
          <p className="living-muted mt-3 max-w-xl">Choose what feels present, then try one small step. Nothing you choose here is saved.</p>
        </header>
        <Note>{state ? state.invitation : 'Begin wherever you are. Choose what feels present, then take one small step.'}</Note>
        <section aria-labelledby="help-feeling-heading">
          <h2 id="help-feeling-heading" className="mb-4">What feels present?</h2>
          <nav aria-label="Feelings" className="state-grid">
            {STRESS_STATES.map((item, index) => (
              <Link key={item.id} to={`/help-now/${item.id}`} className="state-card" aria-current={state?.id === item.id ? 'page' : undefined}>
                <span className="state-number" aria-hidden="true">0{index + 1}</span><strong>{item.label}</strong><span>{item.description}</span>
              </Link>
            ))}
          </nav>
          <p className="living-muted text-xs mt-3">Choose your own description. These words do not diagnose a condition.</p>
          <p className="mt-4"><Link className="living-text-link" to="/support-now">I might not be safe right now <ArrowRight size={15} aria-hidden="true" /></Link></p>
        </section>
        {state && !active && (
          <section className="living-card space-y-5" aria-labelledby="help-options-heading">
            <div>
              <p className="sanctuary-eyebrow">FOR {state.label.toUpperCase()}</p>
              <h2 id="help-options-heading" ref={optionsHeading} tabIndex={-1} className="outline-none">One small invitation</h2>
              <p className="living-muted mt-2">Pick an option that fits your surroundings and what you need.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {suggestions.map((practice) => (
                <div key={practice.id} className="practice-option">
                  <span className="living-duration"><Clock3 size={14} aria-hidden="true" /> {minutes(practice.minutes)}</span>
                  <h3>{practice.title}</h3>
                  <p className="living-muted">{practice.purpose}</p>
                  <Link className="ink-button text-sm mt-4" to={`/help-now/${state.id}/${practice.id}`}>Try {practice.title.toLowerCase()} <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              ))}
            </div>
            <details>
              <summary className="living-text-link cursor-pointer">Choose another practice</summary>
              <div className="living-chips mt-4">
                {PRACTICES.map((practice) => <Link className="living-chip" key={practice.id} to={`/help-now/${state.id}/${practice.id}`}>{practice.title}</Link>)}
              </div>
            </details>
          </section>
        )}
        {active && (
          <section className="living-card practice-active space-y-6" aria-labelledby="help-practice-heading">
            <div>
              <span className="living-duration"><Clock3 size={15} aria-hidden="true" /> {minutes(active.minutes)}</span>
              <h2 id="help-practice-heading" ref={practiceHeading} tabIndex={-1} className="mt-2 outline-none">{active.title}</h2>
              <p className="living-muted mt-2">{active.purpose}</p>
            </div>
            <ol className="practice-steps">{active.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
            <div className="living-inset"><strong className="text-sm">Make it fit you</strong><p className="living-muted mt-1">{active.alternative} You can stop at any time.</p></div>
            <div className="hairline pt-6 space-y-3">
              <Link className="living-secondary inline-flex items-center gap-2" to={`/help-now/${state.id}`}><ArrowLeft size={16} aria-hidden="true" />Back to the options for {state.label.toLowerCase()}</Link>
              {user
                ? <p className="living-muted text-sm"><Link className="underline" to={`/Practice?tab=somatic&state=${state.id}&practice=${active.id}`}>Open this practice in Practice</Link> to keep what changed in your history and reports.</p>
                : <p className="living-muted text-sm">With a free account you can keep what changed, if anything, and see it in your weekly and monthly reports. <a className="underline" href="/signup">Create a free account</a></p>}
            </div>
            <p className="text-xs"><a className="underline" href={PRACTICE_SOURCES[active.source].url} target="_blank" rel="noreferrer">Practice background · {PRACTICE_SOURCES[active.source].title}</a></p>
          </section>
        )}
        <p className="living-muted text-xs">These are optional body-based and practical invitations, not treatment. If a practice increases discomfort, stop or choose another.</p>
      </main>
    </div>
  );
}
