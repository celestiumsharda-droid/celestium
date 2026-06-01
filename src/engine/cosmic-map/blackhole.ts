/* =====================================================================
   CELESTIUM — SAGITTARIUS A* (the galactic-centre black hole)
   An Interstellar/Gargantua-style render: a black event horizon, a
   bright photon ring, a hot textured accretion disk with Doppler
   beaming (one side brighter), and a second perpendicular disk that
   fakes the gravitationally-lensed arc over the top and bottom — the
   signature look — plus a handful of S-stars whipping around it.

   No GLSL: everything is built from standard geometry + a procedural
   canvas texture, so it is robust across drivers.
   ===================================================================== */
import * as THREE from "three";
import { glowSprite } from "./glow";
import type { Stage } from "./stages";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Hot accretion-gas texture: radius (v) ramps blue-white → orange →
   dark red; angle (u) carries grainy streaks and bright filaments. */
function makeDiskTexture(): THREE.CanvasTexture {
  const W = 1024, H = 128;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  for (let y = 0; y < H; y++) {
    const rad = y / (H - 1);
    let r: number, g: number, b: number;
    if (rad < 0.5) { const t = rad / 0.5; r = lerp(212, 255, t); g = lerp(230, 200, t); b = lerp(255, 120, t); }
    else { const t = (rad - 0.5) / 0.5; r = lerp(255, 150, t); g = lerp(200, 55, t); b = lerp(120, 28, t); }
    const aEnv = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, rad))), 0.7);
    for (let x = 0; x < W; x++) {
      const ang = x / W;
      const grain = 0.4 + 0.6 * hash(x * 0.7 + y * 13.3);
      const swirl = 0.5 + 0.5 * Math.sin(ang * Math.PI * 2 * 6 + rad * 8);
      const spoke = Math.pow(Math.abs(Math.sin(ang * Math.PI * 36)), 10);
      const bright = Math.min(1.5, 0.42 + 0.5 * grain + 0.3 * swirl + 0.55 * spoke);
      const i = (y * W + x) * 4;
      d[i] = Math.min(255, r * bright);
      d[i + 1] = Math.min(255, g * bright);
      d[i + 2] = Math.min(255, b * bright);
      d[i + 3] = Math.min(255, aEnv * bright * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/* Soft ring sprite (transparent centre, bright band) for the photon ring. */
function makePhotonTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, "rgba(255,255,255,0)");
  g.addColorStop(0.66, "rgba(255,255,255,0)");
  g.addColorStop(0.78, "rgba(255,240,210,0.95)");
  g.addColorStop(0.85, "rgba(255,255,255,1)");
  g.addColorStop(0.92, "rgba(255,225,170,0.5)");
  g.addColorStop(1.0, "rgba(255,200,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* A textured accretion-disk ring with radial UVs and optional
   Doppler-beaming vertex colours. Returned flat in the XY plane. */
function makeDisk(inner: number, outer: number, texture: THREE.Texture, doppler: boolean):
  { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } {
  const geo = new THREE.RingGeometry(inner, outer, 220, 6);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ang = Math.atan2(v.y, v.x);
    const radius = Math.hypot(v.x, v.y);
    uv.setXY(i, ang / (Math.PI * 2) + 0.5, (radius - inner) / (outer - inner));
    if (doppler) {
      const beam = 0.35 + 0.65 * ((1 + Math.cos(ang)) / 2); // +x side brightest
      colors.push(beam, beam, beam);
    }
  }
  const mat = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1,
    vertexColors: doppler,
  });
  if (doppler) geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return { mesh: new THREE.Mesh(geo, mat), mat };
}

export function buildBlackHole(): Stage {
  const g = new THREE.Group();
  const Rh = 10;

  // Event horizon — a true black sphere.
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(Rh, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  ));

  // Photon ring — billboard, always hugging the horizon.
  const photon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makePhotonTexture(), color: 0xffe9c4, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  }));
  photon.scale.set(Rh * 2.55, Rh * 2.55, 1);
  g.add(photon);

  const diskTex = makeDiskTexture();
  const inner = Rh * 1.35, outer = Rh * 4.4;

  // Main accretion disk (horizontal, Doppler-beamed).
  const diskH = makeDisk(inner, outer, diskTex, true);
  diskH.mesh.rotation.x = -Math.PI / 2;
  g.add(diskH.mesh);

  // Lensed arc — a perpendicular disk faking the over-the-top band.
  const diskV = makeDisk(inner, outer, diskTex, false);
  diskV.mat.opacity = 0.5;
  g.add(diskV.mesh);

  // outer bloom
  g.add(glowSprite(0xff9a52, Rh * 9, 0.22));
  g.add(glowSprite(0xffcaa0, Rh * 4.6, 0.3));

  // S-stars whipping around the centre
  type SStar = { sp: THREE.Sprite; a: number; b: number; inc: number; node: number; phase: number; speed: number };
  const sStars: SStar[] = [];
  const starColors = [0xbfd4ff, 0xffffff, 0xfff0d0, 0xcfe0ff, 0xffe6c0, 0xdfe9ff];
  for (let i = 0; i < 6; i++) {
    const sp = glowSprite(starColors[i % starColors.length]!, 2.2, 1);
    g.add(sp);
    sStars.push({
      sp,
      a: Rh * (2.6 + Math.random() * 4),
      b: Rh * (2.0 + Math.random() * 3),
      inc: (Math.random() - 0.5) * 1.4,
      node: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.8,
    });
  }
  function placeStars(t: number) {
    for (const s of sStars) {
      const th = s.phase + t * s.speed;
      const x = Math.cos(th) * s.a, z = Math.sin(th) * s.b;
      const ci = Math.cos(s.inc), si = Math.sin(s.inc);
      const cn = Math.cos(s.node), sn = Math.sin(s.node);
      // incline then rotate by node
      const y = z * si;
      const z2 = z * ci;
      s.sp.position.set(x * cn - z2 * sn, y, x * sn + z2 * cn);
    }
  }
  placeStars(0);

  g.rotation.x = 0.32; // tilt toward the viewer

  // base opacities for the cross-fade
  g.traverse(o => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach(mat => { mat.transparent = true; mat.userData.base = mat.opacity; });
  });

  return {
    key: "blackhole",
    group: g,
    update: (t) => {
      diskTex.offset.x = t * 0.03;       // swirl the gas (Doppler stays fixed)
      placeStars(t);
    },
  };
}
