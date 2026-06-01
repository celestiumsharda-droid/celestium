/* =====================================================================
   CELESTIUM — COSMIC MAP STAGES
   Each stage is a self-contained THREE.Group built around the origin at
   a consistent "natural" size (~radius 50 units) so the parent scene can
   scale + cross-fade between them to produce a continuous zoom.

   Stage 1 (the Solar System) is genuinely real-time: planet positions
   are recomputed from the shared ephemeris. Everything beyond is
   positionally honest but cosmically still — because on a human
   lifetime it IS still. That stillness is the point, not a shortcut.
   ===================================================================== */
import * as THREE from "three";
import { glowSprite, glowTexture } from "./glow";
import { PLANET_STYLES, NEAR_STARS, LOCAL_GROUP, raDecToXYZ } from "./data";
import { helio, julianCenturies, type PlanetName } from "../ephemeris";

export interface Stage {
  key: string;
  group: THREE.Group;
  update?: (elapsed: number, now: Date) => void;
}

/* Record each material's authored opacity so cross-fades can multiply
   against it rather than clobbering it. */
function recordBase(root: THREE.Object3D): void {
  root.traverse(o => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    const mats = Array.isArray(m) ? m : [m];
    mats.forEach(mat => {
      mat.transparent = true;
      mat.userData.base = mat.opacity;
    });
  });
}

/** Fade an entire stage group to `fade` ∈ [0,1] of its authored opacity. */
export function setStageFade(root: THREE.Object3D, fade: number): void {
  root.visible = fade > 0.002;
  root.traverse(o => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    const mats = Array.isArray(m) ? m : [m];
    mats.forEach(mat => {
      const base = (mat.userData.base as number) ?? 1;
      mat.opacity = base * fade;
    });
  });
}

const TWO_PI = Math.PI * 2;

/* ----------------------------------------------------------------- */
/* Stage 0 — Earth                                                    */
/* ----------------------------------------------------------------- */
function buildEarth(): Stage {
  const g = new THREE.Group();

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(22, 64, 48),
    new THREE.MeshStandardMaterial({ color: 0x2a5a9c, roughness: 0.85, metalness: 0.0, emissive: 0x0a1830, emissiveIntensity: 0.5 }),
  );
  g.add(earth);

  // thin atmosphere halo (back-side additive shell)
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(24.4, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x6fb1ff, transparent: true, opacity: 0.16, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  g.add(atmo);

  const halo = glowSprite(0x6fb1ff, 82, 0.45);
  g.add(halo);

  // Moon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0x9099a6, roughness: 1, emissive: 0x141822, emissiveIntensity: 0.4 }),
  );
  moon.position.set(58, 7, -16);
  g.add(moon);

  recordBase(g);
  return {
    key: "earth",
    group: g,
    update: (t) => { earth.rotation.y = t * 0.06; },
  };
}

/* ----------------------------------------------------------------- */
/* Stage 1 — The Solar System (REAL-TIME)                            */
/* ----------------------------------------------------------------- */
// Log-compress true heliocentric distance so Mercury and Neptune can
// share one frame. Angle (the real-time part) is preserved exactly.
function radialMap(auDist: number): number {
  const rMin = 0.32, rMax = 31;
  const t = (Math.log10(Math.max(auDist, rMin)) - Math.log10(rMin)) / (Math.log10(rMax) - Math.log10(rMin));
  return 7 + 41 * Math.min(1, Math.max(0, t));
}

