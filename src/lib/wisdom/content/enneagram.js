// Enneagram content for the local wisdom engine, in Vibe Check's own words.
// Each type has a theme name (not any school's type names), the wish and fear
// teachers describe at its center, its passion and fixation, the "holy idea"
// some teachers pair with it, and the directions it may move in stress and in
// growth. They describe tendencies people may recognize, never who someone is.

export const ENNEAGRAM = {
  1: {
    name: "Integrity and improvement",
    fear: "getting things wrong or falling short",
    desire: "to do things well and act with integrity",
    passion: "anger, often held in as resentment when things fall short",
    fixation: "resentment, with a strict inner critic",
    holyIdea: "perfection: goodness can be present in what is still unfinished",
    integration: "toward Type 7, with more spontaneity and play",
    disintegration: "toward Type 4, with more moodiness and self-doubt",
    growth: "Teachers describe growth for this type as easing the inner critic: letting good enough be good, and allowing yourself and others to be works in progress. Does any of that feel useful?",
  },
  2: {
    name: "Care and connection",
    fear: "being unwanted or unloved",
    desire: "to be loved and to matter to others",
    passion: "pride, the sense of having no needs while meeting everyone else's",
    fixation: "flattery, and giving in the hope of getting",
    holyIdea: "freedom: love does not have to be earned",
    integration: "toward Type 4, with more attention to your own feelings and needs",
    disintegration: "toward Type 8, with more control and resentment when care goes unnoticed",
    growth: "Teachers describe growth for this type as naming your own needs and letting care come back to you, not only giving it. What would you ask for if it were easy?",
  },
  3: {
    name: "Accomplishment and worth",
    fear: "being worthless without accomplishments",
    desire: "to feel valuable and worthwhile",
    passion: "self-deception, shaping yourself into what seems to succeed",
    fixation: "vanity, and measuring yourself by success",
    holyIdea: "hope: worth is not something you have to perform",
    integration: "toward Type 6, with more loyalty and commitment to others",
    disintegration: "toward Type 9, with more disengagement and going through the motions",
    growth: "Teachers describe growth for this type as being valued for who you are rather than what you produce, and letting people see past the image. Where can you be yourself without achieving anything?",
  },
  4: {
    name: "Authenticity and depth",
    fear: "having no identity or significance of your own",
    desire: "to feel authentic and to live a life with personal meaning",
    passion: "envy, a sense that something essential is missing and others have it",
    fixation: "melancholy, and a feeling of being different",
    holyIdea: "origin: nothing essential is missing",
    integration: "toward Type 1, with more steady, principled action",
    disintegration: "toward Type 2, with more clinging and need for reassurance",
    growth: "Teachers describe growth for this type as finding meaning in the ordinary present rather than in what seems to be missing. What is already here that you value?",
  },
  5: {
    name: "Understanding and self-reliance",
    fear: "being helpless, depleted, or overwhelmed",
    desire: "to be capable and to understand how things work",
    passion: "avarice, holding tight to time, energy, and privacy",
    fixation: "withdrawal into observation and thought",
    holyIdea: "omniscience: you are part of life, not only an observer of it",
    integration: "toward Type 8, with more confident, embodied action",
    disintegration: "toward Type 7, with more scattered, restless thinking",
    growth: "Teachers describe growth for this type as trusting that there is enough energy and support to take part, rather than watching from a distance. Where would you like to take part more fully?",
  },
  6: {
    name: "Security and loyalty",
    fear: "being without support or guidance",
    desire: "to feel secure and supported",
    passion: "fear, watching for what could go wrong",
    fixation: "doubt, and imagining the worst",
    holyIdea: "faith: guidance you can find in yourself",
    integration: "toward Type 9, with more calm and trust",
    disintegration: "toward Type 3, with more driven, anxious busyness",
    growth: "Teachers describe growth for this type as trusting your own judgement alongside the people you rely on. What do you know from your own experience?",
  },
  7: {
    name: "Possibility and freedom",
    fear: "being trapped in pain or limitation",
    desire: "to be free and to enjoy life fully",
    passion: "gluttony, an appetite for more experiences",
    fixation: "planning, always toward the next thing",
    holyIdea: "wisdom: this moment has enough in it",
    integration: "toward Type 5, with more focus and depth",
    disintegration: "toward Type 1, with more criticism and rigidity",
    growth: "Teachers describe growth for this type as staying with one experience, including a difficult one, rather than moving on to the next. What would you like to give your full attention to?",
  },
  8: {
    name: "Strength and protection",
    fear: "being controlled or harmed by others",
    desire: "to protect yourself and direct your own life",
    passion: "lust, an intensity in how you meet life",
    fixation: "vengeance, and bracing against others",
    holyIdea: "truth: strength can include tenderness",
    integration: "toward Type 2, with more open-hearted care",
    disintegration: "toward Type 5, with more withdrawal and guardedness",
    growth: "Teachers describe growth for this type as letting trusted people see your softer side. Who feels safe enough for that?",
  },
  9: {
    name: "Peace and harmony",
    fear: "conflict, loss, and separation",
    desire: "to have peace, inside and around you",
    passion: "self-forgetting, going along to keep things calm",
    fixation: "going numb to your own wants to keep the peace",
    holyIdea: "love: your presence and priorities matter",
    integration: "toward Type 3, with more energy and focus on your own goals",
    disintegration: "toward Type 6, with more worry and stubbornness",
    growth: "Teachers describe growth for this type as letting your own priorities take up room, where it is safe to, even when that brings some disagreement. What do you want, apart from what keeps the peace?",
  },
};

/** A type as the profile form lists it, e.g. "4 – Authenticity and depth". */
export const enneagramOption = (number) => `${number} – ${ENNEAGRAM[number].name}`;

export const INSTINCTS = {
  sp: { label: "Self-Preservation", text: "Enneagram teachers describe the self-preservation instinct as attention to safety, health, comfort, and resources: whether you and the people close to you are secure." },
  so: { label: "Social", text: "Enneagram teachers describe the social instinct as attention to belonging, roles, and your place in groups and communities." },
  sx: { label: "Sexual / One-to-One", text: "Enneagram teachers describe the one-to-one instinct, also called sexual, as attention to intensity, chemistry, and close bonds with particular people." },
};

export function resolveEnneagram(value) {
  const m = String(value || "").match(/\b([1-9])\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return ENNEAGRAM[n] ? { number: n, ...ENNEAGRAM[n] } : null;
}

export function resolveInstinct(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("self") || v.includes("sp")) return INSTINCTS.sp;
  if (v.includes("social") || /\bso\b/.test(v)) return INSTINCTS.so;
  if (v.includes("sexual") || v.includes("one-to-one") || v.includes("one to one") || v.includes("sx")) return INSTINCTS.sx;
  return null;
}
