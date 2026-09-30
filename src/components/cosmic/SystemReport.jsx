import React, { useState, useEffect, useRef, useMemo } from "react";
import { astrologyPlacements, astrologyAspects } from "@/lib/wisdom/astrology";
import { deriveAstrology } from "@/lib/resonance/astrology";
import { AstrologySources } from "./AstrologyGuide";
import { systemReading } from "@/lib/wisdom/engine";
import { needsPositionCheck, POSITION_CHECK_NOTE } from "@/lib/resonance/settle";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ChevronDown, ChevronUp } from "lucide-react";
import { systemMeta, tint } from "./systemMeta";

// ── Per-system detail renderers ─────────────────────────────────────────────

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-1.5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
      <span className="text-xs uppercase tracking-widest w-36 shrink-0" style={{ color: 'var(--gh-ink-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--gh-ink)' }}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: 'var(--gh-accent)', borderBottom: '1px solid hsl(var(--border))' }}>{title}</h4>
      {children}
    </div>
  );
}

function NotesBlock({ children }) {
  if (!children) return null;
  return (
    <div className="mt-3 p-3 text-sm" style={{ background: tint('--gh-gold', 10), border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)', color: 'var(--gh-ink-soft)' }}>
      <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--gh-ink-muted)' }}>Personal Notes</span>
      {children}
    </div>
  );
}

const HD_CENTERS = ["Head", "Ajna", "Throat", "G Center (Identity)", "Heart/Ego", "Solar Plexus", "Spleen", "Sacral", "Root"];

function AstrologyDetail({ data, cosmicProfile }) {
  const placements = astrologyPlacements(data || {}, deriveAstrology(cosmicProfile?.birth_date));
  return <Section title="Your known placements">
    {placements.map(p => <DataRow key={p.id} label={`${p.symbol} ${p.label}`} value={`${p.sign} · ${p.source}${p.house ? ` · House ${p.house.number}` : ''}`} />)}
    {astrologyAspects(data || {}).map(a => <DataRow key={`${a.a.id}-${a.b.id}-${a.label}`} label="Entered aspect" value={`${a.a.label} ${a.label.toLowerCase()} ${a.b.label}`} />)}
    <p className="text-xs mt-3">Unknown placements are left open. These are natal placements, without calculated transits or event forecasts.</p>
  </Section>;
}

