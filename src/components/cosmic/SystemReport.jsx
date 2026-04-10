import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { SYSTEM_CORRESPONDENCES } from "./correspondences";

// ── Per-system detail renderers ─────────────────────────────────────────────

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-xs uppercase tracking-widest w-36 shrink-0" style={{ color: 'rgba(180,170,210,0.5)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'rgba(220,210,240,0.9)' }}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: 'rgba(192,132,252,0.7)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>{title}</h4>
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

function AstrologyDetail({ data }) {
  return (
    <Section title="Planetary Placements">
      {PLANETS.map(p => data?.[p.key] && (
        <div key={p.key} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="w-28 shrink-0">
            <p className="text-sm font-semibold" style={{ color: 'rgba(244,114,182,0.9)' }}>{p.label}</p>
            <p className="text-xs" style={{ color: 'rgba(180,170,210,0.4)' }}>{p.desc}</p>
          </div>
          <div className="flex-1">
            <span className="px-2.5 py-1 rounded-full text-sm font-medium"
              style={{ background: 'rgba(244,114,182,0.1)', color: 'rgba(244,114,182,0.85)', border: '1px solid rgba(244,114,182,0.2)' }}>
              {data[p.key]}
            </span>
          </div>
        </div>
      ))}
      {data?.custom_notes && (
        <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(244,114,182,0.06)', color: 'rgba(200,190,230,0.75)', border: '1px solid rgba(244,114,182,0.12)' }}>
          <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: 'rgba(244,114,182,0.5)' }}>Personal Notes</span>
          {data.custom_notes}
        </div>
      )}
    </Section>
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
            <div key={c} className="p-2 rounded-lg text-center text-xs" style={{ background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.1)', color: 'rgba(200,190,230,0.6)' }}>
              {c}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: 'rgba(180,170,210,0.4)' }}>Centers defined/undefined based on your full chart — consult the oracle reading below for a deeper analysis</p>
      </Section>
      {data?.custom_notes && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(192,132,252,0.06)', color: 'rgba(200,190,230,0.75)', border: '1px solid rgba(192,132,252,0.12)' }}>
          <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: 'rgba(192,132,252,0.5)' }}>Personal Notes</span>
          {data.custom_notes}
        </div>
      )}
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
            <div key={k.key} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-xs w-44 shrink-0" style={{ color: 'rgba(180,170,210,0.5)' }}>{k.label}</span>
              <span className="px-2.5 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
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
      {data?.custom_notes && (
        <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(139,92,246,0.06)', color: 'rgba(200,190,230,0.75)', border: '1px solid rgba(139,92,246,0.12)' }}>
          {data.custom_notes}
        </div>
      )}
    </Section>
  );
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildPrompt(systemId, profile, cosmicProfile) {
  const birthInfo = [
    cosmicProfile.first_name && `Name: ${cosmicProfile.first_name} ${cosmicProfile.last_name || ''}`.trim(),
    cosmicProfile.birth_date && `Birth Date: ${cosmicProfile.birth_date}`,
    cosmicProfile.birth_time && `Birth Time: ${cosmicProfile.birth_time}`,
    cosmicProfile.birth_location && `Birth Location: ${cosmicProfile.birth_location}`,
  ].filter(Boolean).join(", ");

  const prompts = {
    astrology: `You are a thoughtful, grounded astrologer. Generate a comprehensive yet accessible natal chart interpretation for: ${birthInfo}.
Profile data: Sun in ${profile.sun_sign || '?'}, Moon in ${profile.moon_sign || '?'}, Rising ${profile.rising_sign || '?'}, North Node in ${profile.north_node || '?'}.
${profile.custom_notes ? `Additional notes: ${profile.custom_notes}` : ''}
Cover: (1) Core personality synthesis of the major placements, (2) The interplay between Sun/Moon/Rising — how these energies harmonize or create tension, (3) North Node evolutionary path and what it asks of this person, (4) Karmic themes and growth edges, (5) Practical life guidance. Be specific, poetic but not vague, and deeply personal.`,

    human_design: `You are a Human Design analyst. Generate a comprehensive report for: ${birthInfo}.
Type: ${profile.type || '?'}, Authority: ${profile.authority || '?'}, Profile: ${profile.profile || '?'}, Definition: ${profile.definition || '?'}, Strategy: ${profile.strategy || '?'}, Incarnation Cross: ${profile.incarnation_cross || '?'}.
${profile.custom_notes ? `Additional notes: ${profile.custom_notes}` : ''}
Cover: (1) Type strategy and how to use energy correctly, (2) Authority — the decision-making process in depth, (3) Profile lines — the archetypal role and karmic themes, (4) Incarnation Cross — the overarching life purpose, (5) Definition — how energy moves through their chart, (6) Practical guidance for aligned living.`,

    gene_keys: `You are a Gene Keys guide. Generate a comprehensive hologenetic profile reading for: ${birthInfo}.
Life's Work Key: ${profile.life_work || '?'}, Evolution Key: ${profile.evolution || '?'}, Radiance Key: ${profile.radiance || '?'}, Purpose Key: ${profile.purpose || '?'}, Attraction Key: ${profile.attraction || '?'}, IQ Key: ${profile.iq || '?'}.
Cover: (1) Activation Sequence — the physical wellbeing path (Life's Work + Evolution), (2) Venus Sequence — emotional intelligence and relationships (Radiance + Purpose), (3) Pearl Sequence — vocation and prosperity (Attraction + IQ), (4) The overarching Golden Path and how these sequences interweave, (5) Shadow patterns to transcend and Gifts to cultivate.`,

    numerology: `You are a numerologist. Generate a comprehensive reading for: ${birthInfo}.
Life Path: ${profile.life_path || '?'}, Expression: ${profile.expression || '?'}, Soul Urge: ${profile.soul_urge || '?'}, Personal Year: ${profile.personal_year || '?'}.
Cover: (1) Life Path — the core soul lesson and life theme in depth, (2) Expression Number — natural talents and how purpose manifests outwardly, (3) Soul Urge — the deep inner motivation and heart's desire, (4) Personal Year — the current cycle energy and what it asks, (5) How all four numbers interact and the story they tell together.`,

    tarot_archetype: `You are a Tarot archetypal reader. Generate a comprehensive soul archetype reading for: ${birthInfo}.
Birth Card: ${profile.birth_card || '?'}, Shadow/Teacher Card: ${profile.shadow_card || '?'}.
Cover: (1) Birth Card archetype — the soul's primary lens and gifts, (2) Shadow/Teacher Card — what challenges and initiates this person, (3) The dynamic interplay between the two cards and how they create a complete picture, (4) How this archetype shows up in relationships, vocation, and personal growth, (5) Practices and contemplations aligned with this archetypal path.`,

    chakras: `You are an energy healing and chakra guide. Generate a comprehensive chakra analysis for: ${birthInfo}.
Dominant/Focus Center: ${profile.dominant_center || '?'}.
${profile.custom_notes ? `Additional notes: ${profile.custom_notes}` : ''}
Cover: (1) The dominant center's gifts and how they express, (2) How this center relates to all 7 chakras and which may be over/under-active in relation, (3) Emotional and physical patterns associated with this focus, (4) Balancing practices — movement, breathwork, sound, color, affirmation, (5) Integration guidance for wholeness.`,
  };

  return prompts[systemId] || `Generate a comprehensive reading for the ${systemId} system based on: ${JSON.stringify(profile)}`;
}

