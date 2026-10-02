// Deterministic people for the browser tests. Names, emails and events are
// invented. The test clock is fixed at NOW in America/Denver, so day keys
// below line up with what the app calls today.

export const TODAY = '2026-09-29';
export const NOW = '2026-09-29T20:15:00-06:00';
export const NOW_ISO = new Date(NOW).toISOString();

const JUNIPER = '6a1f3c2e-8d4b-4c1a-9e57-2b7d3f9a0c11';
const WREN = '9c2e7b1a-4f3d-4e8b-a6c5-1d0f2e3b4a55';
export const PEOPLE = {
  mara: 'b1e2c3d4-1111-4a11-8a11-000000000001',
  dad: 'b1e2c3d4-2222-4a22-8a22-000000000002',
  priya: 'b1e2c3d4-4444-4a44-8a44-000000000004',
  jules: 'b1e2c3d4-5555-4a55-8a55-000000000005',
};

// A small seeded generator, so every run builds the same record.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const addDays = (key, n) => { const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// Denver is on daylight time (-06:00) for the whole window the record covers.
const at = (date, hh, mm = 0) => new Date(`${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-06:00`).toISOString();
const clamp = (value) => Math.max(1, Math.min(10, Math.round(value)));

function authUser(id, email, name, createdAt) {
  return {
    id, aud: 'authenticated', role: 'authenticated', email, phone: '', email_confirmed_at: createdAt, confirmed_at: createdAt,
    last_sign_in_at: NOW_ISO, app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: name, email, email_verified: true, sub: id }, identities: [],
    created_at: createdAt, updated_at: NOW_ISO, is_anonymous: false,
  };
}

const EMPTY_TABLES = () => ({
  profiles: [], daily_check_ins: [], people: [], vibe_journal_entries: [], vibe_practice_sessions: [], vibe_report_reflections: [],
  vibe_preferences: [], vibe_checkin_drafts: [], boundary_alerts: [], healing_progress: [], readings: [], cosmic_wisdom: [],
});

/** Someone who signed up today and has kept nothing yet. */
export function newcomer() {
  const tables = EMPTY_TABLES();
  tables.profiles.push({ id: WREN, full_name: 'Wren', cosmic_profile: null, boundary_settings: null, people_migrated_at: null, created_at: NOW_ISO, updated_at: NOW_ISO });
  return { user: authUser(WREN, 'wren.new@example.com', 'Wren', NOW_ISO), tables };
}

