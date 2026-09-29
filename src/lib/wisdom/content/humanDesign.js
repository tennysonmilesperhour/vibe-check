// Human Design content for the local wisdom engine: the five Types with their
// strategy and signposts, the seven Authorities (how to decide), the twelve
// Profiles (the role you play), and Definition. Keys are matched loosely so the
// profile form's free-text values still resolve.

export const HD_TYPES = {
  Manifestor: {
    strategy: "to inform before you act",
    signature: "peace",
    notSelf: "anger",
    aura: "closed and repelling, built to initiate and impact",
    body: "Human Design describes Manifestors, roughly a tenth of people, as initiators: people who start things and set others in motion, with energy that tends to come in bursts. Its suggestion for this type is to let the people an action will affect know before acting, which many Manifestors say eases the resistance they meet. Whether this fits you is yours to judge.",
  },
  Generator: {
    strategy: "to wait to respond",
    signature: "satisfaction",
    notSelf: "frustration",
    aura: "open and enveloping, built to master and sustain",
    body: "Human Design describes Generators as having steady, renewable energy for the work and people they care about, and less for what they don't. Its strategy for this type is to respond: to notice a gut yes or no to what comes along, rather than deciding everything from the mind. Many Generators say that following those responses leaves them satisfied and tired in a good way. Your own experience decides whether it fits.",
  },
  "Manifesting Generator": {
    strategy: "to wait to respond, then inform",
    signature: "satisfaction and peace",
    notSelf: "frustration and anger",
    aura: "open and enveloping, but fast and multi-tracked",
    body: "Human Design describes Manifesting Generators as Generators who move quickly once they commit, often doing several things at once and skipping steps that feel unneeded. Its suggestion is to respond first, then let the people affected know before leaping. If a fast, many-sided way of working suits you, this may feel familiar; if not, leave it.",
  },
  Projector: {
    strategy: "to wait for the invitation",
    signature: "success",
    notSelf: "bitterness",
    aura: "focused and absorbing, built to guide",
    body: "Human Design describes Projectors as guides who see deeply into people and systems, with energy that is less steady than a Generator's. It suggests waiting to be invited into big undertakings, such as a role or a project, and resting more than others might. Whether that suits you is yours to judge, and an invitation is never needed to ask for what you need.",
  },
  Reflector: {
    strategy: "to wait a lunar cycle before big decisions",
    signature: "surprise",
    notSelf: "disappointment",
    aura: "resistant and sampling, a mirror of the community",
    body: "Human Design describes Reflectors, under one percent of people, as fully open: sensitive to the people and places around them, and able to reflect how a community is doing. It suggests giving major decisions about a lunar cycle, around 28 days, and talking them through with people you trust. That timing is for choices you can take time over.",
  },
};

export const HD_AUTHORITIES = {
  emotional: {
    match: ["emotional", "solar plexus", "solar"],
    label: "Emotional / Solar Plexus Authority",
    text: "You have no truth in the now. Your clarity comes over time, as you ride an emotional wave through its highs and lows. The rule is simple and hard: sleep on it. Never decide at the peak of excitement or the trough of despair. When you have felt a choice across a few days and the emotional charge has settled into a steady sense, that is your truth. Others may push for an immediate yes; your power is the patient no-answer-yet.",
  },
  sacral: {
    match: ["sacral"],
    label: "Sacral Authority",
    text: "Your truth speaks in the moment, through the gut. It is a wordless response, an uh-huh yes or an uh-uh no, a lift of energy toward something or a contraction away from it. It answers only in the present and only to real things in front of you, so ask yourself yes or no questions and listen to the body, not the reasoning mind. Your gut does not explain itself and does not need to.",
  },
  splenic: {
    match: ["splenic", "spleen"],
    label: "Splenic Authority",
    text: "Your truth is the quietest and the fastest, a single spontaneous knowing in the moment, spoken once. The spleen is your ancient survival intelligence; it whispers rather than repeats. Learn to catch that first instinct and trust it, because it will not argue with your mind. When you second-guess the whisper and let the mind override it, you usually regret it.",
  },
  ego: {
    match: ["ego", "heart"],
    label: "Ego / Heart Authority",
    text: "Your truth comes from the will and the heart: what do you truly want, and do you have the energy and desire to commit to it. Listen for what you say spontaneously about your own wants and promises, they reveal your authority. Decisions must honor your heart's genuine desire, not obligation. If your will is not in it, it is a no.",
  },
  self: {
    match: ["g center", "self-projected", "self projected", "g-center", "self"],
    label: "Self-Projected Authority",
    text: "Your truth lives in your voice and your sense of direction and identity. You need to talk it out, not to get advice, but to hear yourself. As you speak freely to a trusted listener, your own tone and words reveal what is true for you. Find people who let you think aloud without steering you, and listen to what comes out of your own mouth.",
  },
  environment: {
    match: ["environment", "mental", "sounding", "outer"],
    label: "Environmental / Mental Projector Authority",
    text: "You have no inner authority in the classic sense; your clarity comes through talking things out in the right environment, over time. Speak your thoughts aloud to trusted sounding boards and notice how you feel in different places, the space you are in strongly affects your clarity. This is not about getting others' opinions; it is about hearing yourself think out loud until the truth surfaces.",
  },
  lunar: {
    match: ["lunar", "reflector"],
    label: "Lunar Authority",
    text: "Your authority unfolds across a full lunar cycle, about 28 days. Clarity is not available in a moment; it ripens as you move through the whole month and talk the decision through with people you trust. Give every significant choice its lunar month. What feels clear on day one may look entirely different by day twenty. No system's timing applies to your safety: if you are unsafe, you don't have to wait.",
  },
};

