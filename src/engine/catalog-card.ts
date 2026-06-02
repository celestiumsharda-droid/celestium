/**
 * CELESTIUM — catalogue card markup, shared by the build-time pre-render
 * (scripts/build-catalog.ts) and the client fallback (discoveries-index.ts).
 * Pure string output, so it runs in Node and the browser alike. Cards carry
 * data-field / data-q so the client can filter without re-parsing the data.
 */
import { cardVisual } from "./card-visual";
import type { Discovery } from "./types";

/** The curated cosmic-to-human order of the series. */
export const ORDER: readonly string[] = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background", "expanding-universe",
  "first-exoplanet", "double-slit", "periodic-table", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin", "vaccination",
];

const flat = (s: string): string =>
  s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

const escAttr = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One catalogue card. `i` is the zero-based position (for the index number). */
export function catalogCardHTML(slug: string, d: Discovery, i: number): string {
  const title = d.title.replace(/<br\s*\/?>/g, " ");
  const vis = d.heroImage
    ? `<img class="cat-photo" src="/img/${d.heroImage.base}-720.webp" srcset="/img/${d.heroImage.base}-720.webp 720w, /img/${d.heroImage.base}-1280.webp 1280w" sizes="(max-width:600px) 100vw, 380px" alt="" loading="lazy" decoding="async">`
    : cardVisual(slug, d.field);
  const q = (flat(title) + " " + d.field + " " + flat(d.dek)).toLowerCase();
  return (
    `<a class="cat-card glass-soft glass-sheen" href="/discoveries/${slug}/" data-field="${escAttr(d.field)}" data-q="${escAttr(q)}">` +
    `<div class="cat-visual">${vis}</div>` +
    `<div class="cat-body">` +
    `<div class="cat-top"><span class="cat-num">${String(i + 1).padStart(2, "0")}</span>` +
    `<span class="cat-field">${d.field}</span></div>` +
    `<h2 class="cat-title">${title}</h2>` +
    `<p class="cat-dek">${d.dek}</p>` +
    `<div class="cat-foot"><span>${d.era}</span><span class="cat-read">Read &nbsp;&#8594;</span></div>` +
    `</div></a>`
  );
}
