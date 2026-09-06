// Cosmic wisdom generation, ported from the Base44 function. Cached per
// (user, period_type, period_key, systems_key) in cosmic_wisdom.
import { preflight, json, userClient, askClaude, resolvePeriodKey, claimAiRequest } from '../_shared/common.ts';

function buildCosmicContext(profile: Record<string, any>): string | null {
  if (!profile?.enabled_systems?.length) return null;
  const enabled: string[] = profile.enabled_systems;
  const parts: string[] = [];

  if (profile.birth_date) parts.push(`BIRTH DATE: ${profile.birth_date}`);
  if (profile.birth_time) parts.push(`BIRTH TIME: ${profile.birth_time}`);
  if (profile.birth_location) parts.push(`BIRTH LOCATION: ${profile.birth_location}`);
  parts.push(`ACTIVE SYSTEMS: ${enabled.join(', ')}`);

  const add = (label: string, items: (string | undefined | false)[], notes?: string) => {
    const filled = items.filter(Boolean);
    if (filled.length) parts.push(`${label}: ${filled.join(', ')}${notes ? '. Notes: ' + notes : ''}`);
  };

  const a = profile.astrology || {};
  if (enabled.includes('astrology')) add('ASTROLOGY', [a.sun_sign && `Sun in ${a.sun_sign}`, a.moon_sign && `Moon in ${a.moon_sign}`, a.rising_sign && `${a.rising_sign} Rising`, a.north_node && `North Node in ${a.north_node}`], a.custom_notes);
  const h = profile.human_design || {};
  if (enabled.includes('human_design')) add('HUMAN DESIGN', [h.type, h.authority && `${h.authority} Authority`, h.profile && `Profile ${h.profile}`, h.strategy, h.incarnation_cross], h.custom_notes);
  const g = profile.gene_keys || {};
  if (enabled.includes('gene_keys')) add('GENE KEYS', [g.life_work && `Life's Work Key ${g.life_work}`, g.purpose && `Purpose Key ${g.purpose}`, g.evolution && `Evolution Key ${g.evolution}`, g.radiance && `Radiance Key ${g.radiance}`], g.custom_notes);
  const n = profile.numerology || {};
  if (enabled.includes('numerology')) add('NUMEROLOGY', [n.life_path && `Life Path ${n.life_path}`, n.expression && `Expression ${n.expression}`, n.soul_urge && `Soul Urge ${n.soul_urge}`, n.personal_year && `Personal Year ${n.personal_year}`]);
  const t = profile.tarot_archetype || {};
  if (enabled.includes('tarot_archetype')) add('TAROT', [t.birth_card && `Birth Card: ${t.birth_card}`, t.shadow_card && `Shadow Card: ${t.shadow_card}`]);
  const e = profile.enneagram || {};
  if (enabled.includes('enneagram')) add('ENNEAGRAM', [e.type && `Type ${e.type}`, e.wing && `Wing ${e.wing}`, e.instinct && `Instinct: ${e.instinct}`, e.tritype && `Tritype ${e.tritype}`]);
  const c = profile.chakras || {};
  if (enabled.includes('chakras')) add('CHAKRAS', [c.dominant_center && `Dominant: ${c.dominant_center}`, c.blocked_center && `Working on: ${c.blocked_center}`]);

  return parts.join('\n');
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const supabase = userClient(req);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const periodType = ['daily', 'weekly', 'monthly', 'yearly'].includes(body.period_type) ? body.period_type : 'daily';
  const periodKey = resolvePeriodKey(periodType, body.period_key);
  const resonanceSummary = typeof body.resonance_summary === 'string' ? body.resonance_summary.slice(0, 4000) : '';

  const { data: profileRow } = await supabase.from('profiles').select('full_name, cosmic_profile').eq('id', auth.user.id).maybeSingle();
  const profile = profileRow?.cosmic_profile || {};
  const enabled: string[] = profile.enabled_systems || [];
  if (enabled.length === 0) {
    return json({ error: 'No cosmic systems configured. Turn on at least one system in Cosmos and save.' }, 400);
  }
  const systemsKey = [...enabled].sort().join(',');

  if (!body.force_regenerate) {
    const { data: existing } = await supabase.from('cosmic_wisdom').select('*')
      .eq('period_type', periodType).eq('period_key', periodKey).eq('systems_key', systemsKey).limit(1);
    if (existing?.length) return json({ wisdom: existing[0], already_existed: true });
  }

  const cosmicContext = buildCosmicContext(profile);
  const name = profileRow?.full_name || 'dear soul';
  const periodFocus = { daily: 'today', weekly: 'this week', monthly: 'this month', yearly: 'this year' }[periodType as 'daily'];
  const depth = enabled.length === 1
    ? `Go deep. Only one system is active (${enabled[0].replace('_', ' ')}), so this reading should be highly specific and rich with that framework's nuances.`
    : `Weave all ${enabled.length} active systems together into a unified, layered reading.`;

  const prompt = `You are a deeply wise, soulful guide blending ancient wisdom systems with modern psychological insight. You speak with warmth, depth, and specificity. Never generic. No em dashes.

The person's name is ${name}.${profile.birth_date ? ` They were born on ${profile.birth_date}.` : ''}

Their active cosmic profile:
${cosmicContext}
${resonanceSummary ? `\nTheir computed resonance map (structurally true cross-system connections, weave these in):\n${resonanceSummary}` : ''}

Use only the profile values and computed resonance data provided. Do not invent placements, chart values, or current transits. If the profile is sparse, keep the reading modest and say what it is based on.

Generate a ${periodType.toUpperCase()} wisdom reading for ${periodFocus}. ${depth}

The reading should feel intimately personal to their chart, offer genuine insight about ${periodFocus}, connect their inner nature to relationships, creativity, or daily life, and end with a contemplation question specific to their chart.`;

  try {
    if (!await claimAiRequest(supabase, auth.user.id, 'cosmic-wisdom')) {
      return json({ error: 'Daily AI reading limit reached. Try again tomorrow.' }, 429);
    }
    const result = await askClaude(prompt, {
      type: 'object',
      properties: {
        theme: { type: 'string', description: 'Short evocative title, 4-7 words' },
        wisdom: { type: 'string', description: 'Rich personal insight, 3-4 paragraphs' },
        contemplation: { type: 'string', description: 'One specific contemplation question or practice' },
      },
      required: ['theme', 'wisdom', 'contemplation'],
    }) as Record<string, string> | null;

    if (result === null) return json({ stub: true, message: 'ANTHROPIC_API_KEY not configured' });

    if (body.force_regenerate) {
      await supabase.from('cosmic_wisdom').delete().eq('period_type', periodType).eq('period_key', periodKey);
    }
    const { data: saved, error } = await supabase.from('cosmic_wisdom').insert({
      user_id: auth.user.id,
      period_type: periodType,
      period_key: periodKey,
      systems_key: systemsKey,
      wisdom: result.wisdom,
      theme: result.theme,
      contemplation: result.contemplation,
      is_read: false,
    }).select().single();
    if (error) throw error;
    return json({ wisdom: saved, already_existed: false });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
