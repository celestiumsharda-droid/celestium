/**
 * CELESTIUM — The Atlas page entry.
 * Shared chrome + the lazily-mounted Atlas engine. The written summary in
 * the HTML is the base experience (no-JS / no-WebGL / reduced motion);
 * when motion is welcome the live Solar System takes the stage.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();

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

// the dive-in: the intro holds until the visitor chooses to begin
const intro = document.getElementById("at-intro");
const introGo = document.getElementById("at-intro-go");
if (intro && introGo) {
  introGo.addEventListener("click", () => {
    intro.classList.add("gone");
    setTimeout(() => intro.remove(), 1200);
  });
}

const section = document.getElementById("atlas");
const canvas = document.getElementById("at-canvas") as HTMLCanvasElement | null;
const labels = document.getElementById("at-labels");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && canvas && labels && !reduce) {
  import("./atlas")
    .then(m => {
      section.classList.add("live");
      document.body.style.overflow = "hidden";   // the Atlas is a fixed, full-screen instrument
      m.mountAtlas({
        canvas, labels,
        name: $("at-name"), dist: $("at-dist"), line: $("at-line"),
        more: $("at-more"), sheet: $("at-sheet"), time: $("at-time"), date: $("at-date"),
        nav: $("at-nav"), consoleEl: $("at-console"), conList: $("at-con-list"),
        conSearch: $<HTMLInputElement>("at-con-search"), conClose: $("at-con-close"),
      });
    })
    .catch(err => console.warn("The Atlas is unavailable; keeping the written summary.", err));
}
