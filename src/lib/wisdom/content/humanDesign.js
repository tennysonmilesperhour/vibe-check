// Human Design content for the local wisdom engine, in Vibe Check's own words:
// the five Types with their strategy and signposts, the seven Authorities (how
// Human Design suggests deciding), and the twelve Profiles. Keys are matched
// loosely so the profile form's free-text values still resolve.

export const HD_TYPES = {
  Manifestor: {
    strategy: "to inform before you act",
    signature: "peace",
    notSelf: "anger",
    body: "Human Design describes Manifestors, roughly a tenth of people, as initiators: people who start things and set others in motion, with energy that tends to come in bursts. Its suggestion for this type is to let the people an action will affect know before acting, which many Manifestors say eases the resistance they meet. Whether this fits you is yours to judge.",
  },
  Generator: {
    strategy: "to wait to respond",
    signature: "satisfaction",
    notSelf: "frustration",
    body: "Human Design describes Generators as having steady, renewable energy for the work and people they care about, and less for what they don't. Its strategy for this type is to respond: to notice a gut yes or no to what comes along, rather than deciding everything from the mind. Many Generators say that following those responses leaves them satisfied and tired in a good way. Your own experience decides whether it fits.",
  },
  "Manifesting Generator": {
    strategy: "to wait to respond, then inform",
    signature: "satisfaction and peace",
    notSelf: "frustration and anger",
    body: "Human Design describes Manifesting Generators as Generators who move quickly once they commit, often doing several things at once and skipping steps that feel unneeded. Its suggestion is to respond first, then let the people affected know before leaping. If a fast, many-sided way of working suits you, this may feel familiar; if not, leave it.",
  },
  Projector: {
    strategy: "to wait for the invitation",
    signature: "success",
    notSelf: "bitterness",
    body: "Human Design describes Projectors as guides who see deeply into people and systems, with energy that is less steady than a Generator's. It suggests waiting to be invited into big undertakings, such as a role or a project, and resting more than others might. Whether that suits you is yours to judge, and an invitation is never needed to ask for what you need.",
  },
  Reflector: {
    strategy: "to wait a lunar cycle before big decisions",
    signature: "surprise",
    notSelf: "disappointment",
    body: "Human Design describes Reflectors, under one percent of people, as fully open: sensitive to the people and places around them, and able to reflect how a community is doing. It suggests giving major decisions about a lunar cycle, around 28 days, and talking them through with people you trust. That timing is for choices you can take time over.",
  },
};

export const HD_AUTHORITIES = {
  emotional: {
    match: ["emotional", "solar plexus", "solar"],
    label: "Emotional / Solar Plexus Authority",
    text: "Human Design describes emotional authority as clarity that comes over time, as feelings rise and settle. It suggests sleeping on big choices and deciding once a steady sense has formed, rather than at a high or a low. That timing is for choices you can take time over, and your feelings in the moment are real information too.",
  },
  sacral: {
    match: ["sacral"],
    label: "Sacral Authority",
    text: "Human Design describes sacral authority as a gut response in the moment: a lift of energy toward something, or a pull away from it. It suggests asking yourself simple yes or no questions and noticing that response, beside what you know and what people you trust notice.",
  },
  splenic: {
    match: ["splenic", "spleen"],
    label: "Splenic Authority",
    text: "Human Design describes splenic authority as a quiet, quick knowing in the moment, often tied to a sense of safety. It suggests noticing that first instinct before the mind talks over it. If a situation feels unsafe, that instinct is worth taking seriously.",
  },
  ego: {
    match: ["ego", "heart"],
    label: "Ego / Heart Authority",
    text: "Human Design describes ego or heart authority as clarity that comes from what you want and have the energy to commit to. It suggests listening to what you say, unprompted, about your own wants and promises, and weighing that alongside the rest of your life.",
  },
  self: {
    match: ["g center", "self-projected", "self projected", "g-center", "self"],
    label: "Self-Projected Authority",
    text: "Human Design describes self-projected authority as clarity that comes through your own voice. It suggests talking things through with someone you trust, to hear yourself rather than to get advice, and noticing what your own words tell you.",
  },
  environment: {
    match: ["environment", "mental", "sounding", "outer"],
    label: "Environmental / Mental Projector Authority",
    text: "Human Design describes this authority as clarity that comes from talking things out in a place that feels right, over time. It suggests thinking aloud with trusted people and noticing how different places affect your thinking.",
  },
  lunar: {
    match: ["lunar", "reflector"],
    label: "Lunar Authority",
    text: "Human Design describes lunar authority as clarity that unfolds over a lunar cycle, about 28 days, while talking a decision through with people you trust. It suggests giving significant choices that time where you can.",
  },
};

export const HD_PROFILES = {
  "1/3": { name: "Investigator / Martyr", text: "Human Design describes the 1/3 profile as wanting solid knowledge before feeling secure, and learning the rest by trying things and seeing what works." },
  "1/4": { name: "Investigator / Opportunist", text: "Human Design describes the 1/4 profile as building deep understanding and sharing it through close relationships and networks." },
  "2/4": { name: "Hermit / Opportunist", text: "Human Design describes the 2/4 profile as having natural talents that grow in time alone, and a circle of people who draw them out. Alone time and connection can both matter." },
  "2/5": { name: "Hermit / Heretic", text: "Human Design describes the 2/5 profile as a private nature paired with a public, practical role, where others may expect solutions. You decide how much of that expectation to take on." },
  "3/5": { name: "Martyr / Heretic", text: "Human Design describes the 3/5 profile as learning by doing and discovering what works, then sharing practical solutions with others." },
  "3/6": { name: "Martyr / Role Model", text: "Human Design describes the 3/6 profile as experimenting early in life and, later, becoming an example others look to." },
  "4/6": { name: "Opportunist / Role Model", text: "Human Design describes the 4/6 profile as grounded in relationships and networks, moving through phases of experimenting, stepping back, and later becoming an example." },
  "4/1": { name: "Opportunist / Investigator", text: "Human Design describes the 4/1 profile as a steady, foundational way of being, expressed through close relationships." },
  "5/1": { name: "Heretic / Investigator", text: "Human Design describes the 5/1 profile as practical knowledge built on deep foundations, with others often expecting solutions. You decide which expectations to take on." },
  "5/2": { name: "Heretic / Hermit", text: "Human Design describes the 5/2 profile as natural talent that others call out, paired with a public role as a problem-solver, and a need to protect your privacy." },
  "6/2": { name: "Role Model / Hermit", text: "Human Design describes the 6/2 profile as moving through three phases toward becoming an example to others, with natural gifts that mature in their own time." },
  "6/3": { name: "Role Model / Martyr", text: "Human Design describes the 6/3 profile as a very hands-on life, where trying things keeps you learning and people come to trust your authenticity." },
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