function HumanDesignDetail({ data }) {
  return (
    <>
      <Section title="Core Design">
        <DataRow label="Type" value={data?.type} />
        <DataRow label="Strategy" value={data?.strategy} />
        <DataRow label="Authority" value={data?.authority} />
        <DataRow label="Profile" value={data?.profile} />
        <DataRow label="Definition" value={data?.definition} />
        <DataRow label="Incarnation Cross" value={data?.incarnation_cross} />
      </Section>
      <Section title="9 Centers Overview">
        <div className="grid grid-cols-3 gap-2">
          {HD_CENTERS.map(c => (
            <div key={c} className="p-2 text-center text-xs" style={{ background: tint('--gh-accent', 6), border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)', color: 'var(--gh-ink-soft)' }}>
              {c}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--gh-ink-muted)' }}>Centers defined/undefined come from your full chart — the deep reading below goes further</p>
      </Section>
      <NotesBlock>{data?.custom_notes}</NotesBlock>
    </>
  );
}

function GeneKeysDetail({ data }) {
  const sequences = [
    { group: "Activation Sequence", keys: [
      { label: "Life's Work (Personality Sun)", key: "life_work" },
      { label: "Evolution (Personality Earth)", key: "evolution" },
      { label: "Radiance (Design Sun)", key: "radiance" },
      { label: "Purpose (Design Earth)", key: "purpose" },
    ]},
    { group: "Venus Sequence", keys: [
      { label: "Attraction (Design Moon)", key: "attraction" },
      { label: "IQ (Personality Venus)", key: "iq" },
    ]},
  ];
  return (
    <>
      {needsPositionCheck(data) && <p className="text-xs mb-3" role="note" style={{ color: 'var(--gh-ink-soft)' }}>{POSITION_CHECK_NOTE}</p>}
      {sequences.map(seq => (
        <Section key={seq.group} title={seq.group}>
          {seq.keys.map(k => data?.[k.key] && (
            <div key={k.key} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <span className="text-xs w-44 shrink-0" style={{ color: 'var(--gh-ink-muted)' }}>{k.label}</span>
              <span className="px-2.5 py-1 rounded-sm text-sm font-bold" style={{ background: tint('--gh-gold', 16), color: 'var(--gh-ink)', border: `1px solid ${tint('--gh-gold', 40)}` }}>
                Key {data[k.key]}
              </span>
            </div>
          ))}
        </Section>
      ))}
    </>
  );
}

function GenericDetail({ data, fields }) {
  return (
    <Section title="Profile Data">
      {fields.map(f => <DataRow key={f.key} label={f.label} value={data?.[f.key]} />)}
      <NotesBlock>{data?.custom_notes}</NotesBlock>
    </Section>
  );
}

// ── PDF Export ───────────────────────────────────────────────────────────────

// Woodland ink on paper; keep exported text dark for ordinary white paper.
const PDF_INK = [27, 36, 26];
const PDF_ACCENT = [52, 73, 47];
const PDF_MUTED = [84, 94, 65];

async function exportToPDF(systemLabel, reportText, profileData, origin) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = W - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(...PDF_ACCENT);
  doc.text(`${systemLabel} — Full Report`, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_MUTED);
  doc.text(`Composed ${new Date().toLocaleDateString()} · Vibe Check`, margin, y);
  y += 6;
  // Where the system comes from and who Vibe Check is not affiliated with.
  if (origin) {
    doc.setFontSize(8.5);
    for (const line of doc.splitTextToSize(origin, maxW)) {
      doc.text(line, margin, y);
      y += 4.5;
    }
  }
  y += 4;

  // Profile summary
  if (profileData) {
    doc.setFontSize(10);
    doc.setTextColor(...PDF_ACCENT);
    doc.text("Profile Data", margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_INK);
    Object.entries(profileData).forEach(([k, v]) => {
      if (v && k !== 'custom_notes' && !k.endsWith('_source') && typeof v === 'string') {
        const line = `${k.replace(/_/g, ' ')}: ${v}`;
        doc.text(line, margin, y);
        y += 5;
        if (y > 270) { doc.addPage(); y = margin; }
      }
    });
    y += 4;
  }

  // Report body
  doc.setFontSize(10);
  doc.setTextColor(...PDF_ACCENT);
  doc.text("Full Reading", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_INK);
  const lines = doc.splitTextToSize(reportText, maxW);
  lines.forEach(line => {
    if (y > 275) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 5;
  });

  doc.save(`${systemLabel.toLowerCase().replace(/ /g, '-')}-report.pdf`);
}

// ── Main Component ───────────────────────────────────────────────────────────

const SYSTEM_DETAILS = {
  astrology: AstrologyDetail,
  human_design: HumanDesignDetail,
  gene_keys: GeneKeysDetail,
  numerology: ({ data }) => <GenericDetail data={data} fields={[
    { key: 'life_path', label: 'Life Path' }, { key: 'expression', label: 'Expression' },
    { key: 'soul_urge', label: 'Soul Urge' }, { key: 'personal_year', label: 'Personal Year' },
  ]} />,
  tarot_archetype: ({ data }) => <GenericDetail data={data} fields={[
    { key: 'birth_card', label: 'Birth Card' }, { key: 'shadow_card', label: 'Shadow Card' },
  ]} />,
  enneagram: ({ data }) => <GenericDetail data={data} fields={[
    { key: 'type', label: 'Type' }, { key: 'wing', label: 'Wing' },
    { key: 'instinct', label: 'Instinct' }, { key: 'tritype', label: 'Three-center type' },
  ]} />,
  chakras: ({ data }) => <GenericDetail data={data} fields={[
    { key: 'dominant_center', label: 'Dominant Center' },
  ]} />,
};

function SystemCard({ systemId, profile, cosmicProfile, autoOpen, openNonce }) {
  const meta = systemMeta(systemId);
  const Detail = SYSTEM_DETAILS[systemId];
  const [expanded, setExpanded] = useState(false);
  const [composed, setComposed] = useState(false);
  const report = useMemo(() => composed ? systemReading(systemId, profile[systemId] || {}, cosmicProfile) : null, [composed, systemId, profile, cosmicProfile]);
  const cardRef = useRef(null);

  // When the Loom sends the reader here ("Deep dive into X"), open this card
  // and bring it into view. Keyed on openNonce so tapping the same system
  // again re-scrolls even though `autoOpen` never changes.
  useEffect(() => {
    if (!autoOpen) return;
    setExpanded(true);
    setComposed(true);
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [autoOpen, openNonce]);

  if (!meta || !Detail) return null;
  const { label, Icon } = meta;
  const data = profile[systemId];

  const compose = () => {
    setComposed(true);
  };

  return (
    <div ref={cardRef} className="overflow-hidden" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)', scrollMarginTop: "1rem" }}>
      <button className="w-full p-5 flex items-center justify-between text-left"
        aria-expanded={expanded} onClick={() => { setExpanded(e => !e); if (systemId === 'astrology' && !expanded) setComposed(true); }}>
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: 'var(--gh-accent)' }} aria-hidden="true" />
          <div>
            <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--gh-ink)' }}>{label}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gh-ink-muted)' }}>Full system report</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--gh-accent)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--gh-accent)' }} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {meta.origin && <p className="text-xs mb-4" style={{ color: 'var(--gh-ink-muted)' }}>{meta.origin}</p>}
          {/* Profile data */}
          <Detail data={data} cosmicProfile={cosmicProfile} />

          {systemId === "astrology" && <AstrologySources />}

          {/* Composed deep reading */}
          <div className="mt-4 p-4" style={{ background: tint('--gh-gold', 8), border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 3px)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--gh-accent)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--gh-ink)', fontFamily: 'Space Grotesk, sans-serif' }}>Deep reading</span>
              </div>
              {report && (
                <Button size="sm" variant="outline" onClick={() => exportToPDF(label, report, systemId === "astrology" ? null : data, meta.origin)}
                  className="text-xs gap-1.5" style={{ borderColor: 'hsl(var(--border))', color: 'var(--gh-accent)', background: 'transparent' }}>
                  <Download className="w-3 h-3" /> Save as PDF
                </Button>
              )}
            </div>

            {report ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--gh-ink-soft)' }}>
                {systemId === 'astrology' ? report.split('\n\n').map((section, index) => {
                  const breakAt = section.indexOf('\n');
                  return breakAt < 0 ? <p key={index}>{section}</p> : <section key={index} className="mb-6 last:mb-0">
                    <h4 className="text-xs font-bold tracking-wider mb-2" style={{ color: 'var(--gh-accent)' }}>{section.slice(0, breakAt)}</h4>
                    <p>{section.slice(breakAt + 1)}</p>
                  </section>;
                }) : report}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs mb-3" style={{ color: 'var(--gh-ink-muted)' }}>
                  Explore your known placements through original reflections and practical questions.
                </p>
                <button type="button" onClick={compose} className="ink-button text-sm">
                  Compose your reading
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemReports({ enabledSystems, profile, cosmicProfile, openSystem, openNonce }) {
  if (enabledSystems.length === 0) {
    return (
      <div className="p-12 text-center" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
        <p className="font-medium mb-1" style={{ color: 'var(--gh-ink)', fontFamily: 'Space Grotesk, sans-serif' }}>No systems woven yet</p>
        <p className="text-sm" style={{ color: 'var(--gh-ink-muted)' }}>Turn on at least one system on the Systems tab.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {enabledSystems.map(id => (
        <SystemCard key={id} systemId={id} profile={profile} cosmicProfile={cosmicProfile}
          autoOpen={openSystem === id} openNonce={openNonce} />
      ))}
    </div>
  );
}
