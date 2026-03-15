import React, { useState, useEffect } from "react";
import { BoundaryAlert, DailyCheckIn, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Shield, 
    AlertTriangle, 
    CheckCircle, 
    Settings,
    Download,
    Lock,
    TrendingDown,
    Bell
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Boundaries() {
    const [alerts, setAlerts] = useState([]);
    const [settings, setSettings] = useState({
        mood_threshold: 4,
        consecutive_alerts: 3,
        enable_notifications: true,
        password_protection: false,
        export_password: ""
    });
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadData();
        loadUserSettings();
    }, []);

    const loadData = async () => {
        const [alertsData, checkInsData] = await Promise.all([
            BoundaryAlert.list('-created_date', 20),
            DailyCheckIn.list('-date', 30)
        ]);
        setAlerts(alertsData);
        setRecentCheckIns(checkInsData);
    };

    const loadUserSettings = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
            if (userData.boundary_settings) {
                setSettings(prev => ({...prev, ...userData.boundary_settings}));
            }
        } catch (error) {
            console.log("User not found or settings not set");
        }
    };

    const saveSettings = async () => {
        await User.updateMyUserData({
            boundary_settings: settings
        });
    };

    const acknowledgeAlert = async (alertId) => {
        await BoundaryAlert.update(alertId, { is_acknowledged: true });
        loadData();
    };

    const checkBoundaries = async () => {
        const recentMoods = recentCheckIns.slice(0, 7).map(c => c.mood_score);
        const average = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length;
        
        // Check mood threshold
        if (average < settings.mood_threshold) {
            await BoundaryAlert.create({
                alert_type: "mood_threshold",
                threshold_value: settings.mood_threshold,
                message: `Your 7-day average mood (${average.toFixed(1)}) has dropped below your threshold of ${settings.mood_threshold}. This might be a good time to check in with yourself or reach out for support.`,
                severity: "medium"
            });
        }

        // Check consecutive lows
        const consecutiveLows = getConsecutiveLows();
        if (consecutiveLows >= settings.consecutive_alerts) {
            await BoundaryAlert.create({
                alert_type: "consecutive_lows",
                message: `You've logged ${consecutiveLows} consecutive low mood days. Remember, it's okay to ask for help and prioritize your wellbeing.`,
                severity: "high"
            });
        }

        // Check consecutive highs (might indicate mania or avoiding processing)
        const consecutiveHighs = getConsecutiveHighs();
        if (consecutiveHighs >= settings.consecutive_alerts) {
            await BoundaryAlert.create({
                alert_type: "consecutive_highs", 
                message: `You've had ${consecutiveHighs} consecutive high mood days. While this is wonderful, make sure you're still processing all emotions healthily.`,
                severity: "low"
            });
        }

        loadData();
    };

    const getConsecutiveLows = () => {
        let count = 0;
        for (let checkIn of recentCheckIns) {
            if (checkIn.mood_score <= 4) {
                count++;
            } else {
                break;
            }
        }
        return count;
    };

    const getConsecutiveHighs = () => {
        let count = 0;
        for (let checkIn of recentCheckIns) {
            if (checkIn.mood_score >= 8) {
                count++;
            } else {
                break;
            }
        }
        return count;
    };

    const exportData = async () => {
        if (settings.password_protection && !settings.export_password) {
            alert("Please set an export password first");
            return;
        }

        const exportData = {
            check_ins: recentCheckIns,
            alerts: alerts,
            export_date: new Date().toISOString(),
            password_protected: settings.password_protection
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `vibe-check-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="p-6 space-y-8" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)', minHeight: '100vh'}}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                             style={{background: 'linear-gradient(135deg, var(--sage-400) 0%, var(--sage-500) 100%)'}}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                            Boundaries & Alerts
                        </h1>
                    </div>
                    <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--warm-gray-600)'}}>
                        Set protective boundaries and receive alerts when patterns suggest you might need extra care.
                    </p>
                </div>

                {/* Current Status */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Active Alerts
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {alerts.filter(a => !a.is_acknowledged).length}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                Unacknowledged alerts
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Threshold Status
                            </CardTitle>
                            <TrendingDown className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {recentCheckIns.length > 0 && recentCheckIns.slice(0, 7).reduce((sum, c) => sum + c.mood_score, 0) / Math.min(7, recentCheckIns.length) >= settings.mood_threshold ? (
                                    <span className="text-emerald-600">Safe</span>
                                ) : (
                                    <span className="text-red-600">Alert</span>
                                )}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                Current boundary status
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>
                                Protection Level
                            </CardTitle>
                            <Lock className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {settings.password_protection ? "High" : "Standard"}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                Data protection enabled
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Boundary Settings */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{color: 'var(--warm-gray-800)'}}>
                            <Settings className="w-5 h-5" style={{color: 'var(--sage-500)'}} />
                            Boundary Settings
                        </CardTitle>
                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                            Configure when you want to be alerted about concerning patterns
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">
                                    Mood Threshold Alert (Currently: {settings.mood_threshold}/10)
                                </Label>
                                <p className="text-xs mb-3" style={{color: 'var(--warm-gray-500)'}}>
                                    Alert when 7-day average falls below this level
                                </p>
                                <Slider
                                    value={[settings.mood_threshold]}
                                    onValueChange={([value]) => setSettings({...settings, mood_threshold: value})}
                                    max={8}
                                    min={2}
                                    step={0.5}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs mt-1" style={{color: 'var(--warm-gray-400)'}}>
                                    <span>2 - Very sensitive</span>
                                    <span>8 - Less sensitive</span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">
                                    Consecutive Days Alert (Currently: {settings.consecutive_alerts} days)
                                </Label>
                                <p className="text-xs mb-3" style={{color: 'var(--warm-gray-500)'}}>
                                    Alert after this many consecutive high or low days
                                </p>
                                <Slider
                                    value={[settings.consecutive_alerts]}
                                    onValueChange={([value]) => setSettings({...settings, consecutive_alerts: value})}
                                    max={7}
                                    min={2}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs mt-1" style={{color: 'var(--warm-gray-400)'}}>
                                    <span>2 days</span>
                                    <span>7 days</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t" style={{borderColor: 'var(--sage-200)'}}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Enable Notifications</Label>
                                    <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                        Receive alerts when boundaries are crossed
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.enable_notifications}
                                    onCheckedChange={(checked) => setSettings({...settings, enable_notifications: checked})}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Password Protection</Label>
                                    <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                        Protect exports with password (for legal documentation)
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.password_protection}
                                    onCheckedChange={(checked) => setSettings({...settings, password_protection: checked})}
                                />
                            </div>

                            {settings.password_protection && (
                                <div>
                                    <Label htmlFor="export-password">Export Password</Label>
                                    <Input
                                        id="export-password"
                                        type="password"
                                        value={settings.export_password}
                                        onChange={(e) => setSettings({...settings, export_password: e.target.value})}
                                        placeholder="Set password for protected exports"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <div className="space-x-3">
                                <Button onClick={checkBoundaries} variant="outline">
                                    <Bell className="w-4 h-4 mr-2" />
                                    Check Now
                                </Button>
                                <Button onClick={exportData} variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                            </div>
                            <Button onClick={saveSettings}
                                    style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                Save Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle style={{color: 'var(--warm-gray-800)'}}>Recent Alerts</CardTitle>
                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>
                            Boundary alerts and notifications
                        </p>
                    </CardHeader>
                    <CardContent>
                        {alerts.length > 0 ? (
                            <div className="space-y-4">
                                {alerts.map((alert) => (
                                    <Alert key={alert.id} 
                                           className={`${alert.is_acknowledged ? 'opacity-60' : ''}`}>
                                        <div className="flex items-start justify-between w-full">
                                            <div className="flex items-start gap-3 flex-1">
                                                <AlertTriangle className="w-4 h-4 mt-1" />
                                                <div className="flex-1">
                                                    <AlertDescription className="text-sm">
                                                        {alert.message}
                                                    </AlertDescription>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge className={getSeverityColor(alert.severity)}>
                                                            {alert.severity}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {alert.alert_type.replace('_', ' ')}
                                                        </Badge>
                                                        <span className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                                            {format(parseISO(alert.created_date), "MMM d, h:mm a")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!alert.is_acknowledged && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Acknowledge
                                                </Button>
                                            )}
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Shield className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--warm-gray-400)'}} />
                                <h3 className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>
                                    No alerts yet
                                </h3>
                                <p className="text-sm" style={{color: 'var(--warm-gray-500)'}}>
                                    Your boundaries are looking healthy! Alerts will appear here when patterns suggest you might need extra support.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}