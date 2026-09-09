// Original Vibe Check teaching copy. Public source context: docs/design/astrology-voice.md.
// Planet/sign/house/aspect meanings are symbolic conventions, not measurements of a person.
export const ASTROLOGY_SOURCES = [
  { title: 'Planets and Possibilities', author: 'Susan Miller', url: 'https://books.google.com/books/about/Planets_and_Possibilities.html?id=e4WUElIwj9QC', context: 'An approachable introduction to signs, their ruling planets, and possibilities in everyday life.' },
  { title: 'The Inner Sky', author: 'Steven Forrest', url: 'https://www.forrestastrology.com/pages/books', context: 'A starting point for exploring the chart through psychological development and personal choice.' },
];

export const PLANETS = [
  { id: 'sun', key: 'sun_sign', label: 'Sun', symbol: '☉', focus: 'purpose and vitality', question: 'What feels worth giving your attention to?', action: 'Give ten minutes to something you value, then note what made it meaningful.' },
  { id: 'moon', key: 'moon_sign', label: 'Moon', symbol: '☽', focus: 'care and emotional needs', question: 'What kind of care do you actually want today?', action: 'Name one need in plain words and choose a small way to support it.' },
  { id: 'rising', key: 'rising_sign', label: 'Rising / Ascendant', symbol: '↑', focus: 'your approach to unfamiliar situations', question: 'How would you like to meet a new situation?', action: 'Before one interaction, choose how you want to show up and what boundary you want to keep.' },
  { id: 'mercury', key: 'mercury_sign', label: 'Mercury', symbol: '☿', focus: 'attention, learning, and communication', question: 'What could become clearer if you asked instead of assumed?', action: 'Write down one fact, one interpretation, and one question you still have.' },
  { id: 'venus', key: 'venus_sign', label: 'Venus', symbol: '♀', focus: 'values, enjoyment, and connection', question: 'What do you enjoy freely, without having to earn it?', action: 'Make room for one enjoyable experience that fits your needs and resources.' },
  { id: 'mars', key: 'mars_sign', label: 'Mars', symbol: '♂', focus: 'initiative, assertion, and limits', question: 'Where would a clear yes or no help?', action: 'Choose one manageable action or boundary. You can rehearse it privately before deciding whether to act.' },
  { id: 'jupiter', key: 'jupiter_sign', label: 'Jupiter', symbol: '♃', focus: 'possibility, learning, and perspective', question: 'Which possibility deserves a small, realistic experiment?', action: 'Explore one new idea and write down both its promise and its practical limits.' },
  { id: 'saturn', key: 'saturn_sign', label: 'Saturn', symbol: '♄', focus: 'commitment, limits, and patient skill', question: 'What structure would support you without punishing you?', action: 'Make one commitment small enough to keep, including time to rest or revise it.' },
  { id: 'uranus', key: 'uranus_sign', label: 'Uranus', symbol: '♅', focus: 'freedom, originality, and change', question: 'Which inherited rule is worth questioning?', action: 'Try a reversible change to one routine and notice whether it gives you more choice.' },
  { id: 'neptune', key: 'neptune_sign', label: 'Neptune', symbol: '♆', focus: 'imagination, compassion, and discernment', question: 'Where does imagination help, and where do you need clearer facts?', action: 'Spend a few minutes with music, art, or a nearby plant, then name one concrete need to return to.' },
  { id: 'pluto', key: 'pluto_sign', label: 'Pluto', symbol: '♇', focus: 'power, endings, and substantial change', question: 'Where would you like more say in what happens next?', action: 'Name one choice that belongs to you and one source of support you could draw on.' },
  { id: 'north_node', key: 'north_node', label: 'North Node', symbol: '☊', focus: 'an optional direction for growth', question: 'What unfamiliar quality would you choose to practice?', action: 'Try one small unfamiliar response because it matters to you, then decide whether to keep it.' },
];

export const HOUSES = [
  ['Presence', 'how you enter situations and express yourself'],
  ['Resources', 'possessions, livelihood, and what you value'],
  ['Everyday exchange', 'learning, communication, and nearby relationships'],
  ['Home', 'home, family history, and a sense of belonging'],
  ['Creative life', 'play, making things, romance, and enjoyment'],
  ['Daily care', 'routines, work, and how you organize care'],
  ['Partnership', 'one-to-one relationships and agreements'],
  ['Shared stakes', 'shared resources, intimacy, and boundaries around trust'],
  ['Wider horizons', 'study, beliefs, travel, and perspective'],
  ['Public life', 'vocation, responsibility, and your contribution'],
  ['Community', 'friendship, groups, and hopes for the future'],
  ['Quiet space', 'solitude, reflection, and what is easy to overlook'],
].map(([label, context], i) => ({ number: i + 1, label, context }));

export const ASPECTS = {
  conjunction: { label: 'Conjunction', angle: '0°', meaning: 'These functions are read together. Notice when combining them helps and when each needs its own room.' },
  sextile: { label: 'Sextile', angle: '60°', meaning: 'This connection is traditionally read as an opportunity. Look for a small action that lets these functions support each other.' },
  square: { label: 'Square', angle: '90°', meaning: 'This connection can be explored as competing demands. Name what each side needs before choosing a response; tension does not require self-blame.' },
  trine: { label: 'Trine', angle: '120°', meaning: 'This connection is traditionally read as ease. Ask how you might use an available strength deliberately instead of leaving it untested.' },
  opposition: { label: 'Opposition', angle: '180°', meaning: 'This connection invites attention to two poles. Try giving each a clear role rather than making one carry the whole situation.' },
};

export const ELEMENT_TEMPERAMENT = {
  Fire: 'Fire symbolism draws attention to initiative, enthusiasm, and the use of energy.',
  Earth: 'Earth symbolism draws attention to practical support, resources, and what can be sustained.',
  Air: 'Air symbolism draws attention to ideas, conversation, and the ability to consider another view.',
  Water: 'Water symbolism draws attention to feeling, memory, and the quality of care.',
};
export const MODALITY_MODE = {
  Cardinal: 'The cardinal quality invites an experiment in beginning.',
  Fixed: 'The fixed quality invites a look at what deserves sustained attention and what needs to change.',
  Mutable: 'The mutable quality invites adaptation while keeping sight of what matters.',
};
