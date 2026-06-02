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
import { initCommandPalette, randomDiscoveryHref } from "./command-palette";
import { cardVisual } from "./card-visual";
import { attachSpotlight } from "./spotlight";
import DISCOVERIES from "../data/discoveries";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* curated cosmic-to-human order */
const ORDER = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background", "expanding-universe",
  "first-exoplanet", "double-slit", "periodic-table", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin", "vaccination",
];

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
  const vis = d.heroImage
    ? `<img class="cat-photo" src="/img/${d.heroImage.base}-720.webp" srcset="/img/${d.heroImage.base}-720.webp 720w, /img/${d.heroImage.base}-1280.webp 1280w" sizes="(max-width:600px) 100vw, 380px" alt="" loading="lazy" decoding="async">`
    : cardVisual(slug, d.field);
  a.innerHTML =
    `<div class="cat-visual">${vis}</div>` +
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

attachSpotlight(grid, ".cat-card");

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

/* surprise me → a random discovery */
$("cat-surprise").addEventListener("click", () => { location.href = randomDiscoveryHref(); });

/* ⌘K command palette */
initCommandPalette();
