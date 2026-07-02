/* THE LIVING ORB — a small universe behind glass.
   Not a dot-sphere: a breathing spherical VOLUME of stars, each on its own
   slow orbit (inner ones faster, like a real system), swirling with faint
   comet trails. It notices you: come near and the swarm wakes — brightens,
   leans toward your pointer, quickens. Press it and the universe implodes
   to a point, then blooms back. Cool starlight with a scatter of gold suns,
   the same palette as the Celestium mark. */

type LivingOrbOptions = {
  count?: number;
  /** kept for call-site compatibility; the orb no longer draws graph lines */
  connectionDistance?: number;
  drift?: number;
  parallax?: number;
};

interface Star {
  r: number;        // orbital radius 0..1 (volume, not surface)
  incl: number;     // orbital plane inclination
  node: number;     // orbital plane rotation
  phase: number;    // position on the orbit
  speed: number;    // angular speed (inner = faster)
  size: number;     // base size
  warm: boolean;    // a gold sun among the blue-white
  tw: number;       // twinkle phase
}

export function initLivingOrb(canvas: HTMLCanvasElement | null, options: LivingOrbOptions = {}): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = options.count ?? 300;
  const parallax = reduce ? 0 : options.parallax ?? 0.8;

  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.cbrt(Math.random());              // uniform in the sphere's volume
    stars.push({
      r,
      incl: Math.acos(2 * Math.random() - 1),
      node: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      speed: (0.10 + 0.5 * Math.pow(1 - r, 1.4)) * (Math.random() < 0.5 ? 1 : 1.25),   // Kepler-ish: inner faster
      size: 0.5 + Math.random() * 0.85,
      warm: Math.random() < 0.09,
      tw: Math.random() * Math.PI * 2,
    });
  }

  let alive = true;
  let width = 0, height = 0, dpr = 1;
  let rx = 0.3, ry = -0.2, tx = 0.3, ty = -0.2;     // view tilt (eased toward pointer)
  let wake = 0, wakeT = 0;                            // 0 sleepy … 1 fully awake
  let leanX = 0, leanY = 0, leanTX = 0, leanTY = 0;   // swarm lean toward the pointer
  let press = 0, pressT = 0;                          // 1 = imploded
  let raf = 0;
  let last = performance.now();

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || canvas.width || 96);
    const cssH = Math.max(1, rect.height || canvas.height || 96);
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);
    if (cssW === width && cssH === height && nextDpr === dpr) return;
    width = cssW; height = cssH; dpr = nextDpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const onPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);
    const d = Math.hypot(nx, ny);
    wakeT = d < 2.6 ? Math.max(0, 1 - (d - 1) / 1.6) : 0;   // waking begins as you approach
    const cl = (v: number) => Math.max(-1, Math.min(1, v));
    leanTX = cl(nx) * 0.16; leanTY = cl(ny) * 0.16;          // the swarm leans to meet you
    tx = 0.3 + cl(ny) * parallax * 0.55;
    ty = -0.2 + cl(nx) * parallax * 0.75;
  };
  const onDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);
    if (Math.hypot(nx, ny) < 1.7) pressT = 1;                // implode…
  };
  const onUp = () => { pressT = 0; };                        // …and bloom

  const draw = (now: number) => {
    if (!alive) return;
    resize();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // eased state
    rx += (tx - rx) * 0.05; ry += (ty - ry) * 0.05;
    wake += (wakeT - wake) * (wakeT > wake ? 0.09 : 0.03);   // wakes fast, settles slow
    leanX += (leanTX - leanX) * 0.07; leanY += (leanTY - leanY) * 0.07;
    press += (pressT - press) * (pressT > press ? 0.22 : 0.085);   // snap in, spring out

    const size = Math.min(width, height);
    const cx = width / 2, cy = height / 2;
    const breathe = 1 + Math.sin(now * 0.00062) * 0.045;                 // it breathes
    const R = size * 0.40 * breathe * (1 - press * 0.62);                // implode on press
    const speedK = (0.55 + wake * 1.05) * (1 + press * 1.6);            // quickens when awake / pressed

    // fade the last frame a little instead of clearing — comet trails
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${reduce ? 1 : 0.38 + wake * 0.08})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    // the core: a quiet heart that brightens as the orb wakes
    const heart = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
    heart.addColorStop(0, `rgba(240,246,255,${0.05 + wake * 0.10 + press * 0.25})`);
    heart.addColorStop(0.4, `rgba(168,193,255,${0.028 + wake * 0.05})`);
    heart.addColorStop(1, "rgba(168,193,255,0)");
    ctx.fillStyle = heart;
    ctx.fillRect(0, 0, width, height);

    const cY = Math.cos(ry), sY = Math.sin(ry);
    const cX = Math.cos(rx), sX = Math.sin(rx);

    for (const s of stars) {
      s.phase += s.speed * speedK * dt;
      // position on the star's own orbital plane
      const ca = Math.cos(s.phase), sa = Math.sin(s.phase);
      const ci = Math.cos(s.incl), si = Math.sin(s.incl);
      const cn = Math.cos(s.node), sn = Math.sin(s.node);
      let x = s.r * (cn * ca - sn * sa * ci);
      let y = s.r * (sn * ca + cn * sa * ci);
      let z = s.r * (sa * si);
      // the whole swarm leans toward your pointer
      x += leanX * (1 - s.r * 0.5); y += leanY * (1 - s.r * 0.5);
      // view rotation
      const x1 = x * cY - z * sY, z1 = x * sY + z * cY;
      const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      const depth = (z2 + 1) / 2;

      const px = cx + x1 * R, py = cy + y2 * R;
      const twinkle = 0.82 + 0.18 * Math.sin(now * 0.0021 + s.tw);
      const a = (0.16 + depth * 0.8) * twinkle * (0.75 + wake * 0.45);
      const rad = (s.size * (0.34 + depth * 1.05) * (size / 96)) * (1 + wake * 0.18);

      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fillStyle = s.warm
        ? `rgba(242,230,196,${Math.min(1, a * 1.1).toFixed(3)})`
        : `rgba(${Math.round(206 + depth * 44)},${Math.round(220 + depth * 30)},255,${a.toFixed(3)})`;
      ctx.fill();
    }

    if (reduce) return;                       // one beautiful still, no loop
    raf = requestAnimationFrame(draw);
  };

  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  addEventListener("pointerup", onUp, { passive: true });
  raf = requestAnimationFrame(draw);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onPointer);
    removeEventListener("pointerdown", onDown);
    removeEventListener("pointerup", onUp);
  };
}
