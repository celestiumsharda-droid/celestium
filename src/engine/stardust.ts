/* =====================================================================
   CELESTIUM — "YOU ARE STARDUST"
   A personal cosmic origin story. A living swarm of particles traces the
   atoms of your body backward through everything that made them: you →
   your DNA → your atoms → the young Earth → the Sun's birth-cloud → a
   dying star's supernova → the first starlight → the Big Bang → and back
   to you. Same engine as the Timeline's Genesis: a deterministic, scroll-
   scrubbed GPU particle field with per-particle colour, bloom, ceaseless
   "life" drift, per-scene rotation, and drag-to-look. Reduced-motion users
   get the written journey instead (handled by the caller).
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { playClick } from "./sound";

/** Optional personalisation, computed by the page from name + birthday. */
export interface Person { youTitle: string; finaleTitle: string; finaleLine: string; }
interface Opts { canvas: HTMLCanvasElement; track: HTMLElement; caption: HTMLElement; person?: Person | null; }

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);
const set = (a: Float32Array, i: number, x: number, y: number, z: number) => { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
function mkRnd(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
const gaussR = (r: () => number) => (r() + r() + r() - 1.5) * 0.9;

type Gen = (a: Float32Array, N: number) => void;
type Paint = (pos: Float32Array, col: Float32Array, N: number) => void;

/* ---- silhouette sampler: turn a drawn 2D shape into particle positions ---- */
function silhouette(seed: number, scale: number, draw: (cx: CanvasRenderingContext2D, S: number) => void): Gen {
  return (a, N) => {
    const r = mkRnd(seed), S = 240, c = document.createElement("canvas"); c.width = c.height = S;
    const cx = c.getContext("2d"); if (!cx) { fStar(a, N); return; }
    cx.fillStyle = "#000"; cx.fillRect(0, 0, S, S); cx.fillStyle = "#fff"; draw(cx, S);
    const d = cx.getImageData(0, 0, S, S).data; const pts: number[] = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4]! > 110) pts.push(x, y);
    const M = pts.length / 2 || 1;
    for (let i = 0; i < N; i++) { const k = (r() * M | 0) * 2; const px = pts[k] ?? S / 2, py = pts[k + 1] ?? S / 2; set(a, i, (px / S - 0.5) * 2 * scale + gaussR(r) * 0.8, -(py / S - 0.5) * 2 * scale + gaussR(r) * 0.8, gaussR(r) * scale * 0.06); }
  };
}

/* ---- scene generators ---- */
const fPerson: Gen = silhouette(7, 120, (cx, S) => {
  const c = S / 2;
  cx.beginPath(); cx.arc(c, S * 0.2, S * 0.085, 0, TAU); cx.fill();                       // head
  cx.beginPath();                                                                          // torso
  cx.moveTo(c - S * 0.1, S * 0.3); cx.quadraticCurveTo(c, S * 0.28, c + S * 0.1, S * 0.3);
  cx.lineTo(c + S * 0.085, S * 0.62); cx.lineTo(c - S * 0.085, S * 0.62); cx.closePath(); cx.fill();
  cx.lineCap = "round"; cx.strokeStyle = "#fff";
  cx.lineWidth = S * 0.05; cx.beginPath(); cx.moveTo(c - S * 0.09, S * 0.33); cx.lineTo(c - S * 0.17, S * 0.52); cx.stroke(); // arms
  cx.beginPath(); cx.moveTo(c + S * 0.09, S * 0.33); cx.lineTo(c + S * 0.17, S * 0.52); cx.stroke();
  cx.lineWidth = S * 0.055; cx.beginPath(); cx.moveTo(c - S * 0.05, S * 0.62); cx.lineTo(c - S * 0.07, S * 0.86); cx.stroke(); // legs
  cx.beginPath(); cx.moveTo(c + S * 0.05, S * 0.62); cx.lineTo(c + S * 0.07, S * 0.86); cx.stroke();
});

