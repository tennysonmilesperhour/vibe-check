import { Link } from 'react-router-dom';

/**
 * Shown in place of a symbolic reading for a few days after a hard moment.
 * The person can still open the reading; it never decides for them.
 */
export default function ReadingPause({ moment, onShowAnyway }) {
  return (
    <section className="living-card space-y-4 max-w-xl mx-auto" aria-labelledby="reading-pause-heading">
      <h2 id="reading-pause-heading">A reading can wait</h2>
      <p>
        {moment.kind === 'harm'
          ? "In the last few days you recorded feeling unsafe, or a boundary that wasn't respected."
          : 'In the last few days you recorded a hard day.'}
        {' '}A symbolic reading can't weigh what happened, and your own record comes first.
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Link className="living-text-link" to={moment.kind === 'harm' ? '/support-now?focus=relationship' : '/support-now'}>Support now</Link>
        <Link className="living-text-link" to="/Practice?tab=somatic">A practice for this moment</Link>
        <Link className="living-text-link" to="/Analytics?tab=journal&range=7">Your recent entries</Link>
      </div>
      <button type="button" className="underline underline-offset-4 text-sm" onClick={onShowAnyway}>Show the reading anyway</button>
    </section>
  );
}
