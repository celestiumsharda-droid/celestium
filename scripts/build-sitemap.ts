/**
 * CELESTIUM — POST-BUILD: sitemap.xml
 *
 * Emits dist/sitemap.xml with the homepage and every discovery slug.
 */
import { writeFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import SITE from "../site.config";
import DISCOVERIES from "../src/data/discoveries";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: SITE.origin + "/", priority: "1.0" },
  { loc: SITE.origin + "/discoveries/", priority: "0.9" },
  { loc: SITE.origin + "/timeline/", priority: "0.8" },
  { loc: SITE.origin + "/about/", priority: "0.5" },
  { loc: SITE.origin + "/join/", priority: "0.5" },
  ...Object.keys(DISCOVERIES).map(slug => ({
    loc: `${SITE.origin}/discoveries/${slug}/`,
    priority: "0.8",
  })),
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join("\n") +
  `\n</urlset>\n`;

await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
console.log("  ✓ sitemap.xml");
