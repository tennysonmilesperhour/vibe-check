import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
// Served with the app (SIL Open Font License), so no page asks another site for fonts.
import '@fontsource/instrument-serif/400.css'
import '@fontsource-variable/manrope/wght.css'
import '@/index.css'
import '@/lib/posthog.js'

// After a deploy, an open tab can ask for a script chunk that no longer
// exists. Reload once to pick up the new build; the guard stops a loop if the
// reload does not help (the page's error boundary then explains).
const CHUNK_RELOAD_KEY = 'vibe:chunk-reload-at'
window.addEventListener('vite:preloadError', (event) => {
  // Offline, a reload can't fetch it either: the page's error boundary says
  // the page needs a connection instead.
  if (!navigator.onLine) return
  try {
    const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last < 60_000) return
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

// Lets the app open without a connection (src/service-worker.js). Production
// builds only, and after the page has loaded, so it never slows the first visit.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
