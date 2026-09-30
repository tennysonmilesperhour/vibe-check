// Enneagram content for the local wisdom engine. Each type carries its core
// motivational structure (fear, desire, passion, fixation), the holy idea that
// releases it, and its lines of integration (growth) and disintegration (stress).

export const ENNEAGRAM = {
  1: {
    name: "The Reformer",
    fear: "being corrupt, defective, or wrong",
    desire: "to be good, right, and to have integrity",
    passion: "anger, held in as chronic resentment and a sense that things should be better",
    fixation: "resentment and the relentless inner critic",
    holyIdea: "perfection: a sense that goodness is present even in what is unfinished",
    integration: "toward Seven, loosening into spontaneity, play, and acceptance",
    disintegration: "toward Four, sinking into moodiness, self-doubt, and secret unmet needs",
    growth: "You relax the grip when you learn that goodness is not the same as flawlessness, and that your own imperfection is allowed. Serenity replaces the inner critic when you can let the world, and yourself, be a work in progress.",
  },
  2: {
    name: "The Helper",
    fear: "being unwanted, unworthy of love on your own",
    desire: "to feel loved and genuinely needed",
    passion: "pride, the hidden belief that you have no needs and exist to meet others'",
    fixation: "flattery and giving-to-get",
    holyIdea: "freedom and will: love does not have to be earned",
    integration: "toward Four, turning care inward and honoring your own real feelings and needs",
    disintegration: "toward Eight, becoming demanding, controlling, and resentful when unappreciated",
    growth: "You come home when you can admit you have needs and receive without keeping score. Humility, letting yourself be loved rather than only being useful, is your medicine.",
  },
  3: {
    name: "The Achiever",
    fear: "being worthless apart from your accomplishments",
    desire: "to feel valuable and worthwhile",
    passion: "deceit, adapting into whatever image will win",
    fixation: "vanity and identification with success",
    holyIdea: "hope and law: value is inherent, not performed",
    integration: "toward Six, becoming loyal, cooperative, and committed to something beyond self-image",
    disintegration: "toward Nine, going numb, disengaging, and losing yourself in busywork",
    growth: "You find yourself when you let people see who you actually are beneath the polished image. Authenticity, being valued for your being rather than your doing, is the truth that frees you.",
  },
  4: {
    name: "The Individualist",
    fear: "having no identity or personal significance",
    desire: "to be uniquely yourself and to find your true identity",
    passion: "envy, longing for what is missing and idealizing the distant",
    fixation: "melancholy and the sense of being fundamentally different",
    holyIdea: "origin: you were never actually missing anything",
    integration: "toward One, channeling feeling into disciplined, principled action",
    disintegration: "toward Two, becoming clingy, over-involved, and needy for reassurance",
    growth: "You steady when you stop chasing the missing piece and root in the present ordinary moment. Equanimity, the discovery that you are already whole, dissolves the ache of envy.",
  },
  5: {
    name: "The Investigator",
    fear: "being helpless, depleted, or overwhelmed by the world's demands",
    desire: "to be capable, competent, and to understand",
    passion: "avarice, hoarding energy, resources, and privacy",
    fixation: "detachment and withdrawal into the mind",
    holyIdea: "omniscience: you can trust and participate in life",
    integration: "toward Eight, moving from the head into embodied, confident action",
    disintegration: "toward Seven, scattering into frantic, distracted mental overactivity",
    growth: "You open when you let yourself need things, and people, and discover the well does not run dry. Non-attachment, engaging fully rather than observing from a safe distance, is your path.",
  },
  6: {
    name: "The Loyalist",
    fear: "being without support or guidance, unable to survive alone",
    desire: "to have security, support, and certainty",
    passion: "fear, scanning constantly for what could go wrong",
    fixation: "doubt and worst-case thinking",
    holyIdea: "faith: inner guidance you can actually trust",
    integration: "toward Nine, settling into calm, steady trust and presence",
    disintegration: "toward Three, becoming driven, image-conscious, and frantically competent",
    growth: "You find ground when you learn that the security you seek outside is available within. Courage, trusting your own knowing rather than doubting every authority including yourself, is your medicine.",
  },
  7: {
    name: "The Enthusiast",
    fear: "being trapped in pain, deprivation, or limitation",
    desire: "to be satisfied, free, and to experience life fully",
    passion: "gluttony, an appetite for more experience to stay ahead of the pain",
    fixation: "planning and anticipation, always toward the next thing",
    holyIdea: "wisdom and work: this moment is already enough",
    integration: "toward Five, deepening into focus, depth, and quiet presence",
    disintegration: "toward One, becoming critical, rigid, and perfectionistic",
    growth: "You arrive when you can stay with what is, including the difficult, instead of fleeing forward. Sobriety, the discovery that depth in one thing beats a thousand escapes, brings the satisfaction you were chasing.",
  },
  8: {
    name: "The Challenger",
    fear: "being controlled, harmed, or made vulnerable",
    desire: "to protect yourself and be in control of your own life",
    passion: "lust, an excess of intensity and force",
    fixation: "vengeance and the need to be against something",
    holyIdea: "truth: real strength includes tenderness",
    integration: "toward Two, softening into open-hearted care and generosity",
    disintegration: "toward Five, withdrawing, secretive and cut off, guarding against betrayal",
    growth: "You come home when you let yourself be vulnerable with the people you trust, discovering it is not weakness but the bravest thing you do. Innocence, a heart that no longer has to armor itself, is your medicine.",
  },
  9: {
    name: "The Peacemaker",
    fear: "loss, separation, and fragmentation",
    desire: "inner and outer peace, harmony, and wholeness",
    passion: "sloth, a self-forgetting that numbs your own priorities and presence",
    fixation: "indolence and merging with others' agendas to keep the peace",
    holyIdea: "love and action: your presence and priorities matter",
    integration: "toward Three, waking up into focused energy, self-development, and showing up",
    disintegration: "toward Six, becoming anxious, resistant, and passively stubborn",
    growth: "You wake up when you stop disappearing to keep the peace and let your own priorities take up space. Right action, remembering that you matter and that some conflict is worth having, is your path.",
  },
};

export const INSTINCTS = {
  sp: { label: "Self-Preservation", text: "Your survival instinct focuses on safety, comfort, health, resources, and the physical foundations of life. You attend first to whether you and your nest are secure." },
  so: { label: "Social", text: "Your survival instinct focuses on belonging, status, and your place within the group. You attend first to community, reputation, and where you stand among others." },
  sx: { label: "Sexual / One-to-One", text: "Your survival instinct focuses on intensity, chemistry, and one-to-one bonds. You attend first to attraction, merging, and the charge of close connection." },
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
