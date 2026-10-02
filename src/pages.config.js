// The pages and the layout that wraps them. App.jsx makes a route for each
// page, and mainPage is the one shown at /.
import { lazy } from 'react';
import Today from './pages/Today';
import __Layout from './Layout.jsx';

// Route-level code splitting: Today ships in the main bundle (it is the
// landing surface); every other page loads on navigation. App.jsx provides
// the Suspense fallback (a plain field wash, no spinner theater).
const Analytics = lazy(() => import('./pages/Analytics'));
const People = lazy(() => import('./pages/People'));
const Practice = lazy(() => import('./pages/Practice'));
const CosmicAddons = lazy(() => import('./pages/CosmicAddons'));


export const PAGES = {
    "Today": Today,
    "Analytics": Analytics,
    "People": People,
    "Practice": Practice,
    "CosmicAddons": CosmicAddons,
}

export const pagesConfig = {
    mainPage: "Today",
    Pages: PAGES,
    Layout: __Layout,
};