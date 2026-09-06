import React from "react";

/** AI or computed prose presented as a transparent reading, not a chat response. */
export default function InsightReading({ title, text, evidence = [], note, tone = "field" }) {
  if (!text) return null;
  const paragraphs = String(text).split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);

  return (
    <article className="insight-reading" data-tone={tone} aria-label={title}>
      <div className="insight-reading__mark" aria-hidden="true">✦</div>
      <div className="insight-reading__body">
        <h3>{title}</h3>
        <div className="insight-reading__prose">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        {(evidence.length > 0 || note) && (
          <details className="insight-reading__source">
            <summary>Why this reading appears</summary>
            {evidence.length > 0 && (
              <ul aria-label="Information used">
                {evidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {note && <p>{note}</p>}
          </details>
        )}
      </div>
    </article>
  );
}

