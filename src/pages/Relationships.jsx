import React, { useState, useEffect } from "react";
import { Relationship, DailyCheckIn } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
    Users, Plus, Heart, AlertTriangle, Edit, TrendingUp, TrendingDown, X, Trash2
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";

const EMPTY_FORM = {
    name: '',
    relationship_type: 'friend',
    positive_qualities: [],
    concerns: [],
    boundary_notes: '',
    is_active: true
};

export default function Relationships() {
    const [relationships, setRelationships] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [showFormDialog, setShowFormDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedRelationship, setSelectedRelationship] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [newQuality, setNewQuality] = useState('');
    const [newConcern, setNewConcern] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [rels, cis] = await Promise.all([
            Relationship.list('-created_date'),
            DailyCheckIn.list('-date', 90)
        ]);
        setRelationships(rels);
        setCheckIns(cis);
    };

    const getStats = (name) => {
        const mentions = checkIns.filter(ci =>
            ci.high_moment?.who_involved?.toLowerCase().includes(name.toLowerCase()) ||
            ci.low_moment?.who_involved?.toLowerCase().includes(name.toLowerCase())
        );
        const highs = mentions.filter(ci => ci.high_moment?.who_involved?.toLowerCase().includes(name.toLowerCase())).length;
        const lows = mentions.filter(ci => ci.low_moment?.who_involved?.toLowerCase().includes(name.toLowerCase())).length;
        return {
            totalMentions: mentions.length,
            highs,
            lows,
            positiveRatio: mentions.length > 0 ? ((highs / mentions.length) * 100).toFixed(1) : 0,
            lastMention: mentions.length > 0 ? mentions[0].date : null
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedRelationship && showFormDialog) {
            await Relationship.update(selectedRelationship.id, formData);
        } else {
            await Relationship.create(formData);
        }
        setShowFormDialog(false);
        setSelectedRelationship(null);
        setFormData(EMPTY_FORM);
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this relationship?")) {
            await Relationship.delete(id);
            setShowDetailDialog(false);
            setSelectedRelationship(null);
            loadData();
        }
    };

    const openAdd = () => { setFormData(EMPTY_FORM); setSelectedRelationship(null); setShowFormDialog(true); };
    const openEdit = (rel) => { setFormData({...rel}); setSelectedRelationship(rel); setShowDetailDialog(false); setShowFormDialog(true); };
    const openDetail = (rel) => { setSelectedRelationship(rel); setShowDetailDialog(true); };

    const addTag = (field, value, setter) => {
        if (!value.trim()) return;
        setFormData(prev => ({...prev, [field]: [...(prev[field] || []), value.trim()]}));
        setter('');
    };
    const removeTag = (field, i) => setFormData(prev => ({...prev, [field]: prev[field].filter((_, idx) => idx !== i)}));

    const typeColor = (type) => ({
        family: 'bg-purple-100 text-purple-800',
        romantic_partner: 'bg-red-100 text-red-800',
        friend: 'bg-blue-100 text-blue-800',
        coworker: 'bg-green-100 text-green-800',
        acquaintance: 'bg-gray-100 text-gray-800',
        other: 'bg-yellow-100 text-yellow-800'
    }[type] || 'bg-gray-100 text-gray-800');

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>Relationships</h1>
                        <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>Track and understand your connections</p>
                    </div>
                    <Button onClick={openAdd} style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                        <Plus className="w-4 h-4 mr-2" /> Add Relationship
                    </Button>
                </div>

                {relationships.length === 0 ? (
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardContent className="text-center py-16">
                            <Users className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--warm-gray-400)'}} />
                            <h3 className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>No relationships tracked yet</h3>
                            <p className="text-sm mb-4" style={{color: 'var(--warm-gray-500)'}}>Add the important people in your life to track patterns</p>
                            <Button onClick={openAdd} style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                Add first relationship
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relationships.map((rel) => {
                            const stats = getStats(rel.name);
                            return (
                                <Card key={rel.id}
                                      className="border-0 shadow-sm bg-white/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                                      onClick={() => openDetail(rel)}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg" style={{color: 'var(--warm-gray-800)'}}>{rel.name}</CardTitle>
                                                <Badge className={`mt-1 ${typeColor(rel.relationship_type)}`}>
                                                    {rel.relationship_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"
                                                    onClick={(e) => { e.stopPropagation(); openEdit(rel); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                                <div className="text-lg font-bold" style={{color: 'var(--warm-gray-800)'}}>{stats.totalMentions}</div>
                                                <div style={{color: 'var(--warm-gray-600)'}}>Mentions</div>
                                            </div>
                                            <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                                <div className="text-lg font-bold" style={{color: 'var(--warm-gray-800)'}}>{stats.positiveRatio}%</div>
                                                <div style={{color: 'var(--warm-gray-600)'}}>Positive</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {stats.highs > stats.lows ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                                             stats.lows > stats.highs ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                                             <div className="w-4 h-4" />}
                                            <span style={{color: 'var(--warm-gray-600)'}}>{stats.highs} highs · {stats.lows} lows</span>
                                        </div>
                                        {stats.lastMention && (
                                            <div className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                                Last mention: {format(parseISO(stats.lastMention), "MMM d")}
                                            </div>
                                        )}
                                        {rel.positive_qualities?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {rel.positive_qualities.slice(0, 3).map((q, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{q}</Badge>
                                                ))}
                                                {rel.positive_qualities.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">+{rel.positive_qualities.length - 3}</Badge>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Detail Dialog */}
                <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                    {selectedRelationship && (
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <div className="flex items-center justify-between pr-6">
                                    <DialogTitle className="text-xl">{selectedRelationship.name}</DialogTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(selectedRelationship)}>
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleDelete(selectedRelationship.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-6 pt-2">
                                <div className="flex items-center gap-3">
                                    <Badge className={typeColor(selectedRelationship.relationship_type)}>
                                        {selectedRelationship.relationship_type.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {(() => {
                                    const stats = getStats(selectedRelationship.name);
                                    return (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                {label: 'Total Mentions', value: stats.totalMentions},
                                                {label: 'Positive Ratio', value: `${stats.positiveRatio}%`},
                                                {label: 'High Moments', value: stats.highs},
                                                {label: 'Low Moments', value: stats.lows},
                                            ].map(({label, value}) => (
                                                <div key={label} className="text-center p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                                    <div className="text-xl font-bold" style={{color: 'var(--warm-gray-800)'}}>{value}</div>
                                                    <div className="text-xs mt-1" style={{color: 'var(--warm-gray-600)'}}>{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {selectedRelationship.positive_qualities?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2" style={{color: 'var(--warm-gray-800)'}}>Positive Qualities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.positive_qualities.map((q, i) => (
                                                <Badge key={i} className="bg-emerald-100 text-emerald-800">
                                                    <Heart className="w-3 h-3 mr-1" />{q}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.concerns?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2" style={{color: 'var(--warm-gray-800)'}}>Areas of Concern</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.concerns.map((c, i) => (
                                                <Badge key={i} className="bg-yellow-100 text-yellow-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />{c}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.boundary_notes && (
                                    <div>
                                        <h4 className="font-medium mb-2" style={{color: 'var(--warm-gray-800)'}}>Boundary Notes</h4>
                                        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                            <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>{selectedRelationship.boundary_notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    )}
                </Dialog>

                {/* Add / Edit Dialog */}
                <Dialog open={showFormDialog} onOpenChange={(open) => { setShowFormDialog(open); if (!open) setFormData(EMPTY_FORM); }}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedRelationship ? 'Edit Relationship' : 'Add New Relationship'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={formData.name}
                                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                                       placeholder="Person's name or identifier" required className="mt-1" />
                            </div>

                            <div>
                                <Label>Relationship Type</Label>
                                <Select value={formData.relationship_type}
                                        onValueChange={(v) => setFormData({...formData, relationship_type: v})}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="family">Family</SelectItem>
                                        <SelectItem value="romantic_partner">Romantic Partner</SelectItem>
                                        <SelectItem value="friend">Friend</SelectItem>
                                        <SelectItem value="coworker">Coworker</SelectItem>
                                        <SelectItem value="acquaintance">Acquaintance</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Positive Qualities</Label>
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                    {(formData.positive_qualities || []).map((q, i) => (
                                        <Badge key={i} variant="outline" className="gap-1">
                                            {q}
                                            <button type="button" onClick={() => removeTag('positive_qualities', i)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newQuality} onChange={(e) => setNewQuality(e.target.value)}
                                           placeholder="Add a quality..." className="flex-1"
                                           onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('positive_qualities', newQuality, setNewQuality); }}} />
                                    <Button type="button" variant="outline" size="sm"
                                            onClick={() => addTag('positive_qualities', newQuality, setNewQuality)}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Concerns</Label>
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                    {(formData.concerns || []).map((c, i) => (
                                        <Badge key={i} variant="outline" className="gap-1">
                                            {c}
                                            <button type="button" onClick={() => removeTag('concerns', i)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newConcern} onChange={(e) => setNewConcern(e.target.value)}
                                           placeholder="Add a concern..." className="flex-1"
                                           onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('concerns', newConcern, setNewConcern); }}} />
                                    <Button type="button" variant="outline" size="sm"
                                            onClick={() => addTag('concerns', newConcern, setNewConcern)}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="boundary-notes">Boundary Notes</Label>
                                <Textarea id="boundary-notes" value={formData.boundary_notes}
                                          onChange={(e) => setFormData({...formData, boundary_notes: e.target.value})}
                                          placeholder="Notes about boundaries with this person..." rows={3} className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowFormDialog(false)}>Cancel</Button>
                                <Button type="submit" style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                    {selectedRelationship ? 'Save Changes' : 'Add Relationship'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}