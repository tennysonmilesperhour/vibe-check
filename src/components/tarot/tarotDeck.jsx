// 78-card Rider-Waite-inspired deck data
// Card art is original SVG symbolic design

export const MAJOR_ARCANA = [
  { id: 0,  name: "The Fool",           roman: "0",    geoType: "open-spiral",           color: "#fbbf24", shadow: "#f59e0b", keywords: ["new beginnings","spontaneity","leap of faith"], meaning: "A new beginning. Where could you step forward with curiosity, and what would help you feel ready? You choose whether and when to leap.", reversed: "A leap taken too fast, or one you are unsure about. It is fine to look first." },
  { id: 1,  name: "The Magician",       roman: "I",    geoType: "caduceus",              color: "#f472b6", shadow: "#db2777", keywords: ["willpower","skill","manifestation"], meaning: "What skills and resources do you already have for this? You might focus them on one intention today.", reversed: "Scattered effort, a plan that needs more thought, or talents waiting for their moment. It can also point to someone else's tricks; your own read of the situation counts." },
  { id: 2,  name: "The High Priestess", roman: "II",   geoType: "crescent-pillars",      color: "#F5A25E", shadow: "#C99A3F", keywords: ["intuition","mystery","inner knowing"], meaning: "A quieter kind of knowing. What do you sense about this, alongside what you know? Both are worth listening to.", reversed: "Feeling cut off from your own sense of things, or something kept hidden. What would help you hear yourself?" },
  { id: 3,  name: "The Empress",        roman: "III",  geoType: "venus-spiral",          color: "#4ade80", shadow: "#16a34a", keywords: ["abundance","fertility","nurturing"], meaning: "Care, creativity and pleasure. Where could you let something grow, or let yourself be cared for?", reversed: "Creativity feeling stuck, or care that has become too much, given or received. What would feel nourishing?" },
  { id: 4,  name: "The Emperor",        roman: "IV",   geoType: "triangle-square",       color: "#f97316", shadow: "#ea580c", keywords: ["authority","structure","stability"], meaning: "Structure and steadiness. What foundation would help you right now, and who holds authority in this situation?", reversed: "Rigidity, or power used over others. If someone is using power over you, that is theirs to answer for." },
  { id: 5,  name: "The Hierophant",     roman: "V",    geoType: "papal-cross",           color: "#F7B98F", shadow: "#D96A45", keywords: ["tradition","wisdom","spiritual guidance"], meaning: "Tradition, teachers and shared wisdom. Is there a path or a person whose guidance you trust here?", reversed: "Questioning convention, or finding your own way. Your own beliefs can guide you too." },
  { id: 6,  name: "The Lovers",         roman: "VI",   geoType: "vesica",                color: "#f43f5e", shadow: "#be123c", carry: "your own values", keywords: ["love","choice","alignment"], meaning: "Love, connection and choice. What do your values say about the choice in front of you?", reversed: "Values out of step, or a connection that feels off balance. How you are treated matters more than any card." },
  { id: 7,  name: "The Chariot",        roman: "VII",  geoType: "cube-motion",           color: "#38bdf8", shadow: "#0369a1", keywords: ["willpower","victory","control"], meaning: "Direction and determination. What are you moving toward, and what pace works for you?", reversed: "Feeling pulled in several directions, or unsure where you are heading. What would help you find your footing?" },
  { id: 8,  name: "Strength",           roman: "VIII", geoType: "lemniscate",            color: "#fbbf24", shadow: "#d97706", keywords: ["courage","compassion","inner strength"], meaning: "Strength can be gentle. Where could courage and compassion, including for yourself, help today?", reversed: "Doubting your own strength. Strong feelings can be a fair response to what is happening, and asking for support takes strength too." },
  { id: 9,  name: "The Hermit",         roman: "IX",   geoType: "lantern",               color: "#a3a3a3", shadow: "#525252", keywords: ["solitude","inner guidance","wisdom"], meaning: "Time alone to reflect. What might you notice in some quiet?", reversed: "Solitude that has turned lonely. Is there someone you would like to reach out to?" },
  { id: 10, name: "Wheel of Fortune",   roman: "X",    geoType: "spoked-wheel",          color: "#FDC94E", shadow: "#D96A45", keywords: ["cycles","change","turning point"], meaning: "Things change. What is shifting around you, and what is yours to steer?", reversed: "Change that feels unwelcome, or a pattern that keeps repeating. Not every turn is yours to cause or to carry." },
  { id: 11, name: "Justice",            roman: "XI",   geoType: "scales",                color: "#38bdf8", shadow: "#0284c7", keywords: ["fairness","truth","accountability"], meaning: "Clarity, honesty, and fairness. What would a fair outcome look like here, for you as well as for others?", reversed: "Something unfair, or accountability that is missing. It may be someone else's to own." },
  { id: 12, name: "The Hanged Man",     roman: "XII",  geoType: "triangle-down-suspended", color: "#2dd4bf", shadow: "#0d9488", keywords: ["pause","new perspective","letting go"], meaning: "A pause, and a different angle. Could you see this from another side? Pausing is not the same as giving up what you need.", reversed: "Feeling stuck, or giving more than you can afford. A pause you choose is different from being held in place." },
  { id: 13, name: "Death",              roman: "XIII", geoType: "scythe",                color: "#6b7280", shadow: "#374151", carry: "gentleness with endings", keywords: ["transformation","endings","rebirth"], meaning: "Endings and change. Is something ending, or ready to? Endings can be hard, and there is no rush to feel any particular way about them.", reversed: "Holding on to something that is ending. That can take time, and grief is part of it." },
  { id: 14, name: "Temperance",         roman: "XIV",  geoType: "flow-triangles",        color: "#34d399", shadow: "#059669", keywords: ["balance","patience","moderation"], meaning: "Balance and patience. Where could a little moderation, or a slower pace, help?", reversed: "Things feeling out of balance. What small change would help you feel steadier?" },
  { id: 15, name: "The Devil",          roman: "XV",   geoType: "inverted-pentagram",    color: "#dc2626", shadow: "#991b1b", carry: "one tie you could loosen", keywords: ["shadow self","bondage","materialism"], meaning: "What feels binding right now? Some ties are habits you could loosen; others are held in place by someone else, and seeing that clearly is not your failure.", reversed: "Loosening a tie that has held you, or getting free of a habit. Support can help with either." },
  { id: 16, name: "The Tower",          roman: "XVI",  geoType: "tower-lightning",       color: "#f97316", shadow: "#c2410c", carry: "what helps you feel safer", keywords: ["sudden change","upheaval","revelation"], meaning: "Sudden change or upheaval. What do you need to feel safer while things shift? Upheaval is hard, whatever comes after it.", reversed: "Change you can see coming, or fear of it. Fear can be a sensible signal; what would help you feel safer?" },
  { id: 17, name: "The Star",           roman: "XVII", geoType: "star-8",                color: "#F5A25E", shadow: "#C99A3F", keywords: ["hope","renewal","inspiration"], meaning: "Hope and renewal. Where do you find a little hope right now, even a small amount?", reversed: "Hope feeling far away, which is understandable after hard times. Who or what helps on days like this?" },
  { id: 18, name: "The Moon",           roman: "XVIII",geoType: "moon-full",             color: "#FDC94E", shadow: "#C2503C", carry: "patience with what is unclear", keywords: ["illusion","intuition","the unconscious"], meaning: "Uncertainty, dreams and intuition. What feels unclear right now, and what would help you see it better?", reversed: "Something unclear starting to make more sense, or a fear you can look at more closely." },
  { id: 19, name: "The Sun",            roman: "XIX",  geoType: "sun-rays",              color: "#fbbf24", shadow: "#d97706", keywords: ["joy","success","vitality"], meaning: "Joy, warmth and vitality. What brings you a little joy right now?", reversed: "Joy that feels out of reach today. Sadness is allowed to be here too." },
  { id: 20, name: "Judgement",          roman: "XX",   geoType: "trumpet",               color: "#60a5fa", shadow: "#2563eb", keywords: ["awakening","reckoning","calling"], meaning: "A moment of reckoning and renewal. What are you ready to hear in yourself? Forgiving is yours to decide; it is never required.", reversed: "Judging yourself harshly, or a calling you are unsure about. You can go gently." },
  { id: 21, name: "The World",          roman: "XXI",  geoType: "ouroboros",             color: "#4ade80", shadow: "#16a34a", keywords: ["completion","wholeness","integration"], meaning: "Completion. What have you finished or come through, and how would you like to mark it?", reversed: "Something unfinished, or closure that hasn't come. Some things close slowly, and some don't close at all." },
];

