import React, { useState, useEffect } from "react";
import { DailyCheckIn } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isToday } from "date-fns";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";

const EMOTIONS = [
  { label: "Joyful", emoji: "✨" },
  { label: "Grateful", emoji: "🙏" },
  { label: "Calm", emoji: "🌊" },
  { label: "Excited", emoji: "🔥" },
  { label: "Loved", emoji: "💜" },
  { label: "Hopeful", emoji: "🌱" },
  { label: "Proud", emoji: "⭐" },
  { label: "Creative", emoji: "🎨" },
  { label: "Anxious", emoji: "😰" },
  { label: "Sad", emoji: "💧" },
  { label: "Frustrated", emoji: "😤" },
  { label: "Tired", emoji: "😴" },
  { label: "Lonely", emoji: "🌑" },
  { label: "Overwhelmed", emoji: "🌀" },
  { label: "Numb", emoji: "🪨" },
  { label: "Angry", emoji: "⚡" },
];

const ACTIVITIES = [
  { label: "Exercise", emoji: "🏃" },
  { label: "Meditation", emoji: "🧘" },
  { label: "Journaling", emoji: "📝" },
  { label: "Nature", emoji: "🌿" },
  { label: "Social", emoji: "👥" },
  { label: "Creative work", emoji: "🎨" },
  { label: "Learning", emoji: "📚" },
  { label: "Rest", emoji: "🛋️" },
  { label: "Healthy eating", emoji: "🥗" },
  { label: "Music", emoji: "🎵" },
  { label: "Spiritual practice", emoji: "✦" },
  { label: "Therapy/coaching", emoji: "💬" },
];

