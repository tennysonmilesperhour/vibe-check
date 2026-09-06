import React, { useState, useEffect, useRef } from "react";
import { shareNodeAsImage } from "@/lib/share";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Save } from "lucide-react";
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

export default function CosmicAddons() {
    const { toast } = useToast();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(EMPTY_PROFILE));
    const [isSaving, setIsSaving] = useState(false);
    const loomRef = useRef(null);

    // Two-way URL sync: back button and refresh keep your place.
    const [activeTab, setActiveTab] = useSearchParamState('tab', 'systems');
    const isDirty = JSON.stringify(profile) !== savedSnapshot;

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
            toast({ title: "Cosmic profile saved", description: "Your systems are active and will inform AI insights." });
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
        <div className="cosmos-almanac px-4 py-6 sm:p-6 space-y-8 min-h-screen relative">
            <div className="max-w-6xl mx-auto relative z-10">

                {/* Header */}
                {/* ── The Loom: hero of the cosmos ── */}
                <SkyField className="cosmos-almanac__loom mb-8" showSun={false} showVeilLine={false} veilIntensity={0.5}>
                    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8" ref={loomRef}>
                        <h1 className="text-4xl text-center" style={{ color: 'var(--gh-cream)' }}>Your Loom</h1>
                        <p className="text-sm text-center mt-1 mb-6" style={{ color: 'rgba(255,253,246,0.85)' }}>
                            Seven systems set within one mandala. Tap a placement or a connecting chord.
                        </p>
                        <Loom profile={profile} onDeepDive={() => setActiveTab('deepdive')} />
                        <nav className="loom-system-key" aria-label="Cosmos systems">
                            {SYSTEMS.map((system) => {
                                const active = enabledSystems.includes(system.id);
                                return (
                                    <button
                                        key={system.id}
                                        type="button"
                                        data-active={active}
                                        onClick={() => setActiveTab(active ? 'profile' : 'systems')}
                                        aria-label={`${system.label}, ${active ? 'active' : 'not active'}`}
                                    >
                                        <span aria-hidden="true">{system.emoji}</span>{system.label}
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="loom-provenance" aria-label="Loom information key">
                            <span><i data-kind="wheel" />True wheel position</span>
                            <span><i data-kind="inner" />Sevenfold vertex</span>
                            <span><i data-kind="today" />Active today</span>
                        </div>
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
                            style={{ background: 'var(--gh-gold)', color: 'var(--gh-ink)', borderRadius: 'var(--radius)' }}>
                            <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving…' : 'Save profile'}
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 h-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-1 p-1"
                        style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))' }}>
                        <TabsTrigger value="systems">Choose systems</TabsTrigger>
                        <TabsTrigger value="profile">Enter details</TabsTrigger>
                        <TabsTrigger value="correspondences">See connections</TabsTrigger>
                        <TabsTrigger value="deepdive">Read profile</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Toggle Systems ── */}
                    <TabsContent value="systems" className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="font-sans text-base font-bold mb-1" style={{ color: 'var(--gh-ink)' }}>Choose your systems</h3>
                            <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-soft)' }}>
                                Choose the reflection frameworks you use. Only enabled systems appear in optional AI readings.
                            </p>
                            <SystemToggle enabledSystems={enabledSystems} onToggle={toggleSystem} />
                        </div>

                        {/* Birth Data */}
                        <div className="glass-card p-6">
                            <h3 className="font-sans text-base font-bold mb-1" style={{ color: 'var(--gh-ink)' }}>Name and birth data</h3>
                            <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-soft)' }}>
                                Your name is used for numerology calculations (expression number, soul urge, life path). Birth data helps calculate or verify your charts.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label htmlFor="cosmos-first-name" style={{ color: 'var(--gh-ink)' }}>First name</Label>
                                    <Input id="cosmos-first-name" className="mt-1" placeholder="Your first name" value={profile.first_name} maxLength={100}
                                        onChange={e => setProfile(prev => ({ ...prev, first_name: e.target.value }))} />
                                </div>
                                <div>
                                    <Label htmlFor="cosmos-last-name" style={{ color: 'var(--gh-ink)' }}>Last name</Label>
                                    <Input id="cosmos-last-name" className="mt-1" placeholder="Your last name" value={profile.last_name} maxLength={100}
                                        onChange={e => setProfile(prev => ({ ...prev, last_name: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="cosmos-birth-date" style={{ color: 'var(--gh-ink)' }}>Date of birth</Label>
                                    <Input id="cosmos-birth-date" type="date" className="mt-1" value={profile.birth_date}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_date: e.target.value }))} />
                                </div>
                                <div>
                                    <Label htmlFor="cosmos-birth-time" style={{ color: 'var(--gh-ink)' }}>Time of birth <span className="text-xs">(optional)</span></Label>
                                    <Input id="cosmos-birth-time" type="time" className="mt-1" value={profile.birth_time}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_time: e.target.value }))} />
                                </div>
                                <div />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label htmlFor="cosmos-birth-city" style={{ color: 'var(--gh-ink)' }}>City of birth</Label>
                                    <Input id="cosmos-birth-city" className="mt-1" placeholder="For example, Denver" value={profile.birth_city || ''} maxLength={120}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_city: e.target.value }))} />
                                </div>
                                <div>
                                    <Label htmlFor="cosmos-birth-region" style={{ color: 'var(--gh-ink)' }}>State or region <span className="text-xs">(optional)</span></Label>
                                    <Input id="cosmos-birth-region" className="mt-1" placeholder="For example, Colorado" value={profile.birth_state || ''} maxLength={120}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_state: e.target.value }))} />
                                </div>
                                <div>
                                    <Label htmlFor="cosmos-birth-country" style={{ color: 'var(--gh-ink)' }}>Country of birth</Label>
                                    <Input id="cosmos-birth-country" className="mt-1" placeholder="For example, United States" value={profile.birth_country || ''} maxLength={120}
                                        onChange={e => setProfile(prev => ({ ...prev, birth_country: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={saveProfile} disabled={isSaving} className="btn-cosmic">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving…' : 'Save cosmos settings'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: Profile Detail Forms ── */}
                    <TabsContent value="profile" className="space-y-6">
                        {/* Sacred Geometry Blueprint */}
                        <div className="glass-card p-6 flex flex-col items-center" style={{ border: '1px solid rgba(194,80,60,0.2)' }}>
                            <h3 className="font-sans text-base font-bold mb-1 w-full" style={{ color: 'var(--gh-ink)' }}>Your cosmic profile</h3>
                            <p className="text-sm mb-3 w-full" style={{ color: 'var(--gh-ink-soft)' }}>Your Loom changes as you add profile details.</p>
                            <div className="w-full mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(61,52,80,0.1)' }}>
                                <p className="text-xs" style={{ color: 'var(--gh-ink-soft)' }}>Enter Moon, rising, Human Design, and Gene Keys values from a chart you trust. Vibe Check calculates numerology and Tarot birth cards in the app, but it does not guess specialist chart values with AI.</p>
                            </div>
                        </div>

                        {enabledSystems.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(194,80,60,0.4)' }} />
                                <p className="font-sans font-medium mb-1" style={{ color: 'var(--gh-ink)' }}>No systems enabled</p>
                                <p className="text-sm" style={{ color: 'var(--gh-ink-muted)' }}>
                                    Go to the Systems tab and toggle on at least one system to enter your profile.
                                </p>
                            </div>
                        ) : (
                            enabledSystems.map(systemId => {
                                const system = SYSTEMS.find(s => s.id === systemId);
                                if (!system) return null;
                                return (
                                    <div key={systemId} className="glass-card p-6"
                                        style={{ border: '1px solid rgba(194,80,60,0.2)' }}>
                                        <div className="flex items-center gap-3 mb-5">
                                            <span className="text-2xl">{system.emoji}</span>
                                            <div>
                                                <h3 className="font-sans font-bold" style={{ color: 'var(--gh-ink)' }}>{system.label}</h3>
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
                                <Button onClick={saveProfile} disabled={isSaving} className="btn-cosmic">
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
                            <p className="text-sm" style={{ color: 'var(--gh-ink-soft)' }}>
                                Review the details you entered, then optionally request an AI reflection for any system. AI output may be inaccurate and can be exported as a PDF.
                            </p>
                        </div>
                        <SystemReports enabledSystems={enabledSystems} profile={profile} cosmicProfile={profile} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
