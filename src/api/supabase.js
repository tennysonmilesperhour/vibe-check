import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the build is missing its Supabase env (the classic "Failed to fetch" cause). */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Fail loudly at startup: a silent client here means every query dies later.
  console.error('Supabase env missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (locally in .env.local; on Vercel in Project Settings -> Environment Variables, then redeploy).');
}

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/**
 * Whether requests go out signed in as this person. The client sends them
 * signed out when the session can't be renewed (after a long time offline it
 * waits up to a minute before trying again), and then reads come back empty
 * rather than failing.
 * @param {string | null | undefined} userId
 */
export async function signedInAs(userId) {
  if (!userId) return false;
  const { data } = await supabase.auth.getSession().catch(() => ({ data: null }));
  return data?.session?.user?.id === userId;
}
