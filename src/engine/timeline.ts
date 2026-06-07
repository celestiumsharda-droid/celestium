/* =====================================================================
   CELESTIUM — "TWO CLOCKS, ONE STORY" · THE MATERIALISING SWARM
   One swarm of GPU particles that scrubs with scroll and continuously
   *materialises* into a recognizable form for each moment of the story:

     fireball → first light → a star → its elements (an atom) →
     the Sun and its worlds → a living cell → molecules → impact →
     the DNA of mind → an eye → curved spacetime → a galaxy →
     a gravitational-wave ring → and finally a brain (you).

   Each form is a target cloud of N positions; the shader morphs the swarm
   from one to the next with a burst of flow-noise at mid-transition so the
   particles *swarm* into place. Deterministic in the scroll uniform, so it
   scrubs both ways. One draw call + bloom. rAF only while on screen. Reuses
   the HUD (card + two-clocks gap bar) and the reduced-motion list fallback.
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { TimelineEntry } from "./types";
import { playClick } from "./sound";

interface Opts { canvas: HTMLCanvasElement; track: HTMLElement; card: HTMLElement; gap: HTMLElement; data: readonly TimelineEntry[]; }

const NOW_YEAR = 2026;
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);

/* HUD colour ramp (warm Big Bang → cool now) */
function mixc(c1: number[], c2: number[], t: number): string {
  return `rgb(${Math.round(lerp(c1[0]!, c2[0]!, t))},${Math.round(lerp(c1[1]!, c2[1]!, t))},${Math.round(lerp(c1[2]!, c2[2]!, t))})`;
}
const WARM = [255, 244, 214], MIDC = [201, 178, 255], COOL = [169, 188, 255];
const eventColor = (t: number) => (t < 0.5 ? mixc(WARM, MIDC, t * 2) : mixc(MIDC, COOL, (t - 0.5) * 2));

const LOG_MAX = Math.log10(13.8e9);
const axisX = (ya: number) => (ya <= 1 ? 1 : clamp(1 - Math.log10(ya) / LOG_MAX, 0, 1));
function agoLabel(ya: number): string {
  if (ya <= 0) return "right now";
  if (ya >= 1e9) return `${(ya / 1e9).toFixed(1)} billion yrs ago`;
  if (ya >= 1e6) return `${Math.round(ya / 1e6)} million yrs ago`;
  if (ya >= 1e3) return `${Math.round(ya / 1e3)},000 yrs ago`;
  return `${Math.round(ya)} yrs ago`;
}

/* ---- seeded RNG ---- */
function mkRnd(s: number) { return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

/* ===================================================================
   FORM GENERATORS — each fills `a` (Float32Array length N*3), XY-plane,
   fitting roughly ±90 units, with a little Z depth. Returns nothing.
   =================================================================== */
type Gen = (a: Float32Array, N: number) => void;
const set = (a: Float32Array, i: number, x: number, y: number, z: number) => { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
function gaussR(rnd: () => number) { return (rnd() + rnd() + rnd() - 1.5); }

const fFireball: Gen = (a, N) => { const r = mkRnd(7); for (let i = 0; i < N; i++) { const rad = Math.pow(r(), 1.8) * 16, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th) * 0.7); } };

const fLight: Gen = (a, N) => { const r = mkRnd(11); for (let i = 0; i < N; i++) { const rad = 74 + gaussR(r) * 5, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th) * 0.5); } };

const fStar: Gen = (a, N) => { const r = mkRnd(23); for (let i = 0; i < N; i++) { if (r() < 0.84) { const rad = Math.pow(r(), 0.5) * 34, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const k = (r() * 6 | 0), ang = k / 6 * TAU + gaussR(r) * 0.12, d = 34 + r() * 48; set(a, i, Math.cos(ang) * d, Math.sin(ang) * d, gaussR(r) * 4); } } };

const fAtom: Gen = (a, N) => { const r = mkRnd(31); for (let i = 0; i < N; i++) { if (r() < 0.24) { const rad = Math.pow(r(), 0.6) * 13, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const rot = (r() * 3 | 0) * Math.PI / 3, ang = r() * TAU; let x = Math.cos(ang) * 66 + gaussR(r) * 1.8, y = Math.sin(ang) * 24 + gaussR(r) * 1.8; const c = Math.cos(rot), s = Math.sin(rot); set(a, i, x * c - y * s, x * s + y * c, gaussR(r) * 2.5); } } };

