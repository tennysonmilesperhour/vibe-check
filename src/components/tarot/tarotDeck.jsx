// 78-card Rider-Waite-inspired deck data
// Card art is original SVG symbolic design

export const MAJOR_ARCANA = [
  { id: 0,  name: "The Fool",           roman: "0",    geoType: "open-spiral",           color: "#fbbf24", shadow: "#f59e0b", keywords: ["new beginnings","spontaneity","leap of faith"], meaning: "A new journey begins. Step forward with open trust, releasing fear of the unknown. The universe supports your leap.", reversed: "Recklessness, naivety, holding back from a needed leap." },
  { id: 1,  name: "The Magician",       roman: "I",    geoType: "caduceus",              color: "#f472b6", shadow: "#db2777", keywords: ["willpower","skill","manifestation"], meaning: "You hold all the tools you need. Focus your will and manifest your intention into reality.", reversed: "Manipulation, poor planning, untapped talents." },
  { id: 2,  name: "The High Priestess", roman: "II",   geoType: "crescent-pillars",      color: "#818cf8", shadow: "#4f46e5", keywords: ["intuition","mystery","inner knowing"], meaning: "The veil between worlds grows thin. Trust your intuition over logic. The answer lies within.", reversed: "Hidden agendas, disconnection from intuition, secrets revealed." },
  { id: 3,  name: "The Empress",        roman: "III",  geoType: "venus-spiral",          color: "#4ade80", shadow: "#16a34a", keywords: ["abundance","fertility","nurturing"], meaning: "Fertile ground surrounds you. Creativity, abundance, and sensual pleasure bloom in this season.", reversed: "Creative block, dependence, smothering energy." },
  { id: 4,  name: "The Emperor",        roman: "IV",   geoType: "triangle-square",       color: "#f97316", shadow: "#ea580c", keywords: ["authority","structure","stability"], meaning: "Build your foundation with intention. Leadership and discipline create lasting legacies.", reversed: "Domination, rigidity, abuse of power." },
  { id: 5,  name: "The Hierophant",     roman: "V",    geoType: "papal-cross",           color: "#a78bfa", shadow: "#7c3aed", keywords: ["tradition","wisdom","spiritual guidance"], meaning: "Seek wisdom through established paths. A teacher or tradition holds the key to growth now.", reversed: "Rebellion against convention, personal belief systems, unorthodox paths." },
  { id: 6,  name: "The Lovers",         roman: "VI",   geoType: "vesica",                color: "#f43f5e", shadow: "#be123c", keywords: ["love","choice","alignment"], meaning: "A sacred union or pivotal choice stands before you. Align with your deepest values.", reversed: "Disharmony, imbalance, misaligned values." },
  { id: 7,  name: "The Chariot",        roman: "VII",  geoType: "cube-motion",           color: "#38bdf8", shadow: "#0369a1", keywords: ["willpower","victory","control"], meaning: "Harness opposing forces with your will. Victory comes through discipline and focused movement.", reversed: "Loss of control, aggression, lacking direction." },
  { id: 8,  name: "Strength",           roman: "VIII", geoType: "lemniscate",            color: "#fbbf24", shadow: "#d97706", keywords: ["courage","compassion","inner strength"], meaning: "True strength is gentle. Meet challenges with calm, compassionate courage from within.", reversed: "Self-doubt, weakness, raw emotion untempered." },
  { id: 9,  name: "The Hermit",         roman: "IX",   geoType: "lantern",               color: "#a3a3a3", shadow: "#525252", keywords: ["solitude","inner guidance","wisdom"], meaning: "Withdraw to find your light. Your lantern of wisdom illuminates the path when you go within.", reversed: "Isolation, loneliness, withdrawing too far from the world." },
  { id: 10, name: "Wheel of Fortune",   roman: "X",    geoType: "spoked-wheel",          color: "#c084fc", shadow: "#7c3aed", keywords: ["cycles","fate","turning point"], meaning: "The wheel turns. A pivotal moment of change arrives. Ride the cycle with grace.", reversed: "Bad luck, resistance to change, breaking cycles." },
  { id: 11, name: "Justice",            roman: "XI",   geoType: "scales",                color: "#38bdf8", shadow: "#0284c7", keywords: ["fairness","truth","law of cause"], meaning: "Clarity and honesty bring true balance. Every action has its perfect consequence.", reversed: "Injustice, dishonesty, avoidance of accountability." },
  { id: 12, name: "The Hanged Man",     roman: "XII",  geoType: "triangle-down-suspended", color: "#2dd4bf", shadow: "#0d9488", keywords: ["surrender","new perspective","pause"], meaning: "Surrender your struggle. In stillness and release, a new illuminating perspective is born.", reversed: "Delays, resistance to necessary pause, martyrdom." },
  { id: 13, name: "Death",              roman: "XIII", geoType: "scythe",                color: "#6b7280", shadow: "#374151", keywords: ["transformation","endings","rebirth"], meaning: "What must die so that you may truly live? Embrace transformation — new life follows every ending.", reversed: "Resistance to change, inability to move on, stagnation." },
  { id: 14, name: "Temperance",         roman: "XIV",  geoType: "flow-triangles",        color: "#34d399", shadow: "#059669", keywords: ["balance","patience","moderation"], meaning: "Flow between worlds with grace. Blend opposing energies into a harmonious, healing elixir.", reversed: "Imbalance, excess, lack of long-term vision." },
  { id: 15, name: "The Devil",          roman: "XV",   geoType: "inverted-pentagram",    color: "#dc2626", shadow: "#991b1b", keywords: ["shadow self","bondage","materialism"], meaning: "You have more freedom than you believe. Examine what chains you — they may be of your own making.", reversed: "Breaking free, reclaiming power, releasing addiction." },
  { id: 16, name: "The Tower",          roman: "XVI",  geoType: "tower-lightning",       color: "#f97316", shadow: "#c2410c", keywords: ["sudden change","upheaval","revelation"], meaning: "What is built on false foundations must fall. The lightning of truth clears the way for authentic structure.", reversed: "Avoidance of disaster, fear of change, resisting necessary disruption." },
  { id: 17, name: "The Star",           roman: "XVII", geoType: "star-8",                color: "#818cf8", shadow: "#4f46e5", keywords: ["hope","renewal","inspiration"], meaning: "After the storm, starlight. Hope, healing, and renewed faith pour through you now.", reversed: "Despair, lack of faith, disconnection from inner light." },
  { id: 18, name: "The Moon",           roman: "XVIII",geoType: "moon-full",             color: "#c084fc", shadow: "#9333ea", keywords: ["illusion","intuition","the unconscious"], meaning: "Navigate by feeling, not sight. The moon illuminates what the sun cannot — trust the dreamtime.", reversed: "Confusion lifting, fear dissipating, hidden truth emerging." },
  { id: 19, name: "The Sun",            roman: "XIX",  geoType: "sun-rays",              color: "#fbbf24", shadow: "#d97706", keywords: ["joy","success","vitality"], meaning: "Radiant clarity and joy illuminate your path. Success, vitality, and childlike wonder are yours.", reversed: "Temporary sadness, inner child wounds, clouded optimism." },
  { id: 20, name: "Judgement",          roman: "XX",   geoType: "trumpet",               color: "#60a5fa", shadow: "#2563eb", keywords: ["awakening","reckoning","calling"], meaning: "The call to rise has come. Hear it fully. Forgive the past, integrate all you have been, and ascend.", reversed: "Self-doubt, refusal of calling, harsh self-judgment." },
  { id: 21, name: "The World",          roman: "XXI",  geoType: "ouroboros",             color: "#4ade80", shadow: "#16a34a", keywords: ["completion","wholeness","integration"], meaning: "You have arrived. The cycle completes in fullness. Celebrate all you have become and all you've traversed.", reversed: "Incompletion, shortcuts, lack of closure." },
];

