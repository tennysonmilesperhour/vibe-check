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
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
    {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: Heart,
        description: "Daily check-ins & overview"
    },
    {
        title: "Daily Log",
        url: createPageUrl("DailyLog"),
        icon: Calendar,
        description: "Log your highs & lows"
    },
    {
        title: "Analytics",
        url: createPageUrl("Analytics"),
        icon: BarChart3,
        description: "View trends & patterns"
    },
    {
        title: "Relationships",
        url: createPageUrl("Relationships"),
        icon: Users,
        description: "Manage your connections"
    },
    {
        title: "Healing Board",
        url: createPageUrl("HealingBoard"),
        icon: Sparkles,
        description: "Track your growth"
    },
    {
        title: "Boundaries",
        url: createPageUrl("Boundaries"),
        icon: Shield,
        description: "Alerts & thresholds"
    },
    {
        title: "Cosmic Add-ons",
        url: createPageUrl("CosmicAddons"),
        icon: Sparkles,
        description: "Astrology, HD, Gene Keys & more"
    }
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();

    return (
        <SidebarProvider>
            <style>{`
                :root {
                    --sage-50: #f6f7f6;
                    --sage-100: #e8ebe8;
                    --sage-200: #d1d7d1;
                    --sage-300: #aeb8ae;
                    --sage-400: #839483;
                    --sage-500: #627662;
                    --sage-600: #4d5f4d;
                    --sage-700: #3e4c3e;
                    --sage-800: #333f33;
                    --sage-900: #2a342a;
                    
                    --warm-gray-50: #fafaf9;
                    --warm-gray-100: #f5f5f4;
                    --warm-gray-200: #e7e5e4;
                    --warm-gray-300: #d6d3d1;
                    --warm-gray-400: #a8a29e;
                    --warm-gray-500: #78716c;
                    --warm-gray-600: #57534e;
                    --warm-gray-700: #44403c;
                    --warm-gray-800: #292524;
                    --warm-gray-900: #1c1917;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: linear-gradient(135deg, var(--sage-50) 0%, var(--warm-gray-50) 100%);
                }
            `}</style>
            <div className="min-h-screen flex w-full" style={{background: 'linear-gradient(135deg, #f6f7f6 0%, #fafaf9 100%)'}}>
                <Sidebar className="border-r" style={{borderColor: 'var(--sage-200)'}}>
                    <SidebarHeader className="border-b p-6" style={{borderColor: 'var(--sage-200)'}}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                 style={{background: 'linear-gradient(135deg, var(--sage-400) 0%, var(--sage-500) 100%)'}}>
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl" style={{color: 'var(--warm-gray-800)'}}>Vibe Check</h2>
                                <p className="text-sm" style={{color: 'var(--warm-gray-500)'}}>Your wellness companion</p>
                            </div>
                        </div>
                    </SidebarHeader>
                    
                    <SidebarContent className="p-4">
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 py-3"
                                               style={{color: 'var(--warm-gray-500)'}}>
                                Navigation
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton 
                                                asChild 
                                                className={`rounded-xl transition-all duration-300 hover:shadow-sm ${
                                                    location.pathname === item.url 
                                                        ? 'shadow-sm' 
                                                        : ''
                                                }`}
                                                style={{
                                                    background: location.pathname === item.url 
                                                        ? 'linear-gradient(135deg, var(--sage-100) 0%, var(--sage-200) 100%)'
                                                        : 'transparent',
                                                    color: location.pathname === item.url
                                                        ? 'var(--sage-700)'
                                                        : 'var(--warm-gray-600)'
                                                }}
                                            >
                                                <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                                                    <item.icon className="w-5 h-5" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium">{item.title}</span>
                                                        <p className="text-xs opacity-70 truncate">{item.description}</p>
                                                    </div>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t p-6" style={{borderColor: 'var(--sage-200)'}}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                 style={{background: 'var(--warm-gray-200)'}}>
                                <span className="font-semibold text-sm" style={{color: 'var(--warm-gray-600)'}}>You</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" style={{color: 'var(--warm-gray-800)'}}>Your Journey</p>
                                <p className="text-xs truncate" style={{color: 'var(--warm-gray-500)'}}>Taking care of yourself</p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col">
                    <header className="bg-white/80 backdrop-blur-sm border-b px-6 py-4 md:hidden"
                            style={{borderColor: 'var(--sage-200)'}}>
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
                            <h1 className="text-xl font-semibold" style={{color: 'var(--warm-gray-800)'}}>Vibe Check</h1>
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