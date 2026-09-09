# B1 / Breath identity

Selected by the user on September 8, 2026. The brand mark is one green tobacco
leaf made from organic wave filaments, paired with the app's lowercase
Instrument Serif wordmark. It replaces the earlier botanical sun emblem.

`src/brand/breath.js` is the common vector source for `SanctuaryMark` and the
generated files in `public/`. Full-size marks use the complete wave drawing;
small navigation marks and favicons retain the silhouette with fewer, heavier
filaments. The dark treatment uses light sage with a restrained gold filament.

Run `npm run brand:generate` after changing the vector source. The generator
outlines the bundled Instrument Serif font for portable logo exports and
creates light/dark SVG and transparent PNG marks and wordmarks, opaque 1024px
app artwork, 192/512px install icons, a dedicated maskable icon, the 180px Apple
touch icon, SVG/16/32px favicons, and a 1200×630 social card.

The font is from the Google Fonts `ofl/instrumentserif` directory and its OFL
license is retained in `scripts/fonts/OFL.txt`. Asset-generation dependencies
are development-only; the app renders the small shared inline SVG.

The maskable icon has extra inset so all essential artwork lies within its
safe circle. Installed-app, favicon, touch, and social URLs carry `?v=b1` to
refresh caches after replacing the earlier identity. Existing home-screen
shortcuts may take the operating system's normal refresh cycle to update.
