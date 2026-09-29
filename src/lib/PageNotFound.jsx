import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

/** Field-register 404: quiet, honest, one way home. */
export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="field-wash min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gh-ink-muted)" }}>404</p>
                <h1 className="text-4xl mt-3" style={{ color: "var(--gh-ink)" }}>
                    This page isn't on the map
                </h1>
                <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-soft)" }}>
                    {pageName ? <>Nothing lives at "{pageName}".</> : "Nothing lives here."} Your
                    record is right where you left it.
                </p>
                <Link to={createPageUrl("Today")} className="ink-button inline-block mt-8 text-sm">
                    Return to Today
                </Link>
            </div>
        </div>
    );
}
