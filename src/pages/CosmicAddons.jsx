import React, { useState, useEffect, useRef } from "react";
import { shareNodeAsImage } from "@/lib/share";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";
import SystemToggle, { SYSTEMS } from "@/components/cosmic/SystemToggle";
import {
    AstrologyForm, HumanDesignForm, GeneKeysForm,
    NumerologyForm, TarotForm, ChakraForm, EnneagramForm
} from "@/components/cosmic/ProfileForm";
import SystemReports from "@/components/cosmic/SystemReport";
import CorrespondenceMap from "@/components/cosmic/CorrespondenceMap";
import Loom from "@/features/loom/Loom";
import ConflictNotice from "@/features/cosmos/ConflictNotice";
import SkyField from "@/features/shell/SkyField";
import { useSearchParamState } from "@/lib/deeplink";
import TobaccoGuide from '@/features/shell/TobaccoGuide';
import { PlantCompanions } from '@/features/practice/SomaticPractice';

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
    enneagram: {},
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
    const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(EMPTY_PROFILE));
    const [isSaving, setIsSaving] = useState(false);
    const loomRef = useRef(null);

    // Two-way URL sync: back button and refresh keep your place.
    const [activeTab, setActiveTab] = useSearchParamState('tab', 'systems');
    // Deep-dive target from the Loom: which system to open + a nonce so repeat
    // taps on the same system re-trigger the expand-and-scroll.
    const [deepDive, setDeepDive] = useState({ system: null, nonce: 0 });
    const isDirty = JSON.stringify(profile) !== savedSnapshot;

    // Loom "Deep dive into X" → jump to the Deep Dive tab, open that system.
    const openDeepDive = (system) => {
        setActiveTab('deepdive');
        setDeepDive((d) => ({ system, nonce: d.nonce + 1 }));
    };

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const user = await base44.auth.me();
            if (user?.cosmic_profile) {
                const merged = { ...EMPTY_PROFILE, ...user.cosmic_profile };
                setProfile(merged);
                setSavedSnapshot(JSON.stringify(merged));
            }
        } catch {
            // unauthenticated mount: the gate handles it
        }
    };

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            await base44.auth.updateMe({ cosmic_profile: profile });
            setSavedSnapshot(JSON.stringify(profile));
            toast({ title: "Cosmic profile saved", description: "Your loom and readings now weave from these systems." });
        } catch (e) {
            toast({ title: "Could not save", description: e?.message, variant: "destructive" });
        }
        setIsSaving(false);
    };

    /** One-tap fix from ConflictNotice: adopt the computed value. */
    const useComputed = (conflict) => {
        const [systemKey, field] = conflict.field.split('.');
        setProfile(prev => ({ ...prev, [systemKey]: { ...(prev[systemKey] || {}), [field]: String(conflict.computed) } }));
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
        astrology: <AstrologyForm data={profile.astrology} onChange={d => setSystemData('astrology', d)} birthDate={profile.birth_date} />,
        human_design: <HumanDesignForm data={profile.human_design} onChange={d => setSystemData('human_design', d)} />,
        gene_keys: <GeneKeysForm data={profile.gene_keys} onChange={d => setSystemData('gene_keys', d)} />,
        numerology: <NumerologyForm data={profile.numerology} onChange={d => setSystemData('numerology', d)} birthDate={profile.birth_date} firstName={profile.first_name} lastName={profile.last_name} />,
        tarot_archetype: <TarotForm data={profile.tarot_archetype} onChange={d => setSystemData('tarot_archetype', d)} birthDate={profile.birth_date} />,
        enneagram: <EnneagramForm data={profile.enneagram} onChange={d => setSystemData('enneagram', d)} />,
        chakras: <ChakraForm data={profile.chakras} onChange={d => setSystemData('chakras', d)} />,
    };

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-8 space-y-6"><TobaccoGuide>We can explore these systems together, if you are curious. They offer perspectives for reflection. Your own experiences, needs, and choices remain yours to define.</TobaccoGuide><p className="living-muted">An optional deeper layer. Your journal, full pattern history, reports, and everyday practices stay free without setting up any system.</p><PlantCompanions /></div>

                {/* Header */}
                {/* ── The Loom: hero of the cosmos ── */}
                <SkyField className="mb-10 rounded-[var(--radius)]">
                    <div className="max-w-lg mx-auto px-6 py-8" ref={loomRef}>
                        <h1 className="text-4xl text-center" style={{ color: 'var(--gh-cream)' }}>Your Loom</h1>
                        <p className="text-sm text-center mt-1 mb-6" style={{ color: 'rgba(255,253,246,0.85)' }}>
                            Seven systems, one map. Tap a point or a thread.
                        </p>
                        <Loom profile={profile} onDeepDive={openDeepDive} />
                        <div className="text-center mt-4" data-html2canvas-ignore="true">
                            <button type="button" className="ghost-cream-button text-xs py-2"
                                onClick={async () => { try { await shareNodeAsImage(loomRef.current, 'my-loom.png'); } catch { /* capture is best-effort */ } }}>
                                Save your Loom as an image
                            </button>
                        </div>
                    </div>
                </SkyField>

                <div className="mb-6">
                    <ConflictNotice profile={profile} onUseComputed={useComputed} />
                </div>

                {isDirty && (
                    <div className="sticky top-2 z-30 mb-6 flex items-center justify-between p-3"
                        style={{ background: 'var(--gh-ink)', color: 'var(--gh-field)' }}>
                        <span className="text-sm">Unsaved changes to your cosmos.</span>
                        <Button onClick={saveProfile} disabled={isSaving} size="sm"
                            style={{ background: 'var(--gh-gold)', color: 'var(--gh-ink)' }}>
                            <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving…' : 'Save profile'}
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 w-full grid grid-cols-4"
                        style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                        <TabsTrigger value="systems">Systems</TabsTrigger>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="correspondences">Connections</TabsTrigger>
                        <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Toggle Systems ── */}
                    <TabsContent value="systems" className="space-y-6">
                        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Choose your systems</h3>
                            <p className="text-sm mb-2" style={{ color: 'var(--gh-ink-muted)' }}>
                                Turn on the wisdom frameworks you resonate with. Enabled systems weave into your loom, readings, and daily weather.
                            </p>
                            <SystemToggle enabledSystems={enabledSystems} onToggle={toggleSystem} />
                        </div>

                        {/* Birth Data */}
                        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Name & birth data</h3>
                            <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>
                                Your name feeds the numerology (expression, soul urge, life path). Your birth date computes everything derivable exactly.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>First Name</Label>
                                    <Input className="mt-1" placeholder="Your first name" value={profile.first_name}
                                        onChange={e => setProfile(prev => ({ ...prev, first_name: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>Last Name</Label>
                                    <Input className="mt-1" placeholder="Your last name" value={profile.last_name}
                                        onChange={e => setProfile(prev => ({ ...prev, last_name: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>Date of Birth</Label>
                                    <Input type="date" className="mt-1" value={profile.birth_date}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_date: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>Time of Birth <span className="text-xs opacity-60">(optional)</span></Label>
                                    <Input type="time" className="mt-1" value={profile.birth_time}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_time: e.target.value }))} />
                                </div>
                                <div />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>City of Birth</Label>
                                    <Input className="mt-1" placeholder="e.g. Denver" value={profile.birth_city || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_city: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>State / Region <span className="text-xs opacity-60">(optional)</span></Label>
                                    <Input className="mt-1" placeholder="e.g. Colorado" value={profile.birth_state || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_state: e.target.value }))} />
                                </div>
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>Country of Birth</Label>
                                    <Input className="mt-1" placeholder="e.g. United States" value={profile.birth_country || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_country: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={saveProfile} disabled={isSaving} className="ink-button text-sm inline-flex items-center disabled:opacity-60">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving…' : 'Save your cosmos'}
                            </button>
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: Profile Detail Forms ── */}
                    <TabsContent value="profile" className="space-y-6">
                        {/* Sacred Geometry Blueprint */}
                        <div className="p-6 flex flex-col items-center" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1 w-full" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Your cosmic blueprint</h3>
                            <p className="text-sm mb-3 w-full" style={{ color: 'var(--gh-ink-muted)' }}>Systems light up as you fill in your profile data</p>
                            <div className="w-full mb-4 p-4" style={{ background: 'color-mix(in srgb, var(--gh-gold) 10%, transparent)', borderLeft: '2px solid var(--gh-gold)' }}>
                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--gh-ink)' }}>Computed, not generated</p>
                                <p className="text-xs" style={{ color: 'var(--gh-ink-soft)' }}>
                                    Everything derivable from your name and birth date — Sun sign, decan, every core
                                    numerology number, your birth and shadow cards — is calculated exactly, in-app, and
                                    fills itself in below. Moon, Rising, North Node, Human Design and Gene Keys need
                                    precise ephemeris math this app doesn&apos;t do yet: pull them once from a chart
                                    service you trust and enter them here. Nothing on your loom is ever guessed.
                                </p>
                            </div>
                        </div>

                        {enabledSystems.length === 0 ? (
                            <div className="p-12 text-center" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                                <p className="font-medium mb-1" style={{ color: 'var(--gh-ink)', fontFamily: 'Space Grotesk, sans-serif' }}>No systems woven yet</p>
                                <p className="text-sm" style={{ color: 'var(--gh-ink-muted)' }}>
                                    Go to the Systems tab and toggle on at least one system to enter your profile.
                                </p>
                            </div>
                        ) : (
                            enabledSystems.map(systemId => {
                                const system = SYSTEMS.find(s => s.id === systemId);
                                if (!system) return null;
                                return (
                                    <div key={systemId} className="p-6"
                                        style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                                        <div className="flex items-center gap-3 mb-5">
                                            <system.Icon className="w-6 h-6 shrink-0" style={{ color: 'var(--gh-accent)' }} aria-hidden="true" />
                                            <div>
                                                <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>{system.label}</h3>
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--gh-ink-muted)' }}>{system.description}</p>
                                            </div>
                                        </div>
                                        {systemForms[systemId]}
                                    </div>
                                );
                            })
                        )}
                        {enabledSystems.length > 0 && (
                            <div className="flex justify-end">
                                <button type="button" onClick={saveProfile} disabled={isSaving} className="ink-button text-sm inline-flex items-center disabled:opacity-60">
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving…' : 'Save your cosmos'}
                                </button>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Tab 3: Connections ── */}
                    <TabsContent value="correspondences" className="space-y-6">
                        <CorrespondenceMap enabledSystems={enabledSystems} profile={profile} />
                    </TabsContent>

                    {/* ── Tab 4: Deep Dive ── */}
                    <TabsContent value="deepdive" className="space-y-6">
                        <div className="p-5" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <p className="text-sm" style={{ color: 'var(--gh-ink-soft)' }}>
                                Each system below has a full structured breakdown and a deep reading composed from your profile — computed from content tables, never generated. Each can be exported as a PDF.
                            </p>
                        </div>
                        <SystemReports enabledSystems={enabledSystems} profile={profile} cosmicProfile={profile}
                            openSystem={deepDive.system} openNonce={deepDive.nonce} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
