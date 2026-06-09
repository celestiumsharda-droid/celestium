/* =====================================================================
   CELESTIUM — "THE WHOLE OF TIME"  ·  particle engine
   The whole life of the universe told in one substance: light itself,
   as a swarm of hundreds of thousands of GPU particles. The same points
   that erupt from the first instant go on to become plasma, the first
   nuclei, stars, galaxies — everything is made of them. A single journey
   playhead eases to a stop at each pivotal moment; a running cosmic clock,
   the era titles, ambient sound and drag-to-look sit on top.

   ACT 1 (this build): the birth. A single point of light holds in the
   black, then erupts into an expanding, turbulent, cooling plasma cloud.
   Later acts (nuclei → first light → stars → galaxies → the far future)
   dock onto the same playhead and morph the same particles.
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { playClick } from "./sound";

interface Opts {
  canvas: HTMLCanvasElement;
  age: HTMLElement; era: HTMLElement; temp: HTMLElement; line: HTMLElement; marker: HTMLElement;
  cont: HTMLElement; prog: HTMLElement;
  startOverlay: HTMLElement; begin: HTMLElement;
}

/* ---- the eras of all time (journey position → log10 age in years) ---- */
interface Era { s: number; lt: number; name: string; temp: string; line: string; }
export const ERAS: Era[] = [
  // ---- THE PAST: Big Bang → now ----
  { s: 0.000, lt: -50.5, name: "The Planck epoch",        temp: "10³² K",  line: "Space, time and all four forces are a single thing, at a temperature beyond meaning. Quantum gravity rules; our physics cannot yet describe it." },
  { s: 0.025, lt: -43.5, name: "Grand unification",       temp: "10³⁰ K",  line: "Gravity separates from the rest. The strong, weak and electromagnetic forces are still one single force." },
  { s: 0.050, lt: -39.5, name: "Inflation",               temp: "—",       line: "In a sliver of an instant, space expands more than a trillion-trillion-fold — smoothing the cosmos and stretching quantum jitter into the seeds of every future galaxy. It ends in a flood of hot plasma." },
  { s: 0.075, lt: -19.5, name: "The electroweak epoch",   temp: "10¹⁵ K",  line: "A blazing plasma of quarks and gluons. The electromagnetic and weak forces are still unified as one." },
  { s: 0.100, lt: -19.3, name: "Electroweak breaking",    temp: "10¹⁵ K",  line: "The Higgs field switches on. The last forces split apart, and particles gain their mass." },
  { s: 0.130, lt: -13.5, name: "The quark epoch",         temp: "10¹³ K",  line: "Quarks still roam free. A tiny asymmetry — about one part in a billion — favours matter over antimatter. That surplus is the reason anything exists at all." },
  { s: 0.160, lt: -7.5,  name: "The hadron epoch",        temp: "10¹¹ K",  line: "Quarks confine into protons and neutrons. Matter and antimatter annihilate; the one-in-a-billion surplus is all that survives — and it is everything." },
  { s: 0.190, lt: -7.3,  name: "Neutrino decoupling",     temp: "10¹⁰ K",  line: "Neutrinos stop interacting and stream free forever — a ghostly background still passing through you, unfelt, right now." },
  { s: 0.220, lt: -5.24, name: "Nucleosynthesis",         temp: "10⁹ K",   line: "In a few minutes, protons and neutrons fuse into the first nuclei — hydrogen, a quarter helium, a trace of lithium. Then it is too cold to fuse, and the recipe is set." },
  { s: 0.260, lt: 4.70,  name: "Matter meets radiation",  temp: "9,000 K", line: "The density of matter finally overtakes that of radiation. For the first time, gravity can begin to build structure." },
  { s: 0.300, lt: 5.58,  name: "First light",             temp: "3,000 K", line: "After 380,000 years atoms form, the fog clears, and light flies free for the first time — the cosmic microwave background we still see across the whole sky today." },
  { s: 0.350, lt: 7.70,  name: "The dark ages",           temp: "~100 K",  line: "No stars yet. Cold hydrogen drifts along invisible threads of dark matter, gathering in the dark, lit only by the fading afterglow." },
  { s: 0.400, lt: 8.30,  name: "The cosmic dawn",         temp: "~50 K",   line: "The first stars ignite — colossal, brilliant, metal-free and short-lived. They forge the first heavy elements and die young as the first supernovae." },
  { s: 0.450, lt: 8.70,  name: "Reionization",            temp: "~30 K",   line: "Ultraviolet starlight floods space and re-ionizes the hydrogen between the galaxies; the universe turns transparent once more." },
  { s: 0.500, lt: 9.48,  name: "The age of galaxies",     temp: "~20 K",   line: "Stars gather into galaxies, galaxies into clusters strung along a vast cosmic web. At their hearts, supermassive black holes blaze as quasars." },
  { s: 0.545, lt: 9.54,  name: "Cosmic noon",             temp: "~15 K",   line: "Star formation peaks — the universe forges new stars faster than it ever will again, seeding space with carbon, oxygen and iron." },
  { s: 0.565, lt: 9.93,  name: "A stellar nursery",       temp: "~10 K",   line: "Our Sun begins inside a vast, cold molecular cloud — a stellar nursery like the Pillars of Creation, where gravity gathers enriched gas and dust and lights it from within." },
  { s: 0.585, lt: 9.96,  name: "The Sun is born",         temp: "5 K",     line: "That cloud collapses into a spinning disk; our Sun ignites at its heart and its planets accrete from the ring of dust. Earth forms here — and the atoms in it, and in you, were forged inside dead stars." },
  { s: 0.610, lt: 9.99,  name: "Dark energy awakens",     temp: "4 K",     line: "The expansion of the universe stops slowing and begins to accelerate, driven by something we still barely understand." },
  { s: 0.640, lt: 10.14, name: "Now. You are here.",      temp: "2.7 K",   line: "13.8 billion years in — a brief, bright window when the sky is full of stars, and something made of that stardust is here to look up and notice." },
  // ---- THE FUTURE: now → forever ----
  { s: 0.690, lt: 10.26, name: "Andromeda arrives",       temp: "2.3 K",   line: "The Andromeda galaxy sweeps into our own. Almost no stars actually collide, but the two merge into one, and the sky gains a second river of light." },
  { s: 0.730, lt: 10.28, name: "The Sun dies",            temp: "2.2 K",   line: "Our Sun swells into a red giant, sheds its outer layers as a glowing nebula, and settles into a slowly cooling white dwarf." },
  { s: 0.780, lt: 11.18, name: "The long isolation",      temp: "1 K",     line: "Dark energy carries every other galaxy beyond the horizon. The Local Group merges into a single elliptical, and the sky outside goes utterly dark." },
  { s: 0.820, lt: 12.30, name: "The age of starlight ends", temp: "0.1 K", line: "Gas runs low and star formation falters. Only the long-lived red dwarfs hold on, burning quietly for trillions of years." },
  { s: 0.850, lt: 14.00, name: "The last star dies",      temp: "0.01 K",  line: "The final ember fades. The age of starlight is over forever; only cold, dark remnants remain." },
  { s: 0.890, lt: 25.00, name: "The degenerate era",      temp: "10⁻⁶ K",  line: "A universe of white and black dwarfs, neutron stars and black holes. Galaxies dissolve as remnants drift apart or fall slowly inward." },
  { s: 0.920, lt: 36.00, name: "Proton decay",            temp: "10⁻¹² K", line: "If protons are unstable, even ordinary matter slowly evaporates into radiation — the last solid things quietly coming undone." },
  { s: 0.960, lt: 60.00, name: "The black hole era",      temp: "10⁻¹⁸ K", line: "Black holes are all that remain, bleeding away by Hawking radiation — the smallest first, the largest by 10¹⁰⁰ years — each ending in a final, soundless flash." },
  { s: 1.000, lt: 100.0, name: "Heat death",              temp: "10⁻²⁹ K", line: "Nothing left but a dilute, ever-cooling mist of particles drifting apart. Maximum entropy, eternal dark — not a bang, but the slow, final quiet." },
];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);