function buildSolarSystem(): Stage {
  const g = new THREE.Group();

  // Sun
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff0c4 }),
  );
  g.add(sun);
  g.add(glowSprite(0xffe6a0, 34, 0.95));
  g.add(glowSprite(0xffd070, 64, 0.4));

  // Orbit rings (from each planet's semi-major axis)
  const ringMat = new THREE.LineBasicMaterial({ color: 0x6f7a9c, transparent: true, opacity: 0.34 });
  const SEMI: Record<PlanetName, number> = {
    Mercury: 0.387, Venus: 0.723, Earth: 1.0, Mars: 1.524,
    Jupiter: 5.203, Saturn: 9.537, Uranus: 19.19, Neptune: 30.07,
  };
  for (const style of PLANET_STYLES) {
    const dR = radialMap(SEMI[style.name]);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * TWO_PI;
      pts.push(new THREE.Vector3(Math.cos(a) * dR, 0, Math.sin(a) * dR));
    }
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
  }

  // Planets
  const meshes: { name: PlanetName; mesh: THREE.Mesh; halo: THREE.Sprite }[] = [];
  for (const style of PLANET_STYLES) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(style.size, 24, 18),
      new THREE.MeshBasicMaterial({ color: style.color }),
    );
    g.add(mesh);
    const halo = glowSprite(style.color, style.size * 4.5, 0.6);
    g.add(halo);

    if (style.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(style.size * 1.4, style.size * 2.3, 48),
        new THREE.MeshBasicMaterial({ color: 0xe6cd92, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      ring.rotation.x = Math.PI / 2 - 0.35;
      mesh.add(ring);
    }
    meshes.push({ name: style.name, mesh, halo });
  }

  function place(now: Date) {
    const T = julianCenturies(now);
    for (const p of meshes) {
      const h = helio(p.name, T);
      const r = Math.hypot(h.x, h.y, h.z) || 1;
      const dR = radialMap(r);
      // ecliptic (x,y) → scene (x,z); ecliptic z (inclination) → scene y
      const X = (h.x / r) * dR;
      const Z = (h.y / r) * dR;
      const Y = (h.z / r) * dR;
      p.mesh.position.set(X, Y, Z);
      p.halo.position.set(X, Y, Z);
    }
  }
  place(new Date());

  recordBase(g);
  return {
    key: "system",
    group: g,
    update: (t, now) => {
      place(now);              // real positions, refreshed live
      sun.rotation.y = t * 0.1;
    },
  };
}

/* ----------------------------------------------------------------- */
/* Stage 2 — Stellar neighbourhood                                   */
/* ----------------------------------------------------------------- */
function buildNeighborhood(): Stage {
  const g = new THREE.Group();
  const LY = 1.9; // scene units per light-year

  // The Sun, at the origin
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0c4 }));
  g.add(sun);
  g.add(glowSprite(0xffe6a0, 9, 0.9));

  for (const s of NEAR_STARS) {
    const [x, y, z] = raDecToXYZ(s.ra, s.dec, s.dist);
    const sp = glowSprite(s.color, s.label ? 7 : 4.4, s.label ? 0.95 : 0.7);
    sp.position.set(x * LY, y * LY, z * LY);
    g.add(sp);
  }

  recordBase(g);
  return { key: "neighborhood", group: g };
}

/* ----------------------------------------------------------------- */
/* Stage 3 — The Milky Way                                           */
/* ----------------------------------------------------------------- */
function buildGalaxy(): Stage {
  const g = new THREE.Group();
  const R = 52;
  const ARMS = 2;
  const WIND = 2.4;
  const N = 7000;

  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const core = new THREE.Color(0xffe2a8);
  const arm = new THREE.Color(0x8fb4ff);

  for (let i = 0; i < N; i++) {
    const t = Math.pow(Math.random(), 0.62);       // denser toward centre
    const radius = t * R;
    const armIndex = i % ARMS;
    const spread = (1 - t) * 0.5 + 0.06;
    const ang = armIndex * (TWO_PI / ARMS) + t * WIND * TWO_PI + (Math.random() - 0.5) * spread * 3;
    const bulge = t < 0.16 ? (Math.random() - 0.5) * 8 * (1 - t / 0.16) : 0;
    const x = Math.cos(ang) * radius + (Math.random() - 0.5) * 3;
    const z = Math.sin(ang) * radius + (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * (2.2 + 6 * (1 - t)) + bulge;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;

    const c = core.clone().lerp(arm, Math.min(1, t * 1.25));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 1.5, map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }),
  );
  g.add(points);

  // bright galactic core
  g.add(glowSprite(0xffe6b0, 26, 0.85));

  // The Sun's place — ~26,000 ly out, ~0.52 of the disc radius
  const sunR = R * 0.52;
  const sunMark = glowSprite(0xbfe0ff, 6, 1);
  sunMark.position.set(sunR, 0, 0);
  g.add(sunMark);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5, 6, 32),
    new THREE.MeshBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.position.set(sunR, 0, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  recordBase(g);
  return {
    key: "galaxy",
    group: g,
    update: (t) => { points.rotation.y = t * 0.012; },
  };
}

