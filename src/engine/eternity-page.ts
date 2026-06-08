/**
 * CELESTIUM — "The Whole of Time" page entry.
 * Shared chrome + the lazy-mounted cosmic flight. The written era list in
 * the HTML is the base experience (no-JS / reduced motion); when motion is
 * welcome the WebGL cosmos lights up.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();

const prog = $("prog");   // driven by the engine's playhead (the page itself doesn't scroll)

const bg = $("burger"), mn = $("menu");
bg.setAttribute("aria-expanded", "false"); bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open"); bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false"); document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { mn.classList.remove("open"); bg.classList.remove("x"); document.body.style.overflow = ""; }));

initSound($("sound"), { pad: true });
const iw = window as IdleWindow;
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 }); else setTimeout(loadPalette, 1200);

const section = document.getElementById("eternity");
const canvas = document.getElementById("et-canvas") as HTMLCanvasElement | null;
const cont = document.getElementById("et-continue");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && canvas && cont && !reduce) {
  import("./eternity")
    .then(m => {
      section.classList.add("live");
      document.body.style.overflow = "hidden";   // the experience is a fixed, self-playing stage
      m.mountEternity({
        canvas, cont, prog,
        age: $("et-age"), era: $("et-era"), temp: $("et-temp"), line: $("et-line"), marker: $("et-marker"),
      });
    })
    .catch(err => console.warn("The Whole of Time is unavailable; keeping the written eras.", err));
}
