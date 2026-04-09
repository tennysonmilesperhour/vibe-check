import React, { useState, useEffect } from "react";
import { BoundaryAlert, DailyCheckIn } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Shield, AlertTriangle, CheckCircle, Settings, Download, Lock, TrendingDown, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Boundaries() {
    const { toast } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [settings, setSettings] = useState({
        mood_threshold: 4,
        consecutive_alerts: 3,
        enable_notifications: true,
        password_protection: false,
        export_password: ""
    });
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [savingSettings, setSavingSettings] = useState(false);
    const [checkingBoundaries, setCheckingBoundaries] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [alertsData, checkInsData] = await Promise.all([
            BoundaryAlert.list('-created_date', 20),
            DailyCheckIn.list('-date', 30)
        ]);
        setAlerts(alertsData);
        setRecentCheckIns(checkInsData);

        try {
            const user = await base44.auth.me();
            if (user?.boundary_settings) {
                setSettings(prev => ({...prev, ...user.boundary_settings}));
            }
        } catch (e) {}
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        await base44.auth.updateMe({ boundary_settings: settings });
        setSavingSettings(false);
        toast({ title: "Settings saved", description: "Your boundary settings have been updated." });
    };

    const acknowledgeAlert = async (alertId) => {
        await BoundaryAlert.update(alertId, { is_acknowledged: true });
        setAlerts(prev => prev.map(a => a.id === alertId ? {...a, is_acknowledged: true} : a));
    };

    const getConsecutiveLows = (checkIns) => {
        let count = 0;
        for (const ci of checkIns) {
            if (ci.mood_score <= 4) count++;
            else break;
        }
        return count;
    };

    const getConsecutiveHighs = (checkIns) => {
        let count = 0;
        for (const ci of checkIns) {
            if (ci.mood_score >= 8) count++;
            else break;
        }
        return count;
    };

    const checkBoundaries = async () => {
        if (recentCheckIns.length === 0) {
            toast({ title: "No data yet", description: "Start logging daily check-ins to use boundary detection." });
            return;
        }
        setCheckingBoundaries(true);
        const newAlerts = [];
        const last7 = recentCheckIns.slice(0, 7);
        const average = last7.reduce((sum, c) => sum + c.mood_score, 0) / last7.length;

        if (average < settings.mood_threshold) {
            newAlerts.push({
                alert_type: "mood_threshold",
                threshold_value: settings.mood_threshold,
                message: `Your 7-day average mood (${average.toFixed(1)}) has dropped below your threshold of ${settings.mood_threshold}. This might be a good time to check in with yourself or reach out for support.`,
                severity: "medium",
                is_acknowledged: false
            });
        }

        const consecutiveLows = getConsecutiveLows(recentCheckIns);
        if (consecutiveLows >= settings.consecutive_alerts) {
            newAlerts.push({
                alert_type: "consecutive_lows",
                message: `You've logged ${consecutiveLows} consecutive low mood days. Remember, it's okay to ask for help and prioritize your wellbeing.`,
                severity: "high",
                is_acknowledged: false
            });
        }

        const consecutiveHighs = getConsecutiveHighs(recentCheckIns);
        if (consecutiveHighs >= settings.consecutive_alerts) {
            newAlerts.push({
                alert_type: "consecutive_highs",
                message: `You've had ${consecutiveHighs} consecutive high mood days. While this is wonderful, make sure you're still processing all emotions healthily.`,
                severity: "low",
                is_acknowledged: false
            });
        }

        if (newAlerts.length > 0) {
            await Promise.all(newAlerts.map(a => BoundaryAlert.create(a)));
            toast({ title: `${newAlerts.length} alert(s) created`, description: "Review them below." });
        } else {
            toast({ title: "All good!", description: "No boundary thresholds have been crossed." });
        }

        setCheckingBoundaries(false);
        loadData();
    };

    const exportData = () => {
        if (settings.password_protection && !settings.export_password) {
            toast({ title: "Set export password first", variant: "destructive" });
            return;
        }
        const data = {
            export_date: new Date().toISOString(),
            password_protected: settings.password_protection,
            check_ins: recentCheckIns,
            alerts
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vibe-check-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Export complete", description: "Your data has been downloaded." });
    };

    const sevColor = (s) => ({
        high: 'bg-red-100 text-red-800 border-red-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-blue-100 text-blue-800 border-blue-200'
    }[s] || 'bg-gray-100 text-gray-800');

    const avgMood = recentCheckIns.length > 0
        ? recentCheckIns.slice(0, 7).reduce((s, c) => s + c.mood_score, 0) / Math.min(7, recentCheckIns.length)
        : null;

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                             style={{background: 'linear-gradient(135deg, var(--sage-400) 0%, var(--sage-500) 100%)'}}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold" style={{color: 'var(--warm-gray-800)'}}>Boundaries & Alerts</h1>
                    </div>
                    <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--warm-gray-600)'}}>
                        Set protective thresholds and receive alerts when patterns suggest you might need extra care.
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>Active Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {alerts.filter(a => !a.is_acknowledged).length}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                {alerts.filter(a => !a.is_acknowledged).length === 0 ? "All clear" : "Need attention"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>Threshold Status</CardTitle>
                            <TrendingDown className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {avgMood === null ? (
                                    <span style={{color: 'var(--warm-gray-400)'}}>—</span>
                                ) : avgMood >= settings.mood_threshold ? (
                                    <span className="text-emerald-600">Safe</span>
                                ) : (
                                    <span className="text-red-600">Below threshold</span>
                                )}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                {avgMood !== null ? `7-day avg: ${avgMood.toFixed(1)}/10` : "No data yet"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium" style={{color: 'var(--warm-gray-600)'}}>Protection Level</CardTitle>
                            <Lock className="h-4 w-4" style={{color: 'var(--sage-500)'}} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{color: 'var(--warm-gray-800)'}}>
                                {settings.password_protection ? "High" : "Standard"}
                            </div>
                            <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>Export protection</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings */}
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
                        <div>
                            <Label className="text-sm font-medium">
                                Mood Threshold Alert — currently <strong>{settings.mood_threshold}/10</strong>
                            </Label>
                            <p className="text-xs mb-3" style={{color: 'var(--warm-gray-500)'}}>
                                Alert when your 7-day average falls below this level
                            </p>
                            <Slider value={[settings.mood_threshold]}
                                    onValueChange={([v]) => setSettings({...settings, mood_threshold: v})}
                                    max={8} min={2} step={0.5} className="w-full" />
                            <div className="flex justify-between text-xs mt-1" style={{color: 'var(--warm-gray-400)'}}>
                                <span>2 - Very sensitive</span><span>8 - Less sensitive</span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium">
                                Consecutive Days Alert — currently <strong>{settings.consecutive_alerts} days</strong>
                            </Label>
                            <p className="text-xs mb-3" style={{color: 'var(--warm-gray-500)'}}>
                                Alert after this many consecutive high or low mood days in a row
                            </p>
                            <Slider value={[settings.consecutive_alerts]}
                                    onValueChange={([v]) => setSettings({...settings, consecutive_alerts: v})}
                                    max={7} min={2} step={1} className="w-full" />
                            <div className="flex justify-between text-xs mt-1" style={{color: 'var(--warm-gray-400)'}}>
                                <span>2 days</span><span>7 days</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t" style={{borderColor: 'var(--sage-200)'}}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Enable Notifications</Label>
                                    <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>Show dashboard alerts when boundaries are crossed</p>
                                </div>
                                <Switch checked={settings.enable_notifications}
                                        onCheckedChange={(c) => setSettings({...settings, enable_notifications: c})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Password-Protect Exports</Label>
                                    <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>For use in legal documentation if needed</p>
                                </div>
                                <Switch checked={settings.password_protection}
                                        onCheckedChange={(c) => setSettings({...settings, password_protection: c})} />
                            </div>

                            {settings.password_protection && (
                                <div>
                                    <Label htmlFor="export-password">Export Password</Label>
                                    <Input id="export-password" type="password" value={settings.export_password}
                                           onChange={(e) => setSettings({...settings, export_password: e.target.value})}
                                           placeholder="Set a password for protected exports" className="mt-1 max-w-xs" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-between gap-3 pt-4">
                            <div className="flex gap-3">
                                <Button onClick={checkBoundaries} variant="outline" disabled={checkingBoundaries}>
                                    <Bell className="w-4 h-4 mr-2" />
                                    {checkingBoundaries ? 'Checking...' : 'Check Boundaries Now'}
                                </Button>
                                <Button onClick={exportData} variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                            </div>
                            <Button onClick={saveSettings} disabled={savingSettings}
                                    style={{background: 'linear-gradient(135deg, var(--sage-500) 0%, var(--sage-600) 100%)'}}>
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts List */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle style={{color: 'var(--warm-gray-800)'}}>Recent Alerts</CardTitle>
                        <p className="text-sm" style={{color: 'var(--warm-gray-600)'}}>Boundary alerts and notifications history</p>
                    </CardHeader>
                    <CardContent>
                        {alerts.length > 0 ? (
                            <div className="space-y-4">
                                {alerts.map((alert) => (
                                    <Alert key={alert.id} className={alert.is_acknowledged ? 'opacity-50' : ''}>
                                        <div className="flex items-start justify-between w-full">
                                            <div className="flex items-start gap-3 flex-1">
                                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge className={sevColor(alert.severity)}>{alert.severity}</Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {alert.alert_type.replace(/_/g, ' ')}
                                                        </Badge>
                                                        <span className="text-xs" style={{color: 'var(--warm-gray-500)'}}>
                                                            {format(parseISO(alert.created_date), "MMM d, h:mm a")}
                                                        </span>
                                                        {alert.is_acknowledged && (
                                                            <span className="text-xs text-emerald-600 font-medium">✓ Acknowledged</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!alert.is_acknowledged && (
                                                <Button size="sm" variant="outline" className="shrink-0 ml-3"
                                                        onClick={() => acknowledgeAlert(alert.id)}>
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                                                </Button>
                                            )}
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Shield className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--warm-gray-400)'}} />
                                <h3 className="text-lg font-medium mb-2" style={{color: 'var(--warm-gray-600)'}}>No alerts yet</h3>
                                <p className="text-sm" style={{color: 'var(--warm-gray-500)'}}>
                                    Log daily check-ins and use "Check Boundaries Now" to run a pattern analysis.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}