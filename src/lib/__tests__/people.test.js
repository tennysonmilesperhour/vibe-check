import { describe, it, expect } from 'vitest';
import { matchPersonByText, mentionsPerson, dedupePeopleDrafts, searchPeople, entryInvolvesPerson, personCheckInStats, peopleRecordedTogether, orderPeopleForOrbit, arrangeOrbitRing, peopleNameReplacer, personLabels } from '../people.js';

const people = [
  { id: 'p1', name: 'Mom', legacy_names: ['mother', 'mama'] },
  { id: 'p2', name: 'Tom', legacy_names: [] },
  { id: 'p3', name: 'Sarah K', legacy_names: ['sarah'] },
];

describe('matchPersonByText', () => {
  it('matches exact name case-insensitively', () => {
    expect(matchPersonByText('mom', people)?.id).toBe('p1');
    expect(matchPersonByText('TOM', people)?.id).toBe('p2');
  });

  it('matches legacy aliases', () => {
    expect(matchPersonByText('mama', people)?.id).toBe('p1');
    expect(matchPersonByText('sarah', people)?.id).toBe('p3');
  });

  it('returns null when nothing matches', () => {
    expect(matchPersonByText('stranger', people)).toBeNull();
  });
});

describe('mentionsPerson (whole word, not substring)', () => {
  it('finds whole-word mentions inside free text', () => {
    expect(mentionsPerson("Dinner with Mom and Tom", people[0])).toBe(true);
    expect(mentionsPerson("Dinner with Mom and Tom", people[1])).toBe(true);
  });

  it("does NOT match substrings: the old bug where 'Mom' matched \"Tom's mommy\"", () => {
    expect(mentionsPerson("Tom's mommy came by", people[0])).toBe(false);
  });

  it('matches legacy aliases as whole words', () => {
    expect(mentionsPerson('called mother today', people[0])).toBe(true);
    expect(mentionsPerson('smothered in work', people[0])).toBe(false);
  });

  it('is safe with regex-special characters in names', () => {
    const spiky = { id: 'x', name: 'J.R. (Bob)', legacy_names: [] };
    expect(mentionsPerson('saw J.R. (Bob) at lunch', spiky)).toBe(true);
  });
});

describe('dedupePeopleDrafts', () => {
  it('merges drafts with the same lowercase name, unioning fields', () => {
    const drafts = [
      { name: 'Mom', qualities: ['kind'], legacy_names: ['mother'] },
      { name: 'mom', qualities: ['funny'], linked_user_email: 'mom@x.com', legacy_names: [] },
    ];
    const out = dedupePeopleDrafts(drafts);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Mom');
    expect(out[0].qualities.sort()).toEqual(['funny', 'kind']);
    expect(out[0].linked_user_email).toBe('mom@x.com');
    expect(out[0].legacy_names).toContain('mother');
  });
});

describe('searchPeople (picker)', () => {
  it('finds a person by alias without requiring the display name', () => {
    expect(searchPeople('mama', people).map((person) => person.id)).toEqual(['p1']);
    expect(searchPeople('SARAH', people).map((person) => person.id)).toEqual(['p3']);
  });

  it('does not treat an alias search as a reason to add a new person', () => {
    expect(matchPersonByText('mother', people)?.id).toBe('p1');
    expect(matchPersonByText('Mommy', people)).toBeNull();
  });
});

describe('entryInvolvesPerson and personCheckInStats', () => {
  it('counts a person tagged only on a high or low moment', () => {
    const checkIns = [
      { id: 'a', date: '2026-09-01', mood_score: 8, high_moment: { person_ids: ['p1'] } },
      { id: 'b', date: '2026-09-02', mood_score: 4, low_moment: { person_ids: ['P1'] } },
    ];
    expect(entryInvolvesPerson(checkIns[0], people[0])).toBe(true);
    expect(entryInvolvesPerson(checkIns[0], people[1])).toBe(false);
    expect(personCheckInStats(people[0], checkIns)).toEqual({ mentions: 2, avgMood: 6, lastMention: '2026-09-02' });
  });

  it('does not fall back to substring text once the picker has been used', () => {
    const entry = { person_ids: ['p2'], high_moment: { who_involved: 'Dinner with Mom' } };
    expect(entryInvolvesPerson(entry, people[0])).toBe(false);
    expect(entryInvolvesPerson(entry, people[1])).toBe(true);
  });

  it('uses whole-word who_involved text only when no picker ids exist', () => {
    const entry = { high_moment: { who_involved: "Tom's mommy came by" } };
    expect(entryInvolvesPerson(entry, people[0])).toBe(false);
    expect(entryInvolvesPerson(entry, people[1])).toBe(true);
  });
});

