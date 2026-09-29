import { useState } from 'react';
import { detectSupportRegion, SUPPORT_REGIONS } from '@/lib/support-resources';

const REGION_KEY = 'vibe:support-region';

function initialRegion() {
  try {
    const saved = window.localStorage.getItem(REGION_KEY);
    if (saved === 'other' || SUPPORT_REGIONS[saved]) return saved;
  } catch {
    // storage blocked; fall through to detection
  }
  let timeZone = '';
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* very old browser */ }
  return detectSupportRegion({ timeZone, languages: navigator.languages || [navigator.language] }) || 'other';
}

/** The region to show support services for; the person can change it. */
export default function useSupportRegion() {
  const [region, setRegion] = useState(initialRegion);
  const choose = (next) => {
    setRegion(next);
    try { window.localStorage.setItem(REGION_KEY, next); } catch { /* storage blocked */ }
  };
  return [region, choose];
}
