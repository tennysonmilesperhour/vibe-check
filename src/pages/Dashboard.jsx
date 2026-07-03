import React, { useState, useEffect } from "react";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, TrendingUp, TrendingDown, Heart, Plus, AlertTriangle, Sparkles, Star } from "lucide-react";
import { format } from "date-fns";
import { isTodayKey, parseLocalDate } from "@/lib/dates";
import CosmicContextBar from "@/components/cosmic/CosmicContextBar";
import CosmicWisdomCard from "@/components/cosmic/CosmicWisdomCard";

export default function Dashboard() {
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [todayCheckIn, setTodayCheckIn] = useState(null);
    const [weeklyAverage, setWeeklyAverage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadDashboardData(); }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        const checkIns = await DailyCheckIn.list('-date', 7);
        setRecentCheckIns(checkIns);
        const todayEntry = checkIns.find(entry => isTodayKey(entry.date));
        setTodayCheckIn(todayEntry);
        if (checkIns.length > 0) {
            const average = checkIns.reduce((sum, entry) => sum + entry.mood_score, 0) / checkIns.length;
            setWeeklyAverage(average);
        }
        const unacknowledgedAlerts = await BoundaryAlert.filter({ is_acknowledged: false });
        setAlerts(unacknowledgedAlerts);
        setIsLoading(false);
    };

    const getWeeklyTrend = () => {
        if (recentCheckIns.length < 2) return null;
        const recent = recentCheckIns.slice(0, 3);
        const older = recentCheckIns.slice(3, 6);
        const recentAvg = recent.reduce((sum, e) => sum + e.mood_score, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.mood_score, 0) / older.length;
        return recentAvg > olderAvg;
    };

    const getMoodGradient = (score) => {
        if (score >= 8) return 'linear-gradient(135deg, #D9A44A, #C9834B)';
        if (score >= 6) return 'linear-gradient(135deg, #B8902F, #C08A2E)';
        return 'linear-gradient(135deg, #C25E8F, #ef4444)';
    };

    const getMoodBorder = (score) => {
        if (score >= 8) return 'rgba(201,131,75,0.25)';
        if (score >= 6) return 'rgba(184,144,47,0.25)';
        return 'rgba(194,94,143,0.25)';
    };

    return (
        <div className="p-4 space-y-5 min-h-screen relative">
            {/* Decorative orbs */}
            <div className="orb-purple" style={{ top: '-60px', right: '10%' }} />
            <div className="orb-blue" style={{ top: '40%', left: '-40px' }} />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(138,114,184,0.7)' }}>
                        ✦ Welcome back
                    </p>
                    <h1 className="text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        How are you feeling?
                    </h1>
                    <p className="text-base" style={{ color: 'rgba(105,95,128,0.8)' }}>
                        Your cosmic wellness snapshot for today
                    </p>
                </div>

                {/* Cosmic Context */}
                <CosmicContextBar />

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-3 mb-5">
                    {/* Today's mood */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #8A72B8, transparent)', transform: 'translate(30%, -30%)' }} />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,114,184,0.7)' }}>Today's Vibe</span>
                            <Heart className="w-4 h-4" style={{ color: '#8A72B8' }} />
                        </div>
                        <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {todayCheckIn ? (
                                <span style={{
                                    background: getMoodGradient(todayCheckIn.mood_score),
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {todayCheckIn.mood_score}<span className="text-xl">/10</span>
                                </span>
                            ) : (
                                <span style={{ color: 'rgba(105,95,128,0.5)' }}>—</span>
                            )}
                        </div>
                        <p className="text-sm" style={{ color: 'rgba(105,95,128,0.65)' }}>
                            {todayCheckIn ? "Logged today" : "Not yet logged"}
                        </p>
                    </div>

                    {/* 7-day average */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #6B95C8, transparent)', transform: 'translate(30%, -30%)' }} />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(107,149,200,0.7)' }}>7-Day Avg</span>
                            {getWeeklyTrend() === true
                                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                : getWeeklyTrend() === false
                                ? <TrendingDown className="w-4 h-4 text-rose-400" />
                                : <Star className="w-4 h-4" style={{ color: '#6B95C8' }} />}
                        </div>
                        <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                            {weeklyAverage > 0 ? weeklyAverage.toFixed(1) : '—'}<span className="text-xl">/10</span>
                        </div>
                        <p className="text-sm" style={{ color: 'rgba(107,149,200,0.6)' }}>
                            {getWeeklyTrend() === true ? "↑ Trending up" : getWeeklyTrend() === false ? "↓ Trending down" : "Building your pattern"}
                        </p>
                    </div>

                    {/* Alerts */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #C25E8F, transparent)', transform: 'translate(30%, -30%)' }} />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(194,94,143,0.7)' }}>Active Alerts</span>
                            <AlertTriangle className="w-4 h-4" style={{ color: '#C25E8F' }} />
                        </div>
                        <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                            {alerts.length}
                        </div>
                        <p className="text-sm" style={{ color: alerts.length === 0 ? 'rgba(201,131,75,0.6)' : 'rgba(194,94,143,0.6)' }}>
                            {alerts.length === 0 ? "✓ All clear" : "Needs attention"}
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-3 mb-5">
                    {!todayCheckIn && (
                        <div className="glass-card-glow p-6 relative overflow-hidden">
                            <div className="absolute inset-0 shimmer rounded-2xl opacity-30 pointer-events-none" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                                        Start today's check-in
                                    </h3>
                                    <p className="text-sm mb-4" style={{ color: 'rgba(105,95,128,0.7)' }}>
                                        Take a moment to reflect on your day
                                    </p>
                                    <Link to={createPageUrl("DailyLog")}>
                                        <Button className="btn-cosmic rounded-xl font-semibold">
                                            <Plus className="w-4 h-4 mr-2" /> Log Today
                                        </Button>
                                    </Link>
                                </div>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'rgba(138,114,184,0.15)', border: '1px solid rgba(138,114,184,0.25)' }}>
                                    <Calendar className="w-8 h-8" style={{ color: '#8A72B8' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass-card p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                                View Your Progress
                            </h3>
                            <p className="text-sm mb-4" style={{ color: 'rgba(105,95,128,0.7)' }}>
                                See patterns and trends over time
                            </p>
                            <Link to={createPageUrl("Analytics")}>
                                <Button variant="outline" className="rounded-xl font-semibold"
                                    style={{ borderColor: 'rgba(138,114,184,0.3)', color: '#8A72B8', background: 'rgba(138,114,184,0.08)' }}>
                                    <Sparkles className="w-4 h-4 mr-2" /> View Analytics
                                </Button>
                            </Link>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(107,149,200,0.1)', border: '1px solid rgba(107,149,200,0.2)' }}>
                            <TrendingUp className="w-8 h-8" style={{ color: '#6B95C8' }} />
                        </div>
                    </div>
                </div>

                {/* Recent Check-ins */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>Recent Check-ins</h2>
                        <Link to={createPageUrl("Analytics")}>
                            <Button variant="ghost" size="sm" style={{ color: '#8A72B8' }}>View all</Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="h-16 rounded-xl animate-pulse"
                                    style={{ background: 'rgba(255,255,255,0.64)' }} />
                            ))}
                        </div>
                    ) : recentCheckIns.length > 0 ? (
                        <div className="space-y-3">
                            {recentCheckIns.slice(0, 5).map((checkIn) => (
                                <div key={checkIn.id} className="p-4 rounded-xl flex items-center gap-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.5)',
                                        border: `1px solid ${getMoodBorder(checkIn.mood_score)}`
                                    }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ background: getMoodGradient(checkIn.mood_score), color: 'white' }}>
                                        {checkIn.mood_score}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium" style={{ color: 'rgba(70,60,92,0.85)' }}>
                                            {format(parseLocalDate(checkIn.date), "MMMM d, yyyy")}
                                        </span>
                                        {checkIn.high_moment?.description && (
                                            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(112,102,134,0.65)' }}>
                                                ✦ {checkIn.high_moment.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-3">✦</div>
                            <p className="font-semibold mb-1" style={{ color: 'rgba(82,72,104,0.8)', fontFamily: 'Space Grotesk, sans-serif' }}>
                                Begin your journey
                            </p>
                            <p className="text-sm mb-4" style={{ color: 'rgba(122,112,144,0.6)' }}>Your first entry will appear here</p>
                            <Link to={createPageUrl("DailyLog")}>
                                <Button className="btn-cosmic rounded-xl">Create first entry</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Cosmic Wisdom */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>✦ Cosmic Wisdom</h2>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(105,95,128,0.6)' }}>Personalised insight — click to reveal</p>
                        </div>
                        <Link to="/CosmicWisdom">
                            <Button variant="ghost" size="sm" style={{ color: '#8A72B8' }}>View all</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        <CosmicWisdomCard periodType="daily" />
                        <CosmicWisdomCard periodType="weekly" />
                    </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="glass-card p-6"
                        style={{ border: '1px solid rgba(194,94,143,0.2)', background: 'rgba(194,94,143,0.04)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5" style={{ color: '#C25E8F' }} />
                            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                                Active Alerts
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="p-4 rounded-xl"
                                    style={{ background: 'rgba(194,94,143,0.07)', border: '1px solid rgba(194,94,143,0.15)' }}>
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm" style={{ color: 'rgba(70,60,92,0.85)' }}>{alert.message}</p>
                                        <Badge className="ml-3 shrink-0 text-xs"
                                            style={{ background: 'rgba(194,94,143,0.15)', color: '#C25E8F', border: '1px solid rgba(194,94,143,0.2)' }}>
                                            {alert.severity}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}