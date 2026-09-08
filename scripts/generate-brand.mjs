import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import opentype from 'opentype.js';
import { BRAND_PALETTES, BREATH_VIEWBOX, breathPaths } from '../src/brand/breath.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontBytes = readFileSync(resolve(root, 'scripts/fonts/InstrumentSerif-Regular.ttf'));
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
const forest = '#183c2e';
const cream = '#f5f0e5';

function svg(width, height, body, label = 'Vibe Check — Breath') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${body}</svg>\n`;
}

function mark(tone, detail, x, y, size) {
  const colors = BRAND_PALETTES[tone];
  const paths = breathPaths(detail).map(({ d, ink, width }) =>
    `<path d="${d}" stroke="${colors[ink]}" stroke-width="${width}"/>`).join('');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${BREATH_VIEWBOX}" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function wordGeometry(x, baseline, size) {
  // This fixed Latin wordmark has no ligatures. Lay out its actual glyphs and
  // kerning directly; the font's unrelated contextual-substitution tables are
  // not supported by opentype.js's general-purpose text shaper.
  const glyphs = Array.from('vibe check', (letter) => font.charToGlyph(letter));
  const scale = size / font.unitsPerEm;
  let cursor = x;
  let d = '';
  glyphs.forEach((glyph, index) => {
    if (index) cursor += font.getKerningValue(glyphs[index - 1], glyph) * scale;
    d += glyph.getPath(cursor, baseline, size).toPathData(3);
    cursor += glyph.advanceWidth * scale;
  });
  return { d, width: cursor - x };
}

function wordmark(tone, x, baseline, size) {
  // Outline the actual app typeface so exported logos need no installed font.
  return `<path d="${wordGeometry(x, baseline, size).d}" fill="${BRAND_PALETTES[tone].text}"/>`;
}

function icon(detail = 'full', maskable = false) {
  const size = maskable ? 300 : 408;
  const inset = (512 - size) / 2;
  return svg(512, 512, `<rect width="512" height="512" fill="${forest}"/>${mark('dark', detail, inset, inset, size)}`);
}

function saveSvg(name, source) {
  const path = resolve(root, 'public', name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
}

function savePng(name, source, width) {
  const path = resolve(root, 'public', name);
  mkdirSync(dirname(path), { recursive: true });
  const image = new Resvg(source, { fitTo: { mode: 'width', value: width } }).render();
  writeFileSync(path, image.asPng());
}

for (const tone of ['light', 'dark']) {
  const suffix = tone === 'light' ? '' : '-inverse';
  const source = svg(512, 512, mark(tone, 'full', 0, 0, 512));
  saveSvg(`brand/breath-mark${suffix}.svg`, source);
  savePng(`brand/breath-mark${suffix}.png`, source, 1024);
  const logo = svg(920, 240, mark(tone, 'full', 18, 18, 204) + wordmark(tone, 256, 161, 132), 'vibe check');
  saveSvg(`brand/vibe-check-logo${suffix}.svg`, logo);
  savePng(`brand/vibe-check-logo${suffix}.png`, logo, 1840);
}

saveSvg('icon.svg', icon('compact'));
saveSvg('favicon.svg', icon('tiny'));
savePng('favicon-16.png', icon('tiny'), 16);
savePng('favicon-32.png', icon('tiny'), 32);
savePng('apple-touch-icon.png', icon('compact'), 180);
savePng('icon-192.png', icon('compact'), 192);
savePng('icon-512.png', icon('full'), 512);
savePng('icon-maskable-512.png', icon('compact', true), 512);
savePng('brand/app-icon-1024.png', icon('full'), 1024);

const titleSize = 138;
const titleWidth = wordGeometry(0, 0, titleSize).width;
const social = svg(1200, 630,
  `<rect width="1200" height="630" fill="${forest}"/>` +
  `<rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="#b99a55" stroke-opacity=".45"/>` +
  mark('dark', 'full', 80, 96, 428) + wordmark('dark', 550, 339, titleSize) +
  `<path d="M550 386H${Math.round(550 + titleWidth)}" stroke="#b99a55" stroke-width="1.5"/>`);
saveSvg('brand/social-card.svg', social);
savePng('og.png', social, 1200);

// A single shareable review sheet with the actual generated assets at scale.
const review = svg(1200, 960,
  `<rect width="1200" height="960" fill="${cream}"/>` +
  mark('light', 'full', 100, 48, 420) + wordmark('light', 570, 290, 120) +
  `<rect y="520" width="1200" height="440" fill="${forest}"/>` +
  mark('dark', 'full', 70, 568, 320) + wordmark('dark', 440, 728, 112) +
  mark('dark', 'compact', 450, 804, 64) + mark('dark', 'compact', 564, 819, 48) +
  mark('dark', 'compact', 662, 834, 32) + mark('dark', 'tiny', 744, 841, 24));
saveSvg('brand/brand-preview.svg', review);
savePng('brand/brand-preview.png', review, 1200);

console.log('Generated B1 vector marks, outlined wordmarks, install icons, favicons, and social artwork.');
