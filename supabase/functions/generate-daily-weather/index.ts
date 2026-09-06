// Daily cosmic weather: today's sky against the user's chart, cached per
// local day under period_type 'weather'.
import { preflight, json, userClient, askClaude, resolvePeriodKey, claimAiRequest } from '../_shared/common.ts';

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const supabase = userClient(req);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const periodKey = resolvePeriodKey('weather', body.period_key);
  const resonanceSummary = typeof body.resonance_summary === 'string' ? body.resonance_summary.slice(0, 4000) : '';

  const { data: profileRow } = await supabase.from('profiles').select('cosmic_profile').eq('id', auth.user.id).maybeSingle();
  const profile = profileRow?.cosmic_profile || {};
  const enabled: string[] = profile.enabled_systems || [];
  if (enabled.length === 0) return json({ error: 'No cosmic systems configured yet.' }, 400);
  const systemsKey = [...enabled].sort().join(',');

  if (!body.force_regenerate) {
    const { data: existing } = await supabase.from('cosmic_wisdom').select('*')
      .eq('period_type', 'weather').eq('period_key', periodKey).eq('systems_key', systemsKey).limit(1);
    if (existing?.length) return json({ weather: existing[0], already_existed: true });
  }

  const prompt = `You are an astute, warm guide reading today's sky against a specific person's chart. Date: ${periodKey}.

Their placements and computed resonances:
${resonanceSummary || 'No computed resonance data is available.'}
${profile.birth_date ? `Birth date: ${profile.birth_date}${profile.birth_time ? `, ${profile.birth_time}` : ''}.` : ''}

Use only the computed information above. Do not invent planetary transits, placements, or aspects. Frame this as a symbolic daily reflection, not an astronomical forecast. Specific, grounded, zero generic horoscope filler. No em dashes.`;

  try {
    if (!await claimAiRequest(supabase, auth.user.id, 'daily-weather')) {
      return json({ error: 'Daily AI reading limit reached. Try again tomorrow.' }, 429);
    }
    if (body.force_regenerate) {
      const { error: deleteError } = await supabase.from('cosmic_wisdom').delete()
        .eq('period_type', 'weather').eq('period_key', periodKey).eq('systems_key', systemsKey);
      if (deleteError) throw deleteError;
    }
    const result = await askClaude(prompt, {
      type: 'object',
      properties: {
        headline: { type: 'string', description: "One short line, today's weather for them, max 12 words" },
        guidance: { type: 'string', description: '2-3 sentences of practical, personal guidance' },
        active_points: { type: 'array', items: { type: 'string' }, description: 'Up to 3 touched placements' },
      },
      required: ['headline', 'guidance'],
    }) as Record<string, any> | null;

    if (result === null) return json({ stub: true, message: 'ANTHROPIC_API_KEY not configured' });

    const { data: saved, error } = await supabase.from('cosmic_wisdom').insert({
      user_id: auth.user.id,
      period_type: 'weather',
      period_key: periodKey,
      systems_key: systemsKey,
      theme: result.headline,
      wisdom: result.guidance,
      contemplation: (result.active_points || []).join(' · '),
      is_read: false,
    }).select().single();
    if (error) throw error;
    return json({ weather: saved, already_existed: false });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
