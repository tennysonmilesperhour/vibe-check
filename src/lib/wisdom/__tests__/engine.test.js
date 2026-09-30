import { describe, it, expect } from "vitest";
import { systemReading } from "../engine";
import { tarotReading, integratedReading, synergyReading, patternReading, periodWisdom } from "../readings";

// A fully-populated sample so derived values (life path, birth card, etc.) fill in.
const PROFILE = {
  first_name: "Ada",
  last_name: "Lovelace",
  birth_date: "1990-07-14",
  enabled_systems: ["astrology", "human_design", "gene_keys", "numerology", "tarot_archetype", "enneagram", "chakras"],
  astrology: { sun_sign: "Cancer", moon_sign: "Scorpio", rising_sign: "Leo", north_node: "Aquarius" },
  human_design: { type: "Manifesting Generator", authority: "Sacral", profile: "3/5", definition: "Single", incarnation_cross: "Right Angle Cross of Planning" },
  gene_keys: { life_work: "43", evolution: "23", radiance: "22", purpose: "47" },
  numerology: { life_path: "4", expression: "7", soul_urge: "9", personal_year: "5" },
  tarot_archetype: { birth_card: "The Emperor", shadow_card: "The Empress" },
  enneagram: { type: "5", wing: "5w4", instinct: "Self-Preservation (sp)", tritype: "531" },
  chakras: { dominant_center: "Third Eye (Ajna)" },
};

describe("systemReading", () => {
  for (const sys of PROFILE.enabled_systems) {
    it(`produces a substantial reading for ${sys}`, () => {
      const text = systemReading(sys, PROFILE[sys], PROFILE);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(300);
    });
  }

  it("astrology names the sun sign", () => {
    expect(systemReading("astrology", PROFILE.astrology, PROFILE)).toContain("Cancer");
  });

  it("human design names the type and strategy", () => {
    const t = systemReading("human_design", PROFILE.human_design, PROFILE).toLowerCase();
    expect(t).toContain("manifesting generator");
    expect(t).toContain("respond");
  });

  it("gene keys renders the shadow-gift-siddhi spectrum", () => {
    const t = systemReading("gene_keys", PROFILE.gene_keys, PROFILE).toLowerCase();
    expect(t).toContain("gene key 43"); // Deafness -> Insight -> Epiphany
    expect(t).toContain("insight");
  });

  it("numerology reads the life path", () => {
    expect(systemReading("numerology", PROFILE.numerology, PROFILE)).toContain("Life Path 4");
  });

  it("tarot archetype names the birth card", () => {
    expect(systemReading("tarot_archetype", PROFILE.tarot_archetype, PROFILE)).toContain("The Emperor");
  });

  it("enneagram names the type, its wish and fear, and the wing's type", () => {
    const t = systemReading("enneagram", PROFILE.enneagram, PROFILE).toLowerCase();
    expect(t).toContain("type 5: understanding and self-reliance");
    expect(t).toContain("a wish to be capable");
    expect(t).toContain("fear");
    expect(t).toContain("some of type 4's qualities");
    // Not any school's type names.
    expect(t).not.toMatch(/investigator|reformer|individualist|loyalist|enthusiast|challenger|peacemaker/);
  });

  it("chakras names the center", () => {
    expect(systemReading("chakras", PROFILE.chakras, PROFILE)).toContain("Third Eye");
  });

  it("gracefully handles an empty profile", () => {
    const t = systemReading("astrology", {}, {});
    expect(typeof t).toBe("string");
    expect(t.length).toBeGreaterThan(20);
  });
});

describe("tarotReading", () => {
  const cards = [
    { card: { id: 4, name: "The Emperor", keywords: ["structure", "authority"], meaning: "Order and stability.", reversed: "Rigidity." }, position: "Past", reversed: false },
    { card: { id: 17, name: "The Star", keywords: ["hope", "renewal"], meaning: "Hope returns.", reversed: "Lost faith." }, position: "Present", reversed: false },
    { card: { id: 13, name: "Death", keywords: ["endings", "rebirth"], meaning: "Transformation.", reversed: "Resistance." }, position: "Future", reversed: true },
  ];

  it("weaves the spread into one story with a closing line", () => {
    const t = tarotReading({ spreadName: "Past · Present · Future", deck: "tarot", cards, question: "What should I focus on?" });
    expect(t).toContain("The Emperor");
    expect(t).toContain("Something to carry, if it fits:");
    expect(t.length).toBeGreaterThan(200);
  });

  it("returns empty for no cards", () => {
    expect(tarotReading({ cards: [] })).toBe("");
  });
});

describe("integratedReading", () => {
  it("synthesizes across enabled systems", () => {
    const t = integratedReading(PROFILE.enabled_systems, PROFILE);
    expect(t.length).toBeGreaterThan(400);
    expect(t.toLowerCase()).toContain("through-line");
  });
  it("prompts when nothing is enabled", () => {
    expect(integratedReading([], {}).length).toBeGreaterThan(20);
  });
});

describe("synergyReading", () => {
  it("compares two profiles", () => {
    const other = { astrology: { sun_sign: "Capricorn" }, numerology: { life_path: "2" }, human_design: { type: "Projector" } };
    const t = synergyReading(PROFILE, other, "Charles");
    expect(t).toContain("Charles");
    expect(t.length).toBeGreaterThan(200);
  });
  it("handles an unknown partner", () => {
    const t = synergyReading(PROFILE, null, "Someone");
    expect(t).toContain("Someone");
  });
});

describe("patternReading", () => {
  it("reads real check-in data", () => {
    const checkIns = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-06-${10 + i}`,
      mood_score: 5 + (i % 4),
      energy_level: 4 + (i % 5),
      sleep_quality: i % 2 === 0 ? 8 : 4,
      emotions: i % 2 === 0 ? ["calm", "hopeful"] : ["tired", "anxious"],
    }));
    const t = patternReading(checkIns);
    expect(t.length).toBeGreaterThan(200);
    expect(t.toLowerCase()).toContain("check-in");
  });
  it("asks for more data when there is too little", () => {
    expect(patternReading([{ mood_score: 6 }]).length).toBeGreaterThan(20);
  });
});

describe("periodWisdom", () => {
  for (const p of ["daily", "weekly", "monthly", "yearly"]) {
    it(`returns theme/wisdom/contemplation for ${p}`, () => {
      const w = periodWisdom(p, PROFILE, null);
      expect(w.theme).toBeTruthy();
      expect(w.wisdom.length).toBeGreaterThan(20);
      expect(w.contemplation).toBeTruthy();
    });
  }
});

import { GK_SEQUENCE_META } from '../content/geneKeys';

describe('Gene Keys spheres', () => {
  it('name the chart positions Gene Keys uses', () => {
    expect(GK_SEQUENCE_META.life_work.sphere).toMatch(/Personality Sun/);
    expect(GK_SEQUENCE_META.evolution.sphere).toMatch(/Personality Earth/);
    expect(GK_SEQUENCE_META.radiance.sphere).toMatch(/Design Sun/);
    expect(GK_SEQUENCE_META.purpose.sphere).toMatch(/Design Earth/);
    expect(GK_SEQUENCE_META.attraction.sphere).toMatch(/Design Moon/);
    expect(GK_SEQUENCE_META.iq.sphere).toMatch(/Personality Venus/);
  });
});
