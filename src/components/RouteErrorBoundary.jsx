import React from "react";

// Old script chunks disappear after a deploy; the browser reports it in one
// of these ways depending on the engine.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

// Without a connection, a page that hasn't been opened on this device yet
// can't load; that isn't an update.
const offlineChunk = (error) => STALE_CHUNK.test(String(error?.message || error)) && navigator.onLine === false;

/**
 * Per-page safety net: a page error keeps the navigation and the rest of the
 * app usable. Keyed by route in App.jsx, so moving to another page resets it.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A page that can't load offline is shown as such, not logged as a fault.
    if (offlineChunk(error)) return;
    console.error("Page error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = STALE_CHUNK.test(String(error?.message || error));
    if (offlineChunk(error)) {
      return (
        <div className="living-page" role="alert">
          <p className="sanctuary-eyebrow">YOU ARE OFFLINE</p>
          <h1>This page needs a connection the first time.</h1>
          <p className="living-muted mt-3">After it has opened once online, it opens without a connection too. Your saved record is safe.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a className="ink-button" href="/support-now">Support now</a>
            <button type="button" className="living-secondary" onClick={() => window.location.reload()}>Reload the app</button>
          </div>
        </div>
      );
    }
    return (
      <div className="living-page" role="alert">
        <p className="sanctuary-eyebrow">{stale ? "A NEWER VERSION IS READY" : "THIS PAGE STUMBLED"}</p>
        <h1>{stale ? "Vibe Check was updated." : "Something went wrong on this page."}</h1>
        <p className="living-muted mt-3">
          {stale
            ? "Reload to open the latest version. Your saved record is safe."
            : "Your saved record is safe. Try this page again, or reload the app."}
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          {!stale && (
            <button type="button" className="ink-button" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          )}
          <button type="button" className={stale ? "ink-button" : "living-secondary"} onClick={() => window.location.reload()}>
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
