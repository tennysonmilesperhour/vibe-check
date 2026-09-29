import { describe, it, expect } from 'vitest';
import { tarotReading, synergyReading } from '../readings';
import { systemReading } from '../engine';
import { FULL_DECK } from '../../../components/tarot/tarotDeck';
import { ORACLE_DECK } from '../../../components/tarot/oracleDeck';
import { ARCANA } from '../content/tarotArchetype';
import { CHAKRAS } from '../content/chakras';
import { ENNEAGRAM } from '../content/enneagram';
import { HD_AUTHORITIES } from '../content/humanDesign';

// Lines that told someone recording harm to doubt themselves, promised safety
// or fate, or treated a feeling as being off course.
const BYPASSING = /universe (supports|is benevolent)|gift from the universe|meant for you|meant to carry|of your own making|trapped by your own choices|fundamentally well|knocking on your own door|surrender your struggle|I am safe|exact medicine|disguised as a challenge|dashboard lights|unfolding as it should|peace is a choice|stop replaying|evidence arrives after the trust|necessary growth|perfect consequence|blame fate|only you are here to play|how the cards answer/i;

const card = (id) => FULL_DECK.find((item) => item.id === id);
const texts = (value) => (typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(texts) : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);

describe('symbolic readings never talk over harm', () => {
  it('keeps the decks and system texts free of bypassing and self-blame', () => {
    for (const text of texts([FULL_DECK, ORACLE_DECK, ARCANA, CHAKRAS, ENNEAGRAM, HD_AUTHORITIES])) expect(text).not.toMatch(BYPASSING);
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
    const reading = JSON.stringify(systemReading('human_design', { type: 'Projector', authority: 'Splenic' }));
    expect(reading).toMatch(/Only you can say what your feelings mean/);
    expect(reading).toMatch(/if you are unsafe, you don't have to wait/);
    expect(reading).not.toMatch(BYPASSING);
  });
});
