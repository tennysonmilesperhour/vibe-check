import React from "react";
import CosmicWisdomCard from "@/components/cosmic/CosmicWisdomCard";
import { Sparkles } from "lucide-react";

const PERIODS = ["daily", "weekly", "monthly", "yearly"];

export default function CosmicWisdomPage() {
    return (
        <div className="p-6 space-y-8 min-h-screen relative">
            <div className="orb-purple" style={{ top: '-40px', left: '20%' }} />
            <div className="orb-blue" style={{ bottom: '10%', right: '5%' }} />

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(139,92,246,0.7)' }}>✦ Your Blueprint</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center pulse-glow"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Cosmic Wisdom
                        </h1>
                    </div>
                    <p className="text-base" style={{ color: 'rgba(180,170,210,0.65)' }}>
                        Personalised insight from your cosmic blueprint — daily, weekly, monthly, and yearly.
                        Toggle your systems in Cosmic Add-ons to shift the depth and focus.
                    </p>
                </div>

                {/* Wisdom Cards */}
                <div className="space-y-4">
                    {PERIODS.map(period => (
                        <CosmicWisdomCard key={period} periodType={period} />
                    ))}
                </div>

                <p className="text-center text-xs mt-8" style={{ color: 'rgba(160,150,190,0.4)' }}>
                    Wisdom updates automatically each day · week · month · year.
                    Regenerate anytime with the refresh icon.
                </p>
            </div>
        </div>
    );
}