const fSolar: Gen = (a, N) => { const r = mkRnd(41); const orbits = [34, 50, 66, 82]; for (let i = 0; i < N; i++) { if (r() < 0.3) { const rad = Math.pow(r(), 0.7) * 16, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const oi = r() * orbits.length | 0, R = orbits[oi]!; let ang = r() * TAU; const planet = r() < 0.28; if (planet) { ang = (oi * 1.7) + gaussR(r) * 0.18; } set(a, i, Math.cos(ang) * R + gaussR(r) * 1.6, Math.sin(ang) * R * 0.42 + gaussR(r) * 1.6, gaussR(r) * 2); } } };

const fCell: Gen = (a, N) => { const r = mkRnd(53); for (let i = 0; i < N; i++) { const roll = r(); if (roll < 0.42) { const ang = r() * TAU, R = 72 + gaussR(r) * 3; set(a, i, Math.cos(ang) * R, Math.sin(ang) * R, gaussR(r) * 3); } else if (roll < 0.62) { const rad = Math.pow(r(), 0.7) * 18, ang = r() * TAU; set(a, i, Math.cos(ang) * rad + 6, Math.sin(ang) * rad - 4, gaussR(r) * 4); } else { const ang = r() * TAU, R = Math.pow(r(), 0.6) * 64, cx = Math.cos(ang) * R, cy = Math.sin(ang) * R; set(a, i, cx + gaussR(r) * 4, cy + gaussR(r) * 4, gaussR(r) * 4); } } };

const fMolecule: Gen = (a, N) => { const r = mkRnd(61); const sites: number[][] = []; for (let k = 0; k < 9; k++) sites.push([(r() - 0.5) * 150, (r() - 0.5) * 120, (r() - 0.5) * 30]); for (let i = 0; i < N; i++) { const s = sites[(r() * sites.length | 0)]!; const lobe = r() < 0.5 ? -1 : 1; const rad = Math.pow(r(), 0.6) * 9; const th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, s[0]! + lobe * 11 + rad * Math.sin(th) * Math.cos(ph), s[1]! + rad * Math.sin(th) * Math.sin(ph), s[2]! + rad * Math.cos(th)); } };

/* Earth — a real lit globe with ocean/land/ice colour (in aEarth) plus a
   bright incoming impactor. Fills both the position and the colour arrays. */
function buildEarth(pos: Float32Array, col: Float32Array, N: number): void {
  const r = mkRnd(71), R = 56;
  const conts: number[][] = [];
  for (let k = 0; k < 6; k++) { const th = Math.acos(2 * r() - 1), ph = r() * TAU; conts.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]); }
  const impactStart = Math.floor(N * 0.95);
  for (let i = 0; i < N; i++) {
    if (i >= impactStart) {                       // the asteroid: a hot streak inbound
      const t = (i - impactStart) / Math.max(1, N - impactStart);
      set(pos, i, 100 - t * 56 + gaussR(r) * 2, 72 - t * 40 + gaussR(r) * 2, 26 - t * 16);
      col[i * 3] = 1.0; col[i * 3 + 1] = 0.66; col[i * 3 + 2] = 0.3;
      continue;
    }
    const th = Math.acos(2 * r() - 1), ph = r() * TAU;
    const vx = Math.sin(th) * Math.cos(ph), vy = Math.cos(th), vz = Math.sin(th) * Math.sin(ph);
    let land = 0;
    for (const c of conts) { const dd = vx * c[0]! + vy * c[1]! + vz * c[2]!; if (dd > 0.7) land = Math.max(land, (dd - 0.7) / 0.3); }
    land *= 0.55 + 0.45 * r();
    set(pos, i, vx * R, vy * R, vz * R);
    if (Math.abs(vy) > 0.84) { col[i * 3] = 0.82; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 1.0; }            // ice caps
    else if (land > 0.28) { col[i * 3] = 0.27 + 0.18 * r(); col[i * 3 + 1] = 0.52 + 0.16 * r(); col[i * 3 + 2] = 0.23; } // land
    else { col[i * 3] = 0.11; col[i * 3 + 1] = 0.32 + 0.12 * r(); col[i * 3 + 2] = 0.72 + 0.14 * r(); }     // ocean
  }
}

