import React, { useMemo } from "react";
import { parseLocalDate, addDaysKey, todayKey } from "@/lib/dates";
import { entryPeople, samePersonId } from "@/lib/people";
import { format } from "date-fns";
import { EMOTIONS } from "@/features/today/vocab";
import VocabularyIcon from "@/features/today/VocabularyIcon";

const iconFor = (label) => EMOTIONS.find((e) => e.label === label)?.icon;

/**
 * The Sunday ritual: a composed look back at the week just lived.
 * Pure computation over check-ins; shown on Sundays or via ?review=last.
 */
export default function WeekInReview({ checkIns, people = [], forceShow = false }) {
  const isSunday = parseLocalDate(todayKey()).getDay() === 0;

  const week = useMemo(() => {
    // the 7 days ending today (Sunday) or the last completed Sun-Sat window
    const end = todayKey();
    const days = Array.from({ length: 7 }, (_, i) => addDaysKey(end, i - 6));
    const entries = days
      .map((d) => checkIns.find((c) => c.date === d))
      .filter(Boolean);
    if (entries.length < 3) return null;

    const moods = entries.map((e) => e.mood_score).filter((m) => m != null);
    const avg = moods.reduce((a, b) => a + b, 0) / Math.max(moods.length, 1);
    const best = entries.reduce((a, b) => ((b.mood_score ?? 0) > (a.mood_score ?? 0) ? b : a));
    const emotionCounts = {};
    for (const e of entries) for (const emo of e.emotions || []) emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
    const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

    const personCounts = {};
    for (const e of entries) for (const id of entryPeople(e)) {
      const key = String(id).toLowerCase();
      personCounts[key] = (personCounts[key] || 0) + 1;
    }
    const topPeople = Object.entries(personCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => people.find((p) => samePersonId(p.id, id))?.name)
      .filter(Boolean);

    return { days, entries, avg, best, topEmotions, topPeople };
  }, [checkIns, people]);

  if ((!isSunday && !forceShow) || !week) return null;

  const maxMood = 10;

  return (
    <section
      aria-labelledby="week-review-heading"
      className="p-6"
      style={{ background: "var(--gradient-sky)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}
    >
      <p className="text-xs font-bold tracking-wide" style={{ color: "rgba(255,253,246,0.9)" }}>WEEK IN REVIEW</p>
      <h2 id="week-review-heading" className="text-3xl mt-1" style={{ color: "var(--gh-cream)" }}>
        The week, woven
      </h2>

      {/* mood arc as bars on the sky */}
      <div className="flex items-end gap-1.5 mt-5 h-20" role="img" aria-label={`Mood across the week, averaging ${week.avg.toFixed(1)}`}>
        {week.days.map((d) => {
          const entry = week.entries.find((e) => e.date === d);
          const h = entry?.mood_score ? (entry.mood_score / maxMood) * 100 : 6;
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-1">
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  background: entry ? "var(--gh-cream)" : "rgba(255,253,246,0.25)",
                  minHeight: 4,
                }}
              />
              <span className="text-xs" style={{ color: "rgba(255,253,246,0.85)" }}>
                {format(parseLocalDate(d), "EEEEE")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-1.5 text-sm" style={{ color: "var(--gh-cream)" }}>
        <p>Average mood {week.avg.toFixed(1)}. Brightest day {format(parseLocalDate(week.best.date), "EEEE")} at {week.best.mood_score}.</p>
        {week.topEmotions.length > 0 && (
          <p>The week felt {week.topEmotions.map((emotion, index) => (
            <React.Fragment key={emotion}>
              {index > 0 && ", "}
              <span className="inline-flex items-center gap-1 align-middle">
                <VocabularyIcon name={iconFor(emotion)} size={14} /> {emotion.toLowerCase()}
              </span>
            </React.Fragment>
          ))}.</p>
        )}
        {week.topPeople.length > 0 && <p>Most present: {week.topPeople.join(" and ")}.</p>}
      </div>

      <p className="mt-4 text-sm" style={{ color: "rgba(255,253,246,0.9)" }}>
        One question to carry: what does next week deserve more of?
      </p>
    </section>
  );
}
