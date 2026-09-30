// The dynamic half of the local wisdom engine: readings that weave live data
// (a tarot spread, two profiles, today's sky) rather than static per-system
// content. They never read the journal. Still zero API calls.
import { todayKey } from "@/lib/dates";
import { deriveAll } from "@/lib/resonance/derive";
import { astrologyPeriodWisdom, astrologyPlacements } from "./astrology";
import { ZODIAC } from "./content/zodiac";
import { NUMBERS, reduceToKey } from "./content/numerology";
import { resolveType, HD_TYPES } from "./content/humanDesign";
import { resolveEnneagram } from "./content/enneagram";
import { resolveArcana } from "./content/tarotArchetype";

// deterministic pick so a given card/number always phrases the same way
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

// ── Tarot / Oracle spread reading ────────────────────────────────────────────

// Questions about safety, staying, leaving, or someone's treatment of you.
// The cards can't weigh those, so the reading says so first. It errs toward
// saying so: a safety note beside an unrelated question ("Should I leave my
// job?") costs little, and a missed one can cost a lot.
export const RELATIONSHIP_QUESTION = /\b(stay\w*|leav\w*|left|go back|hurt\w*|abus\w*|unsafe|safe(ty)?|danger\w*|scared|afraid|fear\w*|frighten\w*|threat\w*|kill\w*|hit|hits|hitting|beat\w*|push(ed|es|ing)?|shov\w*|chok\w*|violen\w*|yell\w*|scream\w*|shout\w*|control\w*|jealous\w*|cheat\w*|partner\w*|husband|wife|boyfriend|girlfriend|spouse|ex|dating|marr\w*|divorc\w*|break ?up|relationship\w*|trust (him|her|them)|loves? me)\b/i;

/**
 * tarotReading({ spreadName, deck, cards, question, resonanceSummary })
 * cards: [{ card, position, reversed }]. Weaves the spread into one story of
 * images to reflect on; it never answers the question for the person.
 */
export function tarotReading({ spreadName = "spread", deck = "tarot", cards = [], question = "", resonanceSummary = "" } = {}) {
  if (!cards.length) return "";
  const paras = [];

  // Opening
  const opener = question
    ? `You laid out "${spreadName}" with a question in mind: "${question}". The cards can't answer it for you. Here is what they offer to think with.`
    : `You laid out "${spreadName}" with an open question. Here is what the cards offer to think with.`;
  paras.push(opener);
  if (question && RELATIONSHIP_QUESTION.test(question)) {
    paras.push("No reading can tell you whether someone is safe to be with or whether to stay. What you have recorded, how you are treated, and the people you trust can. If you are not safe, support is here whenever you want it.");
  }

  // Position by position, each named first so any label reads cleanly
  const lines = cards.map(({ card, position, reversed }) => {
    const meaning = reversed && card.reversed ? card.reversed : card.meaning;
    const kw = (card.keywords || []).slice(0, 2).join(" and ");
    const rev = reversed ? ", reversed," : "";
    return `${position}: ${card.name}${rev}${kw ? ` speaks of ${kw}` : ""}. ${meaning}`;
  });
  paras.push(lines.join(" "));

  // Synthesis across the spread
  const reversedCount = cards.filter((c) => c.reversed).length;
  const majors = cards.filter((c) => c.card.id < 22).length;
  const synthesis = [];
  if (cards.length > 1) {
    synthesis.push(
      majors >= Math.ceil(cards.length / 2)
        ? "Taken together, this spread holds many Major Arcana, which tarot readers link to larger themes than everyday choices. You decide whether any of them fit."
        : "Read as one picture, the cards point to daily, workable choices more than to large themes."
    );
    if (reversedCount === 0 && deck === "tarot") {
      synthesis.push("Nothing here is reversed, so each card is read in its upright sense.");
    } else if (reversedCount >= Math.ceil(cards.length / 2)) {
      synthesis.push("Several cards arrived reversed. Many readers take that as a turn inward: is there something you would like to acknowledge before deciding anything?");
    }
    paras.push(synthesis.join(" "));
  }

  if (resonanceSummary) {
    // The first line from the chart itself; today's sky is not the person's chart.
    const chartLine = resonanceSummary.split("\n")
      .map((l) => l.trim().replace(/^[-*]\s*/, "").replace(/^RESONANCE:\s*/, ""))
      .find((l) => l && !l.startsWith("TODAY:"));
    if (chartLine) paras.push(`It also sits beside your own chart: ${chartLine.replace(/[.!?]?$/, ".")} Keep what is useful and leave the rest.`);
  }

  // Closing line
  const closer = buildCarry(cards);
  paras.push(`Something to carry, if it fits: ${closer}`);

  return paras.join("\n\n");
}

