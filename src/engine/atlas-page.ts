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

/* ---- the launch page ----
   The page paints instantly: a light canvas starfield and the hero, with NO
   WebGL engine. The heavy 3-D engine + 108k-star catalogue PREFETCH in the
   background while the visitor reads, so pressing "Launch the Atlas" boots from
   warm cache — a fraction of the old cold-start. */
const intro = document.getElementById("at-intro");
const launchBtn = document.getElementById("at-intro-go");
const readyEl = document.getElementById("at-land-ready");
const loadWrap = document.getElementById("at-land-load");
const progEl = document.getElementById("at-land-prog");
const loadTxt = document.getElementById("at-land-loadtxt");
const section = document.getElementById("atlas");
const canvas = document.getElementById("at-canvas") as HTMLCanvasElement | null;
const labels = document.getElementById("at-labels");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let stopStars: (() => void) | null = null;
const landCanvas = document.getElementById("at-land-stars") as HTMLCanvasElement | null;
if (landCanvas && !reduce) stopStars = startLandingStars(landCanvas);

let enginePromise: Promise<typeof import("./atlas")> | null = null;
let dataWarmed = false;
function prefetch(): void {
  if (!enginePromise) enginePromise = import("./atlas");      // load + cache the engine code (mountAtlas runs nothing until called)
  if (!dataWarmed) {
    dataWarmed = true;
    ["bubble_pos.f32", "bubble_col.u8", "bubble_meta.bin", "bubble_meta.json", "constellations.f32"]
      .forEach(f => { fetch("/stars/" + f).catch(() => { /* best-effort warm-up */ }); });
  }
  enginePromise.then(() => { if (readyEl) { readyEl.classList.add("go"); readyEl.textContent = "ready — press launch"; } }).catch(() => {});
}
if (iw.requestIdleCallback) iw.requestIdleCallback(prefetch, { timeout: 2500 }); else setTimeout(prefetch, 1400);

let launched = false;
function launch(): void {
  if (launched || !section || !canvas || !labels) return;
  launched = true;
  launchBtn?.classList.add("loading");
  if (loadWrap) loadWrap.hidden = false;
  let p = 10; const tick = window.setInterval(() => { p = Math.min(92, p + Math.random() * 15); if (progEl) progEl.style.width = p + "%"; }, 200);
  prefetch();
  enginePromise!.then(m => {
    if (progEl) progEl.style.width = "100%";
    if (loadTxt) loadTxt.textContent = "Entering…";
    section.classList.add("live");
    document.body.style.overflow = "hidden";                 // the Atlas is a fixed, full-screen instrument
    m.mountAtlas({
      canvas, labels,
      name: $("at-name"), dist: $("at-dist"), line: $("at-line"),
      more: $("at-more"), sheet: $("at-sheet"), time: $("at-time"), date: $("at-date"),
      nav: $("at-nav"), consoleEl: $("at-console"), conList: $("at-con-list"),
      conSearch: $<HTMLInputElement>("at-con-search"), conClose: $("at-con-close"),
    });
    window.clearInterval(tick);
    setTimeout(() => { stopStars?.(); intro?.classList.add("gone"); setTimeout(() => intro?.remove(), 1100); }, 360);
  }).catch(err => { window.clearInterval(tick); launched = false; launchBtn?.classList.remove("loading"); if (loadWrap) loadWrap.hidden = true; console.warn("The Atlas is unavailable; keeping the written summary.", err); });
}
launchBtn?.addEventListener("click", launch);

/* a cheap, lovely starfield for the launch page — drift, twinkle, the odd
   shooting star. A 2-D canvas, nothing like the cost of the WebGL Atlas. */
function startLandingStars(cv: HTMLCanvasElement): () => void {
  const ctx = cv.getContext("2d"); if (!ctx) return () => {};
  const PAL = ["255,255,255", "200,216,255", "255,236,212", "206,222,255"];
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  type S = { x: number; y: number; z: number; r: number; tw: number; sp: number; c: string; big: boolean };
  type M = { x: number; y: number; vx: number; vy: number; life: number; len: number };
  let W = 0, H = 0, dpr = 1, stars: S[] = [], shoots: M[] = [], t = 0, nextShoot = 2, raf = 0;
  function init(): void {
    const n = Math.min(900, Math.round(innerWidth * innerHeight / 1600)); stars = [];
    for (let i = 0; i < n; i++) { const z = Math.random() * Math.random(); stars.push({ x: Math.random() * W, y: Math.random() * H, z, r: (0.4 + z * 1.6) * dpr, tw: Math.random() * 6.28, sp: rnd(0.3, 1), c: PAL[(Math.random() * PAL.length) | 0]!, big: Math.random() < 0.07 }); }
  }
  function resize(): void { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr); cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; init(); }
  function frame(): void {
    raf = requestAnimationFrame(frame); t += 0.016; ctx!.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.x -= (0.02 + s.z * 0.07) * dpr; if (s.x < -4) { s.x = W + 4; s.y = Math.random() * H; }
      const a = (0.4 + 0.6 * Math.abs(Math.sin(s.tw + t * s.sp))) * (0.5 + 0.5 * s.z);
      ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, 6.28); ctx!.fillStyle = "rgba(" + s.c + "," + a + ")"; ctx!.fill();
      if (s.big) { const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 7); g.addColorStop(0, "rgba(" + s.c + "," + (a * 0.4) + ")"); g.addColorStop(1, "rgba(" + s.c + ",0)"); ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r * 7, 0, 6.28); ctx!.fill(); }
    }
    nextShoot -= 0.016;
    if (nextShoot <= 0) { const sp = rnd(9, 15) * dpr; shoots.push({ x: rnd(W * 0.2, W * 0.9), y: rnd(-20, H * 0.4), vx: -sp, vy: sp * rnd(0.35, 0.5), life: 1, len: rnd(120, 220) * dpr }); nextShoot = rnd(3, 6.5); }
    for (let i = shoots.length - 1; i >= 0; i--) {
      const m = shoots[i]!; m.x += m.vx; m.y += m.vy; m.life -= 0.014; const hyp = Math.hypot(m.vx, m.vy);
      const tx = m.x - m.vx / hyp * m.len, ty = m.y - m.vy / hyp * m.len;
      const g = ctx!.createLinearGradient(m.x, m.y, tx, ty); g.addColorStop(0, "rgba(255,255,255," + (m.life * 0.9) + ")"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.strokeStyle = g; ctx!.lineWidth = 1.6 * dpr; ctx!.lineCap = "round"; ctx!.beginPath(); ctx!.moveTo(m.x, m.y); ctx!.lineTo(tx, ty); ctx!.stroke();
      if (m.life <= 0 || m.x < -50 || m.y > H + 50) shoots.splice(i, 1);
    }
  }
  resize(); frame(); addEventListener("resize", resize);
  return () => cancelAnimationFrame(raf);
}
