// The local wisdom engine. Composes detailed, personalized readings from the
// content tables and the user's profile data — with zero API calls. Every
// surface that used to hit InvokeLLM now draws from here.
import { todayKey } from "@/lib/dates";
import { deriveAll } from "@/lib/resonance/derive";
import { astrologyReading } from "./astrology";
import { NUMBERS, reduceToKey } from "./content/numerology";
import { HD_TYPES, resolveType, resolveAuthority, resolveProfile } from "./content/humanDesign";
import { GK_SEQUENCE_META, resolveKey } from "./content/geneKeys";
import { resolveArcana } from "./content/tarotArchetype";
import { resolveEnneagram, resolveInstinct } from "./content/enneagram";
import { resolveChakra } from "./content/chakras";

// ── formatting helpers ───────────────────────────────────────────────────────

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Render an array of { h, p } sections into the pre-wrapped text the UI shows. */
function format(sections) {
  return sections
    .filter((s) => s && s.p)
    .map((s) => (s.h ? `${s.h.toUpperCase()}\n${s.p}` : s.p))
    .join("\n\n");
}

// ── per-system composers ─────────────────────────────────────────────────────

function humanDesignReading(data) {
  const d = clean(data);
  const type = resolveType(d.type);
  const auth = resolveAuthority(d.authority);
  const prof = resolveProfile(d.profile);
  const sections = [];

  if (!type && !auth && !prof) {
    return "Enter your Human Design Type, Authority, and Profile on the My Profile tab to unlock your full reading. If you do not know your chart yet, you can calculate it for free from your birth date, time, and place at any Human Design bodygraph site, then enter the results here.";
  }

  if (type) {
    const t = HD_TYPES[type];
    sections.push({ h: `Your type: ${type}`, p: t.body });
    sections.push({
      h: "Your strategy",
      p: `Human Design suggests the strategy ${t.strategy}. It names ${t.signature} as this type's signature and ${t.notSelf} as its not-self theme. Only you can say what your feelings mean: ${t.notSelf} can be a fitting response to how you are treated, and it doesn't mean you are off course. No strategy's timing applies to your safety; if you are unsafe, you don't have to wait for anything.`,
    });
  }
  if (auth) {
    // With a type, its strategy section above already says this.
    sections.push({ h: auth.label, p: type ? auth.text : `${auth.text} No system's timing applies to your safety; if you are unsafe, you don't have to wait for anything.` });
  }
  if (prof) {
    sections.push({ h: `Profile ${prof.key}: the ${prof.name}`, p: prof.text });
  }
  if (d.definition) sections.push({ h: "Definition", p: `Your definition is ${d.definition}. This describes how energy flows and connects across your chart, and how self-contained or relationship-driven your inner wiring tends to be.` });
  if (d.strategy && !type) sections.push({ h: "Strategy", p: `Your noted strategy: ${d.strategy}.` });
  if (d.incarnation_cross) sections.push({ h: "Incarnation Cross", p: `Human Design describes your Incarnation Cross, the ${d.incarnation_cross}, as a theme across your life. Take it as one perspective on purpose; your own sense of purpose may differ.` });
  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  sections.push({
    h: "Living it",
    p: `If you want to test Human Design, try ${type ? `its suggested strategy, ${HD_TYPES[type].strategy},` : "giving yourself a little more time before you commit"} on one real decision this week that you can safely take time over. Afterward, notice what was useful and what wasn't. You decide what counts.`,
  });

  return format(sections);
}

function geneKeysReading(data, computed) {
  const d = { ...computed, ...clean(data) };
  const order = ["life_work", "evolution", "radiance", "purpose", "attraction", "iq"];
  const present = order.filter((k) => d[k]);
  const sections = [];

  if (present.length === 0) {
    return "Your Life's Work Gene Key equals your Conscious Sun Gate in Human Design. Enter that gate number (or any of your Gene Keys) on the My Profile tab and your reading will appear here.";
  }

  sections.push({
    h: "Your Golden Path",
    p: `Gene Keys describes each key as a spectrum with three names, a Shadow, a Gift and a Siddhi. These are the keys currently in your profile, offered as words to reflect with. A hard feeling or a hard situation doesn't mean you have fallen into a shadow.`,
  });

  for (const k of present) {
    const key = resolveKey(d[k]);
    if (!key) continue;
    const meta = GK_SEQUENCE_META[k];
    sections.push({
      h: `${meta.label}: Gene Key ${key.number}`,
      p: `Gene Keys links this sphere with ${meta.sphere}. It names this key's spectrum ${key.shadow}, ${key.gift} and ${key.siddhi}, and describes it as ${key.essence}. Notice whether any of it matches your experience, and leave what doesn't.`,
    });
  }

  const lifeKey = resolveKey(d.life_work);
  sections.push({
    h: "Living it",
    p: `Gene Keys is meant for slow contemplation.${lifeKey ? ` This week, if you like, hold your Life's Work key in mind: where do you already see ${lifeKey.gift} in your life?` : ""} Keep what is useful and leave the rest.`,
  });

  return format(sections);
}

