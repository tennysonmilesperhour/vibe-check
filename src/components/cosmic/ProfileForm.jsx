import React, { useEffect } from "react";

// ── Shared auto-calculation helpers ──

const PYTHAGOREAN = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
  j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
  s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8
};
const VOWELS = new Set(['a','e','i','o','u']);

function reduceNum(n, keepMaster = true) {
  if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
  if (n < 10) return n;
  const s = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  return reduceNum(s, keepMaster);
}

function sumDigits(str) {
  return String(str).replace(/\D/g, '').split('').reduce((a, d) => a + parseInt(d), 0);
}

function calcLifePath(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const total = sumDigits(month) + sumDigits(day) + sumDigits(year);
  return String(reduceNum(total));
}

function calcPersonalYear(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const year = new Date().getFullYear();
  const total = sumDigits(month) + sumDigits(day) + sumDigits(year);
  return String(reduceNum(total));
}

function nameToNumbers(name, vowelsOnly = false) {
  return (name || '').toLowerCase().split('').reduce((sum, ch) => {
    if (!PYTHAGOREAN[ch]) return sum;
    if (vowelsOnly && !VOWELS.has(ch)) return sum;
    return sum + PYTHAGOREAN[ch];
  }, 0);
}

function calcExpression(firstName, lastName) {
  if (!firstName && !lastName) return null;
  const total = nameToNumbers(firstName) + nameToNumbers(lastName);
  if (total === 0) return null;
  return String(reduceNum(total));
}

function calcSoulUrge(firstName, lastName) {
  if (!firstName && !lastName) return null;
  const total = nameToNumbers(firstName, true) + nameToNumbers(lastName, true);
  if (total === 0) return null;
  return String(reduceNum(total));
}

function calcTarotBirthCard(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  let total = month + day + year;
  // reduce until <= 21
  while (total > 21) {
    total = String(total).split('').reduce((a, x) => a + parseInt(x), 0);
  }
  return total;
}

const TAROT_BY_NUM = {
  0: "0 – The Fool", 1: "1 – The Magician", 2: "2 – The High Priestess",
  3: "3 – The Empress", 4: "4 – The Emperor", 5: "5 – The Hierophant",
  6: "6 – The Lovers", 7: "7 – The Chariot", 8: "8 – Strength",
  9: "9 – The Hermit", 10: "10 – Wheel of Fortune", 11: "11 – Justice",
  12: "12 – The Hanged Man", 13: "13 – Death", 14: "14 – Temperance",
  15: "15 – The Devil", 16: "16 – The Tower", 17: "17 – The Star",
  18: "18 – The Moon", 19: "19 – The Sun", 20: "20 – Judgement",
  21: "21 – The World"
};
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ZODIAC_SIGNS, HUMAN_DESIGN_TYPES, HUMAN_DESIGN_AUTHORITIES, HUMAN_DESIGN_PROFILES,
    GENE_KEY_NUMBERS, LIFE_PATH_NUMBERS, TAROT_MAJOR_ARCANA, CHAKRA_CENTERS
} from "./correspondences";

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm font-medium" style={{color: 'var(--warm-gray-700)'}}>{label}</Label>
            {hint && <p className="text-xs" style={{color: 'var(--warm-gray-400)'}}>{hint}</p>}
            {children}
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

function getSunSign(birthDate) {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
}

