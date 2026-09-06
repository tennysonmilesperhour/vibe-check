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
          <h1 className="text-4xl" style={{ color: "var(--gh-ink)" }}>Vibe Check needs a reload</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-soft)" }}>
            Your saved information is unchanged. Reload the app to return to your day.
          </p>
          <div className="mt-6">
            <button type="button" className="ink-button text-sm" onClick={() => window.location.reload()}>
              Reload the app
            </button>
          </div>
          <a href="/support" className="touch-link mt-3 text-sm underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>Contact support</a>
        </div>
      </div>
    );
  }
}