function numerologyReading(data, computed) {
  const d = { ...computed, ...clean(data) };
  const sections = [];
  const lpKey = reduceToKey(d.life_path);
  const exprKey = reduceToKey(d.expression);
  const soulKey = reduceToKey(d.soul_urge);
  const yearKey = reduceToKey(d.personal_year);

  if (!lpKey && !exprKey && !soulKey) {
    return "Add your birth date and full birth name on the Systems tab. Your Life Path comes from your birth date and your Expression and Soul Urge from your name, and the full reading will compose here.";
  }

  if (lpKey) {
    const n = NUMBERS[lpKey];
    sections.push({ h: `Life Path ${lpKey}: ${n.title}`, p: n.lifePath });
  }
  if (exprKey) {
    const n = NUMBERS[exprKey];
    sections.push({ h: `Expression ${exprKey}`, p: `${n.expression} Your name carries the vibration of ${n.title.toLowerCase()}: ${n.core}.` });
  }
  if (soulKey) {
    const n = NUMBERS[soulKey];
    sections.push({ h: `Soul Urge ${soulKey}`, p: n.soulUrge });
  }

  // synthesis
  if (lpKey && soulKey) {
    sections.push({
      h: "The story your numbers tell",
      p: lpKey === soulKey
        ? `Your Life Path and Soul Urge share the number ${lpKey}, a rare alignment: the road you walk and the thing your heart wants are one and the same. When you follow your desire, you are already on your path.`
        : `Your Life Path ${lpKey} is the road; your Soul Urge ${soulKey} is the reason you walk it. The outer journey of ${NUMBERS[lpKey].core} is powered by the inner longing for ${NUMBERS[soulKey].core}. When those two cooperate, you feel purposeful; when they conflict, notice which one you have been ignoring.`,
    });
  }

  if (yearKey) {
    const n = NUMBERS[yearKey];
    sections.push({ h: `Your Personal Year (${yearKey})`, p: n.personalYear });
  }

  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  sections.push({
    h: "Living it",
    p: `Numerology is a rhythm you can move with instead of against.${yearKey ? ` Right now you are in a ${yearKey} year, so align your effort with its theme rather than fighting the current.` : ""} Your core number, Life Path ${lpKey || "—"}, is the through-line of a whole lifetime; the yearly numbers are the seasons within it.`,
  });

  return format(sections);
}

function tarotArchetypeReading(data, computed) {
  const d = { ...computed, ...clean(data) };
  const birth = resolveArcana(d.birth_card);
  // The soul card and the method belong to the computed birth card, not one
  // chosen by hand.
  const computedBirth = Boolean(birth) && resolveArcana(computed.birth_card)?.name === birth.name;
  const soul = computedBirth ? resolveArcana(computed.soul_card) : null;
  const shadow = resolveArcana(d.shadow_card);
  const year = resolveArcana(d.personal_year_card);
  const sections = [];

  if (!birth && !shadow) {
    return "Your Tarot birth cards are worked out from your birth date. Add it on the Systems tab and a reading of your birth card will appear here.";
  }

  if (birth) {
    sections.push({ h: `Your Birth Card: ${birth.name}`, p: birth.archetype });
    sections.push({ h: "Its keynote", p: `Keywords of this card: ${birth.keywords.join(", ")}. Some readers treat these as themes that recur across a life. Keep what fits.` });
  }
  if (soul && soul.name !== birth?.name) {
    sections.push({ h: `Your Soul Card: ${soul.name}`, p: soul.archetype });
  }
  if (shadow && shadow.name !== birth?.name) {
    sections.push({ h: `Your Shadow Card: ${shadow.name}`, p: shadow.shadow });
    sections.push({
      h: "The two together",
      p: `${birth ? `Your Birth Card ${birth.name} and Shadow Card ${shadow.name} can be read together: one as a strength, the other as a theme that may challenge you. ` : ""}Hard things in your life are not assigned by a card, and they don't have to be lessons.`,
    });
  }
  if (year && year.name !== birth?.name) {
    sections.push({ h: `This year: ${year.name}`, p: year.year });
  }
  if (computedBirth) {
    sections.push({ h: "How these are worked out", p: "Vibe Check follows Mary K. Greer's method. Your birth card adds your birth month, day and year and reduces the total to 22 or less, with 22 as The Fool. Your soul card reduces that number to one digit, and your year card uses the same sum with this year." });
  }

  sections.push({
    h: "Living it",
    p: `${birth ? `If you like, notice where the themes of ${birth.name} show up this week, and where they don't. ` : ""}What you notice in your own life counts for more than what a card says.`,
  });

  return format(sections);
}

