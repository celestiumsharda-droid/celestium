import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { startClock, loadAPOD, startISS } from "./living-sky";
import { initSound, playClick } from "./sound";
import { cardVisual } from "./card-visual";
import { playIntro } from "./intro";
import { attachSpotlight } from "./spotlight";
import { STAGES } from "./cosmic-map/data";
import type { CosmicMap } from "./cosmic-map";
import DEPTH_PREVIEW from "../data/depth-preview";
import EXPLORE from "../data/explore";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/* ---------- view transitions + starfield ---------- */
enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* ---------- hero pointer-parallax (depth) ----------
   The orbit ring drifts toward the pointer and the wordmark counter-drifts,
   giving the hero a tactile 3D feel. Eased, rAF-gated, off on touch/reduced. */
(function heroParallax() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(hover: none)").matches) return;
  const orbit = document.querySelector<HTMLElement>(".orbit");
  const title = document.querySelector<HTMLElement>(".hero h1");
  if (!orbit) return;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const loop = () => {
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;
    orbit.style.transform = `translate(-50%, -58%) translate(${(x * 24).toFixed(1)}px, ${(y * 24).toFixed(1)}px)`;
    if (title) title.style.transform = `translate(${(x * -9).toFixed(1)}px, ${(y * -9).toFixed(1)}px)`;
    raf = (Math.abs(tx - x) > 0.0008 || Math.abs(ty - y) > 0.0008) ? requestAnimationFrame(loop) : 0;
  };
  addEventListener("pointermove", e => {
    if (scrollY > innerHeight) return;                 // only while the hero is in view
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
})();

/* ---------- nav + progress + reveals ---------- */
const nav = $("nav");
const prog = $("prog");
function onScroll() {
  const sc = scrollY;
  nav.classList.toggle("solid", sc > 80);
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? sc / h : 0})`;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* count-up: a static number ticks up to its value. The real value stays
   in the HTML, so if this never runs the number is simply shown. */
function countUp(el: HTMLElement): void {
  if (el.dataset["done"] || reduceMotion) return;
  el.dataset["done"] = "1";
  const target = parseFloat(el.dataset["count"] || "0");
  const dec = parseInt(el.dataset["dec"] || "0", 10);
  const t0 = performance.now(), dur = 1300;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(dec);
  };
  requestAnimationFrame(step);
}

// Reveal-on-scroll. Piggybacks the count-up onto the same observer so the
// numbers tick up exactly when their card fades in.
const io = new IntersectionObserver(
  es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll<HTMLElement>(".cnt[data-count]").forEach(countUp);
  }),
  { threshold: 0.15 }
);
document.querySelectorAll<HTMLElement>(".reveal").forEach(el => io.observe(el));

/* ---------- hero letters ---------- */
const ttl = $("title");
const txt = ttl.textContent ?? "";
ttl.textContent = "";
txt.split("").forEach((ch, i) => {
  const sp = document.createElement("span");
  sp.textContent = ch;
  sp.style.animationDelay = (0.05 + i * 0.06) + "s";
  ttl.appendChild(sp);
});
// The cinematic intro lifts, then hands off to the hero letters.
playIntro(() => ttl.classList.add("go"));

// Magnetic hero buttons — they lean gently toward the cursor (desktop).
// The rest-position rect is cached on enter, so pointermove only writes a
// transform (no per-frame layout read).
if (!matchMedia("(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll<HTMLElement>(".herocta .btn").forEach(btn => {
    let r: DOMRect | null = null;
    btn.addEventListener("pointerenter", () => { r = btn.getBoundingClientRect(); });
    btn.addEventListener("pointermove", (e: PointerEvent) => {
      if (!r) r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.transform = `translate(${(dx * 7).toFixed(1)}px, ${(dy * 7).toFixed(1)}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; r = null; });
  });
}

/* ---------- perspective: 3D cosmic map ----------
   The Perspective section is a tall, pinned track. Page-scroll over it
   drives a single zoom scalar in [0, STAGES-1]; Three.js is lazy-loaded
   only when the section nears, so it never blocks first paint. */
