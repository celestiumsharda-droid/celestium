/* =====================================================================
   CELESTIUM — "TWO CLOCKS, ONE STORY" · GENESIS
   The universe assembles itself as you scroll. ~70k GPU particles begin
   as a hot, near-uniform plasma and — driven by a single scroll uniform —
   morph along a deterministic path into the cosmic web: filaments, knots,
   clusters, glowing galaxy cores. The whole field expands (Hubble flow)
   and cools; the camera descends into the structure. Curl-ish simplex
   noise gives the early plasma its turbulent chaos, fading as structure
   sets in.

   Deterministic (position is a pure function of the scroll uniform), so it
   scrubs perfectly in both directions — no integrator state. One draw call,
   all work on the GPU. rAF only while the section is on screen. The HUD
   (event card + two-clocks gap bar) and the reduced-motion list fallback
   are shared with the caller; this module only owns the WebGL canvas.
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { TimelineEntry } from "./types";
import { playClick } from "./sound";

interface Opts {
  canvas: HTMLCanvasElement;
  track: HTMLElement;
  card: HTMLElement;
  gap: HTMLElement;
  data: readonly TimelineEntry[];
}

const NOW_YEAR = 2026;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function mix(c1: number[], c2: number[], t: number): string {
  return `rgb(${Math.round(lerp(c1[0]!, c2[0]!, t))},${Math.round(lerp(c1[1]!, c2[1]!, t))},${Math.round(lerp(c1[2]!, c2[2]!, t))})`;
}
const WARM = [255, 244, 214], MID = [201, 178, 255], COOL = [169, 188, 255];
const eventColor = (t: number) => (t < 0.5 ? mix(WARM, MID, t * 2) : mix(MID, COOL, (t - 0.5) * 2));

const LOG_MAX = Math.log10(13.8e9);
const axisX = (ya: number) => (ya <= 1 ? 1 : clamp(1 - Math.log10(ya) / LOG_MAX, 0, 1));
function agoLabel(ya: number): string {
  if (ya <= 0) return "right now";
  if (ya >= 1e9) return `${(ya / 1e9).toFixed(1)} billion yrs ago`;
  if (ya >= 1e6) return `${Math.round(ya / 1e6)} million yrs ago`;
  if (ya >= 1e3) return `${Math.round(ya / 1e3)},000 yrs ago`;
  return `${Math.round(ya)} yrs ago`;
}

/* ---- GLSL ---- */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = /* glsl */`
uniform float uProg, uTime, uSize, uDpr, uBurst;
attribute vec3 aHome; attribute vec3 aGalaxy; attribute float aSeed; attribute float aWarm;
varying vec3 vCol; varying float vA;
${SNOISE}
void main(){
  float formWeb = smoothstep(0.05, 0.40, uProg);   // plasma -> cosmic web
  float toGal   = smoothstep(0.60, 0.86, uProg);   // web -> spiral galaxy
  // web-era position, with the bang and Hubble expansion baked in
  vec3 webP = mix(position, aHome, formWeb);
  webP *= mix(0.45, 1.15, smoothstep(0.0, 0.5, uProg));
  webP *= mix(0.06, 1.0, smoothstep(0.0, 0.05, uProg));
  // then descend: morph the whole field into a galaxy
  vec3 p = mix(webP, aGalaxy, toGal);
  // turbulence: violent plasma early, near-zero in the crisp galaxy
  float turbAmp = ((1.0 - formWeb) * 4.2 + 0.18) * (1.0 - toGal * 0.9);
  float t = uTime * 0.06 + aSeed * 6.2831;
  vec3 turb = vec3(snoise(p*0.06 + t), snoise(p*0.06 + t + 19.1), snoise(p*0.06 + t + 41.7));
  p += turb * turbAmp;
  // gentle differential rotation once the galaxy is forming
  float spin = toGal * (uTime * 0.05) * (1.0 / (length(p.xz) * 0.02 + 1.0));
  float cs = cos(spin), sn = sin(spin);
  p.xz = mat2(cs, -sn, sn, cs) * p.xz;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float sz = uSize * (0.5 + aWarm * 1.6) * (1.0 + uBurst);
  gl_PointSize = clamp(sz * uDpr * (60.0 / -mv.z), 0.4, 7.0);
  float form = max(formWeb, toGal);
  vec3 hot = vec3(0.85, 0.93, 1.25);          // hot blue-white plasma
  vec3 cool = vec3(0.42, 0.55, 1.0);          // cool intergalactic blue
  vec3 warm = vec3(1.0, 0.83, 0.5);           // warm galaxy core
  vec3 own = mix(cool, warm, aWarm);
  vCol = mix(hot, own, form) * (1.0 + uBurst * 1.6);
  vA = (0.16 + aWarm * 0.52) * (0.4 + 0.6 * form) + uBurst * 0.4;
  // the bang: the young universe blazes hot, then cools as it expands
  float bang = 1.0 - smoothstep(0.0, 0.13, uProg);
  vCol += vec3(1.0, 0.96, 0.82) * bang * 1.1;
  vA += bang * 0.3;
}`;