// Card names can be phrases ("Choose the Living Option"), so they are never
// used as the subject of a sentence here.
function buildCarry(cards) {
  const last = cards[cards.length - 1];
  const focus = cards.find((c) => /advice|action|could lead|outcome/i.test(c.position)) || last;
  const kw = (focus.card.keywords || [])[0] || "presence";
  const options = [
    `${kw}. Where might it show up for you this week?`,
    `${kw}, in small, real ways. What could that look like today?`,
    `${kw}, the thread of ${focus.card.name}. Notice where you meet it.`,
  ];
  return pick(options, focus.card.id);
}

// ── Integrated blueprint reading (cross-system synthesis) ─────────────────────

export function integratedReading(enabledSystems = [], profile = {}) {
  let computed = {};
  try { computed = deriveAll(profile, todayKey()).values || {}; } catch { computed = {}; }

  const signals = collectSignals(enabledSystems, profile, computed);
  if (signals.length === 0) return "Choose an optional system and add the details you know. We will help you explore its questions while keeping your own experience at the center.";
  const paras = ["We are the plants. Let us put the systems you chose beside one another and see which questions are useful in your life."];
  paras.push(`A possible through-line to explore: ${joinNicely(signals.map(s => s.essence).slice(0, 3))}. These are symbolic associations, not independent evidence about who you are.`);
  const mirrorPairs = findResonances(signals);
  if (mirrorPairs.length) paras.push(mirrorPairs.join(" "));
  paras.push(`Each perspective has its own vocabulary: ${signals.map(s => `${s.label} offers ${s.short}`).join("; ")}. You can keep a useful question and leave an interpretation that does not fit.`);
  paras.push(findTension(signals));
  paras.push("Choose one real situation from your journal. What happened, what did you need, and what response would you like to practice? Return to the whole record over time. Feeling angry or uncomfortable does not mean you have stopped being yourself; your values, boundaries, and freedom to choose matter here.");
  return paras.join("\n\n");
}

function collectSignals(enabled, profile, computed) {
  const out = [];
  if (enabled.includes("astrology")) {
    const sun = astrologyPlacements(profile.astrology || {}, computed.astrology || {}).find(p => p.id === "sun")?.sign;
    if (sun && ZODIAC[sun]) out.push({
      system: "astrology", label: "Astrology", short: `a ${sun} Sun`,
      essence: ZODIAC[sun].gift, verb: `live out ${ZODIAC[sun].keywords[0]} and ${ZODIAC[sun].keywords[1]}`,
      short2: sun, element: ZODIAC[sun].element,
      tell: `when you drift into ${ZODIAC[sun].shadow}`,
    });
  }
  if (enabled.includes("human_design")) {
    const type = resolveType(profile.human_design?.type);
    if (type) out.push({
      system: "human_design", label: "Human Design", short: `the ${type}`,
      essence: `to honor your ${type} strategy, ${HD_TYPES[type].strategy}`,
      verb: `operate as a ${type}, ${HD_TYPES[type].strategy}`,
      tell: `when you feel ${HD_TYPES[type].notSelf} instead of ${HD_TYPES[type].signature}`,
    });
  }
  if (enabled.includes("numerology")) {
    const lp = reduceToKey(profile.numerology?.life_path || computed.numerology?.life_path);
    if (lp) out.push({
      system: "numerology", label: "Numerology", short: `Life Path ${lp}`,
      essence: NUMBERS[lp].core, verb: NUMBERS[lp].core,
      tell: `when you avoid the lesson of the ${NUMBERS[lp].title}`,
    });
  }
  if (enabled.includes("tarot_archetype")) {
    const birth = resolveArcana(profile.tarot_archetype?.birth_card || computed.tarot_archetype?.birth_card);
    if (birth) out.push({
      system: "tarot_archetype", label: "Tarot", short: `the archetype of ${birth.name}`,
      essence: `the path of ${birth.keywords[0]}`, verb: `embody ${birth.name}`,
      tell: `when you forget you carry ${birth.name}`,
    });
  }
  if (enabled.includes("enneagram")) {
    const t = resolveEnneagram(profile.enneagram?.type);
    if (t) out.push({
      system: "enneagram", label: "Enneagram", short: `Type ${t.number}, the ${t.name}`,
      essence: `the desire ${t.desire}`, verb: `move past the fear of ${t.fear} toward ${t.desire}`,
      tell: `when ${t.passion} takes over`,
    });
  }
  if (enabled.includes("gene_keys")) {
    const lifeWork = profile.gene_keys?.life_work || computed.gene_keys?.life_work;
    if (lifeWork) out.push({
      system: "gene_keys", label: "Gene Keys", short: `Life's Work in Gene Key ${lifeWork}`,
      essence: `your Life's Work Gene Key ${lifeWork}`, verb: `open your Life's Work key`,
      tell: `when you slip into its Shadow`,
    });
  }
  if (enabled.includes("chakras")) {
    const c = profile.chakras?.dominant_center;
    if (c) out.push({
      system: "chakras", label: "Chakras", short: `a ${c}-centered energy`,
      essence: `your ${c} center`, verb: `keep your ${c} center balanced`,
      tell: `when that center goes quiet or overheats`,
    });
  }
  return out;
}

