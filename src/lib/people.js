// Person model helpers: matching, migration, and historical text linking.
// Replaces the old load-bearing substring match ("Mom" matched "Tom's mommy")
// with whole-word matching against names and legacy aliases.

/** @param {string} s */
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How an interaction felt, and whether a boundary was respected: the journal's choices. */
export const INTERACTION_FEELINGS = ['supportive', 'strained', 'unsafe', 'mixed', 'unsure'];
export const BOUNDARY_ANSWERS = ['yes', 'no', 'unsure'];

function aliasesOf(person) {
  return [person.name, ...(person.legacy_names || [])].filter(Boolean);
}

export function samePersonId(a, b) {
  return Boolean(a) && Boolean(b) && String(a).toLowerCase() === String(b).toLowerCase();
}

/** Picker ids from the day, high moment, and low moment, without duplicates. */
export function entryPeople(entry) {
  return [...new Set([...(entry.person_ids || []), ...(entry.high_moment?.person_ids || []), ...(entry.low_moment?.person_ids || [])])];
}

/** Picker search: name or alias contains the query. Empty query returns everyone. */
export function searchPeople(query, people) {
  const needle = (query || '').trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) => aliasesOf(person).some((alias) => alias.toLowerCase().includes(needle)));
}

/** Exact (case-insensitive) name or legacy-alias match. Returns the person or null. */
export function matchPersonByText(text, people) {
  if (!text) return null;
  const needle = text.trim().toLowerCase();
  for (const person of people) {
    if (aliasesOf(person).some((a) => a.toLowerCase() === needle)) return person;
  }
  return null;
}

/** Whole-word mention of a person (any alias) inside free text. */
export function mentionsPerson(text, person) {
  if (!text) return false;
  return aliasesOf(person).some((alias) => {
    // \b fails around punctuation-heavy names, so use non-word-char boundaries.
    const re = new RegExp(`(^|\\W)${escapeRegex(alias.toLowerCase())}($|\\W)`, 'i');
    return re.test(text.toLowerCase());
  });
}

/** Union-merge person drafts that share a lowercase name (migration helper). */
export function dedupePeopleDrafts(drafts) {
  const byName = new Map();
  for (const draft of drafts) {
    const key = draft.name.trim().toLowerCase();
    const prior = byName.get(key);
    if (!prior) {
      byName.set(key, { ...draft, legacy_names: [...(draft.legacy_names || [])] });
      continue;
    }
    byName.set(key, {
      ...prior,
      ...Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== undefined && v !== null && v !== '')),
      name: prior.name, // first spelling wins for display
      qualities: [...new Set([...(prior.qualities || []), ...(draft.qualities || [])])],
      concerns: [...new Set([...(prior.concerns || []), ...(draft.concerns || [])])],
      legacy_names: [...new Set([...(prior.legacy_names || []), ...(draft.legacy_names || [])])],
    });
  }
  return [...byName.values()];
}

/**
 * One-time, idempotent migration: Relationship + Connection -> Person.
 * Safe to call on every mount; bails fast once people exist or marker is set.
 */
export async function migratePeople({ Person, Relationship, Connection, auth }) {
  const me = await auth.me();
  if (me?.people_migrated_at) return { migrated: false };

  const existing = await Person.list();
  if (existing.length > 0) {
    await auth.updateMe({ people_migrated_at: new Date().toISOString() });
    return { migrated: false };
  }

  const [relationships, connections] = await Promise.all([
    Relationship.list().catch(() => []),
    Connection.list().catch(() => []),
  ]);

  const drafts = [
    ...relationships.map((r) => ({
      name: r.name,
      person_type: r.relationship_type || 'other',
      qualities: r.qualities || [],
      concerns: r.concerns || [],
      boundary_notes: r.boundary_notes || '',
      legacy_names: [],
    })),
    ...connections.map((c) => ({
      name: c.target_name || c.target_email,
      person_type: c.connection_type || 'friend',
      linked_user_email: c.target_email,
      cosmic_snapshot: c.target_cosmic_profile || null,
      snapshot_updated_at: c.updated_date || c.created_date,
      legacy_names: [],
    })),
  ].filter((d) => d.name);

  const merged = dedupePeopleDrafts(drafts);
  for (const draft of merged) {
    await Person.create(draft);
  }
  await auth.updateMe({ people_migrated_at: new Date().toISOString() });
  return { migrated: true, count: merged.length };
}

