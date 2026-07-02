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
import { initSiteChrome } from "./site-chrome";
import { attachSpotlight } from "./spotlight";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

enableViewTransitions();
initSiteChrome();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* ---- the catalogue ----
   In production the cards, chips, and count are pre-rendered into the HTML
   (scripts/build-catalog.ts) so there is no layout shift and they paint
   immediately. Here we just hydrate: collect the nodes and wire filtering.
   In dev (no pre-render) we build them client-side from the data. */
const grid = $("catalog");
const filtersEl = $("cat-filters");
const q = $<HTMLInputElement>("cat-q");
const countEl = $("cat-count");
const emptyEl = $("cat-empty");

interface CardRef { el: HTMLAnchorElement; field: string; q: string; }
let cards: CardRef[] = [];
let chips: HTMLButtonElement[] = [];
let activeField = "All";
let query = "";

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

(async function hydrateCatalogue() {
  // Dev / no SSR: render the cards (and chips/count) from the data.
  if (!grid.querySelector(".cat-card")) {
    const [{ default: DISCOVERIES }, { ORDER, catalogCardHTML }] = await Promise.all([
      import("../data/discoveries"),
      import("./catalog-card"),
    ]);
    const present = ORDER.filter(s => DISCOVERIES[s]);
    grid.innerHTML = present.map((slug, i) => catalogCardHTML(slug, DISCOVERIES[slug]!, i)).join("");
    if (!filtersEl.querySelector(".cat-chip")) {
      const fields = ["All", ...Array.from(new Set(present.map(s => DISCOVERIES[s]!.field)))];
      filtersEl.innerHTML = fields
        .map(f => `<button type="button" class="cat-chip${f === "All" ? " on" : ""}" aria-pressed="${f === "All" ? "true" : "false"}">${f}</button>`)
        .join("");
    }
    if (!countEl.textContent) countEl.textContent = `${present.length} discoveries`;
  }

  cards = Array.from(grid.querySelectorAll<HTMLAnchorElement>(".cat-card")).map(el => ({
    el, field: el.dataset.field || "", q: el.dataset.q || "",
  }));
  chips = Array.from(filtersEl.querySelectorAll<HTMLButtonElement>(".cat-chip"));

  attachSpotlight(grid, ".cat-card");

  chips.forEach(b => b.addEventListener("click", () => {
    activeField = b.textContent || "All";
    chips.forEach(c => { const on = c === b; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    apply();
  }));

  q.addEventListener("input", () => { query = q.value.trim().toLowerCase(); apply(); });
  apply();
})();

// "/" focuses search (unless already typing)
addEventListener("keydown", e => {
  const t = e.target as HTMLElement | null;
  if (e.key === "/" && !(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) { e.preventDefault(); q.focus(); }
});

/* mobile menu */
/* surprise me → a random card from the catalogue */
$("cat-surprise").addEventListener("click", () => {
  const all = grid.querySelectorAll<HTMLAnchorElement>(".cat-card");
  if (all.length) location.href = all[Math.floor(Math.random() * all.length)]!.href;
});

/* ⌘K command palette — deferred off the critical path (it pulls the dataset) */
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
const iw = window as IdleWindow;
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 });
else setTimeout(loadPalette, 1200);
