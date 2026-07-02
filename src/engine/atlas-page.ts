/**
 * CELESTIUM — The Atlas page entry.
 * Shared chrome + the lazily-mounted Atlas engine. The written summary in
 * the HTML is the base experience (no-JS / no-WebGL / reduced motion);
 * when motion is welcome the live Solar System takes the stage.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSiteChrome } from "./site-chrome";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();
initSiteChrome();
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
const section = document.getElementById("atlas");
const canvas = document.getElementById("at-canvas") as HTMLCanvasElement | null;
const labels = document.getElementById("at-labels");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const flash = document.getElementById("at-land-flash");
const landCanvas = document.getElementById("at-land-stars") as HTMLCanvasElement | null;
const starsApi = (landCanvas && !reduce) ? startLandingStars(landCanvas) : null;

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

const ids = () => ({
  name: $("at-name"), dist: $("at-dist"), line: $("at-line"),
  more: $("at-more"), sheet: $("at-sheet"), time: $("at-time"), date: $("at-date"),
  nav: $("at-nav"), consoleEl: $("at-console"), conList: $("at-con-list"),
  conSearch: $<HTMLInputElement>("at-con-search"), conClose: $("at-con-close"),
});

let launched = false;
function launch(): void {
  if (launched || !section || !canvas || !labels) return;
  launched = true;
  launchBtn?.classList.add("loading");
  if (loadWrap) loadWrap.hidden = false;
  prefetch();
  let p = 12; const tick = window.setInterval(() => { p = Math.min(96, p + 10); if (progEl) progEl.style.width = p + "%"; }, 110);
  // at the peak of the lightspeed jump: flash white, mount Earth behind it, dissolve
  const reveal = (): void => {
    flash?.classList.add("on");
    enginePromise!.then(m => {
      window.clearInterval(tick); if (progEl) progEl.style.width = "100%";
      section!.classList.add("live");
      document.body.style.overflow = "hidden";
      m.mountAtlas({ canvas: canvas!, labels: labels!, ...ids() });
      setTimeout(() => {
        starsApi?.stop();
        if (intro) { intro.style.transition = "opacity .7s var(--ease)"; intro.classList.add("gone"); }
        setTimeout(() => intro?.remove(), 820);
      }, 380);
    }).catch(err => {
      window.clearInterval(tick); launched = false; launchBtn?.classList.remove("loading");
      if (loadWrap) loadWrap.hidden = true; flash?.classList.remove("on");
      console.warn("The Atlas is unavailable; keeping the written summary.", err);
    });
  };
  if (starsApi) starsApi.warp(reveal); else reveal();
}
launchBtn?.addEventListener("click", launch);

/* parallax: the cinematic montage drifts gently with the pointer */
const gallery = document.getElementById("at-land-gallery");
if (gallery && matchMedia("(pointer: fine)").matches) {
  addEventListener("pointermove", e => {
    gallery.style.setProperty("--px", ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
    gallery.style.setProperty("--py", ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
  }, { passive: true });
}

/* the launch-page starfield: ambient drift + the odd shooting star, with a
   "jump to lightspeed" warp that streaks every star out of frame on launch. */
type StarsApi = { stop: () => void; warp: (onPeak: () => void) => void };
function startLandingStars(cv: HTMLCanvasElement): StarsApi {
  const ctx = cv.getContext("2d"); if (!ctx) return { stop: () => {}, warp: cb => cb() };
  const c2 = ctx;
  const PAL = ["255,255,255", "200,216,255", "236,212,154", "206,222,255"];
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  type S = { x: number; y: number; px: number; py: number; z: number; r: number; tw: number; sp: number; c: string; big: boolean };
  type M = { x: number; y: number; vx: number; vy: number; life: number; len: number };
  let W = 0, H = 0, dpr = 1, stars: S[] = [], shoots: M[] = [], t = 0, nextShoot = 2, raf = 0;
  let warping = false, warpT = 0, peaked = false, onPeak: (() => void) | null = null;
  function init(): void {
    const n = Math.min(560, Math.round(innerWidth * innerHeight / 2600)); stars = [];
    for (let i = 0; i < n; i++) { const z = Math.random() * Math.random(); const x = Math.random() * W, y = Math.random() * H; stars.push({ x, y, px: x, py: y, z, r: (0.4 + z * 1.6) * dpr, tw: Math.random() * 6.28, sp: rnd(0.3, 1), c: PAL[(Math.random() * PAL.length) | 0]!, big: Math.random() < 0.07 }); }
  }
  // cap the backing store at 1.5× — the warp is motion-blurred, so extra pixels
  // are invisible but the full-canvas alpha fillRect each frame is fill-bound
  function resize(): void { dpr = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr); cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; init(); }
  function stepWarp(): void {
    warpT = Math.min(1, warpT + 0.016 / 1.05);
    const cx = W / 2, cy = H / 2, sp = 0.012 + warpT * warpT * 0.5;
    c2.fillStyle = "rgba(3,4,10,0.4)"; c2.fillRect(0, 0, W, H);     // motion-blur trail
    c2.lineCap = "round";
    for (const s of stars) {
      s.px = s.x; s.py = s.y;
      let dx = s.x - cx, dy = s.y - cy;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { dx = rnd(-1, 1); dy = rnd(-1, 1); }
      s.x += dx * sp; s.y += dy * sp;
      if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) { const a = Math.random() * 6.28, r = rnd(2, 60); s.x = cx + Math.cos(a) * r; s.y = cy + Math.sin(a) * r; s.px = s.x; s.py = s.y; }
      const a = Math.min(1, 0.5 + 0.5 * s.z + warpT * 0.4);
      c2.strokeStyle = "rgba(" + s.c + "," + a + ")"; c2.lineWidth = (0.5 + s.z * 1.6 + warpT * 2.0) * dpr;
      c2.beginPath(); c2.moveTo(s.px, s.py); c2.lineTo(s.x, s.y); c2.stroke();
    }
    if (!peaked && warpT >= 0.8) { peaked = true; onPeak?.(); }
  }
  function frame(): void {
    raf = requestAnimationFrame(frame); t += 0.016;
    if (warping) { stepWarp(); return; }
    c2.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.x -= (0.02 + s.z * 0.07) * dpr; if (s.x < -4) { s.x = W + 4; s.y = Math.random() * H; }
      const a = (0.4 + 0.6 * Math.abs(Math.sin(s.tw + t * s.sp))) * (0.5 + 0.5 * s.z);
      c2.beginPath(); c2.arc(s.x, s.y, s.r, 0, 6.28); c2.fillStyle = "rgba(" + s.c + "," + a + ")"; c2.fill();
      if (s.big) { const g = c2.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 7); g.addColorStop(0, "rgba(" + s.c + "," + (a * 0.4) + ")"); g.addColorStop(1, "rgba(" + s.c + ",0)"); c2.fillStyle = g; c2.beginPath(); c2.arc(s.x, s.y, s.r * 7, 0, 6.28); c2.fill(); }
    }
    nextShoot -= 0.016;
    if (nextShoot <= 0) { const sp = rnd(9, 15) * dpr; shoots.push({ x: rnd(W * 0.2, W * 0.9), y: rnd(-20, H * 0.4), vx: -sp, vy: sp * rnd(0.35, 0.5), life: 1, len: rnd(120, 220) * dpr }); nextShoot = rnd(3, 6.5); }
    for (let i = shoots.length - 1; i >= 0; i--) {
      const m = shoots[i]!; m.x += m.vx; m.y += m.vy; m.life -= 0.014; const hyp = Math.hypot(m.vx, m.vy);
      const tx = m.x - m.vx / hyp * m.len, ty = m.y - m.vy / hyp * m.len;
      const g = c2.createLinearGradient(m.x, m.y, tx, ty); g.addColorStop(0, "rgba(255,255,255," + (m.life * 0.9) + ")"); g.addColorStop(1, "rgba(255,255,255,0)");
      c2.strokeStyle = g; c2.lineWidth = 1.6 * dpr; c2.lineCap = "round"; c2.beginPath(); c2.moveTo(m.x, m.y); c2.lineTo(tx, ty); c2.stroke();
      if (m.life <= 0 || m.x < -50 || m.y > H + 50) shoots.splice(i, 1);
    }
  }
  resize(); frame(); addEventListener("resize", resize);
  return {
    stop: () => cancelAnimationFrame(raf),
    warp: (cb: () => void) => { if (warping) return; onPeak = cb; warpT = 0; peaked = false; for (const s of stars) { s.px = s.x; s.py = s.y; } warping = true; },
  };
}
