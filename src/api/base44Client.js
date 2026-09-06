// Compatibility facade: the app was written against the Base44 client shape
// (base44.auth.me / base44.entities.X / base44.users.inviteUser). This keeps
// that surface alive on top of Supabase so call sites did not have to change.
import { supabase } from './supabase';
import entities from './entities';
import { InvokeLLM } from './integrations';
import { clearAllLocalDrafts } from '@/lib/checkInDraft';
import { AUTH_REDIRECT_URL } from '@/lib/publicConfig';

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
    logout: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      clearAllLocalDrafts();
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_REDIRECT_URL,
      });
      if (error) throw error;
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    deleteAccount: async () => {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      if (!data?.deleted) throw new Error(data?.error || 'Account deletion did not complete.');
      clearAllLocalDrafts();
      await supabase.auth.signOut({ scope: 'local' });
      return true;
    },
    redirectToLogin: () => { window.location.assign('/'); },
  },
  entities,
  integrations: { Core: { InvokeLLM } },
  users: {
    // Server-side invites need the service role; client-side we share a link.
    inviteUser: async () => {
      throw new Error('Email invites are not wired yet; share the app link instead.');
    },
  },
};