(function perspective() {
  const trackEl = document.getElementById("persp-track");
  const canvas = document.getElementById("cosmic") as HTMLCanvasElement | null;
  const fallback = document.getElementById("persp-fallback");
  const chipWrap = document.getElementById("cm-stages");
  if (!trackEl || !canvas || !chipWrap) return;
  const track: HTMLElement = trackEl;   // non-null for the closures below

  const N = STAGES.length;
  const lastIdx = N - 1;

  // Build stage chips (also the accessible / keyboard control surface).
  const chips: HTMLButtonElement[] = STAGES.map((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cm-chip" + (i === 0 ? " on" : "");
    b.textContent = s.name.replace(/^The\s+/, "").replace(/,.*$/, "");
    b.setAttribute("aria-label", `Jump to ${s.name}`);
    b.addEventListener("click", () => {
      playClick();
      const total = track.offsetHeight - innerHeight;
      const top = track.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + (i / lastIdx) * total, behavior: "smooth" });
    });
    chipWrap.appendChild(b);
    return b;
  });

  function progress(): number {
    const total = track.offsetHeight - innerHeight;
    if (total <= 0) return 0;
    const scrolled = -track.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, scrolled / total));
  }

  let map: CosmicMap | null = null;
  let loading = false;

  let activeChip = -1;
  const perspHead = document.querySelector<HTMLElement>(".persp-head");
  function syncChips(z: number) {
    const active = Math.round(z);
    if (active === activeChip) return; // skip DOM writes when nothing changed
    activeChip = active;
    chips.forEach((c, i) => c.classList.toggle("on", i === active));
    // the big section headline belongs to the OPENING of the journey —
    // fade it away once the visitor has zoomed past Earth, so it never
    // collides with the info panel at deeper levels.
    if (perspHead) perspHead.classList.toggle("away", active > 0);
  }

  function onScrollZoom() {
    const z = progress() * lastIdx;
    if (map) map.setZoom(z);
    syncChips(z);
  }

  // Lazy-load Three.js + the map module. The perspective section sits one
  // screen below the hero, so we deliberately do NOT preload it at first
  // paint (that's ~0.5MB of Three.js parsing on the main thread, the home's
  // biggest blocking cost). Instead it loads the moment the section enters
  // the viewport — i.e. as soon as the visitor begins to scroll — while the
  // static fallback holds the frame until then. rootMargin 0 keeps it off
  // the initial-load critical path.
  const loadIO = new IntersectionObserver(async entries => {
    if (!entries.some(e => e.isIntersecting) || map || loading) return;
    loading = true;
    try {
      const mod = await import("./cosmic-map");
      map = mod.mountCosmicMap(canvas, {
        level: $("cm-level"),
        name: $("cm-name"),
        desc: $("cm-desc"),
        readout: $("cm-readout"),
        live: $("cm-live"),
      });
      if (fallback) fallback.style.display = "none";
      requestAnimationFrame(() => { map!.resize(); onScrollZoom(); });
    } catch (err) {
      console.warn("Cosmic map unavailable; showing fallback.", err);
      loading = false; // allow a retry on a later intersection
    }
  }, { rootMargin: "0px 0px" });
  loadIO.observe(track);

  addEventListener("scroll", onScrollZoom, { passive: true });
  addEventListener("resize", onScrollZoom);
})();

/* ---------- depth preview ---------- */
const rbody = $("rbody");
const tog = $("toggle");
function renderDepth(l: number) {
  rbody.innerHTML =
    DEPTH_PREVIEW[l]!.join("") +
    `<div class="rmeta">READING DEPTH ${l + 1} / 3 · SAME FACTS · YOUR ALTITUDE</div>`;
}
tog.querySelectorAll<HTMLButtonElement>("button").forEach(b => {
  b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false");
  b.addEventListener("click", () => {
    tog.querySelectorAll<HTMLButtonElement>("button").forEach(o => {
      o.classList.remove("on");
      o.setAttribute("aria-pressed", "false");
    });
    b.classList.add("on");
    b.setAttribute("aria-pressed", "true");
    playClick();
    renderDepth(Number(b.dataset["l"]));
  });
});
renderDepth(0);

/* ---------- living sky ----------
   The clock and the live "deep universe pouring through you" counters are
   cheap and start at once. The network fetches (NASA APOD, ISS) are deferred
   until the section nears the viewport, so they never compete with first
   paint or log a rate-limited response for a visitor who never scrolls there. */
startClock();
startCosmicCounters();

