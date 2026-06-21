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

/* ===================== THE THRESHOLD =====================
   Darkness, then particles gather into the Celestium mark and morph through
   the forms of the cosmos — a star, a world, a cell, a tree, a whale, a human,
   and back. One quiet question is asked. Then the field scatters upward into
   stars and the visitor arrives on their shore. The heavy 3-D engine + the
   108k-star catalogue prefetch behind it, so arrival is from warm cache. */
const intro = document.getElementById("at-intro");
const loadWrap = document.getElementById("at-land-load");
const progEl = document.getElementById("at-land-prog");
const flash = document.getElementById("at-land-flash");
const veil = document.getElementById("th-veil");
const nameInput = document.getElementById("th-name") as HTMLInputElement | null;
const thForm = document.getElementById("th-form") as HTMLFormElement | null;
const thSkip = document.getElementById("th-skip");
const welcomeEl = document.getElementById("th-welcome");
const thCanvas = document.getElementById("th-canvas") as HTMLCanvasElement | null;
const section = document.getElementById("atlas");
const canvas = document.getElementById("at-canvas") as HTMLCanvasElement | null;
const labels = document.getElementById("at-labels");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const NAME_KEY = "celestium:name";
const known = (() => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } })();
if (nameInput && known) nameInput.value = known;

let enginePromise: Promise<typeof import("./atlas")> | null = null;
let dataWarmed = false;
function prefetch(): void {
  if (!enginePromise) enginePromise = import("./atlas");      // load + cache the engine code (mountAtlas runs nothing until called)
  if (!dataWarmed) {
    dataWarmed = true;
    ["bubble_pos.f32", "bubble_col.u8", "bubble_meta.bin", "bubble_meta.json", "constellations.f32"]
      .forEach(f => { fetch("/stars/" + f).catch(() => { /* best-effort warm-up */ }); });
  }
}
if (iw.requestIdleCallback) iw.requestIdleCallback(prefetch, { timeout: 2500 }); else setTimeout(prefetch, 1400);

const ids = () => ({
  name: $("at-name"), dist: $("at-dist"), line: $("at-line"),
  more: $("at-more"), sheet: $("at-sheet"), time: $("at-time"), date: $("at-date"),
  nav: $("at-nav"), consoleEl: $("at-console"), conList: $("at-con-list"),
  conSearch: $<HTMLInputElement>("at-con-search"), conClose: $("at-con-close"),
});

