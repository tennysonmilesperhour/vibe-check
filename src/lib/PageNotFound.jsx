import { Link, useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = decodeURIComponent(location.pathname.substring(1));

  return (
    <div className="field-wash min-h-screen flex items-center justify-center p-6">
      <main className="max-w-md w-full text-center">
        <p className="text-sm font-bold" style={{ color: "var(--gh-accent)" }}>404</p>
        <h1 className="text-4xl mt-3" style={{ color: "var(--gh-ink)" }}>This page is not here</h1>
        <p className="mt-3 text-sm leading-relaxed break-words" style={{ color: "var(--gh-ink-soft)" }}>
          We could not find “{pageName || "this page"}”. Your saved information is unchanged.
        </p>
        <div className="mt-6">
          <Link to="/" className="ink-button inline-flex items-center">Return to Today</Link>
        </div>
      </main>
    </div>
  );
}
