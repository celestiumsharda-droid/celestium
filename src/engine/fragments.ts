/**
 * Shared HTML fragments referenced by token inside discovery depth
 * blocks. Defined once, expanded at render time wherever `__TOKEN__`
 * appears in an article's `depths`.
 */

import type { FragmentToken } from "./types";

function ehtFigure(): string {
  let s =
    '<figure><svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematic of the Event Horizon Telescope.">' +
    '<defs><radialGradient id="e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#161a25"/><stop offset="100%" stop-color="#0a0c12"/></radialGradient></defs>' +
    '<circle cx="250" cy="180" r="92" fill="url(#e)" stroke="rgba(243,245,251,.16)"/>' +
    '<ellipse cx="250" cy="180" rx="92" ry="30" fill="none" stroke="rgba(243,245,251,.08)"/>' +
    '<circle cx="600" cy="70" r="34" fill="#000" stroke="rgba(242,230,196,.5)" stroke-width="2"/>' +
    '<circle cx="600" cy="70" r="46" fill="none" stroke="rgba(242,230,196,.18)"/>' +
    '<text x="600" y="135" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">THE TARGET</text>' +
    '<text x="600" y="151" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">a ring on the sky</text>';
  const stations: [number, number][] = [
    [185, 128], [170, 210], [230, 255], [315, 235], [330, 150], [270, 108],
  ];
  for (const [x, y] of stations) {
    s += `<line x1="${x}" y1="${y}" x2="600" y2="70" stroke="rgba(169,188,255,.28)" stroke-width="1" stroke-dasharray="3 5"/>`;
  }
  for (const [x, y] of stations) {
    s += `<circle cx="${x}" cy="${y}" r="5" fill="#a9bcff"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="rgba(169,188,255,.3)"/>`;
  }
  s +=
    '<text x="250" y="300" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">EARTH</text>' +
    '<text x="250" y="316" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">eight observatories, one virtual dish</text>' +
    "</svg><figcaption>Linking telescopes across the planet builds a single instrument as wide as Earth itself — the only way to resolve something so small and so far.</figcaption></figure>";
  return s;
}

/** Responsive <picture> for a content photo in /img. */
function photo(
  base: string, w: number, h: number, alt: string, caption: string,
): string {
  return (
    '<figure><picture>' +
    `<source type="image/avif" srcset="/img/${base}-720.avif 720w, /img/${base}-1280.avif 1280w" sizes="(max-width: 760px) 100vw, 720px">` +
    `<source type="image/webp" srcset="/img/${base}-720.webp 720w, /img/${base}-1280.webp 1280w" sizes="(max-width: 760px) 100vw, 720px">` +
    `<img src="/img/${base}-1280.jpg" srcset="/img/${base}-720.jpg 720w, /img/${base}-1280.jpg 1280w" sizes="(max-width: 760px) 100vw, 720px" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async">` +
    `</picture><figcaption>${caption}</figcaption></figure>`
  );
}

/** Double-slit schematic: source → two slits → fringes on a screen. */
function dslitFigure(): string {
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A coherent source passes through two slits and forms interference fringes on a screen.">';
  // source + wavefronts
  s += '<circle cx="70" cy="150" r="5" fill="#a9bcff"/>';
  for (let i = 1; i <= 3; i++) s += `<path d="M ${70 + i*34} 110 A 60 60 0 0 1 ${70 + i*34} 190" fill="none" stroke="rgba(169,188,255,${0.5 - i*0.1})" stroke-width="1"/>`;
  // barrier with two slits
  s += '<rect x="246" y="40" width="8" height="80" fill="#363c4a"/>';
  s += '<rect x="246" y="138" width="8" height="24" fill="#363c4a"/>';
  s += '<rect x="246" y="180" width="8" height="80" fill="#363c4a"/>';
  // spreading wavelets from each slit
  for (let i = 1; i <= 4; i++) {
    s += `<path d="M ${254 + i*40} 100 A 70 70 0 0 1 ${254 + i*40} 200" fill="none" stroke="rgba(242,230,196,${0.34 - i*0.05})" stroke-width="1"/>`;
    s += `<circle cx="250" cy="150" r="${i*38}" fill="none" stroke="rgba(169,188,255,.0)"/>`;
  }
  // screen with fringes
  s += '<rect x="636" y="40" width="3" height="220" fill="#5a6273"/>';
  const bands = [0.95, 0.2, 0.7, 0.15, 0.95, 0.15, 0.7, 0.2, 0.95];
  bands.forEach((o, i) => { s += `<rect x="624" y="${56 + i*22}" width="10" height="14" rx="2" fill="#f2e6c4" opacity="${o}"/>`; });
  // labels
  s += '<text x="70" y="280" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">SOURCE</text>';
  s += '<text x="250" y="280" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">TWO SLITS</text>';
  s += '<text x="629" y="280" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="end" letter-spacing="2">FRINGES</text>';
  s += '</svg><figcaption>One particle, two open slits: the paths interfere and pile up into bright and dark bands. Close one slit, or record which slit it took, and the bands vanish.</figcaption></figure>';
  return s;
}

