/**
 * CELESTIUM — "You Are Stardust" page entry.
 * Shared chrome + the lazy-mounted particle journey. The written chapters
 * in the HTML are the base experience (no-JS / reduced motion); when motion
 * is welcome we light up the canvas and tuck the prose into the a11y tree.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();

/* progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* mobile menu */
const bg = $("burger"), mn = $("menu");
bg.setAttribute("aria-expanded", "false");
bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open");
  bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false");
  document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  mn.classList.remove("open"); bg.classList.remove("x"); document.body.style.overflow = "";
}));

/* ambient sound + command palette (deferred) */
initSound($("sound"), { pad: true });
const iw = window as IdleWindow;
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 }); else setTimeout(loadPalette, 1200);

/* mount the particle journey (unless reduced motion) */
const section = document.getElementById("stardust");
const track = document.getElementById("sd-track");
const canvas = document.getElementById("sd-canvas") as HTMLCanvasElement | null;
const caption = document.getElementById("sd-caption");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && track && canvas && caption && !reduce) {
  import("./stardust")
    .then(m => {
      section.classList.add("live");
      m.mountStardust({ canvas, track, caption });
    })
    .catch(err => console.warn("Stardust unavailable; keeping the written journey.", err));
}
