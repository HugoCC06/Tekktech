/**
 * Generates abstract placeholder illustrations for the demonstration
 * articles and the per-category fallback images.
 *
 *   src/assets/images/articles/<name>.webp   (1600×900)
 *   src/assets/images/fallback/<category>.webp
 *
 * These are deliberately abstract, geometric compositions in the TekkTech
 * palette. They are placeholders: replace them with finished editorial
 * illustrations through the CMS (Featured image field) before launch.
 *
 * Run with: npm run illustrations
 */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1600;
const H = 900;

type Motif = 'devices' | 'gaming' | 'blocks' | 'workspace' | 'display' | 'signal' | 'shield' | 'scale' | 'keyboard';

interface Palette {
  bg: string;
  grid: string;
  primary: string;
  secondary: string;
  ink: string;
  light: string;
  highlight: string;
}

const palettes: Record<string, Palette> = {
  'consumer-tech': {
    bg: '#E9EDFB',
    grid: '#D7DDF5',
    primary: '#2443D6',
    secondary: '#8EA2F2',
    ink: '#0E1014',
    light: '#FFFFFF',
    highlight: '#F2B66D',
  },
  gaming: {
    bg: '#12141B',
    grid: '#1E2230',
    primary: '#5C78FF',
    secondary: '#2C3654',
    ink: '#E8EBF7',
    light: '#F5F6FA',
    highlight: '#FF7A59',
  },
  crypto: {
    bg: '#F1ECE1',
    grid: '#E2DACB',
    primary: '#0E1014',
    secondary: '#C9B999',
    ink: '#0E1014',
    light: '#FFFDF8',
    highlight: '#2443D6',
  },
  productivity: {
    bg: '#E6EFE9',
    grid: '#D3E2D8',
    primary: '#1E6B42',
    secondary: '#9CC3AA',
    ink: '#0E1014',
    light: '#FFFFFF',
    highlight: '#2443D6',
  },
};

/** Small deterministic PRNG so each illustration is stable between runs. */
function rng(seed: string) {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grid(p: Palette, step = 80) {
  const lines: string[] = [];
  for (let x = step; x < W; x += step) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`);
  for (let y = step; y < H; y += step) lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`);
  return `<g stroke="${p.grid}" stroke-width="1.5">${lines.join('')}</g>`;
}

const shadow = `<filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0E1014" flood-opacity="0.16"/></filter>`;

function devices(p: Palette, r: () => number) {
  const shift = Math.round(r() * 120) - 60;
  return `
  <g filter="url(#shadow)">
    <rect x="${380 + shift}" y="250" width="760" height="470" rx="28" fill="${p.ink}"/>
    <rect x="${404 + shift}" y="274" width="712" height="422" rx="10" fill="${p.primary}"/>
    <rect x="${300 + shift}" y="720" width="920" height="34" rx="17" fill="${p.secondary}"/>
  </g>
  <circle cx="${720 + shift}" cy="470" r="${120 + r() * 40}" fill="${p.secondary}" opacity="0.55"/>
  <rect x="${520 + shift}" y="340" width="${200 + r() * 120}" height="22" rx="11" fill="${p.light}" opacity="0.9"/>
  <rect x="${520 + shift}" y="380" width="${140 + r() * 80}" height="22" rx="11" fill="${p.light}" opacity="0.55"/>
  <g filter="url(#shadow)">
    <rect x="${1130 + shift}" y="330" width="230" height="440" rx="36" fill="${p.light}"/>
    <rect x="${1148 + shift}" y="352" width="194" height="396" rx="24" fill="${p.ink}"/>
    <circle cx="${1245 + shift}" cy="520" r="54" fill="${p.highlight}"/>
  </g>
  <circle cx="${250 + shift}" cy="${300 + r() * 80}" r="46" fill="${p.light}" filter="url(#shadow)"/>
  <circle cx="${250 + shift}" cy="${300 + r() * 80}" r="18" fill="${p.primary}"/>`;
}

