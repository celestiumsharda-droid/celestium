/**
 * CELESTIUM — "The Whole of Time" page entry.
 * Shared chrome + the lazy-mounted cosmic flight. The written era list in
 * the HTML is the base experience (no-JS / reduced motion); when motion is
 * welcome the WebGL cosmos lights up.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSiteChrome } from "./site-chrome";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();
initSiteChrome();

const prog = $("prog");   // driven by the engine's playhead (the page itself doesn't scroll)
const iw = window as IdleWindow;
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 }); else setTimeout(loadPalette, 1200);

const section = document.getElementById("eternity");
const canvas = document.getElementById("et-canvas") as HTMLCanvasElement | null;
const cont = document.getElementById("et-continue");
const startOverlay = document.getElementById("et-start");
const beginBtn = document.getElementById("et-begin");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && canvas && cont && startOverlay && beginBtn && !reduce) {
  import("./eternity")
    .then(m => {
      section.classList.add("live");
      document.body.style.overflow = "hidden";   // the experience is a fixed, self-playing stage
      m.mountEternity({
        canvas, cont, prog, startOverlay, begin: beginBtn,
        age: $("et-age"), era: $("et-era"), tiles: $("et-tiles"), line: $("et-line"), marker: $("et-marker"),
      });
    })
    .catch(err => console.warn("The Whole of Time is unavailable; keeping the written eras.", err));
}
