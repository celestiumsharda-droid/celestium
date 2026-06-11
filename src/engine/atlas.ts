/* =====================================================================
   CELESTIUM — THE ATLAS · Stage 1: the coordinate engine + solar system
   A continuous, scale-accurate journey. True kilometre positions live in
   JS doubles; every frame the world is rendered RELATIVE to the camera
   (floating origin), so float32 never sees a coordinate large enough to
   jitter — nearby things are exact, distant things are sub-pixel. A
   logarithmic depth buffer spans centimetres to light-hours in one pass.

   Stage 1 ships the Sun, the eight planets at their real positions for
   today (shared Keplerian ephemeris), the Moon, Saturn's rings, real
   orbit lines, the Milky Way sky — and the camera language: scroll/pinch
   to travel, drag to orbit, tap a name to fly there.
   ===================================================================== */
import * as THREE from "three";
import { planetPosition, PLANETS, type PlanetName } from "./ephemeris";
import { playClick } from "./sound";

const AU = 1.495978707e8;            // km
const D2R = Math.PI / 180;

interface Opts {
  canvas: HTMLCanvasElement;
  labels: HTMLElement;               // overlay container for body labels
  name: HTMLElement;                 // HUD: focused body
  dist: HTMLElement;                 // HUD: camera distance readout
  line: HTMLElement;                 // HUD: one-line description
}

interface Body {
  name: string;
  radius: number;                    // km
  pos: { x: number; y: number; z: number };   // km, ecliptic, doubles
  mesh: THREE.Object3D;
  label: HTMLElement;
  spin: number;                      // rad/s, cosmetic
  line: string;
  minD: number;                      // closest approach (km from centre)
  dot?: THREE.Sprite;                // the point of light it becomes at distance
  clouds?: THREE.Mesh;               // Earth's cloud shell
}

/* ecliptic (x toward equinox, z north) → three.js (y up) */
const E2T = (p: { x: number; y: number; z: number }) => ({ x: p.x, y: p.z, z: -p.y });

const LINES: Record<string, string> = {
  Sun: "4.6 billion years old, 109 Earths wide — 99.86% of everything the Atlas can reach lives in this one star.",
  Mercury: "A scorched iron world, racing through a year of 88 days.",
  Venus: "Earth's twin in size, wrapped in clouds of acid at 460 °C.",
  Earth: "The only place in the Atlas where anything is known to be looking back.",
  Moon: "A quarter of a million miles of practice — the only other world we have walked on.",
  Mars: "A cold desert with the Solar System's tallest volcano, and our next destination.",
  Jupiter: "More massive than every other planet combined; a storm wider than Earth has raged for centuries.",
  Saturn: "Rings of ice a quarter-million kilometres wide — and almost nowhere thicker than a house.",
  Uranus: "An ice giant rolled onto its side, orbiting once in 84 years.",
  Neptune: "The outermost planet: supersonic winds in the dark, 30 times farther from the Sun than Earth.",
};

const RADII: Record<string, number> = {
  Sun: 696340, Mercury: 2439.7, Venus: 6051.8, Earth: 6371, Moon: 1737.4,
  Mars: 3389.5, Jupiter: 69911, Saturn: 58232, Uranus: 25362, Neptune: 24622,
};

function fmtDist(km: number): string {
  if (km < 1e6) return `${Math.round(km).toLocaleString()} km`;
  if (km < 0.1 * AU) return `${(km / 1e6).toPrecision(3)} million km`;
  if (km < 60 * AU) return `${(km / AU).toPrecision(3)} AU`;
  return `${(km / 9.4607e12).toPrecision(3)} light-years`;
}

