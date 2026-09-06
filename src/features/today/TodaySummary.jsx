import React, { useRef, useState } from "react";
import { EMOTIONS } from "./vocab";
import { Pencil, ImageDown } from "lucide-react";
import { shareNodeAsImage } from "@/lib/share";
import { todayKey } from "@/lib/dates";
import { format } from "date-fns";
import SkyField from "@/features/shell/SkyField";
import WeatherWeekStrip from "./WeatherWeekStrip";
import { weatherForScore } from "./weather";
import DailySigil from "./DailySigil";

const emojiFor = (label) => EMOTIONS.find((e) => e.label === label)?.emoji || "";

/** Field-register summary of today's saved entry. */
export default function TodaySummary({ entry, checkIns = [], onEdit }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    setSharing(true);
    try {
      await shareNodeAsImage(cardRef.current, `vibe-${todayKey()}.png`);
    } catch {
      // capture is best-effort; the day itself is already kept
    }
    setSharing(false);
  };
  const weather = weatherForScore(entry.mood_score);
  const allCheckIns = checkIns.some((item) => item.id === entry.id || item.date === entry.date)
    ? checkIns
    : [entry, ...checkIns];

  return (
    <SkyField
      moodScore={entry.mood_score}
      veilIntensity={0.45}
      className="weather-summary"
    >
      <section aria-labelledby="today-summary-heading" ref={cardRef} className="weather-summary__content">
        <span className="weather-summary__actions flex flex-wrap justify-end gap-x-4 gap-y-1" data-html2canvas-ignore="true">
          <button
            type="button"
            onClick={share}
            disabled={sharing}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "rgba(255,253,246,0.82)" }}
          >
            <ImageDown className="w-3.5 h-3.5" aria-hidden="true" /> {sharing ? "Capturing…" : "Share as image"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--gh-cream)" }}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Revisit today
          </button>
        </span>
        <div className="weather-summary__spacer" aria-hidden="true" />
        <div className="weather-summary__identity">
          <div>
            <p className="text-sm" style={{ color: "rgba(255,253,246,0.78)" }}>
              {format(new Date(`${entry.date}T12:00:00`), "EEEE")}, recorded
            </p>
            <h2 id="today-summary-heading" className="mt-2 text-4xl sm:text-5xl" style={{ color: "var(--gh-cream)", lineHeight: 0.98 }}>
              {weather.description}
            </h2>
          </div>
          <DailySigil entry={entry} />
        </div>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,253,246,0.9)" }}>
          {weather.reflection}
        </p>

        {entry.emotions?.length > 0 && (
          <p className="mt-3 text-sm" style={{ color: "rgba(255,253,246,0.82)" }}>
            Also present: {entry.emotions.map((label) => `${emojiFor(label)} ${label.toLowerCase()}`).join(", ")}.
          </p>
        )}

        <div className="mt-7">
          <WeatherWeekStrip checkIns={allCheckIns} endDate={entry.date} />
        </div>
      </section>
    </SkyField>
  );
}