// ── PDF Export ───────────────────────────────────────────────────────────────

async function exportToPDF(systemLabel, reportText, profileData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = W - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(120, 60, 220);
  doc.text(`${systemLabel} — Full Report`, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(140, 130, 170);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;

  // Profile summary
  if (profileData) {
    doc.setFontSize(10);
    doc.setTextColor(80, 60, 120);
    doc.text("Profile Data", margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(60, 50, 80);
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
  doc.setTextColor(80, 60, 120);
  doc.text("Full Reading", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(30, 20, 50);
  const lines = doc.splitTextToSize(reportText, maxW);
  lines.forEach(line => {
    if (y > 275) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 5;
  });

  doc.save(`${systemLabel.toLowerCase().replace(/ /g, '-')}-report.pdf`);
}

// ── Main Component ───────────────────────────────────────────────────────────

const SYSTEM_META = {
  astrology:       { label: "Astrology",       color: "#f472b6", emoji: "♈", Detail: AstrologyDetail },
  human_design:    { label: "Human Design",    color: "#c084fc", emoji: "⬡", Detail: HumanDesignDetail },
  gene_keys:       { label: "Gene Keys",       color: "#38bdf8", emoji: "🧬", Detail: GeneKeysDetail },
  numerology:      { label: "Numerology",      color: "#2dd4bf", emoji: "∞",
    Detail: ({ data }) => <GenericDetail data={data} fields={[
      { key: 'life_path', label: 'Life Path' }, { key: 'expression', label: 'Expression' },
      { key: 'soul_urge', label: 'Soul Urge' }, { key: 'personal_year', label: 'Personal Year' },
    ]} /> },
  tarot_archetype: { label: "Tarot Archetype", color: "#fbbf24", emoji: "✦",
    Detail: ({ data }) => <GenericDetail data={data} fields={[
      { key: 'birth_card', label: 'Birth Card' }, { key: 'shadow_card', label: 'Shadow Card' },
    ]} /> },
  chakras:         { label: "Chakras",         color: "#a78bfa", emoji: "◎",
    Detail: ({ data }) => <GenericDetail data={data} fields={[
      { key: 'dominant_center', label: 'Dominant Center' },
    ]} /> },
};

function SystemCard({ systemId, profile, cosmicProfile }) {
  const meta = SYSTEM_META[systemId];
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!meta) return null;
  const { label, color, emoji, Detail } = meta;
  const data = profile[systemId];

  const generate = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(systemId, data || {}, cosmicProfile),
      model: "claude_sonnet_4_6",
    });
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="glass-card overflow-hidden" style={{ border: `1px solid ${color}30` }}>
      <button className="w-full p-5 flex items-center justify-between text-left"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(220,210,240,0.95)' }}>{label}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(180,170,210,0.5)' }}>Full system report</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color }} /> : <ChevronDown className="w-4 h-4" style={{ color }} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* Profile data */}
          <Detail data={data} />

          {/* AI Report */}
          <div className="mt-4 p-4 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-semibold" style={{ color, fontFamily: 'Space Grotesk, sans-serif' }}>Deep Dive Reading</span>
              </div>
              {report && (
                <Button size="sm" variant="outline" onClick={() => exportToPDF(label, report, data)}
                  className="text-xs gap-1.5" style={{ borderColor: `${color}30`, color, background: 'transparent' }}>
                  <Download className="w-3 h-3" /> Export PDF
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                <span className="text-sm" style={{ color: 'rgba(180,170,210,0.6)' }}>Generating your {label} reading…</span>
              </div>
            ) : report ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(210,200,235,0.85)' }}>
                {report}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs mb-3" style={{ color: 'rgba(180,170,210,0.45)' }}>
                                  Each oracle reading channels from the cosmic well — uses a small amount of credits
                                </p>
                <Button onClick={generate} className="btn-cosmic rounded-xl text-sm">
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Full Reading
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemReports({ enabledSystems, profile, cosmicProfile }) {
  if (enabledSystems.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(139,92,246,0.4)' }} />
        <p className="font-medium mb-1" style={{ color: 'rgba(200,190,230,0.7)', fontFamily: 'Space Grotesk, sans-serif' }}>No systems enabled</p>
        <p className="text-sm" style={{ color: 'rgba(160,150,190,0.5)' }}>Enable at least one system on the Systems tab.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {enabledSystems.map(id => (
        <SystemCard key={id} systemId={id} profile={profile} cosmicProfile={cosmicProfile} />
      ))}
    </div>
  );
}