/* ----------------------------------------------------------------- */
/* Stage 4 — The Local Group                                         */
/* ----------------------------------------------------------------- */
function miniSpiral(size: number, color: number): THREE.Points {
  const N = 600, R = size;
  const pos = new Float32Array(N * 3);
  const base = new THREE.Color(color);
  for (let i = 0; i < N; i++) {
    const t = Math.pow(Math.random(), 0.7);
    const ang = (i % 2) * Math.PI + t * 2.2 * TWO_PI + (Math.random() - 0.5);
    const r = t * R;
    pos[i * 3] = Math.cos(ang) * r + (Math.random() - 0.5) * 1.2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * (0.6 + R * 0.12);
    pos[i * 3 + 2] = Math.sin(ang) * r + (Math.random() - 0.5) * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: base, size: 0.8, map: glowTexture(), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
}

function buildLocalGroup(): Stage {
  const g = new THREE.Group();
  const MLY = 16; // scene units per million ly

  for (const gal of LOCAL_GROUP) {
    const node = new THREE.Group();
    node.position.set(gal.x * MLY, gal.y * MLY, gal.z * MLY);
    if (gal.kind === "spiral") {
      node.add(miniSpiral(gal.size, gal.color));
      node.rotation.set(Math.random() * 0.8, Math.random() * TWO_PI, Math.random() * 0.6);
    }
    node.add(glowSprite(gal.color, gal.size * 2.4, gal.kind === "spiral" ? 0.7 : 0.85));
    g.add(node);
  }

  // mark the Milky Way (origin)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(11, 12.5, 40),
    new THREE.MeshBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  recordBase(g);
  return { key: "localgroup", group: g, update: (t) => { g.rotation.y = t * 0.02; } };
}

/* ----------------------------------------------------------------- */
/* Stage 5 — The Cosmic Web                                          */
/* ----------------------------------------------------------------- */
function buildWeb(): Stage {
  const g = new THREE.Group();
  const NODES = 90;
  const R = 60;
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < NODES; i++) {
    // clustered: cube root for roughly uniform sphere, then bias outward
    const u = Math.random(), v = Math.random(), w = Math.random();
    const r = Math.cbrt(u) * R;
    const theta = Math.acos(2 * v - 1);
    const phi = w * TWO_PI;
    nodes.push(new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi) * 0.7,
      r * Math.cos(theta),
    ));
  }

  // filaments: connect each node to its 2 nearest neighbours
  const segPts: THREE.Vector3[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const d = nodes
      .map((n, j) => ({ j, dist: nodes[i]!.distanceTo(n) }))
      .filter(o => o.j !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);
    for (const { j } of d) { segPts.push(nodes[i]!, nodes[j]!); }
  }
  const segGeo = new THREE.BufferGeometry().setFromPoints(segPts);
  g.add(new THREE.LineSegments(segGeo, new THREE.LineBasicMaterial({ color: 0x5a6bb0, transparent: true, opacity: 0.28 })));

  // node glows
  for (const n of nodes) {
    const sp = glowSprite(0xb9c6ff, 3 + Math.random() * 4, 0.6);
    sp.position.copy(n);
    g.add(sp);
  }

  // mark the Local Group near centre
  const mark = glowSprite(0xf2e6c4, 7, 1);
  g.add(mark);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6, 7, 36),
    new THREE.MeshBasicMaterial({ color: 0xf2e6c4, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  recordBase(g);
  return { key: "web", group: g, update: (t) => { g.rotation.y = t * 0.015; } };
}

export function buildStages(): Stage[] {
  return [
    buildEarth(),
    buildSolarSystem(),
    buildNeighborhood(),
    buildGalaxy(),
    buildLocalGroup(),
    buildWeb(),
  ];
}