/**
 * True when this entry tagged the person with the picker, including people
 * recorded only on a high or low moment. Historical who_involved text is a
 * fallback only when the picker was never used on the entry.
 */
export function entryInvolvesPerson(entry, person) {
  if (!entry || !person?.id) return false;
  const ids = entryPeople(entry);
  if (ids.some((id) => samePersonId(id, person.id))) return true;
  if (ids.length) return false;
  const texts = [entry.high_moment?.who_involved, entry.low_moment?.who_involved];
  return texts.some((text) => text && mentionsPerson(text, person));
}

/** Historical mood stats for a person from check-ins (picker tags, including nested moments). */
export function personCheckInStats(person, checkIns) {
  const involved = checkIns.filter((entry) => entryInvolvesPerson(entry, person));
  if (involved.length === 0) return { mentions: 0, avgMood: null, lastMention: null };
  const scored = involved.filter((entry) => entry.mood_score != null);
  const avgMood = scored.length
    ? scored.reduce((a, e) => a + Number(e.mood_score), 0) / scored.length
    : null;
  const lastMention = involved.map((e) => e.date).filter(Boolean).sort().at(-1) || null;
  return { mentions: involved.length, avgMood: avgMood == null ? null : Math.round(avgMood * 10) / 10, lastMention };
}

export function personMentionCount(person, entries) {
  return entries.filter((entry) => entryInvolvesPerson(entry, person)).length;
}

/** Other people tagged in the same check-in or journal moment via the picker. */
export function peopleRecordedTogether(person, people, entries) {
  const shared = new Map();
  for (const entry of entries) {
    if (!entryInvolvesPerson(entry, person)) continue;
    for (const id of entryPeople(entry)) {
      if (samePersonId(id, person.id)) continue;
      const key = String(id).toLowerCase();
      shared.set(key, (shared.get(key) || 0) + 1);
    }
  }
  return people
    .filter((other) => !samePersonId(other.id, person.id) && shared.has(String(other.id).toLowerCase()))
    .map((other) => ({ person: other, shared: shared.get(String(other.id).toLowerCase()) }))
    .sort((a, b) => b.shared - a.shared || a.person.name.localeCompare(b.person.name));
}

function companionScore(a, b, entries) {
  return entries.filter((entry) => entryInvolvesPerson(entry, a) && entryInvolvesPerson(entry, b)).length;
}

/** Frequent people first so the inner orbit reflects tracking proximity. */
export function orderPeopleForOrbit(people, entries) {
  const scored = people.map((person) => ({ person, mentions: personMentionCount(person, entries) }));
  scored.sort((a, b) => b.mentions - a.mentions || a.person.name.localeCompare(b.person.name));
  return scored.map((row) => row.person);
}

/** Sit people who were tagged together nearer each other on a ring. */
export function arrangeOrbitRing(people, entries) {
  if (people.length <= 2) return [...people];
  const remaining = [...people];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    remaining.sort((a, b) => companionScore(last, b, entries) - companionScore(last, a, entries) || a.name.localeCompare(b.name));
    ordered.push(remaining.shift());
  }
  return ordered;
}

/**
 * People in the order they were added, the order "Person 1", "Person 2" and
 * so on follow wherever names are replaced with labels.
 * @param {any[]} people
 */
export function peopleInAddedOrder(people) {
  const added = (/** @type {any} */ person) => (typeof person?.created_at === 'string' ? person.created_at : '');
  return people.filter((person) => person?.id).sort((a, b) => added(a).localeCompare(added(b)) || String(a.id).localeCompare(String(b.id)));
}

/**
 * Labels for people in a shared record: "Person 1", "Person 2" and so on in
 * the order people were added, and "Removed person 1" and so on for ids
 * still on entries whose person is gone, so the two never collide. Numbers
 * stay the same from one summary or export to the next unless someone added
 * earlier is removed.
 * @param {any[]} people @param {Iterable<string>} [ids] ids that appear on entries
 * @returns {Map<string, string>}
 */
