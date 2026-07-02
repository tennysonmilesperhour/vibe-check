import React, { useState, useEffect } from "react";
import { Relationship, DailyCheckIn } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Heart, AlertTriangle, Edit, TrendingUp, TrendingDown, X, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

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
            totalMentions: mentions.length, highs, lows,
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

    const typeStyle = (type) => ({
        family: { bg: 'rgba(138,114,184,0.15)', color: '#8A72B8', border: 'rgba(138,114,184,0.25)' },
        romantic_partner: { bg: 'rgba(194,94,143,0.15)', color: '#C25E8F', border: 'rgba(194,94,143,0.25)' },
        friend: { bg: 'rgba(107,149,200,0.15)', color: '#6B95C8', border: 'rgba(107,149,200,0.25)' },
        coworker: { bg: 'rgba(201,131,75,0.15)', color: '#C9834B', border: 'rgba(201,131,75,0.25)' },
        acquaintance: { bg: 'rgba(61,52,80,0.1)', color: 'rgba(82,72,104,0.8)', border: 'rgba(61,52,80,0.14)' },
        other: { bg: 'rgba(184,144,47,0.15)', color: '#B8902F', border: 'rgba(184,144,47,0.25)' },
    }[type] || { bg: 'rgba(61,52,80,0.1)', color: 'rgba(82,72,104,0.8)', border: 'rgba(61,52,80,0.14)' });

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="orb-purple" style={{ top: '-40px', right: '15%' }} />
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(138,114,184,0.7)' }}>✦ Your Circle</p>
                        <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Relationships</h1>
                        <p className="text-base" style={{ color: 'rgba(105,95,128,0.75)' }}>Track and understand your connections</p>
                    </div>
                    <Button onClick={openAdd} className="btn-cosmic rounded-xl font-semibold">
                        <Plus className="w-4 h-4 mr-2" /> Add Relationship
                    </Button>
                </div>

                {relationships.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(138,114,184,0.3)' }} />
                        <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(82,72,104,0.8)' }}>No relationships tracked yet</h3>
                        <p className="text-sm mb-5" style={{ color: 'rgba(122,112,144,0.6)' }}>Add the important people in your life to track patterns</p>
                        <Button onClick={openAdd} className="btn-cosmic rounded-xl">Add first relationship</Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {relationships.map((rel) => {
                            const stats = getStats(rel.name);
                            const ts = typeStyle(rel.relationship_type);
                            return (
                                <div key={rel.id} className="glass-card p-5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                                    style={{ border: `1px solid ${ts.border}` }}
                                    onClick={() => openDetail(rel)}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>{rel.name}</h3>
                                            <Badge className="text-xs" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                                                {rel.relationship_type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1"
                                            style={{ color: 'rgba(105,95,128,0.6)' }}
                                            onClick={(e) => { e.stopPropagation(); openEdit(rel); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(61,52,80,0.08)' }}>
                                            <div className="text-xl font-bold" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>{stats.totalMentions}</div>
                                            <div className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>Mentions</div>
                                        </div>
                                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(61,52,80,0.08)' }}>
                                            <div className="text-xl font-bold" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>{stats.positiveRatio}%</div>
                                            <div className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>Positive</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {stats.highs > stats.lows ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                                         stats.lows > stats.highs ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                                         <div className="w-4 h-4" />}
                                        <span style={{ color: 'rgba(105,95,128,0.6)' }}>{stats.highs} highs · {stats.lows} lows</span>
                                    </div>
                                    {stats.lastMention && (
                                        <p className="text-xs mt-2" style={{ color: 'rgba(122,112,144,0.5)' }}>
                                            Last mention: {format(parseISO(stats.lastMention), "MMM d")}
                                        </p>
                                    )}
                                    {rel.positive_qualities?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {rel.positive_qualities.slice(0, 3).map((q, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(201,131,75,0.1)', color: '#C9834B', border: '1px solid rgba(201,131,75,0.2)' }}>
                                                    {q}
                                                </span>
                                            ))}
                                            {rel.positive_qualities.length > 3 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.68)', color: 'rgba(105,95,128,0.6)' }}>
                                                    +{rel.positive_qualities.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Detail Dialog */}
                <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                    {selectedRelationship && (
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"
                            style={{ background: 'rgba(253,251,247,0.98)', border: '1px solid rgba(138,114,184,0.2)' }}>
                            <DialogHeader>
                                <div className="flex items-center justify-between pr-6">
                                    <DialogTitle className="text-xl gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{selectedRelationship.name}</DialogTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(selectedRelationship)}
                                            style={{ borderColor: 'rgba(138,114,184,0.3)', color: '#8A72B8', background: 'rgba(138,114,184,0.08)' }}>
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm"
                                            style={{ borderColor: 'rgba(194,94,143,0.3)', color: '#C25E8F', background: 'rgba(194,94,143,0.08)' }}
                                            onClick={() => handleDelete(selectedRelationship.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-5 pt-2">
                                {(() => {
                                    const ts = typeStyle(selectedRelationship.relationship_type);
                                    return <Badge className="text-xs" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{selectedRelationship.relationship_type.replace('_', ' ')}</Badge>;
                                })()}

                                {(() => {
                                    const stats = getStats(selectedRelationship.name);
                                    return (
                                        <div className="grid grid-cols-4 gap-3">
                                            {[
                                                {label: 'Total', value: stats.totalMentions},
                                                {label: 'Positive', value: `${stats.positiveRatio}%`},
                                                {label: 'Highs', value: stats.highs},
                                                {label: 'Lows', value: stats.lows},
                                            ].map(({label, value}) => (
                                                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.64)', border: '1px solid rgba(61,52,80,0.1)' }}>
                                                    <div className="text-xl font-bold" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
                                                    <div className="text-xs mt-1" style={{ color: 'rgba(105,95,128,0.6)' }}>{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {selectedRelationship.positive_qualities?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{ color: 'rgba(201,131,75,0.8)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Positive Qualities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.positive_qualities.map((q, i) => (
                                                <span key={i} className="text-sm px-3 py-1 rounded-full flex items-center gap-1"
                                                    style={{ background: 'rgba(201,131,75,0.1)', color: '#C9834B', border: '1px solid rgba(201,131,75,0.2)' }}>
                                                    <Heart className="w-3 h-3" />{q}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.concerns?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{ color: 'rgba(184,144,47,0.8)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Areas of Concern</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.concerns.map((c, i) => (
                                                <span key={i} className="text-sm px-3 py-1 rounded-full flex items-center gap-1"
                                                    style={{ background: 'rgba(184,144,47,0.1)', color: '#B8902F', border: '1px solid rgba(184,144,47,0.2)' }}>
                                                    <AlertTriangle className="w-3 h-3" />{c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.boundary_notes && (
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{ color: 'rgba(138,114,184,0.8)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Boundary Notes</h4>
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(138,114,184,0.07)', border: '1px solid rgba(138,114,184,0.15)' }}>
                                            <p className="text-sm" style={{ color: 'rgba(82,72,104,0.9)' }}>{selectedRelationship.boundary_notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    )}
                </Dialog>

                {/* Add / Edit Dialog */}
                <Dialog open={showFormDialog} onOpenChange={(open) => { setShowFormDialog(open); if (!open) setFormData(EMPTY_FORM); }}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"
                        style={{ background: 'rgba(253,251,247,0.98)', border: '1px solid rgba(138,114,184,0.2)' }}>
                        <DialogHeader>
                            <DialogTitle className="gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                {selectedRelationship ? 'Edit Relationship' : 'Add New Relationship'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                            <div>
                                <Label htmlFor="name" style={{ color: 'rgba(82,72,104,0.8)' }}>Name</Label>
                                <Input id="name" value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Person's name or identifier" required className="mt-1" />
                            </div>

                            <div>
                                <Label style={{ color: 'rgba(82,72,104,0.8)' }}>Relationship Type</Label>
                                <Select value={formData.relationship_type} onValueChange={(v) => setFormData({...formData, relationship_type: v})}>
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
                                <Label style={{ color: 'rgba(82,72,104,0.8)' }}>Positive Qualities</Label>
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                    {(formData.positive_qualities || []).map((q, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                            style={{ background: 'rgba(201,131,75,0.1)', color: '#C9834B', border: '1px solid rgba(201,131,75,0.2)' }}>
                                            {q}
                                            <button type="button" onClick={() => removeTag('positive_qualities', i)}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newQuality} onChange={(e) => setNewQuality(e.target.value)}
                                        placeholder="Add a quality..." className="flex-1"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('positive_qualities', newQuality, setNewQuality); }}} />
                                    <Button type="button" variant="outline" size="sm"
                                        style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)' }}
                                        onClick={() => addTag('positive_qualities', newQuality, setNewQuality)}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label style={{ color: 'rgba(82,72,104,0.8)' }}>Concerns</Label>
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                    {(formData.concerns || []).map((c, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                            style={{ background: 'rgba(184,144,47,0.1)', color: '#B8902F', border: '1px solid rgba(184,144,47,0.2)' }}>
                                            {c}
                                            <button type="button" onClick={() => removeTag('concerns', i)}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newConcern} onChange={(e) => setNewConcern(e.target.value)}
                                        placeholder="Add a concern..." className="flex-1"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('concerns', newConcern, setNewConcern); }}} />
                                    <Button type="button" variant="outline" size="sm"
                                        style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)' }}
                                        onClick={() => addTag('concerns', newConcern, setNewConcern)}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="boundary-notes" style={{ color: 'rgba(82,72,104,0.8)' }}>Boundary Notes</Label>
                                <Textarea id="boundary-notes" value={formData.boundary_notes}
                                    onChange={(e) => setFormData({...formData, boundary_notes: e.target.value})}
                                    placeholder="Notes about boundaries with this person..." rows={3} className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowFormDialog(false)}
                                    style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)', background: 'transparent' }}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="btn-cosmic rounded-xl">
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