// Compatibility facade: the app was written against the Base44 client shape
// (base44.auth.me / updateMe / deleteAccount, base44.entities.X). This keeps
// that surface on top of Supabase so call sites did not have to change.
import { supabase } from './supabase';
import entities from './entities';
import { isTransientAuthError } from '../lib/auth-session';

async function me() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && isTransientAuthError(authError)) {
    throw Object.assign(new Error('Could not reach your account just now.'), { status: 0, transient: true });
  }
  if (authError || !authData?.user) throw Object.assign(new Error('Not signed in'), { status: 401 });
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();
  // Never hand back an empty profile because the request failed: a caller
  // could save that emptiness over the real one.
  if (profileError) throw Object.assign(new Error('Could not load your profile just now.'), { status: 0, transient: true });
  return {
    id: authData.user.id,
    email: authData.user.email,
    full_name: profile?.full_name || authData.user.user_metadata?.full_name || null,
    cosmic_profile: profile?.cosmic_profile || null,
    boundary_settings: profile?.boundary_settings || null,
    people_migrated_at: profile?.people_migrated_at || null,
    created_date: profile?.created_at || null,
    updated_date: profile?.updated_at || null,
  };
}

async function updateMe(patch) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && isTransientAuthError(authError)) {
    throw Object.assign(new Error('Could not reach your account just now.'), { status: 0, transient: true });
  }
  if (authError || !authData?.user) throw Object.assign(new Error('Not signed in'), { status: 401 });
  const allowed = {};
  for (const key of ['full_name', 'cosmic_profile', 'boundary_settings', 'people_migrated_at']) {
    if (key in (patch || {})) allowed[key] = patch[key];
  }
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: authData.user.id, ...allowed });
  if (error) throw error;
  // The write succeeded; a failed re-read must not report the save as failed.
  return me().catch(() => null);
}

export const base44 = {
  auth: {
    me,
    updateMe,
    deleteAccount: async () => {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) {
        const result = await error.context?.clone?.().json().catch(() => null);
        if (result?.recordsDeleted) throw Object.assign(new Error(result.error || 'Your records were deleted, but sign-in removal did not finish.'), { recordsDeleted: true });
        throw error;
      }
      if (!data?.deleted) throw new Error(data?.error || 'Account deletion did not complete.');
      return data;
    },
  },
  entities,
};
