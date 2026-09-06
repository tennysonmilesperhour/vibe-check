import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const app = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Date.now();
const email = `vibecheck.release.qa.${stamp}@gmail.com`;
const password = `Vibe-${crypto.randomUUID()}-9!`;
let userId;
let deletedByProduct = false;

const check = (error, label) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Release QA" },
  });
  check(createError, "create QA user");
  userId = created.user.id;

  const { data: signedIn, error: signInError } = await app.auth.signInWithPassword({ email, password });
  check(signInError, "sign in");
  assert.equal(signedIn.user.id, userId);

  const { data: profile, error: profileError } = await app
    .from("profiles")
    .update({
      cosmic_profile: {
        birth_date: "1990-01-15",
        enabled_systems: ["numerology"],
        numerology: { life_path: 8 },
      },
    })
    .eq("id", userId)
    .select()
    .single();
  check(profileError, "update profile");
  assert.equal(profile.id, userId);

  const today = new Date();
  const checkIns = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    return {
      user_id: userId,
      date: date.toISOString().slice(0, 10),
      mood_score: 5 + (offset % 4),
      energy_level: 4 + (offset % 5),
      sleep_quality: 6 + (offset % 3),
      emotions: offset % 2 ? ["calm"] : ["hopeful"],
      activities: offset % 2 ? ["walk"] : ["rest"],
      gratitude: `Release check-in ${offset + 1}`,
    };
  });
  const { data: savedCheckIns, error: checkInError } = await app
    .from("daily_check_ins")
    .insert(checkIns)
    .select("id");
  check(checkInError, "create check-ins");
  assert.equal(savedCheckIns.length, 7);

  const { data: people, error: peopleError } = await app
    .from("people")
    .insert({ user_id: userId, name: "QA Companion", qualities: ["steady"] })
    .select("id")
    .single();
  check(peopleError, "create person");
  assert.ok(people.id);

  const { data: reading, error: readingError } = await app
    .from("readings")
    .insert({
      user_id: userId,
      date: checkIns[0].date,
      deck: "tarot",
      spread: "single",
      question: "What deserves attention?",
      cards: [{ name: "The Star", reversed: false }],
    })
    .select("id")
    .single();
  check(readingError, "create reading");
  assert.ok(reading.id);

  const functionCases = [
    ["invoke-llm", { prompt: "Return one grounded sentence." }],
    ["generate-cosmic-wisdom", { period_type: "daily", period_key: checkIns[0].date }],
    ["generate-daily-weather", { period_key: checkIns[0].date, resonance_summary: "Personal day 8." }],
  ];
  for (const [name, body] of functionCases) {
    const { data, error } = await app.functions.invoke(name, { body });
    check(error, `invoke ${name}`);
    assert.equal(data?.stub, true, `${name} should report the intentionally unconfigured AI provider`);
  }

  const { count, error: countError } = await app
    .from("daily_check_ins")
    .select("id", { count: "exact", head: true });
  check(countError, "read check-ins");
  assert.equal(count, 7);

  const { data: deletion, error: deleteError } = await app.functions.invoke("delete-account", { body: {} });
  check(deleteError, "delete account");
  assert.equal(deletion?.deleted, true);
  deletedByProduct = true;

  const { data: missingUser } = await admin.auth.admin.getUserById(userId);
  assert.equal(missingUser?.user ?? null, null);

  const { count: remainingRows, error: remainingError } = await admin
    .from("daily_check_ins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  check(remainingError, "verify cascaded deletion");
  assert.equal(remainingRows, 0);

  console.log(JSON.stringify({
    ok: true,
    authenticatedFlow: true,
    rlsCrud: true,
    seededCheckIns: 7,
    edgeFunctions: functionCases.map(([name]) => name),
    aiProviderConfigured: false,
    accountDeletion: true,
  }));
} finally {
  if (userId && !deletedByProduct) {
    await admin.auth.admin.deleteUser(userId);
  }
}
