// Compatibility facade: the app was written against the Base44 client shape
// (base44.auth.me / base44.entities.X / base44.users.inviteUser). This keeps
// that surface alive on top of Supabase so call sites did not have to change.
import { supabase } from './supabase';
import entities from './entities';

async function me() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw Object.assign(new Error('Not signed in'), { status: 401 });
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();
  return {
    id: authData.user.id,
    email: authData.user.email,
    full_name: profile?.full_name || authData.user.user_metadata?.full_name || null,
    cosmic_profile: profile?.cosmic_profile || null,
    boundary_settings: profile?.boundary_settings || null,
    people_migrated_at: profile?.people_migrated_at || null,
    updated_date: profile?.updated_at || null,
  };
}

async function updateMe(patch) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw Object.assign(new Error('Not signed in'), { status: 401 });
  const allowed = {};
  for (const key of ['full_name', 'cosmic_profile', 'boundary_settings', 'people_migrated_at']) {
    if (key in (patch || {})) allowed[key] = patch[key];
  }
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: authData.user.id, ...allowed });
  if (error) throw error;
  return me();
}

export const base44 = {
  auth: {
    me,
    updateMe,
    logout: async () => { await supabase.auth.signOut(); },
    redirectToLogin: () => { window.location.assign('/'); },
  },
  entities,
  users: {
    // Server-side invites need the service role; client-side we share a link.
    inviteUser: async () => {
      throw new Error('Email invites are not wired yet; share the app link instead.');
    },
  },
};