const FRAG = /* glsl */`
precision mediump float;
varying vec3 vCol; varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  float a = smoothstep(0.25, 0.0, r2);
  gl_FragColor = vec4(vCol, a * vA);
}`;

export function mountTimeline(opts: Opts): () => void {
  const { canvas, track, card, gap, data } = opts;
  const N = data.length;
  const small = matchMedia("(max-width: 760px)").matches;
  const colors = data.map((_, i) => eventColor(N > 1 ? i / (N - 1) : 0));

  // ---- WebGL ----
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch (_e) {
    return () => {}; // caller keeps the list fallback
  }
  renderer.setClearColor(0x050609, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 4000);

  // bloom — what turns "points" into "whoa": dense knots and filaments glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), small ? 0.28 : 0.34, 0.45, 0.62);
  composer.addPass(bloom);

  // ---- build the cosmic-web target ----
  const COUNT = small ? 38000 : 46000;
  const R = 180;
  const NODES = 16;
  const nodes: THREE.Vector3[] = [];
  let sd = 1337;
  const rnd = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; };
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 0.9;
  for (let i = 0; i < NODES; i++) {
    const u = rnd(), v = rnd(), w = Math.cbrt(rnd());
    const th = Math.acos(2 * v - 1), ph = u * Math.PI * 2, rr = w * R;
    nodes.push(new THREE.Vector3(rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph) * 0.8, rr * Math.cos(th)));
  }
  // filament edges: each node to its 3 nearest — a more connected web
  const edges: [number, number][] = [];
  for (let i = 0; i < NODES; i++) {
    const order = nodes.map((n, j) => ({ j, d: nodes[i]!.distanceTo(n) })).filter(o => o.j !== i).sort((a, b) => a.d - b.d);
    edges.push([i, order[0]!.j]); edges.push([i, order[1]!.j]); edges.push([i, order[2]!.j]);
  }

  const start = new Float32Array(COUNT * 3);
  const home = new Float32Array(COUNT * 3);
  const galaxy = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const warm = new Float32Array(COUNT);
  const tmp = new THREE.Vector3();
  const GR = 100;  // galaxy radius
  for (let i = 0; i < COUNT; i++) {
    // start — a near-uniform warm blob (the young, dense universe)
    const sr = Math.cbrt(rnd()) * R * 0.5;
    const su = rnd(), sv = rnd(), sth = Math.acos(2 * sv - 1), sph = su * Math.PI * 2;
    start[i * 3] = sr * Math.sin(sth) * Math.cos(sph);
    start[i * 3 + 1] = sr * Math.sin(sth) * Math.sin(sph);
    start[i * 3 + 2] = sr * Math.cos(sth);
    // home — on the cosmic web
    const roll = rnd();
    let wv = 0.18;
    if (roll < 0.58) {                      // filament — a thin glowing thread
      const e = edges[(rnd() * edges.length) | 0]!;
      tmp.copy(nodes[e[0]]!).lerp(nodes[e[1]]!, rnd());
      tmp.x += gauss() * 3.2; tmp.y += gauss() * 3.2; tmp.z += gauss() * 3.2;
      wv = 0.16 + rnd() * 0.22;
    } else if (roll < 0.9) {                // cluster around a node
      const n = nodes[(rnd() * NODES) | 0]!;
      const cr = Math.pow(rnd(), 2.6) * 22;
      const cu = rnd(), cv = rnd(), cth = Math.acos(2 * cv - 1), cph = cu * Math.PI * 2;
      tmp.set(n.x + cr * Math.sin(cth) * Math.cos(cph), n.y + cr * Math.sin(cth) * Math.sin(cph), n.z + cr * Math.cos(cth));
      wv = 0.5 + (1 - cr / 22) * 0.6;       // blazing toward the core
    } else {                                // sparse void
      const vr = Math.cbrt(rnd()) * R * 1.15;
      const vu = rnd(), vv = rnd(), vth = Math.acos(2 * vv - 1), vph = vu * Math.PI * 2;
      tmp.set(vr * Math.sin(vth) * Math.cos(vph), vr * Math.sin(vth) * Math.sin(vph) * 0.8, vr * Math.cos(vth));
      wv = 0.04 + rnd() * 0.05;
    }
    home[i * 3] = tmp.x; home[i * 3 + 1] = tmp.y; home[i * 3 + 2] = tmp.z;
    seed[i] = rnd(); warm[i] = wv;

    // galaxy target — a spiral disk in the XZ plane (the descent's endpoint)
    let gx: number, gy: number, gz: number;
    if (rnd() < 0.3) {                        // central bulge
      const br = Math.pow(rnd(), 2.2) * GR * 0.28;
      const bu = rnd(), bv = rnd(), bth = Math.acos(2 * bv - 1), bph = bu * Math.PI * 2;
      gx = br * Math.sin(bth) * Math.cos(bph);
      gy = br * Math.cos(bth) * 0.55;
      gz = br * Math.sin(bth) * Math.sin(bph);
    } else {                                  // disk + two logarithmic spiral arms
      const gr = Math.pow(rnd(), 0.62) * GR;
      const arm = rnd() < 0.5 ? 0 : Math.PI;
      const spin = arm + 5.4 * Math.log(gr / 10 + 1);
      const th2 = spin + gauss() * (0.22 + 0.55 * (gr / GR));
      gx = gr * Math.cos(th2);
      gz = gr * Math.sin(th2);
      gy = gauss() * (2.5 + (1 - gr / GR) * 6);   // thin disk, puffier core
    }
    galaxy[i * 3] = gx; galaxy[i * 3 + 1] = gy; galaxy[i * 3 + 2] = gz;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  geo.setAttribute("aHome", new THREE.BufferAttribute(home, 3));
  geo.setAttribute("aGalaxy", new THREE.BufferAttribute(galaxy, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.setAttribute("aWarm", new THREE.BufferAttribute(warm, 1));

  const uniforms = {
    uProg: { value: 0 }, uTime: { value: 0 }, uBurst: { value: 0 },
    uSize: { value: small ? 1.2 : 1.5 }, uDpr: { value: dpr },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ---- HUD (shared logic with the list build) ----
  let activeInt = -1, burst = 0;
  function setActive(i: number) {
    if (i === activeInt) return;
    const prev = activeInt; activeInt = i;
    const e = data[i]!, col = colors[i]!;
    const link = e.id ? `<a class="tl-read" href="/discoveries/${e.id}/">Read the full discovery →</a>` : "";
    card.innerHTML =
      `<div class="tl-when" style="color:${col}">${e.w}</div>` +
      `<h3 class="tl-title">${e.t}</h3>` +
      `<p class="tl-body">${e.b}</p>` +
      `<p class="tl-how"><span>How we know</span> ${e.d}</p>${link}`;
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    const xh = axisX(e.ya), xk = axisX(NOW_YEAR - e.knew);
    gap.querySelector<HTMLElement>(".gap-happened")!.style.left = `${(xh * 100).toFixed(2)}%`;
    gap.querySelector<HTMLElement>(".gap-knew")!.style.left = `${(xk * 100).toFixed(2)}%`;
    const fill = gap.querySelector<HTMLElement>(".gap-fill")!;
    const lo = Math.min(xh, xk), hi = Math.max(xh, xk);
    fill.style.left = `${(lo * 100).toFixed(2)}%`;
    fill.style.width = `${((hi - lo) * 100).toFixed(2)}%`;
    fill.style.background = `linear-gradient(90deg, ${col}, var(--accent))`;
    gap.querySelector<HTMLElement>(".gap-hl")!.textContent = agoLabel(e.ya);
    gap.querySelector<HTMLElement>(".gap-kl")!.textContent = e.knew >= NOW_YEAR ? "ongoing, now" : `${e.knew}`;
    gap.querySelector<HTMLElement>(".gap-happened")!.style.background = col;
    if (prev >= 0) { burst = 1; try { playClick(); } catch (_e) { /* audio off */ } }
  }

  // ---- scroll + loop ----
  let target = 0, cur = 0, running = false, raf = 0, last = performance.now();
  function readScroll() {
    const r = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    target = (span > 0 ? clamp(-r.top / span, 0, 1) : 0) * (N - 1);
  }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    readScroll();
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    cur += (target - cur) * clamp(0.1 * dt, 0, 1);
    if (Math.abs(target - cur) < 0.0005) cur = target;
    const sp = N > 1 ? cur / (N - 1) : 0;
    uniforms.uProg.value = sp;
    uniforms.uTime.value = now * 0.001;
    burst *= 0.9; uniforms.uBurst.value = burst;
    // camera: descend into the structure, slow drift
    const ang = sp * 1.3 + now * 0.00003;
    const webW = smoothstep01(clamp(sp / 0.5, 0, 1));
    const galG = smoothstep01(clamp((sp - 0.5) / 0.5, 0, 1));
    let dist = sp < 0.5 ? lerp(440, 215, webW) : lerp(215, 132, galG);
    const camY = sp < 0.5 ? Math.cos(sp * 1.2) * 42 : lerp(34, 72, galG);
    if (small) dist *= 1.22;                           // fit the wide disk in a narrow viewport
    const lookY = small ? -34 * galG : 0;             // lift the galaxy above the card on phones
    camera.position.set(Math.sin(ang) * dist * 0.5, camY, Math.cos(ang) * dist);
    camera.lookAt(0, lookY, 0);
    setActive(clamp(Math.round(cur), 0, N - 1));
    composer.render();
  }
  function smoothstep01(x: number) { return x * x * (3 - 2 * x); }
  function start_() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  readScroll(); cur = target;
  addEventListener("resize", resize, { passive: true });
  const io = new IntersectionObserver(es => { es.some(e => e.isIntersecting) ? start_() : stop(); }, { rootMargin: "100px 0px" });
  io.observe(track);
  setActive(0);
  uniforms.uProg.value = 0; composer.render(); // first paint

  return () => {
    stop(); io.disconnect(); removeEventListener("resize", resize);
    geo.dispose(); mat.dispose(); composer.dispose(); renderer.dispose();
  };
}