/** DNA base-pairing ladder: complementary A–T and G–C rungs. */
function helixFigure(): string {
  const xL = 150, xR = 570, top = 40, gap = 34;
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A DNA ladder: the two backbones joined by complementary base pairs, A with T and G with C.">';
  // backbones
  s += `<line x1="${xL}" y1="${top - 8}" x2="${xL}" y2="${top + gap * 6 + 8}" stroke="#dfe6ff" stroke-width="3" opacity=".7"/>`;
  s += `<line x1="${xR}" y1="${top - 8}" x2="${xR}" y2="${top + gap * 6 + 8}" stroke="#dfe6ff" stroke-width="3" opacity=".7"/>`;
  // rungs, alternating pairings
  const pairs: [string, string, number, number][] = [
    ["A", "T", 0xa9bcff, 0xf2e6c4], ["G", "C", 0x9ee6c4, 0xff9ec4],
    ["T", "A", 0xf2e6c4, 0xa9bcff], ["C", "G", 0xff9ec4, 0x9ee6c4],
    ["A", "T", 0xa9bcff, 0xf2e6c4], ["G", "C", 0x9ee6c4, 0xff9ec4],
    ["T", "A", 0xf2e6c4, 0xa9bcff],
  ];
  const hex = (n: number) => "#" + n.toString(16).padStart(6, "0");
  const mid = (xL + xR) / 2;
  pairs.forEach(([l, r, cl, cr], i) => {
    const y = top + i * gap;
    s += `<line x1="${xL}" y1="${y}" x2="${mid}" y2="${y}" stroke="${hex(cl)}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<line x1="${mid}" y1="${y}" x2="${xR}" y2="${y}" stroke="${hex(cr)}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<text x="${xL - 16}" y="${y + 4}" fill="${hex(cl)}" font-family="IBM Plex Mono,monospace" font-size="13" text-anchor="end">${l}</text>`;
    s += `<text x="${xR + 16}" y="${y + 4}" fill="${hex(cr)}" font-family="IBM Plex Mono,monospace" font-size="13">${r}</text>`;
  });
  s += `<text x="${mid}" y="288" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">A&#8211;T &nbsp; G&#8211;C &nbsp; COMPLEMENTARY PAIRS</text>`;
  s += '</svg><figcaption>Every rung is a fixed pair — A with T, G with C. Because the pairing is rigid, each strand carries the full recipe for its partner: split the ladder and both halves can be rebuilt.</figcaption></figure>';
  return s;
}

/** Radioactive-decay clock: parent halves each half-life, daughter grows. */
function decayFigure(): string {
  const X0 = 70, X1 = 660, Y0 = 250, Y1 = 50; // axes box
  const tMax = 4;                              // half-lives shown
  const px = (t: number) => X0 + (t / tMax) * (X1 - X0);
  const py = (f: number) => Y0 + f * (Y1 - Y0);
  let parent = "", daughter = "";
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * tMax;
    const f = Math.pow(0.5, t);
    parent += `${i === 0 ? "M" : "L"} ${px(t).toFixed(1)} ${py(f).toFixed(1)} `;
    daughter += `${i === 0 ? "M" : "L"} ${px(t).toFixed(1)} ${py(1 - f).toFixed(1)} `;
  }
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A radioactive decay curve: parent atoms halve every half-life as daughter atoms accumulate.">';
  // axes
  s += `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#363c4a"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#363c4a"/>`;
  // half-life markers
  for (let t = 1; t <= tMax; t++) {
    s += `<line x1="${px(t)}" y1="${Y0}" x2="${px(t)}" y2="${Y1}" stroke="rgba(243,245,251,.06)" stroke-dasharray="3 5"/>`;
    s += `<circle cx="${px(t)}" cy="${py(Math.pow(0.5, t))}" r="3.5" fill="#a9bcff"/>`;
    s += `<text x="${px(t)}" y="${Y0 + 18}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle">${t} t&#189;</text>`;
  }
  s += `<path d="${parent}" fill="none" stroke="#a9bcff" stroke-width="2"/>`;
  s += `<path d="${daughter}" fill="none" stroke="#f2e6c4" stroke-width="2" opacity=".8"/>`;
  s += `<text x="${px(0.15)}" y="${py(0.92)}" fill="#a9bcff" font-family="IBM Plex Mono,monospace" font-size="11">PARENT (uranium)</text>`;
  s += `<text x="${px(2.0)}" y="${py(0.86)}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="11">DAUGHTER (lead)</text>`;
  s += '</svg><figcaption>The clock inside the rock: half the parent atoms decay every half-life, no matter the heat or pressure. Measure how much daughter has built up and you read the elapsed time.</figcaption></figure>';
  return s;
}

