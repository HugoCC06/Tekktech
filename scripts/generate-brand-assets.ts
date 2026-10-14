/**
 * Generates the TekkTech brand assets from the Inter typeface:
 *
 *   src/assets/brand/wordmark.json   path data used by the <Logo> component
 *   public/brand/tekktech-wordmark.svg         (ink on transparent)
 *   public/brand/tekktech-wordmark-inverse.svg (white on transparent)
 *   public/favicon.svg, public/favicon-32.png, public/apple-touch-icon.png,
 *   public/icon-192.png, public/icon-512.png
 *   public/og-default.png             1200×630 default social-sharing image
 *
 * Text is converted to outlines so the logo renders identically everywhere,
 * without depending on a web font. Run with: npm run brand
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype, { type Font } from 'opentype.js';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = resolve(root, 'node_modules/@fontsource/inter/files');

const INK = '#0E1014';
const ACCENT = '#2443D6';
const PAPER = '#FAFAF7';

async function loadFont(weight: number) {
  const buffer = await readFile(resolve(fontDir, `inter-latin-${weight}-normal.woff`));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

const bold = await loadFont(700);
const regular = await loadFont(400);

const SIZE = 100;
const TRACKING = -0.035 * SIZE;

/**
 * Lays out a string glyph-by-glyph with kerning and tracking and returns SVG
 * path data. Glyphs are mapped per character (no OpenType shaping), which is
 * all a Latin wordmark needs.
 */
function layout(font: Font, text: string, startX: number, size = SIZE, tracking = TRACKING) {
  let x = startX;
  const parts: string[] = [];
  const glyphs = [...text].map((char) => font.charToGlyph(char));
  const scale = size / font.unitsPerEm;
  glyphs.forEach((glyph, index) => {
    parts.push(glyph.getPath(x, 0, size).toPathData({ decimalPlaces: 2, flipY: false }));
    const next = glyphs[index + 1];
    const kerning = next ? font.getKerningValue(glyph, next) * scale : 0;
    x += (glyph.advanceWidth ?? 0) * scale + kerning + tracking;
  });
  return { d: parts.join(''), end: x - tracking };
}

const tekk = layout(bold, 'Tekk', 0);
const tech = layout(regular, 'Tech', tekk.end + 1.5);

// Vertical metrics: use cap height / descender-free bounds of these letters.
const ascent = 0.74 * SIZE; // Inter cap height ≈ 0.727em; k ascender ≈ 0.74em
const top = -ascent;
const width = Math.ceil(tech.end);
const height = Math.ceil(ascent + 1);
const viewBox = `0 ${top.toFixed(2)} ${width} ${height}`;

const wordmark = { viewBox, width, height, tekk: tekk.d, tech: tech.d };

await mkdir(resolve(root, 'src/assets/brand'), { recursive: true });
await writeFile(resolve(root, 'src/assets/brand/wordmark.json'), JSON.stringify(wordmark, null, 2) + '\n');

function wordmarkSvg(tekkFill: string, techFill: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="TekkTech"><title>TekkTech</title><path fill="${tekkFill}" d="${tekk.d}"/><path fill="${techFill}" d="${tech.d}"/></svg>\n`;
}

await mkdir(resolve(root, 'public/brand'), { recursive: true });
await writeFile(resolve(root, 'public/brand/tekktech-wordmark.svg'), wordmarkSvg(INK, ACCENT));
await writeFile(resolve(root, 'public/brand/tekktech-wordmark-inverse.svg'), wordmarkSvg('#FFFFFF', '#AFC0FF'));

// Favicon: bold "T" on an ink tile with a small accent bar — the bar echoes
// the two-weight split of the wordmark.
const tGlyph = bold.charToGlyph('T');
const tPath = tGlyph.getPath(0, 0, 44);
const tBox = tPath.getBoundingBox();
const tX = 32 - (tBox.x1 + tBox.x2) / 2;
const tY = 30 - (tBox.y1 + tBox.y2) / 2;
const tData = tGlyph.getPath(tX, tY, 44).toPathData({ decimalPlaces: 2, flipY: false });
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${INK}"/><path fill="#FFFFFF" d="${tData}"/><rect x="20" y="49" width="24" height="4" rx="2" fill="#5C78FF"/></svg>\n`;
await writeFile(resolve(root, 'public/favicon.svg'), faviconSvg);

const faviconBuffer = Buffer.from(faviconSvg);
for (const [file, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  await sharp(faviconBuffer, { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .png()
    .toFile(resolve(root, 'public', file));
}

// Default social image: paper background, wordmark, tagline, accent rule.
const ogScale = 1.6;
const taglineFont = regular;
const tagline = layout(taglineFont, 'Independent technology reviews, comparisons and explainers', 0, 34, -0.3).d;
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <g fill="none" stroke="#E3E4DE" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="630"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100 + 15}" x2="1200" y2="${i * 100 + 15}"/>`).join('')}
  </g>
  <rect x="100" y="150" width="64" height="8" rx="4" fill="${ACCENT}"/>
  <g transform="translate(96 ${330}) scale(${ogScale})">
    <path fill="${INK}" d="${tekk.d}"/><path fill="${ACCENT}" d="${tech.d}"/>
  </g>
  <g transform="translate(98 420)"><path fill="#444A55" d="${tagline}"/></g>
</svg>`;
await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(resolve(root, 'public/og-default.png'));

console.log('Brand assets generated.');
