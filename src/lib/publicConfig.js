// Public, non-secret release defaults. Environment variables may override
// these for previews, but native builds must never fall back to
// capacitor://localhost for links or email callbacks.
export const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://vibe-check-flame-nu.vercel.app'
).replace(/\/$/, '');

export const AUTH_REDIRECT_URL = (
  import.meta.env.VITE_AUTH_REDIRECT_URL || PUBLIC_APP_URL
).replace(/\/$/, '');