function gaming(p: Palette, r: () => number) {
  const horizon = 520;
  const floor: string[] = [];
  for (let i = -12; i <= 12; i++) floor.push(`<line x1="${800 + i * 30}" y1="${horizon}" x2="${800 + i * 220}" y2="${H}"/>`);
  for (let j = 0; j < 7; j++) {
    const y = horizon + Math.pow(j / 6, 1.8) * (H - horizon);
    floor.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`);
  }
  const offset = Math.round(r() * 100) - 50;
  return `
  <g stroke="${p.primary}" stroke-width="2" opacity="0.45">${floor.join('')}</g>
  <circle cx="800" cy="${horizon}" r="${190 + r() * 30}" fill="${p.highlight}" opacity="0.9"/>
  <rect x="0" y="${horizon}" width="${W}" height="6" fill="${p.bg}"/>
  <g filter="url(#shadow)" transform="translate(${offset} 0)">
    <path d="M520 360 q-110 0 -150 140 l-40 150 q-14 70 50 80 q40 4 70 -40 l60 -80 h580 l60 80 q30 44 70 40 q64 -10 50 -80 l-40 -150 q-40 -140 -150 -140 z" fill="${p.secondary}"/>
    <rect x="455" y="470" width="110" height="34" rx="8" fill="${p.light}"/>
    <rect x="493" y="432" width="34" height="110" rx="8" fill="${p.light}"/>
    <circle cx="1080" cy="445" r="22" fill="${p.primary}"/>
    <circle cx="1135" cy="495" r="22" fill="${p.highlight}"/>
    <circle cx="1025" cy="495" r="22" fill="${p.light}"/>
    <circle cx="1080" cy="545" r="22" fill="${p.primary}" opacity="0.7"/>
    <circle cx="690" cy="575" r="40" fill="${p.bg}"/>
    <circle cx="910" cy="575" r="40" fill="${p.bg}"/>
  </g>`;
}

function blocks(p: Palette, r: () => number) {
  const count = 5;
  const parts: string[] = [];
  const baseY = 450;
  for (let i = 0; i < count; i++) {
    const x = 180 + i * 270;
    const y = baseY + Math.sin(i * 1.3 + r() * 2) * 70;
    const size = 150;
    if (i < count - 1) {
      const nx = 180 + (i + 1) * 270;
      parts.push(`<line x1="${x + size}" y1="${y}" x2="${nx}" y2="${y}" stroke="${p.primary}" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/>`);
    }
    const fill = i === 2 ? p.highlight : i % 2 ? p.light : p.primary;
    const top = i === 2 ? '#5C78FF' : i % 2 ? p.secondary : '#3A3F4B';
    parts.push(`
      <g filter="url(#shadow)">
        <path d="M${x} ${y - size / 2} l${size / 2} -40 h${size} l-${size / 2} 40 z" fill="${top}" transform="translate(-${size / 4} 0)"/>
        <rect x="${x - size / 4}" y="${y - size / 2}" width="${size}" height="${size}" fill="${fill}"/>
      </g>`);
    parts.push(`<rect x="${x - size / 4 + 28}" y="${y - 22}" width="${size - 56}" height="12" rx="6" fill="${i % 2 ? p.secondary : p.light}" opacity="0.8"/>`);
    parts.push(`<rect x="${x - size / 4 + 28}" y="${y + 4}" width="${(size - 56) * 0.6}" height="12" rx="6" fill="${i % 2 ? p.secondary : p.light}" opacity="0.5"/>`);
  }
  return parts.join('');
}

function workspace(p: Palette, r: () => number) {
  const cards: string[] = [];
  for (let i = 0; i < 3; i++) {
    const x = 330 + i * 330 + (r() * 40 - 20);
    const y = 230 + (i % 2) * 60;
    const rows = 3 + Math.floor(r() * 2);
    let content = '';
    for (let j = 0; j < rows; j++) {
      const done = r() > 0.45;
      content += `<rect x="${x + 36}" y="${y + 110 + j * 74}" width="34" height="34" rx="9" fill="${done ? p.primary : p.light}" stroke="${p.secondary}" stroke-width="3"/>`;
      if (done) content += `<path d="M${x + 44} ${y + 127 + j * 74} l8 8 l14 -16" fill="none" stroke="${p.light}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      content += `<rect x="${x + 88}" y="${y + 120 + j * 74}" width="${110 + r() * 60}" height="14" rx="7" fill="${p.secondary}"/>`;
    }
    cards.push(`
      <g filter="url(#shadow)">
        <rect x="${x}" y="${y}" width="290" height="420" rx="22" fill="${p.light}"/>
      </g>
      <rect x="${x + 36}" y="${y + 44}" width="${120 + r() * 50}" height="20" rx="10" fill="${i === 1 ? p.highlight : p.ink}"/>
      ${content}`);
  }
  return `<circle cx="1300" cy="200" r="120" fill="${p.secondary}" opacity="0.6"/>${cards.join('')}`;
}