/** Six weeks of check-ins, moments, people, practices and reports, with today not yet kept. */
export function established() {
  const random = seeded(20260929);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const chance = (p) => random() < p;
  const own = (row) => ({ user_id: JUNIPER, ...row });
  const tables = EMPTY_TABLES();

  tables.profiles.push({
    id: JUNIPER, full_name: 'Juniper Hale',
    cosmic_profile: { first_name: 'Juniper', birth_date: '1991-04-17', enabled_systems: ['astrology', 'numerology'], astrology: { sun_sign: 'Aries', sun_source: 'entered', moon_sign: 'Cancer' }, numerology: {} },
    boundary_settings: { mood_threshold: 4, consecutive_days: 3 }, people_migrated_at: '2026-08-01T02:00:00.000Z',
    created_at: '2026-08-10T02:10:00.000Z', updated_at: '2026-09-01T18:00:00.000Z',
  });

  tables.people = [
    { id: PEOPLE.mara, name: 'Mara', person_type: 'partner', qualities: ['Patient', 'Funny'], concerns: [], boundary_notes: 'Ask for an evening alone instead of going quiet.' },
    { id: PEOPLE.dad, name: 'Dad', person_type: 'family', qualities: ['Steady'], concerns: ['Questions about my career'], boundary_notes: 'Sunday calls, thirty minutes.' },
    { id: PEOPLE.priya, name: 'Priya', person_type: 'colleague', qualities: ['Sharp'], concerns: ['Moves deadlines without asking'], boundary_notes: 'No work replies after 8pm.' },
    { id: PEOPLE.jules, name: 'Jules', person_type: 'friend', qualities: ['Warm'], concerns: [], boundary_notes: '' },
  ].map((person, index) => own({
    linked_user_email: null, cosmic_snapshot: null, snapshot_updated_at: null, synergy_reading: null, synergy_generated_at: null, legacy_names: [],
    ...person, created_at: at(addDays(TODAY, -45 + index), 21), updated_at: at(addDays(TODAY, -45 + index), 21),
  }));

  const GOOD = ['Joyful', 'Grateful', 'Calm', 'Hopeful', 'Content', 'Proud'];
  const HARD = ['Anxious', 'Tired', 'Frustrated', 'Overwhelmed', 'Sad'];
  const ACTIVITIES = ['Exercise', 'Meditation', 'Journaling', 'Nature', 'Social', 'Creative work', 'Rest'];
  for (let ago = 42; ago >= 1; ago -= 1) {
    if ([5, 17, 30].includes(ago)) continue;
    const date = addDays(TODAY, -ago);
    const mood = clamp(6 + (random() - 0.5) * 5);
    const sleep = clamp(6 + (random() - 0.5) * 4);
    const stressed = mood <= 4 || chance(0.2);
    tables.daily_check_ins.push(own({
      id: `c0000000-0000-4000-8000-${String(ago).padStart(12, '0')}`, date,
      mood_score: mood, energy_level: clamp(mood * 0.6 + sleep * 0.3 + random()), sleep_quality: sleep,
      emotions: [pick(mood >= 6 ? GOOD : HARD), pick(mood >= 5 ? GOOD : HARD)].filter((item, index, all) => all.indexOf(item) === index),
      activities: ACTIVITIES.filter(() => chance(0.3)),
      high_moment: chance(0.4) ? { description: 'A slow walk by the river with Mara.', person_ids: [PEOPLE.mara], intensity: 6 } : null,
      low_moment: mood <= 5 && chance(0.6) ? { description: 'Priya moved the deadline again.', person_ids: [PEOPLE.priya], intensity: 6 } : null,
      gratitude: chance(0.3) ? 'Clean sheets.' : '', notes: chance(0.25) ? 'Too much coffee after two again.' : '',
      person_ids: [chance(0.4) && PEOPLE.mara, chance(0.25) && PEOPLE.priya].filter(Boolean),
      stress_context: stressed ? { state_ids: [pick(['on-edge', 'procrastination', 'shutdown'])], stress_score: clamp(10 - mood), body_cues: ['Tight shoulders'], alignment: pick(['aligned', 'mixed', 'not-aligned']) } : {},
      moon_phase: null, personal_day: null, created_at: at(date, 21, 10), updated_at: at(date, 21, 10),
    }));
  }

  const entry = (ago, fields) => {
    const date = addDays(TODAY, -ago);
    return own({
      id: `d0000000-0000-4000-8000-${String(ago).padStart(12, '0')}`, date, occurred_at: null, kind: 'reflection', notes: '', mood_score: null,
      emotions: [], activities: [], person_ids: [], stress_context: {}, interaction_feeling: null, boundary_respected: null, is_draft: false, is_demo: false,
      created_at: at(date, 19, 30), updated_at: at(date, 19, 30), ...fields,
    });
  };
  tables.vibe_journal_entries = [
    entry(2, { kind: 'interaction', notes: 'Told Priya I would get back to her on what is realistic, instead of saying yes.', mood_score: 5, emotions: ['Proud'], person_ids: [PEOPLE.priya], interaction_feeling: 'strained', boundary_respected: 'unsure' }),
    entry(3, { kind: 'interaction', notes: 'Mara sat with me on the porch and did not try to fix anything.', mood_score: 7, emotions: ['Calm'], person_ids: [PEOPLE.mara], interaction_feeling: 'supportive', boundary_respected: 'yes' }),
    entry(8, { notes: 'Noticed my jaw was clenched the whole commute. Unclenched it at every red light.', emotions: ['Anxious'] }),
    entry(12, { kind: 'interaction', notes: 'Coffee with Jules. I did not compare myself once.', mood_score: 8, emotions: ['Joyful'], person_ids: [PEOPLE.jules], interaction_feeling: 'supportive', boundary_respected: 'yes' }),
    entry(20, { kind: 'interaction', notes: 'Dad asked about work and I said I was not talking about it today. He let it go.', mood_score: 6, emotions: ['Hopeful'], person_ids: [PEOPLE.dad], interaction_feeling: 'mixed', boundary_respected: 'yes' }),
    entry(1, { notes: 'Something I want to come back to', is_draft: true }),
  ];

  const session = (ago, practice_id, state_id, fields) => {
    const date = addDays(TODAY, -ago);
    return own({
      id: `e0000000-0000-4000-8000-${String(ago).padStart(12, '0')}`, date, practice_id, state_id, status: 'completed', intention: '', before_notes: '', after_notes: '',
      outcome: null, alignment: null, source_pattern: null, source_entry_keys: [], is_demo: false, created_at: at(date, 18, 20), updated_at: at(date, 18, 20), ...fields,
    });
  };
  tables.vibe_practice_sessions = [
    session(2, 'space-before-response', 'anger', { outcome: 'More settled', after_notes: 'Drafted a reply and did not send it.', alignment: 'aligned' }),
    session(9, 'orient', 'on-edge', { outcome: 'Clearer', alignment: 'aligned' }),
    session(15, 'small-start', 'procrastination', { outcome: 'More able to begin', alignment: 'mixed' }),
  ];

  tables.vibe_report_reflections = [
    own({ id: 'f0000000-0000-4000-8000-000000000001', period_type: 'weekly', period_key: '2026-09-21', notes: 'I said yes too fast twice and asked for time once.', is_demo: false, created_at: at('2026-09-28', 9), updated_at: at('2026-09-28', 9) }),
  ];
  tables.vibe_preferences = [own({
    id: 'f1000000-0000-4000-8000-000000000001', created_at: '2026-08-10T03:00:00.000Z', updated_at: at(addDays(TODAY, -3), 21),
    values: { intention: 'Having time to decide before I answer.', personal_values: ['Honesty', 'Rest without guilt'], tracking: ['Relationships', 'Stress & body cues', 'Mood'], tracking_shapes_check_in: true, welcome_complete: true, week_start: 1 },
  })];
  tables.healing_progress = [
    own({ id: 'f2000000-0000-4000-8000-000000000001', category: 'devotions', title: 'Morning pages', description: 'Three pages before the phone.', progress_level: 60, reflection_notes: '', milestones: [], created_at: at('2026-08-20', 20), updated_at: at('2026-09-20', 20) }),
  ];

  return { user: authUser(JUNIPER, 'juniper.hale@example.com', 'Juniper Hale', '2026-08-10T02:10:00.000Z'), tables };
}