const SUITS = [
  { name: "Wands",    geoType: "flame-wand",     color: "#f97316" },
  { name: "Cups",     geoType: "chalice",         color: "#38bdf8" },
  { name: "Swords",   geoType: "crossed-swords",  color: "#F5A25E" },
  { name: "Pentacles",geoType: "pentagram",        color: "#4ade80" },
];

// Upright and reversed meanings for each of the 56 minor arcana, written for
// Vibe Check from the traditional Rider-Waite-Smith readings of each card.
// Keywords read as "a card of <first> and <second>"; `carry` is what the
// reading's closing line offers to carry from the card.
const MINOR_MEANINGS = {
  Wands: {
    Ace:    { carry: "a new spark", keywords: ["inspiration", "a new spark", "creative energy"], meaning: "A spark of energy or a new idea. What has caught your interest lately, and what small step would let you try it?", reversed: "A spark that hasn't caught yet, or energy running low. It is fine to wait until you have more to give." },
    Two:    { carry: "a direction you choose", keywords: ["planning", "choosing a direction", "looking ahead"], meaning: "Planning, and weighing where to go next. What would you choose if you looked a little further ahead?", reversed: "Hesitating over a plan, or staying with what is familiar. What would make the next step feel more manageable?" },
    Three:  { carry: "patience with what is underway", keywords: ["expansion", "foresight", "early progress"], meaning: "Plans starting to move and a wider view opening up. What is already underway, and what are you watching for?", reversed: "Delays, or plans that haven't gone as hoped. Frustration makes sense; what could you adjust, if anything?" },
    Four:   { carry: "a moment of celebration", keywords: ["celebration", "homecoming", "a milestone"], meaning: "A milestone, a welcome, a reason to celebrate. What have you reached that deserves marking, and who would you like to mark it with?", reversed: "A celebration that feels uneasy, or tension where you want to feel at home. You don't have to pretend to feel festive." },
    Five:   { carry: "your energy where it counts", keywords: ["competition", "friction", "many voices"], meaning: "Competition and friction, with many voices at once. Is this a lively contest or a draining one, and where do you want to put your energy?", reversed: "Friction easing, or conflict being avoided. Avoiding a fight can be wise; so can saying what you need." },
    Six:    { carry: "enjoying what went well", keywords: ["recognition", "a win", "confidence"], meaning: "Recognition and a win, large or small. Where has your effort paid off, and can you let yourself enjoy it?", reversed: "Recognition that hasn't come, or doubting your own success. Your effort counts whether or not others notice it." },
    Seven:  { carry: "the ground worth holding", keywords: ["standing your ground", "conviction", "defending a position"], meaning: "Holding a position under pressure. What are you standing up for, and is it worth the energy it takes?", reversed: "Feeling worn down by constant pressure. You can decide which positions to keep defending and where to ask for backup." },
    Eight:  { carry: "a pace that works for you", keywords: ["momentum", "swift movement", "news"], meaning: "Things moving fast: news, travel, or momentum. What is picking up speed, and what pace works for you?", reversed: "Delays, or a rush that feels out of control. What would help you find a workable pace?" },
    Nine:   { carry: "rest when you need it", keywords: ["resilience", "persistence", "guardedness"], meaning: "Weary but still standing, near the end of a long effort. What has kept you going, and what would help you rest?", reversed: "Exhaustion, or feeling you can never let your guard down. Needing to stay alert says something about what you are facing, not about you. Where could you rest, even briefly?" },
    Ten:    { carry: "a lighter load", keywords: ["burden", "responsibility", "overload"], meaning: "Carrying a heavy load, maybe more than one person should. What could you set down, share, or ask for help with?", reversed: "Starting to put some of the load down, or feeling close to your limit. Asking for help is a reasonable response to too much." },
    Page:   { carry: "curiosity", keywords: ["enthusiasm", "discovery", "fresh ideas"], meaning: "Enthusiasm and a curious, exploring energy, sometimes linked to someone young at heart. What would you like to explore just for the fun of it?", reversed: "Ideas that start and stall, or hesitation about something new. Not every spark needs to become a project." },
    Knight: { carry: "enthusiasm at your own pace", keywords: ["passion", "boldness", "adventure"], meaning: "Passion and bold movement, sometimes impatient. What are you eager to chase, and how fast do you want to go?", reversed: "Haste, restlessness, or plans stalled by frustration. A pause can keep energy from scattering." },
    Queen:  { carry: "warmth toward yourself", keywords: ["confidence", "warmth", "determination"], meaning: "Warm, confident energy that draws people in. Where would you like to show up more fully today?", reversed: "Confidence running low, or warmth stretched thin. What would help you feel steadier?" },
    King:   { carry: "a vision worth sharing", keywords: ["vision", "leadership", "initiative"], meaning: "Vision and the drive to lead it. What larger aim do you care about, and who would you like beside you in it?", reversed: "Impatience, or expecting too much of yourself or others. A vision can move at a humane pace." },
  },
  Cups: {
    Ace:    { carry: "openness to feeling", keywords: ["love", "emotional openness", "compassion"], meaning: "An opening of feeling: love, compassion, or creative flow. Where do you feel moved right now, and what would you like to do with that feeling?", reversed: "Feelings held back, or a sense of emptiness. Feelings can come in their own time." },
    Two:    { carry: "what balance feels like to you", keywords: ["partnership", "mutual connection", "attraction"], meaning: "A connection between two people that feels mutual. What makes a relationship feel balanced to you?", reversed: "A connection feeling one-sided or out of step. How you are treated in a relationship matters more than any card." },
    Three:  { carry: "time with friends", keywords: ["friendship", "celebration", "community"], meaning: "Friendship and shared celebration. Who do you enjoy being with, and when did you last get together?", reversed: "Feeling left out, or a social scene that has become draining. Choosing a quieter night is allowed." },
    Four:   { carry: "noticing what you actually want", keywords: ["contemplation", "withdrawal", "reevaluation"], meaning: "Withdrawing to think, maybe missing what is on offer. What are you tired of, and is there something you haven't noticed yet?", reversed: "Interest returning, or a withdrawal that has lasted a long time. If everything has felt flat for a while, talking with someone can help." },
    Five:   { carry: "gentleness with yourself while you grieve", keywords: ["grief", "loss", "regret"], meaning: "Grief over what was lost. Loss deserves time. What, or who, is still with you, when you are ready to look?", reversed: "Grief starting to shift, or sorrow that is still heavy. There is no schedule for grief." },
    Six:    { carry: "kindness toward your younger self", keywords: ["nostalgia", "memory", "kindness"], meaning: "Memories, nostalgia, and simple kindness. What from your past do you want to carry with you, and what can stay there?", reversed: "Being pulled back into the past, or ready to look forward. Not every memory is a comfort, and you choose which ones to revisit." },
    Seven:  { carry: "one real possibility", keywords: ["choices", "imagination", "wishful thinking"], meaning: "Many options, some real and some wishful. Which possibilities are within reach, and which are daydreams to enjoy as daydreams?", reversed: "Clarity after confusion, or too many options to choose from. Narrowing to two or three can help." },
    Eight:  { carry: "what you are looking for", keywords: ["walking away", "searching for meaning", "a change of course"], meaning: "Turning from something that no longer feels fulfilling, to look for more. What feels finished, and what are you looking for?", reversed: "Unsure whether to stay or go, or wandering without a direction. Big choices like this can take time, and you can talk them through with someone you trust. If staying feels unsafe, you never have to wait to get help or to leave." },
    Nine:   { carry: "enjoying enough", keywords: ["contentment", "satisfaction", "enjoyment"], meaning: "Contentment, sometimes called the wish card. What has gone well lately, and what does being satisfied feel like for you?", reversed: "Contentment that feels just out of reach, or wanting more than what you have. What would enough look like?" },
    Ten:    { carry: "belonging with people you choose", keywords: ["belonging", "emotional fulfillment", "harmony"], meaning: "A sense of belonging and shared happiness. Where do you feel at home with people, and what helps that feeling grow?", reversed: "Tension where you hoped for harmony, or an ideal of family that doesn't match your life. Belonging can come from people you choose." },
    Page:   { carry: "a small creative impulse", keywords: ["sensitivity", "creative curiosity", "tenderness"], meaning: "A tender, imaginative energy, open to feeling and surprise. What small creative or emotional impulse could you follow today?", reversed: "Feeling hurt, or creative ideas kept private. You decide what to share and when." },
    Knight: { carry: "what you value", keywords: ["romance", "idealism", "following your heart"], meaning: "Romance, charm, and following your heart. What are you drawn toward, and does it fit what you value?", reversed: "Moodiness, or an ideal that doesn't match reality. Charm is not the same as care; notice whether someone's words and actions line up." },
    Queen:  { carry: "care for yourself", keywords: ["compassion", "intuition", "emotional depth"], meaning: "Compassion and deep, intuitive care. How could you offer that care to yourself as well as to others?", reversed: "Caring for others at your own expense, or feeling swamped by their feelings. Your needs count too." },
    King:   { carry: "steadiness", keywords: ["emotional steadiness", "diplomacy", "calm"], meaning: "Calm, steady feeling, able to hold strong emotions without being swept away. What helps you stay steady when things get intense?", reversed: "Feelings held down, or moods that swing. Steadiness is different from never feeling anything." },
  },
  Swords: {
    Ace:    { carry: "clarity", keywords: ["clarity", "truth", "a breakthrough"], meaning: "A moment of clarity or a new idea. What has become clearer, and what would you like to say or decide with it?", reversed: "Confusion, or a truth that is hard to see yet. It is fine to gather more information before deciding." },
    Two:    { carry: "one clear look at the choice", keywords: ["a difficult choice", "indecision", "a stalemate"], meaning: "A hard choice, and perhaps not wanting to look at it yet. What would help you see both sides more clearly?", reversed: "New information arriving, or feeling overwhelmed by a decision. You can decide one piece at a time." },
    Three:  { carry: "gentleness with yourself", keywords: ["heartbreak", "grief", "painful truth"], meaning: "Heartbreak or painful news. Hurt like this is real, and it takes the time it takes. Who could keep you company in it?", reversed: "Pain starting to ease, or sorrow that lingers. Both are part of grieving, and neither needs to be hurried." },
    Four:   { carry: "rest", keywords: ["rest", "recovery", "retreat"], meaning: "Rest and recovery. Where could you let yourself stop for a while, without having to earn it?", reversed: "Restlessness, or running on empty. Rest is a need, not a reward." },
    Five:   { carry: "the outcome you actually want", keywords: ["conflict", "tension", "a hollow win"], meaning: "Conflict where winning may cost more than it gives. What outcome do you actually want, and what would it cost?", reversed: "Making peace after a conflict, or tension that lingers. If someone is hostile toward you, that is theirs to answer for." },
    Six:    { carry: "support for the crossing", keywords: ["transition", "moving away from difficulty", "calmer waters"], meaning: "Moving from a hard time toward calmer ground. What are you leaving behind, and what support do you have for the crossing?", reversed: "A transition that has stalled, or unfinished business. Change can be slow, and it is fine to need help with it." },
    Seven:  { carry: "trust in what you know", keywords: ["deception", "secrecy", "strategy"], meaning: "Strategy, secrecy, or someone not being straight. Where do you want more honesty, from others or from yourself? If you have been deceived, that is not your fault.", reversed: "Something hidden coming to light, or a choice to come clean. What would help you trust what you know?" },
    Eight:  { carry: "one small, safe step", keywords: ["feeling trapped", "restriction", "limited options"], meaning: "Feeling boxed in, with few options in view. If someone else is keeping you in place, that is not your doing, and support is here whenever you want it. Where you do have room, what is one small option you could look at?", reversed: "Seeing a way out, or starting to loosen a restriction. Small steps count." },
    Nine:   { carry: "what helps you feel safer", keywords: ["anxiety", "worry", "sleepless nights"], meaning: "Worry and sleepless nights. Anxious thoughts can feel louder at night. What would help you feel a little safer or less alone right now?", reversed: "Worry beginning to ease, or anxiety that feels too heavy to carry alone. Reaching out to someone you trust, or to support, can help." },
    Ten:    { carry: "rest and support", keywords: ["a painful ending", "exhaustion", "betrayal"], meaning: "A painful ending, or feeling you have hit bottom. What happened may be deeply unfair. What do you need most right now?", reversed: "Slowly getting up after something painful, or still feeling pinned down. Recovery has no set pace, and help can make it lighter." },
    Page:   { carry: "a good question", keywords: ["curiosity", "new ideas", "vigilance"], meaning: "A curious, questioning mind. What would you like to find out, and who could you ask?", reversed: "Hasty words, or talk without follow-through. What is worth saying, and what can wait?" },
    Knight: { carry: "a moment to slow down", keywords: ["drive", "fast thinking", "ambition"], meaning: "Fast thinking and a drive to charge ahead. What are you rushing toward, and what might you miss at this speed?", reversed: "Impulsiveness, or words that land harder than intended. Slowing down can protect you and others." },
    Queen:  { carry: "plain, kind words", keywords: ["clear boundaries", "honesty", "independence"], meaning: "Clear thinking, honest words, and firm boundaries. What would you say if you spoke plainly and kindly?", reversed: "Sharpness or coldness, perhaps after being hurt. Guarding yourself after harm makes sense, and warmth is yours to offer only where it feels safe." },
    King:   { carry: "fairness", keywords: ["clear judgement", "fairness", "authority"], meaning: "Clear judgement and fair authority. What would a fair decision here look like, based on what you know?", reversed: "Power or cleverness used against others. If someone uses their authority over you unfairly, that is theirs to answer for." },
  },
  Pentacles: {
    Ace:    { carry: "a seed worth planting", keywords: ["a new opportunity", "resources", "practical beginnings"], meaning: "A practical opportunity in work, money, health, or home. What could you plant now that might grow over time?", reversed: "An opportunity that slipped past, or plans that need firmer footing. What would you want in place before starting?" },
    Two:    { carry: "your first priority", keywords: ["balance", "juggling", "adaptability"], meaning: "Juggling several demands at once. What needs your attention first, and what could wait?", reversed: "Too many things at once, or balls starting to drop. Letting something go is a reasonable choice when there is too much." },
    Three:  { carry: "good collaboration", keywords: ["collaboration", "craft", "teamwork"], meaning: "Skilled work and collaboration. Who do you build well with, and what could you make together?", reversed: "Teamwork that isn't working, or skills overlooked. What would help the work go more smoothly?" },
    Four:   { carry: "a sense of enough", keywords: ["security", "saving", "holding on"], meaning: "Holding on to what gives you security. What are you protecting, and is holding it this tightly still helping?", reversed: "Loosening your grip, or worry about having enough. Money worries are real; what would ease them a little?" },
    Five:   { carry: "support, even a little", keywords: ["hardship", "worry about money", "feeling left out"], meaning: "Hard times, material or otherwise, and feeling left out in the cold. Hardship is not a personal failing. Where could you find support, even a little?", reversed: "Hard times beginning to ease, or help within reach. Accepting support is a sensible choice." },
    Six:    { carry: "a fair exchange", keywords: ["generosity", "giving and receiving", "fairness"], meaning: "Giving and receiving. Where are you giving, where are you receiving, and does the exchange feel fair?", reversed: "Giving with strings attached, or an exchange out of balance. Help should not come with control." },
    Seven:  { carry: "patience with slow growth", keywords: ["patience", "long-term effort", "assessment"], meaning: "Pausing to see how a long effort is growing. What is working, and what would you change?", reversed: "Impatience with slow results, or effort that isn't paying off. You can revise the plan without judging yourself." },
    Eight:  { carry: "steady practice", keywords: ["diligence", "skill", "practice"], meaning: "Steady practice and careful work. What skill are you building, and how much effort do you want to give it?", reversed: "Perfectionism, or work that has lost its meaning. Good enough is sometimes the right standard." },
    Nine:   { carry: "enjoying what you have made", keywords: ["self-sufficiency", "comfort", "independence"], meaning: "Comfort and independence you have built. What do you enjoy about what you have made for yourself?", reversed: "Working too hard to enjoy it, or independence that feels shaky. What would let you enjoy a little of what you have?" },
    Ten:    { carry: "what you want to pass on", keywords: ["legacy", "long-term security", "family"], meaning: "Long-term security, family, and what passes between generations. What do you want to build or pass on?", reversed: "Strain over money or family, or security that feels uncertain. You don't have to carry family expectations alone." },
    Page:   { carry: "one step of learning", keywords: ["study", "a new skill", "practical ambition"], meaning: "A student's focus: learning a skill or starting something practical. What would you like to learn, one step at a time?", reversed: "Putting off a plan, or losing focus. A smaller first step can make starting easier." },
    Knight: { carry: "a sustainable pace", keywords: ["steady effort", "reliability", "routine"], meaning: "Slow, reliable, steady effort. What routine is serving you well, and is the pace sustainable?", reversed: "Feeling stuck in a routine, or working without rest. What small change would bring back some energy?" },
    Queen:  { carry: "practical care for yourself", keywords: ["practical care", "resourcefulness", "home"], meaning: "Practical care for home, food, body, and resources. How could you look after your own needs today, the way you might for someone else?", reversed: "Caring for everyone except yourself, or work and home pulling against each other. Your own care counts." },
    King:   { carry: "security on your own terms", keywords: ["stability", "provision", "abundance"], meaning: "Material stability, and the ability to provide. What does security mean to you, and what helps you feel it?", reversed: "Holding on too tightly to money, or using it to control. Money used to control someone is a form of harm; support is here if that is happening to you." },
  },
};

