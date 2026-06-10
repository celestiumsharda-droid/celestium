/**
 * Shared canvas starfield. Both pages mount it.
 *
 * Improvements over the prototype:
 *   • Honours `prefers-reduced-motion` — paints one static frame and
 *     stops, instead of running an infinite RAF loop.
 *   • Respects device pixel ratio (sharp on retina).
 *   • Visibility-aware: pauses when the tab is hidden.
 *   • Decorative — applies aria-hidden if not already set.
 */

export interface StarfieldOptions {
  /** Slight downward drift tied to scroll. Homepage uses true, articles false. */
  parallax?: boolean;
  /** Multiplier on default star density. */
  density?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  t: number;
  c: string;      // core colour
  big: boolean;   // rare bright star — gets a glow and diffraction spikes
}

/* a real night-sky palette: mostly white, then blue-white, amber, and the
   occasional deep orange-red — like a long-exposure deep field */
function starColor(): string {
  const r = Math.random();
  if (r < 0.55) return "232,237,255";   // white
  if (r < 0.75) return "186,205,255";   // blue-white
  if (r < 0.92) return "255,221,170";   // warm amber
  return "255,150,110";                 // orange-red
}

interface Meteor { x: number; y: number; vx: number; vy: number; life: number; max: number; len: number; }

export function mount(canvas: HTMLCanvasElement, options: StarfieldOptions = {}): () => void {
  const { parallax = false, density = 1 } = options;

  if (!canvas.hasAttribute("aria-hidden")) canvas.setAttribute("aria-hidden", "true");

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0;
  let H = 0;
  let stars: Star[] = [];
  let meteors: Meteor[] = [];
  let nextMeteor = -1;          // absolute seconds; set on first frame
  let sc = 0;
  let raf = 0;
  let alive = true;

  /** Spawn a shooting star: a streak that crosses the sky, then schedules the next. */
  function spawnMeteor(t: number) {
    const dir = Math.random() < 0.5 ? -1 : 1;          // down-left or down-right
    const speed = 7 + Math.random() * 6;
    meteors.push({
      x: dir > 0 ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5,
      y: Math.random() * H * 0.34,
      vx: dir * speed * (0.7 + Math.random() * 0.4),
      vy: speed * (0.5 + Math.random() * 0.4),
      life: 0, max: 55 + Math.random() * 45, len: 90 + Math.random() * 130,
    });
    nextMeteor = t + 5 + Math.random() * 9;            // next one in 5–14s
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = parallax ? 2100 : 2400;          // denser — a real deep field
    const n = Math.min(720, Math.floor(((W * H) / base) * density));
    stars = [];
    for (let i = 0; i < n; i++) {
      const z = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * (parallax ? 2 : 1),
        z,
        r: Math.pow(Math.random(), 2.2) * 1.5 + 0.25,   // mostly fine grains, few brights
        t: Math.random() * 6.28,
        c: starColor(),
        big: Math.random() < 0.012,
      });
    }
  }

  function paintStatic() {
    ctx!.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.r * (0.6 + s.z), 0, 6.29);
      ctx!.fillStyle = `rgba(${s.c},${(0.2 + s.z * 0.7) * 0.85})`;
      ctx!.fill();
    }
  }

  function frame() {
    if (!alive) return;
    ctx!.clearRect(0, 0, W, H);
    const t = Date.now() / 1000;
    for (const s of stars) {
      // deeper layered parallax: far stars barely move, near stars drift fast
      let y = s.y - sc * (0.08 + s.z * s.z * 0.55);
      if (parallax) y = ((y % (H * 2)) + H * 2) % (H * 2);
      const tw = 0.6 + 0.4 * Math.sin(t * 1.4 + s.t);
      const a = (0.2 + s.z * 0.7) * tw;
      const r = s.r * (0.6 + s.z);
      ctx!.beginPath();
      ctx!.arc(s.x, y, r, 0, 6.29);
      ctx!.fillStyle = `rgba(${s.c},${a})`;
      ctx!.fill();
      if (s.big) {
        // a bright star: soft halo + slim diffraction spikes
        const g = a * 0.9, L = r * 9;
        ctx!.beginPath(); ctx!.arc(s.x, y, r * 3.2, 0, 6.29);
        ctx!.fillStyle = `rgba(${s.c},${g * 0.14})`; ctx!.fill();
        ctx!.strokeStyle = `rgba(${s.c},${g * 0.5})`; ctx!.lineWidth = 0.7;
        ctx!.beginPath();
        ctx!.moveTo(s.x - L, y); ctx!.lineTo(s.x + L, y);
        ctx!.moveTo(s.x, y - L); ctx!.lineTo(s.x, y + L);
        ctx!.stroke();
      } else if (s.z > 0.93) {
        ctx!.beginPath();
        ctx!.arc(s.x, y, s.r * 2.4, 0, 6.29);
        ctx!.fillStyle = `rgba(${s.c},${a * 0.12})`;
        ctx!.fill();
      }
    }
    // ---- shooting stars ----
    if (nextMeteor < 0) nextMeteor = t + 2.5;
    if (t > nextMeteor && meteors.length < 2) spawnMeteor(t);
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]!;
      m.x += m.vx; m.y += m.vy; m.life++;
      if (m.life > m.max || m.x < -260 || m.x > W + 260 || m.y > H + 260) { meteors.splice(i, 1); continue; }
      const fade = Math.min(1, m.life / 7) * Math.min(1, (m.max - m.life) / 16);
      const sp = Math.hypot(m.vx, m.vy) || 1;
      const tx = m.x - (m.vx / sp) * m.len, ty = m.y - (m.vy / sp) * m.len;
      const g = ctx!.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,250,236,${fade})`);
      g.addColorStop(0.3, `rgba(205,218,255,${0.45 * fade})`);
      g.addColorStop(1, "rgba(205,218,255,0)");
      ctx!.strokeStyle = g; ctx!.lineWidth = 2; ctx!.lineCap = "round";
      ctx!.beginPath(); ctx!.moveTo(m.x, m.y); ctx!.lineTo(tx, ty); ctx!.stroke();
      ctx!.beginPath(); ctx!.arc(m.x, m.y, 5.5, 0, 6.29);          // soft glow at the head
      ctx!.fillStyle = `rgba(255,250,236,${0.28 * fade})`; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(m.x, m.y, 2.1, 0, 6.29);          // bright core
      ctx!.fillStyle = `rgba(255,253,246,${fade})`; ctx!.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function onScroll() {
    sc = scrollY;
  }

  function onVisibility() {
    if (document.hidden) {
      alive = false;
      cancelAnimationFrame(raf);
    } else if (!reduced) {
      alive = true;
      raf = requestAnimationFrame(frame);
    }
  }

  size();
  addEventListener("resize", size);
  if (parallax && !reduced) addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  if (reduced) {
    paintStatic();
  } else {
    raf = requestAnimationFrame(frame);
  }

  return function dispose() {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("resize", size);
    if (parallax && !reduced) removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
