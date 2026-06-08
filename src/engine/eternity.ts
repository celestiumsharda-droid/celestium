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
  { s: 0.580, lt: 9.96,  name: "The Sun is born",         temp: "5 K",     line: "An enriched cloud collapses; our Sun ignites and its planets accrete. Earth forms from the same dust — and the atoms in it, and in you, were forged inside dead stars." },
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
attribute vec3 aTarget;        // image-sampled position (an act this particle morphs into)
attribute vec3 aTargetCol;     // the colour sampled from that image
uniform float uT, uTime, uSize, uPix, uMorph;
varying vec3 vColor;
varying float vAlpha;

float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec3 tempCol(float k){
  vec3 a = vec3(0.70,0.12,0.05), b = vec3(1.0,0.45,0.12), c = vec3(1.0,0.86,0.52), d = vec3(0.72,0.84,1.5);
  if (k < 0.4) return mix(a,b,k/0.4);
  if (k < 0.75) return mix(b,c,(k-0.4)/0.35);
  return mix(c,d,(k-0.75)/0.25);
}

void main(){
  vec3 dir = position;                                   // unit direction
  // ---- the procedural birth: a point that erupts into expanding plasma ----
  float erupt  = smoothstep(0.045, 0.13, uT);
  float expand = smoothstep(0.04, 0.30, uT);
  float clump  = 0.7 + 0.6*hash(dir*1.7 + 4.0);
  float radius = mix(0.015, 3.2, expand);
  float rr = radius * (0.18 + 0.82*aRand) * clump;
  vec3 pos = dir * rr;
  float n = hash(dir*3.0 + aRand);
  vec3 nd = normalize(vec3(hash(dir+11.0), hash(dir+23.0), hash(dir+37.0)) - 0.5 + 1e-4);
  float wob = 0.6 + 0.4*sin(uTime*0.5 + aRand*28.0);
  pos += nd * (0.62*expand) * (0.35 + 0.65*n) * wob;
  float vHeat = clamp((1.0 - rr/3.2)*0.55 + (1.0 - uT*2.4)*0.6 + n*0.2, 0.0, 1.0);
  float coreDim = mix(0.28, 1.0, smoothstep(0.0, 0.6, rr / 3.2));
  vec3  pCol   = tempCol(vHeat);
  float pAlpha = smoothstep(0.0, 0.022, uT) * (0.05 + 0.13*aRand2) * (0.5 + 1.1*erupt) * coreDim;

  // ---- morph toward an image-sampled form (e.g. a real galaxy) ----
  vec3 tgt = aTarget;
  tgt.z += 0.05 * sin(uTime*0.4 + aRand*20.0);           // a living shimmer in depth
  float tAlpha = 0.16 + 0.22*aRand2;
  float m = uMorph;
  vec3 pos2 = mix(pos, tgt, m);
  vColor = mix(pCol, aTargetCol, m);
  vAlpha = mix(pAlpha, tAlpha, m);

  vec4 mv = modelViewMatrix * vec4(pos2, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPix * (0.35 + 0.9*aRand) / max(-mv.z, 0.12);
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
  renderer.toneMappingExposure = 0.85;

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
  // image-morph targets (filled asynchronously by sampling a real photo)
  const aTarget = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
  const aTargetCol = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
  geo.setAttribute("aTarget", aTarget);
  geo.setAttribute("aTargetCol", aTargetCol);
  const uniforms = {
    uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: small ? 11 : 16 }, uPix: { value: pix }, uMorph: { value: 0 },
  };

  // ---- sample a real image into particle positions + colours ----
  // density follows the image's brightness; black voids are skipped, so the
  // photo becomes points of light on nothing. Maps the frame onto an XY plane.
  function sampleImage(url: string, scale: number) {
    const img = new Image();
    img.onload = () => {
      const cw = 540, ch = Math.max(1, Math.round(cw * img.height / img.width));
      const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
      const ctx = cv.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
      ctx.drawImage(img, 0, 0, cw, ch);
      const d = ctx.getImageData(0, 0, cw, ch).data;
      const aspect = cw / ch;
      const cand: number[] = [];   // packed sx, sy, r, g, b, lum
      for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
        const o = (py * cw + px) * 4, r = d[o]! / 255, g = d[o + 1]! / 255, b = d[o + 2]! / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 0.05) continue;
        cand.push(((px / cw) * 2 - 1) * aspect, -((py / ch) * 2 - 1), r, g, b, lum);
      }
      const m = cand.length / 6; if (m < 1) return;
      const tp = aTarget.array as Float32Array, tc = aTargetCol.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        let k = 0;
        for (let t = 0; t < 8; t++) { k = (Math.random() * m) | 0; if (Math.random() < cand[k * 6 + 5]!) break; }
        const o = k * 6;
        tp[i * 3] = cand[o]! * scale + (Math.random() - 0.5) * 0.02;
        tp[i * 3 + 1] = cand[o + 1]! * scale + (Math.random() - 0.5) * 0.02;
        tp[i * 3 + 2] = (Math.random() - 0.5) * 0.22;
        tc[i * 3] = cand[o + 2]!; tc[i * 3 + 1] = cand[o + 3]!; tc[i * 3 + 2] = cand[o + 4]!;
      }
      aTarget.needsUpdate = true; aTargetCol.needsUpdate = true;
    };
    img.src = url;
  }
  void sampleImage;   // image→particle sampler kept for reference targets; 3D forms are built procedurally now
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.62);
  composer.addPass(bloom);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ---- camera: orbit the origin, pulling back as the cloud inflates;
  //      swing to face-on while morphed into an image so the photo reads ----
  let userYaw = 0, userPitch = 0, dragging = false, lx = 0, ly = 0, moved = false, morph = 0;
  const orbitPos = new THREE.Vector3(), faceOn = new THREE.Vector3();
  function placeCamera(uT: number, now: number) {
    if (!dragging) { userYaw *= 0.95; userPitch *= 0.95; }
    const expand = smooth(clamp((uT - 0.02) / 0.28, 0, 1));
    const dist = lerp(1.15, 9.0, expand);
    const yaw = now * 0.00004 + userYaw, pitch = clamp(0.12 + userPitch, -1.3, 1.3);
    const cp = Math.cos(pitch);
    orbitPos.set(Math.sin(yaw) * dist * cp, Math.sin(pitch) * dist, Math.cos(yaw) * dist * cp);
    if (morph > 0.001) {
      faceOn.set(Math.sin(now * 0.00003) * 0.5 + userYaw, Math.sin(now * 0.000025) * 0.35 + userPitch, 7.8);
      camera.position.lerpVectors(orbitPos, faceOn, morph);
    } else camera.position.copy(orbitPos);
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

  // ---- the journey plays itself, pausing at every pivotal moment ----
  const PIVOTS = ERAS.map(e => e.s);
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
      let speed = clamp(0.5 * dist, 0.04, 0.16);
      if (playhead < 0.09) speed *= 0.30 + 0.70 * (playhead / 0.09);   // crawl through the ignition
      playhead = Math.min(next, playhead + speed * dtSec);
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dtSec = Math.min((now - last) / 1000, 0.05); last = now;
    advance(dtSec);
    uniforms.uT.value = playhead; uniforms.uTime.value = now * 0.001; uniforms.uMorph.value = morph;   // morph stays 0 until 3D image-acts are built
    placeCamera(playhead, now);
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
