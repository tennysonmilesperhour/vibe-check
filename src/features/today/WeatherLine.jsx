import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateDailyWeather } from "@/functions/generateDailyWeather";
import { todayKey } from "@/lib/dates";
import { resonanceGraph, summarizeGraph } from "@/lib/resonance/graph";

/**
 * Today's cosmic weather, generated once per local day and cached server-side.
 * Renders nothing until it has something true to say; failures stay silent
 * here because Today must never depend on an LLM round trip.
 */
export default function WeatherLine({ onActivePoints }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.cosmic_profile?.enabled_systems?.length) return;
        const summary = summarizeGraph(resonanceGraph(me.cosmic_profile, todayKey()));
        const res = await generateDailyWeather({ period_key: todayKey(), resonance_summary: summary });
        if (!cancelled && res?.data?.weather) {
          setWeather(res.data.weather);
          onActivePoints?.(res.data.weather.contemplation?.split(" · ").filter(Boolean) || []);
        }
      } catch {
        // silent: the page reads fine without weather
      }
    })();
    return () => { cancelled = true; };
  }, [onActivePoints]);

  if (!weather) return null;

  return (
    <div className="p-4" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))" }}>
      <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>TODAY'S COSMIC WEATHER</p>
      <p className="font-display text-2xl mt-1" style={{ color: "var(--gh-ink)" }}>{weather.theme}</p>
      <p className="text-sm mt-1 max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>{weather.wisdom}</p>
      {weather.contemplation && (
        <p className="text-xs mt-2" style={{ color: "var(--gh-accent)" }}>{weather.contemplation}</p>
      )}
    </div>
  );
}