const fDNA: Gen = (a, N) => { const r = mkRnd(83); const H = 150, turns = 2.4, rad = 40; for (let i = 0; i < N; i++) { const roll = r(); const t = r(); const y = (t - 0.5) * H; const ang = t * turns * TAU; if (roll < 0.46) { set(a, i, Math.cos(ang) * rad + gaussR(r) * 0.8, y, Math.sin(ang) * rad + gaussR(r) * 0.8); } else if (roll < 0.92) { set(a, i, Math.cos(ang + Math.PI) * rad + gaussR(r) * 0.8, y, Math.sin(ang + Math.PI) * rad + gaussR(r) * 0.8); } else { const u = Math.round(t * turns * 10) / 10; const ra = u * turns * TAU; const uu = r(); set(a, i, lerp(Math.cos(ra), Math.cos(ra + Math.PI), uu) * rad, (u - 0.5) * H, lerp(Math.sin(ra), Math.sin(ra + Math.PI), uu) * rad); } } };

const fGalaxy: Gen = (a, N) => { const r = mkRnd(97), GR = 88; for (let i = 0; i < N; i++) { if (r() < 0.26) { const br = Math.pow(r(), 2.2) * GR * 0.26, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, br * Math.sin(th) * Math.cos(ph), br * Math.sin(th) * Math.sin(ph), br * Math.cos(th) * 0.5); } else { const gr = Math.pow(r(), 0.6) * GR, arm = r() < 0.5 ? 0 : Math.PI, spin = arm + 4.8 * Math.log(gr / 9 + 1), th = spin + gaussR(r) * (0.2 + 0.5 * gr / GR); set(a, i, gr * Math.cos(th), gr * Math.sin(th), gaussR(r) * 4); } } };

const fGrid: Gen = (a, N) => { const r = mkRnd(101), G = 84, well = (d: number) => -38 * Math.exp(-d * d / 1100); for (let i = 0; i < N; i++) { const onLine = r() < 0.5; let x: number, y: number; if (onLine) { const gx = Math.round((r() * 2 - 1) * 5) / 5 * G; x = gx; y = (r() * 2 - 1) * G; } else { const gy = Math.round((r() * 2 - 1) * 5) / 5 * G; y = gy; x = (r() * 2 - 1) * G; } const d = Math.hypot(x, y); set(a, i, x, y * 0.5 + well(d) * 0.35, well(d)); } };

const fWaves: Gen = (a, N) => { const r = mkRnd(103); for (let i = 0; i < N; i++) { const roll = r(); if (roll < 0.4) { const which = r() < 0.5 ? -1 : 1, t = r(), spin = t * 5 * TAU, rr = 8 + t * 18; set(a, i, which * 22 + Math.cos(spin) * rr * (1 - t * 0.6), Math.sin(spin) * rr * (1 - t * 0.6), gaussR(r) * 2); } else { const ring = (r() * 4 | 0), R = 30 + ring * 16, ang = r() * TAU; set(a, i, Math.cos(ang) * R, Math.sin(ang) * R * 0.7, gaussR(r) * 2); } } };

/* silhouette sampler — turn a drawn shape into particle positions */
function silhouette(seed: number, scale: number, draw: (cx: CanvasRenderingContext2D, S: number) => void): Gen {
  return (a, N) => {
    const r = mkRnd(seed), S = 240, c = document.createElement("canvas"); c.width = c.height = S;
    const cx = c.getContext("2d"); if (!cx) { fStar(a, N); return; }
    cx.fillStyle = "#000"; cx.fillRect(0, 0, S, S); cx.fillStyle = "#fff"; draw(cx, S);
    const d = cx.getImageData(0, 0, S, S).data; const pts: number[] = [];
    for (let y = 0; y < S; y += 1) for (let x = 0; x < S; x += 1) if (d[(y * S + x) * 4]! > 110) { pts.push(x, y); }
    const M = pts.length / 2 || 1;
    for (let i = 0; i < N; i++) { const k = (r() * M | 0) * 2; const px = pts[k] ?? S / 2, py = pts[k + 1] ?? S / 2; set(a, i, (px / S - 0.5) * 2 * scale + gaussR(r) * 0.8, -(py / S - 0.5) * 2 * scale + gaussR(r) * 0.8, gaussR(r) * scale * 0.05); }
  };
}

