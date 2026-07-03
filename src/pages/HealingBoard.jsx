import React, { useState, useEffect } from "react";
import { HealingProgress } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Plus, Edit, Heart, Shield, Gift, Star, TrendingUp, Trash2, X } from "lucide-react";
import { todayKey } from "@/lib/dates";

const categoryInfo = {
    devotions: {
        icon: Heart,
        title: "Devotions",
        description: "Practices and rituals that nourish your soul",
        color: '#C25E8F',
        border: 'rgba(194,94,143,0.2)',
        bg: 'rgba(194,94,143,0.08)',
    },
    empowerments: {
        icon: Star,
        title: "Empowerments",
        description: "Ways you're claiming your power and voice",
        color: '#8A72B8',
        border: 'rgba(138,114,184,0.2)',
        bg: 'rgba(138,114,184,0.08)',
    },
    integrity_lines: {
        icon: Shield,
        title: "Integrity Lines",
        description: "Values and principles you won't compromise",
        color: '#6B95C8',
        border: 'rgba(107,149,200,0.2)',
        bg: 'rgba(107,149,200,0.08)',
    },
    gifts: {
        icon: Gift,
        title: "Gifts",
        description: "Your natural talents and unique contributions",
        color: '#C9834B',
        border: 'rgba(201,131,75,0.2)',
        bg: 'rgba(201,131,75,0.08)',
    }
};

