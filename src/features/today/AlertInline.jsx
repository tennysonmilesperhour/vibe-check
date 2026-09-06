import React from "react";
import { BoundaryAlert } from "@/entities/all";
import { HandHeart } from "lucide-react";

/**
 * Gentle, in-place boundary alerts: acknowledgeable right here,
 * instead of being displayed on one page and actionable on another.
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
    <section aria-label="Boundary notices" className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-4"
          style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))" }}
        >
          <HandHeart className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--gh-ink)" }}>{alert.message}</p>
            <button
              type="button"
              onClick={() => acknowledge(alert)}
              className="mt-1 min-h-11 py-2 text-xs font-bold underline underline-offset-4"
              style={{ color: "var(--gh-accent)" }}
            >
              I see this
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
