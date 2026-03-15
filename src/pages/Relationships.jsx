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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
    Users, 
    Plus, 
    Heart, 
    AlertTriangle, 
    MoreHorizontal,
    Edit,
    Eye,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";

export default function Relationships() {
    const [relationships, setRelationships] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedRelationship, setSelectedRelationship] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        relationship_type: 'friend',
        positive_qualities: [],
        concerns: [],
        boundary_notes: '',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [relationshipsData, checkInsData] = await Promise.all([
            Relationship.list('-created_date'),
            DailyCheckIn.list('-date', 90)
        ]);
        setRelationships(relationshipsData);
        setCheckIns(checkInsData);
    };

    const getRelationshipStats = (relationshipName) => {
        const mentions = checkIns.filter(checkIn => {
            const highMention = checkIn.high_moment?.who_involved?.toLowerCase().includes(relationshipName.toLowerCase());
            const lowMention = checkIn.low_moment?.who_involved?.toLowerCase().includes(relationshipName.toLowerCase());
            return highMention || lowMention;
        });

        const highs = mentions.filter(checkIn => 
            checkIn.high_moment?.who_involved?.toLowerCase().includes(relationshipName.toLowerCase())
        ).length;

        const lows = mentions.filter(checkIn => 
            checkIn.low_moment?.who_involved?.toLowerCase().includes(relationshipName.toLowerCase())
        ).length;

        const recent = mentions.filter(checkIn => 
            parseISO(checkIn.date) >= subDays(new Date(), 30)
        );

        return {
            totalMentions: mentions.length,
            highs,
            lows,
            positiveRatio: mentions.length > 0 ? ((highs / mentions.length) * 100).toFixed(1) : 0,
            recentMentions: recent.length,
            lastMention: mentions.length > 0 ? mentions[0].date : null
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedRelationship && isEditing) {
            await Relationship.update(selectedRelationship.id, formData);
        } else {
            await Relationship.create(formData);
        }
        
        setShowAddDialog(false);
        setShowDetailDialog(false);
        setIsEditing(false);
        setSelectedRelationship(null);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            relationship_type: 'friend',
            positive_qualities: [],
            concerns: [],
            boundary_notes: '',
            is_active: true
        });
    };

    const openAddDialog = () => {
        resetForm();
        setIsEditing(false);
        setShowAddDialog(true);
    };

    const openDetailDialog = (relationship) => {
        setSelectedRelationship(relationship);
        setShowDetailDialog(true);
        setIsEditing(false);
    };

    const startEditing = () => {
        setFormData(selectedRelationship);
        setIsEditing(true);
    };

    const addQuality = (type) => {
        const input = prompt(`Add a ${type === 'positive_qualities' ? 'positive quality' : 'concern'}:`);
        if (input) {
            setFormData({
                ...formData,
                [type]: [...formData[type], input]
            });
        }
    };

    const removeQuality = (type, index) => {
        setFormData({
            ...formData,
            [type]: formData[type].filter((_, i) => i !== index)
        });
    };

    const getRelationshipTypeColor = (type) => {
        const colors = {
            family: 'bg-purple-100 text-purple-800',
            romantic_partner: 'bg-red-100 text-red-800',
            friend: 'bg-blue-100 text-blue-800',
            coworker: 'bg-green-100 text-green-800',
            acquaintance: 'bg-gray-100 text-gray-800',
            other: 'bg-yellow-100 text-yellow-800'
        };
        return colors[type] || colors.other;
    };

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                            Relationships
                        </h1>
                        <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                            Track and understand your connections
                        </p>
                    </div>
                    <Button onClick={openAddDialog}
                            className="transition-all duration-300"
                            style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Relationship
                    </Button>
                </div>

                {/* Relationships Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relationships.map((relationship) => {
                        const stats = getRelationshipStats(relationship.name);
                        
                        return (
                            <Card key={relationship.id} 
                                  className="border-0 shadow-sm bg-white/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                                  onClick={() => openDetailDialog(relationship)}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg" style={{color: 'var(--warm-gray-800)'}}>
                                                {relationship.name}
                                            </CardTitle>
                                            <Badge className={`mt-1 ${getRelationshipTypeColor(relationship.relationship_type)}`}>
                                                {relationship.relationship_type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDetailDialog(relationship);
                                                }}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                            <div className="text-lg font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                                {stats.totalMentions}
                                            </div>
                                            <div style={{color: 'var(--warm-gray-600)'}}>Total mentions</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                            <div className="text-lg font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                                {stats.positiveRatio}%
                                            </div>
                                            <div style={{color: 'var(--warm-gray-600)'}}>Positive ratio</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            {stats.highs > stats.lows ? (
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            ) : stats.lows > stats.highs ? (
                                                <TrendingDown className="w-4 h-4 text-red-500" />
                                            ) : (
                                                <div className="w-4 h-4" />
                                            )}
                                            <span style={{color: 'var(--warm-gray-600)'}}>
                                                {stats.highs} highs, {stats.lows} lows
                                            </span>
                                        </div>
                                    </div>

                                    {stats.lastMention && (
                                        <div className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                            Last mention: {format(parseISO(stats.lastMention), "MMM d")}
                                        </div>
                                    )}

                                    {relationship.positive_qualities?.length > 0 && (
                                        <div>
                                            <div className="text-xs font-medium mb-1" style={{color: 'var(--warm-gray-500)'}}>
                                                Positive qualities:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {relationship.positive_qualities.slice(0, 2).map((quality, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {quality}
                                                    </Badge>
                                                ))}
                                                {relationship.positive_qualities.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{relationship.positive_qualities.length - 2} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {relationships.length === 0 && (
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardContent className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--warm-gray-400)'}} />
                            <h3 className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>
                                No relationships tracked yet
                            </h3>
                            <p className="text-sm mb-4" style={{color: 'var(--warm-gray-500)'}}>
                                Start by adding the important people in your life
                            </p>
                            <Button onClick={openAddDialog}
                                    style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                Add first relationship
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Relationship</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Person's name or identifier"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="type">Relationship Type</Label>
                                <Select value={formData.relationship_type} 
                                        onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
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
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {formData.positive_qualities.map((quality, i) => (
                                            <Badge key={i} variant="outline" className="cursor-pointer"
                                                   onClick={() => removeQuality('positive_qualities', i)}>
                                                {quality} ×
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm"
                                            onClick={() => addQuality('positive_qualities')}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Quality
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Concerns</Label>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {formData.concerns.map((concern, i) => (
                                            <Badge key={i} variant="outline" className="cursor-pointer"
                                                   onClick={() => removeQuality('concerns', i)}>
                                                {concern} ×
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm"
                                            onClick={() => addQuality('concerns')}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Concern
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="boundary-notes">Boundary Notes</Label>
                                <Textarea
                                    id="boundary-notes"
                                    value={formData.boundary_notes}
                                    onChange={(e) => setFormData({...formData, boundary_notes: e.target.value})}
                                    placeholder="Notes about boundaries with this person..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit"
                                        style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                    Add Relationship
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Detail Dialog */}
                <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle>{selectedRelationship?.name}</DialogTitle>
                                <Button variant="outline" size="sm" onClick={startEditing}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        </DialogHeader>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* ... keep existing code (form fields) ... */}
                            </form>
                        ) : selectedRelationship && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Relationship Stats
                                        </h4>
                                        {(() => {
                                            const stats = getRelationshipStats(selectedRelationship.name);
                                            return (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span style={{color: 'var(--warm-gray-600)'}}>Total mentions:</span>
                                                        <span className="font-medium">{stats.totalMentions}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{color: 'var(--warm-gray-600)'}}>Positive ratio:</span>
                                                        <span className="font-medium">{stats.positiveRatio}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{color: 'var(--warm-gray-600)'}}>High moments:</span>
                                                        <span className="font-medium">{stats.highs}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{color: 'var(--warm-gray-600)'}}>Low moments:</span>
                                                        <span className="font-medium">{stats.lows}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Relationship Type
                                        </h4>
                                        <Badge className={getRelationshipTypeColor(selectedRelationship.relationship_type)}>
                                            {selectedRelationship.relationship_type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                {selectedRelationship.positive_qualities?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Positive Qualities
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.positive_qualities.map((quality, i) => (
                                                <Badge key={i} className="bg-emerald-100 text-emerald-800">
                                                    <Heart className="w-3 h-3 mr-1" />
                                                    {quality}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.concerns?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Areas of Concern
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRelationship.concerns.map((concern, i) => (
                                                <Badge key={i} className="bg-yellow-100 text-yellow-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    {concern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRelationship.boundary_notes && (
                                    <div>
                                        <h4 className="font-medium mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Boundary Notes
                                        </h4>
                                        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--sage-50)'}}>
                                            <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>
                                                {selectedRelationship.boundary_notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}