/** soft round glow texture for the Sun */
function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,244,214,1)");
  g.addColorStop(0.25, "rgba(255,214,140,.55)");
  g.addColorStop(0.6, "rgba(255,170,80,.12)");
  g.addColorStop(1, "rgba(255,150,60,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** a tight luminous disc — the "point of light" a planet becomes at distance */
function discTexture(): THREE.Texture {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,.85)");
  g.addColorStop(0.55, "rgba(255,255,255,.2)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** the blue limb of an atmosphere — fresnel rim, additive */
const ATMO_VERT = `varying vec3 vN; varying vec3 vV;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const ATMO_FRAG = `varying vec3 vN; varying vec3 vV;
void main(){ float rim = pow(1.0 - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(0.42, 0.62, 1.0, 1.0) * rim * 1.15; }`;

export function mountAtlas(opts: Opts): () => void {
  const { canvas, labels, name, dist, line } = opts;
  const small = matchMedia("(max-width: 760px)").matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false,
      logarithmicDepthBuffer: true, powerPreference: "high-performance",
    });
  } catch (_e) { return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1e15);
  scene.add(new THREE.AmbientLight(0x223044, 0.55));
  const sunLight = new THREE.PointLight(0xfff2dc, 2.6, 0, 0);
  scene.add(sunLight);

  const tex = new THREE.TextureLoader();
  const T = (f: string) => { const t = tex.load(`/textures/${f}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  /* ---------- bodies (true positions for now, in km doubles) ---------- */
  const now = new Date();
  const bodies: Body[] = [];
  const segMain = small ? 48 : 96;

  const discTex = discTexture();
  const DOT_COLOR: Record<string, number> = {
    Mercury: 0xb8b2a8, Venus: 0xf0ddb0, Earth: 0x86acff, Moon: 0xb9bcc4,
    Mars: 0xff9468, Jupiter: 0xe6c194, Saturn: 0xf0ddb0, Uranus: 0xa8e0e8, Neptune: 0x7e96ff,
  };

  function addBody(n: string, posKm: { x: number; y: number; z: number }, mesh: THREE.Object3D, spin = 0): Body {
    const el = document.createElement("button");
    el.type = "button"; el.className = "at-label"; el.textContent = n;
    el.addEventListener("click", () => focusBody(n, true));
    labels.appendChild(el);
    const b: Body = { name: n, radius: RADII[n] ?? 1000, pos: posKm, mesh, label: el, spin, line: LINES[n] ?? "", minD: (RADII[n] ?? 1000) * 1.2 };
    if (n !== "Sun") {
      // the point of light this world becomes from far away — clamped to a
      // minimum apparent size so a planet NEVER disappears into its label
      const dot = new THREE.Sprite(new THREE.SpriteMaterial({
        map: discTex, color: DOT_COLOR[n] ?? 0xffffff,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      }));
      mesh.add(dot);
      b.dot = dot;
    }
    scene.add(mesh);
    bodies.push(b);
    return b;
  }

  // the Sun — emissive, with a glow sprite that scales with distance
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADII["Sun"]!, segMain, segMain / 2),
    new THREE.MeshBasicMaterial({ map: T("sun.jpg") }),
  );
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(RADII["Sun"]! * 6.5);
  sunMesh.add(glow);
  addBody("Sun", { x: 0, y: 0, z: 0 }, sunMesh, 0.00002);

  // planets — real heliocentric positions, textured, lit by the Sun
  const PLANET_TEX: Record<string, string> = {
    Mercury: "mercury.jpg", Venus: "venus.jpg", Earth: "earth_day.jpg", Mars: "mars.jpg",
    Jupiter: "jupiter.jpg", Saturn: "saturn.jpg", Uranus: "uranus.jpg", Neptune: "neptune.jpg",
  };
  const TILT: Record<string, number> = { Mercury: 0.03, Venus: 177.4, Earth: 23.4, Mars: 25.2, Jupiter: 3.1, Saturn: 26.7, Uranus: 97.8, Neptune: 28.3 };
  for (const pn of Object.keys(PLANETS) as PlanetName[]) {
    const p = planetPosition(pn, now);
    const km = E2T({ x: p.x * AU, y: p.y * AU, z: p.z * AU });
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(RADII[pn]!, segMain, segMain / 2),
      new THREE.MeshPhongMaterial({ map: T(PLANET_TEX[pn]!), shininess: 4 }),
    );
    m.rotation.z = (TILT[pn] ?? 0) * D2R;
    if (pn === "Earth") {
      // a living Earth: drifting cloud shell + the blue limb of an atmosphere
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(RADII["Earth"]! * 1.012, segMain, segMain / 2),
        new THREE.MeshPhongMaterial({ map: T("earth_clouds.jpg"), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      m.add(clouds);
      (m as THREE.Mesh & { userData: { clouds?: THREE.Mesh } }).userData["clouds"] = clouds;
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(RADII["Earth"]! * 1.025, segMain, segMain / 2),
        new THREE.ShaderMaterial({ vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false }),
      );
      m.add(atmo);
    }
    if (pn === "Saturn") {
      const inner = RADII["Saturn"]! * 1.24, outer = RADII["Saturn"]! * 2.27;
      const rg = new THREE.RingGeometry(inner, outer, 128, 1);
      // map the ring texture radially (RingGeometry's default UVs are planar)
      const uv = rg.attributes["uv"] as THREE.BufferAttribute;
      const ps = rg.attributes["position"] as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) {
        const r = Math.hypot(ps.getX(i), ps.getY(i));
        uv.setXY(i, (r - inner) / (outer - inner), 0.5);
      }
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        map: T("saturn_ring.png"), side: THREE.DoubleSide, transparent: true, depthWrite: false, opacity: 0.96,
      }));
      ring.rotation.x = Math.PI / 2;
      m.add(ring);
    }
    addBody(pn, km, m, 0.00012);
  }

  // the Moon — mean circular orbit (good to a few degrees; refined in S2)
  const dDays = (now.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const moonAng = (218.316 + 13.176396 * dDays) * D2R;
  const earth = bodies.find(b => b.name === "Earth")!;
  const moonOff = { x: Math.cos(moonAng) * 384400, y: 0, z: -Math.sin(moonAng) * 384400 };
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADII["Moon"]!, 48, 24),
    new THREE.MeshPhongMaterial({ map: T("moon.jpg"), shininess: 2 }),
  );
  addBody("Moon", { x: earth.pos.x + moonOff.x, y: earth.pos.y + moonOff.y, z: earth.pos.z + moonOff.z }, moonMesh, 0.00001);

  /* ---------- orbit lines (sampled true orbits, faint) ---------- */
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: 0.16 });
  const yearDays: Record<string, number> = { Mercury: 88, Venus: 225, Earth: 365.25, Mars: 687, Jupiter: 4333, Saturn: 10759, Uranus: 30687, Neptune: 60190 };
  for (const pn of Object.keys(PLANETS) as PlanetName[]) {
    const pts: THREE.Vector3[] = [];
    const N = 256;
    for (let i = 0; i <= N; i++) {
      const d = new Date(now.getTime() + (i / N) * yearDays[pn]! * 86400000);
      const p = planetPosition(pn, d);
      const k = E2T({ x: p.x * AU, y: p.y * AU, z: p.z * AU });
      pts.push(new THREE.Vector3(k.x, k.y, k.z));
    }
    orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
  }

  /* ---------- the sky: stars + the Milky Way, glued to the camera ---------- */
  const skyGroup = new THREE.Group();
  scene.add(skyGroup);
  const mw = new THREE.Mesh(
    new THREE.SphereGeometry(8e11, 48, 24),
    new THREE.MeshBasicMaterial({ map: T("stars_milky_way.jpg"), side: THREE.BackSide, depthWrite: false }),
  );
  (mw.material as THREE.MeshBasicMaterial).color.setScalar(0.95);
  mw.rotation.x = 60.2 * D2R;        // the galactic plane really is tilted ~60° to the ecliptic
  mw.rotation.y = 0.6;
  skyGroup.add(mw);
  // three depths of stars over the panorama: faint grains, mid field, bright jewels
  const starLayer = (count: number, size: number, color: number, opacity: number) => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * 6.2832, r = Math.sqrt(1 - u * u);
      const R = 7e11;
      arr[i * 3] = R * r * Math.cos(th); arr[i * 3 + 1] = R * u; arr[i * 3 + 2] = R * r * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, transparent: true, opacity, depthWrite: false }));
    skyGroup.add(pts);
  };
  const SKY_N = small ? 3200 : 6800;
  starLayer(Math.floor(SKY_N * 0.62), 1.3, 0xc8d2f0, 0.55);
  starLayer(Math.floor(SKY_N * 0.28), 2.1, 0xe8edff, 0.8);
  starLayer(Math.floor(SKY_N * 0.07), 3.1, 0xfff1da, 0.95);
  starLayer(Math.floor(SKY_N * 0.03), 3.4, 0xa8c0ff, 0.9);

  /* ---------- the floating-origin camera ---------- */
  let focus = earth;
  let prevFocus = earth;
  let focusBlend = 1;                          // 0→1 while flying between bodies
  let distKm = earth.radius * 5;
  let yaw = 0.6, pitch = 0.22;
  let tgtDist = distKm, tgtYaw = yaw, tgtPitch = pitch;

  function focusBody(n: string, click = false) {
    const b = bodies.find(x => x.name === n);
    if (!b || b === focus) return;
    prevFocus = focus; focus = b; focusBlend = 0;
    tgtDist = Math.max(b.radius * 5, b.minD * 2);
    if (click) { try { playClick(); } catch (_e) { /* off */ } }
    name.textContent = b.name;
    line.textContent = b.line;
    name.classList.remove("in"); void name.offsetWidth; name.classList.add("in");
  }

  const camKm = { x: 0, y: 0, z: 0 };          // doubles — the true camera position
  const v = new THREE.Vector3();

  function frame(nowMs: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((nowMs - last) / 1000, 0.05); last = nowMs;

    // eased camera state
    yaw += (tgtYaw - yaw) * Math.min(1, dt * 7);
    pitch += (tgtPitch - pitch) * Math.min(1, dt * 7);
    distKm += (tgtDist - distKm) * Math.min(1, dt * 5);
    if (focusBlend < 1) focusBlend = Math.min(1, focusBlend + dt * 0.9);
    const s = focusBlend * focusBlend * (3 - 2 * focusBlend);
    const fx = prevFocus.pos.x + (focus.pos.x - prevFocus.pos.x) * s;
    const fy = prevFocus.pos.y + (focus.pos.y - prevFocus.pos.y) * s;
    const fz = prevFocus.pos.z + (focus.pos.z - prevFocus.pos.z) * s;

    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    camKm.x = fx + distKm * cp * Math.sin(yaw);
    camKm.y = fy + distKm * sp;
    camKm.z = fz + distKm * cp * Math.cos(yaw);

    // floating origin: camera sits at 0; the world is placed relative to it
    camera.position.set(0, 0, 0);
    camera.lookAt(fx - camKm.x, fy - camKm.y, fz - camKm.z);
    for (const b of bodies) {
      b.mesh.position.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      if (b.spin) b.mesh.rotation.y += b.spin * dt * 60;
      const cl = (b.mesh as THREE.Object3D & { userData: { clouds?: THREE.Mesh } }).userData["clouds"];
      if (cl) cl.rotation.y += 0.000016 * dt * 60;
      if (b.dot) {
        // hold every world at a minimum apparent size; hand over to the real
        // disk as you get close enough for it to be visibly round
        const d = Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
        const ang = b.radius / d;                       // ~radians subtended
        const mat = b.dot.material as THREE.SpriteMaterial;
        if (ang > 0.004) { mat.opacity = 0; }
        else {
          // a planet must OUTSHINE the background stars — never become a label
          // floating over nothing
          mat.opacity = Math.min(1, (0.004 - ang) / 0.0015);
          b.dot.scale.setScalar(Math.max(b.radius * 2.5, d * 0.0095));
        }
      }
    }
    orbitGroup.position.set(-camKm.x, -camKm.y, -camKm.z);
    skyGroup.position.set(0, 0, 0);            // the sky rides with the camera
    sunLight.position.set(-camKm.x, -camKm.y, -camKm.z);

    // the Sun must read as the system's beacon from any distance — its glow
    // grows with range so it never fades to a dim dot
    {
      const ds = Math.hypot(camKm.x, camKm.y, camKm.z);
      glow.scale.setScalar(Math.max(RADII["Sun"]! * 6.5, ds * 0.05));
    }

    // labels: project each body, place its name beside it
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const earthD = Math.hypot(earth.pos.x - camKm.x, earth.pos.y - camKm.y, earth.pos.z - camKm.z);
    for (const b of bodies) {
      v.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      const d = v.length();
      v.project(camera);
      const behind = v.z > 1;
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      const tooClose = b === focus && d < b.radius * 24;
      const moonFar = b.name === "Moon" && earthD > 2.5e7;   // at system scale the Moon merges with Earth
      if (behind || tooClose || moonFar || sx < -40 || sx > w + 40 || sy < -20 || sy > h + 20) {
        b.label.style.opacity = "0"; b.label.style.pointerEvents = "none";
      } else {
        b.label.style.opacity = b === focus ? "1" : "0.78";
        b.label.style.pointerEvents = "auto";
        b.label.style.transform = `translate(${sx.toFixed(1)}px, ${(sy - 14).toFixed(1)}px)`;
      }
    }

    // HUD: distance from the focus body's surface
    const alt = Math.max(0, distKm - focus.radius);
    const txt = fmtDist(alt);
    if (dist.textContent !== txt) dist.textContent = txt;

    renderer.render(scene, camera);
  }

  /* ---------- controls: scroll/pinch = travel, drag = orbit ---------- */
  function clampDist() { tgtDist = Math.min(Math.max(tgtDist, focus.minD), 9e9); }
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    tgtDist *= Math.exp(Math.sign(e.deltaY) * 0.16 * Math.min(Math.abs(e.deltaY) / 100, 3));
    clampDist();
  }, { passive: false });

  const ptrs = new Map<number, { x: number; y: number }>();
  let pinchD = 0;
  canvas.addEventListener("pointerdown", e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a!.x - b!.x, a!.y - b!.y); }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (ptrs.size === 1) {
      tgtYaw -= (e.clientX - p.x) * 0.005;
      tgtPitch = Math.min(1.45, Math.max(-1.45, tgtPitch + (e.clientY - p.y) * 0.004));
    }
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchD > 0) { tgtDist *= pinchD / d; clampDist(); }
      pinchD = d;
    }
  });
  const lift = (e: PointerEvent) => { ptrs.delete(e.pointerId); pinchD = 0; };
  canvas.addEventListener("pointerup", lift);
  canvas.addEventListener("pointercancel", lift);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  let raf = 0, last = performance.now(), running = true;
  const vis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  document.addEventListener("visibilitychange", vis);

  name.textContent = focus.name;
  line.textContent = focus.line;
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", vis);
    removeEventListener("resize", resize);
    labels.innerHTML = "";
    renderer.dispose();
  };
}
