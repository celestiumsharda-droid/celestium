/* =====================================================================
   CELESTIUM — COSMIC MAP (controller)
   A continuous, scroll-driven zoom from Earth to the cosmic web, built
   on Three.js. The page scroll over a tall pinned section drives a
   single `zoom` scalar in [0, STAGES-1]; adjacent stages cross-fade
   and scale to fake an infinite dolly-out while staying anchored on you.

   Lazy-loaded: this whole module (and Three.js) is only imported when
   the Perspective section nears the viewport, so the rest of the site
   stays light.
   ===================================================================== */
import * as THREE from "three";
import { buildStages, setStageFade, type Stage } from "./stages";
import { tex, setMaxAnisotropy } from "./textures";
import { STAGES } from "./data";

export interface HudEls {
  level: HTMLElement;
  name: HTMLElement;
  desc: HTMLElement;
  readout: HTMLElement;
  live: HTMLElement;
}

export interface CosmicMap {
  setZoom(z: number): void;
  resize(): void;
  destroy(): void;
}

const LY = 9.4607e15, AU = 1.496e11;
// characteristic diameter of each stage, in metres (for the live readout).
// The black-hole stage uses a fixed readout override (see data.ts), so its
// entry here only needs to keep the sequence monotonic for interpolation.
const STAGE_METERS = [1.2742e7, 9e12, 2.84e17, 4e18, 9.46e20, 9.46e22, 8.8e26];

const smoothstep = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function formatScale(m: number): string {
  if (m < 1e8) return `${Math.round(m / 1e3).toLocaleString()} km`;
  if (m < 0.08 * LY) return `${(m / AU).toFixed(1)} AU`;
  const ly = m / LY;
  if (ly < 1000) return `${ly.toFixed(1)} light-years`;
  if (ly < 1e6) return `${(ly / 1e3).toFixed(0)},000 light-years`;
  if (ly < 1e9) return `${(ly / 1e6).toFixed(1)} million ly`;
  return `${(ly / 1e9).toFixed(1)} billion ly`;
}

