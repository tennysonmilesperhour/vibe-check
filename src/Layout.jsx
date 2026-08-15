import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Sun,
    ChartLine,
    Users,
    Layers,
    Sparkle,
    Menu,
    X,
    UserPlus,
    Settings2
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import SettingsSheet from "@/features/shell/SettingsSheet";
import MoonGlyph from "@/features/loom/MoonGlyph";
import { DailyCheckIn } from "@/entities/all";
import { todayKey } from "@/lib/dates";
import { moonPhase } from "@/lib/resonance/moon";
import { computeStreak, streakLabel } from "@/lib/streaks";

// Five surfaces, five jobs, five distinct icons.
const navigationItems = [
    { title: "Today", url: createPageUrl("Today"), icon: Sun, description: "The daily ritual" },
    { title: "Patterns", url: createPageUrl("Analytics"), icon: ChartLine, description: "Reflection over time" },
    { title: "People", url: createPageUrl("People"), icon: Users, description: "Everyone in orbit" },
    { title: "Practice", url: createPageUrl("Practice"), icon: Layers, description: "Tarot, oracle, healing work" },
    { title: "Cosmos", url: createPageUrl("CosmicAddons"), icon: Sparkle, description: "Your Loom and systems" },
];

function NavLinks({ location, onNavigate }) {
    return (
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                    <Link
                        key={item.title}
                        to={item.url}
                        onClick={onNavigate}
                        className="group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-200"
                        style={{
                            // The active surface is lit rather than outlined: a warm
                            // wash with a hairline of gold around it.
                            background: isActive
                                ? 'linear-gradient(100deg, color-mix(in srgb, var(--gh-gold) 22%, transparent) 0%, color-mix(in srgb, var(--gh-rose) 13%, transparent) 100%)'
                                : 'transparent',
                            borderRadius: 'calc(var(--radius) - 3px)',
                            boxShadow: isActive
                                ? 'inset 0 0 0 1px color-mix(in srgb, var(--gh-gold) 38%, transparent), var(--shadow-soft)'
                                : 'none',
                        }}>
                        {/* A short rounded stroke instead of a full-height square rule. */}
                        <span aria-hidden="true"
                            style={{
                                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                width: '3px', height: isActive ? '22px' : '0px', borderRadius: '999px',
                                background: 'var(--gh-accent)',
                                transition: 'height 220ms ease-out',
                            }} />
                        <item.icon className="w-4 h-4 shrink-0 transition-colors" style={{ color: isActive ? 'var(--gh-accent)' : 'var(--gh-ink)' }} />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block"
                                style={{ color: isActive ? 'var(--gh-accent)' : 'var(--gh-ink)' }}>
                                {item.title}
                            </span>
                            <span className="text-xs block" style={{ color: 'var(--gh-ink-muted)' }}>
                                {item.description}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarHeader() {
    return (
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{
                    background: 'var(--gradient-sky)',
                    borderRadius: 'calc(var(--radius) - 4px)',
                    boxShadow: 'var(--shadow-soft), inset 0 1px 0 color-mix(in srgb, var(--gh-cream) 45%, transparent)',
                }}>
                <Sun className="w-4 h-4" style={{ color: 'var(--gh-cream)' }} aria-hidden="true" />
            </div>
            <div>
                <h2 className="font-display text-lg leading-tight" style={{ color: 'var(--gh-ink)' }}>
                    vibe check
                </h2>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gh-ink-muted)' }}>
                    Golden Hour
                </p>
            </div>
        </div>
    );
}

