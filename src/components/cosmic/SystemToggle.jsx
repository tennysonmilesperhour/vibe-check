import React from "react";
import { Switch } from "@/components/ui/switch";
import { SYSTEMS } from "./systemMeta";

export { SYSTEMS };

/** Field-register list: hairline rows, one glyph, a switch. No boxes. */
export default function SystemToggle({ enabledSystems, onToggle }) {
    return (
        <div>
            {SYSTEMS.map((system, i) => {
                const isEnabled = enabledSystems.includes(system.id);
                const { Icon } = system;
                return (
                    <div key={system.id}
                        className="flex items-center justify-between gap-4 py-4 cursor-pointer transition-opacity duration-200"
                        style={{
                            borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
                            opacity: isEnabled ? 1 : 0.55,
                        }}
                        onClick={() => onToggle(system.id)}>
                        <div className="flex items-start gap-3 flex-1">
                            <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
                            <div>
                                <span className="font-semibold text-sm block" style={{ color: "var(--gh-ink)" }}>
                                    {system.label}
                                </span>
                                <p className="text-xs mt-0.5" style={{ color: "var(--gh-ink-muted)" }}>{system.description}</p>
                            </div>
                        </div>
                        <Switch checked={isEnabled} onCheckedChange={() => onToggle(system.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${system.label} ${isEnabled ? "on" : "off"}`} />
                    </div>
                );
            })}
        </div>
    );
}