function findResonances(signals) {
  const pairs = [];
  const astro = signals.find((s) => s.system === "astrology");
  const hd = signals.find((s) => s.system === "human_design");
  const num = signals.find((s) => s.system === "numerology");
  const tarot = signals.find((s) => s.system === "tarot_archetype");
  const gk = signals.find((s) => s.system === "gene_keys");
  if (num && tarot) pairs.push(`Your ${num.short} and ${tarot.short} are the same insight in two dialects, numerology and Tarot draw your archetype from the same root number.`);
  if (hd && gk) pairs.push(`Your Human Design and Gene Keys share one source, the 64 hexagrams; your Life's Work key is literally your Conscious Sun gate.`);
  if (astro && tarot) pairs.push(`Some Western esoteric traditions associate particular tarot cards with signs or planets. These correspondences offer another symbolic perspective, not confirmation of a prediction.`);
  return pairs;
}

function findTension(signals) {
  return signals.length > 1
    ? "When interpretations differ, you do not have to make them agree. Ask which perspective gives you a useful choice in the actual situation, and which adds pressure or confusion."
    : "Treat this perspective as an invitation to reflect. You do not need another system to know what you have experienced.";
}

// ── Relationship synergy reading (two profiles) ───────────────────────────────

// Every synergy reading carries this line. A saved reading without it was
// made with wording that has since been replaced, so it isn't shown.
export const SYNERGY_CAVEAT = "A chart cannot establish compatibility or excuse mistreatment.";
export const currentSynergy = (text) => (text && text.includes(SYNERGY_CAVEAT) ? text : null);

export function synergyReading(mine = {}, theirs = null, name = "this person") {
  const lived = `We are the plants. Let us keep your lived relationship in view: how are you treated, are your boundaries respected, and what repeats over time? ${SYNERGY_CAVEAT} A good day does not erase earlier harm, and no symbolic reading obliges you to stay.`;
  if (!theirs || Object.keys(theirs).length === 0) {
    return [
      `We don't have ${name}'s chart, and a chart couldn't tell you how ${name} treats you anyway. What you have recorded with ${name} says more than any reading could.`,
      lived,
    ].join("\n\n");
  }

  const paras = [];
  const allowsAstrology = profile => !Array.isArray(profile.enabled_systems) || profile.enabled_systems.includes("astrology");
  const mySun = allowsAstrology(mine) ? astrologyPlacements(mine.astrology || {}, deriveAll(mine).values.astrology).find(p => p.id === "sun")?.sign : null;
  const theirSun = allowsAstrology(theirs) ? astrologyPlacements(theirs.astrology || {}, deriveAll(theirs).values.astrology).find(p => p.id === "sun")?.sign : null;
  const myLP = reduceToKey(mine.numerology?.life_path), theirLP = reduceToKey(theirs.numerology?.life_path);
  const myType = resolveType(mine.human_design?.type), theirType = resolveType(theirs.human_design?.type);

  // elemental chemistry
  if (mySun && theirSun && ZODIAC[mySun] && ZODIAC[theirSun]) {
    const e1 = ZODIAC[mySun].element, e2 = ZODIAC[theirSun].element;
    paras.push(elementChemistry(e1, e2, mySun, theirSun, name));
  }

  // number rhythm
  if (myLP && theirLP) {
    paras.push(myLP === theirLP
      ? `You share a Life Path (${myLP}, the ${NUMBERS[myLP].title}). Numerology would say you may recognize each other's motives; whether that is true is for your own experience to show.`
      : `Your Life Paths, ${myLP} and ${theirLP}, are different. Numerology links yours with ${NUMBERS[myLP].core} and ${name}'s with ${NUMBERS[theirLP].core}. That can open a conversation about what each of you values; it doesn't explain or excuse how either of you acts.`);
  }

  // energetic mechanics
  if (myType && theirType) {
    paras.push(myType === theirType
      ? `Human Design would call you both ${myType}s, with the same suggested strategy. If it helps, talk about how each of you likes to decide and to rest.`
      : `Human Design would call you a ${myType} and ${name} a ${theirType}, with different suggested strategies: ${HD_TYPES[myType].strategy} and ${HD_TYPES[theirType].strategy}. If it helps, talk about how each of you likes to decide. A difference in design never makes one person's hurt the other's fault.`);
  }

  if (paras.length === 0) {
    paras.push(`There isn't enough in both profiles to compare yet: a Sun sign, Life Path, or Human Design type for each of you.`);
  }
  paras.push(lived);

  return paras.join("\n\n");
}

