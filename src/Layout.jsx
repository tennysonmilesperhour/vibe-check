import React, { useCallback, useEffect, useRef, useState } from "react";
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
    Share2,
    Settings2
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import SettingsSheet from "@/features/shell/SettingsSheet";
import WeatherOrb from "@/features/today/WeatherOrb";
import AlmanacAtmosphere from "@/features/shell/AlmanacAtmosphere";

// Five surfaces, five jobs, five distinct icons.
const navigationItems = [
    { title: "Today", url: createPageUrl("Today"), icon: Sun, description: "The daily ritual" },
    { title: "Patterns", url: createPageUrl("Analytics"), icon: ChartLine, description: "Reflection over time" },
    { title: "People", url: createPageUrl("People"), icon: Users, description: "Everyone in orbit" },
    { title: "Practice", url: createPageUrl("Practice"), icon: Layers, description: "Tarot and oracle reflection" },
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
                        className="min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200"
                        style={{
                            background: isActive ? 'rgba(194,80,60,0.11)' : 'transparent',
                            border: isActive
                                ? '1px solid rgba(194,80,60,0.3)'
                                : '1px solid transparent',
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
                            <div className="w-1 h-5 rounded-full shrink-0" style={{ background: '#C2503C' }} />
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
            <WeatherOrb size="choice" />
            <div>
                <h2 className="font-display text-lg leading-tight" style={{ color: 'var(--gh-ink)' }}>
                    vibe check
                </h2>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gh-ink-muted)' }}>
                    Inner weather
                </p>
            </div>
        </div>
    );
}

function SidebarFooterContent() {
    return (
        <div className="p-3" style={{ borderTop: '1px solid rgba(194,80,60,0.1)' }}>
            <div className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: 'rgba(194,80,60,0.08)', border: '1px solid rgba(194,80,60,0.12)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C4699A, #8FA8D8)' }}>
                    <span className="text-xs font-bold text-white">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'rgba(61,52,80,1)' }}>Your reflections</p>
                    <p className="text-xs" style={{ color: 'rgba(194,80,60,1)' }}>Private to your account</p>
                </div>
            </div>
        </div>
    );
}

function MobileDock({ location }) {
    return (
        <nav className="mobile-dock md:hidden" aria-label="Primary navigation">
            {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                    <Link key={item.title} to={item.url} aria-current={isActive ? "page" : undefined}>
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function Layout({ children }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const menuButtonRef = useRef(null);
    const drawerRef = useRef(null);

    const closeMobile = useCallback(() => {
        setMobileOpen(false);
        window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }, []);

    // Close on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // Lock body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    useEffect(() => {
        if (!mobileOpen) return undefined;
        drawerRef.current?.querySelector('button')?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeMobile();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeMobile, mobileOpen]);

    useEffect(() => {
        const openSettings = () => setSettingsOpen(true);
        window.addEventListener('vibe-check:open-settings', openSettings);
        return () => window.removeEventListener('vibe-check:open-settings', openSettings);
    }, []);

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
                        className="min-h-11 w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
                        style={{ border: '1px solid hsl(var(--border))', color: 'var(--gh-accent)' }}>
                        <Share2 className="w-4 h-4" aria-hidden="true" />
                        Share Vibe Check
                    </button>
                    <button onClick={() => setSettingsOpen(true)}
                        className="min-h-11 w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors"
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
                    onClick={closeMobile}
                />
            )}

            {/* ── Mobile slide-in drawer ── */}
            {mobileOpen && <aside
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="fixed top-0 left-0 h-full z-40 flex flex-col md:hidden transition-transform duration-300 ease-in-out"
                style={{
                    width: '72vw',
                    maxWidth: '280px',
                    transform: 'translateX(0)',
                    background: 'rgba(253,251,247,0.92)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    borderRight: '1px solid rgba(194,80,60,0.2)',
                        boxShadow: '4px 0 8px rgba(90,36,48,0.16)',
                }}>
                {/* Drawer header with close button */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(194,80,60,0.1)' }}>
                    <div className="flex items-center gap-3">
                        <WeatherOrb size="choice" />
                        <div>
                            <h2 className="font-display text-base leading-tight" style={{ color: 'var(--gh-ink)' }}>
                                vibe check
                            </h2>
                            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gh-ink-muted)' }}>Inner weather</p>
                        </div>
                    </div>
                    <button
                        aria-label="Close navigation"
                        onClick={closeMobile}
                        className="h-11 w-11 inline-flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'rgba(61,52,80,1)', background: 'rgba(61,52,80,0.1)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <NavLinks location={location} onNavigate={closeMobile} />
                <div className="px-3 pb-2">
                    <button onClick={() => { setMobileOpen(false); setInviteOpen(true); }}
                        className="min-h-11 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'rgba(194,80,60,0.1)', border: '1px solid rgba(194,80,60,0.2)', color: '#C2503C' }}>
                        <Share2 className="w-4 h-4" aria-hidden="true" />
                        Share Vibe Check
                    </button>
                </div>
                <SidebarFooterContent />
            </aside>}

            {/* ── Main content ── */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10 app-workspace">
                <AlmanacAtmosphere pathname={location.pathname} />
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
                    style={{
                        background: 'rgba(253,251,247,0.92)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(194,80,60,0.12)'
                    }}>
                    <button
                        ref={menuButtonRef}
                        aria-label="Open navigation"
                        onClick={() => setMobileOpen(true)}
                        className="h-11 w-11 inline-flex items-center justify-center rounded-lg transition-colors"
                        style={{ background: 'rgba(194,80,60,0.1)', border: '1px solid rgba(194,80,60,0.2)', color: '#C2503C' }}>
                        <Menu className="w-4 h-4" />
                    </button>
                    <span className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>
                        Vibe Check
                    </span>
                </header>

                <div className="app-workspace__content flex-1 overflow-auto">
                    {children}
                </div>
                <MobileDock location={location} />
            <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
            <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
            </main>
        </div>
    );
}
