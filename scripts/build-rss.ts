/**
 * CELESTIUM — POST-BUILD: rss.xml
 *
 * Emits dist/rss.xml for the Discovery Series so the publication can be
 * followed in any reader. Items are ordered by the curated reading order.
 */
import { writeFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import SITE from "../site.config";
import DISCOVERIES from "../src/data/discoveries";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

const ORDER = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background", "expanding-universe",
  "first-exoplanet", "double-slit", "periodic-table", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin", "vaccination",
];

const flat = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const now = new Date().toUTCString();

const items = ORDER
  .filter(slug => DISCOVERIES[slug])
  .map(slug => {
    const d = DISCOVERIES[slug]!;
    const url = `${SITE.origin}/discoveries/${slug}/`;
    return (
      `    <item>\n` +
      `      <title>${esc(flat(d.title))}</title>\n` +
      `      <link>${url}</link>\n` +
      `      <guid isPermaLink="true">${url}</guid>\n` +
      `      <category>${esc(d.field)}</category>\n` +
      `      <description>${esc(flat(d.dek))}</description>\n` +
      `      <pubDate>${now}</pubDate>\n` +
      `    </item>`
    );
  })
  .join("\n");

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
  `  <channel>\n` +
  `    <title>Celestium — The Discovery Series</title>\n` +
  `    <link>${SITE.origin}/discoveries/</link>\n` +
  `    <atom:link href="${SITE.origin}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
  `    <description>Landmark scientific discoveries, each told at three depths and cited to the primary literature.</description>\n` +
  `    <language>en</language>\n` +
  `    <lastBuildDate>${now}</lastBuildDate>\n` +
  `${items}\n` +
  `  </channel>\n` +
  `</rss>\n`;

await writeFile(join(DIST, "rss.xml"), xml, "utf8");
console.log("  ✓ rss.xml");
