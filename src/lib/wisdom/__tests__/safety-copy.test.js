import { describe, it, expect } from 'vitest';
import { tarotReading, synergyReading, RELATIONSHIP_QUESTION } from '../readings';
import { systemReading } from '../engine';
import { FULL_DECK } from '../../../components/tarot/tarotDeck';
import { ORACLE_DECK } from '../../../components/tarot/oracleDeck';
import { ARCANA } from '../content/tarotArchetype';
import { CHAKRAS } from '../content/chakras';
import { ENNEAGRAM } from '../content/enneagram';
import { HD_AUTHORITIES, HD_TYPES } from '../content/humanDesign';

// Lines that told someone recording harm to doubt themselves, promised safety
// or fate, or treated a feeling as being off course.
const BYPASSING = /universe (supports|is benevolent)|gift from the universe|meant for you|meant to carry|of your own making|trapped by your own choices|fundamentally well|knocking on your own door|surrender your struggle|I am safe|exact medicine|disguised as a challenge|dashboard lights|unfolding as it should|peace is a choice|stop replaying|evidence arrives after the trust|necessary growth|perfect consequence|blame fate|only you are here to play|how the cards answer/i;

// Lines that pushed toward risk or past someone's own sense of safety, or
// framed hard things as a teacher.
const PUSHING = /even where it feels risky|pick alive|scares and excites|act like it|you need to walk through|what needs to end\.|one clean, kind cut|necessary collapse|shadow teacher|it teaches|trust that endings/i;

const card = (id) => FULL_DECK.find((item) => item.id === id);
const oracle = (id) => ORACLE_DECK.find((item) => item.id === id);
const texts = (value) => (typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(texts) : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);

describe('symbolic readings never talk over harm', () => {
  it('keeps the decks and system texts free of bypassing and self-blame', () => {
    for (const text of texts([FULL_DECK, ORACLE_DECK, ARCANA, CHAKRAS, ENNEAGRAM, HD_AUTHORITIES, HD_TYPES])) {
      expect(text).not.toMatch(BYPASSING);
      expect(text).not.toMatch(PUSHING);
    }
  });

  it('says so first for questions about safety or a relationship, in any word form', () => {
    for (const question of ['Is he hurting me?', 'He hurts me, what do I do?', 'Should I be leaving him?', 'Should I stay with her?', 'Is my safety at risk at home?', 'Are my relationships healthy?', 'Should we breakup?', 'Can I trust him?', 'Does she love me?']) {
      expect(question).toMatch(RELATIONSHIP_QUESTION);
    }
    for (const question of ['Should I leave my job?', 'What should I focus on?', 'Will the project go well?']) {
      expect(question).not.toMatch(RELATIONSHIP_QUESTION);
    }
  });

  it('reads cleanly with any spread, position or card name', () => {
    const three = tarotReading({ spreadName: 'Past · Present · What may come', cards: [{ card: card(12), position: 'What may come', reversed: false }], question: 'What is next?' });
    expect(three).toMatch(/^You laid out "Past · Present · What may come" with a question in mind/);
    expect(three).toMatch(/What may come: The Hanged Man speaks of/);
    const living = tarotReading({ spreadName: 'Daily Draw', deck: 'oracle', cards: [{ card: oracle(122), position: 'Your Message', reversed: false }] });
    expect(living).not.toMatch(/choose the Living Option is/i);
    expect(living).toMatch(/Something to carry, if it fits: aliveness/);
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
    for (const type of Object.keys(HD_TYPES)) {
      const reading = JSON.stringify(systemReading('human_design', { type, authority: 'Splenic' }));
      expect(reading).toMatch(/Only you can say what your feelings mean/);
      expect(reading).toMatch(/if you are unsafe, you don't have to wait/);
      expect(reading).not.toMatch(BYPASSING);
      // No feeling is read as a sign of being off course.
      expect(reading).not.toMatch(/you (hit|meet) (frustration|anger|disappointment)|turn bitter|not-self signature|proof is in how you feel/i);
    }
  });
});
