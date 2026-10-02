import { describe, it, expect } from "vitest";
import { personalYear } from "../../resonance/numerology";
import { todayKey } from "../../dates";
import { systemReading } from "../engine";
import { tarotReading, integratedReading, synergyReading, periodWisdom } from "../readings";

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
    expect(t).toContain("a wish to understand how things work");
    expect(t).toContain("fear");
    expect(t).toContain("some of type 4's qualities");
    // Not any school's type names.
    expect(t).not.toMatch(/investigator|reformer|individualist|loyalist|enthusiast|challenger|peacemaker/);
  });

  it("enneagram reads a wing only when it belongs to the type", () => {
    // A 4w5 wing left over after switching to Type 9.
    const leftover = systemReading("enneagram", { type: "9 – Peace and harmony", wing: "4w5" }, PROFILE);
    expect(leftover).not.toMatch(/wing/i);
    expect(systemReading("enneagram", { type: "9", wing: "9w1" }, PROFILE)).toMatch(/some of Type 1's qualities into Type 9/);
    expect(systemReading("enneagram", { type: "1", wing: "1w9" }, PROFILE)).toMatch(/some of Type 9's qualities into Type 1/);
  });

  it("numerology reads the current personal year, not a saved one", () => {
    const profile = { birth_date: "1990-07-15", enabled_systems: ["numerology"], numerology: {} };
    const current = personalYear("1990-07-15", todayKey());
    const saved = current === 1 ? "2" : "1";
    const reading = systemReading("numerology", { life_path: "5", personal_year: saved }, profile);
    expect(reading).toContain(`YOUR PERSONAL YEAR (${current})`);
    expect(reading).not.toContain(`YOUR PERSONAL YEAR (${saved})`);
  });

  it("numerology says an 8 year and a 3 year", () => {
    // Birth dates whose personal year today is 8, and 3.
    const born = (year) => {
      for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) {
        const date = `1990-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (personalYear(date, todayKey()) === year) return date;
      }
      return null;
    };
    for (const [year, article] of [[8, "an"], [3, "a"]]) {
      const profile = { birth_date: born(year), enabled_systems: ["numerology"] };
      expect(systemReading("numerology", { life_path: "5" }, profile)).toContain(`reads this as ${article} ${year} year`);
    }
    // Without a birth date there is no personal year to read, even a saved one.
    expect(systemReading("numerology", { life_path: "5", personal_year: "8" }, { enabled_systems: ["numerology"] })).not.toMatch(/personal year|a 8|an 8/i);
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
  it("names a chakra saved as the form's full option, and says an Aries Sun", () => {
    const profile = { ...PROFILE, astrology: { sun_sign: "Aries", sun_source: "entered" }, chakras: { dominant_center: "Heart (Anahata) – Love & connection" } };
    const t = integratedReading(["astrology", "chakras"], profile);
    expect(t).toContain("Chakras offers the Heart center");
    expect(t).toContain("Astrology offers an Aries Sun");
    expect(t).not.toContain("Love & connection center");
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

describe("periodWisdom", () => {
  for (const p of ["daily", "weekly", "monthly", "yearly"]) {
    it(`returns theme/wisdom/contemplation for ${p}`, () => {
      const w = periodWisdom(p, PROFILE, null);
      expect(w.theme).toBeTruthy();
      expect(w.wisdom.length).toBeGreaterThan(20);
      expect(w.contemplation).toBeTruthy();
    });
  }
  it("names the numerology cycle it draws on beside astrology", () => {
    const profile = { ...PROFILE, enabled_systems: ["astrology", "numerology"] };
    expect(periodWisdom("weekly", profile, null).wisdom).toMatch(/your personal year number is \d/);
    expect(periodWisdom("daily", profile, null).wisdom).toMatch(/your personal day number is \d/);
    expect(periodWisdom("monthly", profile, null).wisdom).toMatch(/your personal month number is \d/);
  });
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