const fDNA: Gen = (a, N) => { const r = mkRnd(83); const H = 150, turns = 2.4, rad = 40; for (let i = 0; i < N; i++) { const roll = r(); const t = r(); const y = (t - 0.5) * H; const ang = t * turns * TAU; if (roll < 0.46) set(a, i, Math.cos(ang) * rad + gaussR(r) * 0.8, y, Math.sin(ang) * rad + gaussR(r) * 0.8); else if (roll < 0.92) set(a, i, Math.cos(ang + Math.PI) * rad + gaussR(r) * 0.8, y, Math.sin(ang + Math.PI) * rad + gaussR(r) * 0.8); else { const u = r(); const ra = t * turns * TAU; set(a, i, lerp(Math.cos(ra), Math.cos(ra + Math.PI), u) * rad, y, lerp(Math.sin(ra), Math.sin(ra + Math.PI), u) * rad); } } };

const fAtom: Gen = (a, N) => { const r = mkRnd(31); for (let i = 0; i < N; i++) { if (r() < 0.24) { const rad = Math.pow(r(), 0.6) * 13, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const rot = (r() * 3 | 0) * Math.PI / 3, ang = r() * TAU; const x = Math.cos(ang) * 66 + gaussR(r) * 1.8, y = Math.sin(ang) * 24 + gaussR(r) * 1.8; const cc = Math.cos(rot), s = Math.sin(rot); set(a, i, x * cc - y * s, x * s + y * cc, gaussR(r) * 2.5); } } };

function buildEarth(pos: Float32Array, col: Float32Array, N: number): void {
  const r = mkRnd(71), R = 56;
  const conts: number[][] = [];
  for (let k = 0; k < 6; k++) { const th = Math.acos(2 * r() - 1), ph = r() * TAU; conts.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]); }
  for (let i = 0; i < N; i++) {
    const th = Math.acos(2 * r() - 1), ph = r() * TAU;
    const vx = Math.sin(th) * Math.cos(ph), vy = Math.cos(th), vz = Math.sin(th) * Math.sin(ph);
    let land = 0;
    for (const c of conts) { const dd = vx * c[0]! + vy * c[1]! + vz * c[2]!; if (dd > 0.7) land = Math.max(land, (dd - 0.7) / 0.3); }
    land *= 0.55 + 0.45 * r();
    set(pos, i, vx * R, vy * R, vz * R);
    let cr: number, cg: number, cb: number;
    if (Math.abs(vy) > 0.84) { cr = 0.82; cg = 0.88; cb = 1.0; }
    else if (land > 0.28) { cr = 0.27 + 0.18 * r(); cg = 0.52 + 0.16 * r(); cb = 0.23; }
    else { cr = 0.11; cg = 0.32 + 0.12 * r(); cb = 0.72 + 0.14 * r(); }
    const lit = 0.28 + 0.72 * Math.max(0, vx * 0.55 + vy * 0.3 + vz * 0.78);
    col[i * 3] = cr * lit; col[i * 3 + 1] = cg * lit; col[i * 3 + 2] = cb * lit;
  }
}

const fSolar: Gen = (a, N) => { const r = mkRnd(41); const orbits = [34, 50, 66, 82]; for (let i = 0; i < N; i++) { if (r() < 0.32) { const rad = Math.pow(r(), 0.7) * 17, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const oi = r() * orbits.length | 0, R = orbits[oi]!; const ang = r() * TAU; set(a, i, Math.cos(ang) * R + gaussR(r) * 1.6, Math.sin(ang) * R * 0.42 + gaussR(r) * 1.6, gaussR(r) * 2); } } };

