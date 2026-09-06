import React from "react";

function chapterFor(pathname = "") {
  const path = pathname.toLowerCase();
  if (path.includes("analytics")) return "atlas";
  if (path.includes("people")) return "orbit";
  if (path.includes("practice") || path.includes("tarot")) return "dusk";
  if (path.includes("cosmic")) return "cosmos";
  return "today";
}

/** A quiet, persistent world layer that locates every tool in the same almanac. */
export default function AlmanacAtmosphere({ pathname }) {
  const chapter = chapterFor(pathname);
  return (
    <div className="almanac-atmosphere" data-chapter={chapter} aria-hidden="true">
      <span className="almanac-atmosphere__disc" />
      <span className="almanac-atmosphere__horizon" />
      <span className="almanac-atmosphere__trace almanac-atmosphere__trace--one" />
      <span className="almanac-atmosphere__trace almanac-atmosphere__trace--two" />
    </div>
  );
}

