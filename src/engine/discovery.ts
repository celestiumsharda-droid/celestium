import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import DISCOVERIES from "../data/discoveries";
import RELATED_INDEX from "./related-index";
import { expandFragments } from "./fragments";
import { sourcesHTML } from "./sources";
import { initCommandPalette } from "./command-palette";
import { initSound, playClick } from "./sound";
import type { Discovery } from "./types";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/* ---------- view transitions + starfield ---------- */
enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: false });

/* ---------- scroll progress ---------- */
const prog = $("prog");
function onScroll() {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
}
addEventListener("scroll", onScroll, { passive: true });

/* ---------- block scroll-reveal (figures, stats, pulls, know-boxes) ---------- */
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const blockReveal = new IntersectionObserver(
  es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); blockReveal.unobserve(e.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
);
function revealBlocks(root: HTMLElement) {
  if (reducedMotion) return;                          // respect the user's preference
  root.querySelectorAll<HTMLElement>("figure, .stats, .pull, .know:not(.depthnote)").forEach(el => {
    el.classList.add("reveal-block");
    blockReveal.observe(el);
  });
}

/* ---------- resolve which discovery to render ----------
   Priority:
     1. <meta name="celestium:slug" content="…"> baked in at build
     2. /discoveries/<slug>/ path (production pretty path AND the dev
        server's rewritten path — see vite.config.ts)
     3. ?id=<slug>  (legacy querystring)
     4. #<slug>     (anchor form)
   Falls back to "black-hole-image" if nothing matches. */
function resolveSlug(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="celestium:slug"]');
  if (meta && meta.content && DISCOVERIES[meta.content]) return meta.content;

  const pathMatch = location.pathname.match(/\/discoveries\/([^/]+)\/?$/);
  if (pathMatch && pathMatch[1] && DISCOVERIES[pathMatch[1]]) return pathMatch[1];

  try {
    const u = new URLSearchParams(location.search).get("id");
    if (u && DISCOVERIES[u]) return u;
  } catch (_e) { /* swallow */ }

  const h = location.hash.replace(/^#/, "");
  if (h && DISCOVERIES[h]) return h;

  return "black-hole-image";
}

const id = resolveSlug();
const D = DISCOVERIES[id] as Discovery;

/* ---------- hero ---------- */
document.title = D.title.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() + " — Celestium";
$("kick").innerHTML = D.kick;
$("title").innerHTML = D.title;
$("dek").innerHTML = D.dek;
$("byl").innerHTML =
  `<span><b>Field</b> &nbsp;${D.field}</span>` +
  `<span><b>Era</b> &nbsp;${D.era}</span>` +
  `<span><b>Subject</b> &nbsp;${D.subject}</span>` +
  (D.byline ? `<span><b>By</b> &nbsp;${D.byline}</span>` : "");

