import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import SupportResources from '@/features/safety/SupportResources';
import SafetyPlan from '@/features/safety/SafetyPlan';
import QuickExit from '@/features/safety/QuickExit';
import { hasAppLock, isUnlocked } from '@/lib/app-lock';

/** Public: reachable signed in or out, from every surface that offers support. */
export default function SupportNow() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const focus = params.get('focus') === 'relationship' ? 'relationship' : 'crisis';
  return (
    <div className="field-wash min-h-screen">
      <main className="living-page space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <a href="/" className="touch-link text-sm underline underline-offset-4">Back to Vibe Check</a>
          <QuickExit />
        </div>
        <header>
          <p className="sanctuary-eyebrow">SUPPORT NOW</p>
          <h1>You don't have to hold this alone.</h1>
          <p className="living-muted mt-3 max-w-xl">If you are thinking about harming yourself, or you are not safe with someone, these free services can help right now. You choose whether to contact them.</p>
        </header>
        <section className="living-card space-y-4" aria-labelledby="support-services-heading">
          <h2 id="support-services-heading">Talk to someone now</h2>
          <SupportResources focus={focus} />
        </section>
        {/* This page stays reachable while the app is locked; the private plan does not. */}
        {user && (hasAppLock(user.id) && !isUnlocked(user.id)
          ? <p className="living-muted">Unlock Vibe Check to see your safety plan.</p>
          : <SafetyPlan />)}
        <section className="living-card space-y-3" aria-labelledby="device-safety-heading">
          <h2 id="device-safety-heading">Using Vibe Check safely</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>If someone else can use or check this device, turn on the app lock in Settings. It hides your journal from a quick look; it can't protect a device someone else controls or monitors.</li>
            <li>Quick exit leaves Vibe Check at once for a neutral page. It doesn't erase your browser history.</li>
            <li>If you think your phone, computer, or accounts are being watched, a safer device (a library computer or a trusted friend's phone) may be better for contacting support. The services above can help you plan.</li>
            <li><a className="underline" href="https://www.techsafety.org" target="_blank" rel="noreferrer">Technology safety guides from the National Network to End Domestic Violence</a></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
