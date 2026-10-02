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
import { Plus, Edit, Heart, Shield, Gift, Star, TrendingUp, Trash2, X } from "lucide-react";
import { todayKey, parseLocalDate } from "@/lib/dates";
import { format } from "date-fns";

// Categories share the ink/accent voice; each keeps its own quiet wash drawn
// from the palette so the four areas still read apart at a glance.
const wash = (token, pct) => `color-mix(in srgb, var(${token}) ${pct}%, transparent)`;
const categoryInfo = {
    devotions: {
        icon: Heart,
        title: "Devotions",
        description: "Practices and rituals that nourish your soul",
        bg: wash('--gh-rose', 14),
    },
    empowerments: {
        icon: Star,
        title: "Empowerments",
        description: "Ways you're claiming your power and voice",
        bg: wash('--gh-accent', 10),
    },
    integrity_lines: {
        icon: Shield,
        title: "Integrity Lines",
        description: "Values and principles you won't compromise",
        bg: wash('--gh-amber', 16),
    },
    gifts: {
        icon: Gift,
        title: "Gifts",
        description: "Your natural talents and unique contributions",
        bg: wash('--gh-gold', 16),
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
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gh-ink-muted)' }}>Growth</p>
                    <h1 className="text-4xl mb-3" style={{ color: 'var(--gh-ink)' }}>Practice board</h1>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--gh-ink-soft)' }}>
                        Keep what you are growing in view: devotions, empowerments, integrity lines, and gifts. It is yours to describe, not a score.
                    </p>
                </div>

                {/* Overall Progress */}
                <div className="p-8 text-center mb-8" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 6px)' }}>
                    <h3 className="text-2xl mb-1" style={{ color: 'var(--gh-ink)' }}>
                        What you are growing
                    </h3>
                    <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>Growth isn't a percentage. These are the areas you chose to keep in view.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {Object.entries(categoryInfo).map(([category, info]) => (
                            <div key={category} className="text-center p-3"
                                style={{ background: info.bg, border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)' }}>
                                <info.icon className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--gh-accent)' }} />
                                <div className="text-xs font-medium mb-1" style={{ color: 'var(--gh-ink-soft)' }}>{info.title}</div>
                                <div className="text-xl font-bold" style={{ color: 'var(--gh-ink)' }}>
                                    {getItemsByCategory(category).length}
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
                                className="transition-colors duration-200 font-medium"
                                style={{
                                    background: isActive ? info.bg : 'var(--gh-cream)',
                                    border: isActive ? '1px solid var(--gh-accent)' : '1px solid hsl(var(--border))',
                                    color: isActive ? 'var(--gh-accent)' : 'var(--gh-ink-muted)',
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
                            <h2 className="text-2xl flex items-center gap-3" style={{ color: 'var(--gh-ink)' }}>
                                {React.createElement(cat.icon, { className: "w-6 h-6", style: { color: 'var(--gh-accent)' } })}
                                {cat.title}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--gh-ink-muted)' }}>{cat.description}</p>
                        </div>
                        <button type="button" onClick={() => openAddDialog(selectedCategory)} className="ink-button text-sm inline-flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Add {cat.title.slice(0, -1).toLowerCase() === 'integrity line' ? 'an integrity line' : `a ${cat.title.slice(0, -1).toLowerCase()}`}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {getItemsByCategory(selectedCategory).map((item) => (
                            <div key={item.id} className="p-5 transition-shadow duration-200"
                                style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-body font-bold mb-1" style={{ color: 'var(--gh-ink)' }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>{item.description}</p>
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
                                        <span className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>Your sense of it</span>
                                        <span className="text-sm font-bold" style={{ color: 'var(--gh-accent)' }}>{item.progress_level} of 100</span>
                                    </div>
                                    <Progress value={item.progress_level} className="h-1.5" />
                                </div>
                                {item.reflection_notes && (
                                    <div className="p-3 text-xs mb-3" style={{ background: cat.bg, border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)', color: 'var(--gh-ink-soft)' }}>
                                        {item.reflection_notes}
                                    </div>
                                )}
                                {item.milestones?.length > 0 && (
                                    <div className="space-y-1">
                                        {item.milestones.slice(-2).map((milestone, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--gh-accent)' }} />
                                                <div>
                                                    <div style={{ color: 'var(--gh-ink-soft)' }}>{milestone.milestone}</div>
                                                    <div style={{ color: 'var(--gh-ink-muted)' }}>{format(parseLocalDate(milestone.date), "MMM d, yyyy")}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {getItemsByCategory(selectedCategory).length === 0 && (
                            <div className="p-12 text-center col-span-full" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
                                {React.createElement(cat.icon, { className: "w-12 h-12 mx-auto mb-4", style: { color: 'var(--gh-ink-muted)' } })}
                                <h3 className="font-body text-lg font-bold mb-2" style={{ color: 'var(--gh-ink)' }}>
                                    No {cat.title.toLowerCase()} yet
                                </h3>
                                <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>{cat.description}</p>
                                <button type="button" onClick={() => openAddDialog(selectedCategory)} className="ink-button text-sm">
                                    Add your first {cat.title.slice(0, -1).toLowerCase()}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-lg"
                        style={{ background: 'var(--gh-field)', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)' }}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--gh-ink)' }}>
                                {React.createElement(categoryInfo[formData.category].icon, { className: "w-5 h-5", style: { color: 'var(--gh-accent)' } })}
                                {editingItem ? 'Edit' : 'Add'} {categoryInfo[formData.category].title.slice(0, -1)}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title" style={{ color: 'var(--gh-ink-soft)' }}>Title</Label>
                                <Input id="title" value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="What are you working on?" required className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="description" style={{ color: 'var(--gh-ink-soft)' }}>Description</Label>
                                <Textarea id="description" value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe this area of growth..." rows={3} className="mt-1" />
                            </div>
                            <div>
                                <Label style={{ color: 'var(--gh-ink-soft)' }}>How far along does this feel to you? ({formData.progress_level} of 100)</Label>
                                <Slider min={0} max={100} step={1} value={[formData.progress_level]}
                                    onValueChange={([v]) => setFormData({...formData, progress_level: v})}
                                    className="mt-3" aria-label="How far along this feels to you" />
                                <p className="text-xs mt-2" style={{ color: 'var(--gh-ink-muted)' }}>Your own sense, for you alone. It isn't added up or compared.</p>
                            </div>
                            <div>
                                <Label htmlFor="reflection" style={{ color: 'var(--gh-ink-soft)' }}>Reflection Notes</Label>
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
                                                style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 6px)' }}>
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
                                    style={{ borderColor: 'hsl(var(--border))', color: 'var(--gh-ink-soft)', background: 'transparent' }}>
                                    Cancel
                                </Button>
                                <button type="submit" className="ink-button text-sm">
                                    {editingItem ? 'Save the change' : 'Add it'}
                                </button>
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