function enneagramReading(data) {
  const d = clean(data);
  const t = resolveEnneagram(d.type);
  const inst = resolveInstinct(d.instinct);
  const sections = [];

  if (!t) {
    return "Enter your Enneagram type (1 through 9) on the My Profile tab to unlock your reading. If you are unsure of your type, look for the core fear and desire below that ring truest, that is usually your type talking.";
  }

  sections.push({ h: `Type ${t.number}: ${t.name}`, p: `At your core, your basic fear is ${t.fear}, and your basic desire is ${t.desire}. Everything about your personality is, at root, a strategy to avoid that fear and secure that desire.` });
  sections.push({ h: "The pattern that runs you", p: `Your passion is ${t.passion}. Your mental fixation is ${t.fixation}. These are not moral failings; they are the automatic pattern your type falls into when you are running on autopilot. Seeing it clearly is most of the work.` });

  if (d.wing) {
    sections.push({ h: `Your wing (${d.wing})`, p: `Your wing flavors the core type, lending it an additional set of colors and coping strategies. You are unmistakably a ${t.number}, but the ${d.wing} wing shapes how that ${t.number} shows up, tilting you toward the neighboring type's gifts and tensions.` });
  }
  if (inst) {
    sections.push({ h: `Your instinct: ${inst.label}`, p: inst.text });
  }
  if (d.tritype) {
    sections.push({ h: `Your three-center type (${d.tritype})`, p: `Some Enneagram teachers look at the type you lean on in each center, head, heart and body. Together they can describe more of how you think, feel and act. Keep what fits.` });
  }

  sections.push({ h: "Under stress and in growth", p: `When you are stretched thin you move ${t.disintegration}. When you are healthy and growing you move ${t.integration}. Knowing both directions gives you an early-warning system and a map: notice the slide toward stress, and consciously practice the qualities of your growth point.` });
  sections.push({ h: "The way through", p: `Some Enneagram teachers pair each type with a "holy idea"; for this type it is ${t.holyIdea}. ${t.growth}` });

  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  return format(sections);
}

function chakraReading(data) {
  const d = clean(data);
  const c = resolveChakra(d.dominant_center);
  const sections = [];

  if (!c) {
    return "Choose your dominant or focus chakra on the My Profile tab to unlock your reading. If you are unsure, notice which theme below is most alive for you right now, whether it is safety, creativity, power, love, voice, insight, or meaning.";
  }

  sections.push({ h: `The center you chose: ${c.name} (${c.sanskrit})`, p: `Chakra traditions place this center at the ${c.location} and associate it with the element of ${c.element}, the color ${c.color}, and ${c.theme}.` });
  sections.push({ h: "When it is balanced", p: `Some teachers describe this center in balance with qualities like being ${c.balanced}. Take that as a lens to reflect with; it doesn't say who you are.` });
  sections.push({ h: "When this area feels hard", p: `Some modern chakra teachers link experiences like ${c.blocked} to this center. That is a symbolic lens, not a diagnosis: a feeling doesn't mean something in you is blocked, and it may be a fair response to what is happening.` });
  sections.push({ h: "How the centers relate", p: `Chakra traditions read the centers together, so attention to the ${c.name} center can sit beside attention to the others.` });
  sections.push({ h: "Practices to balance it", p: `To tend your ${c.name} center: ${c.practices}` });

  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  return format(sections);
}

// remove empty/custom-only clutter and undefined values
function clean(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") out[k] = v;
  });
  return out;
}

// ── public API ───────────────────────────────────────────────────────────────

/** A full deep-dive reading for one system. Returns a pre-wrapped string. */
export function systemReading(systemId, data, cosmicProfile) {
  let computed = {};
  try {
    computed = deriveAll(cosmicProfile || {}, todayKey()).values || {};
  } catch {
    computed = {};
  }
  switch (systemId) {
    case "astrology": return astrologyReading(data, computed.astrology || {});
    case "human_design": return humanDesignReading(data);
    case "gene_keys": return geneKeysReading(data, computed.gene_keys || {});
    case "numerology": return numerologyReading(data, computed.numerology || {});
    case "tarot_archetype": return tarotArchetypeReading(data, computed.tarot_archetype || {});
    case "enneagram": return enneagramReading(data);
    case "chakras": return chakraReading(data);
    default: return "This system does not have a reading yet.";
  }
}

export { format };
