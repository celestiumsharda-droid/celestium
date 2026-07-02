type LivingOrbOptions = {
  count?: number;
  connectionDistance?: number;
  drift?: number;
  parallax?: number;
};

type Point = {
  x: number;
  y: number;
  z: number;
  seed: number;
};

export function initLivingOrb(canvas: HTMLCanvasElement | null, options: LivingOrbOptions = {}): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = options.count ?? 104;
  const drift = reduce ? 0 : options.drift ?? 0.0038;
  const parallax = reduce ? 0 : options.parallax ?? 0.72;
  const connectionDistance = options.connectionDistance ?? 34;
  const points: Point[] = [];

  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    points.push({
      x: r * Math.cos(t),
      y: r * Math.sin(t),
      z: u,
      seed: Math.random() * Math.PI * 2,
    });
  }

  let alive = true;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rx = 0.24;
  let ry = -0.18;
  let tx = 0.24;
  let ty = -0.18;
  let hover = 0;
  let t0 = performance.now();

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || canvas.width || 96);
    const cssH = Math.max(1, rect.height || canvas.height || 96);
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);
    if (cssW === width && cssH === height && nextDpr === dpr) return;
    width = cssW;
    height = cssH;
    dpr = nextDpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const onPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (event.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
    const ny = (event.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);
    const inside = Math.abs(nx) < 1.45 && Math.abs(ny) < 1.45;
    hover = inside ? 1 : Math.max(0, hover - 0.035);
    tx = 0.18 + Math.max(-1.8, Math.min(1.8, ny)) * parallax;
    ty = -0.18 + Math.max(-1.8, Math.min(1.8, nx)) * parallax;
  };

  const draw = (now: number) => {
    if (!alive) return;
    resize();
    const elapsed = (now - t0) / 1000;
    t0 = now;
    rx += (tx - rx) * 0.055 + drift * elapsed * 16;
    ry += (ty - ry) * 0.055 + drift * elapsed * 26;
    hover *= 0.982;

    const size = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2;
    const radius = size * 0.38;
    const cY = Math.cos(ry);
    const sY = Math.sin(ry);
    const cX = Math.cos(rx);
    const sX = Math.sin(rx);
    const projected: Array<{ x: number; y: number; z: number; a: number; r: number }> = [];

    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.5);
    glow.addColorStop(0, `rgba(238,246,255,${0.12 + hover * 0.08})`);
    glow.addColorStop(0.42, "rgba(160,188,255,.055)");
    glow.addColorStop(1, "rgba(160,188,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    for (const p of points) {
      const wobble = Math.sin(now * 0.0007 + p.seed) * 0.018;
      const px = p.x + wobble;
      const x1 = px * cY - p.z * sY;
      const z1 = px * sY + p.z * cY;
      const y2 = p.y * cX - z1 * sX;
      const z2 = p.y * sX + z1 * cX;
      const depth = (z2 + 1) / 2;
      projected.push({
        x: cx + x1 * radius,
        y: cy + y2 * radius,
        z: depth,
        a: 0.18 + depth * 0.82,
        r: (0.65 + depth * 2.05) * (size / 96),
      });
    }

    ctx.lineWidth = Math.max(0.55, size / 180);
    for (let i = 0; i < projected.length; i++) {
      const a = projected[i];
      if (!a) continue;
      for (let j = i + 1; j < projected.length; j++) {
        const b = projected[j];
        if (!b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > connectionDistance * (size / 96)) continue;
        const alpha = (1 - dist / (connectionDistance * (size / 96))) * Math.min(a.a, b.a) * 0.18;
        ctx.strokeStyle = `rgba(203,221,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const p of projected.sort((a, b) => a.z - b.z)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(205 + p.z * 50)},${Math.round(220 + p.z * 35)},255,${p.a.toFixed(3)})`;
      ctx.fill();
    }

    if (reduce) return;
    requestAnimationFrame(draw);
  };

  addEventListener("pointermove", onPointer, { passive: true });
  requestAnimationFrame(draw);

  return () => {
    alive = false;
    removeEventListener("pointermove", onPointer);
  };
}
