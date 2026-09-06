// Route registry. Pages are loaded on demand so the check-in screen does not
// download analytics, tarot, and cosmic-report code before it is needed.
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const Today = lazy(() => import('./pages/Today'));
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
