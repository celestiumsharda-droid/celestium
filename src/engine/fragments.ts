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

/** Hominin family tree with interbreeding between the lineages. */
function homininFigure(): string {
  const root: [number, number] = [360, 40];
  const nean: [number, number] = [150, 250];
  const deni: [number, number] = [360, 250];
  const sap: [number, number] = [580, 250];
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A family tree of Neanderthals, Denisovans and modern humans, with arrows showing interbreeding.">';
  // branches from a common ancestor
  for (const [x, y] of [nean, deni, sap]) {
    s += `<path d="M ${root[0]} ${root[1]} C ${root[0]} ${(root[1] + y) / 2}, ${x} ${(root[1] + y) / 2}, ${x} ${y - 16}" fill="none" stroke="rgba(243,245,251,.22)" stroke-width="2"/>`;
  }
  // interbreeding (dashed)
  s += `<line x1="${nean[0] + 14}" y1="230" x2="${sap[0] - 14}" y2="234" stroke="rgba(169,188,255,.5)" stroke-width="1.5" stroke-dasharray="4 5"/>`;
  s += `<line x1="${deni[0] + 14}" y1="240" x2="${sap[0] - 14}" y2="244" stroke="rgba(242,230,196,.5)" stroke-width="1.5" stroke-dasharray="4 5"/>`;
  // nodes
  const node = (x: number, y: number, c: number, label: string, sub: string) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="#${c.toString(16)}"/>` +
    `<text x="${x}" y="${y + 26}" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="1">${label}</text>` +
    `<text x="${x}" y="${y + 40}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">${sub}</text>`;
  s += `<circle cx="${root[0]}" cy="${root[1]}" r="6" fill="#5a6273"/><text x="${root[0]}" y="${root[1] - 12}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle">COMMON ANCESTOR</text>`;
  s += node(nean[0], nean[1], 0xa9bcff, "NEANDERTHAL", "Europe & W. Asia");
  s += node(deni[0], deni[1], 0xf2e6c4, "DENISOVAN", "found from DNA alone");
  s += node(sap[0], sap[1], 0x9ee6c4, "US", "Homo sapiens");
  s += '</svg><figcaption>Three human lineages from one ancestor — and the dashed lines are real: our species interbred with both. Most people outside Africa still carry Neanderthal DNA; many in Asia and Oceania carry Denisovan DNA too.</figcaption></figure>';
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

/** Cosmic microwave background: the blackbody spectrum, with measured
 *  points falling exactly on a single-temperature Planck curve. */
function cmbFigure(): string {
  const X0 = 76, X1 = 658, Y0 = 250, Y1 = 52, xMax = 1.4, a = 3.9;
  const B = (x: number) => (x <= 0 ? 0 : Math.pow(x, 3) / (Math.exp(a * x) - 1));
  let bmax = 0;
  for (let i = 0; i <= 240; i++) { const v = B((i / 240) * xMax); if (v > bmax) bmax = v; }
  const px = (x: number) => X0 + (x / xMax) * (X1 - X0);
  const py = (f: number) => Y0 + f * (Y1 - Y0);
  let curve = "";
  for (let i = 0; i <= 240; i++) {
    const x = (i / 240) * xMax, f = B(x) / bmax;
    curve += `${i === 0 ? "M" : "L"} ${px(x).toFixed(1)} ${py(f).toFixed(1)} `;
  }
  const area = `${curve}L ${px(xMax).toFixed(1)} ${Y0} L ${px(0).toFixed(1)} ${Y0} Z`;
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The cosmic microwave background spectrum: measured points lying on a single-temperature blackbody curve.">';
  s += `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#363c4a"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#363c4a"/>`;
  s += `<path d="${area}" fill="rgba(169,188,255,.08)"/>`;
  s += `<path d="${curve}" fill="none" stroke="#a9bcff" stroke-width="2"/>`;
  for (const x of [0.22, 0.4, 0.55, 0.72, 0.9, 1.06, 1.22]) {
    const f = B(x) / bmax;
    s += `<circle cx="${px(x).toFixed(1)}" cy="${py(f).toFixed(1)}" r="4" fill="#f2e6c4"/>`;
    s += `<circle cx="${px(x).toFixed(1)}" cy="${py(f).toFixed(1)}" r="8.5" fill="none" stroke="rgba(242,230,196,.3)"/>`;
  }
  s += `<text x="${px(0.72)}" y="${py(B(0.72) / bmax) - 18}" fill="#a9bcff" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle">2.725 K blackbody</text>`;
  s += `<text x="${px(1.18)}" y="${py(B(1.18) / bmax) - 16}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="10">measured · COBE/FIRAS</text>`;
  s += `<text x="${(X0 + X1) / 2}" y="${Y0 + 22}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle" letter-spacing="2">FREQUENCY &#8594;</text>`;
  s += `<text x="${X0 - 8}" y="${Y1 + 4}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="end">bright</text>`;
  s += "</svg><figcaption>Plot the brightness of the cosmic microwave background against frequency and every measured point lands on the curve for one temperature: 2.725 K. It is the most perfect blackbody ever measured — the cooled, stretched-out glow of the universe when it first turned transparent.</figcaption></figure>";
  return s;
}