export function mountCosmicMap(canvas: HTMLCanvasElement, hud: HudEls): CosmicMap {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 8000);

  // soft ambient fill; each near stage carries its own key light so the
  // planets get a real day/night terminator.
  scene.add(new THREE.AmbientLight(0x4a566f, 0.45));

  /* ---- real Milky Way sky backdrop (dimmed, gives depth + place) ---- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(3400, 64, 48),
    new THREE.MeshBasicMaterial({ map: tex("stars_milky_way.jpg"), side: THREE.BackSide, color: 0x6b7286, depthWrite: false }),
  );
  scene.add(sky);

  /* ---- stages ---- */
  const stages: Stage[] = buildStages();
  for (const s of stages) { scene.add(s.group); setStageFade(s.group, 0); }

  /* ---- camera orbit state ---- */
  let D = 155;                       // distance, recomputed per aspect in resize()
  let az = 0.6, pol = 1.15;          // azimuth, polar (radians)
  let tAz = az, tPol = pol;          // targets (eased)
  let dragging = false, px = 0, py = 0;
  let lastInteract = performance.now();

  let touchDrag = false;
  function onDown(e: PointerEvent) {
    dragging = true;
    touchDrag = e.pointerType === "touch";
    px = e.clientX; py = e.clientY; lastInteract = performance.now();
    // Capture only for mouse — capturing touch would steal the vertical
    // scroll the page needs for zooming.
    if (!touchDrag) canvas.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    // Horizontal always orbits (azimuth). On touch, vertical is left to the
    // browser (it scrolls = zoom, thanks to touch-action: pan-y); on mouse
    // it tilts (polar).
    tAz -= (e.clientX - px) * 0.005;
    if (!touchDrag) {
      tPol = Math.min(Math.PI - 0.25, Math.max(0.25, tPol - (e.clientY - py) * 0.005));
    }
    px = e.clientX; py = e.clientY; lastInteract = performance.now();
  }
  function onUp() { dragging = false; }
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", onUp);

  /* ---- zoom + crossfade ----
     Stages must not be prominently visible at the same time, or the
     outgoing stage (e.g. Earth, centred at the origin) appears to dive
     into the incoming stage's central body (the Sun, also at the
     origin). So the outgoing stage fades out IN PLACE within the first
     `OVERLAP` of the interval, and the incoming stage only begins to
     appear in the last `OVERLAP`. The ever-present Milky Way backdrop
     fills the brief handoff, so it reads as flying through space. */
  const OVERLAP = 0.6;
  let zoom = 0;
  function applyZoom(z: number) {
    zoom = Math.min(STAGES.length - 1, Math.max(0, z));
    for (let k = 0; k < stages.length; k++) {
      const local = zoom - k;
      const g = stages[k]!.group;
      if (local >= 1 || local <= -1) { setStageFade(g, 0); continue; }
      let scale: number, fade: number;
      if (local >= 0) {                 // outgoing — dissolve in place
        fade = 1 - smoothstep(local / OVERLAP);
        scale = lerp(1, 0.55, smoothstep(local));
      } else {                          // incoming — bloom gently in
        const a = smoothstep((local + OVERLAP) / OVERLAP);
        fade = a;
        scale = lerp(2.4, 1, a);
      }
      g.scale.setScalar(scale);
      setStageFade(g, fade);
    }
    updateHud();
  }

  function updateHud() {
    const i = Math.round(zoom);
    const info = STAGES[Math.min(STAGES.length - 1, Math.max(0, i))]!;
    hud.level.textContent = info.level;
    hud.name.textContent = info.name;
    hud.desc.textContent = info.desc;
    hud.live.style.opacity = info.live ? "1" : "0";

    if (info.readout) {
      hud.readout.textContent = info.readout;   // fixed override (e.g. Sgr A*)
    } else {
      // smooth log-interpolated readout
      const lo = Math.floor(zoom), hi = Math.min(STAGE_METERS.length - 1, lo + 1);
      const f = zoom - lo;
      const m = Math.pow(10, lerp(Math.log10(STAGE_METERS[lo]!), Math.log10(STAGE_METERS[hi]!), f));
      hud.readout.textContent = formatScale(m);
    }
  }

  /* ---- render loop (paused when offscreen) ---- */
  let running = false, raf = 0, t0 = performance.now();
  function frame() {
    if (!running) return;
    const now = performance.now();
    const elapsed = (now - t0) / 1000;

    if (!reduced && !dragging && now - lastInteract > 2600) tAz += 0.0012; // idle drift
    az = lerp(az, tAz, 0.08);
    pol = lerp(pol, tPol, 0.08);
    camera.position.set(
      D * Math.sin(pol) * Math.cos(az),
      D * Math.cos(pol),
      D * Math.sin(pol) * Math.sin(az),
    );
    camera.lookAt(0, 0, 0);
    if (!reduced) sky.rotation.y = elapsed * 0.004;

    const date = new Date();
    for (const s of stages) if (s.group.visible && s.update) s.update(elapsed, date, camera);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* run only while the section is on screen */
  const vis = new IntersectionObserver(
    es => es.forEach(e => (e.isIntersecting ? start() : stop())),
    { threshold: 0 },
  );
  vis.observe(canvas);

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // Pull the camera back on narrow/portrait screens so a ~80-unit scene
    // fits in the limiting (usually horizontal) field of view — otherwise
    // wide objects like the black-hole disk get clipped at the edges.
    const vHalf = (camera.fov / 2) * (Math.PI / 180);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const limit = Math.min(vHalf, hHalf);
    D = Math.min(560, 82 / Math.tan(limit));
  }
  resize();
  addEventListener("resize", resize);

  applyZoom(0);
  start();

  return {
    setZoom: applyZoom,
    resize,
    destroy() {
      stop();
      vis.disconnect();
      removeEventListener("resize", resize);
      removeEventListener("pointerup", onUp);
      renderer.dispose();
    },
  };
}
