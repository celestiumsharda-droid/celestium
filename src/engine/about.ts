/**
 * CELESTIUM — ABOUT page engine.
 * Just the shared chrome: starfield, view transitions, theme toggle,
 * command palette, ambient sound and the mobile menu.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";
import { initCommandPalette } from "./command-palette";

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

initSound($("sound"), { pad: true });
initCommandPalette();
