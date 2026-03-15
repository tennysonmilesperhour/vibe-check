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
        <div className="p-6 space-y-6" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                            Daily Check-In
                        </h1>
                        <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                            {existingEntry ? "Update your entry" : "How was your day?"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Date Selection */}
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle style={{color: 'var(--warm-gray-800)'}}>Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                className="max-w-xs"
                            />
                            {isToday(new Date(formData.date)) && (
                                <Badge className="mt-2" style={{background: 'var(--sage-100)', color: 'var(--sage-700)'}}>
                                    Today
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    {/* Overall Mood */}
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle style={{color: 'var(--warm-gray-800)'}}>Overall Mood</CardTitle>
                            <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                                How would you rate your overall mood today?
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center space-y-4">
                                <div className="text-6xl">{getMoodEmoji(formData.mood_score)}</div>
                                <div>
                                    <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                        {formData.mood_score}/10
                                    </div>
                                    <div className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                                        {getMoodLabel(formData.mood_score)}
                                    </div>
                                </div>
                            </div>
                            <div className="px-4">
                                <Slider
                                    value={[formData.mood_score]}
                                    onValueChange={([value]) => setFormData({...formData, mood_score: value})}
                                    max={10}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm mt-2" style={{color: 'var(--warm-gray-500)'}}>
                                    <span>1 - Terrible</span>
                                    <span>10 - Amazing</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* High Moment */}
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                                <span className="text-2xl">✨</span>
                                High Point of Your Day
                            </CardTitle>
                            <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                                What was the best part of your day?
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="high-description">What happened?</Label>
                                <Textarea
                                    id="high-description"
                                    placeholder="Describe the high point of your day..."
                                    value={formData.high_moment.description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        high_moment: {...formData.high_moment, description: e.target.value}
                                    })}
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="high-who">Who was involved?</Label>
                                    <Input
                                        id="high-who"
                                        placeholder="People present..."
                                        value={formData.high_moment.who_involved}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            high_moment: {...formData.high_moment, who_involved: e.target.value}
                                        })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="high-context">Where/when?</Label>
                                    <Input
                                        id="high-context"
                                        placeholder="Context or location..."
                                        value={formData.high_moment.context}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            high_moment: {...formData.high_moment, context: e.target.value}
                                        })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Intensity (1-10)</Label>
                                <div className="mt-2">
                                    <Slider
                                        value={[formData.high_moment.intensity]}
                                        onValueChange={([value]) => setFormData({
                                            ...formData,
                                            high_moment: {...formData.high_moment, intensity: value}
                                        })}
                                        max={10}
                                        min={1}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="text-center mt-1 text-sm font-medium" style={{color: 'var(--warm-gray-700)'}}>
                                        {formData.high_moment.intensity}/10
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Moment */}
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                                <span className="text-2xl">🌧️</span>
                                Challenging Moment
                            </CardTitle>
                            <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                                What was difficult or challenging today?
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="low-description">What happened?</Label>
                                <Textarea
                                    id="low-description"
                                    placeholder="Describe what was challenging..."
                                    value={formData.low_moment.description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        low_moment: {...formData.low_moment, description: e.target.value}
                                    })}
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="low-who">Who was involved?</Label>
                                    <Input
                                        id="low-who"
                                        placeholder="People present..."
                                        value={formData.low_moment.who_involved}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            low_moment: {...formData.low_moment, who_involved: e.target.value}
                                        })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="low-context">Where/when?</Label>
                                    <Input
                                        id="low-context"
                                        placeholder="Context or location..."
                                        value={formData.low_moment.context}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            low_moment: {...formData.low_moment, context: e.target.value}
                                        })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Intensity (1-10)</Label>
                                <div className="mt-2">
                                    <Slider
                                        value={[formData.low_moment.intensity]}
                                        onValueChange={([value]) => setFormData({
                                            ...formData,
                                            low_moment: {...formData.low_moment, intensity: value}
                                        })}
                                        max={10}
                                        min={1}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="text-center mt-1 text-sm font-medium" style={{color: 'var(--warm-gray-700)'}}>
                                        {formData.low_moment.intensity}/10
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gratitude & Notes */}
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                                <Heart className="w-5 h-5" style={{color: 'var(--sage-500)'}} />
                                Reflection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="gratitude">What are you grateful for today?</Label>
                                <Textarea
                                    id="gratitude"
                                    placeholder="I'm grateful for..."
                                    value={formData.gratitude}
                                    onChange={(e) => setFormData({...formData, gratitude: e.target.value})}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Additional notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any other thoughts or reflections..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(createPageUrl("Dashboard"))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="transition-all duration-300"
                            style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}