describe('people recorded together from picker tags', () => {
  const entries = [
    { id: '1', person_ids: ['p1', 'p2'] },
    { id: '2', high_moment: { person_ids: ['p1'] }, low_moment: { person_ids: ['p3'] } },
    { id: '3', person_ids: ['p1', 'p2', 'p3'] },
    { id: '4', person_ids: ['p2'] },
  ];

  it('matches people tagged in the same entry, including nested moments', () => {
    expect(peopleRecordedTogether(people[0], people, entries).map((row) => [row.person.id, row.shared])).toEqual([
      ['p3', 2],
      ['p2', 2],
    ]);
  });

  it('places frequently tagged people first and sits companions beside each other', () => {
    expect(orderPeopleForOrbit(people, entries).map((person) => person.id)).toEqual(['p1', 'p2', 'p3']);
    expect(arrangeOrbitRing([people[2], people[0], people[1]], entries).map((person) => person.id)[0]).toBe('p3');
    expect(arrangeOrbitRing([people[2], people[0], people[1]], entries).map((person) => person.id)[1]).toBe('p1');
  });
});

describe('replacing people\'s names with labels', () => {
  const labelOf = (person) => ({ a: 'Person 1', b: 'Person 2', c: 'Person 3', d: 'Person 4', e: 'Person 5', f: 'Person 6', g: 'Person 7', h: 'Person 8', i: 'Person 9', j: 'Person 10' })[person.id];
  const crowd = [
    { id: 'a', name: 'Sam' },
    { id: 'b', name: 'Jordan Smith' },
    { id: 'c', name: 'Mr. Kent' },
    { id: 'd', name: 'Alex (work)' },
    { id: 'e', name: 'Alex', legacy_names: ['Lexi'] },
    { id: 'f', name: '王 小明' },
    { id: 'g', name: '민수' },
    { id: 'h', name: "O'Brien" },
    { id: 'i', name: "Lily (Sam's mom)" },
    { id: 'j', name: 'Ayşe Yılmaz' },
  ];
  const replace = peopleNameReplacer(crowd, labelOf);

  it('replaces whole saved names in any case, and words of a longer name when they start with a capital', () => {
    expect(replace('Sam, sam and SAM. Samantha and the same.')).toBe('Person 1, Person 1 and Person 1. Samantha and the same.');
    expect(replace('Jordan called. SMITH too. jordan stayed home. Jordan Smith left.')).toBe('Person 2 called. Person 2 too. jordan stayed home. Person 2 left.');
    expect(replace('Mr. Kent waved, then Kent left. Mr. Brown stayed.')).toBe('Person 3 waved, then Person 3 left. Mr. Brown stayed.');
    expect(replace('Jordan called.', { parts: false })).toBe('Jordan called.');
  });

  it('never takes a word from a note in brackets as a name', () => {
    expect(replace("Sam's party was fun. Lily came, and her mom.")).toBe("Person 1's party was fun. Person 9 came, and her mom.");
  });

  it('gives both labels to a name two people share', () => {
    expect(replace('Alex shouted. Lexi helped.')).toBe('Person 4 or Person 5 shouted. Person 5 helped.');
  });

  it('finds a name joined to digits, an underscore, or a capitalized word', () => {
    expect(replace('#SamBirthday with Sam2 and Sam_K, not Sams or SAMANTHA.')).toBe('#Person 1Birthday with Person 1 2 and Person 1_K, not Sams or SAMANTHA.');
  });

  it('matches names written without spaces around them', () => {
    expect(replace('我和王小明吃饭, 小明也来了')).toBe('我和Person 6吃饭, Person 6也来了');
    expect(replace('민수가 왔다')).toBe('Person 7가 왔다');
  });

  it('matches any apostrophe, either way of writing an accent, and Turkish i', () => {
    expect(replace('O’Brien and o\'brien and Oʼbrien')).toBe('Person 8 and Person 8 and Person 8');
    expect(replace('AYŞE YILMAZ and Yilmaz')).toBe('Person 10 and Person 10');
    const decomposed = peopleNameReplacer([{ id: 'x', name: 'José' }, { id: 'y', name: 'İrem' }, { id: 'z', name: 'Dee' }], (person) => person.id);
    expect(decomposed('José came, then José, then irem, IREM and Deeʼs car.')).toBe('x came, then x, then y, y and zʼs car.');
  });

  it('keeps marks with the letters they belong to', () => {
    const hindi = peopleNameReplacer([{ id: 'r', name: 'राम' }, { id: 'p', name: 'प्रिया शर्मा' }], (person) => person.id);
    expect(hindi('रामा आई, राम आया')).toBe('रामा आई, r आया');
    expect(hindi('शर्म की बात, शर्मा जी')).toBe('शर्म की बात, p जी');
  });

  it('replaces extra strings such as ids, and never a label it just wrote or text it did not', () => {
    const withIds = peopleNameReplacer([{ id: 'uuid-1', name: 'Or' }, { id: 'uuid-2', name: '0' }], (person) => (person.id === 'uuid-1' ? 'Person 1' : 'Person 2'), (person) => [person.id]);
    expect(withIds('uuid-1 and Or or 0')).toBe('Person 1 and Person 1 Person 1 Person 2');
    expect(withIds(' stays')).toBe(' stays');
    expect(peopleNameReplacer([], () => 'x')('Nothing to replace')).toBe('Nothing to replace');
  });
});

