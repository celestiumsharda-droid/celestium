/* =====================================================================
   CELESTIUM — GLOW HELPERS
   Soft additive sprites built from a canvas radial-gradient texture.
   Used for the Sun, stars and galaxy cores. No GLSL — robust across
   drivers and trivial to reason about.
   ===================================================================== */
import * as THREE from "three";

let _tex: THREE.Texture | null = null;

/** A shared soft round glow texture (white, fading to transparent). */
export function glowTexture(): THREE.Texture {
  if (_tex) return _tex;
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.7)");
  g.addColorStop(0.5, "rgba(255,255,255,0.22)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _tex = new THREE.CanvasTexture(c);
  _tex.colorSpace = THREE.SRGBColorSpace;
  return _tex;
}

/** A glowing point sprite at a given size (world units) and colour. */
export function glowSprite(color: number, size: number, opacity = 1): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(size, size, 1);
  return sp;
}

let _ring: THREE.Texture | null = null;

/** A thin hollow ring texture (transparent centre, bright band). */
export function ringTexture(): THREE.Texture {
  if (_ring) return _ring;
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, "rgba(255,255,255,0)");
  g.addColorStop(0.72, "rgba(255,255,255,0)");
  g.addColorStop(0.85, "rgba(255,255,255,1)");
  g.addColorStop(0.94, "rgba(255,255,255,0.4)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _ring = new THREE.CanvasTexture(c);
  _ring.colorSpace = THREE.SRGBColorSpace;
  return _ring;
}

/** A camera-facing ring sprite (e.g. to flag a notable star). */
export function ringSprite(color: number, size: number, opacity = 1): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: ringTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(size, size, 1);
  return sp;
}
