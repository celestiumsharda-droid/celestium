/**
 * CELESTIUM — ABOUT page engine.
 * Just the shared chrome: starfield, view transitions, theme toggle,
 * command palette, ambient sound and the mobile menu.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSiteChrome } from "./site-chrome";
import { initCommandPalette } from "./command-palette";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
initSiteChrome();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

initCommandPalette();
