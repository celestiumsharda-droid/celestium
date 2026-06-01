/* =====================================================================
   CELESTIUM — SAGITTARIUS A* (gravitationally-lensed black hole)
   A real raymarched render: photons are integrated along the
   Schwarzschild light-bending geodesic (acceleration −1.5·h²·r̂/r⁵),
   so the accretion disk's far side is genuinely bent up and over the
   event horizon — the Interstellar/Gargantua look — with a photon
   ring and mild Doppler beaming. Drawn on a single camera-facing quad.
   ===================================================================== */
import * as THREE from "three";
import { glowSprite } from "./glow";
import type { Stage } from "./stages";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFade;
  uniform vec3 uViewDir;   // direction from the hole to the camera (unit)

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // Accretion-disk emission at a point where a ray crosses the y=0 plane.
  vec4 disk(vec3 hit, vec3 vel){
    float r = length(hit.xz);
    float inR = 2.2, outR = 8.4;
    if(r < inR || r > outR) return vec4(0.0);
    float t = (r - inR) / (outR - inR);            // 0 inner .. 1 outer

    // temperature ramp: white-blue (hot, inner) -> orange -> deep red
    vec3 hot  = vec3(1.0, 0.96, 0.92);
    vec3 mid  = vec3(1.0, 0.58, 0.20);
    vec3 cool = vec3(0.78, 0.20, 0.06);
    vec3 col = t < 0.5 ? mix(hot, mid, t/0.5) : mix(mid, cool, (t-0.5)/0.5);

    // swirling turbulence sampled in rotating Cartesian disk coords, so it
    // is seamless (no angle-wrap line) and orbits faster on the inside
    float omega = uTime * (1.1 / (0.5 + r*0.22));   // differential rotation
    float ca = cos(omega), sa = sin(omega);
    vec2 q = vec2(hit.x*ca - hit.z*sa, hit.x*sa + hit.z*ca);
    float n1 = fbm(q * 0.85);
    float n2 = fbm(q * 2.3 + 11.0);
    float n3 = fbm(q * 5.5 + 27.0);
    float gas = n1*0.6 + n2*0.32 + n3*0.2;
    float bright = (1.0 - t) * 1.7 + 0.3;
    bright *= 0.4 + 1.15*gas;
    // bright shredded filaments
    float fil = pow(n2, 2.2) + 0.6*pow(n3, 3.0);
    bright += 0.7 * fil * (1.0 - t*0.7);

    // mild relativistic Doppler beaming: approaching side a touch brighter/bluer
    vec3 orbit = normalize(vec3(-hit.z, 0.0, hit.x));
    float dop = dot(orbit, normalize(-vel));
    bright *= clamp(0.74 + 0.6*dop, 0.22, 1.9);
    col += vec3(0.0, 0.05, 0.18) * max(0.0, dop);

    // soft fade at both edges
    float edge = smoothstep(0.0, 0.10, t) * smoothstep(0.0, 0.16, 1.0 - t);
    float a = clamp(bright * edge, 0.0, 1.0);
    return vec4(col * bright, a);
  }

  void main(){
    vec2 uv = (vUv - 0.5) * 2.0;          // -1 .. 1, square quad

    // camera orbits the hole — driven by the real drag direction, so the
    // lensing genuinely re-renders from each angle you look from.
    vec3 ro = uViewDir * 13.0;
    vec3 ta = vec3(0.0);
    vec3 fwd = normalize(ta - ro);
    vec3 wup = abs(fwd.y) > 0.985 ? vec3(0.0,0.0,1.0) : vec3(0.0,1.0,0.0);
    vec3 rgt = normalize(cross(fwd, wup));
    vec3 upv = cross(rgt, fwd);
    vec3 rd  = normalize(uv.x*rgt + uv.y*upv + 0.95*fwd);  // wide field → disk sits well inside the quad

    vec3 p = ro, v = rd;
    float dt = 0.16;
    vec4 acc = vec4(0.0);
    bool horizon = false;

    for(int i=0;i<200;i++){
      float r = length(p);
      if(r < 1.0){ horizon = true; break; }     // event horizon (Rs = 1)
      if(r > 36.0) break;
      // Schwarzschild photon bending
      vec3 h = cross(p, v);
      vec3 acc3 = -1.5 * dot(h,h) * p / pow(r, 5.0);
      vec3 nv = v + acc3 * dt;
      vec3 np = p + nv * dt;
      // disk plane crossing (y = 0)
      if(p.y * np.y < 0.0){
        float k = -p.y / (np.y - p.y);
        vec3 hitp = mix(p, np, k);
        vec4 dc = disk(hitp, nv);
        acc.rgb += (1.0 - acc.a) * dc.rgb;
        acc.a   += (1.0 - acc.a) * dc.a;
        if(acc.a > 0.99) break;
      }
      v = nv; p = np;
    }

    vec3 col = acc.rgb;
    float a = acc.a;
    if(horizon){ a = 1.0; }                 // shadow blocks the background
    a *= smoothstep(1.0, 0.85, max(abs(uv.x), abs(uv.y))); // soft fade so the quad edge never shows
    gl_FragColor = vec4(col, a * uFade);
  }
`;

export function buildBlackHole(): Stage {
  const g = new THREE.Group();

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uViewDir: { value: new THREE.Vector3(0, 0.32, 1).normalize() },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  mat.userData.base = 1;

  // camera-facing quad large enough to frame the hole + lensed disk
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), mat);
  g.add(quad);

  // faint outer bloom so the disk bleeds light into the dark
  const bloom = glowSprite(0xff8a3a, 150, 0.12);
  bloom.material.userData.base = 0.12;
  g.add(bloom);

  return {
    key: "blackhole",
    group: g,
    update: (t, _now, camera) => {
      mat.uniforms.uTime!.value = t;
      if (camera) {
        quad.quaternion.copy(camera.quaternion);            // billboard the quad
        const p = camera.position;                          // hole sits at the origin
        const len = Math.hypot(p.x, p.y, p.z) || 1;
        (mat.uniforms.uViewDir!.value as THREE.Vector3).set(p.x / len, p.y / len, p.z / len);
      }
    },
  };
}
