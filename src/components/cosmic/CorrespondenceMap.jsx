import React, { useState } from "react";
import { InvokeLLM } from "@/integrations/Core";
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
  doc.setTextColor(90, 36, 48);
  doc.text("Cosmic correspondence map", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(122, 72, 80);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;

  // Static correspondences
  doc.setFontSize(11);
  doc.setTextColor(194, 80, 60);
  doc.text("Cross-system correspondences", margin, y);
  y += 7;

  PAIRS.forEach(pair => {
    const text = SYSTEM_CORRESPONDENCES[pair.key]?.trim();
    if (!text) return;
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(9.5);
    doc.setTextColor(194, 80, 60);
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
    doc.text("Integrated reflection", margin, y);
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
  const [error, setError] = useState(null);

  const activePairs = PAIRS.filter(p => p.systems.every(s => enabledSystems.includes(s)));
  const inactivePairs = PAIRS.filter(p => !p.systems.every(s => enabledSystems.includes(s)));

  const generateDeepMap = async () => {
    setLoading(true);
    setError(null);
    const enabledDetails = enabledSystems.map(s => {
      const d = profile[s];
      if (!d) return null;
      const entries = Object.entries(d).filter(([k, v]) => v && k !== 'custom_notes').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
      return entries ? `${s.toUpperCase().replace(/_/g, ' ')}: ${entries}` : null;
    }).filter(Boolean).join('\n');

    const prompt = `Create a grounded reflection across the optional systems in this profile:

${enabledDetails || "Profile data not yet entered"}

Name: ${profile.first_name || ''} ${profile.last_name || ''}
Birth: ${profile.birth_date || 'unknown'}

Write a coherent reflection that:
1. Names one possible theme shared by the active systems.
2. Notes where the systems reinforce or contradict one another.
3. Offers one practical question or experiment for the coming week.

Treat these systems as reflective entertainment, not diagnosis, prediction, or objective identity. Use conditional language such as “may,” “might,” and “consider.” Do not make medical, psychological, legal, or financial claims. No em dashes. Keep the response under 700 words.`;

    try {
      const result = await InvokeLLM({ prompt });
      setDeepReport(typeof result === "string" ? result : result?.response || "");
    } catch (err) {
      setError(err?.message || "The integrated reading could not be generated.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active correspondences */}
      {activePairs.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5" style={{ color: '#C2503C' }} />
            <h3 className="font-sans text-base font-bold" style={{ color: 'var(--gh-ink)' }}>Active connections</h3>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-soft)' }}>Reference notes between the systems you enabled.</p>
          <div className="space-y-4">
            {activePairs.map(pair => (
              <div key={pair.key} className="p-5 rounded-lg"
                style={{ background: 'rgba(194,80,60,0.08)', border: '1px solid rgba(194,80,60,0.25)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {pair.systems.map(s => <CosmicInsightBadge key={s} systemId={s} />)}
                  <Badge className="text-xs" style={{ background: 'rgba(201,131,75,0.15)', color: '#C9834B', border: '1px solid rgba(201,131,75,0.25)' }}>
                    ✦ Active
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gh-ink)' }}>
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
          <h3 className="font-sans text-sm font-semibold mb-4" style={{ color: 'var(--gh-ink-muted)' }}>Available when both systems are enabled</h3>
          <div className="space-y-3">
            {inactivePairs.map(pair => (
              <div key={pair.key} className="p-4 rounded-lg opacity-45"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(61,52,80,0.08)' }}>
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
      <div className="glass-card-glow p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#C2503C' }} />
            <h3 className="font-sans text-base font-bold" style={{ color: 'var(--gh-ink)' }}>Integrated profile reflection</h3>
          </div>
          {deepReport && (
            <Button size="sm" variant="outline" onClick={() => exportMapPDF(profile, deepReport)}
              className="gap-1.5 text-xs" style={{ borderColor: 'rgba(194,80,60,0.3)', color: '#C2503C', background: 'transparent' }}>
                  <Download className="w-3 h-3" aria-hidden="true" /> Export full PDF
            </Button>
          )}
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-soft)' }}>
          An optional AI reflection across the profile details you entered. It may be inaccurate.
        </p>

        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C2503C' }} />
            <span className="text-sm" style={{ color: 'var(--gh-ink-soft)' }}>Generating your reflection. This can take up to 20 seconds.</span>
          </div>
        ) : deepReport ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--gh-ink)' }}>
            {deepReport}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs mb-3" style={{ color: 'var(--gh-ink-soft)' }}>AI interprets the profile details you entered. It may be inaccurate.</p>
            {error && <p role="alert" className="text-xs mb-3" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
            <Button onClick={generateDeepMap} disabled={enabledSystems.length === 0} className="btn-cosmic">
              <Sparkles className="w-4 h-4 mr-2" /> Generate integrated reflection
            </Button>
          </div>
        )}
      </div>

      {/* Export static map only */}
      {!deepReport && activePairs.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => exportMapPDF(profile, null)}
            className="gap-2 text-sm" style={{ borderColor: 'rgba(194,80,60,0.3)', color: '#C2503C', background: 'rgba(194,80,60,0.05)' }}>
              <Download className="w-4 h-4" aria-hidden="true" /> Export correspondence map PDF
          </Button>
        </div>
      )}
    </div>
  );
}
