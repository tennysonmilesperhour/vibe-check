# Version update prompt

The public production origin, `https://vibe-check-flame-nu.vercel.app`, is the authority for the latest live version. Every build stamps the same ID into its bundle and `/version.json`. Checks fetch that public manifest without credentials or caching, including from protected Vercel previews and aliases.

Deployed production and preview builds check on opening, focus, visibility, reconnection, and every minute while visible and online. Local builds stay quiet. Build differences include rollbacks; the canonical endpoint remains authoritative even if a promoted deployment retains preview metadata.

**Open latest version** navigates to production and keeps the current route, tab, date, range, person, review, and ordinary section anchor. Authentication tokens and deployment-access parameters are excluded. A version query avoids reusing a cached document. The app never reloads automatically: save edits first or dismiss the notice for 15 minutes. A different release can appear during that dismissal period.

Failed, offline, invalid, and timed-out checks leave the app usable and retry later. The toast has keyboard controls, 44-pixel touch targets, a polite live region, and reduced-motion support. Its invisible state cannot intercept navigation clicks.

Immutable deployments created before this change do not gain new JavaScript retroactively. Open or reload a branch alias containing this change once to begin receiving the improved prompts. Opening production from another origin may require signing in there; credentials are never transferred in a URL.

Regression tests cover versions, promotion, safe navigation and state preservation. Browser checks exercise production/preview detection, dismissal, new releases, offline recovery, keyboard navigation, and 320/390/768/1440-pixel layouts.

References: [Vercel environment variables](https://vercel.com/docs/environment-variables/system-environment-variables), [cache control](https://vercel.com/docs/caching/cache-control-headers).
