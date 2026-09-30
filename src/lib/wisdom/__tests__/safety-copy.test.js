import { describe, it, expect } from 'vitest';
import { tarotReading, synergyReading, integratedReading, periodWisdom, RELATIONSHIP_QUESTION } from '../readings';
import { systemReading } from '../engine';
import { FULL_DECK } from '../../../components/tarot/tarotDeck';
import { ORACLE_DECK } from '../../../components/tarot/oracleDeck';
import { ARCANA } from '../content/tarotArchetype';
import { CHAKRAS } from '../content/chakras';
import { ENNEAGRAM, INSTINCTS } from '../content/enneagram';
import { HD_AUTHORITIES, HD_TYPES, HD_PROFILES } from '../content/humanDesign';
import { GENE_KEYS, GK_SEQUENCE_META } from '../content/geneKeys';
import { NUMBERS } from '../content/numerology';
import { ZODIAC } from '../content/zodiac';
import { MINOR_ARCANA } from '../../../components/tarot/tarotDeck';
import { ENNEAGRAM_TYPES } from '../../../components/cosmic/correspondences';
import profileFormSource from '../../../components/cosmic/ProfileForm.jsx?raw';
import correspondencesSource from '../../../components/cosmic/correspondences.jsx?raw';

// Lines that told someone recording harm to doubt themselves, promised safety
// or fate, or treated a feeling as being off course.
const BYPASSING = /universe (supports|is benevolent)|gift from the universe|meant for you|meant to carry|of your own making|trapped by your own choices|fundamentally well|knocking on your own door|surrender your struggle|I am safe|exact medicine|disguised as a challenge|dashboard lights|unfolding as it should|peace is a choice|stop replaying|evidence arrives after the trust|necessary growth|perfect consequence|blame fate|only you are here to play|how the cards answer/i;

// Lines that pushed toward risk or past someone's own sense of safety, framed
// hard things as necessary or as a teacher, or read a feeling as failure.
const PUSHING = /even where it feels risky|pick alive|scares and excites|act like it|you need to walk through|what needs to end\.|one clean, kind cut|necessary (collapse|disruption|pause|aloneness)|must fall|shadow teacher|it teaches|trust that endings|new life follows every ending|only real risk|reclaim (your|the) power|power you gave away|forgive, and rise|don't make big decisions|reframe today's worry|repeat:|blocked \w+ energy|raw emotion untempered|lack of faith|inability to move on|no truth in the now|you usually regret|not failures|savior or a scapegoat|not a moment for pushing|changes the trajectory|stop deflecting|without the counterweight/i;

// Lines that told the person who they are because of a card or a chart.
const IDENTITY = /you carry the soul|you are here to|here to give|soul archetype|draw your archetype|center makes you|this is your gift|characterizes your nature/i;

// Lines that assigned a destiny, a lesson or a fixed nature.
const DESTINY = /you are meant to|meant to (be|illuminate|lead)|the lesson (is|of)|your destiny|destined|most powerful of|born to|your purpose is|who you grow into|at your core|you are unmistakably|runs you|the vibration of/i;

const SYSTEM_TEXTS = () => [FULL_DECK, ORACLE_DECK, ARCANA, CHAKRAS, ENNEAGRAM, INSTINCTS, HD_AUTHORITIES, HD_TYPES, HD_PROFILES, GENE_KEYS, GK_SEQUENCE_META, NUMBERS, ZODIAC];

const card = (id) => FULL_DECK.find((item) => item.id === id);
const oracle = (id) => ORACLE_DECK.find((item) => item.id === id);
const texts = (value) => (typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(texts) : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);

