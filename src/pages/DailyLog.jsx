import React, { useState, useEffect } from "react";
import { DailyCheckIn } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isToday } from "date-fns";
import { ArrowLeft, Save, Heart } from "lucide-react";

export default function DailyLog() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        mood_score: 5,
        high_moment: {
            description: '',
            who_involved: '',
            context: '',
            intensity: 5
        },
        low_moment: {
            description: '',
            who_involved: '',
            context: '',
            intensity: 5
        },
        gratitude: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingEntry, setExistingEntry] = useState(null);

    useEffect(() => {
        checkForExistingEntry();
    }, [formData.date]);

    const checkForExistingEntry = async () => {
        const entries = await DailyCheckIn.filter({ date: formData.date });
        if (entries.length > 0) {
            setExistingEntry(entries[0]);
            setFormData(entries[0]);
        } else {
            setExistingEntry(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            if (existingEntry) {
                await DailyCheckIn.update(existingEntry.id, formData);
            } else {
                await DailyCheckIn.create(formData);
            }
            navigate(createPageUrl("Dashboard"));
        } catch (error) {
            console.error("Error saving check-in:", error);
        }
        
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

    const getMoodLabel = (score) => {
        if (score >= 9) return "Amazing";
        if (score >= 7) return "Great";
        if (score >= 6) return "Good";
        if (score >= 4) return "Okay";
        if (score >= 2) return "Difficult";
        return "Very Difficult";
    };

    return (
        <div className="p-6 space-y-6 min-h-screen relative">
            <div className="orb-purple" style={{ top: '-40px', right: '15%' }} />
            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}
                        className="rounded-full" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', color: '#c084fc' }}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Daily Check-In
                        </h1>
                        <p className="text-sm" style={{ color: 'rgba(180,170,210,0.6)' }}>
                            {existingEntry ? "Update your entry" : "How was your day?"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date */}
                    <div className="glass-card p-5">
                        <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(192,132,252,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</h3>
                        <Input type="date" value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            max={format(new Date(), 'yyyy-MM-dd')} className="max-w-xs" />
                        {isToday(new Date(formData.date)) && (
                            <Badge className="mt-2 text-xs" style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.2)' }}>
                                Today
                            </Badge>
                        )}
                    </div>

                    {/* Overall Mood */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'rgba(192,132,252,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall Mood</h3>
                        <p className="text-xs mb-5" style={{ color: 'rgba(180,170,210,0.5)' }}>How would you rate your overall mood today?</p>
                        <div className="text-center space-y-3 mb-6">
                            <div className="text-6xl">{getMoodEmoji(formData.mood_score)}</div>
                            <div>
                                <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    {formData.mood_score}<span className="text-xl">/10</span>
                                </div>
                                <div className="text-base" style={{ color: 'rgba(180,170,210,0.65)' }}>{getMoodLabel(formData.mood_score)}</div>
                            </div>
                        </div>
                        <div className="px-4">
                            <Slider value={[formData.mood_score]}
                                onValueChange={([value]) => setFormData({...formData, mood_score: value})}
                                max={10} min={1} step={1} className="w-full" />
                            <div className="flex justify-between text-xs mt-2" style={{ color: 'rgba(160,150,190,0.45)' }}>
                                <span>1 · Terrible</span><span>10 · Amazing</span>
                            </div>
                        </div>
                    </div>

                    {/* High Moment */}
                    <div className="glass-card p-6" style={{ border: '1px solid rgba(45,212,191,0.15)' }}>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'rgba(45,212,191,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>✨ High Point</h3>
                        <p className="text-xs mb-5" style={{ color: 'rgba(180,170,210,0.5)' }}>What was the best part of your day?</p>
                        <div className="space-y-4">
                            <div><Label htmlFor="high-description" style={{ color: 'rgba(200,190,230,0.7)' }}>What happened?</Label>
                                <Textarea id="high-description" placeholder="Describe the high point..." value={formData.high_moment.description}
                                    onChange={(e) => setFormData({...formData, high_moment: {...formData.high_moment, description: e.target.value}})} className="mt-1" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><Label htmlFor="high-who" style={{ color: 'rgba(200,190,230,0.7)' }}>Who was involved?</Label>
                                    <Input id="high-who" placeholder="People present..." value={formData.high_moment.who_involved}
                                        onChange={(e) => setFormData({...formData, high_moment: {...formData.high_moment, who_involved: e.target.value}})} className="mt-1" />
                                </div>
                                <div><Label htmlFor="high-context" style={{ color: 'rgba(200,190,230,0.7)' }}>Where/when?</Label>
                                    <Input id="high-context" placeholder="Context..." value={formData.high_moment.context}
                                        onChange={(e) => setFormData({...formData, high_moment: {...formData.high_moment, context: e.target.value}})} className="mt-1" />
                                </div>
                            </div>
                            <div><Label style={{ color: 'rgba(200,190,230,0.7)' }}>Intensity (1-10)</Label>
                                <div className="mt-2">
                                    <Slider value={[formData.high_moment.intensity]}
                                        onValueChange={([value]) => setFormData({...formData, high_moment: {...formData.high_moment, intensity: value}})}
                                        max={10} min={1} step={1} className="w-full" />
                                    <div className="text-center mt-1 text-sm font-semibold" style={{ color: '#2dd4bf' }}>{formData.high_moment.intensity}/10</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Low Moment */}
                    <div className="glass-card p-6" style={{ border: '1px solid rgba(244,114,182,0.15)' }}>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'rgba(244,114,182,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🌧️ Challenging Moment</h3>
                        <p className="text-xs mb-5" style={{ color: 'rgba(180,170,210,0.5)' }}>What was difficult or challenging today?</p>
                        <div className="space-y-4">
                            <div><Label htmlFor="low-description" style={{ color: 'rgba(200,190,230,0.7)' }}>What happened?</Label>
                                <Textarea id="low-description" placeholder="Describe what was challenging..." value={formData.low_moment.description}
                                    onChange={(e) => setFormData({...formData, low_moment: {...formData.low_moment, description: e.target.value}})} className="mt-1" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><Label htmlFor="low-who" style={{ color: 'rgba(200,190,230,0.7)' }}>Who was involved?</Label>
                                    <Input id="low-who" placeholder="People present..." value={formData.low_moment.who_involved}
                                        onChange={(e) => setFormData({...formData, low_moment: {...formData.low_moment, who_involved: e.target.value}})} className="mt-1" />
                                </div>
                                <div><Label htmlFor="low-context" style={{ color: 'rgba(200,190,230,0.7)' }}>Where/when?</Label>
                                    <Input id="low-context" placeholder="Context..." value={formData.low_moment.context}
                                        onChange={(e) => setFormData({...formData, low_moment: {...formData.low_moment, context: e.target.value}})} className="mt-1" />
                                </div>
                            </div>
                            <div><Label style={{ color: 'rgba(200,190,230,0.7)' }}>Intensity (1-10)</Label>
                                <div className="mt-2">
                                    <Slider value={[formData.low_moment.intensity]}
                                        onValueChange={([value]) => setFormData({...formData, low_moment: {...formData.low_moment, intensity: value}})}
                                        max={10} min={1} step={1} className="w-full" />
                                    <div className="text-center mt-1 text-sm font-semibold" style={{ color: '#f472b6' }}>{formData.low_moment.intensity}/10</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reflection */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-semibold mb-5" style={{ color: 'rgba(192,132,252,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            ♡ Reflection
                        </h3>
                        <div className="space-y-4">
                            <div><Label htmlFor="gratitude" style={{ color: 'rgba(200,190,230,0.7)' }}>What are you grateful for today?</Label>
                                <Textarea id="gratitude" placeholder="I'm grateful for..." value={formData.gratitude}
                                    onChange={(e) => setFormData({...formData, gratitude: e.target.value})} className="mt-1" />
                            </div>
                            <div><Label htmlFor="notes" style={{ color: 'rgba(200,190,230,0.7)' }}>Additional notes</Label>
                                <Textarea id="notes" placeholder="Any other thoughts..." value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}
                            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(200,190,230,0.7)', background: 'transparent' }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="btn-cosmic rounded-xl font-semibold">
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}