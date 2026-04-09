import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

    useEffect(() => {
        loadProfile();
    }, []);

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

    const activeCorrespondences = CORRESPONDENCE_PAIRS.filter(pair =>
        pair.systems.every(s => enabledSystems.includes(s))
    );

    const systemForms = {
        astrology: <AstrologyForm data={profile.astrology} onChange={d => setSystemData('astrology', d)} />,
        human_design: <HumanDesignForm data={profile.human_design} onChange={d => setSystemData('human_design', d)} />,
        gene_keys: <GeneKeysForm data={profile.gene_keys} onChange={d => setSystemData('gene_keys', d)} />,
        numerology: <NumerologyForm data={profile.numerology} onChange={d => setSystemData('numerology', d)} />,
        tarot_archetype: <TarotForm data={profile.tarot_archetype} onChange={d => setSystemData('tarot_archetype', d)} />,
        chakras: <ChakraForm data={profile.chakras} onChange={d => setSystemData('chakras', d)} />,
    };

    return (
        <div className="p-6 space-y-8" style={{ background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                            ✨
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-bold" style={{ color: 'var(--warm-gray-800)' }}>Cosmic Add-ons</h1>
                            <p className="text-sm" style={{ color: 'var(--warm-gray-500)' }}>Astrology · Human Design · Gene Keys · and more</p>
                        </div>
                    </div>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--warm-gray-600)' }}>
                        Layer your unique cosmic blueprint onto your emotional data. Toggle on the systems you work with, 
                        enter your profile details, and the AI will weave them together for richer, more personalised insights.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 w-full grid grid-cols-3">
                        <TabsTrigger value="systems">Systems</TabsTrigger>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="correspondences">Correspondences</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Toggle Systems ── */}
                    <TabsContent value="systems" className="space-y-6">
                        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle style={{ color: 'var(--warm-gray-800)' }}>Choose Your Systems</CardTitle>
                                <p className="text-sm" style={{ color: 'var(--warm-gray-600)' }}>
                                    Toggle on the wisdom frameworks you resonate with. Only enabled systems appear in your AI insights.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <SystemToggle enabledSystems={enabledSystems} onToggle={toggleSystem} />
                            </CardContent>
                        </Card>

                        {/* Birth Data */}
                        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle style={{ color: 'var(--warm-gray-800)' }}>Birth Data</CardTitle>
                                <p className="text-sm" style={{ color: 'var(--warm-gray-600)' }}>
                                    Used to calculate or verify your charts across systems. Optional — you can skip to manual entry.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Date of Birth</Label>
                                        <Input type="date" className="mt-1" value={profile.birth_date}
                                            onChange={e => setProfile(prev => ({ ...prev, birth_date: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label>Time of Birth <span className="text-xs opacity-60">(optional)</span></Label>
                                        <Input type="time" className="mt-1" value={profile.birth_time}
                                            onChange={e => setProfile(prev => ({ ...prev, birth_time: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label>Place of Birth <span className="text-xs opacity-60">(optional)</span></Label>
                                        <Input className="mt-1" placeholder="City, Country" value={profile.birth_location}
                                            onChange={e => setProfile(prev => ({ ...prev, birth_location: e.target.value }))} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={saveProfile} disabled={isSaving}
                                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: Profile Detail Forms ── */}
                    <TabsContent value="profile" className="space-y-6">
                        {enabledSystems.length === 0 ? (
                            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                                <CardContent className="text-center py-12">
                                    <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--warm-gray-400)' }} />
                                    <p className="font-medium mb-1" style={{ color: 'var(--warm-gray-600)' }}>No systems enabled</p>
                                    <p className="text-sm" style={{ color: 'var(--warm-gray-500)' }}>
                                        Go to the Systems tab and toggle on at least one system to enter your profile.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            enabledSystems.map(systemId => {
                                const system = SYSTEMS.find(s => s.id === systemId);
                                if (!system) return null;
                                return (
                                    <Card key={systemId} className={`border shadow-sm ${system.color}`}>
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{system.emoji}</span>
                                                <div>
                                                    <CardTitle style={{ color: 'var(--warm-gray-800)' }}>{system.label}</CardTitle>
                                                    <p className="text-xs mt-1" style={{ color: 'var(--warm-gray-500)' }}>{system.description}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {systemForms[systemId]}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                        {enabledSystems.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={saveProfile} disabled={isSaving}
                                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Tab 3: Correspondences ── */}
                    <TabsContent value="correspondences" className="space-y-6">
                        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--warm-gray-800)' }}>
                                    <BookOpen className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                                    How the Systems Relate
                                </CardTitle>
                                <p className="text-sm" style={{ color: 'var(--warm-gray-600)' }}>
                                    These cross-system correspondences are included in your AI insights when both systems are enabled — helping bridge the frameworks into a unified picture.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {CORRESPONDENCE_PAIRS.map(pair => {
                                    const bothEnabled = pair.systems.every(s => enabledSystems.includes(s));
                                    const text = SYSTEM_CORRESPONDENCES[pair.key];
                                    return (
                                        <div key={pair.key}
                                            className={`p-5 rounded-xl border transition-all ${bothEnabled ? 'bg-violet-50 border-violet-200' : 'bg-white/50 border-gray-100 opacity-50'}`}>
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                                                {bothEnabled ? (
                                                    <Badge className="text-xs bg-violet-100 text-violet-700">Active in AI insights</Badge>
                                                ) : (
                                                    <Badge className="text-xs bg-gray-100 text-gray-500">Enable both systems to activate</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-gray-700)' }}>
                                                {text?.trim()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#8b5cf6' }} />
                                    <p className="text-sm" style={{ color: 'var(--warm-gray-600)' }}>
                                        <strong>How this works:</strong> When you generate AI insights on the Analytics page, your enabled systems and their cross-correspondences are automatically included in the analysis prompt. The AI uses them as a lens — not as fixed predictions, but as archetypal language to help surface deeper patterns in your emotional data.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}