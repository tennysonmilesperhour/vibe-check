import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Heart,
    BarChart3,
    Users,
    Sparkles,
    Calendar,
    Shield
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Heart, description: "Overview & check-ins" },
    { title: "Daily Log", url: createPageUrl("DailyLog"), icon: Calendar, description: "Log your highs & lows" },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3, description: "Trends & patterns" },
    { title: "Relationships", url: createPageUrl("Relationships"), icon: Users, description: "Your connections" },
    { title: "Healing Board", url: createPageUrl("HealingBoard"), icon: Sparkles, description: "Track your growth" },
    { title: "Boundaries", url: createPageUrl("Boundaries"), icon: Shield, description: "Alerts & thresholds" },
    { title: "Cosmic Add-ons", url: createPageUrl("CosmicAddons"), icon: Sparkles, description: "Astrology, HD, Gene Keys" },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full relative" style={{ background: 'transparent' }}>
                <Sidebar className="border-r-0" style={{
                    background: 'linear-gradient(180deg, rgba(8,6,28,0.98) 0%, rgba(6,4,20,0.99) 100%)',
                    borderRight: '1px solid rgba(139,92,246,0.12)'
                }}>
                    {/* Header */}
                    <SidebarHeader className="p-6" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center pulse-glow"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)',
                                    boxShadow: '0 0 20px rgba(124,58,237,0.5)'
                                }}>
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg tracking-wide"
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
                    </SidebarHeader>

                    <SidebarContent className="p-3">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {navigationItems.map((item) => {
                                        const isActive = location.pathname === item.url;
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton asChild>
                                                    <Link to={item.url}
                                                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
                                                        style={{
                                                            background: isActive
                                                                ? 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(79,70,229,0.2) 50%, rgba(14,165,233,0.15) 100%)'
                                                                : 'transparent',
                                                            border: isActive
                                                                ? '1px solid rgba(139,92,246,0.3)'
                                                                : '1px solid transparent',
                                                            boxShadow: isActive ? '0 0 15px rgba(124,58,237,0.15)' : 'none',
                                                            color: isActive ? '#c084fc' : 'rgba(200,200,220,0.6)',
                                                        }}>
                                                        <item.icon className="w-4 h-4 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium block"
                                                                style={{ color: isActive ? '#c084fc' : 'rgba(210,210,230,0.8)' }}>
                                                                {item.title}
                                                            </span>
                                                            <span className="text-xs truncate block" style={{ color: 'rgba(150,140,180,0.5)' }}>
                                                                {item.description}
                                                            </span>
                                                        </div>
                                                        {isActive && (
                                                            <div className="w-1 h-6 rounded-full"
                                                                style={{ background: 'linear-gradient(180deg, #c084fc, #38bdf8)' }} />
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="p-5" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                        <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}>
                                <span className="text-xs font-bold text-white">✦</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'rgba(200,190,230,0.9)' }}>Your Journey</p>
                                <p className="text-xs truncate" style={{ color: 'rgba(139,92,246,0.6)' }}>Aligned & expanding</p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col relative z-10">
                    {/* Mobile header */}
                    <header className="backdrop-blur-xl border-b px-6 py-4 md:hidden"
                        style={{
                            background: 'rgba(8,6,28,0.9)',
                            borderColor: 'rgba(139,92,246,0.15)'
                        }}>
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="p-2 rounded-lg transition-colors"
                                style={{ color: 'rgba(200,190,230,0.8)' }} />
                            <span className="text-lg font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                Vibe Check
                            </span>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}