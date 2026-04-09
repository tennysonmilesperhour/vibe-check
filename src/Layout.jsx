import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Heart,
    BarChart3,
    Users,
    Sparkles,
    Calendar,
    Shield,
    Menu,
    X
} from "lucide-react";

const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Heart, description: "Overview & check-ins" },
    { title: "Daily Log", url: createPageUrl("DailyLog"), icon: Calendar, description: "Log your highs & lows" },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3, description: "Trends & patterns" },
    { title: "Relationships", url: createPageUrl("Relationships"), icon: Users, description: "Your connections" },
    { title: "Healing Board", url: createPageUrl("HealingBoard"), icon: Sparkles, description: "Track your growth" },
    { title: "Boundaries", url: createPageUrl("Boundaries"), icon: Shield, description: "Alerts & thresholds" },
    { title: "Cosmic Add-ons", url: createPageUrl("CosmicAddons"), icon: Sparkles, description: "Astrology, HD, Gene Keys" },
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
                                ? 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(79,70,229,0.2) 50%, rgba(14,165,233,0.15) 100%)'
                                : 'transparent',
                            border: isActive
                                ? '1px solid rgba(139,92,246,0.3)'
                                : '1px solid transparent',
                            boxShadow: isActive ? '0 0 15px rgba(124,58,237,0.15)' : 'none',
                        }}>
                        <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#c084fc' : 'rgba(220,210,240,1)' }} />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block"
                                style={{ color: isActive ? '#c084fc' : 'rgba(240,235,255,1)' }}>
                                {item.title}
                            </span>
                            <span className="text-xs block" style={{ color: 'rgba(200,190,230,1)' }}>
                                {item.description}
                            </span>
                        </div>
                        {isActive && (
                            <div className="w-1 h-5 rounded-full shrink-0"
                                style={{ background: 'linear-gradient(180deg, #c084fc, #38bdf8)' }} />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarHeader() {
    return (
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)',
                    boxShadow: '0 0 16px rgba(124,58,237,0.5)'
                }}>
                <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
                <h2 className="font-bold text-base leading-tight"
                    style={{
                        background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: 'Space Grotesk, sans-serif'
                    }}>
                    Vibe Check
                </h2>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(139,92,246,0.7)' }}>
                    Cosmic Wellness
                </p>
            </div>
        </div>
    );
}

function SidebarFooterContent() {
    return (
        <div className="p-3" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}>
                    <span className="text-xs font-bold text-white">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'rgba(240,235,255,1)' }}>Your Journey</p>
                    <p className="text-xs" style={{ color: 'rgba(192,132,252,1)' }}>Aligned & expanding</p>
                </div>
            </div>
        </div>
    );
}

export default function Layout({ children }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

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
                    background: 'linear-gradient(180deg, rgba(8,6,28,0.98) 0%, rgba(6,4,20,0.99) 100%)',
                    borderRight: '1px solid rgba(139,92,246,0.12)'
                }}>
                <SidebarHeader />
                <NavLinks location={location} onNavigate={() => {}} />
                <SidebarFooterContent />
            </aside>

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    style={{ background: 'rgba(4,2,16,0.3)', backdropFilter: 'blur(2px)' }}
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
                    background: 'rgba(8,6,28,0.05)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRight: '1px solid rgba(139,92,246,0.2)',
                    boxShadow: mobileOpen ? '4px 0 40px rgba(124,58,237,0.2)' : 'none',
                }}>
                {/* Drawer header with close button */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', boxShadow: '0 0 14px rgba(124,58,237,0.45)' }}>
                            <Heart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm leading-tight"
                                style={{
                                    background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontFamily: 'Space Grotesk, sans-serif'
                                }}>
                                Vibe Check
                            </h2>
                            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(192,132,252,1)' }}>Cosmic Wellness</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(240,235,255,1)', background: 'rgba(255,255,255,0.08)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
                <SidebarFooterContent />
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
                    style={{
                        background: 'rgba(8,6,28,0.92)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(139,92,246,0.12)'
                    }}>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#c084fc' }}>
                        <Menu className="w-4 h-4" />
                    </button>
                    <span className="text-base font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Vibe Check
                    </span>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}