import React, { useMemo } from "react";
import { format } from "date-fns";
import { addDaysKey, parseLocalDate, todayKey } from "@/lib/dates";
import { weatherForScore } from "@/features/today/weather";

/** A month of inner weather arranged as an almanac, including unwritten days. */
export default function WeatherAtlas({ checkIns, days = 30 }) {
  const atlas = useMemo(() => {
    const byDate = new Map(checkIns.map((entry) => [entry.date, entry]));
    return Array.from({ length: days }, (_, index) => {
      const date = addDaysKey(todayKey(), index - days + 1);
      return { date, entry: byDate.get(date) || null };
    });
  }, [checkIns, days]);

  return (
    <div className="weather-atlas" role="list" aria-label={`${days} day inner weather atlas`}>
      {atlas.map(({ date, entry }) => {
        const weather = entry ? weatherForScore(entry.mood_score) : null;
        return (
          <div
            key={date}
            role="listitem"
            className="weather-atlas__day"
            data-weather={weather?.id || "unwritten"}
            aria-label={entry ? `${format(parseLocalDate(date), "MMMM d")}: ${weather.label}, mood ${entry.mood_score}` : `${format(parseLocalDate(date), "MMMM d")}: not recorded`}
          >
            <span className="weather-atlas__date">{format(parseLocalDate(date), "d")}</span>
            <span className="weather-atlas__sky"><span /></span>
            <span className="weather-atlas__value">{entry?.mood_score ?? "·"}</span>
          </div>
        );
      })}
    </div>
  );
}

