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
import { birthCards, cardId, cardOption, withChosenCard, withComputedCard, yearCardOn } from "@/lib/resonance/tarotCards";
import { needsPositionCheck, POSITION_CHECK_NOTE, withSphere } from "@/lib/resonance/settle";
import { resolveEnneagram, wingOf } from "@/lib/wisdom/content/enneagram";
import { todayKey } from "@/lib/dates";

const str = (n) => (n == null ? null : String(n));

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
            <Field label="Type" hint="From your Human Design chart: Manifestor, Generator, Manifesting Generator, Projector or Reflector">
                <SimpleSelect value={data?.type} onChange={v => set('type', v)} options={HUMAN_DESIGN_TYPES} />
            </Field>
            <Field label="Authority" hint="What Human Design suggests relying on when you decide">
                <SimpleSelect value={data?.authority} onChange={v => set('authority', v)} options={HUMAN_DESIGN_AUTHORITIES} />
            </Field>
            <Field label="Profile" hint="Two numbers, such as 2/4, that Human Design links with how you learn and relate">
                <SimpleSelect value={data?.profile} onChange={v => set('profile', v)} options={HUMAN_DESIGN_PROFILES} />
            </Field>
            <Field label="Definition" hint="How Human Design describes the links between the defined centers in your chart">
                <SimpleSelect value={data?.definition} onChange={v => set('definition', v)} options={["Single Definition", "Split Definition", "Triple Split", "Quadruple Split"]} />
            </Field>
            <div className="md:col-span-2">
                <Field label="Incarnation Cross" hint="A theme Human Design links with your chart as a whole">
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
            {needsPositionCheck(data) && (
                <div className="md:col-span-2 text-xs p-3" role="note"
                    style={{ color: 'var(--gh-ink-soft)', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)' }}>
                    <p>{POSITION_CHECK_NOTE}</p>
                    <button type="button" onClick={() => onChange({ ...data, positions_checked: true })} className="mt-1 font-bold underline underline-offset-4" style={{ color: 'var(--gh-accent)' }}>
                        They're right
                    </button>
                </div>
            )}
            {keyFields.map(({ key, label, hint }) => (
                <Field key={key} label={label} hint={hint}>
                    <SimpleSelect value={data?.[key]} onChange={v => onChange(withSphere(data, key, v))} options={GENE_KEY_NUMBERS} placeholder="Key 1–64" />
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
        { key: 'life_path', label: 'Life Path Number', hint: 'From your birth date. Numerology reads it as the longer arc of a life' },
        { key: 'expression', label: 'Expression Number', hint: 'From your full birth name. Numerology links it with talents and ways of working' },
        { key: 'soul_urge', label: 'Soul Urge Number', hint: 'From the vowels in your name. Numerology links it with what you want underneath' },
        { key: 'personality', label: 'Personality Number', hint: 'From the consonants in your name. Numerology links it with how others first see you' },
        { key: 'birthday', label: 'Birthday Number', hint: 'From the day of the month you were born' },
        { key: 'maturity', label: 'Maturity Number', hint: 'Your Life Path plus your Expression. Numerology links it with later life' },
        { key: 'personal_year', label: 'Personal Year Number', hint: 'From your birth date and the year of your most recent birthday' },
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
                            Karmic debt numbers: {debts.map(d => `${d.number} (${d.source})`).join(', ')}. A traditional numerology term for 13, 14, 16 and 19; it doesn't mean you owe anything.
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

    // Cards are stored as the "N – Name" select options.
    const cards = birthCards(birthDate);
    const year = birthDate ? yearCardOn(birthDate, todayKey()) : null;
    const autoBirthCard = cards ? cardOption(cards.personality.id) : null;
    const autoYearCard = year ? cardOption(year.id) : null;
    // The soul card belongs to the computed birth card, not one chosen by hand.
    const autoSoulCard = cards?.soul && (!data?.birth_card || cardId(data.birth_card) === cards.personality.id) ? cardOption(cards.soul.id) : null;

    // Fill in an empty birth card from the birth date. A changed date is
    // followed where the date is set (followBirthCard).
    useEffect(() => {
        if (autoBirthCard && !data?.birth_card) onChange(withComputedCard(data, birthDate));
    }, [birthDate]); // eslint-disable-line react-hooks/exhaustive-deps

    const chooseBirthCard = (card) => onChange(card === autoBirthCard ? withComputedCard(data, birthDate) : withChosenCard(data, card));

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Birth Card" hint="Worked out from your birth date by Mary K. Greer's method">
                <div className="relative">
                    <SimpleSelect value={data?.birth_card} onChange={chooseBirthCard} options={TAROT_MAJOR_ARCANA} />
                    {autoBirthCard && data?.birth_card === autoBirthCard && <AutoBadge />}
                </div>
            </Field>
            <Field label="Shadow Card" hint="Optional, if a tarot practice you follow names one">
                <SimpleSelect value={data?.shadow_card} onChange={v => onChange({ ...data, shadow_card: v, shadow_card_source: 'entered' })} options={TAROT_MAJOR_ARCANA} />
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
            <Field label="Type" hint="The type whose description fits you best. Teachers describe each by a central wish and fear">
                <SimpleSelect value={data?.type} onChange={v => onChange({ ...data, type: v, wing: wingOf(data?.wing, resolveEnneagram(v)?.number) ? data.wing : undefined })} options={ENNEAGRAM_TYPES} />
            </Field>
            <Field label="Wing" hint="One of the two types beside yours, said to add some of its qualities">
                <SimpleSelect value={data?.wing} onChange={v => set('wing', v)} options={wingOptions} />
            </Field>
            <Field label="Instinctual Variant" hint="Which of three instincts teachers describe as leading: self-preservation, social, or one-to-one">
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