describe('replacing names: descriptors, pasted names and other scripts', () => {
  it('takes only name words from a saved name, not where the person is from', () => {
    const replace = peopleNameReplacer([{ id: 'a', name: 'Sam from work' }, { id: 'b', name: 'Jen at gym' }, { id: 'c', name: 'Kim From Work' }, { id: 'd', name: 'Mike Work' }], (person) => person.id);
    expect(replace('Work was hard. At lunch I cried. Gym helped. From then on, Sam and Jen and Kim and Mike stayed.')).toBe('Work was hard. At lunch I cried. Gym helped. From then on, a and b and c and d stayed.');
  });

  it('counts capitalized particles, and a role word that leads a name, as names', () => {
    const replace = peopleNameReplacer([{ id: 'a', name: 'Al Green' }, { id: 'b', name: 'Minh Le' }, { id: 'c', name: 'Ludwig van Beethoven' }, { id: 'd', name: 'Son Heung-min' }, { id: 'e', name: 'Mom Linda' }], (person) => person.id);
    expect(replace('Al called. Le was late. A van passed. Beethoven played. Son scored. Mom and Linda came.')).toBe('a called. b was late. A van passed. c played. d scored. e and e came.');
  });

  it('splits couples and aliases saved without spaces', () => {
    const replace = peopleNameReplacer([{ id: 'a', name: 'Sam/Samuel' }, { id: 'b', name: 'Jen&Tom' }], (person) => person.id);
    expect(replace('Sam came, then Samuel. Jen and Tom visited.')).toBe('a came, then a. b and b visited.');
  });

  it('finds a name next to Chinese, Japanese, Korean or Thai text, and after Hebrew and Arabic prefixes', () => {
    const replace = peopleNameReplacer([{ id: 's', name: 'Sam' }, { id: 'm', name: 'Mina Kim' }, { id: 'd', name: 'דוד' }, { id: 'h', name: 'محمد' }], (person) => person.id);
    expect(replace('今天和Sam吃饭了, Samさんと会った, Mina가 왔다, ไปกับSamแล้ว')).toBe('今天和s吃饭了, sさんと会った, m가 왔다, ไปกับsแล้ว');
    expect(replace('הלכתי עם דוד ודוד חזר, אמרתי לדוד. ومحمد')).toBe('הלכתי עם d וd חזר, אמרתי לd. وh');
  });

  it('finds a name with an invisible mark inside it in the text', () => {
    const replace = peopleNameReplacer([{ id: 'a', name: 'Alexandra' }], () => 'Person 1');
    expect(replace('Saw Alexan\u00ADdra and Alexandra')).toBe('Saw Person 1 and Person 1');
  });

  it('keeps a one-letter name out of capitalized contractions', () => {
    const replace = peopleNameReplacer([{ id: 't', name: 'T' }, { id: 's', name: 'S' }], (person) => person.id);
    expect(replace("I DON'T KNOW, IT'S fine. T's car. S came.")).toBe("I DON'T KNOW, IT'S fine. t's car. s came.");
  });

  it('keeps a space between a label and a digit in any script', () => {
    const replace = peopleNameReplacer([{ id: 'f', name: '小明' }, { id: 'g', name: '민수' }], (person) => (person.id === 'f' ? 'Person 6' : 'Removed person 1'));
    expect(replace('小明3点来的, 민수2')).toBe('Person 6 3点来的, Removed person 1 2');
  });

  it('ignores invisible marks pasted into a saved name', () => {
    const replace = peopleNameReplacer([{ id: 'd', name: 'Dana Cohen‏' }], () => 'Person 1');
    expect(replace('Dana Cohen came. Cohen too.')).toBe('Person 1 came. Person 1 too.');
  });

  it('matches a spelling with or without its apostrophe', () => {
    const replace = peopleNameReplacer([{ id: 'o', name: "O'Brien", legacy_names: ['OBrien'] }, { id: 'n', name: 'Dangelo', legacy_names: ["D'Angelo"] }], (person) => person.id);
    expect(replace("OBrien called, then O'Brien and Obrien. D’Angelo and Dangelo.")).toBe('o called, then o and o. n and n.');
  });

  it('matches a one-letter name only as saved', () => {
    const replace = peopleNameReplacer([{ id: 't', name: 'T' }], () => 'Person 1');
    expect(replace("T helped, but I don't know t.")).toBe("Person 1 helped, but I don't know t.");
  });

  it('never takes a possessive or decoration as a name', () => {
    const replace = peopleNameReplacer([{ id: 's', name: 'Sam' }, { id: 'm', name: "Sam's mom" }, { id: 'j', name: 'Jess 💜' }, { id: 'k', name: 'Jordan smith' }], (person) => person.id);
    expect(replace("Sam's party was fun. Sam's mom came. Jess came over. Smith was rude.")).toBe("s's party was fun. m came. j came over. k was rude.");
  });

  it('protects ids and times inside text, and turns a person\'s id into their label', () => {
    const id = '3c1f0e2a-ed41-4c2b-9d3e-7f0a1b2c3d4e';
    const replace = peopleNameReplacer([{ id, name: 'Ed' }, { id: 'p-t', name: 'T' }], (person) => (person.id === id ? 'Person 1' : 'Person 2'), (person) => [person.id]);
    expect(replace(`day:aaaaaaaa-ed00-4000-8000-000000000001 at 2026-09-01T10:00:00+00:00 with ${id}, Ed and T`)).toBe('day:aaaaaaaa-ed00-4000-8000-000000000001 at 2026-09-01T10:00:00+00:00 with Person 1, Person 1 and Person 2');
  });

  it('returns text no name touched exactly as it was', () => {
    const replace = peopleNameReplacer([{ id: 's', name: 'Sam' }], () => 'Person 1');
    expect(replace('樂 and José')).toBe('樂 and José');
  });

  it('finds words of a longer name in scripts without capitals for names', () => {
    const replace = peopleNameReplacer([{ id: 'n', name: 'ნინო ბერიძე' }], () => 'Person 1');
    expect(replace('ნინო მოვიდა. ბერიძე წავიდა.')).toBe('Person 1 მოვიდა. Person 1 წავიდა.');
  });
});

