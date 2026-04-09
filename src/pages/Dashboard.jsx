import React, { useState, useEffect } from "react";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import CosmicContextBar from "@/components/cosmic/CosmicContextBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    Calendar, 
    TrendingUp, 
    TrendingDown, 
    Heart, 
    Plus, 
    AlertTriangle,
    Sparkles 
} from "lucide-react";
import { format, isToday } from "date-fns";

export default function Dashboard() {
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [todayCheckIn, setTodayCheckIn] = useState(null);
    const [weeklyAverage, setWeeklyAverage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        
        const checkIns = await DailyCheckIn.list('-date', 7);
        setRecentCheckIns(checkIns);
        
        const todayEntry = checkIns.find(entry => isToday(new Date(entry.date)));
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
        
        const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
        const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
        
        return recentAvg > olderAvg;
    };

    const getMoodColor = (score) => {
        if (score >= 8) return 'text-emerald-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getMoodBg = (score) => {
        if (score >= 8) return 'bg-emerald-50 border-emerald-200';
        if (score >= 6) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--warm-gray-800)'}}>
                        Welcome back
                    </h1>
                    <p className="text-lg" style={{color: 'var(--warm-gray-600)'}}>
                        How are you feeling today?
                    </p>
                </div>

                {/* Cosmic Context Bar */}
                <CosmicContextBar />

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Today's Check-in
                            </CardTitle>
                            <Heart className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {todayCheckIn ? (
                                    <span className={getMoodColor(todayCheckIn.mood_score)}>
                                        {todayCheckIn.mood_score}/10
                                    </span>
                                ) : (
                                    <span style={{color: 'var(--warm-gray-400)'}}>Not yet</span>
                                )}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                {todayCheckIn ? "Logged today" : "Ready when you are"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                7-Day Average
                            </CardTitle>
                            {getWeeklyTrend() === true ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : getWeeklyTrend() === false ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                                <span className="h-4 w-4" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {weeklyAverage > 0 ? weeklyAverage.toFixed(1) : '—'}/10
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                {getWeeklyTrend() === true && "Trending up"}
                                {getWeeklyTrend() === false && "Trending down"}
                                {getWeeklyTrend() === null && "Building your pattern"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Active Alerts
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {alerts.length}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                {alerts.length === 0 ? "All clear" : "Need attention"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {!todayCheckIn && (
                        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm" 
                              style={{background: 'linear-gradient(135deg, var(--sage-50) 0%, white 100%)'}}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--warm-gray-800)'}}>
                                            Start today's check-in
                                        </h3>
                                        <p className="text-sm mb-4" style={{color: 'var(--warm-gray-600)'}}>
                                            Take a moment to reflect on your day
                                        </p>
                                        <Link to={createPageUrl("DailyLog")}>
                                            <Button className="transition-all duration-300"
                                                    style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Log Today
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                         style={{background: 'var(--sage-100)'}}>
                                        <Calendar className="w-8 h-8" style={{color: 'var(--sage-500)'}} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--warm-gray-800)'}}>
                                        View Your Progress
                                    </h3>
                                    <p className="text-sm mb-4" style={{color: 'var(--warm-gray-600)'}}>
                                        See patterns and trends over time
                                    </p>
                                    <Link to={createPageUrl("Analytics")}>
                                        <Button variant="outline" className="transition-all duration-300">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            View Analytics
                                        </Button>
                                    </Link>
                                </div>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                     style={{background: 'var(--sage-100)'}}>
                                    <TrendingUp className="w-8 h-8" style={{color: 'var(--sage-500)'}} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Check-ins */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span style={{color: 'var(--warm-gray-800)'}}>Recent Check-ins</span>
                            <Link to={createPageUrl("Analytics")}>
                                <Button variant="ghost" size="sm" style={{color: 'var(--sage-600)'}}>
                                    View all
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-16 rounded-xl" style={{background: 'var(--warm-gray-200)'}} />
                                    </div>
                                ))}
                            </div>
                        ) : recentCheckIns.length > 0 ? (
                            <div className="space-y-3">
                                {recentCheckIns.slice(0, 5).map((checkIn) => (
                                    <div key={checkIn.id} 
                                         className={`p-4 rounded-xl border ${getMoodBg(checkIn.mood_score)}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant="outline" 
                                                           className={`${getMoodColor(checkIn.mood_score)} border-current`}>
                                                        {checkIn.mood_score}/10
                                                    </Badge>
                                                    <span className="text-sm font-medium" 
                                                          style={{color: 'var(--warm-gray-700)'}}>
                                                        {format(new Date(checkIn.date), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                                {checkIn.high_moment?.description && (
                                                    <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                                                        High: {checkIn.high_moment.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--warm-gray-400)'}} />
                                <p className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>
                                    Start your journey
                                </p>
                                <p className="text-sm mb-4" style={{color: 'var(--warm-gray-500)'}}>
                                    Your first check-in will appear here
                                </p>
                                <Link to={createPageUrl("DailyLog")}>
                                    <Button style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                        Create first entry
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                                <AlertTriangle className="w-5 h-5" style={{color: 'var(--sage-500)'}} />
                                Active Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-yellow-800">{alert.message}</p>
                                                <p className="text-sm text-yellow-600 mt-1">
                                                    {format(new Date(alert.created_date), "MMM d, h:mm a")}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                                {alert.severity}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}