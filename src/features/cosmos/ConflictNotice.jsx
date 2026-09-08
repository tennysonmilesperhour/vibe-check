import React, { useMemo } from "react";
import { deriveAll } from "@/lib/resonance/derive";
import { todayKey } from "@/lib/dates";
import { Compass } from "lucide-react";

/**
 * Gentle cross-validation: where entered data contradicts what the systems
 * themselves imply, say so and offer the computed value in one tap.
 * Never blocks anything.
 */
export default function ConflictNotice({ profile, onUseComputed }) {
  const conflicts = useMemo(() => {
    try {
      return deriveAll(profile || {}, todayKey()).conflicts;
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
              You entered <strong>{String(c.entered)}</strong> for {c.field.replace(/_/g, " ").replace(".", " · ")},
              but your {c.source} implies <strong>{String(c.computed)}</strong>.
            </p>
            {onUseComputed && (
              <button
                type="button"
                onClick={() => onUseComputed(c)}
                className="mt-2 text-xs font-bold underline underline-offset-4"
                style={{ color: "var(--gh-accent)" }}
              >
                Use {String(c.computed)}
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
