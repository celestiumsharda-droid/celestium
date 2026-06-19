/* Procedural night-landscape panoramas for the Earth planetarium.
   Equirectangular 2048×1024: top half (v>0.5) = sky → TRANSPARENT so the real
   stars show through; a soft airglow band hugs the horizon; the bottom half is
   the opaque ground, capped by a silhouette ridge that rises above the horizon.
   Rasterised from SVG via sharp → PNG with alpha. */
const sharp = require("../node_modules/sharp");
const fs = require("fs");
const path = require("path");

const W = 2048, H = 1024, HOR = H * 0.5;            // horizon row (zenith at top)
const OUT = path.join(__dirname, "..", "public", "textures", "panorama");
fs.mkdirSync(OUT, { recursive: true });

// a seeded RNG so each scene is repeatable
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// a smooth, rolling horizon ridge: a few low-frequency sines that wrap
// seamlessly at u=0..W; optional gentle jitter (smoothed) for broken terrain
function ridge(rand, opts) {
  const { amp, rough, base } = opts;
  const harmonics = [];
  for (let k = 0; k < 5; k++) harmonics.push({ f: 1 + k, a: Math.pow(0.52, k) * (0.6 + rand() * 0.6), p: rand() * 6.283 });
  const step = 6, raw = [];
  for (let x = 0; x <= W; x += step) {
    const t = (x / W) * 6.283;
    let y = 0;
    for (const h of harmonics) y += h.a * Math.sin(h.f * t + h.p);
    raw.push(y + (rand() - 0.5) * rough * 0.04);
  }
  // 3-pass moving-average smoothing so the silhouette reads as terrain, not noise
  for (let s = 0; s < 3; s++) for (let i = 1; i < raw.length - 1; i++) raw[i] = (raw[i - 1] + 2 * raw[i] + raw[i + 1]) / 4;
  const norm = Math.max(...raw.map(Math.abs)) || 1;
  const pts = [];
  for (let i = 0; i < raw.length; i++) pts.push([i * step, HOR - base - amp * (0.5 + 0.5 * raw[i] / norm)]);
  return pts;
}

function pathFrom(pts) {
  let d = `M0,${H} L0,${pts[0][1].toFixed(1)}`;
  for (const [x, y] of pts) d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  d += ` L${W},${H} Z`;
  return d;
}

const SCENES = [
  { name: "mountains", seed: 7,  ground: "#05070d", ridge: "#070a12", glow: "#2a3a66", glow2: "#0a1430", amp: 150, rough: 10, base: 6, layers: 2 },
  { name: "forest",    seed: 21, ground: "#040a08", ridge: "#050c0a", glow: "#16341f", glow2: "#06140d", amp: 70,  rough: 46, base: 4, layers: 1, spikes: true },
  { name: "desert",    seed: 39, ground: "#0b0805", ridge: "#0d0a07", glow: "#5a3618", glow2: "#1c0f06", amp: 95,  rough: 6,  base: 8, layers: 2 },
  { name: "city",      seed: 54, ground: "#06070c", ridge: "#090b14", glow: "#6e4a1e", glow2: "#241405", amp: 120, rough: 8,  base: 4, layers: 2, city: true },
  { name: "plains",    seed: 88, ground: "#060810", ridge: "#080b15", glow: "#314a78", glow2: "#0b1730", amp: 40,  rough: 8,  base: 5, layers: 1 },
];

function citySkyline(rand) {
  // blocky buildings with lit windows, rising above the horizon
  let d = "", lights = "";
  let x = 0;
  while (x < W) {
    const w = 14 + rand() * 46;
    const h = 12 + rand() * 150;
    const top = HOR - h;
    d += `M${x.toFixed(1)},${HOR} L${x.toFixed(1)},${top.toFixed(1)} L${(x + w).toFixed(1)},${top.toFixed(1)} L${(x + w).toFixed(1)},${HOR} Z `;
    for (let gy = top + 6; gy < HOR - 4; gy += 9) for (let gx = x + 4; gx < x + w - 3; gx += 8) {
      if (rand() < 0.32) lights += `<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="2.2" height="3" fill="#ffd986" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`;
    }
    x += w + 2 + rand() * 6;
  }
  return { d, lights };
}

function svgFor(scene) {
  const rand = rng(scene.seed);
  const glowH = 150;
  let layers = "";
  // distant haze ridges behind the main one (parallax depth)
  for (let i = scene.layers; i >= 1; i--) {
    const r = ridge(rand, { amp: scene.amp * (0.5 + 0.18 * i), rough: scene.rough, base: scene.base + i * 18 });
    const shade = i === 1 ? scene.ridge : "#0a0f1c";
    layers += `<path d="${pathFrom(r)}" fill="${shade}" opacity="${i === 1 ? 1 : 0.5}"/>`;
  }
  let extra = "", lit = "";
  if (scene.city) { const c = citySkyline(rand); extra = `<path d="${c.d}" fill="${scene.ridge}"/>`; lit = c.lights; }
  if (scene.spikes) {
    // tall conifer silhouettes
    for (let i = 0; i < 90; i++) {
      const x = rand() * W, h = 24 + rand() * 64, w = 5 + rand() * 7, top = HOR - scene.base - h;
      extra += `<path d="M${(x - w).toFixed(1)},${(HOR - scene.base).toFixed(1)} L${x.toFixed(1)},${top.toFixed(1)} L${(x + w).toFixed(1)},${(HOR - scene.base).toFixed(1)} Z" fill="${scene.ridge}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="glow" x1="0" y1="${HOR}" x2="0" y2="${HOR - glowH}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${scene.glow}" stop-opacity="0.85"/>
      <stop offset="0.45" stop-color="${scene.glow2}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${scene.glow2}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="grd" x1="0" y1="${HOR}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${scene.ridge}"/>
      <stop offset="1" stop-color="${scene.ground}"/>
    </linearGradient>
  </defs>
  <!-- airglow hugging the horizon, fading up into the transparent sky -->
  <rect x="0" y="${HOR - glowH}" width="${W}" height="${glowH}" fill="url(#glow)"/>
  <!-- opaque ground fill below horizon -->
  <rect x="0" y="${HOR}" width="${W}" height="${H - HOR}" fill="url(#grd)"/>
  ${layers}
  ${extra}
  ${lit}
</svg>`;
}

(async () => {
  for (const scene of SCENES) {
    const svg = svgFor(scene);
    const file = path.join(OUT, `pano-${scene.name}.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
    console.log(scene.name, Math.round(fs.statSync(file).size / 1024) + "KB");
  }
  console.log("panoramas →", OUT);
})().catch(e => { console.error(e); process.exit(1); });