function scrollToLogT(s: number): number {
  s = clamp(s, 0, 1);
  for (let i = 0; i < ERAS.length - 1; i++) {
    const a = ERAS[i]!, b = ERAS[i + 1]!;
    if (s <= b.s) { const t = (s - a.s) / (b.s - a.s || 1); return a.lt + (b.lt - a.lt) * t; }
  }
  return ERAS[ERAS.length - 1]!.lt;
}
const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n: number) => String(n).split("").map(c => SUP[c] ?? c).join("");
function formatAge(lt: number): string {
  if (lt < 0) {
    const ls = lt + 7.4977;
    if (ls < 0.4) return `10${sup(Math.round(ls))} seconds`;
    const sec = Math.pow(10, ls);
    return sec < 90 ? `${sec.toFixed(0)} seconds` : `${Math.round(sec / 60).toLocaleString()} minutes`;
  }
  const yrs = Math.pow(10, lt);
  if (lt < 6) return `${Math.round(yrs).toLocaleString()} years`;
  if (lt < 9) return `${(yrs / 1e6).toPrecision(3)} million years`;
  if (lt < 12) return `${(yrs / 1e9).toPrecision(3)} billion years`;
  if (lt < 15) return `${(yrs / 1e12).toPrecision(3)} trillion years`;
  return `10${sup(Math.round(lt))} years`;
}