function SidebarFooterContent({ streak }) {
    // Something true instead of a placeholder: tonight's actual moon and the
    // real streak. streak === null means the check-ins have not loaded (yet).
    const moon = moonPhase(todayKey());
    return (
        <div className="p-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <div className="veil-card flex items-center gap-3 p-2.5"
                style={{ background: 'linear-gradient(150deg, color-mix(in srgb, var(--gh-gold) 16%, transparent) 0%, color-mix(in srgb, var(--gh-lilac) 14%, transparent) 100%)' }}>
                <MoonGlyph name={moon.name} illumination={moon.illumination} size={22} color="var(--gh-ink-soft)" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--gh-ink)' }}>{moon.name}</p>
                    {streak !== null && (
                        <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>
                            {streak > 0 ? `${streakLabel(streak)} kept` : 'Begin tonight'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Layout({ children }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [streak, setStreak] = useState(null);

    // The footer shows the real run. Re-check when the route changes so a
    // just-saved check-in is reflected without a reload.
    useEffect(() => {
        let cancelled = false;
        DailyCheckIn.list("-date", 120)
            .then((checkIns) => { if (!cancelled) setStreak(computeStreak(checkIns, todayKey())); })
            .catch(() => { if (!cancelled) setStreak(null); });
        return () => { cancelled = true; };
    }, [location.pathname]);

    // Close on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // Lock body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <div className="min-h-screen flex w-full relative" style={{ background: 'transparent' }}>

            {/* ── Desktop sidebar ── */}
            <aside className="hidden md:flex flex-col w-60 shrink-0 relative z-20"
                style={{
                    // Not a flat panel: the cream cools toward lilac at the foot,
                    // so the rail reads as part of the same evening as the page.
                    background: 'linear-gradient(185deg, var(--gh-cream) 0%, var(--gh-cream) 55%, color-mix(in srgb, var(--gh-lilac) 13%, var(--gh-cream)) 100%)',
                    borderRight: '1px solid hsl(var(--border))',
                    boxShadow: '1px 0 26px color-mix(in srgb, var(--gh-ink) 5%, transparent)',
                }}>
                <SidebarHeader />
                <NavLinks location={location} onNavigate={() => {}} />
                <div className="px-3 pb-2 space-y-1">
                    <button onClick={() => setInviteOpen(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ border: '1px solid hsl(var(--border))', color: 'var(--gh-accent)', borderRadius: 'calc(var(--radius) - 3px)', boxShadow: 'var(--shadow-soft)' }}>
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        Invite a Friend
                    </button>
                    <button onClick={() => setSettingsOpen(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ color: 'var(--gh-ink-muted)', borderRadius: 'calc(var(--radius) - 3px)' }}>
                        <Settings2 className="w-4 h-4" aria-hidden="true" />
                        Settings
                    </button>
                </div>
                <SidebarFooterContent streak={streak} />
            </aside>

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    style={{ background: 'color-mix(in srgb, var(--gh-ink) 30%, transparent)', backdropFilter: 'blur(2px)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Mobile slide-in drawer ── */}
            <aside
                className="fixed top-0 left-0 h-full z-40 flex flex-col md:hidden transition-transform duration-300 ease-in-out"
                style={{
                    width: '72vw',
                    maxWidth: '280px',
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    background: 'linear-gradient(185deg, var(--gh-cream) 0%, var(--gh-cream) 55%, color-mix(in srgb, var(--gh-lilac) 13%, var(--gh-cream)) 100%)',
                    borderRight: '1px solid hsl(var(--border))',
                    boxShadow: mobileOpen ? '4px 0 40px color-mix(in srgb, var(--gh-ink) 15%, transparent)' : 'none',
                }}>
                {/* Drawer header with close button */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center"
                            style={{
                                background: 'var(--gradient-sky)',
                                borderRadius: 'calc(var(--radius) - 4px)',
                                boxShadow: 'var(--shadow-soft)',
                            }}>
                            <Sun className="w-4 h-4" style={{ color: 'var(--gh-cream)' }} aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="font-display text-base leading-tight" style={{ color: 'var(--gh-ink)' }}>
                                vibe check
                            </h2>
                            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gh-ink-muted)' }}>Golden Hour</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 transition-colors" aria-label="Close menu"
                        style={{ color: 'var(--gh-ink)', background: 'color-mix(in srgb, var(--gh-ink) 8%, transparent)', borderRadius: 'calc(var(--radius) - 5px)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
                <div className="px-3 pb-2">
                    <button onClick={() => { setMobileOpen(false); setInviteOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ border: '1px solid hsl(var(--border))', color: 'var(--gh-accent)', borderRadius: 'calc(var(--radius) - 3px)', boxShadow: 'var(--shadow-soft)' }}>
                        <UserPlus className="w-4 h-4" />
                        Invite a Friend
                    </button>
                </div>
                <SidebarFooterContent streak={streak} />
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
                    style={{
                        background: 'color-mix(in srgb, var(--gh-cream) 92%, transparent)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid hsl(var(--border))'
                    }}>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 transition-colors" aria-label="Open menu"
                        style={{ border: '1px solid hsl(var(--border))', color: 'var(--gh-accent)', borderRadius: 'calc(var(--radius) - 3px)', boxShadow: 'var(--shadow-soft)' }}>
                        <Menu className="w-4 h-4" />
                    </button>
                    <span className="font-display text-lg" style={{ color: 'var(--gh-ink)' }}>
                        vibe check
                    </span>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
            <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
            </main>
        </div>
    );
}