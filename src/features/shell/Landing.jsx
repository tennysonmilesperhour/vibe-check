import { ArrowRight, ArrowUpRight, Check, Leaf, Orbit, Sprout } from "lucide-react";
import SkyField from "./SkyField";
import SanctuaryMark from "./SanctuaryMark";

// What stays free for everyone (see docs/design/product-foundation.md).
const FREE_FOREVER = [
  "Your journal and daily check-ins",
  "Your full history, with nothing locked away",
  "People and habit patterns, with the entries behind them",
  "Weekly and monthly reports",
  "Practices for hard moments, with full instructions",
  "App lock and a safety plan",
  "Export of everything you've written, and account deletion",
];

const PRIVATE = [
  "No ads, no tracking pixels, and your information is never sold.",
  "Patterns and reports are worked out in the app. Your journal is never sent to an AI service.",
  "Nothing is shared unless you choose to share it.",
  "Export everything or delete your account from Settings, at any time.",
];

const STEPS = [
  { icon: Leaf, title: "Check in", text: "Note how you feel, who you were with, and what you did. A minute is enough, and a missed day is fine." },
  { icon: Orbit, title: "See your patterns", text: "Each pattern shows the days behind it, so you can check it against what you remember." },
  { icon: Sprout, title: "Find what helps", text: "When a moment is hard, choose what feels present and try one small step." },
];

/** The front page for visitors who aren't signed in. */
export default function Landing() {
  return (
    <div className="landing-page">
      <main>
        <SkyField className="landing-hero" film>
          <div className="landing-topbar">
            <div className="welcome-brand"><SanctuaryMark size={46} /><span>vibe check</span></div>
            <a className="landing-signin" href="/signin">Sign in</a>
          </div>
          <div className="landing-story">
            <p className="sanctuary-eyebrow">FREE FOREVER · NO AI READS YOUR JOURNAL</p>
            <h1>See how the people and habits in your life affect you.</h1>
            <p className="landing-lede">A private journal and daily check-in with people and habit patterns, weekly and monthly reports, and practices for hard moments.</p>
            <div className="landing-actions">
              <a className="landing-primary" href="/signup">Create a free account <ArrowRight size={17} aria-hidden="true" /></a>
              <a className="landing-link" href="/help-now">Need help now? No account needed <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <section className="landing-steps" aria-labelledby="landing-steps-heading">
            <h2 id="landing-steps-heading" className="sr-only">How it works</h2>
            {STEPS.map(({ icon: Icon, title, text }) => (
              <div key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>
            ))}
          </section>
        </SkyField>

        <div className="landing-sections">
          <section id="free" className="living-card landing-card" aria-labelledby="landing-free-heading">
            <p className="sanctuary-eyebrow">THE FREE PLEDGE</p>
            <h2 id="landing-free-heading">Free forever</h2>
            <p className="living-muted mt-2">Everything you need to understand your own patterns is free, for everyone, with no trial and no limit on history.</p>
            <ul className="landing-list">{FREE_FOREVER.map((item) => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul>
            <p className="living-muted mt-5">Paid extras may come later. They can add depth but never take any of this away, and none of it needs an AI account.</p>
          </section>

          <section className="living-card landing-card" aria-labelledby="landing-private-heading">
            <p className="sanctuary-eyebrow">PRIVATE BY DESIGN</p>
            <h2 id="landing-private-heading">Your journal stays yours</h2>
            <ul className="landing-list">{PRIVATE.map((item) => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul>
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1"><a className="living-text-link" href="/privacy">Privacy policy</a><a className="living-text-link" href="/terms">Terms of use</a></p>
          </section>

          <section className="living-card landing-card landing-help" aria-labelledby="landing-help-heading">
            <p className="sanctuary-eyebrow">FOR A HARD MOMENT</p>
            <h2 id="landing-help-heading">Help now, with no account</h2>
            <p className="living-muted mt-2">Choose what feels present: confusion, fight or flight, anger, shutdown, numbness, procrastination, or mixed and unsure. Each comes with short steps to try right away.</p>
            <p className="mt-5"><a className="ink-button" href="/help-now">Open help now <ArrowRight size={16} aria-hidden="true" /></a></p>
            <p className="living-muted mt-5">If you might not be safe, <a className="underline" href="/support-now">Support now</a> lists free crisis and safety services by region.</p>
          </section>

          <section className="landing-cta" aria-labelledby="landing-cta-heading">
            <SanctuaryMark size={54} className="landing-cta-mark" />
            <h2 id="landing-cta-heading">Start with one check-in.</h2>
            <p className="living-muted mt-2">Vibe Check is for adults 18 and older.</p>
            <div className="landing-cta-actions">
              <a className="ink-button" href="/signup">Create a free account <ArrowRight size={16} aria-hidden="true" /></a>
              <a className="living-secondary" href="/signin">Sign in</a>
            </div>
          </section>
        </div>
      </main>
      <footer className="landing-footer">
        <nav aria-label="About Vibe Check" className="flex flex-wrap gap-x-5 gap-y-1">
          <a href="/help-now">Help now</a><a href="/support-now">Support now</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a>
        </nav>
        <a href="mailto:morphiclabsdata@gmail.com">morphiclabsdata@gmail.com</a>
      </footer>
    </div>
  );
}
