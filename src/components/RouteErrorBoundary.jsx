import React from "react";

// Old script chunks disappear after a deploy; the browser reports it in one
// of these ways depending on the engine.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

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
    console.error("Page error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = STALE_CHUNK.test(String(error?.message || error));
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
