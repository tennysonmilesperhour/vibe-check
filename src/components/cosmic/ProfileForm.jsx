import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    HUMAN_DESIGN_TYPES, HUMAN_DESIGN_AUTHORITIES, HUMAN_DESIGN_PROFILES,
    GENE_KEY_NUMBERS, LIFE_PATH_NUMBERS, TAROT_MAJOR_ARCANA, CHAKRA_CENTERS,
    ENNEAGRAM_TYPES, ENNEAGRAM_WINGS, ENNEAGRAM_INSTINCTS
} from "./correspondences";
// One source of truth for every derivation — the resonance engine. The forms
// used to carry their own copies of this math, which quietly drifted from the
// engine that feeds the Loom (e.g. two different Life Path methods). Importing
// the engine keeps the "auto" badges honest and the Loom in agreement.
import {
    lifePath, expression, soulUrge, personality, birthdayNumber, maturity,
    personalYear, personalMonth, personalDay, karmicDebts,
} from "@/lib/resonance/numerology";
import AstrologyProfile from "./AstrologyProfile";
import { arcanaName } from "@/lib/resonance/tables";
import { birthCards, yearCard } from "@/lib/resonance/tarotCards";
import { todayKey } from "@/lib/dates";

const str = (n) => (n == null ? null : String(n));

// Tarot cards render as "N – Name" to match the select option strings.
const cardLabel = (id) => (id == null ? null : `${id} – ${arcanaName(id)}`);
function birthCardLabel(birthDate) {
    const cards = birthCards(birthDate);
    return cards ? cardLabel(cards.personality.id) : null;
}
function soulCardLabel(birthDate) {
    const cards = birthCards(birthDate);
    return cards && cards.soul.id !== cards.personality.id ? cardLabel(cards.soul.id) : null;
}
function yearCardLabel(birthDate) {
    const card = birthDate ? yearCard(birthDate, Number(todayKey().slice(0, 4))) : null;
    return card ? cardLabel(card.id) : null;
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm font-medium" style={{ color: 'var(--gh-ink-soft)' }}>{label}</Label>
            {hint && <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>{hint}</p>}
            {children}
        </div>
    );
}

/** Small amber pill used to flag a value the app computed for you. */
function AutoBadge() {
    return (
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-sm pointer-events-none"
            style={{ background: 'color-mix(in srgb, var(--gh-gold) 22%, transparent)', color: 'var(--gh-ink-soft)', border: '1px solid color-mix(in srgb, var(--gh-gold) 45%, transparent)' }}>
            computed
        </span>
    );
}

/** A read-only chip showing something we derived from the birth date/name. */
function DerivedChip({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: 'color-mix(in srgb, var(--gh-gold) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--gh-gold) 35%, transparent)' }}>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--gh-ink-muted)' }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--gh-ink)' }}>{value}</span>
        </div>
    );
}

