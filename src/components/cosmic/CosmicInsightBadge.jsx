import React from "react";
import { systemMeta } from "./systemMeta";

/** Quiet system tag: glyph + name on a hairline chip. One style for all. */
export default function CosmicInsightBadge({ systemId }) {
    const meta = systemMeta(systemId);
    if (!meta) return null;
    const { Icon, label } = meta;
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
            style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 6px)", color: "var(--gh-ink-soft)" }}>
            <Icon className="w-3 h-3" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
            {label}
        </span>
    );
}
