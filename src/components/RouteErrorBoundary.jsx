import React from "react";

// Old script chunks disappear after a deploy; the browser reports it in one
// of these ways depending on the engine.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;
const isChunkError = (error) => STALE_CHUNK.test(String(error?.message || error));

/**
 * Whether the app's own server answers. navigator.onLine stays true on a
 * network without internet, and the service worker doesn't answer for
 * /version.json, so this asks the server itself.
 */
export async function serverAnswers() {
  if (navigator.onLine === false) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Per-page safety net: a page error keeps the navigation and the rest of the
 * app usable. Keyed by route in App.jsx, so moving to another page resets it.
 * A page's files that fail to load mean an update, or no connection: which
 * one is settled by asking the server, once, when it happens.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, connection: null };
  }

  static getDerivedStateFromError(error) {
    return { error, connection: isChunkError(error) ? "checking" : null };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidCatch(error, info) {
    if (!isChunkError(error)) {
      console.error("Page error:", error, info?.componentStack);
      return;
    }
    serverAnswers().then((answers) => {
      if (this.mounted && this.state.error === error) this.setState({ connection: answers ? "online" : "offline" });
    });
  }

  render() {
    const { error, connection } = this.state;
    if (!error) return this.props.children;
    if (connection === "checking") {
      return <div className="living-page" role="status"><p className="living-muted">Opening this page…</p></div>;
    }
    if (connection === "offline") {
      return (
        <div className="living-page" role="alert">
          <p className="sanctuary-eyebrow">YOU ARE OFFLINE</p>
          <h1>This page needs a connection to open.</h1>
          <p className="living-muted mt-3">Once it has opened online, it opens without one too, until an update changes it. Your saved record is safe.</p>
          <p className="mt-3">If you are in immediate danger, call your local emergency number.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a className="ink-button" href="/support-now">Support now</a>
            <button type="button" className="living-secondary" onClick={() => window.location.reload()}>Reload the app</button>
          </div>
        </div>
      );
    }
    const stale = connection === "online";
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
            <button type="button" className="ink-button" onClick={() => this.setState({ error: null, connection: null })}>
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
