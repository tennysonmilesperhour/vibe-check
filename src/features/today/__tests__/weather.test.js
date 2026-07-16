import { describe, it, expect } from "vitest";
import { composeWeather } from "../WeatherLine.jsx";
import { resonanceGraph } from "@/lib/resonance/graph";

const PROFILE = {
  first_name: "Ada",
  last_name: "Lovelace",
  birth_date: "1990-07-14",
  enabled_systems: ["astrology", "human_design", "gene_keys", "numerology", "tarot_archetype"],
  astrology: { sun_sign: "Cancer", moon_sign: "Scorpio" },
  human_design: { type: "Manifesting Generator", conscious_sun_gate: "43" },
  gene_keys: { life_work: "43" },
  numerology: {},
  tarot_archetype: {},
};

describe("composeWeather", () => {
  it("returns null without a today layer", () => {
    expect(composeWeather(resonanceGraph(PROFILE, undefined))).toBeNull();
    expect(composeWeather(null)).toBeNull();
  });

  it("themes on moon phase and personal day", () => {
    const w = composeWeather(resonanceGraph(PROFILE, "2026-07-16"));
    expect(w.theme).toMatch(/Personal Day \d/);
    expect(w.theme.split("·")[0].trim().length).toBeGreaterThan(2);
  });

  it("names the touched placements when the moon placement exists", () => {
    // astrology.moon is always today-touched when present
    const w = composeWeather(resonanceGraph(PROFILE, "2026-07-16"));
    expect(w.activeLabels).toContain("Moon in Scorpio");
    expect(w.wisdom).toContain("Moon in Scorpio");
  });

  it("falls back to an honest open-day line when nothing is stirred", () => {
    const bare = { ...PROFILE, astrology: { sun_sign: "Cancer" }, birth_date: "" };
    const w = composeWeather(resonanceGraph(bare, "2026-07-16"));
    expect(w.activeLabels).toEqual([]);
    expect(w.wisdom).toMatch(/moon is \d+% lit/i);
  });

  it("every wisdom sentence traces to graph structure (no invented placements)", () => {
    const graph = resonanceGraph(PROFILE, "2026-07-16");
    const w = composeWeather(graph);
    const labels = graph.nodes.map((n) => n.label);
    for (const label of w.activeLabels) expect(labels).toContain(label);
  });
});
