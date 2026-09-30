import React, { useMemo } from "react";
import { deriveAll } from "@/lib/resonance/derive";
import { todayKey } from "@/lib/dates";
import { Compass } from "lucide-react";

const FIELD_LABELS = {
  "astrology.sun_sign": "Sun sign",
  "numerology.life_path": "Life Path",
  "tarot_archetype.birth_card": "tarot birth card",
  "gene_keys.life_work": "Gene Keys Life's Work",
};

/**
 * Gentle cross-validation: where saved data contradicts what the systems
 * themselves imply, say so and offer the computed value in one tap. Only
 * systems the person has turned on are checked. Never blocks anything.
 */
export default function ConflictNotice({ profile, onUseComputed, onKeepSaved }) {
  const conflicts = useMemo(() => {
    try {
      const enabled = profile?.enabled_systems || [];
      return deriveAll(profile || {}, todayKey()).conflicts.filter((c) => c.systems.every((system) => enabled.includes(system)));
    } catch {
      return [];
    }
  }, [profile]);

  if (conflicts.length === 0) return null;

  return (
    <section aria-label="Data harmonics" className="space-y-2">
      {conflicts.map((c) => (
        <div
          key={c.field}
          className="flex items-start gap-3 p-4"
          style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}
        >
          <Compass className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
          <div className="flex-1 text-sm" style={{ color: "var(--gh-ink)" }}>
            <p>
              Your {FIELD_LABELS[c.field] || c.field.replace(/_/g, " ").replace(".", " · ")} is set to <strong>{String(c.entered)}</strong>,
              but your {c.source} implies <strong>{String(c.value ?? c.computed)}</strong>.
            </p>
            {c.field === "astrology.sun_sign" && <p className="text-xs mt-1">An accurate birth chart may differ near a sign boundary. Keep your entered sign if it comes from that chart.</p>}
            {c.field === "tarot_archetype.birth_card" && c.keepable && (
              <p className="text-xs mt-1">
                {c.retired
                  ? "Vibe Check filled in this card with an earlier method. It now follows Mary K. Greer's method, so the card can differ. Keep yours if you prefer it."
                  : "Keep yours if it comes from a tarot practice you follow."}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {onUseComputed && (
                <button
                  type="button"
                  onClick={() => onUseComputed(c)}
                  className="text-xs font-bold underline underline-offset-4"
                  style={{ color: "var(--gh-accent)" }}
                >
                  Use {String(c.value ?? c.computed)}
                </button>
              )}
              {onKeepSaved && c.keepable && (
                <button
                  type="button"
                  onClick={() => onKeepSaved(c)}
                  className="text-xs font-bold underline underline-offset-4"
                  style={{ color: "var(--gh-accent)" }}
                >
                  Keep {String(c.entered)}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
