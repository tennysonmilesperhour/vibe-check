import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function getPeriodKey(type) {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');

    if (type === 'daily') return `${y}-${m}-${d}`;
    if (type === 'weekly') {
        // ISO week number
        const startOfYear = new Date(Date.UTC(y, 0, 1));
        const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
        return `${y}-W${String(weekNum).padStart(2, '0')}`;
    }
    if (type === 'monthly') return `${y}-${m}`;
    if (type === 'yearly') return `${y}`;
    return `${y}-${m}-${d}`;
}

function buildCosmicContext(profile) {
    if (!profile?.enabled_systems?.length) return null;
    const enabled = profile.enabled_systems;
    const parts = [];

    if (enabled.includes('astrology') && profile.astrology) {
        const a = profile.astrology;
        const items = [
            a.sun_sign && `Sun in ${a.sun_sign}`,
            a.moon_sign && `Moon in ${a.moon_sign}`,
            a.rising_sign && `${a.rising_sign} Rising`,
            a.north_node && `North Node in ${a.north_node}`,
        ].filter(Boolean);
        if (items.length) parts.push(`ASTROLOGY: ${items.join(', ')}${a.custom_notes ? '. Notes: ' + a.custom_notes : ''}`);
    }
    if (enabled.includes('human_design') && profile.human_design) {
        const h = profile.human_design;
        const items = [
            h.type,
            h.authority && `${h.authority} Authority`,
            h.profile && `Profile ${h.profile}`,
            h.strategy,
            h.incarnation_cross,
        ].filter(Boolean);
        if (items.length) parts.push(`HUMAN DESIGN: ${items.join(', ')}${h.custom_notes ? '. Notes: ' + h.custom_notes : ''}`);
    }
    if (enabled.includes('gene_keys') && profile.gene_keys) {
        const g = profile.gene_keys;
        const items = [
            g.life_work && `Life's Work Key ${g.life_work}`,
            g.purpose && `Purpose Key ${g.purpose}`,
            g.evolution && `Evolution Key ${g.evolution}`,
            g.radiance && `Radiance Key ${g.radiance}`,
        ].filter(Boolean);
        if (items.length) parts.push(`GENE KEYS: ${items.join(', ')}${g.custom_notes ? '. Notes: ' + g.custom_notes : ''}`);
    }
    if (enabled.includes('numerology') && profile.numerology) {
        const n = profile.numerology;
        const items = [
            n.life_path && `Life Path ${n.life_path}`,
            n.expression && `Expression ${n.expression}`,
            n.soul_urge && `Soul Urge ${n.soul_urge}`,
            n.personal_year && `Personal Year ${n.personal_year}`,
        ].filter(Boolean);
        if (items.length) parts.push(`NUMEROLOGY: ${items.join(', ')}`);
    }
    if (enabled.includes('tarot_archetype') && profile.tarot_archetype) {
        const t = profile.tarot_archetype;
        const items = [
            t.birth_card && `Birth Card: ${t.birth_card}`,
            t.shadow_card && `Shadow Card: ${t.shadow_card}`,
        ].filter(Boolean);
        if (items.length) parts.push(`TAROT: ${items.join(', ')}`);
    }
    if (enabled.includes('chakras') && profile.chakras) {
        const c = profile.chakras;
        if (c.dominant_center) parts.push(`CHAKRA FOCUS: ${c.dominant_center}`);
        if (c.focus_areas?.length) parts.push(`CHAKRA AREAS: ${c.focus_areas.join(', ')}`);
    }

    return parts.length > 0 ? parts.join('\n') : null;
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { period_type = 'daily', force_regenerate = false } = body;

    const profile = user.cosmic_profile || {};
    const enabledSystems = profile.enabled_systems || [];
    const systemsKey = [...enabledSystems].sort().join(',');
    const periodKey = getPeriodKey(period_type);

    // Check if we already have wisdom for this period + systems combo
    if (!force_regenerate) {
        const existing = await base44.entities.CosmicWisdom.filter({
            period_type,
            period_key: periodKey,
            systems_key: systemsKey,
        });
        if (existing.length > 0) {
            return Response.json({ wisdom: existing[0], already_existed: true });
        }
    }

    const cosmicContext = buildCosmicContext(profile);
    if (!cosmicContext) {
        return Response.json({ error: 'No cosmic systems configured. Please set up your Cosmic Add-ons first.' }, { status: 400 });
    }

    const name = user.full_name || 'dear soul';
    const birthDate = profile.birth_date || null;
    const systemCount = enabledSystems.length;

    const periodDescriptions = {
        daily: 'today',
        weekly: 'this week',
        monthly: 'this month',
        yearly: 'this year',
    };
    const periodFocus = periodDescriptions[period_type] || 'this period';
    const depth = systemCount === 1
        ? `Go deep — only one system is active (${enabledSystems[0].replace('_', ' ')}), so this reading should be highly specific, detailed, and rich with the nuances of that single framework.`
        : `Weave all ${systemCount} active systems together into a unified, layered reading. Show how they reinforce or dialogue with each other.`;

    const prompt = `You are a deeply wise, soulful guide blending ancient wisdom systems with modern psychological insight. You speak with warmth, depth, and specificity — never generic.

The person's name is ${name}.${birthDate ? ` They were born on ${birthDate}.` : ''}

Their active cosmic profile:
${cosmicContext}

Generate a ${period_type.toUpperCase()} wisdom reading for ${periodFocus}.

${depth}

The reading should:
1. Feel intimately personal to their specific chart/numbers/archetype — not generic horoscope language
2. Offer genuine insight about the energy, themes, or invitations of ${periodFocus}
3. Connect their inner nature (from the cosmic systems) to how it might show up in relationships, creativity, inner work, or daily life
4. End with a contemplation question that invites self-reflection specific to their chart

Format your response as JSON with exactly these fields:
- theme: A short evocative title for this ${period_type} (4-7 words, poetic)
- wisdom: Rich, personal insight for ${periodFocus} (3-4 paragraphs)
- contemplation: One powerful, specific contemplation question or practice

Keep it luminous, grounded, and genuinely useful. No fluff. No generic spiritual platitudes.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
            type: 'object',
            properties: {
                theme: { type: 'string' },
                wisdom: { type: 'string' },
                contemplation: { type: 'string' },
            },
            required: ['theme', 'wisdom', 'contemplation'],
        },
    });

    // Delete old entry for this period+systems if force regenerating
    if (force_regenerate) {
        const old = await base44.entities.CosmicWisdom.filter({ period_type, period_key: periodKey });
        for (const o of old) {
            await base44.entities.CosmicWisdom.delete(o.id);
        }
    }

    const saved = await base44.entities.CosmicWisdom.create({
        period_type,
        period_key: periodKey,
        systems_key: systemsKey,
        wisdom: result.wisdom,
        theme: result.theme,
        contemplation: result.contemplation,
        is_read: false,
    });

    return Response.json({ wisdom: saved, already_existed: false });
});