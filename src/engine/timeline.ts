/* =====================================================================
   CELESTIUM — "TWO CLOCKS, ONE STORY"
   A scroll-scrubbed flight along a logarithmic spiral of deep time.

   • The spiral is a true log spiral, so it is self-similar under
     rotate+scale — advancing the active event rotates and rescales the
     whole curve so you appear to travel inward forever, smooth and
     continuous. Big Bang glows warm-white at the far arm; "now" is cool
     blue at the focus.
   • Each event blooms a burst of particles as it reaches the focus.
   • A gap-bar reads the two clocks: where the event sits in cosmic time
     vs. the year we understood it — the long thread between a thing
     happening and us finding out.

   Pure Canvas 2D, DPR-capped, rAF only while the section is on screen,
   and a clean reduced-motion fallback (the classic list) handled by the
   caller. No layout thrash: one rect read per frame, canvas writes only.
   ===================================================================== */
import type { TimelineEntry } from "./types";
import { playClick } from "./sound";

interface Opts {
  canvas: HTMLCanvasElement;
  track: HTMLElement;     // tall element that drives the scroll
  card: HTMLElement;      // HUD card (filled per event)
  gap: HTMLElement;       // the two-clocks gap bar (filled per event)
  data: readonly TimelineEntry[];
}

const NOW_YEAR = 2026;
const TAU = Math.PI * 2;

/* --- small helpers --- */
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function mix(c1: number[], c2: number[], t: number): string {
  const r = Math.round(lerp(c1[0]!, c2[0]!, t));
  const g = Math.round(lerp(c1[1]!, c2[1]!, t));
  const b = Math.round(lerp(c1[2]!, c2[2]!, t));
  return `rgb(${r},${g},${b})`;
}
const WARM = [255, 244, 214];   // Big Bang
const MID = [201, 178, 255];    // deep time
const COOL = [169, 188, 255];   // now
function eventColor(t: number): string {
  return t < 0.5 ? mix(WARM, MID, t * 2) : mix(MID, COOL, (t - 0.5) * 2);
}

/* position on a log "years-ago" axis: 0 = Big Bang (far past), 1 = now */
const LOG_MAX = Math.log10(13.8e9);
function axisX(ya: number): number {
  if (ya <= 1) return 1;
  return clamp(1 - Math.log10(ya) / LOG_MAX, 0, 1);
}
function agoLabel(ya: number): string {
  if (ya <= 0) return "right now";
  if (ya >= 1e9) return `${(ya / 1e9).toFixed(1)} billion yrs ago`;
  if (ya >= 1e6) return `${Math.round(ya / 1e6)} million yrs ago`;
  if (ya >= 1e3) return `${Math.round(ya / 1e3)},000 yrs ago`;
  return `${Math.round(ya)} yrs ago`;
}

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; col: string; }

