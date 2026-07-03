#!/usr/bin/env node
// One-time data migration: Base44 -> Supabase.
//
// 1. In the OLD app: Settings -> Export full history (unencrypted JSON).
// 2. Sign up in the NEW app so your auth user exists.
// 3. Run:
//    SUPABASE_URL=https://<ref>.supabase.co \
//    SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//    TARGET_EMAIL=you@example.com \
//    node scripts/import-base44-export.mjs path/to/vibe-check-export-YYYY-MM-DD.json
//
// Idempotent-ish: check-ins upsert on (user_id, date); alerts are skipped if
// any already exist. Run it once; rerunning will not duplicate check-ins.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [, , exportPath] = process.argv;
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_EMAIL } = process.env;

if (!exportPath || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TARGET_EMAIL) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_EMAIL=... node scripts/import-base44-export.mjs export.json');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const raw = JSON.parse(readFileSync(exportPath, 'utf8'));
if (raw.v === 1 && raw.data) {
  console.error('This export is encrypted. Export again without the password toggle, or decrypt first.');
  process.exit(1);
}

const { data: users, error: userErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (userErr) throw userErr;
const user = users.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
if (!user) {
  console.error(`No auth user with email ${TARGET_EMAIL}. Sign up in the new app first.`);
  process.exit(1);
}
console.log(`Importing into user ${user.id} (${user.email})`);

// profile (cosmic profile + settings ride along in newer exports)
if (raw.cosmic_profile) {
  const { error } = await supabase.from('profiles').upsert({ id: user.id, cosmic_profile: raw.cosmic_profile });
  if (error) throw error;
  console.log('cosmic_profile imported');
}

// check-ins
const checkIns = (raw.check_ins || []).map((c) => ({
  user_id: user.id,
  date: c.date,
  mood_score: c.mood_score ?? null,
  energy_level: c.energy_level ?? null,
  sleep_quality: c.sleep_quality ?? null,
  emotions: c.emotions || [],
  activities: c.activities || [],
  high_moment: c.high_moment || null,
  low_moment: c.low_moment || null,
  gratitude: c.gratitude || null,
  notes: c.notes || null,
  moon_phase: c.moon_phase || null,
  personal_day: c.personal_day ?? null,
})).filter((c) => c.date);

for (let i = 0; i < checkIns.length; i += 100) {
  const batch = checkIns.slice(i, i + 100);
  const { error } = await supabase.from('daily_check_ins').upsert(batch, { onConflict: 'user_id,date' });
  if (error) throw error;
}
console.log(`${checkIns.length} check-ins imported`);

// alerts (skip when any exist, to keep reruns clean)
const { count } = await supabase.from('boundary_alerts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
if ((count ?? 0) === 0 && raw.alerts?.length) {
  const alerts = raw.alerts.map((a) => ({
    user_id: user.id,
    alert_type: a.alert_type || 'low_mood',
    date: a.date || null,
    severity: a.severity || null,
    message: a.message || null,
    is_acknowledged: !!a.is_acknowledged,
  }));
  const { error } = await supabase.from('boundary_alerts').insert(alerts);
  if (error) throw error;
  console.log(`${alerts.length} alerts imported`);
}

console.log('Done. Old person mentions live in check-in text; the app re-links them as you add People.');
