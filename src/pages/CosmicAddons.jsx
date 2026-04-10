import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Save, Info, BookOpen } from "lucide-react";
import SystemToggle, { SYSTEMS } from "@/components/cosmic/SystemToggle";
import {
    AstrologyForm, HumanDesignForm, GeneKeysForm,
    NumerologyForm, TarotForm, ChakraForm
} from "@/components/cosmic/ProfileForm";
import { SYSTEM_CORRESPONDENCES } from "@/components/cosmic/correspondences";
import CosmicInsightBadge from "@/components/cosmic/CosmicInsightBadge";

const EMPTY_PROFILE = {
    first_name: "",
    last_name: "",
    birth_date: "",
    birth_time: "",
    birth_location: "",
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
    const [activeTab, setActiveTab] = useState("systems");

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

    const enabledSystems = profile.enabled_systems || [];

    const systemForms = {
        astrology: <AstrologyForm data={profile.astrology} onChange={d => setSystemData('astrology', d)} />,
        human_design: <HumanDesignForm data={profile.human_design} onChange={d => setSystemData('human_design', d)} />,
        gene_keys: <GeneKeysForm data={profile.gene_keys} onChange={d => setSystemData('gene_keys', d)} />,
        numerology: <NumerologyForm data={profile.numerology} onChange={d => setSystemData('numerology', d)} />,
        tarot_archetype: <TarotForm data={profile.tarot_archetype} onChange={d => setSystemData('tarot_archetype', d)} />,
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
                    <TabsList className="mb-6 w-full grid grid-cols-3"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <TabsTrigger value="systems">Systems</TabsTrigger>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="correspondences">Correspondences</TabsTrigger>
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
                                <div>
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Place of Birth <span className="text-xs opacity-60">(optional)</span></Label>
                                    <Input className="mt-1" placeholder="City, Country" value={profile.birth_location}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_location: e.target.value }))} />
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

                    {/* ── Tab 3: Correspondences ── */}
                    <TabsContent value="correspondences" className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-5 h-5" style={{ color: '#c084fc' }} />
                                <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>How the Systems Relate</h3>
                            </div>
                            <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.55)' }}>
                                These cross-system correspondences are included in your AI insights when both systems are enabled.
                            </p>
                            <div className="space-y-4">
                                {CORRESPONDENCE_PAIRS.map(pair => {
                                    const bothEnabled = pair.systems.every(s => enabledSystems.includes(s));
                                    const text = SYSTEM_CORRESPONDENCES[pair.key];
                                    return (
                                        <div key={pair.key} className="p-5 rounded-xl transition-all"
                                            style={{
                                                background: bothEnabled ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                                                border: bothEnabled ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
                                                opacity: bothEnabled ? 1 : 0.5
                                            }}>
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                                                {bothEnabled ? (
                                                    <Badge className="text-xs" style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.3)' }}>Active in AI insights</Badge>
                                                ) : (
                                                    <Badge className="text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(180,170,210,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>Enable both to activate</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,190,230,0.75)' }}>
                                                {text?.trim()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="glass-card p-5">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#c084fc' }} />
                                <p className="text-sm" style={{ color: 'rgba(180,170,210,0.7)' }}>
                                    <strong style={{ color: 'rgba(210,200,235,0.9)' }}>How this works:</strong> When you generate AI insights on the Analytics page, your enabled systems and their cross-correspondences are automatically included in the analysis prompt. The AI uses them as a lens — not as fixed predictions, but as archetypal language to help surface deeper patterns in your emotional data.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}