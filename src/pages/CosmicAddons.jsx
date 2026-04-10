import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Save, Info, BookOpen, Wand2 } from "lucide-react";
import SystemToggle, { SYSTEMS } from "@/components/cosmic/SystemToggle";
import {
    AstrologyForm, HumanDesignForm, GeneKeysForm,
    NumerologyForm, TarotForm, ChakraForm
} from "@/components/cosmic/ProfileForm";
import { SYSTEM_CORRESPONDENCES } from "@/components/cosmic/correspondences";
import CosmicInsightBadge from "@/components/cosmic/CosmicInsightBadge";
import CosmicBlueprint from "@/components/cosmic/CosmicBlueprint";
import SystemReports from "@/components/cosmic/SystemReport";
import CorrespondenceMap from "@/components/cosmic/CorrespondenceMap";

const EMPTY_PROFILE = {
    first_name: "",
    last_name: "",
    birth_date: "",
    birth_time: "",
    birth_city: "",
    birth_state: "",
    birth_country: "",
    enabled_systems: ["astrology"],
    astrology: {},
    human_design: {},
    gene_keys: {},
    numerology: {},
    tarot_archetype: {},
    chakras: {}
};

const CORRESPONDENCE_PAIRS = [
    { systems: ["astrology", "human_design"], key: "astrology_human_design" },
    { systems: ["astrology", "gene_keys"], key: "astrology_gene_keys" },
    { systems: ["astrology", "numerology"], key: "astrology_numerology" },
    { systems: ["astrology", "tarot_archetype"], key: "astrology_tarot" },
    { systems: ["human_design", "gene_keys"], key: "human_design_gene_keys" },
    { systems: ["human_design", "chakras"], key: "human_design_chakras" },
    { systems: ["numerology", "tarot_archetype"], key: "numerology_tarot" },
    { systems: ["gene_keys", "chakras"], key: "gene_keys_chakras" },
];

