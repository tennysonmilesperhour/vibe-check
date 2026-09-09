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
    return "Enter your Human Design Type, Authority, and Profile on the Systems tab to unlock your full reading. If you do not know your chart yet, you can calculate it for free from your birth date, time, and place at any Human Design bodygraph site, then enter the results here.";
  }

  if (type) {
    const t = HD_TYPES[type];
    sections.push({ h: `You are a ${type}`, p: t.body });
    sections.push({
      h: "Your strategy",
      p: `Your strategy is ${t.strategy}. Live by it and your life fills with ${t.signature}; override it and you meet your not-self signature, ${t.notSelf}. Think of ${t.signature} and ${t.notSelf} as your dashboard lights, telling you moment to moment whether you are living as yourself.`,
    });
  }
  if (auth) {
    sections.push({ h: auth.label, p: auth.text });
  }
  if (prof) {
    sections.push({ h: `Profile ${prof.key}: the ${prof.name}`, p: prof.text });
  }
  if (d.definition) sections.push({ h: "Definition", p: `Your definition is ${d.definition}. This describes how energy flows and connects across your chart, and how self-contained or relationship-driven your inner wiring tends to be.` });
  if (d.strategy && !type) sections.push({ h: "Strategy", p: `Your noted strategy: ${d.strategy}.` });
  if (d.incarnation_cross) sections.push({ h: "Incarnation Cross", p: `Your Incarnation Cross is the ${d.incarnation_cross}, the overarching theme of your life's purpose, the role only you are here to play across the whole arc of your life.` });
  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  sections.push({
    h: "Living it",
    p: `Human Design is an experiment, not a belief. For the next week, ${type ? `practice your strategy, ${HD_TYPES[type].strategy}` : "practice waiting for the right timing before you commit"}, on one real decision and watch what happens in your body. The proof is in how you feel, not in the theory.`,
  });

  return format(sections);
}

function geneKeysReading(data, computed) {
  const d = { ...computed, ...clean(data) };
  const order = ["life_work", "evolution", "radiance", "purpose", "attraction", "iq"];
  const present = order.filter((k) => d[k]);
  const sections = [];

  if (present.length === 0) {
    return "Your Life's Work Gene Key equals your Conscious Sun Gate in Human Design. Enter that gate number (or any of your Gene Keys) on the Systems tab and your hologenetic reading will compose here.";
  }

  sections.push({
    h: "Your Golden Path",
    p: `The Gene Keys map your journey from Shadow to Gift to Siddhi, the same pattern moving from unconscious reaction, to awakened creativity, to transcendent grace. These are the keys currently in your profile. Contemplation, not effort, is how they open.`,
  });

  for (const k of present) {
    const key = resolveKey(d[k]);
    if (!key) continue;
    const meta = GK_SEQUENCE_META[k];
    sections.push({
      h: `${meta.label}: Gene Key ${key.number}`,
      p: `This sphere governs ${meta.sphere}. Its spectrum runs ${key.shadow} → ${key.gift} → ${key.siddhi}: it is ${key.essence}. Under stress you can fall into the Shadow of ${key.shadow}; as you bring awareness, it flowers into the Gift of ${key.gift}, your ${meta.label.toLowerCase()} at its best. At its highest it becomes the Siddhi of ${key.siddhi}.`,
    });
  }

  const lifeKey = resolveKey(d.life_work);
  sections.push({
    h: "Living it",
    p: `You do not force a Gene Key open; you contemplate it until it opens you.${lifeKey ? ` This week, simply hold your Life's Work key: where does the Shadow of ${lifeKey.shadow} still run you, and where is the Gift of ${lifeKey.gift} already alive?` : ""} Awareness itself is the transformation.`,
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
  const shadow = resolveArcana(d.shadow_card);
  const year = resolveArcana(d.personal_year_card);
  const sections = [];

  if (!birth && !shadow) {
    return "Your Tarot birth card is derived from your Life Path number. Add your birth date on the Systems tab and your soul archetype will appear here.";
  }

  if (birth) {
    sections.push({ h: `Your Birth Card: ${birth.name}`, p: birth.archetype });
    sections.push({ h: "Its keynote", p: `Keywords of your archetype: ${birth.keywords.join(", ")}. This is the lens your soul looks through, the role you keep being handed across a lifetime.` });
  }
  if (shadow && shadow.name !== birth?.name) {
    sections.push({ h: `Your Shadow / Teacher Card: ${shadow.name}`, p: shadow.shadow });
    sections.push({
      h: "The two together",
      p: `${birth ? `Your Birth Card ${birth.name} and Shadow Card ${shadow.name} form a complete portrait: one is your gift, the other is the initiation that keeps refining it. ` : ""}The teacher card is not a curse; it is the exact medicine your archetype needs, arriving disguised as a challenge.`,
    });
  }
  if (year && year.name !== birth?.name) {
    sections.push({ h: `This year: ${year.name}`, p: year.year });
  }

  sections.push({
    h: "Living it",
    p: `${birth ? `Watch for ${birth.name} showing up in your daily life this week, in the choices you make and the role you play. ` : ""}Your archetype is not a description to memorize; it is a pattern to recognize as it happens.`,
  });

  return format(sections);
}

function enneagramReading(data) {
  const d = clean(data);
  const t = resolveEnneagram(d.type);
  const inst = resolveInstinct(d.instinct);
  const sections = [];

  if (!t) {
    return "Enter your Enneagram type (1 through 9) on the Systems tab to unlock your reading. If you are unsure of your type, look for the core fear and desire below that ring truest, that is usually your type talking.";
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
    sections.push({ h: `Your tritype (${d.tritype})`, p: `Your tritype names the three types you lead with, one from each center, head, heart, and body. Together they describe the fuller texture of how you think, feel, and act.` });
  }

  sections.push({ h: "Under stress and in growth", p: `When you are stretched thin you move ${t.disintegration}. When you are healthy and growing you move ${t.integration}. Knowing both directions gives you an early-warning system and a map: notice the slide toward stress, and consciously practice the qualities of your growth point.` });
  sections.push({ h: "The way through", p: `The holy idea that releases your type is ${t.holyIdea}. ${t.growth}` });

  if (d.custom_notes) sections.push({ h: "Your own notes", p: d.custom_notes });

  return format(sections);
}

function chakraReading(data) {
  const d = clean(data);
  const c = resolveChakra(d.dominant_center);
  const sections = [];

  if (!c) {
    return "Choose your dominant or focus chakra on the Systems tab to unlock your reading. If you are unsure, notice which theme below is most alive for you right now, whether it is safety, creativity, power, love, voice, insight, or meaning.";
  }

  sections.push({ h: `Your center: ${c.name} (${c.sanskrit})`, p: `Located at the ${c.location} and associated with the element of ${c.element} and the color ${c.color}, your dominant center governs ${c.theme}. This is where much of your energy naturally concentrates.` });
  sections.push({ h: "When it is balanced", p: `In balance, this center makes you ${c.balanced}. This is your gift when the energy here is flowing cleanly.` });
  sections.push({ h: "When it is blocked", p: `Out of balance, you may notice ${c.blocked}. These are not problems to fix so much as signals that this center needs attention and care.` });
  sections.push({ h: "How the centers relate", p: `Your dominant center does not stand alone, it colors the whole system. A strong ${c.name} center draws energy that the others may need too, so part of your practice is making sure the neighboring centers are not left depleted or overworked in its shadow.` });
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