function elementChemistry(e1, e2, s1, s2, name) {
  return `Your ${s1} Sun is associated with ${e1.toLowerCase()}, while ${name}'s ${s2} Sun is associated with ${e2.toLowerCase()}. ${e1 === e2 ? "A shared element can prompt a conversation about familiar priorities; it does not demonstrate emotional understanding." : "Different elements can prompt a conversation about different priorities; they do not establish conflict."} Consider ${ZODIAC[s1].keywords[0]} and ${ZODIAC[s2].keywords[0]} as topics to discuss if you want to. Ask what each of you actually needs. Sun signs alone cannot establish aspects or tell you whether a relationship is supportive.`;
}

// ── Check-in pattern reading (Analytics oracle) ───────────────────────────────

export function patternReading(checkIns = []) {
  const rows = checkIns.filter((c) => c && (c.mood_score != null || c.energy_level != null));
  if (rows.length < 3) {
    return "A few more evenings of checking in and real patterns will start to show. Right now there is not quite enough to read, come back after a handful more days and this page will start telling you things you did not consciously know.";
  }

  const moods = rows.map((c) => c.mood_score).filter((m) => m != null);
  const avgMood = avg(moods);
  const trend = slope(moods.slice().reverse()); // rows are newest-first
  const emoCounts = tally(rows.flatMap((c) => c.emotions || []));
  const topEmos = Object.entries(emoCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e);

  const paras = [];

  // 1. the overall weather
  const weather = avgMood >= 7 ? "generally bright" : avgMood >= 5 ? "steady, with real ups and downs" : "on the heavier side lately";
  paras.push(
    `Across your last ${rows.length} check-ins, the overall weather has been ${weather}, your mood has averaged ${avgMood.toFixed(1)} out of 10${trend > 0.15 ? ", and it has been climbing" : trend < -0.15 ? ", and it has been sliding downward" : ", holding fairly level"}. ${trend < -0.15 ? "That downward drift is worth taking seriously, not as alarm but as information." : trend > 0.15 ? "Something you are doing is working; it is worth noticing what." : "Level is not the same as stuck, sometimes it means you have found a floor to stand on."}`
  );

  // 2. the emotional texture
  if (topEmos.length) {
    paras.push(
      `The feelings you name most often are ${joinNicely(topEmos)}. ${topEmos.length > 1 ? `Notice that ${topEmos[0]} and ${topEmos[topEmos.length - 1]} keep appearing together, they may be two faces of the same underlying thing.` : `${cap(topEmos[0])} has been the throughline.`} These are not random; they are the emotional key your days keep returning to.`
    );
  }

  // 3. a correlation the data hints at
  const corr = findCorrelation(rows);
  if (corr) paras.push(corr);

  // 4. the experiment
  paras.push(
    `One experiment for the coming week: ${buildExperiment(avgMood, trend, topEmos, corr)} Keep checking in, and next week we will see whether the pattern shifted.`
  );

  return paras.join("\n\n");
}

