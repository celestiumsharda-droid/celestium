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
import { glowSprite, glowTexture, ringSprite } from "./glow";
import { tex } from "./textures";
import { buildBlackHole } from "./blackhole";
import { PLANET_STYLES, NEAR_STARS, LOCAL_GROUP, raDecToXYZ } from "./data";
import { helio, julianCenturies, type PlanetName } from "../ephemeris";

export interface Stage {
  key: string;
  group: THREE.Group;
  update?: (elapsed: number, now: Date, camera: THREE.PerspectiveCamera) => void;
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
      const sm = mat as THREE.ShaderMaterial;
      if (sm.uniforms && sm.uniforms.uFade) sm.uniforms.uFade.value = base * fade;
    });
  });
}

const TWO_PI = Math.PI * 2;

/* ----------------------------------------------------------------- */
/* Stage 0 — Earth                                                    */
/* ----------------------------------------------------------------- */
function buildEarth(): Stage {
  const g = new THREE.Group();
  const R = 22;
  const TILT = 0.41; // 23.4° axial tilt

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshStandardMaterial({ map: tex("earth_day.jpg"), roughness: 1, metalness: 0 }),
  );
  earth.rotation.z = TILT;
  g.add(earth);

  // drifting cloud layer (clouds map used as alpha)
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 96, 64),
    new THREE.MeshStandardMaterial({ alphaMap: tex("earth_clouds.jpg", false), color: 0xffffff, transparent: true, opacity: 0.9, roughness: 1, depthWrite: false }),
  );
  clouds.rotation.z = TILT;
  g.add(clouds);

  // atmosphere rim + soft halo
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.07, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x6fb1ff, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  g.add(atmo);
  g.add(glowSprite(0x6fb1ff, R * 3.1, 0.3));

  // Moon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(6, 48, 32),
    new THREE.MeshStandardMaterial({ map: tex("moon_4k.jpg"), roughness: 1, metalness: 0 }),
  );
  moon.position.set(58, 6, -16);
  g.add(moon);

  // sunlight — gives the day/night terminator
  const light = new THREE.DirectionalLight(0xfff4e2, 2.4);
  light.position.set(60, 18, 34);
  g.add(light);

  recordBase(g);
  return {
    key: "earth",
    group: g,
    update: (t) => { earth.rotation.y = t * 0.04; clouds.rotation.y = t * 0.052; },
  };
}

/** A radially-UV'd, textured planetary ring (Saturn). Upgraded to photoreal ring texture (jpg). */
function buildRing(planetSize: number, tilt: number): THREE.Mesh {
  const inner = planetSize * 1.4, outer = planetSize * 1.8;
  const geo = new THREE.RingGeometry(inner, outer, 128, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  // New ring is jpg (no alpha channel). Use alphaTest to cut the dark background + transparent for nice blend.
  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ map: tex("saturn_ring.png"), transparent: true, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2 - tilt;
  return ring;
}

/* ----------------------------------------------------------------- */
/* Stage 1 — The Solar System (REAL-TIME)                            */
/* ----------------------------------------------------------------- */
// Log-compress true heliocentric distance so Mercury and Neptune can
// share one frame. Angle (the real-time part) is preserved exactly.
function radialMap(auDist: number): number {
  const rMin = 0.3, rMax = 31;
  const t = (Math.log10(Math.max(auDist, rMin)) - Math.log10(rMin)) / (Math.log10(rMax) - Math.log10(rMin));
  return 10 + 58 * Math.min(1, Math.max(0, t));
}

function buildSolarSystem(): Stage {
  const g = new THREE.Group();

  // Sun — textured, full-bright, with corona + the light that lights everything
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(5.4, 64, 48),
    new THREE.MeshBasicMaterial({ map: tex("sun.jpg") }),
  );
  g.add(sun);
  g.add(glowSprite(0xffe6a0, 30, 0.8));
  g.add(glowSprite(0xffcf6a, 62, 0.3));
  const sunLight = new THREE.PointLight(0xfff2d8, 2.6, 0, 0); // decay 0 → even illumination
  g.add(sunLight);

  // Orbit rings — subtle, so the planets read as the subject
  const ringMat = new THREE.LineBasicMaterial({ color: 0x5a6480, transparent: true, opacity: 0.16 });
  const SEMI: Record<PlanetName, number> = {
    Mercury: 0.387, Venus: 0.723, Earth: 1.0, Mars: 1.524,
    Jupiter: 5.203, Saturn: 9.537, Uranus: 19.19, Neptune: 30.07,
  };
  for (const style of PLANET_STYLES) {
    const dR = radialMap(SEMI[style.name]!);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * TWO_PI;
      pts.push(new THREE.Vector3(Math.cos(a) * dR, 0, Math.sin(a) * dR));
    }
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
  }

  // Planets — real maps, lit by the Sun (true day/night terminator)
  const meshes: { name: PlanetName; mesh: THREE.Mesh; spin: number }[] = [];
  for (const style of PLANET_STYLES) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(style.size, 48, 32),
      new THREE.MeshStandardMaterial({ map: tex(style.map), roughness: 1, metalness: 0 }),
    );
    if (style.name === "Earth") mesh.rotation.z = 0.41;
    if (style.ring) mesh.add(buildRing(style.size, style.tilt ?? 0.47));
    g.add(mesh);
    meshes.push({ name: style.name, mesh, spin: 0.05 + Math.random() * 0.05 });
  }

  function place(now: Date) {
    const T = julianCenturies(now);
    for (const p of meshes) {
      const h = helio(p.name, T);
      const r = Math.hypot(h.x, h.y, h.z) || 1;
      const dR = radialMap(r);
      // ecliptic (x,y) → scene (x,z); ecliptic z (inclination) → scene y
      p.mesh.position.set((h.x / r) * dR, (h.z / r) * dR, (h.y / r) * dR);
    }
  }
  place(new Date());

  recordBase(g);
  return {
    key: "system",
    group: g,
    update: (t, now) => {
      place(now);                        // real positions, refreshed live
      sun.rotation.y = t * 0.06;
      for (const p of meshes) p.mesh.rotation.y = t * p.spin;
    },
  };
}