const fStar: Gen = (a, N) => { const r = mkRnd(23); for (let i = 0; i < N; i++) { if (r() < 0.84) { const rad = Math.pow(r(), 0.5) * 34, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)); } else { const k = r() * 6 | 0, ang = k / 6 * TAU + gaussR(r) * 0.12, d = 34 + r() * 48; set(a, i, Math.cos(ang) * d, Math.sin(ang) * d, gaussR(r) * 4); } } };

const fSupernova: Gen = (a, N) => {
  const r = mkRnd(151);
  const RAYS = 70; const dirs: number[][] = [];
  for (let k = 0; k < RAYS; k++) { const th = Math.acos(2 * r() - 1), ph = r() * TAU; dirs.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]); }
  for (let i = 0; i < N; i++) {
    const roll = r();
    if (roll < 0.16) {                         // brilliant core
      const rad = Math.pow(r(), 0.7) * 13, th = Math.acos(2 * r() - 1), ph = r() * TAU;
      set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th));
    } else if (roll < 0.86) {                   // debris blasted along rays
      const d = dirs[(r() * RAYS) | 0]!;
      const dist = 13 + Math.pow(r(), 0.65) * 84, spread = dist * 0.05 + 1;
      set(a, i, d[0]! * dist + gaussR(r) * spread, d[1]! * dist + gaussR(r) * spread, d[2]! * dist + gaussR(r) * spread);
    } else {                                    // expanding shockwave shell
      const th = Math.acos(2 * r() - 1), ph = r() * TAU, d = 99 + gaussR(r) * 4;
      set(a, i, d * Math.sin(th) * Math.cos(ph), d * Math.sin(th) * Math.sin(ph), d * Math.cos(th));
    }
  }
};

const fFireball: Gen = (a, N) => { const r = mkRnd(3); for (let i = 0; i < N; i++) { const rad = Math.pow(r(), 1.8) * 18, th = Math.acos(2 * r() - 1), ph = r() * TAU; set(a, i, rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th) * 0.8); } };

/* ---- per-particle colour painters ---- */
function fill(col: Float32Array, c: THREE.Color, N: number) { for (let i = 0; i < N; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } }
const paintPerson: Paint = (_p, col, N) => { const r = mkRnd(301); for (let i = 0; i < N; i++) { col[i * 3] = 1.0; col[i * 3 + 1] = 0.78 + r() * 0.12; col[i * 3 + 2] = 0.58 + r() * 0.14; } };
const paintDNA: Paint = (pos, col, N) => { for (let i = 0; i < N; i++) { const rad = Math.hypot(pos[i * 3]!, pos[i * 3 + 2]!); if (rad < 22) { col[i * 3] = 1.0; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 0.45; } else { col[i * 3] = 0.42; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 0.95; } } };
const paintAtom: Paint = (pos, col, N) => { for (let i = 0; i < N; i++) { const d = Math.hypot(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!); if (d < 14) { col[i * 3] = 1.0; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.5; } else { col[i * 3] = 0.55; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 1.1; } } };
const paintSolar: Paint = (pos, col, N) => { const r = mkRnd(304); for (let i = 0; i < N; i++) { const d = Math.hypot(pos[i * 3]!, pos[i * 3 + 1]!); if (d < 24) { const t = d / 24; col[i * 3] = 1.0; col[i * 3 + 1] = lerp(0.95, 0.5, t); col[i * 3 + 2] = lerp(0.7, 0.15, t); } else { const g = 0.4 + r() * 0.15; col[i * 3] = g * 0.85; col[i * 3 + 1] = g * 0.85; col[i * 3 + 2] = g * 1.15; } } };
const paintStar: Paint = (pos, col, N) => { for (let i = 0; i < N; i++) { const d = Math.hypot(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!), core = clamp(1 - d / 40, 0, 1); col[i * 3] = lerp(0.85, 1.0, core); col[i * 3 + 1] = lerp(0.88, 0.97, core); col[i * 3 + 2] = lerp(1.2, 1.0, core); } };
const paintNova: Paint = (pos, col, N) => { const r = mkRnd(305); for (let i = 0; i < N; i++) { const d = Math.hypot(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!); const t = clamp(d / 96, 0, 1); col[i * 3] = lerp(1.0, 0.9, t); col[i * 3 + 1] = lerp(0.95, 0.4, t); col[i * 3 + 2] = lerp(0.85, 0.18, t) + r() * 0.05; } };

