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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                        style={{
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(186,124,164,0.25) 0%, rgba(201,138,78,0.2) 50%, rgba(143,168,216,0.15) 100%)'
                                : 'transparent',
                            border: isActive
                                ? '1px solid rgba(194,80,60,0.3)'
                                : '1px solid transparent',
                            boxShadow: isActive ? '0 0 15px rgba(186,124,164,0.15)' : 'none',
                        }}>
                        <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#C2503C' : 'rgba(61,52,80,1)' }} />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block"
                                style={{ color: isActive ? '#C2503C' : 'rgba(61,52,80,1)' }}>
                                {item.title}
                            </span>
                            <span className="text-xs block" style={{ color: 'rgba(82,72,104,1)' }}>
                                {item.description}
                            </span>
                        </div>
                        {isActive && (
                            <div className="w-1 h-5 rounded-full shrink-0"
                                style={{ background: 'linear-gradient(180deg, #C2503C, #F2952E)' }} />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarHeader() {
    return (
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(194,80,60,0.1)' }}>
            <div className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(165deg, var(--gh-rose) 0%, var(--gh-gold) 100%)' }}>
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

function SidebarFooterContent() {
    return (
        <div className="p-3" style={{ borderTop: '1px solid rgba(194,80,60,0.1)' }}>
            <div className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'rgba(194,80,60,0.08)', border: '1px solid rgba(194,80,60,0.12)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C4699A, #8FA8D8)' }}>
                    <span className="text-xs font-bold text-white">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'rgba(61,52,80,1)' }}>Your Journey</p>
                    <p className="text-xs" style={{ color: 'rgba(194,80,60,1)' }}>Aligned & expanding</p>
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
                    background: 'linear-gradient(180deg, rgba(253,251,247,0.98) 0%, rgba(251,248,243,0.99) 100%)',
                    borderRight: '1px solid rgba(194,80,60,0.12)'
                }}>
                <SidebarHeader />
                <NavLinks location={location} onNavigate={() => {}} />
                <div className="px-3 pb-2 space-y-1">
                    <button onClick={() => setInviteOpen(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ border: '1px solid hsl(var(--border))', color: 'var(--gh-accent)' }}>
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        Invite a Friend
                    </button>
                    <button onClick={() => setSettingsOpen(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ color: 'var(--gh-ink-muted)' }}>
                        <Settings2 className="w-4 h-4" aria-hidden="true" />
                        Settings
                    </button>
                </div>
                <SidebarFooterContent />
            </aside>

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    style={{ background: 'rgba(61,52,80,0.3)', backdropFilter: 'blur(2px)' }}
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
                    background: 'rgba(253,251,247,0.92)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    borderRight: '1px solid rgba(194,80,60,0.2)',
                    boxShadow: mobileOpen ? '4px 0 40px rgba(186,124,164,0.2)' : 'none',
                }}>
                {/* Drawer header with close button */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(194,80,60,0.1)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center"
                            style={{ background: 'linear-gradient(165deg, var(--gh-rose) 0%, var(--gh-gold) 100%)' }}>
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
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(61,52,80,1)', background: 'rgba(61,52,80,0.1)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
                <div className="px-3 pb-2">
                    <button onClick={() => { setMobileOpen(false); setInviteOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(194,80,60,0.1)', border: '1px solid rgba(194,80,60,0.2)', color: '#C2503C' }}>
                        <UserPlus className="w-4 h-4" />
                        Invite a Friend
                    </button>
                </div>
                <SidebarFooterContent />
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
                    style={{
                        background: 'rgba(253,251,247,0.92)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(194,80,60,0.12)'
                    }}>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(194,80,60,0.1)', border: '1px solid rgba(194,80,60,0.2)', color: '#C2503C' }}>
                        <Menu className="w-4 h-4" />
                    </button>
                    <span className="text-base font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Vibe Check
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