import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { startClock, loadAPOD, renderTonightsPlanets, startISS, loadAurora } from "./living-sky";
import { initSound, playClick } from "./sound";
import { initCommandPalette } from "./command-palette";
import { cardVisual } from "./card-visual";
import { playIntro } from "./intro";
import { attachSpotlight } from "./spotlight";
import DISCOVERIES from "../data/discoveries";
import { STAGES } from "./cosmic-map/data";
import type { CosmicMap } from "./cosmic-map";
import TIMELINE from "../data/timeline";
import STORY from "../data/story";
import DEPTH_PREVIEW from "../data/depth-preview";
import EXPLORE from "../data/explore";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/* ---------- view transitions + starfield ---------- */
enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

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
  function syncChips(z: number) {
    const active = Math.round(z);
    if (active === activeChip) return; // skip DOM writes when nothing changed
    activeChip = active;
    chips.forEach((c, i) => c.classList.toggle("on", i === active));
  }

  function onScrollZoom() {
    const z = progress() * lastIdx;
    if (map) map.setZoom(z);
    syncChips(z);
  }

  // Lazy-load Three.js + the map module when the section is close.
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
  }, { rootMargin: "400px 0px" });
  loadIO.observe(track);

  addEventListener("scroll", onScrollZoom, { passive: true });
  addEventListener("resize", onScrollZoom);
})();

/* ---------- timeline ---------- */
const rail = document.querySelector<HTMLElement>(".tlrail")!;
TIMELINE.forEach((e, i) => {
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

/* ---------- scrollytelling ---------- */
const steps = $("steps");
STORY.forEach(s => {
  const d = document.createElement("div");
  d.className = "step";
  d.innerHTML = `<div class="k">${s.k}</div><h3>${s.h}</h3><p>${s.p}</p>`;
  steps.appendChild(d);
});
const cta = document.createElement("div");
cta.className = "step";
cta.innerHTML =
  '<div class="k">The full account</div><h3>Read the whole discovery.</h3>' +
  "<p>The Earth-sized telescope, the petabytes flown on aircraft, the ring that proved Einstein right — at the depth you choose.</p>" +
  '<a href="/discoveries/black-hole-image/" class="btn fill" style="margin-top:30px;display:inline-block">Open the discovery →</a>';
steps.appendChild(cta);

const stEls = steps.querySelectorAll<HTMLElement>(".step");
const bh = $("bh");
const sio = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    stEls.forEach(x => x.classList.remove("on"));
    e.target.classList.add("on");
    const idx = Array.prototype.indexOf.call(stEls, e.target);
    bh.classList.toggle("lit", idx >= 2);
    bh.style.transform = `scale(${1 + idx * 0.05})`;
  }
}), { threshold: 0.55 });
stEls.forEach(el => sio.observe(el));

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
   The clock and computed planet positions are cheap and start at once.
   The network fetches (NASA APOD, ISS, NOAA aurora) are deferred until
   the section is near the viewport — so they don't compete with the
   first paint, and a rate-limited APOD response never logs during the
   audited load of a visitor who hasn't scrolled there yet. */
startClock();
renderTonightsPlanets($("planets-card"));

let skyLoaded = false;
function loadSky() {
  if (skyLoaded) return;
  skyLoaded = true;
  loadAPOD($("apod-card"));
  startISS($("iss-card"));
  loadAurora($("aurora-card"));
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

/* ---------- explore grid ---------- */
const grid = $("grid");
EXPLORE.forEach(g => {
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
  grid.appendChild(a);
});
attachSpotlight(grid, ".cell");

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

/* ---------- ⌘K command palette ---------- */
initCommandPalette();