function findCorrelation(rows) {
  const withBoth = rows.filter((c) => c.mood_score != null && c.sleep_quality != null);
  if (withBoth.length >= 5) {
    const good = withBoth.filter((c) => c.sleep_quality >= 7);
    const poor = withBoth.filter((c) => c.sleep_quality < 5);
    if (good.length >= 2 && poor.length >= 2) {
      const gm = avg(good.map((c) => c.mood_score)), pm = avg(poor.map((c) => c.mood_score));
      if (gm - pm >= 1.2) return `There is a thread worth pulling: on your well-slept nights your mood averages ${gm.toFixed(1)}, and on poorly-slept ones it drops to ${pm.toFixed(1)}. Sleep looks less like a side issue and more like a lever, for you, it may be the lever.`;
    }
  }
  const withEnergy = rows.filter((c) => c.mood_score != null && c.energy_level != null);
  if (withEnergy.length >= 5) {
    const hi = withEnergy.filter((c) => c.energy_level >= 7), lo = withEnergy.filter((c) => c.energy_level < 5);
    if (hi.length >= 2 && lo.length >= 2) {
      const hm = avg(hi.map((c) => c.mood_score)), lm = avg(lo.map((c) => c.mood_score));
      if (hm - lm >= 1.2) return `Your mood and your energy move together closely, high-energy days average ${hm.toFixed(1)} in mood, low-energy days ${lm.toFixed(1)}. Tending your energy, rest, movement, food, may be the most direct way to tend your mood.`;
    }
  }
  return null;
}

function buildExperiment(avgMood, trend, topEmos, corr) {
  if (corr && corr.includes("Sleep")) return "protect your sleep as if it were the appointment that matters most, guard the same wind-down window each night, and watch what it does to the rest.";
  if (corr && corr.includes("energy")) return "pick one small daily act that reliably lifts your energy, a walk, a real meal, ten minutes outside, and do it on purpose rather than hoping the day provides it.";
  if (trend < -0.15) return "name the one thing that has been quietly draining you, and remove or shrink it for a week. Do not add a new practice; subtract the weight.";
  if (topEmos.length) return `when ${topEmos[0]} shows up this week, pause and ask what it is actually pointing to before you move to fix it. Let it be a messenger, not just a mood.`;
  return "at each check-in, add one sentence about what shaped the day. In a week you will have a map of your own levers.";
}

// ── Period wisdom (daily / weekly / monthly / yearly) ─────────────────────────

export function periodWisdom(periodType = "daily", profile = {}, graph = null) {
  let computed = {};
  try { computed = deriveAll(profile, todayKey()).values || {}; } catch { computed = {}; }
  const enabled = profile.enabled_systems || [];
  const num = enabled.includes("numerology") ? computed.numerology || {} : {};
  const moon = enabled.includes("astrology") ? graph?.today?.moonPhase : null;
  const astrology = enabled.includes("astrology") ? astrologyPeriodWisdom(periodType, profile.astrology || {}, computed.astrology || {}) : null;
  if (astrology) {
    const cycle = ({ daily: num.personal_day, weekly: num.personal_year, monthly: num.personal_month, yearly: num.personal_year })[periodType];
    const number = NUMBERS[reduceToKey(cycle)];
    return number ? { ...astrology, wisdom: `${astrology.wisdom}\n\nFrom your optional numerology practice: ${number.core}. Consider whether that question belongs beside this reflection.` } : astrology;
  }
  const name = (profile.first_name || "").trim();

  const birth = enabled.includes("tarot_archetype") ? resolveArcana(profile.tarot_archetype?.birth_card || computed.tarot_archetype?.birth_card) : null;
  const lp = reduceToKey(num.life_path);

  if (periodType === "daily") {
    const pd = num.personal_day;
    const theme = moon ? `${moon.name}${pd ? ` · Personal Day ${pd}` : ""}` : (pd ? `Personal Day ${pd}` : "Today");
    const parts = [];
    if (moon) parts.push(`The ${moon.name.toLowerCase()} can be a symbolic prompt: ${moonGuidance(moon.name)}`);
    if (pd && NUMBERS[reduceToKey(pd)]) {
      const n = NUMBERS[reduceToKey(pd)];
      parts.push(`Your personal day resonates with the ${n.title.toLowerCase()}, ${n.core}. ${dayAdvice(reduceToKey(pd))}`);
    }

    return {
      theme,
      wisdom: parts.join(" ") || `A quiet day to be exactly where you are${name ? `, ${name}` : ""}. Notice one small thing and let it be enough.`,
      contemplation: pd ? dayContemplation(reduceToKey(pd)) : "What is today actually asking of me, underneath the noise?",
    };
  }

  if (periodType === "weekly") {
    const parts = [
      lp && `Your Life Path ${lp} is linked with ${NUMBERS[lp].core}.`,
      birth && `You might watch for ${birth.name} in how the days unfold, with ${birth.keywords[0]} as a thread to notice.`,
      "Choose one thing to move forward this week, and let the rest be lighter where you can.",
    ].filter(Boolean);
    if (name) parts[0] = `${name}, ${parts[0].charAt(0).toLowerCase()}${parts[0].slice(1)}`;
    return {
      theme: "The week ahead",
      wisdom: parts.join(" "),
      contemplation: "What would this week look like if I trusted my own timing?",
    };
  }

  if (periodType === "monthly") {
    const pm = num.personal_month ? reduceToKey(num.personal_month) : null;
    return {
      theme: "This month's current",
      wisdom: pm && NUMBERS[pm]
        ? `You are in a personal ${pm} month, colored by the ${NUMBERS[pm].title.toLowerCase()}: ${NUMBERS[pm].core}. ${NUMBERS[pm].personalYear.replace("A year", "This month").replace("year", "month")}`
        : `This month, let your longer rhythms lead. ${lp ? `The pull of your Life Path ${lp}, ${NUMBERS[lp].core}, is the tide underneath the daily weather.` : "Notice the tide underneath the daily weather."}`,
      contemplation: "What is ripening in me that I keep rushing?",
    };
  }

  // yearly
  const py = num.personal_year ? reduceToKey(num.personal_year) : null;
  return {
    theme: "The year you are in",
    wisdom: py && NUMBERS[py]
      ? `This is a personal ${py} year for you, the season of the ${NUMBERS[py].title.toLowerCase()}. ${NUMBERS[py].personalYear} ${lp ? `Underneath the year runs your lifelong Life Path ${lp}: ${NUMBERS[lp].core}.` : ""}`
      : `Look back at what mattered this year and choose what you want to carry forward. ${lp ? `Your Life Path ${lp} names the longer arc: ${NUMBERS[lp].core}.` : ""}`,
    contemplation: "If this year had one theme, what would you call it?",
  };
}

