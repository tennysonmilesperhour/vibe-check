import React, { useEffect, useState } from "react";
import { Reading } from "@/entities/all";
import { format, parseISO } from "date-fns";

export default function ReadingArchive() {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    Reading.list("-created_date", 8).then(setReadings).catch(() => setReadings([]));
  }, []);

  if (!readings.length) return null;

  return (
    <details className="reading-shelf">
      <summary>Open your reading shelf <span>{readings.length}</span></summary>
      <ol>
        {readings.map((reading) => (
          <li key={reading.id}>
            <span className="reading-shelf__date">
              {reading.date ? format(parseISO(`${reading.date}T12:00:00`), "MMM d") : "Saved"}
            </span>
            <span className="reading-shelf__title">{reading.question || `${reading.deck === "oracle" ? "Oracle" : "Tarot"} reflection`}</span>
            <span className="reading-shelf__meta">{reading.spread?.replaceAll("_", " ") || "one card"}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