const ha = $("heroart");
switch (D.hero) {
  case "wave":
    ha.innerHTML = '<div class="v-wave"><i></i><i></i><i></i><i></i><b></b></div>';
    break;
  case "wobble":
    ha.innerHTML =
      '<div class="v-wobble">' +
      '<div class="orbit-ring"></div>' +
      '<div class="orbiter"><span class="planet"></span></div>' +
      '<div class="sun"></div>' +
      "</div>";
    break;
  case "web": {
    const nodes: [number, number][] = [[40,60],[150,48],[168,120],[96,166],[34,140],[110,96],[72,40],[130,150]];
    const edges: [number, number][] = [[0,5],[1,5],[2,5],[3,5],[4,5],[5,6],[5,7],[0,6],[1,2],[3,4]];
    let g = "";
    for (const [a, b] of edges) {
      g += `<line class="fl" x1="${nodes[a]![0]}" y1="${nodes[a]![1]}" x2="${nodes[b]![0]}" y2="${nodes[b]![1]}"/>`;
    }
    nodes.forEach((q, i) => {
      g += `<circle class="nd" cx="${q[0]}" cy="${q[1]}" r="${i === 5 ? 5 : 3.4}"/>`;
    });
    ha.innerHTML =
      '<div class="v-web"><svg viewBox="0 0 200 200" role="img" aria-label="Cosmic web schematic.">' +
      '<circle class="gl" cx="100" cy="100" r="86"/><circle class="gl" cx="100" cy="100" r="54"/>' +
      g + "</svg></div>";
    break;
  }
  case "deep-field": {
    // a seeded field of distant galaxies — deterministic so it never flickers
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const cols = ["#f3f5fb", "#a9bcff", "#f2e6c4", "#cdd9ff"];
    let s = '<div class="v-deepfield"><svg viewBox="0 0 200 200" role="img" aria-label="A deep field of distant galaxies.">';
    for (let i = 0; i < 120; i++) {
      const x = rnd() * 200, y = rnd() * 200;
      const dc = Math.hypot(x - 100, y - 100);
      if (dc > 95) continue;                       // soft circular vignette
      const r = rnd() * 1.6 + 0.4;
      const c = cols[Math.floor(rnd() * cols.length)];
      const o = (0.3 + rnd() * 0.7) * (1 - dc / 130);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${o.toFixed(2)}"/>`;
    }
    s += '<ellipse cx="72" cy="82" rx="11" ry="4" fill="none" stroke="rgba(169,188,255,.4)" transform="rotate(24 72 82)"/>';
    s += '<ellipse cx="130" cy="122" rx="8" ry="3" fill="none" stroke="rgba(242,230,196,.34)" transform="rotate(-16 130 122)"/>';
    s += "</svg></div>";
    ha.innerHTML = s;
    break;
  }
  case "helix": {
    const A = 42, cx = 70, k = 0.05, gap = 22, yMax = 384;
    let back1 = "", back2 = "", rungs = "";
    for (let y = 0; y <= yMax; y += 4) {
      const ph = y * k;
      back1 += (y === 0 ? "M" : "L") + (cx + A * Math.sin(ph)).toFixed(1) + " " + y + " ";
      back2 += (y === 0 ? "M" : "L") + (cx + A * Math.sin(ph + Math.PI)).toFixed(1) + " " + y + " ";
    }
    const cols = ["#a9bcff", "#f2e6c4", "#9ee6c4", "#ff9ec4"];
    for (let y = 0, n = 0; y <= yMax; y += gap, n++) {
      const ph = y * k;
      const x1 = cx + A * Math.sin(ph), x2 = cx + A * Math.sin(ph + Math.PI);
      const front = Math.cos(ph) >= 0;
      const c = cols[n % cols.length];
      rungs += `<line x1="${x1.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}" stroke="${c}" stroke-width="${front ? 3 : 2}" opacity="${front ? 0.85 : 0.3}" stroke-linecap="round"/>`;
    }
    ha.innerHTML =
      '<div class="v-helix"><svg viewBox="0 0 140 256" role="img" aria-label="A rotating DNA double helix."><g class="helix-flow">' +
      `<path d="${back1}" fill="none" stroke="#dfe6ff" stroke-width="2.4" opacity=".8"/>` +
      `<path d="${back2}" fill="none" stroke="#dfe6ff" stroke-width="2.4" opacity=".5"/>` +
      rungs + "</g></svg></div>";
    break;
  }
  case "cmb": {
    // a Mollweide-style microwave sky: soft, mottled temperature ripples
    let seed = 9;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const cols = ["#5b6cae", "#a9bcff", "#7d6f8f", "#cdd9ff", "#8a93b8", "#f2e6c4"];
    let s = '<div class="v-cmb"><svg viewBox="0 0 200 200" role="img" aria-label="A map of the cosmic microwave background — faint temperature ripples across the whole sky.">';
    s += '<defs><clipPath id="cmbclip"><ellipse cx="100" cy="100" rx="92" ry="62"/></clipPath>' +
         '<filter id="cmbblur"><feGaussianBlur stdDeviation="5"/></filter></defs>';
    s += '<g clip-path="url(#cmbclip)" filter="url(#cmbblur)"><rect width="200" height="200" fill="#2c3354"/>';
    for (let i = 0; i < 190; i++) {
      const x = rnd() * 200, y = rnd() * 200, r = rnd() * 13 + 6;
      const c = cols[Math.floor(rnd() * cols.length)];
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.16 + rnd() * 0.22).toFixed(2)}"/>`;
    }
    s += '</g><ellipse cx="100" cy="100" rx="92" ry="62" fill="none" stroke="rgba(243,245,251,.18)"/></svg></div>';
    ha.innerHTML = s;
    break;
  }
  case "seafloor": {
    let s = '<div class="v-seafloor"><svg viewBox="0 0 200 200" role="img" aria-label="Magnetic stripes spreading symmetrically from a mid-ocean ridge.">';
    s += '<defs><clipPath id="sfclip"><circle cx="100" cy="100" r="92"/></clipPath></defs>';
    s += '<g clip-path="url(#sfclip)"><rect width="200" height="200" fill="#0c0f18"/>';
    const ws = [12, 9, 16, 8, 18, 11, 15, 9, 14];
    let off = 0;
    ws.forEach((w, i) => {
      const col = i % 2 === 0 ? "#33406c" : "#161b2b";
      s += `<rect x="${100 + off}" y="0" width="${w}" height="200" fill="${col}"/>`;
      s += `<rect x="${100 - off - w}" y="0" width="${w}" height="200" fill="${col}"/>`;
      off += w;
    });
    s += '<rect x="98" y="0" width="4" height="200" fill="#f2e6c4"/></g>';
    s += '<circle cx="100" cy="100" r="92" fill="none" stroke="rgba(243,245,251,.16)"/></svg></div>';
    ha.innerHTML = s;
    break;
  }
  case "culture": {
    let seed = 5;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const cx = 100, cy = 100, R = 88, mx = 100, my = 66, clearR = 34, mouldR = 13;
    let s = '<div class="v-culture"><svg viewBox="0 0 200 200" role="img" aria-label="A petri dish with a clear ring around a colony of mould.">';
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#0c0e14" stroke="rgba(243,245,251,.16)" stroke-width="1.5"/>`;
    for (let i = 0; i < 340; i++) {
      const x = cx + (rnd() * 2 - 1) * R, y = cy + (rnd() * 2 - 1) * R;
      if (Math.hypot(x - cx, y - cy) > R - 6) continue;
      if (Math.hypot(x - mx, y - my) < clearR) continue;
      const r = rnd() * 0.9 + 0.4;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#7e879b" opacity="${(0.22 + rnd() * 0.4).toFixed(2)}"/>`;
    }
    s += `<circle cx="${mx}" cy="${my}" r="${clearR}" fill="none" stroke="rgba(242,230,196,.16)" stroke-dasharray="2 4"/>`;
    s += `<circle cx="${mx}" cy="${my}" r="${mouldR}" fill="#f2e6c4" opacity=".85"/>`;
    s += `<circle cx="${mx}" cy="${my}" r="${mouldR - 5}" fill="none" stroke="rgba(12,14,20,.4)"/></svg></div>`;
    ha.innerHTML = s;
    break;
  }
  default:
    ha.innerHTML = '<div class="v-bh"><div class="disk"></div><div class="ring"></div><div class="core"></div></div>';
}

