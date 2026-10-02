import React, { useEffect, useRef, useState } from "react";
import { feelingIcon, isListedFeeling } from "./vocab";
import VocabularyIcon from "./VocabularyIcon";
import { Pencil, ImageDown } from "lucide-react";
import { shareNodeAsImage } from "@/lib/share";
import { formatDay, todayKey } from "@/lib/dates";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Scores({ entry }) {
  const scores = [
    { label: "MOOD", value: entry.mood_score },
    { label: "ENERGY", value: entry.energy_level },
    { label: "SLEEP", value: entry.sleep_quality },
  ];
  return (
    <div className="flex mt-4">
      {scores.map((s, i) => (
        <div key={s.label} className={`flex-1 hairline pt-3 ${i > 0 ? "pl-4" : ""} ${i < 2 ? "pr-4" : ""}`}>
          <div className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>{s.label}</div>
          <div className="font-display text-3xl" style={{ color: "var(--gh-ink)" }}>{s.value ?? "–"}<span className="text-base" style={{ color: "var(--gh-ink-muted)" }}>/10</span></div>
        </div>
      ))}
    </div>
  );
}

function Feelings({ emotions }) {
  if (!emotions?.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {emotions.map((label) => (
        <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 6px)", color: "var(--gh-ink-soft)" }}>
          <VocabularyIcon name={feelingIcon(label)} size={14} /> {label}
        </span>
      ))}
    </div>
  );
}

/**
 * The image to share, previewed first. It holds the scores and feelings; the
 * day's words go in only when chosen.
 */
function ShareDialog({ entry, open, onOpenChange }) {
  const cardRef = useRef(null);
  const [include, setInclude] = useState({ listed: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setInclude({ listed: true }); setError(""); } }, [open]);
  // Feelings from the check-in's own list go in unless left out; ones typed
  // in your own words are words, so they wait to be chosen like the rest.
  const listed = (entry.emotions || []).filter(isListedFeeling);
  const own = (entry.emotions || []).filter((label) => !isListedFeeling(label));
  const words = [
    ["own", "Feelings in your own words", own.join(", ")],
    ["gratitude", "Gratitude", entry.gratitude],
    ["high", "The high point", entry.high_moment?.description],
    ["difficult", "A difficult moment", entry.low_moment?.description],
    ["notes", "Your notes", entry.notes],
  ].filter(([, , text]) => text);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try { await shareNodeAsImage(cardRef.current, `vibe-${entry.date || todayKey()}.png`); }
    catch { setError("The image couldn't be made. Please try again."); }
    setSaving(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share today as an image</DialogTitle>
          <DialogDescription>The image holds only what the preview shows. Your words stay out unless you add them.</DialogDescription>
        </DialogHeader>
        <div ref={cardRef} className="share-card field-wash">
          <p className="sanctuary-eyebrow">{formatDay(entry.date, { style: "long", withYear: true })}</p>
          <h3 className="text-2xl mt-1" style={{ color: "var(--gh-ink)" }}>Today, kept</h3>
          <Scores entry={entry} />
          <Feelings emotions={[...(include.listed ? listed : []), ...(include.own ? own : [])]} />
          {words.filter(([key]) => key !== "own" && include[key]).map(([key, label, text]) => (
            <p key={key} className="mt-3 text-sm whitespace-pre-wrap" style={{ color: "var(--gh-ink-soft)" }}><strong>{label}: </strong>{text}</p>
          ))}
          <p className="share-card-mark">vibe check</p>
        </div>
        {listed.length > 0 && (
          <label className="flex items-center gap-3 text-sm mt-4">
            <input type="checkbox" checked={Boolean(include.listed)} onChange={(e) => setInclude((current) => ({ ...current, listed: e.target.checked }))} />
            Feeling words from the list
          </label>
        )}
        {words.length > 0 && (
          <fieldset className="space-y-2 mt-4">
            <legend className="living-label mb-2">Add your words, if you want them in the image</legend>
            {words.map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={Boolean(include[key])} onChange={(e) => setInclude((current) => ({ ...current, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </fieldset>
        )}
        {error && <p className="living-error mt-3" role="alert">{error}</p>}
        <button type="button" className="ink-button mt-4 inline-flex items-center gap-2" aria-disabled={saving} onClick={save}>
          <ImageDown className="w-4 h-4" aria-hidden="true" />{saving ? "Making the image…" : "Save the image"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

/** Field-register summary of today's saved entry. */
export default function TodaySummary({ entry, onEdit }) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <section aria-labelledby="today-summary-heading" className="field-wash p-1">
      <div className="flex items-end justify-between">
        <h2 id="today-summary-heading" className="text-3xl" style={{ color: "var(--gh-ink)" }}>
          Today, kept
        </h2>
        <span className="flex gap-3">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--gh-ink-muted)" }}
          >
            <ImageDown className="w-3.5 h-3.5" aria-hidden="true" /> Share as image
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--gh-accent)" }}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Revisit today
          </button>
        </span>
      </div>

      <Scores entry={entry} />
      <Feelings emotions={entry.emotions} />

      {(entry.gratitude || entry.high_moment?.description) && (
        <p className="mt-4 text-sm max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>
          {entry.gratitude || entry.high_moment.description}
        </p>
      )}
      {entry.low_moment?.description && <p className="mt-4 text-sm whitespace-pre-wrap" style={{ color: 'var(--gh-ink-soft)' }}><strong>A difficult moment: </strong>{entry.low_moment.description}</p>}
      {entry.notes && <p className="mt-4 text-sm whitespace-pre-wrap" style={{ color: 'var(--gh-ink-soft)' }}>{entry.notes}</p>}
      <ShareDialog entry={entry} open={shareOpen} onOpenChange={setShareOpen} />
    </section>
  );
}
