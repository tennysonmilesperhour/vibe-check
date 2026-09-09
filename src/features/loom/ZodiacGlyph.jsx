import React from "react";

// Original paths keep the twelve traditional signs consistent across devices
// and image exports, without relying on symbol fonts or emoji presentation.
const SIGNS = {
  Aries: <path d="M12 21V8C12 1 3 1 3 7C3 11 7 12 9 9M12 8C12 1 21 1 21 7C21 11 17 12 15 9" />,
  Taurus: <><circle cx="12" cy="15" r="6" /><path d="M6 3C6 11 18 11 18 3" /></>,
  Gemini: <path d="M6 3Q12 5 18 3M6 21Q12 19 18 21M8 4V20M16 4V20" />,
  Cancer: <><circle cx="6" cy="9" r="3" /><circle cx="18" cy="15" r="3" /><path d="M6 6C12 2 20 3 21 7M18 18C12 22 4 21 3 17" /></>,
  Leo: <><circle cx="6" cy="14" r="3" /><path d="M8 12C3 5 10 1 14 4C21 10 9 15 14 19C16 22 21 20 21 17" /></>,
  Virgo: <path d="M3 5V19M3 9C3 4 8 4 8 9V19M8 9C8 4 13 4 13 9V16C13 22 22 19 22 11C22 6 18 6 17 11C16 17 17 19 21 21" />,
  Libra: <path d="M3 18H21M3 14H7A6 6 0 1 1 17 14H21" />,
  Scorpio: <path d="M3 5V18M3 9C3 4 8 4 8 9V18M8 9C8 4 13 4 13 9V15C13 19 17 19 21 17M18 14L21 17L18 20" />,
  Sagittarius: <path d="M5 19L19 5M10 5H19V14M5 9L15 19" />,
  Capricorn: <path d="M3 6L7 17L11 6C12 3 15 4 15 8V15C15 23 23 20 21 15C19 11 13 14 12 20" />,
  Aquarius: <path d="M3 9L6 6L9 9L12 6L15 9L18 6L21 9M3 17L6 14L9 17L12 14L15 17L18 14L21 17" />,
  Pisces: <path d="M5 3C11 8 11 16 5 21M19 3C13 8 13 16 19 21M3 12H21" />,
};

export default function ZodiacGlyph({ sign, size = 18, color = "currentColor" }) {
  if (!SIGNS[sign]) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" data-zodiac-sign={sign}>
      {SIGNS[sign]}
    </svg>
  );
}