const NUM_NAMES = ["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"];
const COURT_NAMES = ["Page","Knight","Queen","King"];

// Ids 22 to 77 in this order (each suit's Ace to Ten, then its court), which
// saved readings rely on.
function buildMinorArcana() {
  const cards = [];
  let id = 22;
  SUITS.forEach(suit => {
    [...NUM_NAMES, ...COURT_NAMES].forEach(rank => {
      const { carry, keywords, meaning, reversed } = MINOR_MEANINGS[suit.name][rank];
      cards.push({
        id: id++,
        name: `${rank} of ${suit.name}`,
        roman: rank,
        geoType: suit.geoType,
        color: suit.color,
        shadow: suit.color,
        carry,
        keywords,
        meaning,
        reversed,
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
    description: "One card to reflect on today",
    positions: [
      { label: "Your Message", x: 50, y: 50 },
    ],
  },
  {
    id: "three",
    name: "Past · Present · What may come",
    description: "The river of time across three cards",
    positions: [
      { label: "Past",    x: 20, y: 50 },
      { label: "Present", x: 50, y: 50 },
      { label: "What may come",  x: 80, y: 50 },
    ],
  },
  {
    id: "five",
    name: "Five-Card Cross",
    description: "Situation, challenge, foundation, advice, where this could lead",
    positions: [
      { label: "Situation",  x: 50, y: 50 },
      { label: "Challenge",  x: 50, y: 15 },
      { label: "Foundation", x: 50, y: 85 },
      { label: "Advice",     x: 20, y: 50 },
      { label: "Where this could lead",    x: 80, y: 50 },
    ],
  },
  {
    id: "horseshoe",
    name: "Horseshoe",
    description: "Seven-card arc from the past to what may come",
    positions: [
      { label: "Distant Past",  x: 10, y: 70 },
      { label: "Recent Past",   x: 25, y: 40 },
      { label: "Present",       x: 42, y: 20 },
      { label: "What may come soon",   x: 58, y: 20 },
      { label: "What may come",        x: 75, y: 40 },
      { label: "Best Action",   x: 90, y: 70 },
      { label: "Where this could lead", x: 50, y: 85 },
    ],
  },
  {
    id: "celtic",
    name: "Celtic Cross",
    description: "The classic 10-card deep reading",
    positions: [
      // Cross cluster left, staff column right — spaced so md cards
      // no longer overlap at small container sizes.
      { label: "The Heart",       x: 32, y: 48 },
      { label: "The Cross",       x: 32, y: 48, rotate: true },
      { label: "Foundation",      x: 32, y: 82 },
      { label: "Recent Past",     x: 12, y: 48 },
      { label: "Crown",           x: 32, y: 14 },
      { label: "What may come soon",     x: 52, y: 48 },
      { label: "Self",            x: 84, y: 85 },
      { label: "Environment",     x: 84, y: 61 },
      { label: "Hopes & Fears",   x: 84, y: 37 },
      { label: "Where this could lead",   x: 84, y: 13 },
    ],
  },
];