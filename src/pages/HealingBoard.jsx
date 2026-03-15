import React, { useState, useEffect } from "react";
import { HealingProgress } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
    Sparkles, 
    Plus, 
    Edit,
    Heart,
    Shield,
    Gift,
    Star,
    TrendingUp
} from "lucide-react";
import { format } from "date-fns";

const categoryInfo = {
    devotions: {
        icon: Heart,
        title: "Devotions",
        description: "Practices and rituals that nourish your soul",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        gradient: "from-pink-400 to-rose-400"
    },
    empowerments: {
        icon: Star,
        title: "Empowerments", 
        description: "Ways you're claiming your power and voice",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        gradient: "from-purple-400 to-indigo-400"
    },
    integrity_lines: {
        icon: Shield,
        title: "Integrity Lines",
        description: "Values and principles you won't compromise",
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        gradient: "from-blue-400 to-cyan-400"
    },
    gifts: {
        icon: Gift,
        title: "Gifts",
        description: "Your natural talents and unique contributions",
        color: "bg-green-100 text-green-800 border-green-200",
        gradient: "from-green-400 to-emerald-400"
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

    useEffect(() => {
        loadHealingProgress();
    }, []);

    const loadHealingProgress = async () => {
        const items = await HealingProgress.list('-created_date');
        setHealingItems(items);
    };

    const getItemsByCategory = (category) => {
        return healingItems.filter(item => item.category === category);
    };

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
        setFormData({
            category: selectedCategory,
            title: "",
            description: "",
            progress_level: 0,
            reflection_notes: "",
            milestones: []
        });
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
            setFormData({
                ...formData,
                milestones: [
                    ...formData.milestones,
                    {
                        date: format(new Date(), 'yyyy-MM-dd'),
                        milestone
                    }
                ]
            });
        }
    };

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                             style={{background: 'linear-gradient(135deg, var(--sage-400) 0%, var(--sage-500) 100%)'}}>
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                            Healing Board
                        </h1>
                    </div>
                    <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--warm-gray-600)'}}>
                        Track your journey of growth and discover your unique essence through 
                        devotions, empowerments, integrity lines, and gifts.
                    </p>
                </div>

                {/* Overall Progress */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8"
                      style={{background: 'linear-gradient(135deg, white 0%, var(--sage-50) 100%)'}}>
                    <CardContent className="p-8 text-center">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2" style={{color: 'var(--warm-gray-800)'}}>
                                Your Unique Essence
                            </h3>
                            <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                                Overall healing progress
                            </p>
                        </div>
                        <div className="max-w-md mx-auto">
                            <div className="relative">
                                <div className="text-4xl font-bold mb-2" style={{color: 'var(--sage-600)'}}>
                                    {getOverallProgress().toFixed(0)}%
                                </div>
                                <Progress value={getOverallProgress()} className="h-3 mb-4" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 mt-8">
                            {Object.entries(categoryInfo).map(([category, info]) => (
                                <div key={category} className="text-center">
                                    <info.icon className="w-6 h-6 mx-auto mb-2" style={{color: 'var(--sage-500)'}} />
                                    <div className="font-medium" style={{color: 'var(--warm-gray-700)'}}>{info.title}</div>
                                    <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                        {getCategoryAverage(category).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Category Navigation */}
                <div className="flex flex-wrap gap-3 mb-8 justify-center">
                    {Object.entries(categoryInfo).map(([category, info]) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category)}
                            className={`transition-all duration-300 ${
                                selectedCategory === category
                                    ? ''
                                    : 'hover:scale-105'
                            }`}
                            style={selectedCategory === category ? {
                                background: `linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)`
                            } : {}}
                        >
                            <info.icon className="w-4 h-4 mr-2" />
                            {info.title}
                        </Button>
                    ))}
                </div>

                {/* Category Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3" style={{color: 'var(--warm-gray-800)'}}>
                                {React.createElement(categoryInfo[selectedCategory].icon, {
                                    className: "w-6 h-6",
                                    style: {color: 'var(--sage-500)'}
                                })}
                                {categoryInfo[selectedCategory].title}
                            </h2>
                            <p className="text-lg mt-1" style={{color: 'var(--warm-gray-600)'}}>
                                {categoryInfo[selectedCategory].description}
                            </p>
                        </div>
                        <Button onClick={() => openAddDialog(selectedCategory)}
                                className="transition-all duration-300"
                                style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add {categoryInfo[selectedCategory].title.slice(0, -1)}
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getItemsByCategory(selectedCategory).map((item) => (
                            <Card key={item.id} 
                                  className="border-0 shadow-sm bg-white/70 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg" style={{color: 'var(--warm-gray-800)'}}>
                                                {item.title}
                                            </CardTitle>
                                            <p className="text-sm mt-1" style={{color: 'var(--warm-gray-600)'}}>
                                                {item.description}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => editItem(item)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                                Progress
                                            </span>
                                            <span className="text-lg font-bold" style={{color: 'var(--sage-600)'}}>
                                                {item.progress_level}%
                                            </span>
                                        </div>
                                        <Progress value={item.progress_level} className="h-2" />
                                    </div>

                                    {item.reflection_notes && (
                                        <div className="p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                            <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>
                                                {item.reflection_notes}
                                            </p>
                                        </div>
                                    )}

                                    {item.milestones?.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>
                                                Recent milestones:
                                            </h5>
                                            <div className="space-y-2">
                                                {item.milestones.slice(-2).map((milestone, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm">
                                                        <TrendingUp className="w-3 h-3 mt-0.5 text-emerald-500" />
                                                        <div>
                                                            <div style={{color: 'var(--warm-gray-700)'}}>{milestone.milestone}</div>
                                                            <div className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                                                {format(new Date(milestone.date), "MMM d, yyyy")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {getItemsByCategory(selectedCategory).length === 0 && (
                            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm col-span-full">
                                <CardContent className="text-center py-12">
                                    {React.createElement(categoryInfo[selectedCategory].icon, {
                                        className: "w-12 h-12 mx-auto mb-4",
                                        style: {color: 'var(--warm-gray-400)'}
                                    })}
                                    <h3 className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>
                                        No {categoryInfo[selectedCategory].title.toLowerCase()} yet
                                    </h3>
                                    <p className="text-sm mb-4" style={{color: 'var(--warm-gray-500)'}}>
                                        {categoryInfo[selectedCategory].description}
                                    </p>
                                    <Button onClick={() => openAddDialog(selectedCategory)}
                                            style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                        Add your first {categoryInfo[selectedCategory].title.slice(0, -1).toLowerCase()}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Add/Edit Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {React.createElement(categoryInfo[formData.category].icon, {
                                    className: "w-5 h-5"
                                })}
                                {editingItem ? 'Edit' : 'Add'} {categoryInfo[formData.category].title.slice(0, -1)}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="What are you working on?"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe this area of growth..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="progress">Progress Level ({formData.progress_level}%)</Label>
                                <input
                                    id="progress"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.progress_level}
                                    onChange={(e) => setFormData({...formData, progress_level: parseInt(e.target.value)})}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <Label htmlFor="reflection">Reflection Notes</Label>
                                <Textarea
                                    id="reflection"
                                    value={formData.reflection_notes}
                                    onChange={(e) => setFormData({...formData, reflection_notes: e.target.value})}
                                    placeholder="Your thoughts and reflections..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Milestones</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                {formData.milestones?.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {formData.milestones.map((milestone, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded border">
                                                <div>
                                                    <div className="text-sm font-medium">{milestone.milestone}</div>
                                                    <div className="text-xs text-gray-500">{milestone.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit"
                                        style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
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