const SUITS = [
  { name: "Wands",    geoType: "flame-wand",     color: "#f97316", element: "Fire",  domain: "passion, creativity, ambition" },
  { name: "Cups",     geoType: "chalice",         color: "#38bdf8", element: "Water", domain: "emotions, relationships, intuition" },
  { name: "Swords",   geoType: "crossed-swords",  color: "#818cf8", element: "Air",   domain: "intellect, truth, conflict" },
  { name: "Pentacles",geoType: "pentagram",        color: "#4ade80", element: "Earth", domain: "material, career, abundance" },
];

const COURT_MEANINGS = {
  Page:   { keywords: ["student","curiosity","new energy"],    meaning: "Youthful, curious energy enters — a student of this element's gifts." },
  Knight: { keywords: ["action","pursuit","adventure"],        meaning: "Bold, driven movement. Pursue your vision with committed momentum." },
  Queen:  { keywords: ["mastery","nurturing","embodiment"],    meaning: "Mature, embodied wisdom. Lead with the full mastery of this element." },
  King:   { keywords: ["authority","command","vision"],        meaning: "Sovereign command of this domain. Take your seat of authority wisely." },
};

const PIP_MEANINGS = {
  Ace:   { keywords: ["pure potential","seed","gift"],         meaning: "A pure seed of new potential arrives — a gift from the universe." },
  Two:   { keywords: ["balance","choice","partnership"],       meaning: "A moment of balance, union, or choice between two paths." },
  Three: { keywords: ["growth","collaboration","expansion"],   meaning: "Initial vision expands through creativity and collaboration." },
  Four:  { keywords: ["stability","rest","consolidation"],     meaning: "A pause to consolidate gains. Rest, stability, and foundation." },
  Five:  { keywords: ["conflict","challenge","change"],        meaning: "Tension and discord signal necessary growth through challenge." },
  Six:   { keywords: ["harmony","success","forward motion"],   meaning: "After struggle, harmony returns. Celebrate progress and move forward." },
  Seven: { keywords: ["strategy","perseverance","vision"],     meaning: "Hold your ground with strategic clarity and unwavering vision." },
  Eight: { keywords: ["movement","speed","mastery"],           meaning: "Rapid movement and focused mastery accelerate your path." },
  Nine:  { keywords: ["resilience","completion","wisdom"],     meaning: "Near the end of a cycle — draw on all you've learned with resilience." },
  Ten:   { keywords: ["completion","fulfillment","burden"],    meaning: "A cycle completes in fullness — embrace what this ending offers." },
};

