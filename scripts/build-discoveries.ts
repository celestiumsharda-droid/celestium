/**
 * CELESTIUM — POST-BUILD: per-discovery HTML
 *
 * Runs after `vite build`. Reads dist/discovery.html (Vite's compiled
 * template) and emits one /discoveries/<slug>/index.html per article,
 * with per-article OG / Twitter / canonical tags baked in.
 *
 * Requires `tsx` (added to devDependencies).
 */

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import SITE from "../site.config";
import DISCOVERIES from "../src/data/discoveries";
import { expandFragments } from "../src/engine/fragments";
import { sourcesHTML } from "../src/engine/sources";

// Must match TAGS[0] and the depth-note markup in src/engine/discovery.ts
const GLANCE_TAG = "The Glance — the essence in twenty seconds";
const DEPTHNOTE =
  '<div class="know depthnote"><div class="kh">Same discovery · depth 1 of 3</div>' +
  "<p>This is the identical fact set, re-told at a different altitude. Switch any time — the reader keeps your place in the idea, not the prose.</p></div>";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const TEMPLATE_PATH = join(DIST, "discovery.html");
if (!existsSync(TEMPLATE_PATH)) {
  console.error("✗ dist/discovery.html not found — did `vite build` run?");
  process.exit(1);
}
const template = await readFile(TEMPLATE_PATH, "utf8");

const flatten = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

const esc = (s: string) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function swap(html: string, key: string, value: string): string {
  const re = new RegExp(`<!--\\s*OG:${key}\\s*-->[^"<]*`, "g");
  return html.replace(re, esc(value));
}

const slugs = Object.keys(DISCOVERIES);

for (const slug of slugs) {
  const d = DISCOVERIES[slug]!;
  const flatTitle = flatten(d.title);
  const url = `${SITE.origin}/discoveries/${slug}/`;
  const pageTitle = `${flatTitle} — Celestium`;
  // Per-article OG card is emitted by build-og-images.ts. SVG is the
  // canonical output; PNG is produced as a bonus if `sharp` is present.
  // We point crawlers at PNG when one exists, SVG otherwise. The post-
  // build runs in this order so by the time this script ran (first),
  // build-og-images.ts has not yet emitted them — so we always emit
  // the SVG path. Update this if you reorder the build steps.
  const ogImg = SITE.origin + (d.ogImage || `/og/${slug}.svg`);
  const fallbackOgImg = SITE.origin + SITE.ogImage;

  let html = template;
  html = swap(html, "TITLE", pageTitle);
  html = swap(html, "DESC", d.dek);
  html = swap(html, "URL", url);
  html = swap(html, "OGTITLE", flatTitle);
  html = swap(html, "OGDESC", d.dek);
  html = swap(html, "OGURL", url);
  html = swap(html, "OGIMG", ogImg);   // build-og-images.ts produces these
  html = swap(html, "OGALT", `${flatTitle} — Celestium`);
  html = swap(html, "TWTITLE", flatTitle);
  html = swap(html, "TWDESC", d.dek);
  html = swap(html, "TWIMG", ogImg);
  html = swap(html, "SLUG", slug);

  // ---- Server-render the article so crawlers / no-JS see real content.
  //      discovery.ts hydrates on load (skips the initial render when the
  //      body is already populated, so there's no flash). ----
  const byline =
    `<span><b>Field</b> &nbsp;${d.field}</span>` +
    `<span><b>Era</b> &nbsp;${d.era}</span>` +
    `<span><b>Subject</b> &nbsp;${d.subject}</span>` +
    (d.byline ? `<span><b>By</b> &nbsp;${d.byline}</span>` : "");
  const glanceBody = expandFragments(d.depths[0]) + DEPTHNOTE;

  html = html
    .replace('<div class="kick" id="kick">&#8212;</div>', `<div class="kick" id="kick">${d.kick}</div>`)
    .replace('<h1 id="title">&#8212;</h1>', `<h1 id="title">${d.title}</h1>`)
    .replace('<p class="dek" id="dek">&#8212;</p>', `<p class="dek" id="dek">${d.dek}</p>`)
    .replace('<div class="byl" id="byl"></div>', `<div class="byl" id="byl">${byline}</div>`)
    .replace('<div class="lvltag" id="lvltag">The Glance</div>', `<div class="lvltag" id="lvltag">${GLANCE_TAG}</div>`)
    .replace('<div class="body" id="abody"></div>', `<div class="body" id="abody">${glanceBody}</div>`);

  // Server-render the reference list (crawler-visible, no-JS).
  const srcHTML = sourcesHTML(slug);
  if (srcHTML) {
    html = html.replace(
      '<section class="sources" id="sources" aria-label="Sources and further reading" hidden></section>',
      `<section class="sources" id="sources" aria-label="Sources and further reading">${srcHTML}</section>`,
    );
  }

  // ---- Structured data (Schema.org Article) ----
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: flatTitle,
    description: d.dek,
    image: ogImg,
    url,
    articleSection: d.field,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: "Celestium", url: SITE.origin + "/" },
    publisher: { "@type": "Organization", name: "Celestium", url: SITE.origin + "/" },
  };

  // Inject a preload for the OG image + the JSON-LD before </head>.
  html = html.replace(
    "</head>",
    `<link rel="preload" as="image" href="${fallbackOgImg}">` +
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script></head>`
  );

  const outDir = join(DIST, "discoveries", slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), html, "utf8");
  console.log(`  ✓ /discoveries/${slug}/`);
}

// Remove the bare /dist/discovery.html — only a build template.
await rm(TEMPLATE_PATH, { force: true });

console.log(`\nGenerated ${slugs.length} discovery pages.`);