/** Seafloor spreading: mirror-symmetric magnetic stripes recording the
 *  field reversals frozen into new crust either side of a ridge. */
function seafloorFigure(): string {
  const cx = 360, top = 72, h = 120;
  const widths = [24, 16, 34, 14, 38, 20, 30, 18];
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Magnetic stripes on the seafloor, mirror-symmetric about a mid-ocean ridge.">';
  let off = 0;
  widths.forEach((w, i) => {
    const col = i % 2 === 0 ? "#33406c" : "#10131c";
    s += `<rect x="${cx + off}" y="${top}" width="${w}" height="${h}" fill="${col}"/>`;
    s += `<rect x="${cx - off - w}" y="${top}" width="${w}" height="${h}" fill="${col}"/>`;
    off += w;
  });
  // ridge
  s += `<rect x="${cx - 3}" y="${top - 14}" width="6" height="${h + 28}" fill="#f2e6c4"/>`;
  s += `<circle cx="${cx}" cy="${top + h / 2}" r="${h / 2 + 14}" fill="none" stroke="rgba(242,230,196,.12)"/>`;
  // spreading arrows
  const ay = top + h + 34;
  s += `<line x1="${cx - 60}" y1="${ay}" x2="${cx - 140}" y2="${ay}" stroke="#9aa2b4" stroke-width="1.5"/><path d="M ${cx - 140} ${ay} l 10 -5 v 10 z" fill="#9aa2b4"/>`;
  s += `<line x1="${cx + 60}" y1="${ay}" x2="${cx + 140}" y2="${ay}" stroke="#9aa2b4" stroke-width="1.5"/><path d="M ${cx + 140} ${ay} l -10 -5 v 10 z" fill="#9aa2b4"/>`;
  s += `<text x="${cx}" y="${top - 22}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="11" text-anchor="middle" letter-spacing="2">MID-OCEAN RIDGE</text>`;
  s += `<text x="${cx}" y="${ay + 4}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle">new crust spreads both ways</text>`;
  s += `<text x="${cx - 200}" y="${top + h / 2}" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle" transform="rotate(-90 ${cx - 200} ${top + h / 2})">OLDER &#8592;</text>`;
  s += `<text x="${cx + 200}" y="${top + h / 2}" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle" transform="rotate(90 ${cx + 200} ${top + h / 2})">&#8594; OLDER</text>`;
  s += "</svg><figcaption>New seafloor erupts at the ridge and spreads outward, freezing the direction of Earth&#8217;s magnetic field into the rock as it cools. Because the field flips every so often, the floor records a barcode of reversals — mirror-identical on both sides. That symmetry is what proved the continents move.</figcaption></figure>";
  return s;
}

