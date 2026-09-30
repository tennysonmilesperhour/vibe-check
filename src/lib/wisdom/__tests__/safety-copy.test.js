import { describe, it, expect } from 'vitest';
import { tarotReading, synergyReading, integratedReading, periodWisdom, RELATIONSHIP_QUESTION } from '../readings';
import { systemReading } from '../engine';
import { FULL_DECK } from '../../../components/tarot/tarotDeck';
import { ORACLE_DECK } from '../../../components/tarot/oracleDeck';
import { ARCANA } from '../content/tarotArchetype';
import { CHAKRAS } from '../content/chakras';
import { ENNEAGRAM } from '../content/enneagram';
import { HD_AUTHORITIES, HD_TYPES, HD_PROFILES } from '../content/humanDesign';
import { GENE_KEYS } from '../content/geneKeys';
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

const card = (id) => FULL_DECK.find((item) => item.id === id);
const oracle = (id) => ORACLE_DECK.find((item) => item.id === id);
const texts = (value) => (typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(texts) : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);

describe('symbolic readings never talk over harm', () => {
  it('keeps the decks and system texts free of bypassing and self-blame', () => {
    for (const text of texts([FULL_DECK, ORACLE_DECK, ARCANA, CHAKRAS, ENNEAGRAM, HD_AUTHORITIES, HD_TYPES, HD_PROFILES, GENE_KEYS])) {
      expect(text).not.toMatch(BYPASSING);
      expect(text).not.toMatch(PUSHING);
    }
    for (const text of texts([ARCANA, HD_TYPES, HD_PROFILES])) expect(text).not.toMatch(IDENTITY);
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
});
