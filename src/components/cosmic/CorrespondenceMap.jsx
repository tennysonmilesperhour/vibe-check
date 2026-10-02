import React, { useState } from "react";
import { integratedReading } from "@/lib/wisdom/readings";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Combine } from "lucide-react";
import { SYSTEM_CORRESPONDENCES } from "./correspondences";
import CosmicInsightBadge from "./CosmicInsightBadge";
import { tint } from "./systemMeta";

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
  doc.setTextColor(194, 80, 60);
  doc.text("Cosmic Correspondence Map", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(166, 96, 110);
  doc.text(`Composed ${new Date().toLocaleDateString()} · Vibe Check`, margin, y);
  y += 10;

  // Static correspondences
  doc.setFontSize(11);
  doc.setTextColor(194, 80, 60);
  doc.text("Cross-System Correspondences", margin, y);
  y += 7;

  PAIRS.forEach(pair => {
    const text = SYSTEM_CORRESPONDENCES[pair.key]?.trim();
    if (!text) return;
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(9.5);
    doc.setTextColor(166, 96, 110);
    doc.text(pair.systems.join(" × ").toUpperCase().replace(/_/g, ' '), margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(90, 36, 48);
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
    doc.setTextColor(194, 80, 60);
    doc.text("Comprehensive Integration Reading", margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(90, 36, 48);
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

  const generateDeepMap = () => {
    // Synthesized locally across your active systems — no API, no credits.
    setLoading(true);
    setDeepReport(integratedReading(enabledSystems, profile));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Active correspondences */}
      {activePairs.length > 0 && (
        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--gh-accent)' }} />
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-body)', color: 'var(--gh-ink)' }}>Active connections</h3>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>Live cross-system resonances from your enabled blueprint</p>
          <div>
            {activePairs.map((pair, i) => (
              <div key={pair.key} className="py-4"
                style={{ borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))' }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gh-ink-soft)' }}>
                  {SYSTEM_CORRESPONDENCES[pair.key]?.trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive pairs */}
      {inactivePairs.length > 0 && (
        <div className="p-6" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: 'var(--gh-ink-muted)', fontFamily: 'var(--font-body)' }}>Weave both systems to unlock</h3>
          <div className="opacity-60">
            {inactivePairs.map((pair, i) => (
              <div key={pair.key} className="py-3"
                style={{ borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                </div>
                <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>
                  {SYSTEM_CORRESPONDENCES[pair.key]?.trim().slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Integration Report */}
      <div className="p-6" style={{ background: tint('--gh-gold', 8), border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Combine className="w-5 h-5" style={{ color: 'var(--gh-accent)' }} />
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-body)', color: 'var(--gh-ink)' }}>Integrated blueprint reading</h3>
          </div>
          {deepReport && (
            <Button size="sm" variant="outline" onClick={() => exportMapPDF(profile, deepReport)}
              className="gap-1.5 text-xs" style={{ borderColor: 'hsl(var(--border))', color: 'var(--gh-accent)', background: 'transparent' }}>
              <Download className="w-3 h-3" /> Save as PDF
            </Button>
          )}
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-muted)' }}>
          A synthesized reading across all your active systems — the unified story they tell together
        </p>

        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--gh-accent)' }} />
            <span className="text-sm" style={{ color: 'var(--gh-ink-muted)' }}>Weaving your integrated blueprint…</span>
          </div>
        ) : deepReport ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--gh-ink-soft)' }}>
            {deepReport}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs mb-3" style={{ color: 'var(--gh-ink-muted)' }}>Composed from the systems you have turned on, side by side</p>
            <button type="button" onClick={generateDeepMap} disabled={enabledSystems.length === 0} className="ink-button text-sm disabled:opacity-50">
              Weave the integrated reading
            </button>
          </div>
        )}
      </div>

      {/* Export static map only */}
      {!deepReport && activePairs.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => exportMapPDF(profile, null)}
            className="gap-2 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'var(--gh-accent)', background: 'transparent' }}>
            <Download className="w-4 h-4" /> Save the map as PDF
          </Button>
        </div>
      )}
    </div>
  );
}