/** Zone of inhibition: a bacterial lawn cleared in a ring around a mould. */
function inhibitionFigure(): string {
  const cx = 360, cy = 150, R = 118;
  const mx = 360, my = 96, clearR = 50, mouldR = 19;
  let seed = 11;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A petri dish: a bacterial lawn cleared in a ring around a colony of Penicillium mould.">';
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#0c0e14" stroke="rgba(243,245,251,.18)" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="none" stroke="rgba(243,245,251,.05)"/>`;
  for (let i = 0; i < 520; i++) {
    const x = cx + (rnd() * 2 - 1) * R, y = cy + (rnd() * 2 - 1) * R;
    if (Math.hypot(x - cx, y - cy) > R - 12) continue;     // inside dish
    if (Math.hypot(x - mx, y - my) < clearR) continue;     // not in the clear zone
    const r = rnd() * 1.1 + 0.5;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#7e879b" opacity="${(0.25 + rnd() * 0.4).toFixed(2)}"/>`;
  }
  s += `<circle cx="${mx}" cy="${my}" r="${clearR}" fill="none" stroke="rgba(242,230,196,.18)" stroke-dasharray="3 5"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mouldR}" fill="#f2e6c4" opacity=".88"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mouldR - 6}" fill="none" stroke="rgba(12,14,20,.4)"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mouldR - 12}" fill="none" stroke="rgba(12,14,20,.4)"/>`;
  s += `<text x="${mx}" y="${my - mouldR - 8}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle" letter-spacing="1">PENICILLIUM</text>`;
  s += `<text x="${mx + clearR + 6}" y="${my + 30}" fill="#9aa2b4" font-family="IBM Plex Mono,monospace" font-size="9">clear zone — nothing grows</text>`;
  s += `<text x="${cx + R - 28}" y="${cy + R - 24}" fill="#5a6273" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="end">bacterial lawn</text>`;
  s += "</svg><figcaption>A dish seeded with bacteria grows as a haze everywhere — except in a clear moat around a stray speck of <i>Penicillium</i>. Something the mould released was killing the bacteria. Fleming noticed the gap; it became the first antibiotic.</figcaption></figure>";
  return s;
}

/** CRISPR–Cas9: a programmable guide RNA finds a 20-letter target beside
 *  a PAM, and the enzyme cuts both DNA strands at that spot. */