const fEye: Gen = silhouette(111, 92, (cx, S) => {
  const c = S / 2;
  // almond outline (two arcs) filled
  cx.beginPath(); cx.ellipse(c, c, S * 0.42, S * 0.24, 0, 0, TAU); cx.fill();
  cx.globalCompositeOperation = "destination-out";
  cx.beginPath(); cx.ellipse(c, c - S * 0.28, S * 0.42, S * 0.22, 0, 0, TAU); cx.fill();
  cx.beginPath(); cx.ellipse(c, c + S * 0.28, S * 0.42, S * 0.22, 0, 0, TAU); cx.fill();
  cx.globalCompositeOperation = "source-over";
  cx.beginPath(); cx.arc(c, c, S * 0.16, 0, TAU); cx.fill();        // iris
  cx.fillStyle = "#000"; cx.beginPath(); cx.arc(c, c, S * 0.075, 0, TAU); cx.fill(); // pupil
});

const fBrain: Gen = silhouette(127, 98, (cx, S) => {
  const c = S / 2, r = mkRnd(5);
  // two bumpy hemispheres (the iconic top-down brain)
  for (const side of [-1, 1]) {
    const hx = c + side * S * 0.155;
    cx.beginPath(); cx.ellipse(hx, c, S * 0.18, S * 0.29, 0, 0, TAU); cx.fill();
    for (let k = 0; k < 20; k++) { const ang = (k / 20) * TAU; const rx = Math.cos(ang) * S * 0.17, ry = Math.sin(ang) * S * 0.28; cx.beginPath(); cx.arc(hx + rx, c + ry, S * 0.045 + r() * S * 0.016, 0, TAU); cx.fill(); }
  }
  // cerebellum + stem at the base
  cx.beginPath(); cx.ellipse(c, c + S * 0.30, S * 0.1, S * 0.065, 0, 0, TAU); cx.fill();
  cx.fillRect(c - S * 0.02, c + S * 0.33, S * 0.04, S * 0.08);
  // carve the central longitudinal fissure
  cx.globalCompositeOperation = "destination-out";
  cx.fillRect(c - S * 0.014, c - S * 0.3, S * 0.028, S * 0.58);
  cx.globalCompositeOperation = "source-over";
});

/* one form per timeline event (14): generator, base colour, camera distance,
   and how much it should bloom (stars glow; silhouettes stay crisp). */
const COL = (hex: number) => new THREE.Color(hex);
const FORMS: { gen: Gen; col: THREE.Color; cam: number; bloom: number }[] = [
  { gen: fFireball, col: COL(0xfff1d6), cam: 130, bloom: 0.75 }, // Big Bang
  { gen: fLight,    col: COL(0xffe6b8), cam: 210, bloom: 0.7 },  // First Light
  { gen: fStar,     col: COL(0xfff0cf), cam: 150, bloom: 0.85 }, // First Stars
  { gen: fAtom,     col: COL(0x9fc0ff), cam: 132, bloom: 0.22 }, // elements
  { gen: fSolar,    col: COL(0xffd9a0), cam: 235, bloom: 0.55 }, // Sun & worlds
  { gen: fCell,     col: COL(0x9ff0c4), cam: 175, bloom: 0.28 }, // Life begins
  { gen: fMolecule, col: COL(0xbaf0a0), cam: 185, bloom: 0.3 },  // Oxygen
  { gen: (a, n) => buildEarth(a, new Float32Array(n * 3), n), col: COL(0x6fa8ff), cam: 150, bloom: 0.34 }, // Earth & the asteroid
  { gen: fDNA,      col: COL(0x8ff0e0), cam: 165, bloom: 0.2 },  // A mind appears
  { gen: fEye,      col: COL(0xbcd0ff), cam: 160, bloom: 0.18 }, // First telescope
  { gen: fGrid,     col: COL(0xb9a9ff), cam: 215, bloom: 0.24 }, // Gravity
  { gen: fGalaxy,   col: COL(0xcdd6ff), cam: 235, bloom: 0.55 }, // Universe growing
  { gen: fWaves,    col: COL(0xa9bcff), cam: 205, bloom: 0.4 },  // LIGO
  { gen: fBrain,    col: COL(0xf2e6c4), cam: 195, bloom: 0.2 },  // You
];

/* ---- GLSL ---- */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