/** Humanise a large running tally: 12,345 → "12,345"; 7.7e15 → "7.7 quadrillion". */
function humanize(n: number): string {
  const U: [string, number][] = [["quintillion", 1e18], ["quadrillion", 1e15], ["trillion", 1e12], ["billion", 1e9], ["million", 1e6]];
  for (const [name, v] of U) if (n >= v) return `${(n / v).toFixed(n / v < 100 ? 1 : 0)} ${name}`;
  return Math.floor(n).toLocaleString();
}
/** The deep universe, streaming through you in real time since the page opened. */
function startCosmicCounters() {
  const t0 = performance.now();
  const ph = document.getElementById("cmb-photons");
  const di = document.getElementById("cmb-dist");
  const nu = document.getElementById("nu-count");
  if (!ph && !di && !nu) return;
  const CMB = 7.7e15;    // ancient CMB photons through a human body, per second
  const NEU = 6.5e10;    // solar neutrinos through a fingertip (~1 cm²), per second
  const SPD = 370;       // km/s, the Sun's motion relative to the CMB rest frame
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    if (ph) ph.textContent = humanize(CMB * s);
    if (nu) nu.textContent = humanize(NEU * s);
    if (di) di.textContent = (SPD * s < 1e6) ? `${Math.floor(SPD * s).toLocaleString()}` : `${(SPD * s / 1e6).toFixed(2)} million`;
    setTimeout(tick, 110);
  };
  tick();
}

let skyLoaded = false;
function loadSky() {
  if (skyLoaded) return;
  skyLoaded = true;
  loadAPOD($("apod-card"));
  startISS($("iss-card"));
}
const skySec = document.getElementById("sky-sec");
if (skySec && "IntersectionObserver" in window) {
  const skyObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { loadSky(); skyObs.disconnect(); }
  }), { rootMargin: "600px 0px" });
  skyObs.observe(skySec);
} else {
  loadSky();
}

/* ---------- ambient sound (opt-in) ---------- */
initSound($("sound"), { pad: true });

/* ---------- explore grid (deferred) ----------
   The grid lives well below the fold and is the only thing on the home
   that needs the full discovery dataset (~130KB of article bodies). We
   dynamic-import it as the section approaches, so it never weighs on the
   first paint or the main thread during the critical window. */
const grid = $("grid");
let exploreBuilt = false;
async function buildExplore() {
  if (exploreBuilt) return;
  exploreBuilt = true;
  const DISCOVERIES = (await import("../data/discoveries")).default;
  const frag = document.createDocumentFragment();
  // A curated opening set — the full archive lives on /discoveries/.
  // Skip pieces the visitor has ALREADY seen on this page (the featured
  // card and the depth-preview article), so the homepage never repeats itself.
  const seenAbove = new Set(["gravitational-waves", "weighing-the-universe"]);
  EXPLORE.filter(g => !seenAbove.has(g.slug)).slice(0, 6).forEach(g => {
    const a = document.createElement("a");
    a.className = "cell";
    a.href = `/discoveries/${g.slug}/`;
    const hi = DISCOVERIES[g.slug]?.heroImage;
    const art = hi
      ? `<img class="cat-photo" src="/img/${hi.base}-720.webp" srcset="/img/${hi.base}-720.webp 720w, /img/${hi.base}-1280.webp 1280w" sizes="(max-width:900px) 100vw, 420px" alt="" loading="lazy" decoding="async">`
      : cardVisual(g.slug, g.field);
    a.innerHTML =
      `<div class="cell-art">${art}</div>` +
      `<div class="cell-in">` +
      `<div class="field">${g.field}</div><h3>${g.title}</h3>` +
      `<div class="read">${g.cta} &nbsp;→</div>` +
      `</div>`;
    frag.appendChild(a);
  });
  grid.appendChild(frag);
  attachSpotlight(grid, ".cell");
}
if (grid && "IntersectionObserver" in window) {
  const exObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { buildExplore(); exObs.disconnect(); }
  }), { rootMargin: "700px 0px" });
  exObs.observe(grid);
} else {
  buildExplore();
}

/* ---------- mobile menu ---------- */
const bg = $<HTMLButtonElement>("burger");
const mn = $("menu");
bg.setAttribute("aria-expanded", "false");
bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open");
  bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false");
  document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll<HTMLAnchorElement>("a").forEach(a => a.addEventListener("click", () => {
  mn.classList.remove("open");
  bg.classList.remove("x");
  bg.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}));

/* ---------- ⌘K command palette (deferred off the critical path) ----------
   Not needed for first paint, and it pulls in the discovery dataset — so we
   load + initialise it once the browser goes idle (with a hard timeout so it
   never waits too long). The nav search button appears a beat after load. */
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
const iw = window as IdleWindow;
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 });
else setTimeout(loadPalette, 1200);
