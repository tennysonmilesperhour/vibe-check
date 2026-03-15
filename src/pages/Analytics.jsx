import React, { useState, useEffect } from "react";
import { DailyCheckIn, Relationship } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvokeLLM } from "@/integrations/Core";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { TrendingUp, Brain, Calendar, Users, Target } from "lucide-react";

export default function Analytics() {
    const [checkIns, setCheckIns] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [dateRange, setDateRange] = useState("30");
    const [selectedRelationship, setSelectedRelationship] = useState("all");
    const [insights, setInsights] = useState(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (checkIns.length > 0) {
            generateInsights();
        }
    }, [dateRange, selectedRelationship, checkIns]);

    const loadData = async () => {
        setIsLoading(true);
        const [checkInsData, relationshipsData] = await Promise.all([
            DailyCheckIn.list('-date', 90),
            Relationship.list()
        ]);
        setCheckIns(checkInsData);
        setRelationships(relationshipsData);
        setIsLoading(false);
    };

    const getFilteredData = () => {
        const days = parseInt(dateRange);
        const cutoffDate = subDays(new Date(), days);
        
        let filtered = checkIns.filter(checkIn => 
            parseISO(checkIn.date) >= cutoffDate
        );

        if (selectedRelationship !== "all") {
            filtered = filtered.filter(checkIn => {
                const highInvolves = checkIn.high_moment?.who_involved?.toLowerCase().includes(selectedRelationship.toLowerCase());
                const lowInvolves = checkIn.low_moment?.who_involved?.toLowerCase().includes(selectedRelationship.toLowerCase());
                return highInvolves || lowInvolves;
            });
        }

        return filtered.sort((a, b) => parseISO(a.date) - parseISO(b.date));
    };

    const generateInsights = async () => {
        if (checkIns.length === 0) return;
        
        setIsLoadingInsights(true);
        const filteredData = getFilteredData();
        
        try {
            const prompt = `As a supportive AI assistant (not a medical professional), analyze this mood tracking data and provide gentle, encouraging insights. 

Data summary:
- Total entries: ${filteredData.length}
- Date range: Last ${dateRange} days
- Average mood: ${(filteredData.reduce((sum, entry) => sum + entry.mood_score, 0) / filteredData.length).toFixed(1)}
- Relationship focus: ${selectedRelationship === "all" ? "All relationships" : selectedRelationship}

Recent entries: ${JSON.stringify(filteredData.slice(-5).map(entry => ({
    date: entry.date,
    mood: entry.mood_score,
    high: entry.high_moment?.description,
    low: entry.low_moment?.description,
    people: {
        high: entry.high_moment?.who_involved,
        low: entry.low_moment?.who_involved
    }
})))}

Please provide supportive insights about patterns, relationships, and gentle suggestions for reflection. Keep it encouraging and remind me these are just observations for reflection, not medical advice.`;

            const result = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        key_patterns: {
                            type: "array",
                            items: { type: "string" }
                        },
                        relationship_insights: {
                            type: "array", 
                            items: { type: "string" }
                        },
                        encouraging_notes: {
                            type: "array",
                            items: { type: "string" }
                        },
                        gentle_suggestions: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });
            
            setInsights(result);
        } catch (error) {
            console.error("Error generating insights:", error);
        }
        
        setIsLoadingInsights(false);
    };

    const getRelationshipStats = () => {
        const stats = {};
        
        checkIns.forEach(checkIn => {
            [checkIn.high_moment, checkIn.low_moment].forEach((moment, isLow) => {
                if (moment?.who_involved) {
                    const person = moment.who_involved;
                    if (!stats[person]) {
                        stats[person] = { highs: 0, lows: 0, total: 0 };
                    }
                    if (isLow) stats[person].lows++;
                    else stats[person].highs++;
                    stats[person].total++;
                }
            });
        });

        return Object.entries(stats)
            .map(([person, data]) => ({
                person,
                ...data,
                ratio: data.total > 0 ? (data.highs / data.total * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.total - a.total);
    };

    const chartData = getFilteredData().map(entry => ({
        date: format(parseISO(entry.date), 'MMM d'),
        mood: entry.mood_score,
        high: entry.high_moment?.intensity || 0,
        low: entry.low_moment?.intensity || 0
    }));

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                            Analytics & Insights
                        </h1>
                        <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                            Understanding your emotional patterns
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 3 months</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All relationships" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All relationships</SelectItem>
                                {relationships.map(rel => (
                                    <SelectItem key={rel.id} value={rel.name}>{rel.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Average Mood
                            </CardTitle>
                            <Target className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {getFilteredData().length > 0 
                                    ? (getFilteredData().reduce((sum, entry) => sum + entry.mood_score, 0) / getFilteredData().length).toFixed(1)
                                    : '—'
                                }/10
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Total Entries
                            </CardTitle>
                            <Calendar className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {getFilteredData().length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Best Day
                            </CardTitle>
                            <TrendingUp className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {getFilteredData().length > 0 
                                    ? Math.max(...getFilteredData().map(e => e.mood_score))
                                    : '—'
                                }/10
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Relationships
                            </CardTitle>
                            <Users className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {getRelationshipStats().length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle style={{color: 'var(--warm-gray-800)'}}>Mood Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--sage-200)" />
                                        <XAxis dataKey="date" stroke="var(--warm-gray-500)" />
                                        <YAxis domain={[1, 10]} stroke="var(--warm-gray-500)" />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: `1px solid var(--sage-200)`,
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="mood" 
                                            stroke="var(--sage-500)" 
                                            strokeWidth={3}
                                            dot={{fill: 'var(--sage-500)', strokeWidth: 2, r: 4}}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle style={{color: 'var(--warm-gray-800)'}}>High vs Low Intensity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--sage-200)" />
                                        <XAxis dataKey="date" stroke="var(--warm-gray-500)" />
                                        <YAxis stroke="var(--warm-gray-500)" />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: `1px solid var(--sage-200)`,
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="high" fill="var(--sage-400)" name="High Moments" />
                                        <Bar dataKey="low" fill="var(--warm-gray-400)" name="Low Moments" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Relationship Analysis */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm mb-8">
                    <CardHeader>
                        <CardTitle style={{color: 'var(--warm-gray-800)'}}>Relationship Impact</CardTitle>
                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                            How different people appear in your highs and lows
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {getRelationshipStats().slice(0, 6).map((stat) => (
                                <div key={stat.person} className="flex items-center justify-between p-4 rounded-lg border"
                                     style={{backgroundColor: 'var(--sage-50)', borderColor: 'var(--sage-200)'}}>
                                    <div className="flex-1">
                                        <h4 className="font-medium" style={{color: 'var(--warm-gray-800)'}}>{stat.person}</h4>
                                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                                            {stat.highs} highs, {stat.lows} lows ({stat.total} total mentions)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-lg font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                                {stat.ratio}%
                                            </div>
                                            <div className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                                positive ratio
                                            </div>
                                        </div>
                                        <Badge 
                                            className={`${
                                                parseFloat(stat.ratio) >= 60 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : parseFloat(stat.ratio) >= 40
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {parseFloat(stat.ratio) >= 60 ? 'Positive' : parseFloat(stat.ratio) >= 40 ? 'Balanced' : 'Challenging'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                            <Brain className="w-5 h-5" style={{color: 'var(--sage-500)'}} />
                            AI Insights
                        </CardTitle>
                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                            Supportive observations from your data (not medical advice)
                        </p>
                    </CardHeader>
                    <CardContent>
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-3 py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-500"></div>
                                <span style={{color: 'var(--warm-gray-600)'}}>Generating insights...</span>
                            </div>
                        ) : insights ? (
                            <div className="space-y-6">
                                {insights.key_patterns?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Key Patterns
                                        </h4>
                                        <div className="space-y-2">
                                            {insights.key_patterns.map((pattern, i) => (
                                                <div key={i} className="p-3 rounded-lg" 
                                                     style={{backgroundColor: 'var(--sage-50)'}}>
                                                    <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>{pattern}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.relationship_insights?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Relationship Insights
                                        </h4>
                                        <div className="space-y-2">
                                            {insights.relationship_insights.map((insight, i) => (
                                                <div key={i} className="p-3 rounded-lg" 
                                                     style={{backgroundColor: 'var(--warm-gray-50)'}}>
                                                    <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>{insight}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.encouraging_notes?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Encouraging Notes
                                        </h4>
                                        <div className="space-y-2">
                                            {insights.encouraging_notes.map((note, i) => (
                                                <div key={i} className="p-3 rounded-lg" 
                                                     style={{backgroundColor: 'var(--warm-gray-50)'}}>
                                                    <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>{note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.gentle_suggestions?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3" style={{color: 'var(--warm-gray-800)'}}>
                                            Gentle Suggestions for Reflection
                                        </h4>
                                        <div className="space-y-2">
                                            {insights.gentle_suggestions.map((suggestion, i) => (
                                                <div key={i} className="p-3 rounded-lg" 
                                                     style={{backgroundColor: 'var(--warm-gray-50)'}}>
                                                    <p className="text-sm" style={{color: 'var(--warm-gray-700)'}}>{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Button onClick={generateInsights} variant="outline">
                                    <Brain className="w-4 h-4 mr-2" />
                                    Generate Insights
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}