export function AstrologyForm({ data, onChange, birthDate }) {
    const set = (key, val) => onChange({ ...data, [key]: val });

    useEffect(() => {
        const autoSign = getSunSign(birthDate);
        if (autoSign && !data?.sun_sign) {
            onChange({ ...data, sun_sign: autoSign });
        }
    }, [birthDate]);

    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Sun Sign" hint="Your core identity and conscious self">
                <div className="relative">
                    <SimpleSelect value={data?.sun_sign} onChange={v => set('sun_sign', v)} options={ZODIAC_SIGNS} />
                    {birthDate && getSunSign(birthDate) === data?.sun_sign && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                            auto
                        </span>
                    )}
                </div>
            </Field>
            <Field label="Moon Sign" hint="Your emotional nature and inner world">
                <SimpleSelect value={data?.moon_sign} onChange={v => set('moon_sign', v)} options={ZODIAC_SIGNS} />
            </Field>
            <Field label="Rising / Ascendant" hint="How others see you; your outer mask (requires birth time)">
                <SimpleSelect value={data?.rising_sign} onChange={v => set('rising_sign', v)} options={ZODIAC_SIGNS} />
            </Field>
            <Field label="North Node Sign" hint="Your soul's evolutionary direction in this lifetime">
                <SimpleSelect value={data?.north_node} onChange={v => set('north_node', v)} options={ZODIAC_SIGNS} />
            </Field>
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

    const autoLifePath = calcLifePath(birthDate);
    const autoPersonalYear = calcPersonalYear(birthDate);
    const autoExpression = calcExpression(firstName, lastName);
    const autoSoulUrge = calcSoulUrge(firstName, lastName);

    useEffect(() => {
        const updates = {};
        if (autoLifePath && !data?.life_path) updates.life_path = autoLifePath;
        if (autoPersonalYear && !data?.personal_year) updates.personal_year = autoPersonalYear;
        if (autoExpression && !data?.expression) updates.expression = autoExpression;
        if (autoSoulUrge && !data?.soul_urge) updates.soul_urge = autoSoulUrge;
        if (Object.keys(updates).length > 0) onChange({ ...data, ...updates });
    }, [birthDate, firstName, lastName]);
    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Life Path Number" hint="Calculated from your birth date">
                <div className="relative">
                    <SimpleSelect value={data?.life_path} onChange={v => set('life_path', v)} options={LIFE_PATH_NUMBERS} />
                    {autoLifePath && data?.life_path === autoLifePath && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
            <Field label="Expression Number" hint="Calculated from your full name">
                <div className="relative">
                    <SimpleSelect value={data?.expression} onChange={v => set('expression', v)} options={LIFE_PATH_NUMBERS} />
                    {autoExpression && data?.expression === autoExpression && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
            <Field label="Soul Urge Number" hint="Calculated from vowels in your name">
                <div className="relative">
                    <SimpleSelect value={data?.soul_urge} onChange={v => set('soul_urge', v)} options={LIFE_PATH_NUMBERS} />
                    {autoSoulUrge && data?.soul_urge === autoSoulUrge && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
            <Field label="Personal Year Number" hint="Calculated from birth date + current year">
                <div className="relative">
                    <SimpleSelect value={data?.personal_year} onChange={v => set('personal_year', v)} options={LIFE_PATH_NUMBERS} />
                    {autoPersonalYear && data?.personal_year === autoPersonalYear && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
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

    const birthCardNum = calcTarotBirthCard(birthDate);
    const autoBirthCard = birthCardNum !== null ? TAROT_BY_NUM[birthCardNum] : null;
    // Shadow card = reduce birth card number to single digit if > 9
    const shadowCardNum = birthCardNum !== null ? (birthCardNum > 9 ? String(birthCardNum).split('').reduce((a,x)=>a+parseInt(x),0) : birthCardNum) : null;
    const autoShadowCard = shadowCardNum !== null && shadowCardNum !== birthCardNum ? TAROT_BY_NUM[shadowCardNum] : null;

    useEffect(() => {
        const updates = {};
        if (autoBirthCard && !data?.birth_card) updates.birth_card = autoBirthCard;
        if (autoShadowCard && !data?.shadow_card) updates.shadow_card = autoShadowCard;
        if (Object.keys(updates).length > 0) onChange({ ...data, ...updates });
    }, [birthDate]);
    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Birth Card" hint="Calculated from your birth date">
                <div className="relative">
                    <SimpleSelect value={data?.birth_card} onChange={v => set('birth_card', v)} options={TAROT_MAJOR_ARCANA} />
                    {autoBirthCard && data?.birth_card === autoBirthCard && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
            <Field label="Shadow / Teacher Card" hint="The complementary archetype (reduced digit of birth card)">
                <div className="relative">
                    <SimpleSelect value={data?.shadow_card} onChange={v => set('shadow_card', v)} options={TAROT_MAJOR_ARCANA} />
                    {autoShadowCard && data?.shadow_card === autoShadowCard && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full pointer-events-none"
                            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>auto</span>
                    )}
                </div>
            </Field>
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Suit affinities, spread patterns, anything else..." />
                </Field>
            </div>
        </div>
    );
}

export function ChakraForm({ data, onChange }) {
    const set = (key, val) => onChange({ ...data, [key]: val });
    return (
        <div className="grid md:grid-cols-2 gap-5">
            <Field label="Dominant Center" hint="The chakra that most characterizes your nature or needs the most attention">
                <SimpleSelect value={data?.dominant_center} onChange={v => set('dominant_center', v)} options={CHAKRA_CENTERS} />
            </Field>
            <div className="md:col-span-2">
                <Field label="Personal Notes">
                    <Textarea className="mt-1" rows={2} value={data?.custom_notes || ''} onChange={e => set('custom_notes', e.target.value)} placeholder="Areas of focus, practices, imbalances you're working with..." />
                </Field>
            </div>
        </div>
    );
}