export default function CosmicAddons() {
    const { toast } = useToast();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [isSaving, setIsSaving] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const defaultTab = urlParams.get('tab') || 'systems';
    const [activeTab, setActiveTab] = useState(defaultTab);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const user = await base44.auth.me();
            if (user?.cosmic_profile) {
                setProfile({ ...EMPTY_PROFILE, ...user.cosmic_profile });
            }
        } catch (e) {}
    };

    const saveProfile = async () => {
        setIsSaving(true);
        await base44.auth.updateMe({ cosmic_profile: profile });
        setIsSaving(false);
        toast({ title: "Cosmic profile saved", description: "Your systems are active and will inform AI insights." });
    };

    const toggleSystem = (systemId) => {
        setProfile(prev => {
            const enabled = prev.enabled_systems || [];
            const next = enabled.includes(systemId)
                ? enabled.filter(s => s !== systemId)
                : [...enabled, systemId];
            return { ...prev, enabled_systems: next };
        });
    };

    const setSystemData = (systemKey, data) => {
        setProfile(prev => ({ ...prev, [systemKey]: data }));
    };

    const canCalculate = profile.birth_date && (profile.birth_city || profile.birth_country);

    const aiCalculate = async () => {
        if (!canCalculate) return;
        setIsCalculating(true);
        const location = [profile.birth_city, profile.birth_state, profile.birth_country].filter(Boolean).join(', ');
        const prompt = `You are a master astrologer, Human Design analyst, and Gene Keys reader with access to precise ephemeris data.

Calculate everything for: Born ${profile.birth_date}${profile.birth_time ? ' at ' + profile.birth_time : ''}, in ${location}.

IMPORTANT: You MUST return actual calculated values for ALL fields. Do not return null unless genuinely impossible.

For Gene Keys: Use the I Ching hexagram gates from the Human Design bodygraph. The Conscious Sun gate = Life's Work key number (1-64).

Return this JSON:
{
  "moon_sign": "<zodiac sign, e.g. Scorpio>",
  "rising_sign": "<zodiac sign, requires birth time>",
  "north_node": "<zodiac sign of North Node>",
  "hd_type": "<one of: Manifestor, Generator, Manifesting Generator, Projector, Reflector>",
  "hd_authority": "<e.g. Emotional / Solar Plexus>",
  "hd_profile": "<e.g. 3/5>",
  "hd_strategy": "<e.g. To Respond>",
  "hd_definition": "<one of: Single Definition, Split Definition, Triple Split, Quadruple Split>",
  "hd_incarnation_cross": "<e.g. Right Angle Cross of the Sphinx>",
  "gk_life_work": "<number 1-64>",
  "gk_evolution": "<number 1-64>",
  "gk_radiance": "<number 1-64>",
  "gk_purpose": "<number 1-64>",
  "gk_attraction": "<number 1-64>",
  "gk_iq": "<number 1-64>",
  "chakra_dominant": "<one of: Root (Muladhara) \u2013 Safety & grounding, Sacral (Svadhisthana) \u2013 Creativity & pleasure, Solar Plexus (Manipura) \u2013 Power & will, Heart (Anahata) \u2013 Love & connection, Throat (Vishuddha) \u2013 Expression & truth, Third Eye (Ajna) \u2013 Intuition & insight, Crown (Sahasrara) \u2013 Consciousness & unity>"
}`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            model: 'gemini_3_1_pro',
            response_json_schema: {
                type: 'object',
                properties: {
                    moon_sign: { type: 'string' }, rising_sign: { type: 'string' },
                    north_node: { type: 'string' },
                    hd_type: { type: 'string' }, hd_authority: { type: 'string' },
                    hd_profile: { type: 'string' }, hd_strategy: { type: 'string' },
                    hd_definition: { type: 'string' }, hd_incarnation_cross: { type: 'string' },
                    gk_life_work: { type: 'string' }, gk_evolution: { type: 'string' },
                    gk_radiance: { type: 'string' }, gk_purpose: { type: 'string' },
                    gk_attraction: { type: 'string' }, gk_iq: { type: 'string' },
                    chakra_dominant: { type: 'string' }
                }
            }
        });

        const newProfile = {
            ...profile,
            astrology: {
                ...profile.astrology,
                ...(result.moon_sign ? { moon_sign: result.moon_sign } : {}),
                ...(result.rising_sign ? { rising_sign: result.rising_sign } : {}),
                ...(result.north_node ? { north_node: result.north_node } : {}),
            },
            human_design: {
                ...profile.human_design,
                ...(result.hd_type ? { type: result.hd_type } : {}),
                ...(result.hd_authority ? { authority: result.hd_authority } : {}),
                ...(result.hd_profile ? { profile: result.hd_profile } : {}),
                ...(result.hd_strategy ? { strategy: result.hd_strategy } : {}),
                ...(result.hd_definition ? { definition: result.hd_definition } : {}),
                ...(result.hd_incarnation_cross ? { incarnation_cross: result.hd_incarnation_cross } : {}),
            },
            gene_keys: {
                ...profile.gene_keys,
                ...(result.gk_life_work ? { life_work: result.gk_life_work } : {}),
                ...(result.gk_evolution ? { evolution: result.gk_evolution } : {}),
                ...(result.gk_radiance ? { radiance: result.gk_radiance } : {}),
                ...(result.gk_purpose ? { purpose: result.gk_purpose } : {}),
                ...(result.gk_attraction ? { attraction: result.gk_attraction } : {}),
                ...(result.gk_iq ? { iq: result.gk_iq } : {}),
            },
            chakras: {
                ...profile.chakras,
                ...(result.chakra_dominant ? { dominant_center: result.chakra_dominant } : {}),
            }
        };

        setProfile(newProfile);
        // Auto-save so changes persist
        await base44.auth.updateMe({ cosmic_profile: newProfile });
        setIsCalculating(false);
        toast({ title: "✦ Birth chart calculated & saved", description: "Human Design, Gene Keys, Moon sign, and more have been filled in. Review and adjust anything that looks off." });
    };

    const enabledSystems = profile.enabled_systems || [];

    const systemForms = {
        astrology: <AstrologyForm data={profile.astrology} onChange={d => setSystemData('astrology', d)} birthDate={profile.birth_date} />,
        human_design: <HumanDesignForm data={profile.human_design} onChange={d => setSystemData('human_design', d)} />,
        gene_keys: <GeneKeysForm data={profile.gene_keys} onChange={d => setSystemData('gene_keys', d)} />,
        numerology: <NumerologyForm data={profile.numerology} onChange={d => setSystemData('numerology', d)} birthDate={profile.birth_date} firstName={profile.first_name} lastName={profile.last_name} />,
        tarot_archetype: <TarotForm data={profile.tarot_archetype} onChange={d => setSystemData('tarot_archetype', d)} birthDate={profile.birth_date} />,
        chakras: <ChakraForm data={profile.chakras} onChange={d => setSystemData('chakras', d)} />,
    };

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="orb-purple" style={{ top: '-40px', right: '10%' }} />
            <div className="max-w-4xl mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl pulse-glow"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)' }}>
                            ✨
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cosmic Add-ons</h1>
                            <p className="text-sm" style={{ color: 'rgba(139,92,246,0.7)' }}>Astrology · Human Design · Gene Keys · and more</p>
                        </div>
                    </div>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(180,170,210,0.65)' }}>
                        Layer your unique cosmic blueprint onto your emotional data. Toggle on the systems you work with,
                        enter your profile details, and the AI will weave them together for richer, more personalised insights.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 w-full grid grid-cols-4"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <TabsTrigger value="systems">Systems</TabsTrigger>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="correspondences">Connections</TabsTrigger>
                        <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Toggle Systems ── */}
                    <TabsContent value="systems" className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>Choose Your Systems</h3>
                            <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.55)' }}>
                                Toggle on the wisdom frameworks you resonate with. Only enabled systems appear in your AI insights.
                            </p>
                            <SystemToggle enabledSystems={enabledSystems} onToggle={toggleSystem} />
                        </div>

                        {/* Birth Data */}
                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>Name & Birth Data</h3>
                            <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.55)' }}>
                                Your name is used for numerology calculations (expression number, soul urge, life path). Birth data helps calculate or verify your charts.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>First Name</Label>
                                    <Input className="mt-1" placeholder="Your first name" value={profile.first_name}
                                        onChange={e => setProfile(prev => ({ ...prev, first_name: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Last Name</Label>
                                    <Input className="mt-1" placeholder="Your last name" value={profile.last_name}
                                        onChange={e => setProfile(prev => ({ ...prev, last_name: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Date of Birth</Label>
                                    <Input type="date" className="mt-1" value={profile.birth_date}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_date: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Time of Birth <span className="text-xs opacity-60">(optional)</span></Label>
                                    <Input type="time" className="mt-1" value={profile.birth_time}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_time: e.target.value }))} />
                                </div>
                                <div />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>City of Birth</Label>
                                    <Input className="mt-1" placeholder="e.g. Denver" value={profile.birth_city || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_city: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>State / Region <span className="text-xs opacity-60">(optional)</span></Label>
                                    <Input className="mt-1" placeholder="e.g. Colorado" value={profile.birth_state || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_state: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Country of Birth</Label>
                                    <Input className="mt-1" placeholder="e.g. United States" value={profile.birth_country || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_country: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={saveProfile} disabled={isSaving} className="btn-cosmic rounded-xl">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: Profile Detail Forms ── */}
                    <TabsContent value="profile" className="space-y-6">
                        {/* Sacred Geometry Blueprint */}
                        <div className="glass-card p-6 flex flex-col items-center" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
                            <h3 className="text-base font-bold mb-1 w-full" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>Your Cosmic Blueprint</h3>
                            <p className="text-sm mb-3 w-full" style={{ color: 'rgba(180,170,210,0.55)' }}>Systems light up as you fill in your profile data</p>
                            {canCalculate ? (
                                <div className="w-full mb-4 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                    <Wand2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#c084fc' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(220,210,240,0.9)' }}>Oracle Birth Chart Calculator</p>
                                        <p className="text-xs mb-3" style={{ color: 'rgba(180,170,210,0.55)' }}>Channels your birth date, time &amp; location to reveal your Moon sign, Rising, North Node, Human Design type/authority/profile, all 6 Gene Keys, and Chakra center. Only fills empty fields.</p>
                                        <Button onClick={aiCalculate} disabled={isCalculating} size="sm" className="btn-cosmic rounded-lg">
                                            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                                            {isCalculating ? 'Calculating...' : 'Calculate from Birth Data'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p className="text-xs" style={{ color: 'rgba(180,170,210,0.45)' }}>💡 Add your birth date and city in the <strong style={{color:'rgba(192,132,252,0.7)'}}>Systems tab</strong> to unlock AI birth chart calculation.</p>
                                </div>
                            )}
                            <CosmicBlueprint enabledSystems={enabledSystems} profile={profile} />
                        </div>

                        {enabledSystems.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(139,92,246,0.4)' }} />
                                <p className="font-medium mb-1" style={{ color: 'rgba(200,190,230,0.7)', fontFamily: 'Space Grotesk, sans-serif' }}>No systems enabled</p>
                                <p className="text-sm" style={{ color: 'rgba(160,150,190,0.5)' }}>
                                    Go to the Systems tab and toggle on at least one system to enter your profile.
                                </p>
                            </div>
                        ) : (
                            enabledSystems.map(systemId => {
                                const system = SYSTEMS.find(s => s.id === systemId);
                                if (!system) return null;
                                return (
                                    <div key={systemId} className="glass-card p-6"
                                        style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
                                        <div className="flex items-center gap-3 mb-5">
                                            <span className="text-2xl">{system.emoji}</span>
                                            <div>
                                                <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>{system.label}</h3>
                                                <p className="text-xs mt-0.5" style={{ color: 'rgba(180,170,210,0.5)' }}>{system.description}</p>
                                            </div>
                                        </div>
                                        {systemForms[systemId]}
                                    </div>
                                );
                            })
                        )}
                        {enabledSystems.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={saveProfile} disabled={isSaving} className="btn-cosmic rounded-xl">
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Tab 3: Connections ── */}
                    <TabsContent value="correspondences" className="space-y-6">
                        <CorrespondenceMap enabledSystems={enabledSystems} profile={profile} />
                    </TabsContent>

                    {/* ── Tab 4: Deep Dive ── */}
                    <TabsContent value="deepdive" className="space-y-6">
                        <div className="glass-card p-5">
                            <p className="text-sm" style={{ color: 'rgba(180,170,210,0.6)' }}>
                                Each system below has a full structured breakdown + an AI-generated deep reading. Expand any system to generate your personalized report. Each can be exported as a PDF.
                            </p>
                        </div>
                        <SystemReports enabledSystems={enabledSystems} profile={profile} cosmicProfile={profile} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}