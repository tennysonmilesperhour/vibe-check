// The resonance graph: a serializable picture of which placements exist,
// where they live on the wheel, and which of them corroborate each other —
// including what is active *today*. Consumed by the Loom and by the
// wisdom/weather prompts (replacing loose prose context).
import { deriveAll } from './derive.js';
import { moonPhase } from './moon.js';
import { personalDay, reduceSingle } from './numerology.js';
import { signStartDegree, gateWheelDegree, ARCANA_ASTRO, arcanaName } from './tables.js';
// Accepts both the bare name ("The Hierophant") and the form's "N – Name".
import { cardId as arcanaIdByName } from './tarotCards.js';

const signMidDegree = (sign) => {
  const start = signStartDegree(sign);
  return start === null ? null : start + 15;
};

/** resonanceGraph(profile, dateKey) -> { nodes, edges, today } (JSON-safe). */
export function resonanceGraph(profile = {}, dateKey) {
  const enabled = new Set(profile.enabled_systems || []);
  const { values } = deriveAll(profile, dateKey);
  const nodes = [];
  const edges = [];

  const addNode = (id, system, label, wheelDeg = null, meta = {}) => {
    if (label == null || label === '') return null;
    const node = { id, system, label: String(label), wheelDeg, ...meta };
    nodes.push(node);
    return node;
  };

  // ── astrology placements at their sign midpoints ──
  if (enabled.has('astrology')) {
    const a = profile.astrology || {};
    // The Sun sign is computable from the birth date alone, so plot it even
    // before the user opens the astrology form. Moon/Rising/Node still need a
    // birth time, so they stay whatever the user (or the AI calc) filled in.
    const sunSign = a.sun_source === 'unknown' ? null : a.sun_source === 'date_estimate' ? values.astrology?.sun_sign : a.sun_sign || values.astrology?.sun_sign || null;
    addNode('astrology.sun', 'astrology', sunSign && `Sun in ${sunSign}`, sunSign ? signMidDegree(sunSign) : null, { sign: sunSign });
    addNode('astrology.moon', 'astrology', a.moon_sign && `Moon in ${a.moon_sign}`, a.moon_sign ? signMidDegree(a.moon_sign) : null, { sign: a.moon_sign });
    addNode('astrology.rising', 'astrology', a.rising_sign && `${a.rising_sign} Rising`, a.rising_sign ? signMidDegree(a.rising_sign) : null, { sign: a.rising_sign });
    addNode('astrology.north_node', 'astrology', a.north_node && `North Node in ${a.north_node}`, a.north_node ? signMidDegree(a.north_node) : null, { sign: a.north_node });
  }

  // ── human design: conscious sun gate on the gate ring ──
  const gate = profile.human_design?.conscious_sun_gate || values.human_design.conscious_sun_gate;
  if (enabled.has('human_design')) {
    const h = profile.human_design || {};
    addNode('human_design.type', 'human_design', h.type, null);
    if (gate) addNode('human_design.conscious_sun', 'human_design', `Gate ${gate}`, gateWheelDegree(gate), { gate: String(gate) });
  }

  // ── gene keys: life's work on the same ring ──
  const lifeWork = profile.gene_keys?.life_work || values.gene_keys.life_work;
  if (enabled.has('gene_keys') && lifeWork) {
    addNode('gene_keys.life_work', 'gene_keys', `Life's Work ${lifeWork}`, gateWheelDegree(lifeWork), { gate: String(lifeWork) });
  }

  // ── numerology + tarot archetype (no wheel position of their own) ──
  const lp = profile.numerology?.life_path || values.numerology.life_path;
  if (enabled.has('numerology') && lp) {
    addNode('numerology.life_path', 'numerology', `Life Path ${lp}`, null, { number: Number(lp) });
  }
  const birthCardName = profile.tarot_archetype?.birth_card || values.tarot_archetype.birth_card;
  if (enabled.has('tarot_archetype') && birthCardName) {
    const cardId = arcanaIdByName(birthCardName);
    const astro = cardId !== null ? ARCANA_ASTRO[cardId] : null;
    const deg = astro?.kind === 'sign' ? signMidDegree(astro.sign) : null;
    addNode('tarot_archetype.birth_card', 'tarot_archetype', birthCardName, deg, { cardId, astro });
  }

  // ── enneagram / chakras: inner-ring nodes ──
  if (enabled.has('enneagram') && profile.enneagram?.type) {
    addNode('enneagram.type', 'enneagram', `Type ${profile.enneagram.type}${profile.enneagram.wing ? ` (${profile.enneagram.wing})` : ''}`, null);
  }
  if (enabled.has('chakras') && profile.chakras?.dominant_center) {
    addNode('chakras.dominant', 'chakras', `${profile.chakras.dominant_center} centered`, null);
  }

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const addEdge = (a, b, kind, why) => {
    if (!byId[a] || !byId[b]) return;
    const strength = 2; // both endpoints exist -> user-visible corroboration
    edges.push({ a, b, kind, why, strength, isActiveToday: false });
  };

  // hexagram identity: gene key <-> HD gate
  if (byId['gene_keys.life_work'] && byId['human_design.conscious_sun'] &&
      String(byId['gene_keys.life_work'].gate) === String(byId['human_design.conscious_sun'].gate)) {
    addEdge('gene_keys.life_work', 'human_design.conscious_sun', 'hexagram',
      `Gene Key ${lifeWork} and Gate ${gate} are the same I Ching hexagram — your Life's Work is your Conscious Sun.`);
  }

  // number link: a birth card worked out from the same date reduces to the
  // same digit as the Life Path. The Fool counts as 22, and a master number
  // Life Path such as 11 shares its root (2) with the card.
  const birthCardId = birthCardName ? arcanaIdByName(birthCardName) : null;
  const cardNumber = birthCardId === 0 ? 22 : birthCardId;
  if (lp && cardNumber !== null && reduceSingle(cardNumber) === reduceSingle(Number(lp))) {
    const card = `Your birth card, ${arcanaName(birthCardId)}, ${birthCardId === 0 ? 'counts as 22' : `is card ${cardNumber}`}`;
    addEdge('numerology.life_path', 'tarot_archetype.birth_card', 'number', cardNumber === Number(lp)
      ? `${card}, the same number as your Life Path.`
      : `${card}, and your Life Path is ${lp}. Both reduce to ${reduceSingle(cardNumber)}.`);
  }

  // Golden Dawn: birth card <-> its sign/planet, tied back to astrology placements
  const cardNode = byId['tarot_archetype.birth_card'];
  if (cardNode?.astro?.kind === 'sign') {
    for (const placement of ['astrology.sun', 'astrology.moon', 'astrology.rising']) {
      if (byId[placement]?.sign === cardNode.astro.sign) {
        addEdge('tarot_archetype.birth_card', placement, 'astro',
          `${cardNode.label} carries ${cardNode.astro.sign} in the Golden Dawn attribution — the same sign as your ${placement.split('.')[1]}.`);
      }
    }
    // even without a matching placement, note the card's sign as a wheel edge to itself (skipped)
    if (!edges.some((e) => e.kind === 'astro')) {
      // link card to sun if both exist regardless of sign match? No — only truthful links.
      if (byId['astrology.sun']) {
        edges.push({
          a: 'tarot_archetype.birth_card', b: 'astrology.sun', kind: 'astro',
          why: `${cardNode.label} sits in ${cardNode.astro.sign} on the wheel; your Sun watches from ${byId['astrology.sun'].sign}.`,
          strength: 1, isActiveToday: false,
        });
      }
    }
  }

  // ── today layer ──
  const today = { moonPhase: null, personalDay: null, activeNodeIds: [] };
  if (dateKey) {
    const moon = moonPhase(dateKey);
    today.moonPhase = { name: moon.name, illumination: Math.round(moon.illumination * 100) / 100 };
    const pd = profile.birth_date ? personalDay(profile.birth_date, dateKey) : null;
    today.personalDay = pd;

    // Moon-ruled placements stir when the moon is strong (full/new); the
    // moon placement itself is always today-touched.
    if (byId['astrology.moon']) today.activeNodeIds.push('astrology.moon');
    if (pd && byId['numerology.life_path'] && Number(byId['numerology.life_path'].number) === pd) {
      today.activeNodeIds.push('numerology.life_path');
    }
    for (const edge of edges) {
      if (today.activeNodeIds.includes(edge.a) || today.activeNodeIds.includes(edge.b)) {
        edge.isActiveToday = true;
      }
    }
  }

  return { nodes, edges, today };
}

/** Compact text summary of the graph for LLM prompts. */
export function summarizeGraph(graph) {
  const lines = [];
  for (const node of graph.nodes) lines.push(`- ${node.label} (${node.system})`);
  for (const edge of graph.edges) lines.push(`* RESONANCE: ${edge.why}`);
  if (graph.today?.moonPhase) {
    lines.push(`* TODAY: ${graph.today.moonPhase.name}${graph.today.personalDay ? `, Personal Day ${graph.today.personalDay}` : ''}`);
  }
  return lines.join('\n');
}