interface Scene { gen?: Gen; genC?: (pos: Float32Array, col: Float32Array, N: number) => void; paint?: Paint; col: THREE.Color; cam: number; bloom: number; spin: [number, number, number]; title: string; line: string; }
const C = (h: number) => new THREE.Color(h);
const SCENES: Scene[] = [
  { gen: fPerson,    paint: paintPerson, col: C(0xffd0a0), cam: 250, bloom: 0.3, spin: [0, 0, 0],     title: "You.", line: "Right now, reading this — a configuration of stardust complex enough to wonder where it came from." },
  { gen: fDNA,       paint: paintDNA,    col: C(0x8ff0e0), cam: 175, bloom: 0.24, spin: [1, 0, 0.3],  title: "Written through every cell.", line: "The same instructions, copied without a break from the very first life on Earth." },
  { gen: fAtom,      paint: paintAtom,   col: C(0x9fc0ff), cam: 150, bloom: 0.26, spin: [1, 0, 0.28], title: "Made of atoms.", line: "Carbon, oxygen, nitrogen, calcium, iron — the same elements that build worlds and stars." },
  { genC: buildEarth,                    col: C(0x6fa8ff), cam: 150, bloom: 0.32, spin: [1, 0, 0.16], title: "Once, the Earth itself.", line: "Your atoms were the rock, the ocean and the air of a young planet, four and a half billion years ago." },
  { gen: fSolar,     paint: paintSolar,  col: C(0xffd9a0), cam: 250, bloom: 0.5, spin: [0, 1, 0.18],  title: "Gathered from a cloud.", line: "The Earth and everything on it condensed from the same spinning disk that lit the Sun." },
  { gen: fSupernova, paint: paintNova,   col: C(0xffae6a), cam: 250, bloom: 0.65, spin: [0, 0, 0],    title: "Forged in a dying star.", line: "Your carbon and oxygen were cooked inside an earlier star — and flung across space when it exploded." },
  { gen: fStar,      paint: paintStar,   col: C(0xfff0cf), cam: 150, bloom: 0.85, spin: [0, 1, 0.05], title: "Lit from the first light.", line: "The hydrogen in every drop of your water is older still — among the very first atoms ever made." },
  { gen: fFireball,  paint: undefined,   col: C(0xfff1d6), cam: 135, bloom: 0.8, spin: [0, 0, 0],     title: "Born from a single point.", line: "All of it — you, the Earth, the stars — began together, 13.8 billion years ago." },
  { gen: fPerson,    paint: paintPerson, col: C(0xbcd0ff), cam: 250, bloom: 0.34, spin: [0, 0, 0],    title: "You are the universe, looking back at itself.", line: "Briefly, improbably, the cosmos arranged itself into something that could marvel at the cosmos. That something is you." },
];

