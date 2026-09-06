import React from "react";

export default function LegalPage({ title, updated, children }) {
  return (
    <div className="field-wash min-h-screen">
      <main className="legal-page max-w-2xl mx-auto px-6 py-12">
        <a href="/" className="touch-link text-sm underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>Back to Vibe Check</a>
        <h1 className="text-4xl mt-8" style={{ color: "var(--gh-ink)" }}>{title}</h1>
        {updated && <p className="text-sm mt-2" style={{ color: "var(--gh-ink-muted)" }}>Last updated {updated}</p>}
        <div className="mt-8 space-y-5 text-sm leading-7" style={{ color: "var(--gh-ink-soft)" }}>{children}</div>
      </main>
    </div>
  );
}
