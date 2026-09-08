import React from "react";

/** Original botanical sun emblem, shared by the welcome page and app shell. */
export default function SanctuaryMark({ className = "", size = 48 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="32" cy="32" r="27" opacity="0.45" />
      <path d="M32 49V24M32 39C20 39 17 31 18 24C27 25 32 30 32 39ZM32 34C43 34 47 25 46 19C38 20 32 25 32 34Z" />
      <circle cx="32" cy="16" r="3.5" />
      <path d="M32 7V5M22 11L20 9M42 11L44 9M23 49H41M27 53H37" strokeLinecap="round" />
    </svg>
  );
}
