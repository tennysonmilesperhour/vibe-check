import React from "react";

/**
 * Last line of defense: a render crash shows a human screen with the error
 * message instead of an unmounted blank page.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crash:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="field-wash min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-4xl" style={{ color: "var(--gh-ink)" }}>Something cracked</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-soft)" }}>
            The app hit an error it could not recover from. Reloading usually clears it.
          </p>
          <p className="mt-3 text-xs font-mono px-3 py-2 inline-block" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", color: "var(--gh-ink-muted)" }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <div className="mt-6">
            <button type="button" className="ink-button text-sm" onClick={() => window.location.reload()}>
              Reload the app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
