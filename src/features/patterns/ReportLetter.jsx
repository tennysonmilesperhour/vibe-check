import PlantVoice from '@/features/shell/PlantVoice';
import { letterObservations } from '@/lib/report-letter';

/** The report opens with a short letter: what stood out, and where to see it. */
export default function ReportLetter({ report, type }) {
  const span = type === 'monthly' ? 'month' : 'week';
  const found = letterObservations(report, { type });
  return (
    <PlantVoice>
      <h2 className="report-letter-heading">A letter about your {span}</h2>
      {found.length ? (
        <>
          <p>We read your {span} with you. {found.length === 1 ? 'One thing stood out.' : `${found.length === 2 ? 'Two' : 'Three'} things stood out.`}</p>
          <ol className="report-letter-list">
            {found.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span> <a className="living-text-link" href={item.href}>{item.label}</a>
              </li>
            ))}
          </ol>
          <p>What do you want to carry into next {span}? <a className="living-text-link" href="#report-reflection-heading">Write it down</a></p>
        </>
      ) : (
        <p>This {span} has no entries yet. Nothing needs to be invented to fill the space. You can begin with one moment or choose a practice for now.</p>
      )}
    </PlantVoice>
  );
}