describe('symbolic readings never talk over harm', () => {
  it('keeps the decks and system texts free of bypassing, self-blame, identity and destiny claims', () => {
    for (const text of texts(SYSTEM_TEXTS())) {
      expect(text).not.toMatch(BYPASSING);
      expect(text).not.toMatch(PUSHING);
      expect(text).not.toMatch(IDENTITY);
      expect(text).not.toMatch(DESTINY);
    }
  });

  it('reads every number and Enneagram type without telling someone who they are', () => {
    const profile = { birth_date: '1990-07-15', first_name: 'Ann', last_name: 'Lee', enabled_systems: ['numerology', 'enneagram'] };
    const readings = [
      ...Object.keys(NUMBERS).map((n) => systemReading('numerology', { life_path: n, expression: n, soul_urge: n, personal_year: n }, profile)),
      ...Object.keys(ENNEAGRAM).map((n) => systemReading('enneagram', { type: n, wing: `${n}w${n === '9' ? 1 : Number(n) + 1}`, instinct: 'Social (so)', tritype: '459' }, profile)),
    ];
    for (const reading of readings) {
      for (const pattern of [BYPASSING, PUSHING, IDENTITY, DESTINY]) expect(reading).not.toMatch(pattern);
    }
  });

  it('closes every one-card reading with something worth carrying', () => {
    const HARD = /heartbreak|anxiety|grief|deception|trapped|burden|painful|hardship|conflict|betrayal|exhaustion|walking away|illusion|sudden change|shadow self|forgiveness|worry|loss|regret|restriction|upheaval|secrecy/i;
    /** @type {[string, any[]][]} */
    const decks = [['tarot', FULL_DECK], ['oracle', ORACLE_DECK]];
    for (const [deck, cards] of decks) {
      for (const item of cards) {
        for (const reversed of [false, true]) {
          const reading = tarotReading({ spreadName: 'Daily Draw', deck, cards: [{ card: item, position: 'Your Message', reversed }] });
          const closer = reading.slice(reading.indexOf('Something to carry, if it fits:'));
          expect(closer, item.name).not.toMatch(HARD);
          for (const pattern of [BYPASSING, PUSHING, IDENTITY, DESTINY]) expect(closer).not.toMatch(pattern);
        }
      }
    }
    const three = tarotReading({ spreadName: 'Daily Draw', cards: [{ card: card(52), position: 'Your Message', reversed: false }] });
    expect(three).toMatch(/Something to carry, if it fits: gentleness with yourself/);
  });

  it('gives each minor arcana card its own reading', () => {
    expect(MINOR_ARCANA).toHaveLength(56);
    expect(MINOR_ARCANA.map((c) => c.id)).toEqual(Array.from({ length: 56 }, (_, i) => i + 22));
    expect(MINOR_ARCANA[0].name).toBe('Ace of Wands');
    expect(MINOR_ARCANA[55].name).toBe('King of Pentacles');
    expect(new Set(MINOR_ARCANA.map((c) => c.meaning)).size).toBe(56);
    expect(new Set(MINOR_ARCANA.map((c) => c.reversed)).size).toBe(56);
    for (const c of MINOR_ARCANA) expect(c.keywords).toHaveLength(3);
  });

  it('names Enneagram types in Vibe Check\'s own words', () => {
    const schoolNames = /reformer|helper|achiever|individualist|investigator|loyalist|enthusiast|challenger|peacemaker|perfectionist|giver|performer|romantic|observer|epicure|mediator/i;
    for (const text of [...ENNEAGRAM_TYPES, ...Object.values(ENNEAGRAM).map((t) => t.name)]) expect(text).not.toMatch(schoolNames);
    expect(ENNEAGRAM_TYPES[3]).toBe('4 – Authenticity and depth');
  });

  it('says so first for questions about safety, a relationship or another person, in their common forms', () => {
    for (const question of ['Is he hurting me?', 'He hurts me, what do I do?', 'Should I be leaving him?', 'Should I stay with her?', 'Is my safety at risk at home?', 'Are my relationships healthy?', 'Should we breakup?', 'Can I trust him?', 'Does she love me?',
      'Should I leave?', 'Should I stay?', 'Am I in danger?', 'Will he kill me?', 'He hit me', 'Is he controlling?', 'He yells at me every night', 'Should I go back?',
      'He slapped me', 'I was assaulted', 'Someone is stalking me', 'I am terrified', 'My fiancé scares me', 'Are we breaking up?', 'Should I take him back?', 'Should I forgive him?', 'Will he change?', 'Is my partner good for me?',
      'Should we get back together?', 'Someone keeps following me home', 'My stepdad touches me at night', 'My coworker grabbed me']) {
      expect(question).toMatch(RELATIONSHIP_QUESTION);
    }
    for (const question of ['What should I focus on?', 'Will the project go well?', 'What do I need to know about this week?']) {
      expect(question).not.toMatch(RELATIONSHIP_QUESTION);
    }
  });

  it('reads cleanly with any spread, position or card name', () => {
    const three = tarotReading({ spreadName: 'Past · Present · What may come', cards: [{ card: card(12), position: 'What may come', reversed: false }], question: 'What is next?' });
    expect(three).toMatch(/^You laid out "Past · Present · What may come" with a question in mind/);
    expect(three).toMatch(/What may come: The Hanged Man, a card of pause and new perspective\./);
    const living = tarotReading({ spreadName: 'Daily Draw', deck: 'oracle', cards: [{ card: oracle(122), position: 'Your Message', reversed: false }] });
    // A card name is never the subject of a sentence.
    expect(living).toMatch(/Your Message: Choose the Living Option, a card of aliveness and choice\./);
    expect(living).not.toMatch(/Choose the Living Option (is|speaks)|the thread of Choose/i);
    expect(living).toMatch(/Something to carry, if it fits: aliveness, from the card "Choose the Living Option"\./);
  });

  it('sets the reading beside the chart, never beside today\'s sky', () => {
    const cards = [{ card: card(17), position: 'Present', reversed: false }];
    expect(tarotReading({ cards, resonanceSummary: '* TODAY: Waning Gibbous' })).not.toMatch(/your own chart/);
    expect(tarotReading({ cards, resonanceSummary: '- Sun in Leo (astrology)\n* TODAY: Waning Gibbous' })).toMatch(/your own chart: Sun in Leo \(astrology\)\. Keep what is useful/);
  });

  it('never answers a question for the person, and says so first about staying or safety', () => {
    const cards = [{ card: card(16), position: 'Present', reversed: false }];
    const open = tarotReading({ spreadName: 'single card', cards, question: 'What should I focus on?' });
    expect(open).toMatch(/can't answer it for you/);
    expect(open).not.toMatch(/whether someone is safe/);
    // Any other question still gets the shorter note, for wordings no list holds.
    expect(open).toMatch(/If your question is about how someone treats you/);
    expect(tarotReading({ spreadName: 'single card', cards, question: 'Should I take Alex back?' })).toMatch(/If your question is about how someone treats you|whether someone is safe/);
    expect(tarotReading({ spreadName: 'single card', cards })).not.toMatch(/how someone treats you|whether someone is safe/);
    const staying = tarotReading({ spreadName: 'single card', cards, question: 'Should I stay with him?' });
    expect(staying).toMatch(/No reading can tell you whether someone is safe to be with or whether to stay/);
    expect(staying).not.toMatch(BYPASSING);
  });

  it('keeps the lived relationship in view in every synergy reading, with or without their chart', () => {
    const mine = { enabled_systems: ['numerology', 'human_design'], numerology: { life_path: '3' }, human_design: { type: 'Generator' } };
    for (const theirs of [null, {}, { numerology: { life_path: '5' }, human_design: { type: 'Projector' } }, { first_name: 'X' }]) {
      const reading = synergyReading(mine, theirs, 'Sam');
      expect(reading).toMatch(/A chart cannot establish compatibility or excuse mistreatment/);
      expect(reading).not.toMatch(/reveal themselves|structural, not personal|one of you being wrong|avoiding the same lesson/);
    }
  });

  it('frames the not-self theme as the person\'s to interpret, and timing as never applying to safety', () => {
    const safetyLines = (text) => (text.match(/if you are unsafe, you don't have to wait/g) || []).length;
    for (const type of Object.keys(HD_TYPES)) {
      const reading = JSON.stringify(systemReading('human_design', { type, authority: 'Emotional' }));
      expect(reading).toMatch(/Only you can say what your feelings mean/);
      expect(safetyLines(reading)).toBe(1);
      expect(reading).not.toMatch(BYPASSING);
      // No feeling is read as a sign of being off course.
      expect(reading).not.toMatch(/you (hit|meet) (frustration|anger|disappointment)|turn bitter|not-self signature|proof is in how you feel/i);
    }
    // An authority alone, without a type, still says it once.
    for (const { match } of Object.values(HD_AUTHORITIES)) {
      expect(safetyLines(JSON.stringify(systemReading('human_design', { authority: match[0] })))).toBe(1);
    }
  });

  it('never reads a Gene Keys shadow into a feeling or a hard situation', () => {
    const reading = JSON.stringify(systemReading('gene_keys', { life_work: '55', evolution: '59' }));
    expect(reading).toMatch(/doesn't mean you have fallen into a shadow/);
    expect(reading).not.toMatch(/fall into the Shadow|still run you|Awareness itself/);
  });

  it('never tells the person who they are from a card or a chart', () => {
    const profile = {
      first_name: 'Wren', birth_date: '1990-04-12',
      enabled_systems: ['astrology', 'human_design', 'gene_keys', 'numerology', 'tarot_archetype', 'chakras'],
      astrology: { sun_sign: 'Aries' }, human_design: { type: 'Generator', authority: 'Emotional', profile: '1/3' }, gene_keys: { life_work: '55' },
      numerology: {}, tarot_archetype: {}, chakras: { dominant_center: 'Heart (Anahata)' },
    };
    const rendered = [
      integratedReading(profile.enabled_systems, profile),
      ...['human_design', 'gene_keys', 'tarot_archetype', 'chakras'].map((system) => JSON.stringify(systemReading(system, profile[system], profile))),
      ...['daily', 'weekly', 'monthly', 'yearly'].map((period) => JSON.stringify(periodWisdom(period, profile, null))),
    ];
    expect(rendered.join(' ')).toMatch(/The center you chose: Heart/i); // the chakra reading really renders
    for (const text of rendered) expect(text).not.toMatch(IDENTITY);
    for (const source of [profileFormSource, correspondencesSource]) expect(source).not.toMatch(/soul archetype|attract into your life|characterizes your nature/i);
  });

  it('only calls a Life Path and a birth card one calculation when both came from the birth date', () => {
    const base = { birth_date: '1990-04-12', enabled_systems: ['numerology', 'tarot_archetype'] };
    expect(integratedReading(base.enabled_systems, { ...base, numerology: {}, tarot_archetype: {} })).toMatch(/one calculation read two ways/);
    expect(integratedReading(base.enabled_systems, { ...base, numerology: { life_path: '7' }, tarot_archetype: { birth_card: 'The Lovers' } })).not.toMatch(/same root number/);
  });

  it('shows the soul card and how the birth cards are worked out', () => {
    const profile = { birth_date: '1985-11-23', enabled_systems: ['tarot_archetype'], tarot_archetype: {} };
    const reading = JSON.stringify(systemReading('tarot_archetype', {}, profile));
    expect(reading).toMatch(/Your Birth Card: The Hanged Man/i);
    expect(reading).toMatch(/Your Soul Card: The Empress/i);
    expect(reading).toMatch(/Mary K. Greer's method/);
    // A birth card chosen by hand doesn't get the computed soul card.
    expect(JSON.stringify(systemReading('tarot_archetype', { birth_card: 'The Tower' }, profile))).not.toMatch(/Your Soul Card|Greer/i);
  });

  it('does not read an earlier method\'s shadow card beside the computed birth card', () => {
    // 11 + 28 + 1970 = 2009 -> 11, Justice, soul 2, The High Priestess.
    const profile = { birth_date: '1970-11-28', enabled_systems: ['tarot_archetype'], tarot_archetype: {} };
    const data = { birth_card: '11 – Justice', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' };
    const reading = JSON.stringify(systemReading('tarot_archetype', data, profile));
    expect(reading).toMatch(/Your Soul Card: The High Priestess/i);
    expect(reading).not.toMatch(/Your Shadow Card|The two together/i);
    // Beside a card that isn't the computed one, it is still read.
    const earlier = JSON.stringify(systemReading('tarot_archetype', data, { ...profile, birth_date: '1960-01-03' }));
    expect(earlier).toMatch(/Your Shadow Card: The High Priestess/i);
    // So it is beside a card the person kept, even when it is the computed one.
    const kept = JSON.stringify(systemReading('tarot_archetype', { ...data, birth_card_source: 'entered' }, profile));
    expect(kept).toMatch(/Your Shadow Card: The High Priestess/i);
  });

  it('asks for a check of Gene Keys spheres saved under the old labels', () => {
    const profile = { enabled_systems: ['gene_keys'] };
    expect(JSON.stringify(systemReading('gene_keys', { radiance: '31', positions_checked: false }, profile))).toMatch(/Check these keys/i);
    expect(JSON.stringify(systemReading('gene_keys', { radiance: '31', positions_checked: true }, profile))).not.toMatch(/Check these keys/i);
    expect(JSON.stringify(systemReading('gene_keys', { life_work: '51', positions_checked: false }, profile))).not.toMatch(/Check these keys/i);
  });

  it('reads a shadow card the person chose, even when it is also the soul card', () => {
    // 1 + 3 + 1960 = 1964 -> 20, Judgement, soul 2, The High Priestess.
    const profile = { birth_date: '1960-01-03', enabled_systems: ['tarot_archetype'], tarot_archetype: {} };
    const reading = JSON.stringify(systemReading('tarot_archetype', { birth_card: '20 – Judgement', shadow_card: '2 – The High Priestess', shadow_card_source: 'entered' }, profile));
    expect(reading).toMatch(/Your Soul Card: The High Priestess/i);
    expect(reading).toMatch(/Your Shadow Card: The High Priestess/i);
  });
});
