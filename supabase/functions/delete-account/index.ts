import { createClient } from 'jsr:@supabase/supabase-js@2';
import { preflight, json, userClient } from '../_shared/common.ts';

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const caller = userClient(req);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: auth, error: authError } = await caller.auth.getUser(token);
  if (authError || !auth?.user) return json({ error: 'Unauthorized' }, 401);

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!serviceRoleKey || !supabaseUrl) return json({ error: 'Account deletion is not configured.' }, 503);

  // Erase only Vibe Check data. Campground uses the same sign-in identity.
  const { data: sharedAccountRetained, error: eraseError } = await caller.rpc('vibe_delete_data');
  if (eraseError) {
    console.error('Vibe Check deletion failed', eraseError.message);
    return json({ error: 'Your Vibe Check data could not be deleted. Please try again.' }, 500);
  }
  if (sharedAccountRetained) return json({ deleted: true, sharedAccountRetained: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    console.error('Account deletion failed', error.message);
    return json({ error: 'Account deletion failed. Contact support if this continues.' }, 500);
  }
  return json({ deleted: true, sharedAccountRetained: false });
});