export const HD_PROFILES = {
  "1/3": { name: "Investigator / Martyr", text: "You need a solid foundation of knowledge before you feel secure, and you learn the rest by trial and error, bumping into what does not work until you find what does. Your authority is hard-won and experiential; the failed experiments are not failures, they are your method." },
  "1/4": { name: "Investigator / Opportunist", text: "You build deep foundations of understanding, then share them through your network. Your opportunities and your influence move through personal relationships, so who you know and how you bond matters as much as what you master." },
  "2/4": { name: "Hermit / Opportunist", text: "You carry natural talents that flower in solitude, then are called out of your shell by your community. You need alone time to recharge and develop your gift, but your people will keep knocking, and the invitation to be seen is part of your design." },
  "2/5": { name: "Hermit / Heretic", text: "A private, gifted nature meets a public, practical calling. You need solitude, yet others project on you and call you to solve real problems. People see you as a savior or a scapegoat; managing that projection is part of your path." },
  "3/5": { name: "Martyr / Heretic", text: "You learn by doing, breaking, and discovering what works, then you are called to bring those hard-won, practical solutions to others. Life is experimental for you, and your wisdom comes from what you have actually lived through, not theory." },
  "3/6": { name: "Martyr / Role Model", text: "A trial-and-error life in the first phase gives way to becoming a role model. Your early years are experimental and sometimes bumpy; the wisdom you gather becomes, later, an example others live by." },
  "4/6": { name: "Opportunist / Role Model", text: "Relationships and networks are the ground of your life, and you are here to become a role model. The three-phase arc of the 6 shapes you: experimenting young, retreating around your thirties, then emerging as a living example of what you have integrated." },
  "4/1": { name: "Opportunist / Investigator", text: "A fixed, foundational way of being, expressed through relationships. You are not easily budged from what you know, and your influence flows through your close bonds. Stability and network are your twin themes." },
  "5/1": { name: "Heretic / Investigator", text: "A practical, universalizing gift built on deep foundations. Others project heavily onto you, expecting solutions, and you carry knowledge that can genuinely help many. Grounding those projections in real competence is your work." },
  "5/2": { name: "Heretic / Hermit", text: "A natural talent that others call out of you, paired with a public role as a problem-solver. You need your solitude, yet the world keeps projecting a savior role onto you. Protecting your privacy while answering the real call is the balance." },
  "6/2": { name: "Role Model / Hermit", text: "You are here to become a role model, carrying natural gifts that mature in their own time. Your life moves in three phases, and the wisdom you embody later rests on talents that were always quietly yours." },
  "6/3": { name: "Role Model / Martyr", text: "You become a role model through a deeply experiential life. The trial and error never fully leaves you; it is how you keep learning, and what you live through becomes the authenticity others trust in you." },
};

export function resolveType(value) {
  const v = String(value || "").toLowerCase().trim();
  if (!v) return null;
  if (v.includes("manifesting generator") || v.includes("mani gen") || v === "mg") return "Manifesting Generator";
  if (v.includes("reflector")) return "Reflector";
  if (v.includes("projector")) return "Projector";
  if (v.includes("manifestor")) return "Manifestor";
  if (v.includes("generator")) return "Generator";
  return null;
}

export function resolveAuthority(value) {
  const v = String(value || "").toLowerCase();
  if (!v) return null;
  for (const key of Object.keys(HD_AUTHORITIES)) {
    if (HD_AUTHORITIES[key].match.some((m) => v.includes(m))) return HD_AUTHORITIES[key];
  }
  return null;
}

export function resolveProfile(value) {
  const v = String(value || "");
  const m = v.match(/([1-6])\s*\/\s*([1-6])/);
  if (!m) return null;
  const key = `${m[1]}/${m[2]}`;
  return HD_PROFILES[key] ? { key, ...HD_PROFILES[key] } : null;
}