describe('replacing names across languages', () => {
  it('finds the given name of a Chinese, Korean or Japanese name saved without a space', () => {
    const replace = peopleNameReplacer([{ id: 'k', name: '김민수' }, { id: 'c', name: '王小明' }, { id: 'j', name: '田中太郎' }], (person) => person.id);
    expect(replace('민수가 왔다. 我和小明吃饭. 田中さんと話した')).toBe('k가 왔다. 我和c吃饭. jさんと話した');
  });

  it('reads Hebrew and Arabic prefixes only before longer names, and never a lone alef', () => {
    const replace = peopleNameReplacer([{ id: 'h', name: 'حمد' }, { id: 'b', name: 'בר' }, { id: 'l', name: 'לי' }, { id: 'd', name: 'דוד' }], (person) => person.id);
    expect(replace('قابلت احمد اليوم ثم وحمد')).toBe('قابلت احمد اليوم ثم وh');
    expect(replace('כבר אמרתי לו, זה שלי, ודוד הגיע')).toBe('כבר אמרתי לו, זה שלי, וd הגיע');
  });

  it('never takes a word naming someone else, or a connector, as a name', () => {
    const replace = peopleNameReplacer([
      { id: 'c', name: "Chris' mom" }, { id: 'u', name: 'أم أحمد' }, { id: 'm', name: 'محمد بن سلمان' },
      { id: 'r', name: 'Maria do Carmo' }, { id: 'j', name: 'Jen und Tom' }, { id: 's', name: 'Sam or Sammy' },
    ], (person) => person.id);
    expect(replace("Chris came over. Chris' mom called.")).toBe('Chris came over. c called.');
    expect(replace('هل تريد شاي أم قهوة؟ بن عربي. أحمد هنا. سلمان أيضا')).toBe('هل تريد شاي أم قهوة؟ بن عربي. أحمد هنا. m أيضا');
    expect(replace('Do you know? Und dann. Or maybe. Carmo, Jen, Sammy.')).toBe('Do you know? Und dann. Or maybe. r, j, s.');
  });

  it('finds a Latin name joined to another script, and joins by capitals only in tags', () => {
    const replace = peopleNameReplacer([{ id: 's', name: 'Sam' }, { id: 'j', name: 'Jordan' }, { id: 'd', name: 'Donald' }, { id: 'a', name: 'Shawn Lee' }, { id: 'n', name: 'Ann' }], (person) => person.id);
    expect(replace('הלכתי עם Sam וSam חזר, אמרתי לJordan. Говорил с Samом. وSam')).toBe('הלכתי עם s וs חזר, אמרתי לj. Говорил с sом. وs');
    expect(replace("Grabbed McDonald's with DeShawn and JoAnn. #SamBirthday @mySam")).toBe("Grabbed McDonald's with DeShawn and JoAnn. #sBirthday @mys");
  });

  it('treats a feeling phrase in a script without spaces as a phrase', () => {
    const replace = peopleNameReplacer([{ id: 'c', name: '王 小明' }, { id: 'j', name: 'Jordan Smith' }], (person) => person.id);
    expect(replace('想念小明', { parts: 'phrase' })).toBe('想念c');
    expect(replace('Missing Jordan', { parts: 'phrase' })).toBe('Missing j');
    expect(replace('Jordan', { parts: 'phrase' })).toBe('Jordan');
  });
});

