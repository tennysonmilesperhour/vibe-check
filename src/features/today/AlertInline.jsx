import React from "react";
import { Link } from "react-router-dom";
import { BoundaryAlert } from "@/api/entities";
import { HandHeart } from "lucide-react";

/**
 * Gentle low-mood notices (opt-in in Settings), with a next step beside each:
 * a practice for this moment or support options. Dismissable in place.
 */
export default function AlertInline({ alerts, onAcknowledged }) {
  if (!alerts?.length) return null;

  const acknowledge = async (alert) => {
    try {
      await BoundaryAlert.update(alert.id, { is_acknowledged: true });
      onAcknowledged?.(alert.id);
    } catch {
      // leave it visible; the user can retry
    }
  };

  return (
    <section aria-label="Gentle notices" className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-4"
          style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}
        >
          <HandHeart className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--gh-ink)" }}>{alert.message}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold" style={{ color: "var(--gh-accent)" }}>
              <Link className="underline underline-offset-4 py-1" to="/Practice?tab=somatic">Try a practice for this moment</Link>
              <Link className="underline underline-offset-4 py-1" to="/support-now">Support options</Link>
              <button type="button" onClick={() => acknowledge(alert)} className="underline underline-offset-4 py-1">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