const _S = (inner: string): string => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${inner}</svg>`;
const MARK_SVG = _S(`<g fill='none' stroke='#fff' stroke-width='3'><ellipse cx='50' cy='50' rx='40' ry='16'/><ellipse cx='50' cy='50' rx='40' ry='16' transform='rotate(60 50 50)'/><ellipse cx='50' cy='50' rx='40' ry='16' transform='rotate(120 50 50)'/></g><circle cx='50' cy='50' r='6' fill='#fff'/><path d='M76 16 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z' fill='#f2e6c4'/>`);
const STAR_SVG = _S(`<path d='M50 6 L57 43 L94 50 L57 57 L50 94 L43 57 L6 50 L43 43Z' fill='#fff'/><circle cx='50' cy='50' r='9' fill='#f2e6c4'/>`);
const EARTH_SVG = _S(`<circle cx='50' cy='50' r='35' fill='#fff'/><path d='M30 40 q12 -6 22 2 q-8 8 -22 -2Z M58 56 q14 -2 18 8 q-12 6 -18 -8Z' fill='#cdd9f0'/>`);
const CELL_SVG = _S(`<ellipse cx='46' cy='52' rx='30' ry='15' fill='#fff'/><path d='M75 52 q9 -9 18 -4 q-9 5 -18 4' fill='#fff'/><circle cx='40' cy='50' r='5' fill='#f2e6c4'/>`);
const TREE_SVG = _S(`<circle cx='50' cy='37' r='25' fill='#fff'/><rect x='46' y='55' width='8' height='38' fill='#fff'/>`);
const WHALE_SVG = _S(`<path d='M6 54 C22 40 46 38 66 44 C78 47 88 41 94 33 C92 46 87 52 84 54 C88 58 90 63 90 69 C81 61 73 60 64 62 C46 66 22 66 6 54Z' fill='#fff'/>`);
const HUMAN_SVG = _S(`<circle cx='50' cy='20' r='10' fill='#fff'/><path d='M50 31 C40 31 38 42 38 56 L40 92 L47 92 L49 62 L51 62 L53 92 L60 92 L62 56 C62 42 60 31 50 31Z' fill='#fff'/>`);

// the threshold is complete darkness — hide the page chrome until we arrive
const navEl = document.getElementById("nav");
const progBar = document.getElementById("prog");
if (navEl) navEl.style.opacity = "0";
if (progBar) progBar.style.opacity = "0";

const threshold = (thCanvas && !reduce) ? startThreshold(thCanvas) : null;
// reveal the question once the mark has gathered (sooner for reduced motion)
setTimeout(() => veil?.classList.add("show"), reduce ? 200 : 3000);
setTimeout(() => { try { nameInput?.focus({ preventScroll: true }); } catch { /* ignore */ } }, reduce ? 400 : 3400);

let entered = false;
function enter(): void {
  if (entered || !section || !canvas || !labels) return;
  entered = true;
  const nm = (nameInput?.value || "").trim().slice(0, 22);
  try { if (nm) localStorage.setItem(NAME_KEY, nm); } catch { /* private mode */ }
  veil?.classList.add("leaving");
  if (loadWrap) loadWrap.hidden = false;
  prefetch();
  let p = 14; const tick = window.setInterval(() => { p = Math.min(96, p + 9); if (progEl) progEl.style.width = p + "%"; }, 110);
  const arrive = (): void => {
    flash?.classList.add("on");
    enginePromise!.then(m => {
      window.clearInterval(tick); if (progEl) progEl.style.width = "100%";
      section!.classList.add("live");
      document.body.style.overflow = "hidden";
      m.mountAtlas({ canvas: canvas!, labels: labels!, ...ids() });
      if (welcomeEl) welcomeEl.textContent = nm ? `${known ? "Welcome back" : "Welcome"}, ${nm}.` : "Welcome home.";
      setTimeout(() => {
        threshold?.stop();
        if (intro) { intro.style.transition = "opacity .8s var(--ease)"; intro.classList.add("gone"); }
        if (navEl) { navEl.style.transition = "opacity .9s ease"; navEl.style.opacity = ""; }
        if (progBar) progBar.style.opacity = "";
        welcomeEl?.classList.add("show");
        setTimeout(() => intro?.remove(), 900);
        setTimeout(() => welcomeEl?.classList.remove("show"), 5400);
      }, 440);
    }).catch(err => {
      window.clearInterval(tick); entered = false;
      if (loadWrap) loadWrap.hidden = true; flash?.classList.remove("on"); veil?.classList.remove("leaving");
      console.warn("The Atlas is unavailable; keeping the written summary.", err);
    });
  };
  if (threshold) threshold.scatter(arrive); else arrive();
}
thForm?.addEventListener("submit", e => { e.preventDefault(); enter(); });
thSkip?.addEventListener("click", () => { if (nameInput) nameInput.value = ""; enter(); });

/* the liquid-jewel cursor — a glass bead that lags the pointer and swells over
   anything you can touch. Desktop only; coarse pointers keep the native cursor. */
function initJewelCursor(): void {
  if (!matchMedia("(pointer: fine) and (hover: hover)").matches) return;
  const cur = document.createElement("div"); cur.className = "lj-cursor"; cur.innerHTML = "<i></i>";
  document.body.appendChild(cur);
  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, shown = false;
  const loop = (): void => { x += (tx - x) * 0.3; y += (ty - y) * 0.3; cur.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; requestAnimationFrame(loop); };
  addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; cur.classList.add("show"); }
    const el = e.target as Element | null;
    cur.classList.toggle("hot", !!(el?.closest?.("a,button,input,.at-label,.at-con-item,.at-con-cat,.th-enter,.th-skip,.th-name,.at-more,.at-sheet-close,.at-con-close,.at-time button")));
  }, { passive: true });
  addEventListener("pointerdown", () => cur.classList.add("hot"));
  loop();
}
initJewelCursor();

/* ---- the particle threshold ----
   Each "form" is an SVG silhouette sampled to a cloud of points; the particles
   spring between forms — materialising the mark, looping through life, then
   scattering into the sky on entry. */
type Pt = { x: number; y: number; gold: boolean };
type TP = { x: number; y: number; vx: number; vy: number; ti: number; gold: boolean; tw: number; a: number };
function startThreshold(cv: HTMLCanvasElement): { stop: () => void; scatter: (cb: () => void) => void } {
  const ctx = cv.getContext("2d"); if (!ctx) return { stop: () => {}, scatter: cb => cb() };
  const c2 = ctx;
  const FORMS: string[] = [MARK_SVG, STAR_SVG, EARTH_SVG, CELL_SVG, TREE_SVG, WHALE_SVG, HUMAN_SVG];
  let W = 0, H = 0, dpr = 1, raf = 0, t = 0;
  let clouds: Pt[][] = [];
  let parts: TP[] = [];
  let N = 1300, formI = 0, ready = false, lastMorph = 0;
  let scattering = false, scatterT = 0, scattered = false, onScatter: (() => void) | null = null;
  const scale = () => Math.min(W, H) * 0.3;
  const target = (i: number): Pt => clouds[formI]![parts[i]!.ti % clouds[formI]!.length]!;

  function resize(): void { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr); cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; }
  function frame(): void {
    raf = requestAnimationFrame(frame); t += 0.016;
    c2.clearRect(0, 0, W, H);
    if (!ready) return;
    if (!scattering && t - lastMorph > 2.7 && t > 3.0) { formI = (formI + 1) % FORMS.length; lastMorph = t; }
    const S = scale(), CX = W / 2, CY = H * 0.4;
    if (scattering) scatterT = Math.min(1, scatterT + 0.02);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (scattering) {
        p.vy -= 0.04 * dpr; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.vy *= 1.012; p.a *= 0.985;
      } else {
        const tg = target(i);
        const tx = CX + tg.x * S, ty = CY + tg.y * S;
        p.vx += (tx - p.x) * 0.012; p.vy += (ty - p.y) * 0.012; p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx + Math.sin(t * 0.7 + p.tw) * 0.18 * dpr; p.y += p.vy + Math.cos(t * 0.6 + p.tw) * 0.18 * dpr;
        p.a += (1 - p.a) * 0.03;
      }
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + p.tw);
      const al = Math.max(0, Math.min(1, p.a)) * tw;
      if (al < 0.02) continue;
      c2.beginPath(); c2.arc(p.x, p.y, (p.gold ? 1.5 : 1.1) * dpr, 0, 6.283);
      c2.fillStyle = p.gold ? `rgba(240,216,150,${al})` : `rgba(214,226,255,${al})`;
      c2.fill();
      if (p.gold) { const g = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7 * dpr); g.addColorStop(0, `rgba(240,216,150,${al * 0.5})`); g.addColorStop(1, "rgba(240,216,150,0)"); c2.fillStyle = g; c2.beginPath(); c2.arc(p.x, p.y, 7 * dpr, 0, 6.283); c2.fill(); }
    }
    if (scattering && scatterT >= 0.45 && !scattered) { scattered = true; onScatter?.(); }
  }
  // sample every form, then seed the field scattered and let it gather into the mark
  Promise.all(FORMS.map(svg => svgToPoints(svg, N))).then(cl => {
    clouds = cl; N = Math.min(N, ...cl.map(c => c.length || N));
    parts = [];
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = Math.max(W, H) * (0.4 + Math.random() * 0.6); parts.push({ x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: 0, vy: 0, ti: i, gold: clouds[0]![i % clouds[0]!.length]!.gold, tw: Math.random() * 6.283, a: 0 }); }
    ready = true; lastMorph = 0;
  }).catch(() => { ready = false; });
  resize(); frame(); addEventListener("resize", resize);
  return {
    stop: () => cancelAnimationFrame(raf),
    scatter: (cb: () => void) => { if (scattering) return; onScatter = cb; scattering = true; for (const p of parts) { const dx = p.x - W / 2, dy = p.y - H / 2, d = Math.hypot(dx, dy) || 1; const sp = (3 + Math.random() * 5) * dpr; p.vx = dx / d * sp; p.vy = dy / d * sp - 2 * dpr; } },
  };
}

/* sample an SVG silhouette (white on transparent) into a cloud of points */
function svgToPoints(svg: string, n: number): Promise<Pt[]> {
  return new Promise(resolve => {
    const S = 220, off = document.createElement("canvas"); off.width = off.height = S;
    const octx = off.getContext("2d"); if (!octx) { resolve([]); return; }
    const img = new Image();
    img.onload = () => {
      octx.clearRect(0, 0, S, S); octx.drawImage(img, 0, 0, S, S);
      const d = octx.getImageData(0, 0, S, S).data, pool: Pt[] = [];
      for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) { const i = (y * S + x) * 4; if (d[i + 3]! > 90) { const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!; pool.push({ x: (x / S - 0.5) * 2, y: (y / S - 0.5) * 2, gold: r > 200 && g > 165 && b < 175 }); } }
      const out: Pt[] = [];
      for (let k = 0; k < n; k++) out.push(pool.length ? pool[(Math.random() * pool.length) | 0]! : { x: 0, y: 0, gold: false });
      resolve(out);
    };
    img.onerror = () => resolve([]);
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  });
}
