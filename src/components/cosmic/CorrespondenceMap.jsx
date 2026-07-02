import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Loader2, BookOpen } from "lucide-react";
import { SYSTEM_CORRESPONDENCES } from "./correspondences";
import CosmicInsightBadge from "./CosmicInsightBadge";

const PAIRS = [
  { systems: ["astrology", "human_design"],    key: "astrology_human_design" },
  { systems: ["astrology", "gene_keys"],       key: "astrology_gene_keys" },
  { systems: ["astrology", "numerology"],      key: "astrology_numerology" },
  { systems: ["astrology", "tarot_archetype"], key: "astrology_tarot" },
  { systems: ["human_design", "gene_keys"],    key: "human_design_gene_keys" },
  { systems: ["human_design", "chakras"],      key: "human_design_chakras" },
  { systems: ["numerology", "tarot_archetype"],key: "numerology_tarot" },
  { systems: ["gene_keys", "chakras"],         key: "gene_keys_chakras" },
  { systems: ["enneagram", "astrology"],       key: "enneagram_astrology" },
  { systems: ["enneagram", "human_design"],    key: "enneagram_human_design" },
  { systems: ["enneagram", "gene_keys"],       key: "enneagram_gene_keys" },
];

async function exportMapPDF(profile, deepReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = W - margin * 2;
  let y = margin;

  doc.setFontSize(20);
  doc.setTextColor(120, 60, 220);
  doc.text("Cosmic Correspondence Map", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(140, 130, 170);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;

  // Static correspondences
  doc.setFontSize(11);
  doc.setTextColor(80, 60, 120);
  doc.text("Cross-System Correspondences", margin, y);
  y += 7;

  PAIRS.forEach(pair => {
    const text = SYSTEM_CORRESPONDENCES[pair.key]?.trim();
    if (!text) return;
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(9.5);
    doc.setTextColor(100, 60, 160);
    doc.text(pair.systems.join(" × ").toUpperCase().replace(/_/g, ' '), margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(40, 30, 60);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(l => {
      if (y > 275) { doc.addPage(); y = margin; }
      doc.text(l, margin, y);
      y += 4.5;
    });
    y += 4;
  });

  if (deepReport) {
    doc.addPage(); y = margin;
    doc.setFontSize(13);
    doc.setTextColor(80, 60, 120);
    doc.text("Comprehensive Integration Reading", margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(30, 20, 50);
    const lines = doc.splitTextToSize(deepReport, maxW);
    lines.forEach(l => {
      if (y > 275) { doc.addPage(); y = margin; }
      doc.text(l, margin, y);
      y += 5;
    });
  }

  doc.save("cosmic-correspondence-map.pdf");
}

export default function CorrespondenceMap({ enabledSystems = [], profile = {} }) {
  const [deepReport, setDeepReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const activePairs = PAIRS.filter(p => p.systems.every(s => enabledSystems.includes(s)));
  const inactivePairs = PAIRS.filter(p => !p.systems.every(s => enabledSystems.includes(s)));

  const generateDeepMap = async () => {
    setLoading(true);
    const enabledDetails = enabledSystems.map(s => {
      const d = profile[s];
      if (!d) return null;
      const entries = Object.entries(d).filter(([k, v]) => v && k !== 'custom_notes').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
      return entries ? `${s.toUpperCase().replace(/_/g, ' ')}: ${entries}` : null;
    }).filter(Boolean).join('\n');

    const prompt = `You are a master of multiple wisdom traditions. Generate a comprehensive, integrated cosmic correspondence map for a person with this profile:

${enabledDetails || "Profile data not yet entered"}

Name: ${profile.first_name || ''} ${profile.last_name || ''}
Birth: ${profile.birth_date || 'unknown'}

Create a deeply personal integrated reading that:
1. Identifies the core thread running through ALL their active systems — the single theme their entire blueprint points to
2. Maps how each system mirrors and amplifies the others (find the resonances, not just list them)
3. Highlights where systems appear to contradict — and what that creative tension is asking of them
4. Gives a synthesis: what is this person's unique cosmic signature — the irreducible truth of who they are as revealed by their blueprint?
5. Offers a practical integration practice that honors all systems at once

Be profound but grounded. Specific but not pedantic. This should feel like a coherent portrait, not a list.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setDeepReport(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Active correspondences */}
      {activePairs.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5" style={{ color: '#c084fc' }} />
            <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>Active Connections</h3>
          </div>
          <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.5)' }}>Live cross-system resonances from your enabled blueprint</p>
          <div className="space-y-4">
            {activePairs.map(pair => (
              <div key={pair.key} className="p-5 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                  <Badge className="text-xs" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                    ✦ Active
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(210,200,235,0.8)' }}>
                  {SYSTEM_CORRESPONDENCES[pair.key]?.trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive pairs */}
      {inactivePairs.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: 'rgba(180,170,210,0.45)' }}>Unlock by enabling both systems</h3>
          <div className="space-y-3">
            {inactivePairs.map(pair => (
              <div key={pair.key} className="p-4 rounded-xl opacity-45"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                </div>
                <p className="text-xs" style={{ color: 'rgba(180,170,210,0.5)' }}>
                  {SYSTEM_CORRESPONDENCES[pair.key]?.trim().slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Integration Report */}
      <div className="glass-card-glow p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#c084fc' }} />
            <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.9)' }}>Integrated Blueprint Reading</h3>
          </div>
          {deepReport && (
            <Button size="sm" variant="outline" onClick={() => exportMapPDF(profile, deepReport)}
              className="gap-1.5 text-xs" style={{ borderColor: 'rgba(192,132,252,0.3)', color: '#c084fc', background: 'transparent' }}>
              <Download className="w-3 h-3" /> Export Full PDF
            </Button>
          )}
        </div>
        <p className="text-sm mb-5" style={{ color: 'rgba(180,170,210,0.5)' }}>
          A synthesized reading across all your active systems — the unified story they tell together
        </p>

        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c084fc' }} />
            <span className="text-sm" style={{ color: 'rgba(180,170,210,0.6)' }}>Weaving your integrated blueprint…</span>
          </div>
        ) : deepReport ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(210,200,235,0.85)' }}>
            {deepReport}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs mb-3" style={{ color: 'rgba(180,170,210,0.4)' }}>The oracle weaves a deep synthesis across all your active systems — uses a small amount of credits</p>
            <Button onClick={generateDeepMap} disabled={enabledSystems.length === 0} className="btn-cosmic rounded-xl">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Integrated Reading
            </Button>
          </div>
        )}
      </div>

      {/* Export static map only */}
      {!deepReport && activePairs.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => exportMapPDF(profile, null)}
            className="gap-2 text-sm" style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#c084fc', background: 'rgba(139,92,246,0.05)' }}>
            <Download className="w-4 h-4" /> Export Correspondence Map PDF
          </Button>
        </div>
      )}
    </div>
  );
}