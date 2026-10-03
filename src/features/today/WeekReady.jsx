import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatRange } from "@/lib/dates";

/**
 * The note on Today that last week's report is ready, until the person opens
 * it or hides the note (onSeen). tone: "sky" on the invitation, "page" on the
 * reflection page.
 */
export default function WeekReady({ week, onSeen, tone = "page" }) {
  const range = formatRange(week.start, week.end);
  const report = `/Analytics?tab=reports&period=weekly&reportDate=${week.start}`;
  const hide = <button type="button" className="underline" aria-label="Hide the note about your week" onClick={onSeen}>Hide</button>;
  if (tone === "sky") {
    return <p className="mt-6 text-xs">Your weekly report for {range} is ready. <Link className="underline" to={report} onClick={onSeen}>Read your weekly report</Link> · {hide}</p>;
  }
  return (
    <section className="living-card flex flex-wrap items-center justify-between gap-4" aria-labelledby="week-ready-heading">
      <div>
        <p className="sanctuary-eyebrow">YOUR WEEK IS READY</p>
        <h2 id="week-ready-heading" className="mt-1">{range}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link className="living-text-link" to={report} onClick={onSeen}>Read your weekly report <ArrowRight size={15} aria-hidden="true" /></Link>
        {hide}
      </div>
    </section>
  );
}