/* ----------------------------------------------------------------- */
/* Stage 2 — Stellar neighbourhood                                   */
/* ----------------------------------------------------------------- */
function buildNeighborhood(): Stage {
  const g = new THREE.Group();
  const LY = 1.35; // scene units per light-year

  // The Sun, at the origin, ringed so "you" are findable
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 16), new THREE.MeshBasicMaterial({ color: 0xfff0c4 })));
  g.add(glowSprite(0xffe6a0, 11, 0.95));
  const sunRing = ringSprite(0xa9bcff, 5.5, 0.9);
  g.add(sunRing);

  for (const s of NEAR_STARS) {
    const [x, y, z] = raDecToXYZ(s.ra, s.dec, s.dist);
    const px = x * LY, py = y * LY, pz = z * LY;
    // spectral-coloured star, sized by class
    const star = glowSprite(s.color, s.size, s.label ? 0.98 : 0.84);
    star.position.set(px, py, pz);
    g.add(star);
    // a crisp core for the brighter stars
    if (s.size >= 5) {
      const core = glowSprite(0xffffff, s.size * 0.42, 0.9);
      core.position.set(px, py, pz);
      g.add(core);
    }
    // habitable-zone host: a soft green-cyan ring
    if (s.hab) {
      const hz = ringSprite(0x86ffc4, s.size * 2.6, 0.85);
      hz.position.set(px, py, pz);
      g.add(hz);
    }
  }

  recordBase(g);
  return { key: "neighborhood", group: g };
}