function moonGuidance(name) {
  const n = String(name).toLowerCase();
  if (n.includes("new")) return "a threshold for intentions, plant quietly what you want to grow.";
  if (n.includes("full")) return "review what you have noticed and decide what deserves more attention.";
  if (n.includes("first quarter") || n.includes("waxing")) return "building energy, push a little on what you began.";
  if (n.includes("last quarter") || n.includes("waning")) return "consider what you would like to finish or make room for.";
  if (n.includes("crescent")) return "tender early momentum, protect the small new thing.";
  if (n.includes("gibbous")) return "refine and adjust as things come toward fullness.";
  return "notice the sky while choosing a pace that fits your needs.";
}

function dayAdvice(key) {
  const map = {
    1: "A day to begin, take the first step.", 2: "A day for patience and connection.",
    3: "A day to express and enjoy.", 4: "A day to do the solid work.",
    5: "A day for flexibility and change.", 6: "A day to tend home and heart.",
    7: "A day to slow down and reflect.", 8: "A day to act with purpose and power.",
    9: "A day to finish and release.", 11: "A day to trust your intuition.",
    22: "A day to build something real.", 33: "A day to give with an open heart.",
  };
  return map[key] || "";
}

function dayContemplation(key) {
  const map = {
    1: "Where am I waiting for permission I could give myself?", 2: "Who could I reach toward today?",
    3: "What wants to be expressed through me?", 4: "What small brick can I lay today?",
    5: "Where am I gripping when I could loosen?", 6: "Who, including me, needs tending?",
    7: "What am I too busy to hear?", 8: "Where can I step into my own authority?",
    9: "What am I ready to let go of?", 11: "What is my intuition already telling me?",
    22: "What am I here to build?", 33: "Where can my care take real form?",
  };
  return map[key] || "What is today asking of me?";
}

// ── small stats + text utils ─────────────────────────────────────────────────

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function slope(a) {
  if (a.length < 2) return 0;
  const n = a.length, xs = a.map((_, i) => i);
  const mx = avg(xs), my = avg(a);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (a[i] - my); den += (xs[i] - mx) ** 2; }
  return den ? num / den : 0;
}
function tally(arr) { const o = {}; arr.forEach((x) => { if (x) o[x] = (o[x] || 0) + 1; }); return o; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function joinNicely(arr) {
  const a = arr.filter(Boolean);
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;
}