export function mountTimeline(opts: Opts): () => void {
  const { canvas, track, card, gap, data } = opts;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const N = data.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 760px)").matches;

  // spiral geometry
  const ARC = 1.95;          // radians between events
  const GROW = 0.52;         // exp growth of radius per event
  const FOCAL_A = -Math.PI / 2.2; // angle the active node is parked at
  const colors = data.map((_, i) => eventColor(N > 1 ? i / (N - 1) : 0));

  // particle pool
  const POOL = small ? 90 : 240;
  const parts: P[] = [];
  for (let i = 0; i < POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, col: "#fff" });
  let pp = 0;
  function emit(x: number, y: number, n: number, col: string, power: number) {
    for (let i = 0; i < n; i++) {
      const p = parts[pp = (pp + 1) % POOL]!;
      const a = Math.random() * TAU;
      const sp = (0.4 + Math.random() * 1) * power;
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.max = 50 + Math.random() * 60; p.life = p.max;
      p.size = 0.6 + Math.random() * 1.8; p.col = col;
    }
  }

  // static starfield (parallax-free, drawn once into an offscreen)
  let stars: { x: number; y: number; r: number; o: number }[] = [];
  function seedStars(w: number, h: number) {
    const n = Math.round((w * h) / 14000);
    stars = [];
    let s = 99;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) stars.push({ x: rnd() * w, y: rnd() * h, r: rnd() * 1.1 + 0.2, o: rnd() * 0.5 + 0.08 });
  }

  // sizing
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, focalR = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W * (small ? 0.5 : 0.62);
    cy = H * (small ? 0.4 : 0.5);
    focalR = Math.min(W, H) * (small ? 0.16 : 0.2);
    seedStars(W, H);
  }

  // world point for a continuous param u
  function worldR(u: number) { return Math.exp(GROW * u); }
  function worldA(u: number) { return u * ARC; }

  // current state
  let target = 0;       // target param from scroll [0, N-1]
  let cur = 0;          // eased displayed param
  let activeInt = -1;
  let running = false;
  let raf = 0;

  function readScroll() {
    const r = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    const p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    target = p * (N - 1);
  }

  function setActive(i: number) {
    if (i === activeInt) return;
    const prev = activeInt;
    activeInt = i;
    const e = data[i]!;
    const col = colors[i]!;
    // card
    const link = e.id
      ? `<a class="tl-read" href="/discoveries/${e.id}/">Read the full discovery →</a>`
      : "";
    card.innerHTML =
      `<div class="tl-when" style="color:${col}">${e.w}</div>` +
      `<h3 class="tl-title">${e.t}</h3>` +
      `<p class="tl-body">${e.b}</p>` +
      `<p class="tl-how"><span>How we know</span> ${e.d}</p>${link}`;
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    // gap bar (two clocks)
    const xh = axisX(e.ya);
    const knewAgo = NOW_YEAR - e.knew;
    const xk = axisX(knewAgo);
    const happened = agoLabel(e.ya);
    const knew = e.knew >= NOW_YEAR ? "ongoing, now" : `${e.knew}`;
    gap.querySelector<HTMLElement>(".gap-happened")!.style.left = `${(xh * 100).toFixed(2)}%`;
    gap.querySelector<HTMLElement>(".gap-knew")!.style.left = `${(xk * 100).toFixed(2)}%`;
    const fill = gap.querySelector<HTMLElement>(".gap-fill")!;
    const lo = Math.min(xh, xk), hi = Math.max(xh, xk);
    fill.style.left = `${(lo * 100).toFixed(2)}%`;
    fill.style.width = `${((hi - lo) * 100).toFixed(2)}%`;
    fill.style.background = `linear-gradient(90deg, ${col}, var(--accent))`;
    gap.querySelector<HTMLElement>(".gap-hl")!.textContent = happened;
    gap.querySelector<HTMLElement>(".gap-kl")!.textContent = knew;
    (gap.querySelector<HTMLElement>(".gap-happened") as HTMLElement).style.background = col;
    // bloom + tick (skip on the very first paint)
    if (prev >= 0) {
      const sx = cx + Math.cos(FOCAL_A) * focalR;
      const sy = cy + Math.sin(FOCAL_A) * focalR;
      emit(sx, sy, small ? 26 : 60, col, small ? 2 : 3.2);
      try { playClick(); } catch (_e) { /* audio not enabled */ }
    }
  }

  function draw() {
    // backdrop
    ctx.fillStyle = "#050609";
    ctx.fillRect(0, 0, W, H);
    for (const st of stars) {
      ctx.globalAlpha = st.o;
      ctx.fillStyle = "#cdd6f5";
      ctx.fillRect(st.x, st.y, st.r, st.r);
    }
    ctx.globalAlpha = 1;

    const f = cur;
    const S = focalR / worldR(f);
    const phi = FOCAL_A - worldA(f);
    const cphi = Math.cos(phi), sphi = Math.sin(phi);
    // map world(u) -> screen
    const sx = (u: number) => {
      const r = worldR(u) * S, a = worldA(u);
      const wx = r * Math.cos(a), wy = r * Math.sin(a);
      return cx + (wx * cphi - wy * sphi);
    };
    const sy = (u: number) => {
      const r = worldR(u) * S, a = worldA(u);
      const wx = r * Math.cos(a), wy = r * Math.sin(a);
      return cy + (wx * sphi + wy * cphi);
    };

    // spiral curve — sample finely between u=-0.6 .. N-0.4
    const u0 = -0.6, u1 = N - 1 + 0.6;
    const steps = 220;
    ctx.lineCap = "round";
    // soft outer glow pass
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(140,160,255,0.05)";
    ctx.beginPath();
    for (let k = 0; k <= steps; k++) {
      const u = lerp(u0, u1, k / steps);
      const x = sx(u), y = sy(u);
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    // crisp gradient pass, drawn in colour chunks (few draw calls)
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.55;
    const CHUNKS = 30, SUB = 8;
    for (let c = 0; c < CHUNKS; c++) {
      const ca = lerp(u0, u1, c / CHUNKS), cb = lerp(u0, u1, (c + 1) / CHUNKS);
      ctx.strokeStyle = eventColor(clamp(ca / (N - 1), 0, 1));
      ctx.beginPath();
      for (let s = 0; s <= SUB; s++) {
        const u = lerp(ca, cb, s / SUB);
        s === 0 ? ctx.moveTo(sx(u), sy(u)) : ctx.lineTo(sx(u), sy(u));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // event nodes
    for (let i = 0; i < N; i++) {
      const x = sx(i), y = sy(i);
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const d = Math.abs(i - f);
      const near = clamp(1 - d, 0, 1);
      const rad = lerp(2.2, 7, near);
      ctx.fillStyle = colors[i]!;
      ctx.globalAlpha = lerp(0.35, 1, near);
      ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      if (near > 0.5) {
        ctx.globalAlpha = (near - 0.5) * 1.4;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = colors[i]!;
        ctx.beginPath(); ctx.arc(x, y, rad + 6 + (1 - near) * 10, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // active focus halo
    const fx = cx + Math.cos(FOCAL_A) * focalR, fy = cy + Math.sin(FOCAL_A) * focalR;
    const ci = colors[clamp(Math.round(f), 0, N - 1)]!;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 64);
    g.addColorStop(0, ci.replace("rgb", "rgba").replace(")", ",0.5)"));
    g.addColorStop(1, ci.replace("rgb", "rgba").replace(")", ",0)"));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(fx, fy, 64, 0, TAU); ctx.fill();

    // particles (additive)
    if (!reduce) {
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life -= 1; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97;
        const a = p.life > 0 ? p.life / p.max : 0;
        const r = p.size * a;
        if (r <= 0) continue;
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }

  let last = performance.now();
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    readScroll();
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    cur += (target - cur) * (reduce ? 1 : clamp(0.12 * dt, 0, 1));
    if (Math.abs(target - cur) < 0.0005) cur = target;
    setActive(clamp(Math.round(cur), 0, N - 1));
    draw();
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  readScroll(); cur = target;
  addEventListener("resize", resize, { passive: true });
  const io = new IntersectionObserver(es => {
    const v = es.some(e => e.isIntersecting);
    if (v) start(); else stop();
  }, { rootMargin: "100px 0px" });
  io.observe(track);
  // render once immediately so it isn't blank before first intersect
  setActive(0); draw();

  return () => { stop(); io.disconnect(); removeEventListener("resize", resize); };
}