/* ---- the particle universe ----
   `position` carries each particle's unit direction; aRand/aRand2 give it
   its own life. The form is computed on the GPU from the journey value uT. */
const VERT = /* glsl */`
precision highp float;
attribute float aRand;
attribute float aRand2;
attribute vec3 aNeb; attribute vec3 aNebCol;   // the stellar nursery (Pillars)
attribute vec3 aPro; attribute vec3 aProCol;   // the protoplanetary disk
attribute vec3 aGal; attribute vec3 aGalCol;   // the Milky Way
uniform float uT, uTime, uSize, uPix, uImgOn, uNP, uPG;
varying vec3 vColor;
varying float vAlpha;

float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*vnoise(p); p=p*2.02+vec3(5.1,1.7,9.2); a*=0.5; } return v; }
vec3 tempCol(float k){
  vec3 a = vec3(0.70,0.12,0.05), b = vec3(1.0,0.45,0.12), c = vec3(1.0,0.86,0.52), d = vec3(0.78,0.87,1.18);
  if (k < 0.4) return mix(a,b,k/0.4);
  if (k < 0.75) return mix(b,c,(k-0.4)/0.35);
  return mix(c,d,(k-0.75)/0.25);
}

void main(){
  vec3 dir = position;                                   // unit direction

  // ===== PHASE 1 — the birth: a point that erupts into expanding plasma =====
  float erupt  = smoothstep(0.045, 0.13, uT);
  // inflation is a sudden, violent expansion — the cloud lurches out fast,
  // then continues to grow gently. (a distinct beat, not a smooth ramp)
  float infl   = smoothstep(0.040, 0.080, uT);
  float slow   = smoothstep(0.080, 0.300, uT);
  float expand = clamp(infl*0.5 + slow*0.55, 0.0, 1.0);
  float clump  = 0.7 + 0.6*hash(dir*1.7 + 4.0);
  float radius = mix(0.05, 3.2, expand);   // small soft seed (not a single hot pixel → no square bloom)
  float rr = radius * (0.18 + 0.82*aRand) * clump;
  vec3 pos = dir * rr;
  float n = hash(dir*3.0 + aRand);
  vec3 nd = normalize(vec3(hash(dir+11.0), hash(dir+23.0), hash(dir+37.0)) - 0.5 + 1e-4);
  float wob = 0.6 + 0.4*sin(uTime*0.5 + aRand*28.0);
  pos += nd * (0.62*expand) * (0.35 + 0.65*n) * wob;
  float vHeat = clamp((1.0 - rr/3.2)*0.55 + (1.0 - uT*2.4)*0.6 + n*0.2, 0.0, 1.0);
  float coreDim = mix(0.085, 1.0, smoothstep(0.0, 0.85, rr / 3.2));   // dim the dense core hard so it doesn't saturate to white
  vec3  col   = tempCol(vHeat);
  float alpha = smoothstep(0.0, 0.022, uT) * (0.028 + 0.07*aRand2) * (0.5 + 1.0*erupt) * coreDim;
  float psize = 0.35 + 0.9*aRand;

  // distinct epoch beats inside the fireball, so the early universe isn't one
  // unchanging blob but a sequence you can read at a glance:
  // (a) matter–antimatter annihilation — chaotic white-hot flashes pop & vanish
  float annih = smoothstep(0.085, 0.115, uT) * smoothstep(0.205, 0.165, uT);
  if (annih > 0.001) {
    float spark = step(0.905, hash(dir + floor(uTime*4.0)*1.7));
    alpha += spark * annih * 0.40 * coreDim;             // dim at the dense core so it doesn't flood white
    col = mix(col, vec3(1.0,0.93,0.82), clamp(spark*annih, 0.0, 1.0));
    psize += spark * annih * 2.2;
  }
  // (b) nucleosynthesis — rarer, warmer fusion flares as the first nuclei bind
  float fuse = smoothstep(0.195, 0.215, uT) * smoothstep(0.275, 0.235, uT);
  if (fuse > 0.001) {
    float f = step(0.962, hash(dir + 7.0 + floor(uTime*2.5)*3.1));
    alpha += f * fuse * 0.55 * coreDim;
    col = mix(col, vec3(1.0,0.82,0.45), clamp(f*fuse, 0.0, 1.0));
    psize += f * fuse * 2.6;
  }
  // (c) recombination — a brief brightening as the CMB is released, then it clears
  alpha += smoothstep(0.275, 0.298, uT) * smoothstep(0.325, 0.302, uT) * 0.12;

  // ===== PHASE 2 — the dark ages → the cosmic dawn (cosmic web + first stars) =====
  if (uT > 0.27) {
    // a 3D filamentary volume: warp a filled ball by low-freq noise into lumps/voids
    vec3 base = dir * (1.8 + 1.7*aRand);
    vec3 warp = vec3(fbm(base*0.55 + 1.0), fbm(base*0.55 + 9.0), fbm(base*0.55 + 17.0)) - 0.5;
    vec3 qs = base + warp * 2.7;                           // stable web position
    vec3 q = qs + 0.10*vec3(sin(uTime*0.15 + aRand*9.0), cos(uTime*0.12 + aRand2*5.0), sin(uTime*0.13 + aRand*7.0));

    float toWeb = smoothstep(0.30, 0.36, uT);              // plasma settles into structure
    float dens = fbm(qs*0.5 + 3.0);                        // filament crests are denser/brighter
    // the first stars: a sparse subset ignites at the cosmic dawn (Pop III, hot & blue)
    float isStar = step(0.972, aRand2);
    float dawn   = smoothstep(0.37, 0.40, uT);
    float twk    = 0.55 + 0.45*sin(uTime*2.2 + aRand*50.0);
    vec3  gasCol  = mix(vec3(0.09,0.12,0.25), vec3(0.22,0.27,0.45), dens);
    float gasA    = (0.022 + 0.06*dens) * (0.5 + 0.5*aRand);
    vec3  starCol = vec3(0.78,0.86,1.15);
    float starA   = 0.6 * dawn * twk;
    vec3  webCol  = mix(gasCol, starCol, isStar*dawn);
    float webA    = mix(gasA, max(gasA, starA), isStar);
    float webSz   = mix(psize, 1.9 + 1.3*aRand, isStar*dawn);
    pos   = mix(pos, q, toWeb);
    col   = mix(col, webCol, toWeb);
    alpha = mix(alpha, webA, toWeb);
    psize = mix(psize, webSz, toWeb);

    // ===== PHASE 3 — the age of galaxies: the web condenses into 3D galaxies =====
    if (uT > 0.40) {
      float toGal = smoothstep(0.44, 0.52, uT);
      float CELL = 2.4;
      vec3 cell = floor(qs / CELL);                        // each web cell becomes a galaxy
      float gh = hash(cell + 0.5);
      vec3 gcenter = (cell + vec3(0.5))*CELL + (vec3(hash(cell+1.0), hash(cell+2.0), hash(cell+3.0)) - 0.5)*CELL*0.75;
      vec3 gnormal = normalize(vec3(hash(cell+5.0), hash(cell+7.0), hash(cell+11.0)) - 0.5 + 1e-4);
      vec3 tang = normalize(cross(gnormal, vec3(0.0, 1.0, 0.037)));
      vec3 bito = cross(gnormal, tang);
      float gr = pow(aRand, 0.7) * (CELL*0.40);            // disk radius, concentrated to the core
      float ga = aRand2*6.2831 + gh*12.0 + uTime*0.06/(0.3 + gr);   // differential rotation
      float thick = (hash(dir + gh) - 0.5) * (0.05 + 0.10*gr);      // a thin 3D disk
      vec3 galPos = gcenter + (cos(ga)*tang + sin(ga)*bito)*gr + gnormal*thick;
      float core = 1.0 - smoothstep(0.0, 0.22, gr);
      vec3  galCol = mix(vec3(1.0,0.86,0.55), vec3(0.60,0.72,1.08), smoothstep(0.1, 0.85, aRand));  // warm core → blue arms
      float galA   = 0.07 + 0.13*aRand2 + core*0.22;
      float galSz  = 0.5 + 0.8*aRand + core*1.3;
      pos   = mix(pos, galPos, toGal);
      col   = mix(col, galCol, toGal);
      alpha = mix(alpha, galA, toGal);
      psize = mix(psize, galSz, toGal);
    }
  }

  // ===== PHASE 4 — image-sampled 3D forms: nursery → protoplanetary disk → galaxy =====
  // uImgOn brings the photographic form in (over the procedural galaxies);
  // uNP cross-fades nebula→disk (the Sun forming); uPG cross-fades disk→galaxy.
  vec3 imgPos = mix(aNeb, aPro, uNP);
  imgPos = mix(imgPos, aGal, uPG);
  vec3 imgCol = mix(aNebCol, aProCol, uNP);
  imgCol = mix(imgCol, aGalCol, uPG);
  float tlum  = dot(imgCol, vec3(0.299, 0.587, 0.114));     // density/brightness follow the photo
  float galA  = 0.018 + 0.085*tlum + 0.03*aRand2;           // kept low so dense cores don't blow to white
  float galSz = 0.5 + 0.7*aRand + tlum*0.7;
  pos   = mix(pos, imgPos, uImgOn);
  col   = mix(col, imgCol, uImgOn);
  alpha = mix(alpha, galA, uImgOn);
  psize = mix(psize, galSz, uImgOn);

  vColor = col;
  vAlpha = alpha;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPix * psize / max(-mv.z, 0.12);
}`;

