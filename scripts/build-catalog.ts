/**
 * CELESTIUM — POST-BUILD: pre-render the discoveries catalogue.
 *
 * Runs after `vite build`. The catalogue page ships with an empty grid that
 * JS used to fill on load — which shifted layout (CLS) and delayed content.
 * Here we render the cards, filter chips, and count straight into the static
 * HTML, so the catalogue is present at first paint. The client then simply
 * hydrates (wires search/filter to the existing nodes).
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import DISCOVERIES from "../src/data/discoveries";
import { ORDER, catalogCardHTML } from "../src/engine/catalog-card";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, "..", "dist", "discoveries", "index.html");

if (!existsSync(FILE)) {
  console.error("✗ dist/discoveries/index.html not found — did `vite build` run?");
  process.exit(1);
}

let html = await readFile(FILE, "utf8");

const present = ORDER.filter(s => DISCOVERIES[s]);
const cards = present.map((slug, i) => catalogCardHTML(slug, DISCOVERIES[slug]!, i)).join("");

const fields = ["All", ...Array.from(new Set(present.map(s => DISCOVERIES[s]!.field)))];
const chips = fields
  .map(f => `<button type="button" class="cat-chip${f === "All" ? " on" : ""}" aria-pressed="${f === "All" ? "true" : "false"}">${f}</button>`)
  .join("");

const count = `${present.length} discoveries`;

const before = html;
html = html
  .replace('<div class="cat-grid" id="catalog"></div>', `<div class="cat-grid" id="catalog">${cards}</div>`)
  .replace(
    '<div class="cat-filters" id="cat-filters" role="group" aria-label="Filter by discipline"></div>',
    `<div class="cat-filters" id="cat-filters" role="group" aria-label="Filter by discipline">${chips}</div>`,
  )
  .replace('<p class="cat-count" id="cat-count" aria-live="polite"></p>', `<p class="cat-count" id="cat-count" aria-live="polite">${count}</p>`);

if (html === before) {
  console.error("✗ catalog placeholders not found — markup may have changed.");
  process.exit(1);
}

await writeFile(FILE, html, "utf8");
console.log(`  ✓ catalogue pre-rendered (${present.length} cards, ${fields.length - 1} fields)`);