describe('replacing names: nicknames, titles and connectors', () => {
  it('counts a nickname in quotes as a name word', () => {
    const replace = peopleNameReplacer([{ id: 'c', name: "Christopher 'Chris' Jones" }, { id: 'r', name: 'Robert ‘Bobs’ Smith' }], (person) => person.id);
    expect(replace('Chris called. Jones too. Bobs waved.')).toBe('c called. c too. r waved.');
  });

  it('splits a Chinese, Korean or Japanese name only after a common surname, never into a title', () => {
    const replace = peopleNameReplacer([
      { id: 'w', name: '王医生' }, { id: 'z', name: '张老师' }, { id: 'e', name: '前男友' }, { id: 'g', name: '여자친구' }, { id: 'o', name: '어머니' },
      { id: 't', name: '田中翔' }, { id: 'x', name: '王小明（同事）' },
    ], (person) => person.id);
    expect(replace('我去看了医生，医生说没事。李老师也在。我和男友吵架了。친구랑 놀았다. 할머니 댁에 갔다. 王医生来了')).toBe('我去看了医生，医生说没事。李老师也在。我和男友吵架了。친구랑 놀았다. 할머니 댁에 갔다. w来了');
    expect(replace('田中さんと話した。我和王小明吃饭, 小明也来了')).toBe('tさんと話した。我和x吃饭, x也来了');
  });

  it('keeps a one-word feeling in any script, and finds a name inside a longer phrase', () => {
    const replace = peopleNameReplacer([{ id: 'k', name: '김기쁨' }, { id: 'y', name: '杨开心' }, { id: 'c', name: '王小明' }], (person) => person.id);
    expect(['기쁨', '开心', '想念小明'].map((word) => replace(word, { parts: 'phrase' }))).toEqual(['기쁨', '开心', '想念c']);
  });

  it('finds every name in a hashtag, after earlier names and with a fullwidth sign', () => {
    const replace = peopleNameReplacer([{ id: 'p', name: 'Sam Lee' }, { id: 't', name: 'Tom' }, { id: 'j', name: 'Jordan Smith' }], (person) => person.id);
    expect(replace('#SamLeeBirthday #JordanSmithWedding #SamAndTom ＃SamBirthday')).toBe('#ppBirthday #jjWedding #pAndt ＃pBirthday');
  });

  it('reads "or", "und" and "son of" as names only where they lead or are capitalized', () => {
    const replace = peopleNameReplacer([{ id: 'o', name: 'Or Levi' }, { id: 's', name: 'Sam or Sammy' }, { id: 'b', name: 'בן לוי' }, { id: 'd', name: 'דוד בן גוריון' }], (person) => person.id);
    expect(replace('Or came over, then Levi. Or maybe not.')).toBe('o came over, then o. o maybe not.');
    expect(replace('בן התקשר. יש לי בן אחד')).toBe('b התקשר. יש לי b אחד');
  });

  it('keeps "servant of" with the word after it', () => {
    const replace = peopleNameReplacer([{ id: 'a', name: 'عبد الله' }, { id: 'r', name: 'عبد الرحمن' }, { id: 'o', name: 'عبد الله العمري' }], (person) => person.id);
    expect(replace('إن شاء الله سأكون بخير. والله تعبت. بسم الله الرحمن الرحيم. عبد الله هنا')).toBe('إن شاء الله سأكون بخير. والله تعبت. بسم الله الرحمن الرحيم. a هنا');
    expect(replace('العمري هنا')).toBe('o هنا');
  });

  it('handles decoration, quotes and servant-of names wherever they stand', () => {
    const replace = peopleNameReplacer([
      { id: 'k', name: 'Alex Kim❤️' }, { id: 'h', name: '💚 عبد الله' }, { id: 'r', name: 'عبد الرحمن بن عبد الله' }, { id: 'u', name: '«أم أحمد»' },
      { id: 'd', name: '⚽ Son Heung-min' }, { id: 'q', name: '‘Chris Jones’' }, { id: 's', name: 'عبد الله بن سلمان' },
    ], (person) => person.id);
    expect(replace('Kim was sweet. Son scored. Jones called.')).toBe('k was sweet. d scored. q called.');
    expect(replace('إن شاء الله. والله تعبت. صديقي العزيز. هل تريد شاي أم قهوة؟ أحمد هنا. بن عربي. سلمان هنا')).toBe('إن شاء الله. والله تعبت. صديقي العزيز. هل تريد شاي أم قهوة؟ أحمد هنا. بن عربي. s هنا');
  });

  it('unwraps quoted nicknames beside separators, and trims both words of a servant-of name', () => {
    const replace = peopleNameReplacer([
      { id: 'c', name: "Christopher 'Chris', neighbor" }, { id: 'b', name: "Charles 'Chas'/'Charlie' Brown" }, { id: 'j', name: "'Jess'&Tom" },
      { id: 'm', name: 'محمد عبد الله، جاري' }, { id: 'e', name: 'سعيد عبد الله💚 العمري' }, { id: 'q', name: '«عبد الرحمن» الخالد' },
    ], (person) => person.id);
    expect(replace('Chris called. Chas and Charlie came. Jess and Tom too.')).toBe('c called. b and b came. j and j too.');
    const more = peopleNameReplacer([{ id: 'k', name: "Charles 'Chuck/Chas' Brown" }, { id: 'u', name: 'أم💚 أحمد' }, { id: 'a', name: 'أبو❤️ علي' }], (person) => person.id);
    expect(more('Chas called. Chuck too. أم أحمد اتصلت. أبو علي اتصل. هل تريد شاي أم قهوة؟ أحمد هنا')).toBe('k called. k too. u اتصلت. a اتصل. هل تريد شاي أم قهوة؟ أحمد هنا');
    expect(replace('عبد الله اتصل. محمد هنا. عبد الرحمن جاء. العمري هنا')).toBe('m or e اتصل. m هنا. q جاء. e هنا');
  });

  it('keeps both readings of a three-character name, and a leading quoted nickname', () => {
    const replace = peopleNameReplacer([{ id: 'j', name: '金子轩' }, { id: 'x', name: '許志明' }, { id: 'c', name: "'Chris' Jones" }, { id: 'g', name: '‘Gus’ Lee' }], (person) => person.id);
    expect(replace('子轩来了。志明也来了。Chris called. Gus called.')).toBe('j来了。x也来了。c called. g called.');
  });
});

describe('labels for people', () => {
  it('numbers people in the order they were added, and people since removed apart', () => {
    const labels = personLabels([{ id: 'b', created_at: '2026-02-01' }, { id: 'a', created_at: '2026-01-01' }], ['gone-2', 'a', 'gone-1', 'gone-2']);
    expect([...labels]).toEqual([['a', 'Person 1'], ['b', 'Person 2'], ['gone-1', 'Removed person 1'], ['gone-2', 'Removed person 2']]);
  });
});
