import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ZODIAC_SIGNS, HUMAN_DESIGN_TYPES, HUMAN_DESIGN_AUTHORITIES, HUMAN_DESIGN_PROFILES,
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
import { deriveAstrology } from "@/lib/resonance/astrology";
import { arcanaForLifePath, arcanaName } from "@/lib/resonance/tables";
import { todayKey } from "@/lib/dates";

const str = (n) => (n == null ? null : String(n));
const digitSum = (n) => String(n).split('').reduce((a, d) => a + Number(d), 0);

// Tarot cards render as "N – Name" to match the select option strings.
const cardLabel = (id) => (id == null ? null : `${id} – ${arcanaName(id)}`);
const birthCard = (birthDate) => {
    const lp = lifePath(birthDate);
    return lp !== null ? arcanaForLifePath(lp) : null;
};
function birthCardLabel(birthDate) {
    const card = birthCard(birthDate);
    return card ? cardLabel(card.id) : null;
}
function shadowCardLabel(birthDate) {
    const card = birthCard(birthDate);
    if (!card || card.id <= 9) return null;
    return cardLabel(digitSum(card.id));
}
function yearCardLabel(birthDate) {
    const py = birthDate ? personalYear(birthDate, todayKey()) : null;
    const card = py !== null ? arcanaForLifePath(py) : null;
    return card ? cardLabel(card.id) : null;
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm font-medium" style={{color: 'var(--warm-gray-700)'}}>{label}</Label>
            {hint && <p className="text-xs" style={{color: 'var(--warm-gray-400)'}}>{hint}</p>}
            {children}
        </div>
    );
}

/** Small amber pill used to flag a value the app computed for you. */
function AutoBadge() {
    return (
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
            style={{ background: 'rgba(201,131,75,0.15)', color: '#C9834B', border: '1px solid rgba(201,131,75,0.25)' }}>
            auto
        </span>
    );
}

/** A read-only chip showing something we derived from the birth date/name. */
function DerivedChip({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(201,131,75,0.08)', border: '1px solid rgba(201,131,75,0.2)' }}>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(201,131,75,0.85)' }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: 'rgba(61,52,80,0.9)' }}>{value}</span>
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

const ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd' };

