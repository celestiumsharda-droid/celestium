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
}

export function mount(canvas: HTMLCanvasElement, options: StarfieldOptions = {}): () => void {
  const { parallax = false, density = 1 } = options;

  if (!canvas.hasAttribute("aria-hidden")) canvas.setAttribute("aria-hidden", "true");

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0;
  let H = 0;
  let stars: Star[] = [];
  let sc = 0;
  let raf = 0;
  let alive = true;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = parallax ? 3400 : 3800;
    const n = Math.min(420, Math.floor(((W * H) / base) * density));
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * (parallax ? 2 : 1),
        z: Math.random(),
        r: Math.random() * 1.3 + 0.2,
        t: Math.random() * 6.28,
      });
    }
  }

  // Star colour adapts to the theme so the field reads on light too.
  const isLight = () => document.documentElement.dataset["theme"] === "light";
  const starRGB = () => (isLight() ? "92,104,150" : "220,228,255");
  const haloRGB = () => (isLight() ? "120,134,205" : "169,188,255");

  function paintStatic() {
    ctx!.clearRect(0, 0, W, H);
    const rgb = starRGB();
    for (const s of stars) {
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.r * (0.6 + s.z), 0, 6.29);
      ctx!.fillStyle = `rgba(${rgb},${(0.18 + s.z * 0.7) * 0.85})`;
      ctx!.fill();
    }
  }

  function frame() {
    if (!alive) return;
    ctx!.clearRect(0, 0, W, H);
    const t = Date.now() / 1000;
    const rgb = starRGB();
    const halo = haloRGB();
    for (const s of stars) {
      let y = s.y - sc * s.z * 0.35;
      if (parallax) y = ((y % (H * 2)) + H * 2) % (H * 2);
      const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + s.t);
      const a = (0.18 + s.z * 0.7) * tw;
      ctx!.beginPath();
      ctx!.arc(s.x, y, s.r * (0.6 + s.z), 0, 6.29);
      ctx!.fillStyle = `rgba(${rgb},${a})`;
      ctx!.fill();
      if (s.z > 0.93) {
        ctx!.beginPath();
        ctx!.arc(s.x, y, s.r * 2.4, 0, 6.29);
        ctx!.fillStyle = `rgba(${halo},${a * 0.12})`;
        ctx!.fill();
      }
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
