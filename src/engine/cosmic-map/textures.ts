/* =====================================================================
   CELESTIUM — TEXTURE LOADER
   Real planetary maps (Solar System Scope, CC BY 4.0) served from
   /public/textures. Same-origin, so no CORS, no runtime API. Cached so
   each map is fetched once and shared across materials.
   ===================================================================== */
import * as THREE from "three";

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
let maxAniso = 8;

/** Set the renderer's max anisotropy so maps stay crisp at grazing angles. */
export function setMaxAnisotropy(n: number): void { maxAniso = Math.max(1, n); }

/** Load (and cache) a texture from /textures/<file>. `srgb` for colour maps. */
export function tex(file: string, srgb = true): THREE.Texture {
  const path = `/textures/${file}`;
  const hit = cache.get(path);
  if (hit) return hit;
  const t = loader.load(path);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  cache.set(path, t);
  return t;
}
