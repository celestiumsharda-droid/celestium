/**
 * CELESTIUM — DISCOVERIES INDEX
 * Renders the full catalogue of articles from the single source of
 * truth (data/discoveries) in a curated reading order.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";
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

const grid = $("catalog");
ORDER.forEach((slug, i) => {
  const d = DISCOVERIES[slug];
  if (!d) return;
  const title = d.title.replace(/<br\s*\/?>/g, " ");
  const a = document.createElement("a");
  a.className = "cat-card";
  a.href = `/discoveries/${slug}/`;
  a.innerHTML =
    `<div class="cat-top"><span class="cat-num">${String(i + 1).padStart(2, "0")}</span>` +
    `<span class="cat-field">${d.field}</span></div>` +
    `<h2 class="cat-title">${title}</h2>` +
    `<p class="cat-dek">${d.dek}</p>` +
    `<div class="cat-foot"><span>${d.era}</span><span class="cat-read">Read &nbsp;&#8594;</span></div>`;
  grid.appendChild(a);
});

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
