import React, { useState, useEffect, useRef } from "react";
import { systemReading } from "@/lib/wisdom/engine";
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
    <div className="mt-3 p-3 text-sm" style={{ background: tint('--gh-gold', 10), border: '1px solid hsl(var(--border))', color: 'var(--gh-ink-soft)' }}>
      <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--gh-ink-muted)' }}>Personal Notes</span>
      {children}
    </div>
  );
}

const PLANETS = [
  { label: "Sun ☉", key: "sun_sign", desc: "Core identity & conscious self" },
  { label: "Moon ☽", key: "moon_sign", desc: "Emotional nature & inner world" },
  { label: "Rising ↑", key: "rising_sign", desc: "Outer persona & first impressions" },
  { label: "North Node ☊", key: "north_node", desc: "Soul's evolutionary direction" },
];

const HD_CENTERS = [
  "Head", "Ajna", "Throat", "G Center (Identity)", "Heart/Ego",
  "Solar Plexus", "Sacral", "Spleen", "Root"
];

const SIGN_SIGNATURE = [
  { label: "Element", key: "element" },
  { label: "Modality", key: "modality" },
  { label: "Polarity", key: "polarity" },
  { label: "Ruling Planet", key: "ruler" },
];

function AstrologyDetail({ data }) {
  const hasSignature = SIGN_SIGNATURE.some(s => data?.[s.key]) || data?.decan;
  return (
    <>
    <Section title="Planetary Placements">
      {PLANETS.map(p => data?.[p.key] && (
        <div key={p.key} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="w-28 shrink-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--gh-accent)' }}>{p.label}</p>
            <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>{p.desc}</p>
          </div>
          <div className="flex-1">
            <span className="px-2.5 py-1 rounded-sm text-sm font-medium"
              style={{ background: tint('--gh-accent', 10), color: 'var(--gh-accent)', border: `1px solid ${tint('--gh-accent', 30)}` }}>
              {data[p.key]}
            </span>
          </div>
        </div>
      ))}
      <NotesBlock>{data?.custom_notes}</NotesBlock>
    </Section>
    {hasSignature && (
      <Section title="Sign Signature">
        {SIGN_SIGNATURE.map(s => <DataRow key={s.key} label={s.label} value={data?.[s.key]} />)}
        {data?.decan && <DataRow label="Decan" value={data.decan_ruler ? `${data.decan} · ${data.decan_ruler}` : String(data.decan)} />}
      </Section>
    )}
    </>
  );
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
            <div key={c} className="p-2 text-center text-xs" style={{ background: tint('--gh-accent', 6), border: '1px solid hsl(var(--border))', color: 'var(--gh-ink-soft)' }}>
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
      { label: "Life's Work (Conscious Sun)", key: "life_work" },
      { label: "Evolution (Conscious Earth)", key: "evolution" },
    ]},
    { group: "Venus Sequence", keys: [
      { label: "Radiance (Conscious Moon)", key: "radiance" },
      { label: "Purpose (Conscious Node)", key: "purpose" },
    ]},
    { group: "Pearl Sequence", keys: [
      { label: "Attraction (Unconscious Sun)", key: "attraction" },
      { label: "IQ (Unconscious Node)", key: "iq" },
    ]},
  ];
  return (
    <>
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

// Golden Hour ink on paper: ink #5A2430, accent #C2503C, muted #A6606E.
const PDF_INK = [90, 36, 48];
const PDF_ACCENT = [194, 80, 60];
const PDF_MUTED = [166, 96, 110];

async function exportToPDF(systemLabel, reportText, profileData) {
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
  y += 10;

  // Profile summary
  if (profileData) {
    doc.setFontSize(10);
    doc.setTextColor(...PDF_ACCENT);
    doc.text("Profile Data", margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_INK);
    Object.entries(profileData).forEach(([k, v]) => {
      if (v && k !== 'custom_notes' && typeof v === 'string') {
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
    { key: 'instinct', label: 'Instinct' }, { key: 'tritype', label: 'Tritype' },
  ]} />,
  chakras: ({ data }) => <GenericDetail data={data} fields={[
    { key: 'dominant_center', label: 'Dominant Center' },
  ]} />,
};

function SystemCard({ systemId, profile, cosmicProfile, autoOpen, openNonce }) {
  const meta = systemMeta(systemId);
  const Detail = SYSTEM_DETAILS[systemId];
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const cardRef = useRef(null);

  // When the Loom sends the reader here ("Deep dive into X"), open this card
  // and bring it into view. Keyed on openNonce so tapping the same system
  // again re-scrolls even though `autoOpen` never changes.
  useEffect(() => {
    if (!autoOpen) return;
    setExpanded(true);
    setReport((r) => r || systemReading(systemId, profile[systemId] || {}, cosmicProfile));
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [autoOpen, openNonce]);

  if (!meta || !Detail) return null;
  const { label, Icon } = meta;
  const data = profile[systemId];

  const compose = () => {
    // Composed from the wisdom engine's content tables — exact, instant, local.
    setReport(systemReading(systemId, data || {}, cosmicProfile));
  };

  return (
    <div ref={cardRef} className="overflow-hidden" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))', scrollMarginTop: "1rem" }}>
      <button className="w-full p-5 flex items-center justify-between text-left"
        onClick={() => setExpanded(e => !e)}>
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
          {/* Profile data */}
          <Detail data={data} />

          {/* Composed deep reading */}
          <div className="mt-4 p-4" style={{ background: tint('--gh-gold', 8), border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--gh-accent)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--gh-ink)', fontFamily: 'Space Grotesk, sans-serif' }}>Deep reading</span>
              </div>
              {report && (
                <Button size="sm" variant="outline" onClick={() => exportToPDF(label, report, data)}
                  className="text-xs gap-1.5 rounded-none" style={{ borderColor: 'hsl(var(--border))', color: 'var(--gh-accent)', background: 'transparent' }}>
                  <Download className="w-3 h-3" /> Save as PDF
                </Button>
              )}
            </div>

            {report ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--gh-ink-soft)' }}>
                {report}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs mb-3" style={{ color: 'var(--gh-ink-muted)' }}>
                  Composed exactly from your profile and the engine's content tables — nothing generated
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
      <div className="p-12 text-center" style={{ background: 'var(--gh-cream)', border: '1px solid hsl(var(--border))' }}>
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