function cas9Figure(): string {
  const x0 = 70, x1 = 650, y1 = 158, y2 = 182;
  const tx0 = 300, tx1 = 470, pamX = tx1 + 8, cutX = tx1 - 26;
  let s = '<figure><svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CRISPR-Cas9: a guide RNA pairs with a twenty-letter DNA target beside a PAM, and the enzyme cuts both strands.">';
  // Cas9 body
  s += `<ellipse cx="385" cy="150" rx="132" ry="78" fill="rgba(169,188,255,.07)" stroke="rgba(169,188,255,.32)"/>`;
  s += `<text x="300" y="92" fill="#a9bcff" font-family="IBM Plex Mono,monospace" font-size="11" letter-spacing="1">Cas9</text>`;
  // target highlight
  s += `<rect x="${tx0}" y="${y1 - 8}" width="${tx1 - tx0}" height="${y2 - y1 + 16}" rx="4" fill="rgba(158,230,196,.10)"/>`;
  // DNA backbones
  s += `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#dfe6ff" stroke-width="2.4" opacity=".65"/>`;
  s += `<line x1="${x0}" y1="${y2}" x2="${x1}" y2="${y2}" stroke="#dfe6ff" stroke-width="2.4" opacity=".5"/>`;
  for (let x = x0 + 8; x <= x1 - 4; x += 13) {
    s += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="rgba(223,230,255,.22)" stroke-width="1.4"/>`;
  }
  // guide RNA pairing across the target
  let guide = `M ${tx0} ${y1 - 26} `;
  for (let x = tx0; x <= tx1; x += 8) guide += `L ${x} ${y1 - (x % 16 === 0 ? 22 : 30)} `;
  s += `<path d="${guide}" fill="none" stroke="#9ee6c4" stroke-width="2.2"/>`;
  for (let x = tx0 + 4; x <= tx1; x += 16) s += `<line x1="${x}" y1="${y1 - 24}" x2="${x}" y2="${y1 - 2}" stroke="rgba(158,230,196,.5)" stroke-width="1.2"/>`;
  s += `<text x="${(tx0 + tx1) / 2}" y="${y1 - 40}" fill="#9ee6c4" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle">GUIDE RNA · 20 letters, reprogrammable</text>`;
  // PAM
  s += `<rect x="${pamX}" y="${y1 - 8}" width="22" height="${y2 - y1 + 16}" rx="3" fill="rgba(242,230,196,.16)" stroke="rgba(242,230,196,.4)"/>`;
  s += `<text x="${pamX + 11}" y="${y2 + 22}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">PAM</text>`;
  // cut
  s += `<line x1="${cutX}" y1="${y1 - 16}" x2="${cutX}" y2="${y2 + 16}" stroke="#ff9ec4" stroke-width="2" stroke-dasharray="3 3"/>`;
  s += `<text x="${cutX}" y="${y2 + 34}" fill="#ff9ec4" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">cut</text>`;
  s += "</svg><figcaption>Cas9 (the enzyme) carries a short guide RNA whose letters are written to match one twenty-letter stretch of DNA. It scans the genome, locks onto the matching sequence beside a short &#8220;PAM&#8221; signal, and cuts both strands at exactly that spot. Rewrite the guide and you retarget the same tool to any gene.</figcaption></figure>";
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
  "__FIG_HOMININ__": homininFigure(),
  "__FIG_CMB__": cmbFigure(),
  "__FIG_SEAFLOOR__": seafloorFigure(),
  "__FIG_INHIBITION__": inhibitionFigure(),
  "__FIG_CAS9__": cas9Figure(),
  "__STATS_CMB__":
    '<div class="stats"><div><div class="v">2.725 K</div><div class="l">Temperature of the sky today, almost perfectly uniform</div></div><div><div class="v">380,000 yr</div><div class="l">Age of the universe when this light was set free</div></div><div><div class="v">1 in 100,000</div><div class="l">Size of the temperature ripples — the seeds of galaxies</div></div></div>',
  "__STATS_TECTONICS__":
    '<div class="stats"><div><div class="v">1912</div><div class="l">Wegener proposes drifting continents — and is dismissed</div></div><div><div class="v">1963</div><div class="l">Magnetic stripes on the seafloor confirm it</div></div><div><div class="v">~3 cm/yr</div><div class="l">How fast plates move — about as fast as fingernails grow</div></div></div>',
  "__STATS_PENICILLIN__":
    '<div class="stats"><div><div class="v">1928</div><div class="l">Fleming spots the clear ring around a mould</div></div><div><div class="v">1941</div><div class="l">The Oxford team treats the first patient</div></div><div><div class="v">1945</div><div class="l">Nobel Prize — and an age of antibiotics begins</div></div></div>',
  "__STATS_CRISPR__":
    '<div class="stats"><div><div class="v">2012</div><div class="l">Cas9 turned into a programmable cutting tool</div></div><div><div class="v">20 letters</div><div class="l">The guide-RNA address that aims it at one gene</div></div><div><div class="v">2023</div><div class="l">First CRISPR therapy approved, for sickle-cell disease</div></div></div>',
};

export default FRAGMENTS;

/** Expand any `__TOKEN__` blocks in an array of depth blocks. */
export function expandFragments(blocks: readonly string[]): string {
  return blocks
    .map(b => (b in FRAGMENTS ? FRAGMENTS[b as FragmentToken] : b))
    .join("");
}
