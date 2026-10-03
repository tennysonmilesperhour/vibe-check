import React from "react";
import { currentBuild } from "@/lib/app-version";

// Old script chunks disappear after a deploy; the browser reports it in one
// of these ways depending on the engine.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;
const isChunkError = (error) => STALE_CHUNK.test(String(error?.message || error));

/**
 * Whether the app's own server answers, and with which build. navigator.onLine
 * stays true on a network without internet, and the service worker doesn't
 * answer for /version.json, so this asks the server itself.
 * @returns {Promise<{ answers: boolean, build: string | null }>}
 */
export async function askServer() {
  if (navigator.onLine === false) return { answers: false, build: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    const build = await response.json().then((manifest) => manifest?.build, () => null);
    return { answers: true, build: typeof build === "string" ? build : null };
  } catch {
    return { answers: false, build: null };
  } finally {
    clearTimeout(timer);
  }
}

// Opens the latest version: the service worker waits for the network for an
// address that asks for it, rather than opening the page it kept.
function openLatest(build) {
  const url = new URL(window.location.href);
  url.searchParams.set("_vibe_version", build);
  window.location.assign(url.href);
}

/**
 * Per-page safety net: a page error keeps the navigation and the rest of the
 * app usable. Keyed by route in App.jsx, so moving to another page resets it.
 * A page whose files fail to load is settled by asking the server, once:
 * no answer means no connection, a different build means an update, and
 * otherwise the load just failed. (React keeps a failed page load until the
 * app reloads, so the same failure can come back after the connection does.)
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, connection: null, build: null };
  }

  static getDerivedStateFromError(error) {
    return { error, connection: isChunkError(error) ? "checking" : null, build: null };
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
    askServer().then(({ answers, build }) => {
      if (!this.mounted || this.state.error !== error) return;
      const current = currentBuild();
      const connection = !answers ? "offline" : build && current && build !== current ? "updated" : "failed";
      this.setState({ connection, build });
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
    if (connection === "updated") {
      return (
        <div className="living-page" role="alert">
          <p className="sanctuary-eyebrow">A NEWER VERSION IS READY</p>
          <h1>Vibe Check was updated.</h1>
          <p className="living-muted mt-3">Open the latest version to see this page. Your saved record is safe.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button type="button" className="ink-button" onClick={() => openLatest(this.state.build)}>Open the latest version</button>
          </div>
        </div>
      );
    }
    if (connection === "failed") {
      return (
        <div className="living-page" role="alert">
          <p className="sanctuary-eyebrow">THIS PAGE DIDN'T LOAD</p>
          <h1>This page didn't load.</h1>
          <p className="living-muted mt-3">Reload the app to try again. Your saved record is safe.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button type="button" className="ink-button" onClick={() => window.location.reload()}>Reload the app</button>
          </div>
        </div>
      );
    }
    return (
      <div className="living-page" role="alert">
        <p className="sanctuary-eyebrow">THIS PAGE STUMBLED</p>
        <h1>Something went wrong on this page.</h1>
        <p className="living-muted mt-3">Your saved record is safe. Try this page again, or reload the app.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button type="button" className="ink-button" onClick={() => this.setState({ error: null, connection: null, build: null })}>
            Try again
          </button>
          <button type="button" className="living-secondary" onClick={() => window.location.reload()}>
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