/* ---- GLSL (shared with the Timeline's Genesis) ---- */
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
uniform float uTime, uMix, uBurst, uSize, uDpr;
uniform vec3 uSpinA, uSpinB;
attribute vec3 aTo; attribute vec3 aColA; attribute vec3 aColB; attribute float aSeed;
varying vec3 vCol; varying float vA;
${SNOISE}
vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
vec3 rotZ(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }
void main(){
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 pa = position;
  pa = mix(pa, rotY(pa, uTime*uSpinA.z), uSpinA.x); pa = mix(pa, rotZ(pa, uTime*uSpinA.z), uSpinA.y);
  vec3 pb = aTo;
  pb = mix(pb, rotY(pb, uTime*uSpinB.z), uSpinB.x); pb = mix(pb, rotZ(pb, uTime*uSpinB.z), uSpinB.y);
  vec3 p = mix(pa, pb, m);
  float trans = sin(m * 3.14159265);
  float t = uTime*0.05 + aSeed*6.2831;
  p += vec3(snoise(p*0.045+t), snoise(p*0.045+t+13.3), snoise(p*0.045+t+27.1)) * (trans*12.0);
  float lt = uTime*0.55 + aSeed*40.0;
  p += vec3(snoise(p*0.12+lt), snoise(p*0.12+lt+5.0), snoise(p*0.12+lt+11.0)) * (1.25 + trans*1.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize*uDpr*(260.0/-mv.z), 0.5, 5.5);
  float br = 0.62 + 0.38*fract(aSeed*91.7);
  float tw = 0.72 + 0.28*sin(uTime*2.4 + aSeed*120.0);
  vCol = mix(aColA, aColB, m) * br * tw * (1.0 + uBurst*1.4);
  vA = (0.26 + 0.26*fract(aSeed*53.1))*tw + uBurst*0.35 + trans*0.12;
}`;

const FRAG = /* glsl */`precision mediump float; varying vec3 vCol; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d,d); if (r2 > 0.25) discard;
  gl_FragColor = vec4(vCol, smoothstep(0.25, 0.0, r2) * vA); }`;

export interface StardustHandle { destroy: () => void; setPerson: (p: Person | null) => void; }

export function mountStardust(opts: Opts): StardustHandle {
  const { canvas, track, caption } = opts;
  let person: Person | null = opts.person ?? null;
  const small = matchMedia("(max-width: 760px)").matches;

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (_e) { return { destroy: () => {}, setPerson: () => {} }; }
  renderer.setClearColor(0x050609, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.5, 0.5);
  composer.addPass(bloom);

  const PC = small ? 30000 : 60000;
  const F = SCENES.length;
  const forms: Float32Array[] = [], formCols: Float32Array[] = [];
  for (let k = 0; k < F; k++) {
    const pos = new Float32Array(PC * 3), col = new Float32Array(PC * 3);
    const sc = SCENES[k]!;
    if (sc.genC) sc.genC(pos, col, PC);
    else { sc.gen!(pos, PC); if (sc.paint) sc.paint(pos, col, PC); else fill(col, sc.col, PC); }
    forms.push(pos); formCols.push(col);
  }

  const posArr = new Float32Array(PC * 3); posArr.set(forms[0]!);
  const toArr = new Float32Array(PC * 3); toArr.set(forms[1] ?? forms[0]!);
  const cAArr = new Float32Array(PC * 3); cAArr.set(formCols[0]!);
  const cBArr = new Float32Array(PC * 3); cBArr.set(formCols[1] ?? formCols[0]!);
  const seed = new Float32Array(PC); const sr = mkRnd(5); for (let i = 0; i < PC; i++) seed[i] = sr();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(toArr, 3));
  geo.setAttribute("aColA", new THREE.BufferAttribute(cAArr, 3));
  geo.setAttribute("aColB", new THREE.BufferAttribute(cBArr, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const pAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const toAttr = geo.getAttribute("aTo") as THREE.BufferAttribute;
  const cAAttr = geo.getAttribute("aColA") as THREE.BufferAttribute;
  const cBAttr = geo.getAttribute("aColB") as THREE.BufferAttribute;

  const uniforms = {
    uTime: { value: 0 }, uMix: { value: 0 }, uBurst: { value: 0 },
    uSize: { value: small ? 1.7 : 2.0 }, uDpr: { value: dpr },
    uSpinA: { value: new THREE.Vector3() }, uSpinB: { value: new THREE.Vector3() },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(geo, mat));

  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  let activeInt = -1, burst = 0, segFrom = -1;
  function setForm(i: number) {
    if (i === segFrom) return; segFrom = i;
    posArr.set(forms[i]!); pAttr.needsUpdate = true;
    cAArr.set(formCols[i]!); cAAttr.needsUpdate = true;
    const j = Math.min(i + 1, F - 1);
    toArr.set(forms[j]!); toAttr.needsUpdate = true;
    cBArr.set(formCols[j]!); cBAttr.needsUpdate = true;
    uniforms.uSpinA.value.set(SCENES[i]!.spin[0], SCENES[i]!.spin[1], SCENES[i]!.spin[2]);
    uniforms.uSpinB.value.set(SCENES[j]!.spin[0], SCENES[j]!.spin[1], SCENES[j]!.spin[2]);
  }
  function setActive(i: number) {
    if (i === activeInt) return;
    const prev = activeInt; activeInt = i;
    const s = SCENES[i]!;
    let title = s.title, line = s.line;
    if (person) {
      if (i === 0) title = person.youTitle;
      else if (i === F - 1) { title = person.finaleTitle; line = person.finaleLine; }
    }
    caption.innerHTML = `<p class="sd-num">${String(i + 1).padStart(2, "0")} / ${String(F).padStart(2, "0")}</p><h2 class="sd-title">${title}</h2><p class="sd-line">${line}</p>`;
    caption.classList.remove("in"); void caption.offsetWidth; caption.classList.add("in");
    if (prev >= 0) { burst = 1; try { playClick(); } catch (_e) { /* off */ } }
  }

  let target = 0, cur = 0, running = false, raf = 0, last = performance.now();
  let userYaw = 0, userPitch = 0, dragging = false, lx = 0, ly = 0;
  function readScroll() { const r = track.getBoundingClientRect(); const span = track.offsetHeight - window.innerHeight; target = (span > 0 ? clamp(-r.top / span, 0, 1) : 0) * (F - 1); }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    readScroll();
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    cur += (target - cur) * clamp(0.11 * dt, 0, 1);
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const i = clamp(Math.floor(cur), 0, F - 2);
    setForm(i);
    const local = clamp(cur - i, 0, 1), mm = clamp((local - 0.30) / 0.40, 0, 1);
    uniforms.uMix.value = mm; uniforms.uTime.value = now * 0.001;
    burst *= 0.9; uniforms.uBurst.value = burst;
    const mixT = smooth(mm);
    bloom.strength = lerp(SCENES[i]!.bloom, SCENES[Math.min(i + 1, F - 1)]!.bloom, mixT);
    const camZ = lerp(SCENES[i]!.cam, SCENES[Math.min(i + 1, F - 1)]!.cam, mixT) * (small ? 1.5 : 1);
    if (!dragging) { userYaw *= 0.95; userPitch *= 0.95; }
    const yaw = Math.sin(now * 0.00004) * 0.16 + userYaw, pitch = clamp(userPitch, -1.0, 1.0), cp = Math.cos(pitch);
    camera.position.set(Math.sin(yaw) * camZ * cp, (small ? -8 : 6) + Math.sin(pitch) * camZ, Math.cos(yaw) * camZ * cp);
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

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", e => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.style.cursor = "grabbing"; try { canvas.setPointerCapture(e.pointerId); } catch (_e) { /* ignore */ } });
    canvas.addEventListener("pointermove", e => { if (!dragging) return; userYaw += (e.clientX - lx) * 0.006; userPitch = clamp(userPitch + (e.clientY - ly) * 0.005, -1.0, 1.0); lx = e.clientX; ly = e.clientY; });
    const end = () => { dragging = false; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  }

  setForm(0); setActive(0); composer.render();
  return {
    destroy: () => { stop(); io.disconnect(); removeEventListener("resize", resize); geo.dispose(); mat.dispose(); composer.dispose(); renderer.dispose(); },
    setPerson: (p: Person | null) => { person = p; const i = activeInt; activeInt = -1; setActive(i); },
  };
}
