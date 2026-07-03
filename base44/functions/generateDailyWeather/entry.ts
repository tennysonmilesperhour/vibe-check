import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { getPeriodKey } from '../shared/periodKey.ts';

// Daily cosmic weather: current sky vs natal placements, generated once per
// local day and cached in CosmicWisdom with period_type 'weather'.

const KEY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const clientKey = typeof body.period_key === 'string' && KEY_SHAPE.test(body.period_key)
        ? body.period_key
        : getPeriodKey('daily');
    const resonanceSummary = typeof body.resonance_summary === 'string' ? body.resonance_summary.slice(0, 4000) : '';

    const profile = user.cosmic_profile || {};
    const enabled = profile.enabled_systems || [];
    if (enabled.length === 0) {
        return Response.json({ error: 'No cosmic systems configured yet.' }, { status: 400 });
    }

    const systemsKey = [...enabled].sort().join(',');

    const existing = await base44.entities.CosmicWisdom.filter({
        period_type: 'weather',
        period_key: clientKey,
        systems_key: systemsKey,
    });
    if (existing.length > 0 && !body.force_regenerate) {
        return Response.json({ weather: existing[0], already_existed: true });
    }

    const prompt = `You are an astute, warm guide reading today's sky against a specific person's chart. Date: ${clientKey}.

Their placements and computed resonances:
${resonanceSummary || 'Only birth data is available; infer placements from it.'}
${profile.birth_date ? `Birth date: ${profile.birth_date}${profile.birth_time ? `, ${profile.birth_time}` : ''}.` : ''}

Using real current transits for this date (moon sign and phase, notable planetary aspects), describe today's cosmic weather FOR THIS PERSON: which of their placements today's sky touches, and what that invites. Specific, grounded, zero generic horoscope filler. No em dashes.

Respond as JSON:
- headline: one short line of today's weather for them (max 12 words)
- guidance: 2-3 sentences of practical, personal guidance
- active_points: array of up to 3 strings naming their touched placements (e.g. "Moon in Pisces")`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
            type: 'object',
            properties: {
                headline: { type: 'string' },
                guidance: { type: 'string' },
                active_points: { type: 'array', items: { type: 'string' } },
            },
            required: ['headline', 'guidance'],
        },
    });

    const saved = await base44.entities.CosmicWisdom.create({
        period_type: 'weather',
        period_key: clientKey,
        systems_key: systemsKey,
        theme: result.headline,
        wisdom: result.guidance,
        contemplation: (result.active_points || []).join(' · '),
        is_read: false,
    });

    return Response.json({ weather: saved, already_existed: false });
});
