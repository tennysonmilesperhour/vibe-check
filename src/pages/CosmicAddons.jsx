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
import AstrologyGuide from "@/components/cosmic/AstrologyGuide";
import SystemReports from "@/components/cosmic/SystemReport";
import CorrespondenceMap from "@/components/cosmic/CorrespondenceMap";
import Loom from "@/features/loom/Loom";
import TarotTable from "@/features/cosmos/TarotTable";
import SymbolicReadings from "@/features/cosmos/SymbolicReadings";
import GuardedReading from "@/features/cosmos/GuardedReading";
import useHardMoment from "@/features/cosmos/useHardMoment";
import ConflictNotice from "@/features/cosmos/ConflictNotice";
import { followBirthCard, withComputedCard } from "@/lib/resonance/tarotCards";
import { holdsRetiredFields, settleCosmicProfile, settleOnSave } from "@/lib/resonance/settle";
import SkyField from "@/features/shell/SkyField";
import { useSearchParamState } from "@/lib/deeplink";
import PlantVoice from '@/features/shell/PlantVoice';
import { PlantCompanions } from '@/features/practice/SomaticPractice';
import useBeforeUnload from '@/hooks/use-before-unload';

const EMPTY_PROFILE = {
    first_name: "",
    last_name: "",
    birth_date: "",
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
    // Saving is paused until the real profile has loaded, so a failed load can
    // never be saved over the person's actual profile.
    const [profileLoad, setProfileLoad] = useState('loading'); // loading | ready | error
    // Readings come from the person's own choices: a saved profile or changes
    // on this page, never from the page's starting defaults.
    const [hasSavedProfile, setHasSavedProfile] = useState(false);
    // A birth time or place saved before October 2026, which a save removes.
    const [heldBirthPlace, setHeldBirthPlace] = useState(false);
    const loomRef = useRef(null);

    // Two-way URL sync: back button and refresh keep your place.
    const [activeTab, setActiveTab] = useSearchParamState('tab', 'systems');
    // Deep-dive target from the Loom: which system to open + a nonce so repeat
    // taps on the same system re-trigger the expand-and-scroll.
    const [deepDive, setDeepDive] = useState({ system: null, nonce: 0 });
    const isDirty = JSON.stringify(profile) !== savedSnapshot;
    useBeforeUnload(isDirty);
    // After a hard moment, every tab with a reading waits until the person
    // asks for them once on this visit. The Loom's map stays.
    const [readAnyway, setReadAnyway] = useState(false);
    const guard = useHardMoment({ watching: !readAnyway });
    const [skippedCheck, setSkippedCheck] = useState(() => new Set());
    const guarded = (tab, reading) => (
        <GuardedReading guard={guard} readAnyway={readAnyway || skippedCheck.has(tab)} onReadAnyway={() => setReadAnyway(true)}
            onSkipCheck={() => setSkippedCheck((tabs) => new Set(tabs).add(tab))}>{reading}</GuardedReading>
    );

    // Loom "Deep dive into X" → jump to the Deep Dive tab, open that system.
    const openDeepDive = (system) => {
        setActiveTab('deepdive');
        setDeepDive((d) => ({ system, nonce: d.nonce + 1 }));
    };

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        setProfileLoad('loading');
        try {
            const user = await base44.auth.me();
            if (user?.cosmic_profile) {
                const merged = settleCosmicProfile({ ...EMPTY_PROFILE, ...user.cosmic_profile });
                setProfile(merged);
                setSavedSnapshot(JSON.stringify(merged));
                setHasSavedProfile(true);
                setHeldBirthPlace(holdsRetiredFields(user.cosmic_profile));
            }
            setProfileLoad('ready');
        } catch {
            setProfileLoad('error');
        }
    };

    const saveProfile = async () => {
        if (profileLoad !== 'ready') {
            toast({ title: "Your saved profile has not loaded", description: "Saving is paused so it cannot overwrite your profile. Try loading it again.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const settled = settleOnSave(profile);
            await base44.auth.updateMe({ cosmic_profile: settled });
            // Keep any edit made while saving; it settles on the next save.
            setProfile(prev => (prev === profile ? settled : prev));
            setSavedSnapshot(JSON.stringify(settled));
            setHasSavedProfile(true);
            setHeldBirthPlace(false);
            toast({ title: "Cosmic profile saved", description: "Your loom and readings now weave from these systems." });
        } catch (e) {
            toast({ title: "Could not save", description: e?.message, variant: "destructive" });
        }
        setIsSaving(false);
    };

    /** One-tap fix from ConflictNotice: adopt the computed value. */
    const useComputed = (conflict) => {
        const [systemKey, field] = conflict.field.split('.');
        setProfile(prev => {
            if (conflict.field === 'tarot_archetype.birth_card') return { ...prev, tarot_archetype: withComputedCard(prev.tarot_archetype, prev.birth_date) };
            const system = { ...(prev[systemKey] || {}), [field]: String(conflict.computed) };
            if (conflict.field === 'astrology.sun_sign') system.sun_source = 'date_estimate';
            return { ...prev, [systemKey]: system };
        });
    };

    /** From ConflictNotice: keep a saved birth card as the person's own choice. */
    const keepSaved = (conflict) => {
        if (conflict.field !== 'tarot_archetype.birth_card') return;
        setProfile(prev => ({ ...prev, tarot_archetype: { ...(prev.tarot_archetype || {}), birth_card_source: 'entered' } }));
    };

    // A birth card worked out from the birth date follows it, even while the tarot form is closed.
    const setBirthDate = (birthDate) => setProfile(prev => ({
        ...prev,
        birth_date: birthDate,
        tarot_archetype: followBirthCard(prev.tarot_archetype, birthDate),
    }));

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
                {profileLoad === 'error' && <p className="living-error mb-6" role="alert">We could not load your saved profile. Saving is paused so nothing overwrites it. <button type="button" className="underline" onClick={loadProfile}>Try again</button></p>}<div className="mb-8 space-y-6"><PlantVoice>We can explore these systems together, if you are curious. They offer perspectives for reflection. Your own experiences, needs, and choices remain yours to define.</PlantVoice><p className="living-muted">An optional deeper layer. Your journal, full pattern history, reports, and everyday practices stay free without setting up any system.</p><PlantCompanions /></div>

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
                    <ConflictNotice profile={profile} onUseComputed={useComputed} onKeepSaved={keepSaved} />
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
                    <TabsList className="mb-6 w-full h-auto grid grid-cols-3 sm:grid-cols-6"
                        style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                        <TabsTrigger value="systems">Systems</TabsTrigger>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="correspondences">Connections</TabsTrigger>
                        <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
                        <TabsTrigger value="readings">Readings</TabsTrigger>
                        <TabsTrigger value="tarot">Tarot & Oracle</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Toggle Systems ── */}
                    <TabsContent value="systems" className="space-y-6">
                    <fieldset disabled={profileLoad !== 'ready'} className="space-y-6 min-w-0 border-0 p-0 m-0" aria-busy={profileLoad === 'loading'}>
                        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Choose your systems</h3>
                            <p className="text-sm mb-2" style={{ color: 'var(--gh-ink-muted)' }}>
                                Turn on the wisdom frameworks you resonate with. Enabled systems weave into your loom, readings, and daily weather.
                            </p>
                            <SystemToggle enabledSystems={enabledSystems} onToggle={toggleSystem} />
                        </div>

                        {/* Name and birth date */}
                        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Name & birth date</h3>
                            <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>
                                Your name feeds the numerology (expression, soul urge, life path). Your birth date supports numerology calculations, tarot birth cards, and an approximate Sun sign in the tropical zodiac. Vibe Check doesn't ask for your birth time or place, since nothing here uses them.
                            </p>
                            {heldBirthPlace && <p className="text-sm mb-5" role="note" style={{ color: 'var(--gh-ink)' }}>Your saved profile still holds a birth time or place you entered before. Saving your cosmos removes it.</p>}
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
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label style={{ color: 'var(--gh-ink-soft)' }}>Date of Birth</Label>
                                    <Input type="date" className="mt-1" value={profile.birth_date}
                                        onChange={e => setBirthDate(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={saveProfile} disabled={isSaving} className="ink-button text-sm inline-flex items-center disabled:opacity-60">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving…' : 'Save your cosmos'}
                            </button>
                        </div>
                    </fieldset>
                    </TabsContent>

                    {/* ── Tab 2: Profile Detail Forms ── */}
                    <TabsContent value="profile" className="space-y-6">
                    <fieldset disabled={profileLoad !== 'ready'} className="space-y-6 min-w-0 border-0 p-0 m-0" aria-busy={profileLoad === 'loading'}>
                        {/* Sacred Geometry Blueprint */}
                        <div className="p-6 flex flex-col items-center" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 className="text-base font-bold mb-1 w-full" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>Your cosmic blueprint</h3>
                            <p className="text-sm mb-3 w-full" style={{ color: 'var(--gh-ink-muted)' }}>Systems light up as you fill in your profile data</p>
                            <div className="w-full mb-4 p-4" style={{ background: 'color-mix(in srgb, var(--gh-gold) 10%, transparent)', borderLeft: '2px solid var(--gh-gold)' }}>
                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--gh-ink)' }}>Begin with what you know</p>
                                <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>
                                    Your birth date gives an approximate Sun sign and decan, along with numerology and tarot correspondences.
                                    Enter known astrology placements, houses, and aspects from an accurate birth chart. Leave anything unknown blank.
                                    Your readings use the details you provide and keep symbolic interpretation separate from your own lived record.
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
                    </fieldset>
                    </TabsContent>

                    {/* ── Tab 3: Connections ── */}
                    <TabsContent value="correspondences" className="space-y-6">
                        {guarded('correspondences', <CorrespondenceMap enabledSystems={enabledSystems} profile={profile} />)}
                    </TabsContent>

                    {/* ── Tab 4: Deep Dive ── */}
                    <TabsContent value="deepdive" className="space-y-6">
                        {guarded('deepdive', <>
                            <div className="p-5" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                                <p className="text-sm" style={{ color: 'var(--gh-ink-soft)' }}>
                                    Explore the systems you have chosen through your profile details, reflective questions, and small experiments. You can save each reading as a PDF.
                                </p>
                            </div>
                            {enabledSystems.includes("astrology") && <AstrologyGuide />}
                            <SystemReports enabledSystems={enabledSystems} profile={profile} cosmicProfile={profile}
                                openSystem={deepDive.system} openNonce={deepDive.nonce} />
                        </>)}
                    </TabsContent>

                    {/* ── Tab 5: Readings for the day, week, month and year ── */}
                    <TabsContent value="readings" className="space-y-6">
                        {guarded('readings', <SymbolicReadings profile={hasSavedProfile || isDirty ? profile : null} profileLoad={profileLoad} />)}
                    </TabsContent>

                    {/* ── Tab 6: Tarot & Oracle ── */}
                    <TabsContent value="tarot">
                        {guarded('tarot', <TarotTable />)}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
