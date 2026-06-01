/**
 * CELESTIUM — DISCOVERIES INDEX
 * The catalogue, built to stay findable at any scale: every article is
 * filterable by discipline and searchable by title / field / idea, and
 * each card carries a generative, discipline-tinted visual so the grid
 * never reads as a bland wall of text. Designed to work just as well
 * with 100 articles as with 12.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";
import { initCommandPalette } from "./command-palette";
import DISCOVERIES from "../data/discoveries";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
}, { passive: true });

/* curated cosmic-to-human order */
const ORDER = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background",
  "first-exoplanet", "double-slit", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin",
];

/* ---- discipline palettes for the generative card art ---- */
interface Pal { a: string; b: string; }
const FIELD_COLORS: Record<string, Pal> = {
  "Cosmology":         { a: "#a9bcff", b: "#6c7cff" },
  "Spacetime":         { a: "#b9a9ff", b: "#7d6cff" },
  "Origins":           { a: "#ffd6a0", b: "#f2a65a" },
  "Planetary Science": { a: "#9ee6c4", b: "#5ab98a" },
  "Quantum Reality":   { a: "#c4b5ff", b: "#8a7dff" },
  "Deep Time":         { a: "#dcc69e", b: "#b8975a" },
  "Earth Science":     { a: "#7fb0e8", b: "#4a78b8" },
  "Life & Origins":    { a: "#9ee6c4", b: "#6cc49a" },
  "Biotechnology":     { a: "#c4f29e", b: "#86cf5a" },
  "Human History":     { a: "#e8a9b0", b: "#c46c78" },
};
const DEFAULT_PAL: Pal = { a: "#a9bcff", b: "#6c7cff" };

/** A deterministic, discipline-tinted visual for a card. Seeded by slug
 *  so it never flickers; pure SVG so it scales and stays crisp. */
function cardVisual(slug: string, field: string): string {
  const pal = FIELD_COLORS[field] ?? DEFAULT_PAL;
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) & 0x7fffffff;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const id = "g" + slug.replace(/[^a-z0-9]/gi, "");
  let s = `<svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${field} — abstract motif" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><radialGradient id="${id}" cx="78%" cy="12%" r="95%">` +
       `<stop offset="0%" stop-color="${pal.a}" stop-opacity=".42"/>` +
       `<stop offset="42%" stop-color="${pal.b}" stop-opacity=".14"/>` +
       `<stop offset="100%" stop-color="#0a0c12" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect width="400" height="230" fill="#0a0c12"/>`;
  s += `<rect width="400" height="230" fill="url(#${id})"/>`;
  // faint orbital rings, rotated by seed
  const rings = 2 + Math.floor(rnd() * 2);
  const cx = 300 + rnd() * 60, cy = 30 + rnd() * 40;
  for (let i = 0; i < rings; i++) {
    const rx = 70 + i * 46 + rnd() * 20, ry = rx * (0.32 + rnd() * 0.16), rot = rnd() * 180;
    s += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="none" stroke="${pal.a}" stroke-opacity="0.14" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  // seeded star scatter
  for (let i = 0; i < 34; i++) {
    const x = rnd() * 400, y = rnd() * 230, r = rnd() * 1.5 + 0.4;
    const c = rnd() > 0.7 ? pal.a : "#f3f5fb";
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.18 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  s += `</svg>`;
  return s;
}

/* ---- build cards ---- */
const grid = $("catalog");
interface CardRef { el: HTMLAnchorElement; field: string; q: string; }
const cards: CardRef[] = [];
const flat = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

ORDER.forEach((slug, i) => {
  const d = DISCOVERIES[slug];
  if (!d) return;
  const title = d.title.replace(/<br\s*\/?>/g, " ");
  const a = document.createElement("a");
  a.className = "cat-card glass-soft glass-sheen";
  a.href = `/discoveries/${slug}/`;
  a.innerHTML =
    `<div class="cat-visual">${cardVisual(slug, d.field)}</div>` +
    `<div class="cat-body">` +
    `<div class="cat-top"><span class="cat-num">${String(i + 1).padStart(2, "0")}</span>` +
    `<span class="cat-field">${d.field}</span></div>` +
    `<h2 class="cat-title">${title}</h2>` +
    `<p class="cat-dek">${d.dek}</p>` +
    `<div class="cat-foot"><span>${d.era}</span><span class="cat-read">Read &nbsp;&#8594;</span></div>` +
    `</div>`;
  grid.appendChild(a);
  cards.push({ el: a, field: d.field, q: (flat(title) + " " + d.field + " " + flat(d.dek)).toLowerCase() });
});

/* ---- discipline filter chips ---- */
const filtersEl = $("cat-filters");
const fields = ["All", ...Array.from(new Set(ORDER.map(s => DISCOVERIES[s]?.field).filter(Boolean) as string[]))];
let activeField = "All";
let query = "";

const chips = fields.map(f => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "cat-chip" + (f === "All" ? " on" : "");
  b.textContent = f;
  b.setAttribute("aria-pressed", f === "All" ? "true" : "false");
  b.addEventListener("click", () => {
    activeField = f;
    chips.forEach(c => { const on = c.textContent === f; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    apply();
  });
  filtersEl.appendChild(b);
  return b;
});

/* ---- search ---- */
const q = $<HTMLInputElement>("cat-q");
const countEl = $("cat-count");
const emptyEl = $("cat-empty");
q.addEventListener("input", () => { query = q.value.trim().toLowerCase(); apply(); });

// "/" focuses search (unless already typing)
addEventListener("keydown", e => {
  const t = e.target as HTMLElement | null;
  if (e.key === "/" && !(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) { e.preventDefault(); q.focus(); }
});

function apply() {
  let shown = 0;
  for (const c of cards) {
    const ok = (activeField === "All" || c.field === activeField) && (query === "" || c.q.includes(query));
    c.el.hidden = !ok;
    if (ok) shown++;
  }
  emptyEl.hidden = shown !== 0;
  countEl.textContent = shown === cards.length
    ? `${shown} discoveries`
    : `${shown} of ${cards.length} ${shown === 1 ? "discovery" : "discoveries"}`;
}
apply();

/* mobile menu */
const bg = $("burger");
const mn = $("menu");
bg.setAttribute("aria-expanded", "false");
bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open");
  bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false");
  document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  mn.classList.remove("open");
  bg.classList.remove("x");
  document.body.style.overflow = "";
}));

/* ambient sound (opt-in) */
initSound($("sound"), { pad: true });

/* ⌘K command palette */
initCommandPalette();