function display(p: Palette, r: () => number) {
  const bars: string[] = [];
  for (let i = 0; i < 14; i++) {
    const h = 60 + r() * 220;
    bars.push(`<rect x="${470 + i * 48}" y="${600 - h}" width="30" height="${h}" rx="6" fill="${i % 4 === 0 ? p.highlight : p.primary}" opacity="${0.55 + (i % 3) * 0.2}"/>`);
  }
  return `
  <g filter="url(#shadow)">
    <rect x="380" y="170" width="840" height="500" rx="24" fill="${p.ink}"/>
    <rect x="402" y="192" width="796" height="456" rx="10" fill="${p.bg === '#12141B' ? '#1B1F2C' : p.light}"/>
    <rect x="740" y="670" width="120" height="70" fill="${p.ink}"/>
    <rect x="620" y="738" width="360" height="22" rx="11" fill="${p.ink}"/>
  </g>
  ${bars.join('')}
  <path d="M440 520 C 600 380, 760 600, 920 420 S 1120 340, 1160 300" fill="none" stroke="${p.ink === '#E8EBF7' ? p.light : p.ink}" stroke-width="5" stroke-linecap="round"/>`;
}

function signal(p: Palette, r: () => number) {
  const rings: string[] = [];
  const cx = 800 + (r() * 100 - 50);
  for (let i = 1; i <= 6; i++) rings.push(`<circle cx="${cx}" cy="470" r="${i * 85}" fill="none" stroke="${p.primary}" stroke-width="${i % 2 ? 3 : 1.5}" opacity="${1 - i * 0.13}"/>`);
  return `${rings.join('')}
  <g filter="url(#shadow)">
    <rect x="${cx - 150}" y="320" width="300" height="300" rx="44" fill="${p.light}"/>
  </g>
  <circle cx="${cx}" cy="430" r="46" fill="none" stroke="${p.ink}" stroke-width="12"/>
  <rect x="${cx - 8}" y="470" width="16" height="90" rx="8" fill="${p.ink}"/>
  <rect x="${cx + 8}" y="520" width="34" height="14" rx="7" fill="${p.ink}"/>
  <circle cx="${cx + 210}" cy="300" r="26" fill="${p.highlight}"/>
  <circle cx="${cx - 240}" cy="640" r="18" fill="${p.primary}"/>`;
}

function shield(p: Palette, r: () => number) {
  const dots: string[] = [];
  for (let i = 0; i < 40; i++) {
    dots.push(`<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(2 + r() * 5).toFixed(1)}" fill="${p.secondary}" opacity="0.7"/>`);
  }
  return `${dots.join('')}
  <g filter="url(#shadow)">
    <path d="M800 170 L1060 260 V470 C1060 630 940 720 800 770 C660 720 540 630 540 470 V260 Z" fill="${p.primary}"/>
  </g>
  <path d="M800 230 L1000 300 V470 C1000 590 910 660 800 700 Z" fill="${p.light}" opacity="0.18"/>
  <rect x="725" y="420" width="150" height="130" rx="18" fill="${p.light}"/>
  <path d="M750 420 v-40 a50 50 0 0 1 100 0 v40" fill="none" stroke="${p.light}" stroke-width="18"/>
  <circle cx="800" cy="475" r="16" fill="${p.primary}"/>
  <rect x="793" y="480" width="14" height="40" rx="7" fill="${p.primary}"/>
  <rect x="1150" y="300" width="220" height="16" rx="8" fill="${p.ink}" opacity="0.8"/>
  <rect x="1150" y="340" width="160" height="16" rx="8" fill="${p.ink}" opacity="0.4"/>
  <rect x="230" y="560" width="200" height="16" rx="8" fill="${p.ink}" opacity="0.8"/>
  <rect x="230" y="600" width="130" height="16" rx="8" fill="${p.ink}" opacity="0.4"/>`;
}

function scale(p: Palette, r: () => number) {
  const tilt = (r() * 10 - 5).toFixed(1);
  return `
  <rect x="790" y="250" width="20" height="470" rx="10" fill="${p.ink}"/>
  <rect x="640" y="720" width="320" height="30" rx="15" fill="${p.ink}"/>
  <g transform="rotate(${tilt} 800 260)">
    <rect x="360" y="250" width="880" height="18" rx="9" fill="${p.ink}"/>
    <line x1="430" y1="268" x2="360" y2="470" stroke="${p.ink}" stroke-width="4"/>
    <line x1="430" y1="268" x2="500" y2="470" stroke="${p.ink}" stroke-width="4"/>
    <line x1="1170" y1="268" x2="1100" y2="470" stroke="${p.ink}" stroke-width="4"/>
    <line x1="1170" y1="268" x2="1240" y2="470" stroke="${p.ink}" stroke-width="4"/>
    <g filter="url(#shadow)">
      <path d="M330 470 h200 a100 60 0 0 1 -200 0 z" fill="${p.primary}"/>
      <path d="M1070 470 h200 a100 60 0 0 1 -200 0 z" fill="${p.highlight}"/>
      <rect x="380" y="380" width="100" height="90" rx="14" fill="${p.light}"/>
      <circle cx="1170" cy="425" r="46" fill="${p.light}"/>
    </g>
  </g>
  <circle cx="800" cy="250" r="30" fill="${p.primary}"/>`;
}

