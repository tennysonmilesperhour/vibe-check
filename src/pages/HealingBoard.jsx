import React, { useState, useEffect } from "react";
import { HealingProgress } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Plus, Edit, Heart, Shield, Gift, Star, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const categoryInfo = {
    devotions: {
        icon: Heart,
        title: "Devotions",
        description: "Practices and rituals that nourish your soul",
        color: '#f472b6',
        border: 'rgba(244,114,182,0.2)',
        bg: 'rgba(244,114,182,0.08)',
    },
    empowerments: {
        icon: Star,
        title: "Empowerments",
        description: "Ways you're claiming your power and voice",
        color: '#c084fc',
        border: 'rgba(192,132,252,0.2)',
        bg: 'rgba(192,132,252,0.08)',
    },
    integrity_lines: {
        icon: Shield,
        title: "Integrity Lines",
        description: "Values and principles you won't compromise",
        color: '#38bdf8',
        border: 'rgba(56,189,248,0.2)',
        bg: 'rgba(56,189,248,0.08)',
    },
    gifts: {
        icon: Gift,
        title: "Gifts",
        description: "Your natural talents and unique contributions",
        color: '#2dd4bf',
        border: 'rgba(45,212,191,0.2)',
        bg: 'rgba(45,212,191,0.08)',
    }
};

export default function HealingBoard() {
    const [healingItems, setHealingItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("devotions");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
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
        const milestone = prompt("Add a milestone:");
        if (milestone) {
            setFormData({ ...formData, milestones: [...formData.milestones, { date: format(new Date(), 'yyyy-MM-dd'), milestone }] });
        }
    };

    const cat = categoryInfo[selectedCategory];

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="orb-purple" style={{ top: '-40px', left: '20%' }} />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(139,92,246,0.7)' }}>✦ Growth</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center pulse-glow"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Healing Board</h1>
                    </div>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(180,170,210,0.65)' }}>
                        Track your journey of growth through devotions, empowerments, integrity lines, and gifts.
                    </p>
                </div>

                {/* Overall Progress */}
                <div className="glass-card-glow p-8 text-center mb-8">
                    <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.95)' }}>
                        Your Unique Essence
                    </h3>
                    <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.55)' }}>Overall healing progress</p>
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
                                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(200,190,230,0.7)' }}>{info.title}</div>
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
                                    background: isActive ? info.bg : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isActive ? info.color : 'rgba(255,255,255,0.08)'}`,
                                    color: isActive ? info.color : 'rgba(200,190,230,0.6)',
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
                            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>
                                {React.createElement(cat.icon, { className: "w-6 h-6", style: { color: cat.color } })}
                                {cat.title}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'rgba(180,170,210,0.55)' }}>{cat.description}</p>
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
                                        <h3 className="font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'rgba(180,170,210,0.55)' }}>{item.description}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => editItem(item)}
                                        style={{ color: 'rgba(180,170,210,0.5)' }}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs" style={{ color: 'rgba(180,170,210,0.55)' }}>Progress</span>
                                        <span className="text-sm font-bold" style={{ color: cat.color }}>{item.progress_level}%</span>
                                    </div>
                                    <Progress value={item.progress_level} className="h-1.5" />
                                </div>
                                {item.reflection_notes && (
                                    <div className="p-3 rounded-xl text-xs mb-3" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: 'rgba(200,190,230,0.75)' }}>
                                        {item.reflection_notes}
                                    </div>
                                )}
                                {item.milestones?.length > 0 && (
                                    <div className="space-y-1">
                                        {item.milestones.slice(-2).map((milestone, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#2dd4bf' }} />
                                                <div>
                                                    <div style={{ color: 'rgba(200,190,230,0.8)' }}>{milestone.milestone}</div>
                                                    <div style={{ color: 'rgba(160,150,190,0.45)' }}>{format(new Date(milestone.date), "MMM d, yyyy")}</div>
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
                                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(200,190,230,0.7)' }}>
                                    No {cat.title.toLowerCase()} yet
                                </h3>
                                <p className="text-sm mb-5" style={{ color: 'rgba(160,150,190,0.5)' }}>{cat.description}</p>
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
                        style={{ background: 'rgba(10,8,30,0.98)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                {React.createElement(categoryInfo[formData.category].icon, { className: "w-5 h-5", style: { color: categoryInfo[formData.category].color } })}
                                {editingItem ? 'Edit' : 'Add'} {categoryInfo[formData.category].title.slice(0, -1)}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title" style={{ color: 'rgba(200,190,230,0.7)' }}>Title</Label>
                                <Input id="title" value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="What are you working on?" required className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="description" style={{ color: 'rgba(200,190,230,0.7)' }}>Description</Label>
                                <Textarea id="description" value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe this area of growth..." rows={3} className="mt-1" />
                            </div>
                            <div>
                                <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Progress Level ({formData.progress_level}%)</Label>
                                <input type="range" min="0" max="100" value={formData.progress_level}
                                    onChange={(e) => setFormData({...formData, progress_level: parseInt(e.target.value)})}
                                    className="w-full mt-2" style={{ accentColor: '#c084fc' }} />
                            </div>
                            <div>
                                <Label htmlFor="reflection" style={{ color: 'rgba(200,190,230,0.7)' }}>Reflection Notes</Label>
                                <Textarea id="reflection" value={formData.reflection_notes}
                                    onChange={(e) => setFormData({...formData, reflection_notes: e.target.value})}
                                    placeholder="Your thoughts and reflections..." rows={3} className="mt-1" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label style={{ color: 'rgba(200,190,230,0.7)' }}>Milestones</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addMilestone}
                                        style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(200,190,230,0.7)', background: 'transparent' }}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                                {formData.milestones?.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {formData.milestones.map((milestone, i) => (
                                            <div key={i} className="flex items-center p-2 rounded-xl text-sm"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div>
                                                    <div style={{ color: 'rgba(200,190,230,0.85)' }}>{milestone.milestone}</div>
                                                    <div className="text-xs" style={{ color: 'rgba(160,150,190,0.5)' }}>{milestone.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}
                                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(200,190,230,0.7)', background: 'transparent' }}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="btn-cosmic rounded-xl">
                                    {editingItem ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}