import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.REVIEWER_EMAIL;
const password = process.env.REVIEWER_PASSWORD;

if (!url || !serviceRoleKey || !email || !password) {
  throw new Error("Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVIEWER_EMAIL, and REVIEWER_PASSWORD.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let page = 1;
let user;
while (!user) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email === email);
  if (user || data.users.length < 1000) break;
  page += 1;
}

if (user) {
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: "App Review" },
  });
  if (error) throw error;
  user = data.user;
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "App Review" },
  });
  if (error) throw error;
  user = data.user;
}

const userId = user.id;
const cosmicProfile = {
  birth_date: "1990-01-15",
  enabled_systems: ["numerology", "tarot_archetype"],
  numerology: { life_path: 8, personal_year: 7 },
  tarot_archetype: { birth_card: "8 – Strength" },
};

const { error: profileError } = await admin.from("profiles").upsert({
  id: userId,
  full_name: "App Review",
  cosmic_profile: cosmicProfile,
});
if (profileError) throw profileError;

const today = new Date();
const checkIns = Array.from({ length: 14 }, (_, offset) => {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
  return {
    user_id: userId,
    date: date.toISOString().slice(0, 10),
    mood_score: [8, 7, 6, 8, 5, 7, 9][offset % 7],
    energy_level: [7, 6, 5, 8, 4, 7, 8][offset % 7],
    sleep_quality: [8, 7, 6, 7, 5, 8, 7][offset % 7],
    emotions: offset % 3 === 0 ? ["hopeful", "calm"] : offset % 3 === 1 ? ["tender"] : ["curious"],
    activities: offset % 2 === 0 ? ["Nature", "Movement"] : ["Rest", "Friends"],
    gratitude: ["A long walk at dusk", "A thoughtful conversation", "Quiet time to reset"][offset % 3],
    notes: offset === 0 ? "A seeded entry for App Review." : null,
  };
});
const { error: checkInError } = await admin
  .from("daily_check_ins")
  .upsert(checkIns, { onConflict: "user_id,date" });
if (checkInError) throw checkInError;

await admin.from("people").delete().eq("user_id", userId);
const { error: peopleError } = await admin.from("people").insert([
  { user_id: userId, name: "Maya", person_type: "friend", qualities: ["grounding", "honest"] },
  { user_id: userId, name: "Jonah", person_type: "family", qualities: ["warm", "playful"] },
]);
if (peopleError) throw peopleError;

await admin.from("readings").delete().eq("user_id", userId);
const { error: readingError } = await admin.from("readings").insert({
  user_id: userId,
  date: checkIns[0].date,
  deck: "tarot",
  spread: "single",
  question: "What deserves my attention this week?",
  cards: [{ name: "The Star", reversed: false }],
  interpretation: "Let hope become a practical choice: protect one small source of renewal this week.",
});
if (readingError) throw readingError;

const { count, error: countError } = await admin
  .from("daily_check_ins")
  .select("id", { count: "exact", head: true })
  .eq("user_id", userId);
if (countError) throw countError;
assert.ok(count >= 14);

console.log(JSON.stringify({ ok: true, email, checkIns: count, people: 2, readings: 1 }));