export default function HealingBoard() {
    const [healingItems, setHealingItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("devotions");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [milestoneDraft, setMilestoneDraft] = useState("");
    const [formData, setFormData] = useState({
        category: "devotions",
        title: "",
        description: "",
        progress_level: 0,
        reflection_notes: "",
        milestones: []
    });

    useEffect(() => { loadHealingProgress(); }, []);

    const loadHealingProgress = async () => {
        const items = await HealingProgress.list('-created_date');
        setHealingItems(items);
    };

    const getItemsByCategory = (category) => healingItems.filter(item => item.category === category);

    const getCategoryAverage = (category) => {
        const items = getItemsByCategory(category);
        if (items.length === 0) return 0;
        return items.reduce((sum, item) => sum + item.progress_level, 0) / items.length;
    };

    const getOverallProgress = () => {
        if (healingItems.length === 0) return 0;
        return healingItems.reduce((sum, item) => sum + item.progress_level, 0) / healingItems.length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingItem) {
            await HealingProgress.update(editingItem.id, formData);
        } else {
            await HealingProgress.create(formData);
        }
        setShowAddDialog(false);
        setEditingItem(null);
        resetForm();
        loadHealingProgress();
    };

    const resetForm = () => {
        setFormData({ category: selectedCategory, title: "", description: "", progress_level: 0, reflection_notes: "", milestones: [] });
    };

    const openAddDialog = (category = selectedCategory) => {
        resetForm();
        setFormData(prev => ({...prev, category}));
        setShowAddDialog(true);
    };

    const editItem = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowAddDialog(true);
    };

    const addMilestone = () => {
        const text = milestoneDraft.trim();
        if (text) {
            setFormData({ ...formData, milestones: [...formData.milestones, { date: todayKey(), milestone: text }] });
            setMilestoneDraft("");
        }
    };

    const removeMilestone = (index) => {
        setFormData({ ...formData, milestones: formData.milestones.filter((_, i) => i !== index) });
    };

    const deleteItem = async () => {
        if (!deletingItem) return;
        try {
            await HealingProgress.delete(deletingItem.id);
            setDeletingItem(null);
            loadHealingProgress();
        } catch {
            setDeletingItem(null);
        }
    };

    const cat = categoryInfo[selectedCategory];

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(138,114,184,0.7)' }}>✦ Growth</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center pulse-glow"
                            style={{ background: 'linear-gradient(135deg, #C4699A, #8FA8D8)', boxShadow: '0 0 20px rgba(186,124,164,0.4)' }}>
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Healing Board</h1>
                    </div>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(105,95,128,0.75)' }}>
                        Track your journey of growth through devotions, empowerments, integrity lines, and gifts.
                    </p>
                </div>

                {/* Overall Progress */}
                <div className="glass-card-glow p-8 text-center mb-8">
                    <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                        Your Unique Essence
                    </h3>
                    <p className="text-sm mb-5" style={{ color: 'rgba(105,95,128,0.65)' }}>Overall healing progress</p>
                    <div className="max-w-md mx-auto mb-6">
                        <div className="text-5xl font-bold mb-3 gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {getOverallProgress().toFixed(0)}%
                        </div>
                        <Progress value={getOverallProgress()} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {Object.entries(categoryInfo).map(([category, info]) => (
                            <div key={category} className="text-center p-3 rounded-xl"
                                style={{ background: info.bg, border: `1px solid ${info.border}` }}>
                                <info.icon className="w-5 h-5 mx-auto mb-1" style={{ color: info.color }} />
                                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(82,72,104,0.8)' }}>{info.title}</div>
                                <div className="text-xl font-bold" style={{ color: info.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                                    {getCategoryAverage(category).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap gap-3 mb-8 justify-center">
                    {Object.entries(categoryInfo).map(([category, info]) => {
                        const isActive = selectedCategory === category;
                        return (
                            <Button key={category} onClick={() => setSelectedCategory(category)}
                                className="transition-all duration-200 rounded-xl font-medium"
                                style={{
                                    background: isActive ? info.bg : 'rgba(255,255,255,0.64)',
                                    border: `1px solid ${isActive ? info.color : 'rgba(61,52,80,0.1)'}`,
                                    color: isActive ? info.color : 'rgba(82,72,104,0.7)',
                                    boxShadow: isActive ? `0 0 15px ${info.border}` : 'none',
                                }}>
                                <info.icon className="w-4 h-4 mr-2" />
                                {info.title}
                            </Button>
                        );
                    })}
                </div>

                {/* Category Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>
                                {React.createElement(cat.icon, { className: "w-6 h-6", style: { color: cat.color } })}
                                {cat.title}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'rgba(105,95,128,0.65)' }}>{cat.description}</p>
                        </div>
                        <Button onClick={() => openAddDialog(selectedCategory)} className="btn-cosmic rounded-xl font-semibold">
                            <Plus className="w-4 h-4 mr-2" />
                            Add {cat.title.slice(0, -1)}
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {getItemsByCategory(selectedCategory).map((item) => (
                            <div key={item.id} className="glass-card p-5 hover:scale-[1.01] transition-all duration-200"
                                style={{ border: `1px solid ${cat.border}` }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'rgba(105,95,128,0.65)' }}>{item.description}</p>
                                    </div>
                                    <div className="flex">
                                        <Button variant="ghost" size="icon" aria-label={`Edit ${item.title}`} onClick={() => editItem(item)}
                                            style={{ color: 'var(--gh-ink-muted)' }}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => setDeletingItem(item)}
                                            style={{ color: 'var(--gh-ink-muted)' }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs" style={{ color: 'rgba(105,95,128,0.65)' }}>Progress</span>
                                        <span className="text-sm font-bold" style={{ color: cat.color }}>{item.progress_level}%</span>
                                    </div>
                                    <Progress value={item.progress_level} className="h-1.5" />
                                </div>
                                {item.reflection_notes && (
                                    <div className="p-3 rounded-xl text-xs mb-3" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: 'rgba(82,72,104,0.85)' }}>
                                        {item.reflection_notes}
                                    </div>
                                )}
                                {item.milestones?.length > 0 && (
                                    <div className="space-y-1">
                                        {item.milestones.slice(-2).map((milestone, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#C9834B' }} />
                                                <div>
                                                    <div style={{ color: 'rgba(82,72,104,0.9)' }}>{milestone.milestone}</div>
                                                    <div style={{ color: 'rgba(122,112,144,0.55)' }}>{format(new Date(milestone.date), "MMM d, yyyy")}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {getItemsByCategory(selectedCategory).length === 0 && (
                            <div className="glass-card p-12 text-center col-span-full">
                                {React.createElement(cat.icon, { className: "w-12 h-12 mx-auto mb-4", style: { color: `${cat.color}50` } })}
                                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(82,72,104,0.8)' }}>
                                    No {cat.title.toLowerCase()} yet
                                </h3>
                                <p className="text-sm mb-5" style={{ color: 'rgba(122,112,144,0.6)' }}>{cat.description}</p>
                                <Button onClick={() => openAddDialog(selectedCategory)} className="btn-cosmic rounded-xl">
                                    Add your first {cat.title.slice(0, -1).toLowerCase()}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-lg"
                        style={{ background: 'rgba(253,251,247,0.98)', border: '1px solid rgba(138,114,184,0.2)' }}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                {React.createElement(categoryInfo[formData.category].icon, { className: "w-5 h-5", style: { color: categoryInfo[formData.category].color } })}
                                {editingItem ? 'Edit' : 'Add'} {categoryInfo[formData.category].title.slice(0, -1)}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title" style={{ color: 'rgba(82,72,104,0.8)' }}>Title</Label>
                                <Input id="title" value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="What are you working on?" required className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="description" style={{ color: 'rgba(82,72,104,0.8)' }}>Description</Label>
                                <Textarea id="description" value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe this area of growth..." rows={3} className="mt-1" />
                            </div>
                            <div>
                                <Label style={{ color: 'var(--gh-ink-soft)' }}>Progress Level ({formData.progress_level}%)</Label>
                                <Slider min={0} max={100} step={1} value={[formData.progress_level]}
                                    onValueChange={([v]) => setFormData({...formData, progress_level: v})}
                                    className="mt-3" aria-label="Progress level" />
                            </div>
                            <div>
                                <Label htmlFor="reflection" style={{ color: 'rgba(82,72,104,0.8)' }}>Reflection Notes</Label>
                                <Textarea id="reflection" value={formData.reflection_notes}
                                    onChange={(e) => setFormData({...formData, reflection_notes: e.target.value})}
                                    placeholder="Your thoughts and reflections..." rows={3} className="mt-1" />
                            </div>
                            <div>
                                <Label style={{ color: 'var(--gh-ink-soft)' }}>Milestones</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input value={milestoneDraft} onChange={(e) => setMilestoneDraft(e.target.value)}
                                        placeholder="Name a milestone"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }} />
                                    <Button type="button" variant="outline" size="sm" onClick={addMilestone} disabled={!milestoneDraft.trim()}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                                {formData.milestones?.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto mt-2">
                                        {formData.milestones.map((milestone, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 text-sm"
                                                style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))' }}>
                                                <div>
                                                    <div style={{ color: 'var(--gh-ink)' }}>{milestone.milestone}</div>
                                                    <div className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>{milestone.date}</div>
                                                </div>
                                                <button type="button" aria-label={`Remove milestone: ${milestone.milestone}`} onClick={() => removeMilestone(i)}>
                                                    <X className="w-3.5 h-3.5" style={{ color: 'var(--gh-ink-muted)' }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}
                                    style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)', background: 'transparent' }}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="btn-cosmic rounded-xl">
                                    {editingItem ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Release "{deletingItem?.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This removes the item and its milestones. The growth it recorded stays yours.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteItem}>Delete item</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}