// A real photograph, when present, replaces the motif as a full-bleed banner.
if (D.heroImage) {
  const im = D.heroImage;
  ha.className = "ahero-media is-photo";
  ha.innerHTML =
    "<picture>" +
    `<source type="image/avif" srcset="/img/${im.base}-720.avif 720w, /img/${im.base}-1280.avif 1280w" sizes="100vw">` +
    `<source type="image/webp" srcset="/img/${im.base}-720.webp 720w, /img/${im.base}-1280.webp 1280w" sizes="100vw">` +
    `<img src="/img/${im.base}-1280.jpg" srcset="/img/${im.base}-720.jpg 720w, /img/${im.base}-1280.jpg 1280w" sizes="100vw" width="${im.w}" height="${im.h}" alt="${im.alt}" decoding="async">` +
    "</picture>" +
    `<div class="ahero-credit">${im.credit}</div>`;
} else {
  ha.className = "ahero-media is-motif";
}

/* ---------- depth render ---------- */
const TAGS = [
  "The Glance — the essence in twenty seconds",
  "The Curious Read — the story, with the mechanism",
  "The Deep Dive — the full physics and the safeguards",
] as const;

const body = $("abody");
const lt = $("lvltag");
const seg = $("seg");
body.style.transition = "opacity .35s";

// Dynamic, per-article reading time on each depth button.
const DEPTH_NAMES = ["Glance", "Curious", "Deep"] as const;
function readTime(l: number): string {
  const words = expandFragments(D.depths[l] ?? [])
    .replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ")
    .split(/\s+/).filter(Boolean).length;
  const secs = (words / 220) * 60;
  return secs < 75 ? `${Math.max(15, Math.round(secs / 15) * 15)}s` : `${Math.max(1, Math.round(secs / 60))}m`;
}
seg.querySelectorAll<HTMLButtonElement>("button").forEach((b, i) => {
  b.textContent = `${DEPTH_NAMES[i]} · ${readTime(i)}`;
});

const DEPTH_KEY = "celestium:depth";

