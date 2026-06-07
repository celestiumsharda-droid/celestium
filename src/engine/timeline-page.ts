/**
 * CELESTIUM — the Timeline page ("Two clocks, one story" / Genesis).
 * Its own full-screen home for the particle journey: shared chrome, the
 * accessible list fallback, and the lazy-mounted Genesis experience.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";
import TIMELINE from "../data/timeline";

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

/* the accessible fallback list (also what reduced-motion users get) */
const rail = document.querySelector<HTMLElement>(".tlrail");
if (rail) TIMELINE.forEach((e, i) => {
  const r = document.createElement("div");
  r.className = "tlrow";
  if (i === 0) r.classList.add("act");
  const link = e.id
    ? `<a href="/discoveries/${e.id}/" class="discov" style="display:block;width:fit-content;margin-top:18px;color:var(--accent);border-color:var(--accent-dim)" onclick="event.stopPropagation()">Read the full discovery &nbsp;→</a>`
    : "";
  r.innerHTML =
    `<div class="when">${e.w}</div><div class="knot"></div>` +
    `<h3>${e.t}</h3><div class="body"><p>${e.b}</p>` +
    `<span class="discov">How we know — ${e.d}</span>${link}</div>`;
  r.addEventListener("click", () => {
    const was = r.classList.contains("act");
    rail.querySelectorAll(".tlrow").forEach(o => o.classList.remove("act"));
    if (!was) r.classList.add("act");
  });
  rail.appendChild(r);
});

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

/* mount the Genesis experience (unless reduced motion / no canvas) */
const section = document.getElementById("timeline");
const track = document.getElementById("tl-track");
const canvas = document.getElementById("tl-canvas") as HTMLCanvasElement | null;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && track && canvas && !reduce) {
  import("./timeline")
    .then(m => {
      section.classList.add("spiral");
      m.mountTimeline({
        canvas, track,
        card: document.getElementById("tl-card")!,
        gap: document.getElementById("tl-gap")!,
        data: TIMELINE,
      });
    })
    .catch(err => console.warn("Timeline unavailable; keeping the list.", err));
}
