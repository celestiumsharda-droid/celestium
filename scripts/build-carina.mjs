/* Sculpt the JWST Cosmic Cliffs image into a 3D volumetric point cloud.
   Brighter gas/stars are sampled densely; each point is pushed back in depth by
   low-frequency value noise (the cliff surface) plus per-point jitter (cloud
   thickness), so the flat image becomes a wall of gas you can fly INTO.
   Output: public/nebula/carina_pos.f32 (xyz, normalized) + carina_col.u8 (rgb). */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";

const SRC = "C:/Users/devan/celestium/.nebtmp/carina.jpg";
const OUT = "C:/Users/devan/celestium/public/nebula";
mkdirSync(OUT, { recursive: true });

const SW = 1600;                       // sampling width (height from aspect)
const TARGET = 130000;                 // ~point budget (large soft puffs overlap into smooth gas)
const DEPTH = 0.17;                    // slab thickness (fraction of width) — a wall, not a ball
const JITTER = 0.03;

// 2D value noise for the large-scale depth undulation of the cliff face
function hash(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return hash(ix, iy) * (1 - u) * (1 - v) + hash(ix + 1, iy) * u * (1 - v) + hash(ix, iy + 1) * (1 - u) * v + hash(ix + 1, iy + 1) * u * v;
}

const img = sharp(SRC).resize(SW).removeAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, ch = info.channels;
console.log(`sampling ${W}x${H}`);

// first pass: total weighted brightness, to hit the point budget
let totalW = 0;
const lum = new Float32Array(W * H);
for (let i = 0, p = 0; i < W * H; i++, p += ch) {
  const r = data[p], g = data[p + 1], b = data[p + 2];
  const l = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
  const w = Math.pow(l, 1.35);          // bias toward the bright gas/stars; dust stays sparse
  lum[i] = w; totalW += w;
}
// REJECTION SAMPLING: scatter points at fully-random positions, accepted in
// proportion to local brightness. No pixel grid → no lattice/moiré.
const pos = [], col = [];
const aspect = H / W;
let placed = 0, attempts = 0;
const maxAttempts = TARGET * 60;
while (placed < TARGET && attempts < maxAttempts) {
  attempts++;
  const fx = Math.random(), fy = Math.random();
  const px = Math.min(W - 1, fx * W | 0), py = Math.min(H - 1, fy * H | 0);
  const i = py * W + px;
  if (Math.random() > lum[i]) continue;            // accept ∝ brightness
  const p = i * ch;
  const x = fx - 0.5;
  const y = -(fy - 0.5) * aspect;
  // depth: two octaves of noise (the cliff's large form + finer ripples) + jitter
  const zn = (vnoise(px * 0.009, py * 0.009) - 0.5) * 1.5 + (vnoise(px * 0.035 + 13, py * 0.035 + 7) - 0.5) * 0.6;
  const z = zn * DEPTH + (Math.random() - 0.5) * JITTER;
  pos.push(x, y, z);
  col.push(Math.min(255, data[p] * 1.05 + 6), Math.min(255, data[p + 1] * 1.05 + 6), Math.min(255, data[p + 2] * 1.05 + 8));
  placed++;
}
const n = pos.length / 3;
writeFileSync(`${OUT}/carina_pos.f32`, Buffer.from(new Float32Array(pos).buffer));
writeFileSync(`${OUT}/carina_col.u8`, Buffer.from(new Uint8Array(col)));
console.log(`${n} points -> carina_pos.f32 (${(n * 12 / 1048576).toFixed(1)}MB) + carina_col.u8 (${(n * 3 / 1048576).toFixed(1)}MB)`);
