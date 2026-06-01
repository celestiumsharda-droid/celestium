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
};

export default FRAGMENTS;

/** Expand any `__TOKEN__` blocks in an array of depth blocks. */
export function expandFragments(blocks: readonly string[]): string {
  return blocks
    .map(b => (b in FRAGMENTS ? FRAGMENTS[b as FragmentToken] : b))
    .join("");
}