const NUM_NAMES = ["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"];
const COURT_NAMES = ["Page","Knight","Queen","King"];

function buildMinorArcana() {
  const cards = [];
  let id = 22;
  SUITS.forEach(suit => {
    NUM_NAMES.forEach(num => {
      const pip = PIP_MEANINGS[num];
      cards.push({
        id: id++,
        name: `${num} of ${suit.name}`,
        roman: num,
        geoType: suit.geoType,
        color: suit.color,
        shadow: suit.color,
        keywords: [`${suit.domain.split(",")[0].trim()}`, ...pip.keywords.slice(0,2)],
        meaning: `${pip.meaning} In the realm of ${suit.element} (${suit.domain}).`,
        reversed: `Blocked ${suit.domain.split(",")[0].trim()} energy or inverted ${pip.keywords[0]}.`,
        suit: suit.name,
      });
    });
    COURT_NAMES.forEach(court => {
      const c = COURT_MEANINGS[court];
      cards.push({
        id: id++,
        name: `${court} of ${suit.name}`,
        roman: court,
        geoType: suit.geoType,
        color: suit.color,
        shadow: suit.color,
        keywords: [...c.keywords.slice(0,2), suit.domain.split(",")[0].trim()],
        meaning: `${c.meaning} Element: ${suit.element} — ${suit.domain}.`,
        reversed: `Immature or blocked ${court.toLowerCase()} energy in the realm of ${suit.element.toLowerCase()}.`,
        suit: suit.name,
      });
    });
  });
  return cards;
}

export const MINOR_ARCANA = buildMinorArcana();
export const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export const SPREADS = [
  {
    id: "single",
    name: "Daily Draw",
    description: "One card — a daily oracle message",
    positions: [
      { label: "Your Message", x: 50, y: 50 },
    ],
  },
  {
    id: "three",
    name: "Past · Present · Future",
    description: "The river of time across three cards",
    positions: [
      { label: "Past",    x: 20, y: 50 },
      { label: "Present", x: 50, y: 50 },
      { label: "Future",  x: 80, y: 50 },
    ],
  },
  {
    id: "five",
    name: "Five-Card Cross",
    description: "Situation, challenge, foundation, advice, outcome",
    positions: [
      { label: "Situation",  x: 50, y: 50 },
      { label: "Challenge",  x: 50, y: 15 },
      { label: "Foundation", x: 50, y: 85 },
      { label: "Advice",     x: 20, y: 50 },
      { label: "Outcome",    x: 80, y: 50 },
    ],
  },
  {
    id: "horseshoe",
    name: "Horseshoe",
    description: "Seven-card arc: past through future path",
    positions: [
      { label: "Distant Past",  x: 10, y: 70 },
      { label: "Recent Past",   x: 25, y: 40 },
      { label: "Present",       x: 42, y: 20 },
      { label: "Near Future",   x: 58, y: 20 },
      { label: "Future",        x: 75, y: 40 },
      { label: "Best Action",   x: 90, y: 70 },
      { label: "Final Outcome", x: 50, y: 85 },
    ],
  },
  {
    id: "celtic",
    name: "Celtic Cross",
    description: "The classic 10-card deep reading",
    positions: [
      { label: "The Heart",       x: 35, y: 48 },
      { label: "The Cross",       x: 35, y: 48, rotate: true },
      { label: "Foundation",      x: 35, y: 78 },
      { label: "Recent Past",     x: 15, y: 48 },
      { label: "Crown",           x: 35, y: 18 },
      { label: "Near Future",     x: 55, y: 48 },
      { label: "Self",            x: 78, y: 78 },
      { label: "Environment",     x: 78, y: 58 },
      { label: "Hopes & Fears",   x: 78, y: 38 },
      { label: "Final Outcome",   x: 78, y: 18 },
    ],
  },
];