export function personLabels(people, ids = []) {
  const labels = new Map(peopleInAddedOrder(people).map((person, i) => [person.id, `Person ${i + 1}`]));
  [...new Set(ids)].filter((id) => id && !labels.has(id)).sort().forEach((id, i) => labels.set(id, `Removed person ${i + 1}`));
  return labels;
}

// Names in these scripts are usually written without spaces around them
// (Chinese, Japanese, Thai, and Korean, where particles attach to names), so
// they are matched inside longer runs of letters too.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
// Words in a saved name that are never a name on their own: titles and
// small linking words ("Sam from work").
const NEVER_NAMES = new Set(['mr', 'mrs', 'ms', 'mx', 'dr', 'miss', 'sir', 'prof', 'my', 'the', 'and', 'of', 'from', 'at', 'in', 'with', 'for', 'to', 'on', 'by']);
// "son of" and "daughter of" inside a name (דוד בן גוריון, محمد بن سلمان):
// a name on their own only as its first word (בן לוי, Ben Levi).
const CONNECTORS = new Set(['בן', 'בת', 'بن', 'ابن', 'بنت']);
// A saved name that starts with "mother of" or "father of" (أم أحمد) names
// someone through their child: only the whole of it is matched.
const KUNYA = new Set(['أم', 'ام', 'أبو', 'ابو']);
// "Servant of" (عبد) makes one given name with the word after it (عبد الله).
const SERVANT_OF = 'عبد';
// Family, role and place words ("Mike Work", "Sarah From Yoga"): a name
// on their own only as the first word of a saved name ("Son Heung-min").
const ROLE_WORDS = new Set([
  'aunt', 'auntie', 'uncle', 'grandma', 'grandpa', 'nana', 'papa', 'mom', 'mum', 'dad', 'brother', 'sister', 'son', 'daughter', 'wife',
  'husband', 'partner', 'boyfriend', 'girlfriend', 'cousin', 'niece', 'nephew', 'baby', 'ex', 'best', 'old', 'new', 'little', 'big',
  'friend', 'boss', 'coworker', 'colleague', 'neighbor', 'neighbour', 'roommate', 'landlord', 'therapist', 'doctor', 'teacher', 'coach', 'manager',
  'work', 'school', 'gym', 'home', 'office', 'team', 'class', 'church', 'club', 'yoga', 'cell', 'mobile',
]);
// The particles inside names ("de la Cruz"): a name when capitalized
// ("Al Green", "Minh Le", "Van Morrison").
const PARTICLES = new Set(['de', 'da', 'di', 'do', 'dos', 'das', 'del', 'della', 'la', 'le', 'van', 'von', 'der', 'den', 'du', 'bin', 'al', 'el', 'or', 'und', 'et', 'ou']);
// A Chinese, Korean or Japanese name saved without a space is split only
// after a common surname, and never into a title or a family or role word
// (王医生, 张老师, 여자친구), so other doctors and friends keep their words.
const CHINESE_SURNAMES = new Set([...'王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤張劉陳楊黃趙吳孫馬鄭謝韓馮鄧蕭葉蘇呂盧鍾譚陸賈閻龍賀顧龔萬錢湯許羅蔣鄒韋嚴範']);
const COMPOUND_SURNAMES = new Set(['欧阳', '歐陽', '司马', '司馬', '诸葛', '諸葛', '上官', '皇甫', '东方', '東方', '南宫', '南宮', '夏侯', '慕容', '令狐', '公孙', '公孫', '尉迟', '尉遲', '남궁', '황보', '제갈', '선우', '독고', '사공', '서문']);
const JAPANESE_SURNAMES = new Set(['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '山口', '松本', '井上', '木村', '清水', '山崎', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川', '前田', '岡田', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本', '斉藤', '福田', '太田', '西村', '藤井', '金子', '岡本', '藤原', '中野', '三浦', '原田', '中川', '松田', '竹内', '小野', '田村', '中山', '和田', '石田', '森田', '上田', '内田', '柴田', '酒井', '宮崎', '横山', '高木', '安藤', '宮本', '大野', '小島', '谷口', '今井', '工藤', '高田', '増田', '丸山', '杉山', '村田', '大塚', '新井', '小山', '平野', '野口', '武田', '松井', '千葉', '岩崎', '木下', '佐野', '野村', '松尾', '菊地', '杉本', '古川', '大西', '島田', '水野', '桜井', '高野', '吉川', '山内', '西田', '飯田', '菊池', '西川', '北村', '安田', '川口', '平田', '中田', '服部', '岩田', '土屋', '本田', '樋口', '秋山', '田口', '永井', '山中', '中西', '吉村', '川上', '石原', '大橋']);
const KOREAN_SURNAMES = new Set([...'김이박최정강조윤장임한오서신권황안송류유전홍고문양손배백허남심노하곽성차주우구민진나지엄채원천방공현함변염추도소석선설마길연위표명기반왕금옥육인맹']);
const CJK_ROLE_WORDS = new Set(['医生', '醫生', '老师', '老師', '先生', '女士', '小姐', '阿姨', '叔叔', '同学', '同學', '同事', '老板', '老闆', '经理', '經理', '男友', '女友', '朋友', '妈妈', '媽媽', '爸爸', '哥哥', '姐姐', '弟弟', '妹妹', '太太', '夫人', '律师', '律師', '教授', '医师', '醫師', '护士', '護士', '师傅', '師傅', '先輩', '後輩', '部長', '課長', '社長', '선생', '친구', '엄마', '아빠', '언니', '오빠', '누나', '형님', '사장', '부장', '과장', '대리', '선배', '후배', '여친', '남친']);
// Letters that attach to the front of a Hebrew or Arabic word ("and", "to",
// "from", and the Arabic article ال), as in ודוד, "and David". Checked only
// for names of three letters or more, where they cannot make another word.
const ATTACHED = {
  Hebrew: /(?:^|[^\p{L}\p{M}])[ובכלמש]{1,3}$/u,
  Arabic: /(?:^|[^\p{L}\p{M}])(?:[وفبلك]{0,2}ال|[وفبلك]{1,2})$/u,
};
// The script of a letter, so a letter of another script ends a word: Sam
// stands on its own in 今天和Sam吃饭, וSam or Samом.
const SCRIPTS = ['Latin', 'Cyrillic', 'Greek', 'Armenian', 'Georgian', 'Hebrew', 'Arabic', 'Devanagari', 'Bengali', 'Gurmukhi', 'Gujarati',
  'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Sinhala', 'Thai', 'Lao', 'Khmer', 'Myanmar', 'Ethiopic', 'Han', 'Hiragana', 'Katakana', 'Hangul']
  .map((name) => /** @type {[string, RegExp]} */ ([name, new RegExp(`\\p{Script=${name}}`, 'u')]));
const scriptOf = (/** @type {string} */ ch) => SCRIPTS.find(([, test]) => test.test(ch))?.[0] || '';
// Scripts in which names are usually written with a capital.
const CAPITALIZED = /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Armenian}]/u;
// Invisible marks that come along when a name is pasted: zero-width space,
// direction marks and embeddings, and the byte order mark. Joiners stay, as
// some scripts need them.
const INVISIBLE = /[\u00AD\u061C\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
// Ids and timestamps inside text are never read as names; a person's id
// becomes their label as a whole.
const MACHINE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/gi;
// Decoration around a saved name, such as "Jess 💜", and around each of its
// words ("Kim❤️").
const DECORATION = /^[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D\s]+|[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D\s]+$/gu;
const EDGES = /^[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D]+|[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D]+$/gu;
// What separates the words, couples and aliases of a saved name ("Jen&Tom",
// "Sam/Samuel", "Alex, Lexi"), commas of other scripts included.
const NAME_BREAK = /[\s/&+|,،、，;；]+/u;
// A single word in quotes inside a saved name: a nickname.
const QUOTED_WORD = /(^|[\s/&+|,،、，;；])['‘’"“”]([^'‘’"“”\s]+)['‘’"“”](?=[\s/&+|,،、，;；]|$)/gu;
// "Sam's" in "Sam's mom" names someone else.
const POSSESSIVE = /['’ʼ]s$|s['’ʼ]$/iu;
const APOSTROPHE = /['’ʼ]/;
const DIGIT = /\p{N}/u;
// Letters of the same script, and the marks that combine with them, carry
// a word on; an apostrophe, a digit, punctuation, a space or a letter of
// another script ends it.
const WORD = /[\p{L}\p{M}]/u;
const MARK = /\p{M}/u;
const continuesWord = (/** @type {string} */ ch, /** @type {string} */ neighbour) => {
  if (!ch || !WORD.test(ch) || APOSTROPHE.test(ch)) return false;
  return MARK.test(ch) || scriptOf(ch) === scriptOf(neighbour);
};
const hasCase = (/** @type {string} */ ch) => ch.toLowerCase() !== ch.toUpperCase();
const isUpper = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toUpperCase();
const isLower = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toLowerCase();
// Comparisons that ignore letter case, including Turkish dotted and dotless i.
const fold = (/** @type {string} */ text) => text.toLowerCase().replace(/ı/g, 'i').replace(/\u0307/g, '').replace(/['’ʼ]/g, '');

/** @param {unknown} value */
const cleanName = (value) => (typeof value === 'string' ? value.normalize('NFC').replace(INVISIBLE, '').trim() : '');
const withoutNote = (/** @type {string} */ name) => name.replace(/\s*[(（][^)）]*[)）]\s*$/u, '').trim();
// Any apostrophe or none, any run of spaces, and any form of i stand for
// each other.
const namePattern = (/** @type {string} */ name) => escapeRegex(name)
  .replace(/['’ʼ]/g, "['’ʼ]?").replace(/\s+/g, '\\s+').replace(/[iIıİ]/g, '[iIıİ]');

/** The whole character before an index, or ''. @param {string} text @param {number} index */
function charBefore(text, index) {
  if (index <= 0) return '';
  const low = text.charCodeAt(index - 1);
  return index > 1 && low >= 0xdc00 && low <= 0xdfff ? text.slice(index - 2, index) : text[index - 1];
}

/**
 * Whether a match sits inside a hashtag or handle (#SamBirthday), where the
 * capitals show where a joined name starts and ends.
 * @param {string} text @param {number} index
 */
function inTag(text, index) {
  let at = index;
  // Placeholders of names already found in the same tag count as letters.
  while (at > 0 && /[\p{L}\p{M}\p{N}_\uE000-\uE7FF]/u.test(charBefore(text, at))) at -= charBefore(text, at).length;
  return at > 0 && /[#@＃＠]/.test(text[at - 1]);
}

/** The whole character at an index, or ''. @param {string} text @param {number} index */
const charAt = (text, index) => (index < text.length ? String.fromCodePoint(/** @type {number} */ (text.codePointAt(index))) : '');

/**
 * The given name, and the surname where it is long enough to stand alone,
 * of a Chinese, Korean or Japanese name saved without a space.
 * @param {string} name
 * @returns {string[]}
 */
function cjkNameParts(name) {
  if (!/^(?:\p{Script=Han}{3,4}|\p{Script=Hangul}{3,4})$/u.test(name)) return [];
  const chars = [...name];
  const head = chars.slice(0, 2).join('');
  const parts = [];
  if (COMPOUND_SURNAMES.has(head) || JAPANESE_SURNAMES.has(head)) {
    parts.push(head);
    if (chars.length === 4) parts.push(chars.slice(2).join(''));
  }
  // Both readings of a three-character name stay: 金子轩 is 金 子轩 as well.
  if (chars.length === 3 && (CHINESE_SURNAMES.has(chars[0]) || KOREAN_SURNAMES.has(chars[0]))) parts.push(chars.slice(1).join(''));
  return parts.filter((part) => !CJK_ROLE_WORDS.has(part));
}

/**
 * Replaces people's names in free text with labels. For each person it
 * matches, as whole words:
 * - the saved name and earlier names, in any letter case, with or without a
 *   trailing note in brackets ("Jordan (work)");
 * - in free text, each word of a longer name on its own ("Jordan", "Smith")
 *   when it starts with a capital, as names usually are;
 * - extra exact strings such as ids.
 * In scripts written without spaces, names match inside longer runs of
 * letters. A name two people share gets both labels, and a whole saved name
 * outranks the same word inside a longer name. Names of people no longer
 * saved, and names spelled another way, cannot be known and stay.
 * @param {any[]} people
 * @param {(person: any) => string} labelOf
 * @param {(person: any) => unknown[]} [extra]
 * @returns {(text: string, options?: { parts?: boolean | 'phrase' }) => string}
 *   parts: false matches whole saved names only; 'phrase' allows words of a
 *   longer name when the text runs to several words, as a feeling phrase may.
 */
export function peopleNameReplacer(people, labelOf, extra = () => []) {
  /** @type {Map<string, string>} */
  const exactIds = new Map();
  // Spellings that differ only in case or apostrophes share one rule.
  /** @type {Map<string, { spellings: Set<string>, whole: Set<string>, part: Set<string> }>} */
  const variants = new Map();
  const add = (/** @type {string} */ name, /** @type {string} */ label, /** @type {boolean} */ whole) => {
    if (!name || !label) return;
    const key = fold(name).replace(/\s+/g, ' ');
    const found = variants.get(key) || { spellings: new Set(), whole: new Set(), part: new Set() };
    found.spellings.add(name);
    (whole ? found.whole : found.part).add(label);
    variants.set(key, found);
  };
  for (const person of people) {
    if (!person) continue;
    const label = labelOf(person);
    const saved = [person.name, ...(Array.isArray(person.legacy_names) ? person.legacy_names : [])].map(cleanName).filter(Boolean);
    for (const name of saved) {
      // A nickname in quotes ("Christopher 'Chris' Jones", "'Chris' Jones")
      // loses its quotes first, so trimming decoration cannot split them.
      const bare = withoutNote(name).replace(QUOTED_WORD, '$1$2').replace(DECORATION, '');
      for (const whole of [name, bare].filter(Boolean)) {
        add(whole, label, true);
        // "张 伟" is written 张伟 in running text.
        if (UNSPACED.test(whole) && /\s/.test(whole)) add(whole.replace(/\s+/g, ''), label, true);
      }
      for (const part of cjkNameParts(bare)) add(part, label, false);
      // Couples and aliases are often saved as "Jen&Tom" or "Sam/Samuel".
      const raw = bare.split(NAME_BREAK).filter(Boolean);
      const trimmed = raw.map((piece) => piece.replace(EDGES, ''));
      if (raw.length < 2) continue;
      // A decorated "mother of" name (أم💚 أحمد) is matched whole as written.
      if (KUNYA.has(trimmed[0])) { add(trimmed.filter(Boolean).join(' '), label, true); continue; }
      // "Servant of" (عبد) and the word after it make one given name, wherever
      // it stands (عبد الرحمن بن عبد الله).
      /** @type {{ piece: string, servant?: string }[]} */
      const pieces = [];
      for (let i = 0; i < raw.length; i += 1) {
        if (trimmed[i] === SERVANT_OF && trimmed[i + 1]) { pieces.push({ piece: raw[i], servant: `${SERVANT_OF} ${trimmed[i + 1]}` }); i += 1; }
        else pieces.push({ piece: raw[i] });
      }
      pieces.forEach(({ piece, servant }, position) => {
        if (servant) { add(servant, label, false); return; }
        // "Sam's" in "Sam's mom", or "Chris'" in "Chris' mom", names someone else.
        if (POSSESSIVE.test(piece.replace(/[^\p{L}\p{M}\p{N}'’ʼ]+$/u, ''))) return;
        const word = piece.replace(EDGES, '');
        const lower = word.toLowerCase();
        if ((word.match(/\p{L}/gu) || []).length < 2 || NEVER_NAMES.has(lower)) return;
        if (PARTICLES.has(lower) && word === lower) return;
        if ((ROLE_WORDS.has(lower) || CONNECTORS.has(word)) && (position > 0 || word === lower && hasCase(word.charAt(0)))) return;
        add(word, label, false);
      });
    }
    for (const value of extra(person)) {
      const exact = cleanName(value);
      if (exact.match(MACHINE)?.[0] === exact) exactIds.set(exact.toLowerCase(), label);
      else add(exact, label, true);
    }
  }

  // Each match becomes a placeholder of private-use characters, which no
  // name contains, so no label is matched again by a later, shorter name.
  // A placeholder holds its index in two private-use characters.
  const SPAN = 0x700;
  const placeholder = (/** @type {number} */ index) => `\uE000${String.fromCharCode(0xE100 + Math.floor(index / SPAN), 0xE100 + (index % SPAN))}\uE001`;
  /** @type {string[]} */
  const tokens = [];
  const tokenFor = (/** @type {string} */ value) => placeholder(tokens.push(value) - 1);
  const longest = (/** @type {Set<string>} */ spellings) => [...spellings].sort((a, b) => b.length - a.length)[0];
  const rules = [...variants].sort(([, a], [, b]) => longest(b.spellings).length - longest(a.spellings).length).map(([key, { spellings, whole, part }]) => {
    const name = longest(spellings);
    // A one-letter name ("T") matches only as saved, so the t in "don't" stays.
    const exactCase = (name.match(/\p{L}/gu) || []).length < 2;
    const attached = ATTACHED[scriptOf(name)];
    const prefixed = attached && (name.match(/\p{L}/gu) || []).length >= 3 ? attached : null;
    const owners = whole.size ? whole : part;
    const token = tokenFor([...owners].join(' or '));
    const unspaced = UNSPACED.test(name);
    const isPart = !whole.size;
    const hint = fold(name.split(/\s+/)[0]);
    const pattern = new RegExp([...spellings].sort((a, b) => b.length - a.length).map(namePattern).join('|'), 'giu');
    return { isPart, hint, key, apply: (/** @type {string} */ text) => text.replace(pattern, (match, offset) => {
        if (exactCase && !spellings.has(match)) return match;
        const first = charAt(match, 0);
        // A word of a longer name counts only when it starts with a capital,
        // in scripts where names are written that way.
        if (isPart && CAPITALIZED.test(first) && !isUpper(first)) return match;
        const before = charBefore(text, offset);
        const after = charAt(text, offset + match.length);
        if (!unspaced) {
          const last = charBefore(match, match.length);
          // A name joined to a word, as in #SamBirthday, still counts when
          // the capitals show where it starts and ends; so does a Hebrew or
          // Arabic name after the letters that attach to the front of words.
          const tag = inTag(text, offset);
          const leftOk = !continuesWord(before, first) || (tag && isLower(before) && isUpper(first)) || Boolean(prefixed?.test(text.slice(Math.max(0, offset - 8), offset)));
          const rightOk = !continuesWord(after, last) || (tag && isLower(last) && isUpper(after));
          if (!leftOk || !rightOk) return match;
          // In DON'T or IT'S, the letter after the apostrophe is not a name.
          if (exactCase && APOSTROPHE.test(before) && continuesWord(charBefore(text, offset - before.length), first)) return match;
        }
        // "Sam2" reads "Person 1 2", not "Person 12".
        return `${DIGIT.test(before) ? ' ' : ''}${token}${DIGIT.test(after) ? ' ' : ''}`;
      }) };
  });
  const fixedTokens = tokens.length;
  const restore = (/** @type {string} */ text, /** @type {string[]} */ kept) => text.replace(/\uE000([\uE100-\uE7FF])([\uE100-\uE7FF])\uE001/g, (match, high, low) => {
    const index = (high.charCodeAt(0) - 0xE100) * SPAN + (low.charCodeAt(0) - 0xE100);
    return (index < fixedTokens ? tokens[index] : kept[index - fixedTokens]) ?? match;
  });
  return (text, { parts = true } = {}) => {
    const original = String(text ?? '');
    const useParts = Boolean(parts);
    // In a feeling phrase, a word of a longer name that is the whole phrase
    // ("Low", 开心) stays a feeling.
    const wholeText = parts === 'phrase' ? fold(original.normalize('NFC').trim()).replace(/\s+/g, ' ') : null;
    // Invisible marks inside a name in the text, as in a pasted copy, do not
    // hide it.
    const normalized = original.normalize('NFC').replace(INVISIBLE, '');
    // Ids and timestamps are set aside first: a person's id becomes their
    // label, and any other is kept exactly as it was.
    /** @type {string[]} */
    const kept = [];
    let labelled = false;
    let current = normalized.replace(MACHINE, (match) => {
      const label = exactIds.get(match.toLowerCase());
      if (label) labelled = true;
      return placeholder(fixedTokens + kept.push(label ?? match) - 1);
    });
    const setAside = current;
    // A rule runs only where its first word appears at all.
    let folded = fold(current);
    for (const rule of rules) {
      if ((rule.isPart && (!useParts || rule.key === wholeText)) || !folded.includes(rule.hint)) continue;
      const next = rule.apply(current);
      if (next !== current) { current = next; folded = fold(current); }
    }
    return current !== setAside || labelled ? restore(current, kept) : original;
  };
}
