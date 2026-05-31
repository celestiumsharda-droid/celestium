/**
 * CELESTIUM — POST-BUILD: per-article OG images
 *
 * Generates a 1200×630 SVG social card for each discovery and writes
 * it to dist/og/<slug>.svg AND dist/og/<slug>.png (best-effort PNG
 * conversion if the optional `sharp` dep is installed; SVG is always
 * written and is acceptable to most crawlers).
 *
 * Design: near-black background with a single accent ring, the
 * article title in Fraunces (system fallback in the SVG), the field
 * eyebrow, and the Celestium wordmark. Restraint-first.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import DISCOVERIES from "../src/data/discoveries";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const OG_DIR = join(DIST, "og");
await mkdir(OG_DIR, { recursive: true });

const flatten = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Word-wrap a title onto N lines, at roughly `maxChars` per line. */
function wrap(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

function svgFor(slug: string): string {
  const d = DISCOVERIES[slug]!;
  const flatTitle = flatten(d.title);
  const lines = wrap(flatTitle, 26, 3);
  const tspans = lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 92}">${esc(line)}</tspan>`)
    .join("");
  const field = esc(d.field.toUpperCase());

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="bg" cx="22%" cy="38%" r="78%">
      <stop offset="0%" stop-color="#10131c"/>
      <stop offset="100%" stop-color="#050609"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- decorative orbit rings -->
  <g transform="translate(960 200)" fill="none" stroke="rgba(169,188,255,.35)" stroke-width="1.5">
    <ellipse rx="160" ry="60"/>
    <ellipse rx="160" ry="60" transform="rotate(60)"/>
    <ellipse rx="160" ry="60" transform="rotate(120)"/>
    <circle r="6" fill="#a9bcff" stroke="none"/>
  </g>
  <!-- star -->
  <path d="M1095 90 l5 12 12 1 -9 9 2 13 -10-6 -10 6 2-13 -9-9 12-1z" fill="#f2e6c4"/>

  <!-- field eyebrow -->
  <text x="80" y="120" font-family="ui-monospace,Menlo,monospace" font-size="20" letter-spacing="6" fill="#a9bcff">${field}</text>

  <!-- title -->
  <text x="80" y="240" font-family="Georgia,'Times New Roman',serif" font-size="76" font-weight="300" fill="#f3f5fb" letter-spacing="-1">${tspans}</text>

  <!-- wordmark -->
  <text x="80" y="565" font-family="Georgia,'Times New Roman',serif" font-size="22" letter-spacing="6" fill="#9aa2b4">CELESTIUM</text>
  <text x="80" y="595" font-family="ui-monospace,Menlo,monospace" font-size="13" letter-spacing="3" fill="#5a6273">A PINNACLE OF SCIENCE</text>

  <!-- accent divider -->
  <line x1="80" y1="540" x2="220" y2="540" stroke="#a9bcff" stroke-width="2"/>
</svg>`;
}

let count = 0;
for (const slug of Object.keys(DISCOVERIES)) {
  const svg = svgFor(slug);
  await writeFile(join(OG_DIR, `${slug}.svg`), svg, "utf8");
  count++;
}

/* Try to rasterise SVG → PNG if `sharp` is available. The build runs
   even without it — SVG is a valid og:image format for most crawlers,
   and Cloudflare Pages will serve it with the right Content-Type. */
try {
  const sharpMod = await import("sharp").catch(() => null);
  if (sharpMod && (sharpMod.default || sharpMod)) {
    const sharp = (sharpMod.default || sharpMod) as typeof import("sharp");
    for (const slug of Object.keys(DISCOVERIES)) {
      const svgBuf = Buffer.from(svgFor(slug));
      await sharp(svgBuf, { density: 144 }).png().toFile(join(OG_DIR, `${slug}.png`));
    }
    console.log(`  ✓ ${count} OG cards (SVG + PNG)`);
  } else {
    console.log(`  ✓ ${count} OG cards (SVG only — install \`sharp\` for PNG)`);
  }
} catch (e: unknown) {
  console.log(`  ✓ ${count} OG cards (SVG only; sharp fallback failed: ${String(e)})`);
}