export function AstrologyForm({ data, onChange, birthDate }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    const derived = deriveAstrology(birthDate);
    const autoSign = derived.sun_sign;

    // Fill the Sun sign and stash the sign's fixed attributes so the AI and the
    // deep-dive reports can reference them. Only writes empty fields.
    useEffect(() => {
        if (!autoSign) return;
        const updates = {};
        if (!data?.sun_sign) updates.sun_sign = autoSign;
        for (const k of ['element', 'modality', 'polarity', 'ruler', 'decan', 'decan_ruler']) {
            if (derived[k] != null && data?.[k] == null) updates[k] = str(derived[k]);
        }
        if (Object.keys(updates).length) onChange({ ...data, ...updates });
    }, [birthDate]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Sun Sign" hint="Your core identity and conscious self">
                <div className="relative">
                    <SimpleSelect value={data?.sun_sign} onChange={v => set('sun_sign', v)} options={ZODIAC_SIGNS} />
                    {autoSign && autoSign === data?.sun_sign && <AutoBadge />}
                </div>
            </Field>
            <Field label="Moon Sign" hint="Your emotional nature and inner world (needs birth time)">
                <SimpleSelect value={data?.moon_sign} onChange={v => set('moon_sign', v)} options={ZODIAC_SIGNS} />
            </Field>
            <Field label="Rising / Ascendant" hint="How others see you; your outer mask (needs birth time & place)">
                <SimpleSelect value={data?.rising_sign} onChange={v => set('rising_sign', v)} options={ZODIAC_SIGNS} />
            </Field>
            <Field label="North Node Sign" hint="Your soul's evolutionary direction (needs birth time)">
                <SimpleSelect value={data?.north_node} onChange={v => set('north_node', v)} options={ZODIAC_SIGNS} />
            </Field>

            {autoSign && (
                <div className="md:col-span-2">
                    <p className="text-xs mb-2" style={{ color: 'rgba(105,95,128,0.65)' }}>
                        Derived from your Sun in {autoSign} — no birth time needed:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <DerivedChip label="Element" value={derived.element} />
                        <DerivedChip label="Modality" value={derived.modality} />
                        <DerivedChip label="Polarity" value={derived.polarity} />
                        <DerivedChip label="Ruling Planet" value={derived.ruler} />
                        <DerivedChip label="Decan" value={derived.decan ? `${ORDINAL[derived.decan]} · ${derived.decan_ruler}` : null} />
                    </div>
                </div>
            )}

            <div className="md:col-span-2">
                <Field label="Personal Notes" hint="Anything else about your chart you want the AI to reference">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="e.g. Venus in Scorpio, Saturn return, stellium in 8th house..." />
                </Field>
            </div>
        </div>
    );
}

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
        { key: 'life_work', label: "Life's Work (Conscious Sun)", hint: "What you're here to do — your most visible gift" },
        { key: 'evolution', label: "Evolution (Conscious Earth)", hint: "What grounds your life's work" },
        { key: 'radiance', label: "Radiance (Conscious Moon)", hint: "Your subconscious gift that naturally shines" },
        { key: 'purpose', label: "Purpose (Conscious Node)", hint: "Your soul's higher evolutionary direction" },
        { key: 'attraction', label: "Attraction (Unconscious Sun)", hint: "What you naturally attract into your life" },
        { key: 'iq', label: "IQ (Unconscious Node)", hint: "The deep intelligence shaping your path" },
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
                        <p className="text-xs" style={{ color: 'rgba(105,95,128,0.7)' }}>
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
    const autoShadowCard = shadowCardLabel(birthDate);
    const autoYearCard = yearCardLabel(birthDate);

    useEffect(() => {
        const updates = {};
        if (autoBirthCard && !data?.birth_card) updates.birth_card = autoBirthCard;
        if (autoShadowCard && !data?.shadow_card) updates.shadow_card = autoShadowCard;
        if (Object.keys(updates).length > 0) onChange({ ...data, ...updates });
    }, [birthDate]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Birth Card" hint="Your soul archetype — from your birth date">
                <div className="relative">
                    <SimpleSelect value={data?.birth_card} onChange={v => set('birth_card', v)} options={TAROT_MAJOR_ARCANA} />
                    {autoBirthCard && data?.birth_card === autoBirthCard && <AutoBadge />}
                </div>
            </Field>
            <Field label="Shadow / Teacher Card" hint="The complementary archetype (reduced digit of birth card)">
                <div className="relative">
                    <SimpleSelect value={data?.shadow_card} onChange={v => set('shadow_card', v)} options={TAROT_MAJOR_ARCANA} />
                    {autoShadowCard && data?.shadow_card === autoShadowCard && <AutoBadge />}
                </div>
            </Field>

            {autoYearCard && (
                <div className="md:col-span-2">
                    <p className="text-xs mb-2" style={{ color: 'rgba(105,95,128,0.65)' }}>The card walking with you this personal year:</p>
                    <DerivedChip label="Personal Year Card" value={autoYearCard} />
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
            <Field label="Tritype" hint="Optional — your dominant type in each center, e.g. 469 or 358">
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
            <Field label="Dominant Center" hint="The chakra that most characterizes your nature">
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
                                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                    style={{
                                        background: active ? 'rgba(194,80,60,0.25)' : 'rgba(255,255,255,0.64)',
                                        border: active ? '1px solid rgba(194,80,60,0.5)' : '1px solid rgba(61,52,80,0.12)',
                                        color: active ? '#C2503C' : 'rgba(105,95,128,0.7)',
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
