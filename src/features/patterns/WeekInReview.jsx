import React, { useMemo } from "react";
import { parseLocalDate, addDaysKey, todayKey } from "@/lib/dates";
import { format } from "date-fns";
import { EMOTIONS } from "@/features/today/vocab";
import SkyField from "@/features/shell/SkyField";
import WeatherWeekStrip from "@/features/today/WeatherWeekStrip";
import { weatherForScore } from "@/features/today/weather";

const emojiFor = (label) => EMOTIONS.find((e) => e.label === label)?.emoji || "";

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
    for (const e of entries) for (const id of e.person_ids || []) personCounts[id] = (personCounts[id] || 0) + 1;
    const topPeople = Object.entries(personCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => people.find((p) => p.id === id)?.name)
      .filter(Boolean);

    return { days, entries, avg, best, topEmotions, topPeople };
  }, [checkIns, people]);

  if ((!isSunday && !forceShow) || !week) return null;

  const averageWeather = weatherForScore(week.avg);

  return (
    <SkyField moodScore={week.avg} showSun={false} veilIntensity={0.35} className="rounded-surface">
      <section aria-labelledby="week-review-heading" className="p-6 sm:p-8">
        <p className="text-sm" style={{ color: "rgba(255,253,246,0.76)" }}>Your seven-day weather</p>
        <h2 id="week-review-heading" className="text-3xl mt-1" style={{ color: "var(--gh-cream)" }}>
          Mostly {averageWeather.label.toLowerCase()}, with movement
        </h2>

        <div className="mt-7">
          <WeatherWeekStrip checkIns={week.entries} />
        </div>

        <div className="mt-6 space-y-1.5 text-sm" style={{ color: "var(--gh-cream)" }}>
          <p>Brightest on {format(parseLocalDate(week.best.date), "EEEE")}.</p>
          {week.topEmotions.length > 0 && (
            <p>Often present: {week.topEmotions.map((e) => `${emojiFor(e)} ${e.toLowerCase()}`).join(", ")}.</p>
          )}
          {week.topPeople.length > 0 && <p>Most present: {week.topPeople.join(" and ")}.</p>}
        </div>

        <p className="mt-5 pt-5 text-sm" style={{ color: "rgba(255,253,246,0.88)", borderTop: "1px solid rgba(255,253,246,0.28)" }}>
          What does next week deserve more of?
        </p>
      </section>
    </SkyField>
  );
}