const VERT = /* glsl */`
uniform float uTime, uMix, uBurst, uSize, uDpr, uEarth;
uniform vec3 uColA, uColB;
attribute vec3 aTo; attribute vec3 aEarth; attribute float aSeed;
varying vec3 vCol; varying float vA;
${SNOISE}
void main(){
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 p = mix(position, aTo, m);
  float trans = sin(m * 3.14159265);
  // (1) the swarm — particles fly apart and stream into the next form
  float t = uTime * 0.05 + aSeed * 6.2831;
  vec3 turb = vec3(snoise(p*0.045 + t), snoise(p*0.045 + t + 13.3), snoise(p*0.045 + t + 27.1));
  p += turb * (trans * 12.0);
  // (2) ceaseless life — a gentle, ever-moving drift so a held form keeps
  // breathing and shimmering instead of freezing solid
  float lt = uTime * 0.55 + aSeed * 40.0;
  vec3 life = vec3(snoise(p*0.12 + lt), snoise(p*0.12 + lt + 5.0), snoise(p*0.12 + lt + 11.0));
  p += life * (1.25 + trans * 1.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * uDpr * (260.0 / -mv.z), 0.5, 5.5);
  float br = 0.55 + 0.45 * fract(aSeed * 91.7);
  // (3) twinkle — each particle pulses on its own phase, so the form sparkles
  float tw = 0.72 + 0.28 * sin(uTime * 2.4 + aSeed * 120.0);
  vec3 base = mix(uColA, uColB, m);
  // Earth: swap to per-particle ocean/land colour, lit by a day/night terminator
  if (uEarth > 0.001) {
    float lit = 0.32 + 0.68 * clamp(dot(normalize(position + 0.0001), vec3(0.55, 0.35, 0.76)), 0.0, 1.0);
    base = mix(base, aEarth * lit, uEarth);
  }
  vCol = base * br * tw * (1.0 + uBurst * 1.4);
  vA = (0.26 + 0.26 * fract(aSeed * 53.1)) * tw + uBurst * 0.35 + trans * 0.12;
}`;

const FRAG = /* glsl */`
precision mediump float;
varying vec3 vCol; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d,d); if (r2 > 0.25) discard;
  gl_FragColor = vec4(vCol, smoothstep(0.25, 0.0, r2) * vA); }`;