const FRAG = /* glsl */`
precision highp float;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d2 = dot(q,q);
  if (d2 > 0.25) discard;
  float soft = smoothstep(0.25, 0.0, d2);                // round, soft-edged
  gl_FragColor = vec4(vColor, soft * vAlpha);
}`;

export function mountEternity(opts: Opts): () => void {
  const { canvas, age, era, temp, line, marker, cont, prog, startOverlay, begin } = opts;
  const small = matchMedia("(max-width: 760px)").matches;

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (_e) { return () => {}; }
  const pix = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(pix);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.80;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 100);

  // ---- build the particle swarm ----
  const COUNT = small ? 90000 : 240000;
  const dirs = new Float32Array(COUNT * 3);
  const rand = new Float32Array(COUNT);
  const rand2 = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // uniform point on a sphere
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    dirs[i * 3] = r * Math.cos(th); dirs[i * 3 + 1] = u; dirs[i * 3 + 2] = r * Math.sin(th);
    rand[i] = Math.random(); rand2[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(dirs, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  geo.setAttribute("aRand2", new THREE.BufferAttribute(rand2, 1));
  // image-morph targets — three real photos, sampled into 3D particle forms.
  // The journey cross-fades nebula → protoplanetary disk → galaxy.
  const mkBuf = () => new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
  const aNeb = mkBuf(), aNebCol = mkBuf();   // the stellar nursery (Pillars)
  const aPro = mkBuf(), aProCol = mkBuf();   // the protoplanetary disk
  const aGal = mkBuf(), aGalCol = mkBuf();   // the Milky Way
  geo.setAttribute("aNeb", aNeb); geo.setAttribute("aNebCol", aNebCol);
  geo.setAttribute("aPro", aPro); geo.setAttribute("aProCol", aProCol);
  geo.setAttribute("aGal", aGal); geo.setAttribute("aGalCol", aGalCol);
  const uniforms = {
    uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: small ? 11 : 16 }, uPix: { value: pix },
    uImgOn: { value: 0 }, uNP: { value: 0 }, uPG: { value: 0 },
  };

  // ---- sample a real photo into a TRUE 3D particle form ----
  // Each particle takes its position + real colour from a bright pixel (density
  // follows brightness; black void skipped), then gets real depth: a "disk" gets
  // a rounded 3D bulge + thin disk; a "cloud" gets volumetric depth. The whole
  // form is tilted so the orbit camera sees it in 3D — the photo's true
  // structure and colour, genuinely 3D you can fly around.
  function sampleImage3D(url: string, posA: THREE.BufferAttribute, colA: THREE.BufferAttribute, scale: number, tilt: number, disk: boolean) {
    const img = new Image();
    img.onload = () => {
      const cw = 560, ch = Math.max(1, Math.round(cw * img.height / img.width));
      const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
      const ctx = cv.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
      ctx.drawImage(img, 0, 0, cw, ch);
      const d = ctx.getImageData(0, 0, cw, ch).data;
      const aspect = cw / ch;
      const cand: number[] = [];   // packed sx, sy, r, g, b, lum
      for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
        const o = (py * cw + px) * 4, r = d[o]! / 255, g = d[o + 1]! / 255, b = d[o + 2]! / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 0.045) continue;
        cand.push(((px / cw) * 2 - 1) * aspect, -((py / ch) * 2 - 1), r, g, b, lum);
      }
      const m = cand.length / 6; if (m < 1) return;
      const ca = Math.cos(tilt), sa = Math.sin(tilt);
      const tp = posA.array as Float32Array, tc = colA.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        let k = 0;
        for (let t = 0; t < 8; t++) { k = (Math.random() * m) | 0; if (Math.random() < cand[k * 6 + 5]!) break; }
        const o = k * 6, sx = cand[o]!, sy = cand[o + 1]!;
        const x = sx * scale, y = sy * scale;
        let z: number;
        if (disk) { const rC = Math.hypot(sx, sy); z = (Math.random() - 0.5) * 2 * (0.09 + 1.05 * Math.exp(-rC * 2.6)); }
        else { z = (Math.random() - 0.5) * 1.3; }            // a volumetric cloud (nebula)
        tp[i * 3] = x + (Math.random() - 0.5) * 0.02;
        tp[i * 3 + 1] = (y * ca - z * sa);                   // tilt for a 3D view
        tp[i * 3 + 2] = (y * sa + z * ca);
        tc[i * 3] = cand[o + 2]!; tc[i * 3 + 1] = cand[o + 3]!; tc[i * 3 + 2] = cand[o + 4]!;
      }
      posA.needsUpdate = true; colA.needsUpdate = true;
    };
    img.src = url;
  }
  sampleImage3D("/eternity/refs/nebula.png",    aNeb, aNebCol, 4.2, 0.18, false);  // the nursery
  sampleImage3D("/eternity/refs/protodisk.png", aPro, aProCol, 3.0, 0.55, true);   // the Sun's disk
  sampleImage3D("/eternity/refs/milkyway.png",  aGal, aGalCol, 3.3, 0.50, true);   // the Milky Way
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.26, 0.46, 0.80);
  composer.addPass(bloom);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ---- camera: orbit the origin, pulling back as the cloud inflates;
  //      swing to face-on while morphed into an image so the photo reads ----
  let userYaw = 0, userPitch = 0, dragging = false, lx = 0, ly = 0, moved = false;
  function placeCamera(uT: number, now: number) {
    if (!dragging) { userYaw *= 0.95; userPitch *= 0.95; }
    // pull back IN SYNC with the cloud's inflation (same curve as the shader),
    // so the rapidly-inflating fireball stays framed instead of flooding white.
    const infl = smooth(clamp((uT - 0.040) / 0.040, 0, 1));
    const slow = smooth(clamp((uT - 0.080) / 0.220, 0, 1));
    const cexp = Math.min(infl * 0.5 + slow * 0.55, 1);
    const dist = lerp(1.5, 9.2, cexp);
    const yaw = Math.sin(now * 0.00005) * 0.12 + userYaw, pitch = clamp(0.12 + userPitch, -1.3, 1.3);   // gentle bounded sway, not endless drift
    const cp = Math.cos(pitch);
    // the galaxy is built tilted in 3D, so the ordinary orbit camera reveals
    // its depth — no face-on lock (that's what flattened it before).
    camera.position.set(Math.sin(yaw) * dist * cp, Math.sin(pitch) * dist, Math.cos(yaw) * dist * cp);
    camera.lookAt(0, 0, 0);
  }

  // ---- running HUD ----
  let eraIdx = -1, lastAge = "";
  function updateHud(lt: number, p: number) {
    const a = formatAge(lt);
    if (a !== lastAge) { age.textContent = a; lastAge = a; }
    let idx = 0; for (let i = 0; i < ERAS.length; i++) if (p >= ERAS[i]!.s - 1e-4) idx = i;
    if (idx !== eraIdx) {
      eraIdx = idx; const e = ERAS[idx]!;
      era.textContent = e.name; temp.textContent = e.temp; line.textContent = e.line;
      era.classList.remove("in"); void era.offsetWidth; era.classList.add("in");
      try { playClick(); } catch (_e) { /* off */ }
    }
    marker.style.top = `${(p * 100).toFixed(2)}%`;
  }

  // ---- the journey plays itself ----
  // The early universe (Big Bang → first light) is ONE continuous cinematic —
  // it flows through every sub-second epoch without stopping. From "first light"
  // (era index 10) onward it pauses at each pivotal moment. PIVOTS are the stops.
  const FIRST_STOP = 10;
  const PIVOTS = [0, ...ERAS.slice(FIRST_STOP).map(e => e.s)];
  let playhead = 0, pivotIdx = 0, playing = false, running = false, raf = 0, last = performance.now();
  let armed = false, bootHold = 0;

  function showCont(end: boolean) { cont.innerHTML = end ? "Begin again&nbsp;&nbsp;↺" : "Continue&nbsp;&nbsp;→"; cont.classList.add("show"); }
  function hideCont() { cont.classList.remove("show"); }
  function goForward() {
    if (!armed || playing) return;
    if (pivotIdx >= PIVOTS.length - 1) { playhead = 0; pivotIdx = 0; }
    playing = true; hideCont();
  }
  function goBack() {
    if (!armed || playing || pivotIdx <= 0) return;
    pivotIdx -= 1; playhead = PIVOTS[pivotIdx]!; showCont(false);
  }
  function begin_() {
    if (armed) return;
    armed = true; bootHold = 1.6; playing = true;
    startOverlay.classList.add("gone");
    try { playClick(); } catch (_e) { /* off */ }
  }
  function advance(dtSec: number) {
    if (!playing) return;
    if (bootHold > 0) { bootHold -= dtSec; return; }
    const next = PIVOTS[Math.min(pivotIdx + 1, PIVOTS.length - 1)]!;
    const dist = next - playhead;
    if (dist <= 0.004) { playhead = next; playing = false; pivotIdx = Math.min(pivotIdx + 1, PIVOTS.length - 1); showCont(pivotIdx >= PIVOTS.length - 1); }
    else {
      // a steady cinematic cruise that eases as it nears a stop — slow enough
      // that the long opening flow (Big Bang → first light) plays like a film.
      let speed = clamp(0.30 * dist, 0.012, 0.024);
      if (playhead < 0.09) speed *= 0.30 + 0.70 * (playhead / 0.09);   // crawl through the ignition
      playhead = Math.min(next, playhead + speed * dtSec);
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dtSec = Math.min((now - last) / 1000, 0.05); last = now;
    advance(dtSec);
    const ph = playhead;
    // photographic forms enter after the cosmic web, then cross-fade, each with
    // its own pause: nursery (0.565) → protoplanetary disk (0.585) → galaxy (0.61+)
    uniforms.uImgOn.value = smooth(clamp((ph - 0.548) / 0.014, 0, 1));   // procedural → nebula
    uniforms.uNP.value    = smooth(clamp((ph - 0.570) / 0.012, 0, 1));   // nebula → protoplanetary disk
    uniforms.uPG.value    = smooth(clamp((ph - 0.590) / 0.018, 0, 1));   // disk → galaxy
    uniforms.uT.value = ph; uniforms.uTime.value = now * 0.001;
    placeCamera(ph, now);
    updateHud(scrollToLogT(playhead), playhead);
    prog.style.transform = `scaleX(${playhead.toFixed(4)})`;
    composer.render();
  }
  function start_() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  addEventListener("resize", resize, { passive: true });
  const vis = () => { document.hidden ? stop() : start_(); };
  document.addEventListener("visibilitychange", vis);

  // interaction: drag to look, tap/click/space/wheel to continue
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", e => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; canvas.style.cursor = "grabbing"; try { canvas.setPointerCapture(e.pointerId); } catch (_e) { /* ignore */ } });
  canvas.addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; userYaw += dx * 0.005; userPitch = clamp(userPitch + dy * 0.004, -1.3, 1.3); lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener("pointerup", () => { dragging = false; canvas.style.cursor = "grab"; if (!moved) goForward(); });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  cont.addEventListener("click", e => { e.stopPropagation(); goForward(); });
  begin.addEventListener("click", e => { e.stopPropagation(); begin_(); });
  addEventListener("keydown", e => {
    const t = e.target as HTMLElement | null;
    if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); armed ? goForward() : begin_(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goBack(); }
  });
  let wheelLock = 0;
  addEventListener("wheel", e => { const n = performance.now(); if (n - wheelLock < 650) return; wheelLock = n; if (e.deltaY > 0) goForward(); else if (e.deltaY < 0) goBack(); }, { passive: true });

  placeCamera(0, 0); updateHud(scrollToLogT(0), 0); composer.render();
  start_();
  return () => { stop(); document.removeEventListener("visibilitychange", vis); removeEventListener("resize", resize); geo.dispose(); mat.dispose(); composer.dispose(); renderer.dispose(); };
}