function renderDepth(l: number) {
  body.style.opacity = "0";
  setTimeout(() => {
    body.innerHTML =
      expandFragments(D.depths[l] ?? []) +
      `<div class="know depthnote"><div class="kh">Same discovery · depth ${l + 1} of 3</div>` +
      "<p>This is the identical fact set, re-told at a different altitude. Switch any time — the reader keeps your place in the idea, not the prose.</p></div>";
    lt.textContent = TAGS[l] ?? "";
    body.style.opacity = "1";
    let n = 0;
    body.querySelectorAll<HTMLParagraphElement>("p").forEach(p => {
      if (p.closest(".know") || p.closest(".pull")) return;
      p.style.animation = "none";
      void p.offsetHeight; // reflow so restart fires
      p.style.animation = `fade .8s ${(n * 0.04)}s forwards`;
      n++;
    });
    revealBlocks(body);
    onScroll();
  }, 180);
}

seg.querySelectorAll<HTMLButtonElement>("button").forEach(b => {
  b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false");
  b.addEventListener("click", () => {
    seg.querySelectorAll<HTMLButtonElement>("button").forEach(o => {
      o.classList.remove("on");
      o.setAttribute("aria-pressed", "false");
    });
    b.classList.add("on");
    b.setAttribute("aria-pressed", "true");
    playClick();
    const lvl = Number(b.dataset["l"]);
    try { localStorage.setItem(DEPTH_KEY, String(lvl)); } catch (_e) { /* private mode */ }
    renderDepth(lvl);
    const y = document.querySelector("article")!.getBoundingClientRect().top + scrollY - 104;
    if (scrollY > y) scrollTo({ top: y, behavior: "smooth" });
  });
});
// The build pre-renders the Glance into #abody for crawlers / no-JS.
// If it's already there, hydrate without re-rendering (no flash); just
// wire up the scroll-reveal for the pre-rendered blocks.
if (body.innerHTML.trim()) {
  revealBlocks(body);
} else {
  renderDepth(0);
}

// Resume at the reader's preferred altitude: if they last chose Curious
// or Deep, open there instead of the Glance.
try {
  const pref = Number(localStorage.getItem(DEPTH_KEY));
  if ((pref === 1 || pref === 2) && D.depths[pref]) {
    seg.querySelector<HTMLButtonElement>(`button[data-l="${pref}"]`)?.click();
  }
} catch (_e) { /* private mode */ }

// Keyboard shortcuts: press 1 / 2 / 3 to jump to a reading depth.
addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (e.key === "1" || e.key === "2" || e.key === "3") {
    const btn = seg.querySelector<HTMLButtonElement>(`button[data-l="${Number(e.key) - 1}"]`);
    if (btn && !btn.classList.contains("on")) { btn.click(); btn.focus(); }
  }
});

/* ---------- related cards ---------- */
const rg = $("rgrid");
(D.related ?? []).forEach(rid => {
  const m = RELATED_INDEX[rid];
  if (!m) return;
  const href = m.href || `/discoveries/${rid}/`;
  const a = document.createElement("a");
  a.className = "rc";
  a.href = href;
  a.innerHTML =
    `<div class="f">${m.field}</div><h3>${m.title}</h3>` +
    `<div class="r">${m.cta || "Read"} &nbsp;→</div>`;
  rg.appendChild(a);
});

/* ---------- sources & further reading ----------
   The build pre-renders this for crawlers; if it's already populated we
   leave it. Otherwise (dev server) we render it client-side. */
const srcEl = $("sources");
if (srcEl) {
  if (!srcEl.innerHTML.trim()) srcEl.innerHTML = sourcesHTML(id);
  if (srcEl.innerHTML.trim()) srcEl.hidden = false;
}

$("legal").textContent = "© 2026 CELESTIUM — " + D.field + " · " + D.era;

/* ---------- next in the series (a guided linear path) ---------- */
const SERIES = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background",
  "first-exoplanet", "double-slit", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin",
];
const si = SERIES.indexOf(id);
if (si >= 0) {
  const nextSlug = SERIES[(si + 1) % SERIES.length]!;
  const nm = RELATED_INDEX[nextSlug];
  const nx = $<HTMLAnchorElement>("nextseries");
  if (nm && nx) {
    nx.href = `/discoveries/${nextSlug}/`;
    $("ns-field").textContent = nm.field;
    $("ns-title").textContent = nm.title;
    nx.hidden = false;
  }
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

/* ---------- ambient sound (opt-in) ---------- */
initSound($("sound"), { pad: true });

/* ---------- ⌘K command palette ---------- */
initCommandPalette();
