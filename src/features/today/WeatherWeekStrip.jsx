import React from "react";
import { format } from "date-fns";
import { addDaysKey, parseLocalDate, todayKey } from "@/lib/dates";
import WeatherOrb from "./WeatherOrb";

export default function WeatherWeekStrip({ checkIns = [], endDate = todayKey(), light = false }) {
  const days = Array.from({ length: 7 }, (_, index) => addDaysKey(endDate, index - 6));
  const recorded = days.filter((date) => checkIns.some((entry) => entry.date === date)).length;

  return (
    <div
      className="weather-week"
      data-light={light ? "true" : undefined}
      role="img"
      aria-label={`${recorded} of the last 7 evenings recorded`}
    >
      {days.map((date) => {
        const entry = checkIns.find((item) => item.date === date);
        const isToday = date === endDate;
        return (
          <span className="weather-week__day" key={date}>
            <WeatherOrb score={entry?.mood_score ?? null} size="tiny" selected={isToday && Boolean(entry)} />
            <span aria-hidden="true">{format(parseLocalDate(date), "EEEEE")}</span>
          </span>
        );
      })}
    </div>
  );
}