/* ----------------------------------------------------------------- */
/* Stage 3 — The Milky Way                                           */
/* ----------------------------------------------------------------- */
function buildGalaxy(): Stage {
  const g = new THREE.Group();
  const R = 54;
  const ARMS = 4;       // two main arms + two minor
  const WIND = 2.6;

  // helper to lay down a population of stars along the spiral
  function population(n: number, sizeAttn: number, opacity: number, colorFn: (t: number) => THREE.Color, sz: number): THREE.Points {
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.pow(Math.random(), 0.55);
      const radius = t * R;
      const arm = i % ARMS;
      const armStrength = arm < 2 ? 1 : 0.5;                 // minor arms looser
      const spread = ((1 - t) * 0.42 + 0.05) * (3 - armStrength);
      const ang = arm * (TWO_PI / ARMS) + t * WIND * TWO_PI + (Math.random() - 0.5) * spread * 3;
      const bulge = t < 0.18 ? (Math.random() - 0.5) * 9 * (1 - t / 0.18) : 0;
      pos[i*3]   = Math.cos(ang) * radius + (Math.random() - 0.5) * 3;
      pos[i*3+2] = Math.sin(ang) * radius + (Math.random() - 0.5) * 3;
      pos[i*3+1] = (Math.random() - 0.5) * (1.8 + 6 * (1 - t)) + bulge;
      const c = colorFn(t);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: sz, map: glowTexture(), vertexColors: true, transparent: true,
      opacity, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: sizeAttn > 0,
    }));
  }

  // main disc — warm core fading to cool blue arms
  const core = new THREE.Color(0xffe2a8), arm = new THREE.Color(0x9ab8ff);
  const disc = population(13000, 1, 0.9, t => core.clone().lerp(arm, Math.min(1, t * 1.2)), 1.4);
  g.add(disc);

  // bright young blue stars threaded through the arms
  const blue = new THREE.Color(0xcfe0ff);
  const young = population(1600, 1, 0.95, () => blue, 2.0);
  g.add(young);

  // pink HII star-forming regions
  const pink = new THREE.Color(0xff9ec4);
  const hii = population(420, 1, 0.85, () => pink, 2.6);
  g.add(hii);

  // soft disc haze + bright bulge
  g.add(glowSprite(0x9fb6ff, R * 2.2, 0.10));
  g.add(glowSprite(0xffe6b0, 30, 0.9));
  g.add(glowSprite(0xffd27a, 13, 1));

  // The Sun's place — ~26,000 ly out, ~0.52 of the disc radius
  const sunR = R * 0.52;
  const sunMark = glowSprite(0xbfe0ff, 6, 1);
  sunMark.position.set(sunR, 0, 0);
  g.add(sunMark);
  const ring = ringSprite(0xa9bcff, 11, 0.95);
  ring.position.set(sunR, 0, 0);
  g.add(ring);

  recordBase(g);
  return {
    key: "galaxy",
    group: g,
    update: (t) => { disc.rotation.y = t * 0.012; young.rotation.y = t * 0.012; hii.rotation.y = t * 0.012; },
  };
}

/* A real galaxy photograph, feathered into space. The source PNGs are
   rectangular and carry a faint, non-black field; under additive blending
   that rectangle is plainly visible and reads as a pasted image. We redraw
   each photo onto a canvas, knock back the dim background, and feather the
   edges to transparent with a radial mask — so what remains is just the
   galaxy, dissolving into the dark like the procedural glows around it.
   Canvas-only (no GLSL), so it's robust across drivers. */
function galaxySprite(file: string, size: number, opacity = 1): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),          // soft placeholder until the photo decodes
    color: 0xdfe6ff, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(size, size, 1);

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // contain-fit the photo, centred
    const ar = img.width / img.height;
    let dw = S, dh = S;
    if (ar > 1) dh = S / ar; else dw = S * ar;
    ctx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh);

    // Lift contrast: pull the faint background toward black and let the
    // bright core/arms carry the light, so no dim rectangle survives.
    const im = ctx.getImageData(0, 0, S, S);
    const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const v = d[i + k]! / 255;
        // gentle gamma + black-point lift
        d[i + k] = Math.max(0, (Math.pow(v, 1.35) - 0.06) / 0.94) * 255;
      }
    }
    ctx.putImageData(im, 0, 0);

    // feather the edges to transparent (kills the rectangle)
    ctx.globalCompositeOperation = "destination-in";
    const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(255,255,255,1)");
    grad.addColorStop(0.78, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = "source-over";

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    mat.map = t;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  };
  img.src = `/textures/galaxies/${file}`;
  return sp;
}

/* ----------------------------------------------------------------- */
/* Stage 4 — The Local Group                                         */
/* ----------------------------------------------------------------- */
function buildLocalGroup(): Stage {
  const g = new THREE.Group();
  const MLY = 16; // scene units per million ly

  for (const gal of LOCAL_GROUP) {
    const px = gal.x * MLY, py = gal.y * MLY, pz = gal.z * MLY;
    if (gal.tex) {
      // a faint halo seats the galaxy in space, then the feathered photo
      const halo = glowSprite(gal.color, gal.size * 3.6, 0.28);
      halo.position.set(px, py, pz);
      g.add(halo);

      const sp = galaxySprite(gal.tex, gal.size * 3.0, 1);
      sp.position.set(px, py, pz);
      g.add(sp);
    } else {
      // dwarf / irregular — a soft glow
      const sp = glowSprite(gal.color, gal.size * 2.3, 0.75);
      sp.position.set(px, py, pz);
      g.add(sp);
    }
    if (gal.name === "Milky Way") {
      const ring = ringSprite(0xa9bcff, gal.size * 3.4, 0.85);
      ring.position.set(px, py, pz);
      g.add(ring);
    }
  }

  recordBase(g);
  return { key: "localgroup", group: g, update: (t) => { g.rotation.y = t * 0.016; } };
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
    buildBlackHole(),
    buildGalaxy(),
    buildLocalGroup(),
    buildWeb(),
  ];
}
