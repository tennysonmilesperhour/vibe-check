import { formatDay, formatRange } from '@/lib/dates';

const longDay = (key) => formatDay(key, { style: 'long', withYear: true });
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function Score({ value }) {
  if (!value) return <span className="summary-muted">Not recorded</span>;
  return <>{value.mean}{value.count > 1 && value.min !== value.max ? <span className="summary-muted"> ({value.min}–{value.max})</span> : null}</>;
}

const counts = (items) => items.map((item) => `${capitalize(item.value)} ${item.count}`).join(' · ');
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * The summary as it prints: what the person recorded, in their own terms.
 * @param {{ summary: any, include: Record<string, boolean>, prepared: string }} props
 */
export default function SummaryDocument({ summary, include, prepared }) {
  const { scores, interactions } = summary;
  const mixedStress = scores.stressAtCheckIn > 0 && scores.stressHighestToday > 0;
  return <article className="summary-document" aria-label="Summary to share">
    <header className="summary-header">
      <p className="summary-eyebrow">Self-recorded summary</p>
      <h1 className="font-display">What I recorded, {formatRange(summary.start, summary.end, { long: true })}</h1>
      <p>Kept by me in Vibe Check, a personal journal. These are my own entries and ratings, not a clinical assessment. Prepared {longDay(prepared)}.</p>
    </header>

    {summary.note && <section><h2>Something I would like to talk about</h2><p className="summary-words">{summary.note}</p></section>}

    <section>
      <h2>At a glance</h2>
      <ul className="summary-facts">
        <li><strong>{summary.recordedDays}</strong> of {summary.calendarDays} {summary.calendarDays === 1 ? 'day' : 'days'} {summary.recordedDays === 1 ? 'has' : 'have'} an entry</li>
        <li><strong>{summary.checkIns}</strong> {summary.checkIns === 1 ? 'daily check-in' : 'daily check-ins'}</li>
        <li><strong>{summary.journalEntries}</strong> {summary.journalEntries === 1 ? 'journal entry' : 'journal entries'}</li>
      </ul>
      <p className="summary-muted">A day without an entry is not counted as a good or a bad day.</p>
    </section>

    {include.scores && <section>
      <h2>Daily check-in scores</h2>
      {scores.overall.days ? <>
        <p className="summary-muted">Rated by me once a day: mood, energy and sleep from 1 to 10, stress from 0 to 10. Each cell is the average, with the lowest and highest in brackets.</p>
        <table className="summary-table">
          <thead><tr><th>{scores.unit === 'month' ? 'Month' : 'Week'}</th><th>Check-ins</th><th>Mood</th><th>Energy</th><th>Sleep</th><th>Stress</th></tr></thead>
          <tbody>
            {scores.rows.map((row) => <tr key={row.start}><th>{formatRange(row.start, row.end, { withYear: false })}</th><td>{row.days}</td><td><Score value={row.mood} /></td><td><Score value={row.energy} /></td><td><Score value={row.sleep} /></td><td><Score value={row.stress} /></td></tr>)}
            <tr className="summary-total"><th>Whole period</th><td>{scores.overall.days}</td><td><Score value={scores.overall.mood} /></td><td><Score value={scores.overall.energy} /></td><td><Score value={scores.overall.sleep} /></td><td><Score value={scores.overall.stress} /></td></tr>
          </tbody>
        </table>
        {mixedStress && <p className="summary-muted">Stress was rated two ways: {scores.stressAtCheckIn} {scores.stressAtCheckIn === 1 ? 'time' : 'times'} as stress at the moment of the check-in, {scores.stressHighestToday} as the day's highest.</p>}
        <p className="summary-muted">Moods given for single moments in journal entries are not part of these averages.</p>
      </> : <p>No daily check-ins in these dates.</p>}
    </section>}

    {include.feelings && <section>
      <h2>Feelings</h2>
      {summary.states.length || summary.emotions.length || summary.bodyCues.length ? <>
        {summary.states.length > 0 && <><h3>States I chose</h3><ul className="summary-list">{summary.states.map((state) => <li key={state.id}>{state.label}: {state.days} {state.days === 1 ? 'day' : 'days'}</li>)}</ul></>}
        {summary.emotions.length > 0 && <><h3>Feeling words I used most</h3><p>{summary.emotions.map((word) => `${word.label} (${word.days} ${word.days === 1 ? 'day' : 'days'})`).join(', ')}</p></>}
        {summary.bodyCues.length > 0 && <><h3>Body cues I noticed</h3><p>{summary.bodyCues.map((cue) => `${cue.label} (${cue.days} ${cue.days === 1 ? 'day' : 'days'})`).join(', ')}</p></>}
        <p className="summary-muted">Counted as days, so a feeling recorded twice on one day counts once. Only states I chose myself are listed.</p>
      </> : <p>No feelings were recorded in these dates.</p>}
    </section>}

    {include.interactions && <section>
      <h2>Interactions with people</h2>
      {interactions.total ? <>
        <p>{plural(interactions.total, 'interaction', 'interactions')} recorded. How they felt: {counts(interactions.feelings)}.</p>
        <p>Was my boundary respected? {counts(interactions.boundaries)}.</p>
        {interactions.people.length > 0 && <table className="summary-table">
          <thead><tr><th>Person</th><th>Interactions</th><th>How they felt</th></tr></thead>
          <tbody>{interactions.people.map((person) => <tr key={person.id}><th>{person.label}</th><td>{person.total}</td><td>{counts(person.feelings)}</td></tr>)}</tbody>
        </table>}
        {summary.hideNames && <p className="summary-muted">People are named by label. I can say who they are.</p>}
      </> : <p>No interactions were recorded in these dates.</p>}
    </section>}

    {include.practices && <section>
      <h2>Practices I tried</h2>
      {summary.practices.length ? <ul className="summary-list">{summary.practices.map((practice) => <li key={practice.id}>
        <strong>{practice.title}</strong>: {plural(practice.attempts, 'time', 'times')}. Afterwards I felt: {practice.outcomes.map((item) => `${item.value.toLowerCase()} ${item.count}`).join(', ')}.
      </li>)}</ul> : <p>No practices were recorded in these dates.</p>}
    </section>}

    {include.alignment && <section>
      <h2>Whether my responses felt like me</h2>
      {summary.alignment.entries.length || summary.alignment.practices.length ? <>
        {summary.alignment.entries.length > 0 && <p>In check-ins and journal entries: {summary.alignment.entries.map((item) => `${item.label} ${item.count}`).join(' · ')}</p>}
        {summary.alignment.practices.length > 0 && <p>After practices: {summary.alignment.practices.map((item) => `${item.label} ${item.count}`).join(' · ')}</p>}
      </> : <p>Not recorded in these dates.</p>}
    </section>}

    {summary.words.length > 0 && <section>
      <h2>In my own words</h2>
      <p className="summary-muted">Entries I chose to include, oldest first.</p>
      {summary.words.map((word) => <div className="summary-entry" key={word.key}>
        <h3>{longDay(word.date)} · {word.kind}{word.mood !== null ? ` · ${word.kind === 'Daily check-in' ? 'day' : 'moment'} mood ${word.mood}/10` : ''}</h3>
        {(word.states.length > 0 || word.emotions.length > 0 || word.people.length > 0) && <p className="summary-muted">{[...word.states, ...word.emotions].join(', ')}{word.people.length ? `${word.states.length || word.emotions.length ? ' · ' : ''}With ${word.people.join(', ')}` : ''}</p>}
        {word.parts.map((part, i) => <p className="summary-words" key={i}>{part.label && <strong>{part.label}: </strong>}{part.text}</p>)}
      </div>)}
    </section>}

    <footer className="summary-muted">
      From Vibe Check, a personal journal. Scores and words are self-reported.{summary.demoLeftOut ? ' Demo entries are left out.' : ''}
    </footer>
  </article>;
}
