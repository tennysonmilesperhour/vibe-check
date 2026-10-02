import { Link } from 'react-router-dom';
import { reportObservations } from '@/lib/report-observations';

/** What stood out in the period, in plain counts, each with a link to its evidence. */
export default function ReportObservations({ report, type, themeLabels }) {
  const span = type === 'monthly' ? 'month' : 'week';
  const found = reportObservations(report, { type, themeLabels });
  return (
    <section className="living-card space-y-3" aria-labelledby="report-observations-heading">
      <h2 id="report-observations-heading">What stood out this {span}</h2>
      {found.length ? (
        <>
          <ol className="report-observations">
            {found.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>{' '}
                {item.to ? <Link className="living-text-link" to={item.to}>{item.label}</Link> : <a className="living-text-link" href={item.href}>{item.label}</a>}
              </li>
            ))}
          </ol>
          <p>What do you want to carry into next {span}? <a className="living-text-link" href="#report-reflection-heading">Write it down</a></p>
        </>
      ) : (
        <p className="living-muted">Nothing recorded this {span} yet. You can begin with one moment or choose a practice for now.</p>
      )}
    </section>
  );
}