function SimpleSelect({ value, onChange, options, placeholder }) {
    return (
        <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className="mt-1">
                <SelectValue placeholder={placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
                {options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export const AstrologyForm = AstrologyProfile;

export function HumanDesignForm({ data, onChange }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Type" hint="Your fundamental energetic strategy for engaging with life">
                <SimpleSelect value={data?.type} onChange={v => set('type', v)} options={HUMAN_DESIGN_TYPES} />
            </Field>
            <Field label="Authority" hint="Your inner decision-making intelligence">
                <SimpleSelect value={data?.authority} onChange={v => set('authority', v)} options={HUMAN_DESIGN_AUTHORITIES} />
            </Field>
            <Field label="Profile" hint="Your role in the world and how you learn">
                <SimpleSelect value={data?.profile} onChange={v => set('profile', v)} options={HUMAN_DESIGN_PROFILES} />
            </Field>
            <Field label="Definition" hint="How consistently your energy flows">
                <SimpleSelect value={data?.definition} onChange={v => set('definition', v)} options={["Single Definition", "Split Definition", "Triple Split", "Quadruple Split"]} />
            </Field>
            <div className="md:col-span-2">
                <Field label="Incarnation Cross" hint="Your life's overarching purpose theme">
                    <Input className="mt-1" value={data?.incarnation_cross || ''} onChange={e => set('incarnation_cross', e.target.value)} placeholder="e.g. Right Angle Cross of the Sphinx" />
                </Field>
            </div>
            <div className="md:col-span-2">
                <Field label="Strategy">
                    <Input className="mt-1" value={data?.strategy || ''} onChange={e => set('strategy', e.target.value)} placeholder="e.g. To Respond, To Wait for the Invitation..." />
                </Field>
            </div>
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Open/defined centers, channels, gates you want referenced..." />
                </Field>
            </div>
        </div>
    );
}

export function GeneKeysForm({ data, onChange }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    const keyFields = [
        { key: 'life_work', label: "Life's Work (Personality Sun)", hint: "Your work in the world; also your Conscious Sun gate in Human Design" },
        { key: 'evolution', label: "Evolution (Personality Earth)", hint: "The challenges you grow through" },
        { key: 'radiance', label: "Radiance (Design Sun)", hint: "Health and vitality" },
        { key: 'purpose', label: "Purpose (Design Earth)", hint: "What grounds you" },
        { key: 'attraction', label: "Attraction (Design Moon)", hint: "Your closest relationships" },
        { key: 'iq', label: "IQ (Personality Venus)", hint: "How you think and learn" },
    ];
    return (
        <div className="grid md:grid-cols-2 gap-5">
            {keyFields.map(({ key, label, hint }) => (
                <Field key={key} label={label} hint={hint}>
                    <SimpleSelect value={data?.[key]} onChange={v => set(key, v)} options={GENE_KEY_NUMBERS} placeholder="Key 1–64" />
                </Field>
            ))}
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Shadow patterns, gifts you've noticed, contemplations..." />
                </Field>
            </div>
        </div>
    );
}

export function NumerologyForm({ data, onChange, birthDate, firstName, lastName }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const autos = {
        life_path: str(lifePath(birthDate)),
        expression: fullName ? str(expression(fullName)) : null,
        soul_urge: fullName ? str(soulUrge(fullName)) : null,
        personality: fullName ? str(personality(fullName)) : null,
        birthday: str(birthdayNumber(birthDate)),
        maturity: fullName ? str(maturity(birthDate, fullName)) : null,
        personal_year: birthDate ? str(personalYear(birthDate, todayKey())) : null,
    };

    // Read-only cycles + karmic debts (informational, not stored form fields).
    const pMonth = birthDate ? personalMonth(birthDate, todayKey()) : null;
    const pDay = birthDate ? personalDay(birthDate, todayKey()) : null;
    const debts = karmicDebts(birthDate, fullName);

    useEffect(() => {
        const updates = {};
        for (const [key, val] of Object.entries(autos)) {
            if (val && !data?.[key]) updates[key] = val;
        }
        if (Object.keys(updates).length > 0) onChange({ ...data, ...updates });
    }, [birthDate, firstName, lastName]); // eslint-disable-line react-hooks/exhaustive-deps

    const fields = [
        { key: 'life_path', label: 'Life Path Number', hint: 'The path itself — from your birth date' },
        { key: 'expression', label: 'Expression Number', hint: 'Your gifts & destiny — from your full name' },
        { key: 'soul_urge', label: 'Soul Urge Number', hint: "Your heart's desire — from the vowels in your name" },
        { key: 'personality', label: 'Personality Number', hint: 'Your outer self — from the consonants in your name' },
        { key: 'birthday', label: 'Birthday Number', hint: 'A special gift — from the day you were born' },
        { key: 'maturity', label: 'Maturity Number', hint: 'Who you grow into — Life Path + Expression' },
        { key: 'personal_year', label: 'Personal Year Number', hint: 'This year’s theme — birth date + current year' },
    ];

    return (
        <div className="grid md:grid-cols-2 gap-5">
            {fields.map(({ key, label, hint }) => (
                <Field key={key} label={label} hint={hint}>
                    <div className="relative">
                        <SimpleSelect value={data?.[key]} onChange={v => set(key, v)} options={LIFE_PATH_NUMBERS} />
                        {autos[key] && data?.[key] === autos[key] && <AutoBadge />}
                    </div>
                </Field>
            ))}

            {(pMonth != null || pDay != null || debts.length > 0) && (
                <div className="md:col-span-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <DerivedChip label="Personal Month" value={pMonth != null ? str(pMonth) : null} />
                        <DerivedChip label="Personal Day" value={pDay != null ? str(pDay) : null} />
                    </div>
                    {debts.length > 0 && (
                        <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>
                            Karmic debt: {debts.map(d => `${d.number} (${d.source})`).join(', ')}
                        </p>
                    )}
                </div>
            )}

            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Any other numbers or calculations you want referenced..." />
                </Field>
            </div>
        </div>
    );
}

export function TarotForm({ data, onChange, birthDate }) {
    const set = (key, val) => onChange({ ...data, [key]: val });

    const autoBirthCard = birthCardLabel(birthDate);
    const autoSoulCard = soulCardLabel(birthDate);
    const autoYearCard = yearCardLabel(birthDate);

    useEffect(() => {
        if (autoBirthCard && !data?.birth_card) onChange({ ...data, birth_card: autoBirthCard });
    }, [birthDate]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Birth Card" hint="Worked out from your birth date by Mary K. Greer's method">
                <div className="relative">
                    <SimpleSelect value={data?.birth_card} onChange={v => set('birth_card', v)} options={TAROT_MAJOR_ARCANA} />
                    {autoBirthCard && data?.birth_card === autoBirthCard && <AutoBadge />}
                </div>
            </Field>
            <Field label="Shadow Card" hint="Optional, if a tarot practice you follow names one">
                <SimpleSelect value={data?.shadow_card} onChange={v => set('shadow_card', v)} options={TAROT_MAJOR_ARCANA} />
            </Field>

            {(autoSoulCard || autoYearCard) && (
                <div className="md:col-span-2 flex flex-wrap gap-2">
                    {autoSoulCard && <DerivedChip label="Soul Card" value={autoSoulCard} />}
                    {autoYearCard && <DerivedChip label="Year Card" value={autoYearCard} />}
                </div>
            )}

            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Suit affinities, spread patterns, anything else..." />
                </Field>
            </div>
        </div>
    );
}

export function EnneagramForm({ data, onChange }) {
    const set = (key, val) => onChange({ ...data, [key]: val });

    // Narrow wing options to the selected type's two neighbors (e.g. type 4 → 4w3, 4w5)
    const typeNum = data?.type ? data.type.split(' ')[0] : null;
    const wingOptions = typeNum
        ? ENNEAGRAM_WINGS.filter(w => w.startsWith(typeNum + 'w'))
        : ENNEAGRAM_WINGS;

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Type" hint="Your core motivation — the fear you avoid and the desire that drives you">
                <SimpleSelect value={data?.type} onChange={v => set('type', v)} options={ENNEAGRAM_TYPES} />
            </Field>
            <Field label="Wing" hint="The neighboring type that flavors how your core type expresses">
                <SimpleSelect value={data?.wing} onChange={v => set('wing', v)} options={wingOptions} />
            </Field>
            <Field label="Instinctual Variant" hint="Which survival drive leads: self-preservation, social, or one-to-one">
                <SimpleSelect value={data?.instinct} onChange={v => set('instinct', v)} options={ENNEAGRAM_INSTINCTS} />
            </Field>
            <Field label="Three-center type" hint="Optional: the type you lean on in each center, head, heart and body, e.g. 469 or 358">
                <Input className="mt-1" value={data?.tritype || ''} onChange={e => set('tritype', e.target.value)} placeholder="e.g. 469" />
            </Field>
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Growth/stress patterns you've noticed, levels of health, subtype details..." />
                </Field>
            </div>
        </div>
    );
}

const CHAKRA_FOCUS_OPTIONS = [
    "Root (Muladhara) – Safety & grounding",
    "Sacral (Svadhisthana) – Creativity & pleasure",
    "Solar Plexus (Manipura) – Power & will",
    "Heart (Anahata) – Love & connection",
    "Throat (Vishuddha) – Expression & truth",
    "Third Eye (Ajna) – Intuition & insight",
    "Crown (Sahasrara) – Consciousness & unity"
];

export function ChakraForm({ data, onChange }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    const focusAreas = data?.focus_areas || [];
    const toggleFocus = (area) => {
        const next = focusAreas.includes(area)
            ? focusAreas.filter(a => a !== area)
            : [...focusAreas, area];
        set('focus_areas', next);
    };
    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Dominant Center" hint="The chakra you want to focus on">
                <SimpleSelect value={data?.dominant_center} onChange={v => set('dominant_center', v)} options={CHAKRA_CENTERS} />
            </Field>
            <div className="md:col-span-2">
                <Field label="Focus Areas" hint="Chakras you're actively working with or want referenced in insights">
                    <div className="mt-2 flex flex-wrap gap-2">
                        {CHAKRA_FOCUS_OPTIONS.map(area => {
                            const active = focusAreas.includes(area);
                            const short = area.split(' – ')[0];
                            return (
                                <button key={area} type="button" onClick={() => toggleFocus(area)}
                                    className="px-3 py-1.5 rounded-sm text-xs font-medium transition-all"
                                    style={{
                                        background: active ? 'color-mix(in srgb, var(--gh-accent) 16%, transparent)' : 'var(--gh-cream)',
                                        border: active ? '1px solid var(--gh-accent)' : '1px solid hsl(var(--border))',
                                        color: active ? 'var(--gh-accent)' : 'var(--gh-ink-muted)',
                                    }}>
                                    {short}
                                </button>
                            );
                        })}
                    </div>
                </Field>
            </div>
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Areas of focus, practices, imbalances you're working with..." />
                </Field>
            </div>
        </div>
    );
}
