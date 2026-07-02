import React, { useState, useEffect } from "react";
import { BoundaryAlert, DailyCheckIn } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
        for (const ci of checkIns) { if (ci.mood_score <= 4) count++; else break; }
        return count;
    };

    const getConsecutiveHighs = (checkIns) => {
        let count = 0;
        for (const ci of checkIns) { if (ci.mood_score >= 8) count++; else break; }
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
            newAlerts.push({ alert_type: "mood_threshold", threshold_value: settings.mood_threshold,
                message: `Your 7-day average mood (${average.toFixed(1)}) has dropped below your threshold of ${settings.mood_threshold}. This might be a good time to check in with yourself or reach out for support.`,
                severity: "medium", is_acknowledged: false });
        }
        const consecutiveLows = getConsecutiveLows(recentCheckIns);
        if (consecutiveLows >= settings.consecutive_alerts) {
            newAlerts.push({ alert_type: "consecutive_lows",
                message: `You've logged ${consecutiveLows} consecutive low mood days. Remember, it's okay to ask for help and prioritize your wellbeing.`,
                severity: "high", is_acknowledged: false });
        }
        const consecutiveHighs = getConsecutiveHighs(recentCheckIns);
        if (consecutiveHighs >= settings.consecutive_alerts) {
            newAlerts.push({ alert_type: "consecutive_highs",
                message: `You've had ${consecutiveHighs} consecutive high mood days. While this is wonderful, make sure you're still processing all emotions healthily.`,
                severity: "low", is_acknowledged: false });
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
        const data = { export_date: new Date().toISOString(), password_protected: settings.password_protection, check_ins: recentCheckIns, alerts };
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
        high: { bg: 'rgba(194,94,143,0.12)', color: '#C25E8F', border: 'rgba(194,94,143,0.25)' },
        medium: { bg: 'rgba(184,144,47,0.12)', color: '#B8902F', border: 'rgba(184,144,47,0.25)' },
        low: { bg: 'rgba(107,149,200,0.12)', color: '#6B95C8', border: 'rgba(107,149,200,0.25)' },
    }[s] || { bg: 'rgba(255,255,255,0.68)', color: 'rgba(82,72,104,0.8)', border: 'rgba(61,52,80,0.12)' });

    const avgMood = recentCheckIns.length > 0
        ? recentCheckIns.slice(0, 7).reduce((s, c) => s + c.mood_score, 0) / Math.min(7, recentCheckIns.length)
        : null;

    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="orb-blue" style={{ top: '-30px', left: '20%' }} />
            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(138,114,184,0.7)' }}>✦ Protection</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #C4699A, #8FA8D8)', boxShadow: '0 0 20px rgba(186,124,164,0.4)' }}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Boundaries & Alerts</h1>
                    </div>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(105,95,128,0.75)' }}>
                        Set protective thresholds and receive alerts when patterns suggest you might need extra care.
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-5 mb-8">
                    {[
                        { label: 'Active Alerts', icon: AlertTriangle, color: '#C25E8F',
                          value: alerts.filter(a => !a.is_acknowledged).length,
                          sub: alerts.filter(a => !a.is_acknowledged).length === 0 ? "✓ All clear" : "Need attention" },
                        { label: 'Threshold Status', icon: TrendingDown, color: '#6B95C8',
                          value: avgMood === null ? '—' : avgMood >= settings.mood_threshold ? 'Safe' : 'Below',
                          sub: avgMood !== null ? `7-day avg: ${avgMood.toFixed(1)}/10` : "No data yet" },
                        { label: 'Protection Level', icon: Lock, color: '#C9834B',
                          value: settings.password_protection ? "High" : "Standard",
                          sub: "Export protection" },
                    ].map(({ label, icon: Icon, color, value, sub }) => (
                        <div key={label} className="glass-card p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: `${color}99` }}>{label}</span>
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <div className="text-2xl font-bold mb-1" style={{ color: 'rgba(61,52,80,0.95)', fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
                            <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>{sub}</p>
                        </div>
                    ))}
                </div>

                {/* Settings */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Settings className="w-5 h-5" style={{ color: '#8A72B8' }} />
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>Boundary Settings</h3>
                    </div>
                    <p className="text-sm mb-6" style={{ color: 'rgba(105,95,128,0.65)' }}>Configure when you want to be alerted about concerning patterns</p>

                    <div className="space-y-6">
                        <div>
                            <Label className="text-sm font-medium" style={{ color: 'rgba(82,72,104,0.9)' }}>
                                Mood Threshold Alert — currently <strong style={{ color: '#8A72B8' }}>{settings.mood_threshold}/10</strong>
                            </Label>
                            <p className="text-xs mb-3" style={{ color: 'rgba(122,112,144,0.6)' }}>Alert when your 7-day average falls below this level</p>
                            <Slider value={[settings.mood_threshold]}
                                onValueChange={([v]) => setSettings({...settings, mood_threshold: v})}
                                max={8} min={2} step={0.5} className="w-full" />
                            <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(122,112,144,0.5)' }}>
                                <span>2 · Very sensitive</span><span>8 · Less sensitive</span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium" style={{ color: 'rgba(82,72,104,0.9)' }}>
                                Consecutive Days Alert — currently <strong style={{ color: '#8A72B8' }}>{settings.consecutive_alerts} days</strong>
                            </Label>
                            <p className="text-xs mb-3" style={{ color: 'rgba(122,112,144,0.6)' }}>Alert after this many consecutive high or low mood days in a row</p>
                            <Slider value={[settings.consecutive_alerts]}
                                onValueChange={([v]) => setSettings({...settings, consecutive_alerts: v})}
                                max={7} min={2} step={1} className="w-full" />
                            <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(122,112,144,0.5)' }}>
                                <span>2 days</span><span>7 days</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid rgba(61,52,80,0.1)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium" style={{ color: 'rgba(82,72,104,0.9)' }}>Enable Notifications</Label>
                                    <p className="text-xs" style={{ color: 'rgba(122,112,144,0.6)' }}>Show dashboard alerts when boundaries are crossed</p>
                                </div>
                                <Switch checked={settings.enable_notifications}
                                    onCheckedChange={(c) => setSettings({...settings, enable_notifications: c})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium" style={{ color: 'rgba(82,72,104,0.9)' }}>Password-Protect Exports</Label>
                                    <p className="text-xs" style={{ color: 'rgba(122,112,144,0.6)' }}>For use in legal documentation if needed</p>
                                </div>
                                <Switch checked={settings.password_protection}
                                    onCheckedChange={(c) => setSettings({...settings, password_protection: c})} />
                            </div>

                            {settings.password_protection && (
                                <div>
                                    <Label htmlFor="export-password" style={{ color: 'rgba(82,72,104,0.8)' }}>Export Password</Label>
                                    <Input id="export-password" type="password" value={settings.export_password}
                                        onChange={(e) => setSettings({...settings, export_password: e.target.value})}
                                        placeholder="Set a password for protected exports" className="mt-1 max-w-xs" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-between gap-3 pt-2">
                            <div className="flex gap-3">
                                <Button onClick={checkBoundaries} variant="outline" disabled={checkingBoundaries}
                                    style={{ borderColor: 'rgba(138,114,184,0.3)', color: '#8A72B8', background: 'rgba(138,114,184,0.08)' }}>
                                    <Bell className="w-4 h-4 mr-2" />
                                    {checkingBoundaries ? 'Checking...' : 'Check Boundaries Now'}
                                </Button>
                                <Button onClick={exportData} variant="outline"
                                    style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)', background: 'transparent' }}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                            </div>
                            <Button onClick={saveSettings} disabled={savingSettings} className="btn-cosmic rounded-xl">
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="glass-card p-6">
                    <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>Recent Alerts</h3>
                    <p className="text-sm mb-5" style={{ color: 'rgba(105,95,128,0.65)' }}>Boundary alerts and notifications history</p>

                    {alerts.length > 0 ? (
                        <div className="space-y-3">
                            {alerts.map((alert) => {
                                const sev = sevColor(alert.severity);
                                return (
                                    <div key={alert.id} className={`p-4 rounded-xl transition-all ${alert.is_acknowledged ? 'opacity-40' : ''}`}
                                        style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: sev.color }} />
                                                <div className="flex-1">
                                                    <p className="text-sm" style={{ color: 'rgba(70,60,92,0.85)' }}>{alert.message}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge className="text-xs" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>{alert.severity}</Badge>
                                                        <span className="text-xs" style={{ color: 'rgba(122,112,144,0.6)' }}>
                                                            {format(parseISO(alert.created_date), "MMM d, h:mm a")}
                                                        </span>
                                                        {alert.is_acknowledged && (
                                                            <span className="text-xs font-medium" style={{ color: '#C9834B' }}>✓ Acknowledged</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!alert.is_acknowledged && (
                                                <Button size="sm" variant="outline" className="shrink-0"
                                                    style={{ borderColor: 'rgba(61,52,80,0.12)', color: 'rgba(82,72,104,0.8)', background: 'rgba(255,255,255,0.64)' }}
                                                    onClick={() => acknowledgeAlert(alert.id)}>
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(138,114,184,0.3)' }} />
                            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(82,72,104,0.8)' }}>No alerts yet</h3>
                            <p className="text-sm" style={{ color: 'rgba(122,112,144,0.6)' }}>
                                Log daily check-ins and use "Check Boundaries Now" to run a pattern analysis.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}