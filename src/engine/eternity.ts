/* =====================================================================
   CELESTIUM — "THE WHOLE OF TIME"  ·  engine core (Phase 1)
   A from-scratch cinematic flight across the whole life of the universe,
   built as one seamless logarithmic zoom. Three.js is used only as WebGL
   plumbing; every pixel of the look is bespoke.

   This first phase establishes the engine — an HDR/ACES pipeline, the
   journey director (scroll + gentle autoplay + drag-to-look), the running
   cosmic clock — and the opening act: the Big Bang, rendered as a real
   volumetric raymarch. A blinding singularity inflates and cools into a
   turbulent plasma fireball that the camera pulls out of as the first
   light (the CMB) clears. Gas you fly through, not points.

   Later phases dock further acts (atoms, first stars, nebula, supernova,
   galaxies, Earth, the far future, heat death) onto the same journey
   parameter and cross-fade between their scale-bands for the seamless zoom.
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { playClick } from "./sound";

interface Opts {
  canvas: HTMLCanvasElement;
  track: HTMLElement;
  age: HTMLElement; era: HTMLElement; temp: HTMLElement; line: HTMLElement; marker: HTMLElement;
}

/* ---- the eras of all time (scroll position → log10 age in years) ---- */
interface Era { s: number; lt: number; name: string; temp: string; line: string; }
export const ERAS: Era[] = [
  { s: 0.00, lt: -49.0, name: "The Planck epoch",     temp: "10³² K",  line: "Time itself begins. The four forces are one, and physics as we know it cannot yet describe a thing." },
  { s: 0.07, lt: -32.0, name: "Inflation",            temp: "10²⁷ K",  line: "In a sliver of an instant, space erupts — doubling over and over, smoothing the cosmos and seeding every structure to come." },
  { s: 0.16, lt: -7.5,  name: "The particle soup",    temp: "10¹⁰ K",  line: "A blazing plasma of quarks and light. Matter and antimatter annihilate; a tiny surplus of matter survives — and that is everything." },
  { s: 0.30, lt: 5.58,  name: "First light",          temp: "3,000 K", line: "After 380,000 years the fog clears and light flies free for the first time — the afterglow we still see as the cosmic microwave background." },
  { s: 0.42, lt: 8.30,  name: "The cosmic dawn",      temp: "50 K",    line: "Gravity gathers the dark into the first suns. Light returns to a universe that had gone black." },
  { s: 0.52, lt: 9.60,  name: "The age of galaxies",  temp: "20 K",    line: "Stars swarm into galaxies, galaxies into clusters and a vast cosmic web. Generation after generation of stars forge the elements." },
  { s: 0.58, lt: 9.96,  name: "The Sun is born",      temp: "5 K",     line: "From the ashes of dead stars, our Sun and its worlds condense — nine billion years into the story." },
  { s: 0.63, lt: 10.14, name: "Now. You are here.",   temp: "2.7 K",   line: "13.8 billion years in — a brief, bright moment when the universe is full of stars, and something is here to notice." },
  { s: 0.70, lt: 10.30, name: "Andromeda arrives",    temp: "2 K",     line: "In four billion years the Andromeda galaxy collides with ours, and the night sky burns with a second river of stars." },
  { s: 0.78, lt: 11.20, name: "The long isolation",   temp: "1 K",     line: "Dark energy drives the galaxies apart faster than light can bridge them. One by one they slip over the horizon, and the sky empties." },
  { s: 0.85, lt: 14.00, name: "The last star dies",   temp: "0.01 K",  line: "A hundred trillion years in, the gas runs out. The final star flickers and fades. The age of starlight is over." },
  { s: 0.91, lt: 25.00, name: "The degenerate era",   temp: "≈ 0 K",   line: "Only cold embers remain — black dwarfs, neutron stars, drifting worlds — and slowly even the atoms within them begin to decay." },
  { s: 0.96, lt: 40.00, name: "The black hole era",   temp: "≈ 0 K",   line: "For an unimaginable span, black holes are all that is left — bleeding away, one photon at a time, through Hawking radiation." },
  { s: 1.00, lt: 100.0, name: "Heat death",           temp: "10⁻²⁹ K", line: "The last black holes evaporate. Nothing remains that can change. Maximum entropy — an endless, uniform dark. Not a bang, but the slow, final quiet." },
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

/* ---- the cosmos as a camera-true volumetric raymarch ---- */
const VERT = "void main(){ gl_Position = vec4(position, 1.0); }";
const FRAG = /* glsl */`
precision highp float;
uniform vec2 uRes; uniform float uT, uTime, uTan, uAspect;
uniform vec3 uCamPos, uFwd, uRight, uUp;

// 3D value noise + fbm
float h31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i+vec3(0,0,0)),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float v=0.0,a=0.58; for(int i=0;i<4;i++){ v+=a*vnoise(p); p=p*2.03+vec3(7.1,3.7,1.3); a*=0.5; } return v; }

// hot→cool temperature ramp for the fireball
vec3 tempCol(float k){ // k 0=cool red .. 1=blue-white hot
  vec3 a=vec3(0.55,0.06,0.02), b=vec3(1.0,0.35,0.08), c=vec3(1.0,0.8,0.4), d=vec3(0.85,0.92,1.4);
  if(k<0.4) return mix(a,b,k/0.4);
  if(k<0.75) return mix(b,c,(k-0.4)/0.35);
  return mix(c,d,(k-0.75)/0.25);
}
// ray vs sphere (radius R, centre origin) → returns t-near/t-far in t.xy, hit in t.z
vec3 sphere(vec3 ro, vec3 rd, float R){
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, h=b*b-c;
  if(h<0.0) return vec3(0.0,0.0,-1.0);
  h=sqrt(h); return vec3(-b-h,-b+h,1.0);
}
// real round, sized, twinkling stars across two depth layers
float stars(vec3 rd){
  float c = 0.0;
  for (int L=0; L<2; L++){
    float sc = (L==0) ? 70.0 : 138.0;
    vec3 p = rd * sc; vec3 ip = floor(p), fp = fract(p) - 0.5;
    float h = h31(ip + float(L)*19.0);
    float thr = (L==0) ? 0.945 : 0.965;
    if (h > thr){
      vec3 jit = vec3(h31(ip+1.7), h31(ip+3.1), h31(ip+5.3)) - 0.5;
      float d = length(fp - jit*0.7);
      float bri = (h - thr)/(1.0-thr);
      float tw = 0.55 + 0.45*sin(uTime*1.4 + h*61.0);
      c += smoothstep(0.075, 0.0, d) * bri * tw * ((L==0) ? 1.0 : 0.55);
    }
  }
  return c;
}

void main(){
  vec2 ndc = (gl_FragCoord.xy*2.0 - uRes)/uRes; ndc.x*=uAspect;
  vec3 rd = normalize(uFwd + uRight*(ndc.x*uTan) + uUp*(ndc.y*uTan));
  vec3 ro = uCamPos;

  // big-bang phase (Phase 1 occupies the early journey)
  float bang = smoothstep(0.34, 0.0, uT);              // 1 at t=0, fades by ~0.34
  float heat = clamp(1.0 - uT*3.0, 0.0, 1.0);          // temperature falls as it expands
  float R = mix(0.35, 2.6, smoothstep(0.0, 0.30, uT)); // the fireball inflates

  vec3 col = vec3(0.0);

  // the starfield the fog clears to reveal (persists through the later eras)
  col += vec3(0.78,0.85,1.05) * stars(rd) * smoothstep(0.20, 0.34, uT);

  if (bang > 0.002) {
    vec3 s = sphere(ro, rd, R);
    if (s.z > 0.0) {
      float tn = max(s.x, 0.0), tf = s.y;
      float dt = (tf - tn)/float(STEPS);
      float t = tn + h31(vec3(gl_FragCoord.xy, 7.0)) * dt;   // dither: hides banding at low step counts
      float trans = 1.0; vec3 acc = vec3(0.0);
      vec3 flow = vec3(uTime*0.06, -uTime*0.04, uTime*0.05);
      for (int i=0;i<STEPS;i++){
        vec3 p = ro + rd*t;
        float rr = length(p)/R;
        float edge = smoothstep(1.0, 0.55, rr);                       // soft sphere falloff
        float turb = fbm(p*2.6 + flow) ;
        float dens = clamp((turb - 0.42) * 2.4, 0.0, 1.0) * edge;
        if (dens > 0.001){
          float k = clamp(heat*0.7 + (1.0-rr)*0.5 + turb*0.2, 0.0, 1.0);
          vec3 emit = tempCol(k) * dens * (1.6 + heat*2.5);
          float a = dens * dt * 3.2;
          acc += emit * trans * dt * 4.0;
          trans *= exp(-a);
        }
        t += dt; if (trans < 0.02) break;
      }
      // a blinding core at the very first instant
      float core = smoothstep(0.06, 0.0, uT) * smoothstep(0.5, 0.0, length(cross(rd, -normalize(ro))));
      acc += vec3(1.2,1.1,1.0) * core * 3.0;
      col = mix(col, col + acc, bang);
    }
  }

  // gentle vignette
  vec2 q = (gl_FragCoord.xy/uRes - 0.5);
  col *= 1.0 - 0.35*dot(q,q);
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountEternity(opts: Opts): () => void {
  const { canvas, track, age, era, temp, line, marker } = opts;
  const small = matchMedia("(max-width: 760px)").matches;

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (_e) { return () => {}; }
  renderer.setClearColor(0x050609, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  // the volumetric is fill-rate heavy, so it renders below native resolution
  // (soft gas + bloom hide it) and the canvas upscales — the big perf lever.
  renderer.setPixelRatio(1);
  const renderScale = small ? 0.55 : 0.74;

  const scene = new THREE.Scene();
  const dummy = new THREE.Camera();
  const FOV = 58 * Math.PI / 180;
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) }, uT: { value: 0 }, uTime: { value: 0 },
    uTan: { value: Math.tan(FOV / 2) }, uAspect: { value: 1 },
    uCamPos: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3() },
    uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() },
  };
  const STEPS = small ? 22 : 36;   // raymarch quality scales with the device
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: `#define STEPS ${STEPS}\n${FRAG}`, depthTest: false, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, dummy));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.7, 0.0);
  composer.addPass(bloom);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const bw = Math.max(2, Math.round(w * renderScale)), bh = Math.max(2, Math.round(h * renderScale));
    renderer.setSize(bw, bh, false);              // small drawing buffer; CSS stretches the canvas to full
    composer.setSize(bw, bh); bloom.setSize(bw, bh);
    uniforms.uRes.value.set(bw, bh); uniforms.uAspect.value = w / h;
  }

  // logical free-look camera (orbit around origin; journey sets the distance)
  let userYaw = 0, userPitch = 0, dragging = false, lx = 0, ly = 0;
  const camPos = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  function placeCamera(uT: number, now: number) {
    if (!dragging) { userYaw *= 0.96; userPitch *= 0.96; }
    const dist = lerp(0.15, 3.4, smooth(clamp(uT / 0.32, 0, 1)));        // pull out of the fireball
    const yaw = now * 0.00005 + userYaw, pitch = clamp(0.12 + userPitch, -1.3, 1.3);
    const cp = Math.cos(pitch);
    camPos.set(Math.sin(yaw) * dist * cp, Math.sin(pitch) * dist, Math.cos(yaw) * dist * cp);
    fwd.copy(camPos).multiplyScalar(-1).normalize();                    // look at origin
    right.crossVectors(fwd, UP).normalize();
    up.crossVectors(right, fwd).normalize();
    uniforms.uCamPos.value.copy(camPos);
    uniforms.uFwd.value.copy(fwd); uniforms.uRight.value.copy(right); uniforms.uUp.value.copy(up);
  }

  let eraIdx = -1, lastAge = "";
  function updateHud(lt: number, prog: number) {
    const a = formatAge(lt);
    if (a !== lastAge) { age.textContent = a; lastAge = a; }
    let idx = 0; for (let i = 0; i < ERAS.length; i++) if (prog >= ERAS[i]!.s - 1e-4) idx = i;
    if (idx !== eraIdx) {
      eraIdx = idx; const e = ERAS[idx]!;
      era.textContent = e.name; temp.textContent = e.temp; line.textContent = e.line;
      era.classList.remove("in"); void era.offsetWidth; era.classList.add("in");
      try { playClick(); } catch (_e) { /* off */ }
    }
    marker.style.top = `${(prog * 100).toFixed(2)}%`;
  }

  let target = 0, cur = 0, running = false, raf = 0, last = performance.now();
  function readScroll() { const r = track.getBoundingClientRect(); const span = track.offsetHeight - innerHeight; target = span > 0 ? clamp(-r.top / span, 0, 1) : 0; }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    readScroll();
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    cur += (target - cur) * clamp(0.1 * dt, 0, 1);
    if (Math.abs(target - cur) < 0.0002) cur = target;
    uniforms.uT.value = cur; uniforms.uTime.value = now * 0.001;
    placeCamera(cur, now);
    updateHud(scrollToLogT(cur), cur);
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
    canvas.addEventListener("pointermove", e => { if (!dragging) return; userYaw += (e.clientX - lx) * 0.005; userPitch = clamp(userPitch + (e.clientY - ly) * 0.004, -1.3, 1.3); lx = e.clientX; ly = e.clientY; });
    const end = () => { dragging = false; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  }

  placeCamera(0, 0); updateHud(scrollToLogT(0), 0); composer.render();
  return () => { stop(); io.disconnect(); removeEventListener("resize", resize); mat.dispose(); composer.dispose(); renderer.dispose(); };
}