function keyboard(p: Palette, r: () => number) {
  const keys: string[] = [];
  const rows = [14, 13, 12, 11];
  const key = 62;
  const gap = 12;
  rows.forEach((count, row) => {
    const width = count * key + (count - 1) * gap;
    const startX = 800 - width / 2 + row * 10;
    for (let i = 0; i < count; i++) {
      const accent = r() > 0.88;
      const x = startX + i * (key + gap);
      const y = 330 + row * (key + gap);
      keys.push(`<rect x="${x}" y="${y + 6}" width="${key}" height="${key}" rx="12" fill="#07080C"/>`);
      keys.push(`<rect x="${x}" y="${y}" width="${key}" height="${key - 4}" rx="12" fill="${accent ? p.highlight : p.secondary}"/>`);
    }
  });
  keys.push(`<rect x="560" y="${330 + 4 * (key + gap)}" width="480" height="${key - 4}" rx="12" fill="${p.primary}"/>`);
  return `
  <g filter="url(#shadow)">
    <rect x="230" y="280" width="1140" height="430" rx="34" fill="#1A1E2B"/>
  </g>
  ${keys.join('')}
  <circle cx="1290" cy="200" r="70" fill="${p.primary}" opacity="0.35"/>`;
}

const motifs: Record<Motif, (p: Palette, r: () => number) => string> = {
  keyboard,
  devices,
  gaming,
  blocks,
  workspace,
  display,
  signal,
  shield,
  scale,
};

function compose(category: string, motif: Motif, seed: string) {
  const palette = palettes[category];
  if (!palette) throw new Error(`No palette for ${category}`);
  const random = rng(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${shadow}</defs>
  <rect width="${W}" height="${H}" fill="${palette.bg}"/>
  ${grid(palette)}
  ${motifs[motif](palette, random)}
</svg>`;
}

/** Illustrations for the demonstration articles. Keep in sync with src/content/articles. */
const articleIllustrations: { file: string; category: string; motif: Motif }[] = [
  { file: 'evaluate-productivity-app', category: 'productivity', motif: 'workspace' },
  { file: 'gaming-mouse-specifications', category: 'gaming', motif: 'gaming' },
  { file: 'how-blockchain-networks-differ', category: 'crypto', motif: 'blocks' },
  { file: 'oled-vs-lcd-displays', category: 'consumer-tech', motif: 'display' },
  { file: 'what-makes-a-gadget-worth-its-price', category: 'consumer-tech', motif: 'scale' },
  { file: 'assess-software-privacy-claims', category: 'productivity', motif: 'shield' },
  { file: 'example-review-halcyon-one-keyboard', category: 'gaming', motif: 'keyboard' },
  { file: 'crypto-wallet-self-custody-basics', category: 'crypto', motif: 'shield' },
  { file: 'refresh-rate-response-time-input-lag', category: 'gaming', motif: 'display' },
  { file: 'passkeys-explained', category: 'consumer-tech', motif: 'signal' },
];

const fallbacks: { file: string; category: string; motif: Motif }[] = [
  { file: 'consumer-tech', category: 'consumer-tech', motif: 'devices' },
  { file: 'gaming', category: 'gaming', motif: 'gaming' },
  { file: 'crypto', category: 'crypto', motif: 'blocks' },
  { file: 'productivity', category: 'productivity', motif: 'workspace' },
];

async function render(dir: string, items: typeof fallbacks) {
  const out = resolve(root, dir);
  await mkdir(out, { recursive: true });
  for (const item of items) {
    const svg = compose(item.category, item.motif, item.file);
    await sharp(Buffer.from(svg)).webp({ quality: 82, effort: 6 }).toFile(resolve(out, `${item.file}.webp`));
    console.log(`  ${dir}/${item.file}.webp`);
  }
}

await render('src/assets/images/articles', articleIllustrations);
await render('src/assets/images/fallback', fallbacks);
console.log('Placeholder illustrations generated.');