function QuickSlider({ label, value, onChange, lowLabel, highLabel, color = "#8A72B8" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: 'rgba(82,72,104,0.9)' }}>{label}</span>
        <span className="text-lg font-bold w-8 text-center" style={{ color, fontFamily: 'Space Grotesk, sans-serif' }}>{value}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={10} min={1} step={1} className="w-full" />
      <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(122,112,144,0.55)' }}>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function TagGrid({ items, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const isSelected = selected.includes(item.label);
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onToggle(item.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
            style={{
              background: isSelected ? 'rgba(138,114,184,0.25)' : 'rgba(255,255,255,0.64)',
              border: isSelected ? '1px solid rgba(138,114,184,0.5)' : '1px solid rgba(61,52,80,0.1)',
              color: isSelected ? '#8A72B8' : 'rgba(82,72,104,0.75)',
              transform: isSelected ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CollapsibleSection({ title, subtitle, color = 'rgba(138,114,184,0.8)', borderColor = 'rgba(138,114,184,0.15)', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(105,95,128,0.55)' }}>{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color }} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

const EMPTY_FORM = {
  date: format(new Date(), 'yyyy-MM-dd'),
  mood_score: 6,
  energy_level: 6,
  sleep_quality: 6,
  emotions: [],
  activities: [],
  high_moment: { description: '', who_involved: '', context: '', intensity: 6 },
  low_moment: { description: '', who_involved: '', context: '', intensity: 4 },
  gratitude: '',
  notes: '',
};

export default function DailyLog() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);

  useEffect(() => { checkForExistingEntry(); }, [formData.date]);

  const checkForExistingEntry = async () => {
    const entries = await DailyCheckIn.filter({ date: formData.date });
    if (entries.length > 0) {
      setExistingEntry(entries[0]);
      setFormData({ ...EMPTY_FORM, ...entries[0] });
    } else {
      setExistingEntry(null);
      setFormData(prev => ({ ...EMPTY_FORM, date: prev.date }));
    }
  };

  const toggleTag = (field, label) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(label) ? arr.filter(x => x !== label) : [...arr, label] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (existingEntry) {
      await DailyCheckIn.update(existingEntry.id, formData);
    } else {
      await DailyCheckIn.create(formData);
    }
    navigate(createPageUrl("Dashboard"));
    setIsSubmitting(false);
  };

  const getMoodEmoji = (score) => {
    if (score >= 9) return "🌟";
    if (score >= 7) return "😊";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    if (score >= 2) return "😔";
    return "😢";
  };

  return (
    <div className="p-4 md:p-6 space-y-4 min-h-screen relative">
      <div className="orb-purple" style={{ top: '-40px', right: '15%' }} />
      <div className="max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-full shrink-0" style={{ borderColor: 'rgba(138,114,184,0.3)', background: 'rgba(138,114,184,0.08)', color: '#8A72B8' }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Daily Check-In</h1>
            <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>
              {existingEntry ? "Updating today's entry" : "Quick, honest, no pressure"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date */}
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'rgba(138,114,184,0.7)' }}>Date</Label>
              <Input type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')} className="max-w-xs text-sm" />
            </div>
            {isToday(new Date(formData.date)) && (
              <span className="text-xs px-3 py-1 rounded-full shrink-0"
                style={{ background: 'rgba(138,114,184,0.15)', color: '#8A72B8', border: '1px solid rgba(138,114,184,0.2)' }}>
                Today
              </span>
            )}
          </div>

          {/* Core sliders */}
          <div className="glass-card p-5 space-y-6">
            <div className="text-center mb-2">
              <div className="text-5xl mb-1">{getMoodEmoji(formData.mood_score)}</div>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(138,114,184,0.6)' }}>How are you feeling?</p>
            </div>
            <QuickSlider label="Mood" value={formData.mood_score}
              onChange={v => setFormData({ ...formData, mood_score: v })}
              lowLabel="Rough" highLabel="Amazing" color="#8A72B8" />
            <QuickSlider label="Energy" value={formData.energy_level}
              onChange={v => setFormData({ ...formData, energy_level: v })}
              lowLabel="Depleted" highLabel="Vibrant" color="#6B95C8" />
            <QuickSlider label="Sleep" value={formData.sleep_quality}
              onChange={v => setFormData({ ...formData, sleep_quality: v })}
              lowLabel="Poor" highLabel="Restorative" color="#C9834B" />
          </div>

          {/* Emotions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-1 uppercase tracking-widest" style={{ color: 'rgba(138,114,184,0.8)' }}>Emotions</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(105,95,128,0.55)' }}>Tap everything that resonates today</p>
            <TagGrid items={EMOTIONS} selected={formData.emotions || []} onToggle={l => toggleTag('emotions', l)} />
          </div>

          {/* Activities */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-1 uppercase tracking-widest" style={{ color: 'rgba(107,149,200,0.8)' }}>What did you do?</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(105,95,128,0.55)' }}>Select all that apply</p>
            <TagGrid items={ACTIVITIES} selected={formData.activities || []} onToggle={l => toggleTag('activities', l)} />
          </div>

          {/* High moment — collapsible */}
          <CollapsibleSection title="✨ High Point" subtitle="Optional — what was good?" color="rgba(201,131,75,0.8)" borderColor="rgba(201,131,75,0.15)">
            <div className="space-y-3">
              <Textarea placeholder="What happened?" value={formData.high_moment.description}
                onChange={e => setFormData({ ...formData, high_moment: { ...formData.high_moment, description: e.target.value } })}
                className="text-sm resize-none" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Who was involved?" value={formData.high_moment.who_involved}
                  onChange={e => setFormData({ ...formData, high_moment: { ...formData.high_moment, who_involved: e.target.value } })}
                  className="text-sm" />
                <Input placeholder="Where / when?" value={formData.high_moment.context}
                  onChange={e => setFormData({ ...formData, high_moment: { ...formData.high_moment, context: e.target.value } })}
                  className="text-sm" />
              </div>
              <QuickSlider label="Intensity" value={formData.high_moment.intensity}
                onChange={v => setFormData({ ...formData, high_moment: { ...formData.high_moment, intensity: v } })}
                lowLabel="Mild" highLabel="Peak" color="#C9834B" />
            </div>
          </CollapsibleSection>

          {/* Low moment — collapsible */}
          <CollapsibleSection title="🌧️ Challenge" subtitle="Optional — what was hard?" color="rgba(194,94,143,0.8)" borderColor="rgba(194,94,143,0.15)">
            <div className="space-y-3">
              <Textarea placeholder="What happened?" value={formData.low_moment.description}
                onChange={e => setFormData({ ...formData, low_moment: { ...formData.low_moment, description: e.target.value } })}
                className="text-sm resize-none" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Who was involved?" value={formData.low_moment.who_involved}
                  onChange={e => setFormData({ ...formData, low_moment: { ...formData.low_moment, who_involved: e.target.value } })}
                  className="text-sm" />
                <Input placeholder="Where / when?" value={formData.low_moment.context}
                  onChange={e => setFormData({ ...formData, low_moment: { ...formData.low_moment, context: e.target.value } })}
                  className="text-sm" />
              </div>
              <QuickSlider label="Intensity" value={formData.low_moment.intensity}
                onChange={v => setFormData({ ...formData, low_moment: { ...formData.low_moment, intensity: v } })}
                lowLabel="Minor" highLabel="Heavy" color="#C25E8F" />
            </div>
          </CollapsibleSection>

          {/* Gratitude + Notes — collapsible */}
          <CollapsibleSection title="♡ Reflection" subtitle="Optional — gratitude & notes" color="rgba(138,114,184,0.8)" borderColor="rgba(138,114,184,0.15)">
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block" style={{ color: 'rgba(82,72,104,0.7)' }}>I'm grateful for…</Label>
                <Textarea placeholder="Even something small counts" value={formData.gratitude}
                  onChange={e => setFormData({ ...formData, gratitude: e.target.value })}
                  className="text-sm resize-none" rows={2} />
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: 'rgba(82,72,104,0.7)' }}>Any other thoughts</Label>
                <Textarea placeholder="Stream of consciousness, no rules…" value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="text-sm resize-none" rows={3} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Submit */}
          <div className="flex gap-3 pt-2 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}
              className="flex-1" style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.7)', background: 'transparent' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="btn-cosmic rounded-xl font-semibold flex-1">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving…' : existingEntry ? 'Update' : 'Save Check-In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}