export function mountTimeline(opts: Opts): () => void {
  const { canvas, track, card, gap, data } = opts;
  const N = data.length;
  const small = matchMedia("(max-width: 760px)").matches;
  const hudCol = data.map((_, i) => eventColor(N > 1 ? i / (N - 1) : 0));

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (_e) { return () => {}; }
  renderer.setClearColor(0x050609, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.5, 0.5);
  composer.addPass(bloom);

  // particle count, and precompute every form
  const PC = small ? 22000 : 42000;
  const F = FORMS.length;
  const EARTH = 7;
  const earthColor = new Float32Array(PC * 3);
  const forms: Float32Array[] = [];
  for (let k = 0; k < F; k++) {
    const arr = new Float32Array(PC * 3);
    if (k === EARTH) buildEarth(arr, earthColor, PC); else FORMS[k]!.gen(arr, PC);
    forms.push(arr);
  }

  const posArr = new Float32Array(PC * 3); posArr.set(forms[0]!);
  const toArr = new Float32Array(PC * 3); toArr.set(forms[1] ?? forms[0]!);
  const seed = new Float32Array(PC); const sr = mkRnd(5); for (let i = 0; i < PC; i++) seed[i] = sr();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(toArr, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.setAttribute("aEarth", new THREE.BufferAttribute(earthColor, 3));
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const toAttr = geo.getAttribute("aTo") as THREE.BufferAttribute;

  const uniforms = {
    uTime: { value: 0 }, uMix: { value: 0 }, uBurst: { value: 0 },
    uSize: { value: small ? 1.7 : 2.0 }, uDpr: { value: dpr },
    uColA: { value: FORMS[0]!.col.clone() }, uColB: { value: (FORMS[1] ?? FORMS[0]!).col.clone() },
    uEarth: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(geo, mat));

  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  // ---- HUD ----
  let activeInt = -1, burst = 0, segFrom = -1;
  function setForm(i: number) {
    // load forms[i] -> position, forms[i+1] -> aTo
    if (i === segFrom) return;
    segFrom = i;
    posArr.set(forms[i]!); posAttr.needsUpdate = true;
    const j = Math.min(i + 1, F - 1);
    toArr.set(forms[j]!); toAttr.needsUpdate = true;
    uniforms.uColA.value.copy(FORMS[i]!.col);
    uniforms.uColB.value.copy(FORMS[j]!.col);
  }
  function setActive(i: number) {
    if (i === activeInt) return;
    const prev = activeInt; activeInt = i;
    const e = data[i]!, col = hudCol[i]!;
    const link = e.id ? `<a class="tl-read" href="/discoveries/${e.id}/">Read the full discovery →</a>` : "";
    card.innerHTML = `<div class="tl-when" style="color:${col}">${e.w}</div><h3 class="tl-title">${e.t}</h3><p class="tl-body">${e.b}</p><p class="tl-how"><span>How we know</span> ${e.d}</p>${link}`;
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    const xh = axisX(e.ya), xk = axisX(NOW_YEAR - e.knew);
    gap.querySelector<HTMLElement>(".gap-happened")!.style.left = `${(xh * 100).toFixed(2)}%`;
    gap.querySelector<HTMLElement>(".gap-knew")!.style.left = `${(xk * 100).toFixed(2)}%`;
    const fill = gap.querySelector<HTMLElement>(".gap-fill")!; const lo = Math.min(xh, xk), hi = Math.max(xh, xk);
    fill.style.left = `${(lo * 100).toFixed(2)}%`; fill.style.width = `${((hi - lo) * 100).toFixed(2)}%`;
    fill.style.background = `linear-gradient(90deg, ${col}, var(--accent))`;
    gap.querySelector<HTMLElement>(".gap-hl")!.textContent = agoLabel(e.ya);
    gap.querySelector<HTMLElement>(".gap-kl")!.textContent = e.knew >= NOW_YEAR ? "ongoing, now" : `${e.knew}`;
    gap.querySelector<HTMLElement>(".gap-happened")!.style.background = col;
    if (prev >= 0) { burst = 1; try { playClick(); } catch (_e) { /* audio off */ } }
  }

  // ---- scroll + loop ----
  let target = 0, cur = 0, running = false, raf = 0, last = performance.now();
  function readScroll() { const r = track.getBoundingClientRect(); const span = track.offsetHeight - window.innerHeight; target = (span > 0 ? clamp(-r.top / span, 0, 1) : 0) * (F - 1); }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    readScroll();
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    cur += (target - cur) * clamp(0.11 * dt, 0, 1);
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const i = clamp(Math.floor(cur), 0, F - 2);
    setForm(i);
    // dwell · morph · dwell — each form settles and is held crisp, then the
    // swarm flies into the next. This is what makes them read as real forms.
    const local = clamp(cur - i, 0, 1);
    const mm = clamp((local - 0.30) / 0.40, 0, 1);
    uniforms.uMix.value = mm;
    uniforms.uTime.value = now * 0.001;
    burst *= 0.9; uniforms.uBurst.value = burst;
    const mixT = smooth(mm);
    uniforms.uEarth.value = i === EARTH ? 1 - mixT : (i + 1 === EARTH ? mixT : 0);
    bloom.strength = lerp(FORMS[i]!.bloom, FORMS[Math.min(i + 1, F - 1)]!.bloom, mixT);
    // camera: gentle zoom journey between the two active forms + slow drift
    const camZ = lerp(FORMS[i]!.cam, FORMS[Math.min(i + 1, F - 1)]!.cam, mixT) * (small ? 1.5 : 1);
    const dr = now * 0.00004;
    camera.position.set(Math.sin(dr) * 14, small ? -8 : 6, camZ);
    camera.lookAt(0, small ? -8 : 0, 0);
    setActive(clamp(Math.round(cur), 0, F - 1));
    composer.render();
  }
  function start_() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize(); readScroll(); cur = target;
  addEventListener("resize", resize, { passive: true });
  const io = new IntersectionObserver(es => { es.some(e => e.isIntersecting) ? start_() : stop(); }, { rootMargin: "100px 0px" });
  io.observe(track);
  setForm(0); setActive(0); composer.render();

  return () => { stop(); io.disconnect(); removeEventListener("resize", resize); geo.dispose(); mat.dispose(); composer.dispose(); renderer.dispose(); };
}