const FRAGMENTS: Record<FragmentToken, string> = {
  "__STATS_EHT__":
    '<div class="stats"><div><div class="v">8</div><div class="l">Observatories linked across the globe</div></div><div><div class="v">~5 PB</div><div class="l">Data — too big for the internet, flown on drives</div></div><div><div class="v">55M ly</div><div class="l">Distance to M87&#42;, the first target</div></div></div>',
  "__STATS_LIGO__":
    '<div class="stats"><div><div class="v">4 km</div><div class="l">Length of each detector arm</div></div><div><div class="v">10&#8315;&#185;&#8312; m</div><div class="l">Mirror motion measured — under a proton width</div></div><div><div class="v">~3 M&#9737;</div><div class="l">Mass turned to waves in under a second</div></div></div>',
  "__STATS_COSMO__":
    '<div class="stats"><div><div class="v">~5%</div><div class="l">Ordinary matter — everything we can see</div></div><div><div class="v">~27%</div><div class="l">Dark matter — felt only by gravity</div></div><div><div class="v">~68%</div><div class="l">Dark energy — pushing space apart</div></div></div>',
  "__STATS_EXO__":
    '<div class="stats"><div><div class="v">4.23 d</div><div class="l">Orbital period — a year on 51 Pegasi b</div></div><div><div class="v">~50 ly</div><div class="l">Distance to the star</div></div><div><div class="v">5,000+</div><div class="l">Confirmed exoplanets today</div></div></div>',
  "__FIG_EHT__": ehtFigure(),
  "__FIG_M87__":
    '<figure><picture>' +
    '<source type="image/avif" srcset="/img/m87-720.avif 720w, /img/m87-1280.avif 1280w" sizes="(max-width: 760px) 100vw, 720px">' +
    '<source type="image/webp" srcset="/img/m87-720.webp 720w, /img/m87-1280.webp 1280w" sizes="(max-width: 760px) 100vw, 720px">' +
    '<img src="/img/m87-1280.jpg" srcset="/img/m87-720.jpg 720w, /img/m87-1280.jpg 1280w" sizes="(max-width: 760px) 100vw, 720px" width="1280" height="1280" alt="The Event Horizon Telescope&#8217;s 2019 image of M87&#42;: a bright, slightly asymmetric orange ring of light around a dark central shadow." loading="lazy" decoding="async">' +
    '</picture><figcaption>The first photograph of a black hole — M87&#42;, released 10 April 2019. The ring glows brighter where gas sweeps toward us at nearly light speed. <span class="credit">Image: EHT Collaboration · CC BY 4.0</span></figcaption></figure>',
  "__FIG_BULLET__": photo(
    "bullet", 1280, 925,
    "The Bullet Cluster: pink X-ray gas lagging behind two blue clumps of mass mapped by gravitational lensing.",
    'The Bullet Cluster — two galaxy clusters that collided. The hot gas (pink, X-ray) was slowed by the impact, but most of the mass (blue, mapped by lensing) sailed straight through: dark matter, separated from the matter we can see. <span class="credit">X-ray: NASA/CXC · Lensing: NASA/STScI, ESO, Magellan · Public domain</span>',
  ),
  "__FIG_LIGO__": photo(
    "ligo", 1280, 853,
    "Aerial view of the LIGO Hanford Observatory: two four-kilometre arms meeting at a right angle in the desert.",
    'LIGO Hanford, Washington — one of the two detectors. Each arm runs four kilometres; a passing gravitational wave changes their length by a ten-thousandth the width of a proton. <span class="credit">Image: Caltech/MIT/LIGO Laboratory</span>',
  ),
  "__FIG_HOTJUP__": photo(
    "hotjupiter", 1280, 853,
    "Artist's impression of a hot-Jupiter exoplanet: a banded gas giant glowing from the heat of a nearby star.",
    'A hot Jupiter — a gas giant orbiting its star in days, roasting at over a thousand degrees. 51 Pegasi b, the first planet found around a sun-like star, is one of these. <span class="credit">Artist&#8217;s impression · Public domain</span>',
  ),
  "__FIG_DSLIT__": dslitFigure(),
  "__FIG_DECAY__": decayFigure(),
  "__FIG_HELIX__": helixFigure(),
};

export default FRAGMENTS;

/** Expand any `__TOKEN__` blocks in an array of depth blocks. */
export function expandFragments(blocks: readonly string[]): string {
  return blocks
    .map(b => (b in FRAGMENTS ? FRAGMENTS[b as FragmentToken] : b))
    .join("");
}
