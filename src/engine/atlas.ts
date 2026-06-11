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
import { planetPosition, PLANETS, kepler, rad, norm360, julianCenturies, type PlanetName } from "./ephemeris";
import { playClick } from "./sound";

const AU = 1.495978707e8;            // km
const D2R = Math.PI / 180;

interface Opts {
  canvas: HTMLCanvasElement;
  labels: HTMLElement;               // overlay container for body labels
  name: HTMLElement;                 // HUD: focused body
  dist: HTMLElement;                 // HUD: camera distance readout
  line: HTMLElement;                 // HUD: one-line description
  more: HTMLElement;                 // "Read more" jewel button
  sheet: HTMLElement;                // the jewel info sheet (refracts the world behind it)
  time: HTMLElement;                 // time-control chip row
  date: HTMLElement;                 // simulated date readout
}

/* Pluto — Standish mean elements (valid 1800–2050), kept local to the Atlas */
const PLUTO = {
  a: [39.48211675, -0.00031596], e: [0.24882730, 0.00005170], I: [17.14001206, 0.00004818],
  L: [238.92903833, 145.20780515], LP: [224.06891629, -0.04062942], N: [110.30393684, -0.01183482],
} as const;
function plutoPosition(date: Date): { x: number; y: number; z: number } {
  const T = julianCenturies(date);
  const a = PLUTO.a[0] + PLUTO.a[1] * T, e = PLUTO.e[0] + PLUTO.e[1] * T;
  const I = rad(PLUTO.I[0] + PLUTO.I[1] * T);
  const L = PLUTO.L[0] + PLUTO.L[1] * T;
  const N = rad(PLUTO.N[0] + PLUTO.N[1] * T);
  const w = rad(PLUTO.LP[0] + PLUTO.LP[1] * T) - N;
  const M = rad(norm360(L - PLUTO.LP[0] - PLUTO.LP[1] * T));
  const E = kepler(M, e);
  const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv), r = Math.hypot(xv, yv), u = v + w;
  const cN = Math.cos(N), sN = Math.sin(N), cI = Math.cos(I), sI = Math.sin(I), cU = Math.cos(u), sU = Math.sin(u);
  return { x: r * (cN * cU - sN * sU * cI), y: r * (sN * cU + cN * sU * cI), z: r * (sU * sI) };
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
  labelMax?: number;                 // hide label/dot beyond this camera distance (moons)
  update?: (date: Date, simDays: number) => void;   // live orbital motion
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
  Pluto: "The heart-bearing dwarf at the edge — a world, whatever we call it.",
  Io: "Jupiter's tortured moon — the most volcanic body we know.",
  Europa: "An ocean world in an ice shell; the best place to look for neighbours.",
  Ganymede: "The largest moon in the Solar System — bigger than Mercury.",
  Callisto: "An ancient, crater-saturated archive of the early Solar System.",
  Titan: "Saturn's giant moon, with rain, rivers and seas — of methane.",
};

const RADII: Record<string, number> = {
  Sun: 696340, Mercury: 2439.7, Venus: 6051.8, Earth: 6371, Moon: 1737.4,
  Mars: 3389.5, Jupiter: 69911, Saturn: 58232, Uranus: 25362, Neptune: 24622,
  Io: 1821.6, Europa: 1560.8, Ganymede: 2634.1, Callisto: 2410.3, Titan: 2574.7, Pluto: 1188.3,
};

/* the full reading for each world — facts + a real piece of writing */
const INFO: Record<string, { facts: [string, string][]; text: string[] }> = {
  Sun: { facts: [["Age", "4.6 billion years"], ["Diameter", "109 Earths"], ["Surface", "5,505 °C"], ["Mass", "99.86% of the system"], ["Rotation", "~25 days"]], text: [
    "Every second, deep in its core, the Sun fuses six hundred million tonnes of hydrogen into helium — and the missing four million tonnes become the light that warms your face. A photon born in that furnace takes perhaps a hundred thousand years to stagger out of the dense interior, then just over eight minutes to fall the rest of the way to Earth.",
    "It is an utterly ordinary star, one of several hundred billion in this galaxy alone. That ordinariness is the point: what happened around this one can have happened around others.",
  ] },
  Mercury: { facts: [["Year", "88 days"], ["Day (rotation)", "59 Earth days"], ["Temperature", "−173 to 427 °C"], ["Gravity", "0.38 g"], ["Moons", "0"]], text: [
    "The innermost world is a body of contradictions: daytime hot enough to melt zinc, yet with permanently shadowed polar craters that hoard water ice older than complex life. With almost no atmosphere to carry heat around, Mercury's day and night differ by six hundred degrees.",
    "Its enormous iron core — most of the planet by radius — suggests Mercury was once larger, stripped to the metal by a colossal early impact.",
  ] },
  Venus: { facts: [["Year", "225 days"], ["Day (rotation)", "243 days, backwards"], ["Surface", "464 °C everywhere"], ["Pressure", "92 atmospheres"], ["Gravity", "0.9 g"]], text: [
    "Venus is what a greenhouse effect looks like when it wins. Beneath its unbroken cloud deck of sulphuric acid lies a surface hot enough to glow faintly red in the dark — hotter than Mercury, despite being nearly twice as far from the Sun. The pressure is that of a kilometre under Earth's ocean.",
    "It rotates backwards, so slowly that its day outlasts its year. The Soviet Venera landers that reached its surface survived, at best, two hours.",
  ] },
  Earth: { facts: [["Day", "23.9 hours"], ["Year", "365.25 days"], ["Surface", "71% ocean"], ["Atmosphere", "78% N₂ · 21% O₂"], ["Moons", "1"]], text: [
    "Two facts make this dot unlike every other place the Atlas can show you. Liquid water has flowed here, unbroken, for around four billion years. And for at least 3.7 billion of those, chemistry on this rock has been copying itself — lately, well enough to build instruments and wonder what it is looking at.",
    "The oxygen in this sky is not a given; it is the exhaust of two billion years of photosynthesis. Seen from orbit at night, the dark side glitters — the only world we know that lights itself.",
  ] },
  Moon: { facts: [["Distance", "384,400 km"], ["Day = orbit", "27.3 days"], ["Gravity", "0.165 g"], ["Visitors", "12 people"], ["Origin", "a planetary collision"]], text: [
    "The Moon is the frozen record of a catastrophe: four and a half billion years ago a Mars-sized world struck the young Earth, and the splash became this. The same face has watched us forever — its rotation locked to its orbit — and the craters on it are old enough to predate every fossil on Earth.",
    "Twelve human beings have stood on it. Their bootprints are still there, sharp as the day they were made; nothing on a world without wind ever fades.",
  ] },
  Mars: { facts: [["Day", "24.6 hours"], ["Year", "687 days"], ["Gravity", "0.38 g"], ["Tallest volcano", "21.9 km — Olympus Mons"], ["Moons", "2"]], text: [
    "Mars is a planet with a past. Dry riverbeds, deltas and lakebeds are written across its surface; three and a half billion years ago it had rain, seas, and a thicker sky. Then its core cooled, the magnetic field faltered, and the Sun stripped its atmosphere into space, leaving the cold red desert we know.",
    "It is still the most habitable world we know beyond our own — a day almost exactly Earth-length, polar ice, buried glaciers — and the only planet currently inhabited entirely by robots.",
  ] },
  Jupiter: { facts: [["Day", "9.9 hours"], ["Year", "11.9 years"], ["Mass", "2.5× all other planets"], ["Gravity", "2.5 g"], ["Moons", "95 known"]], text: [
    "Jupiter is the Solar System's other body of consequence: everything else, including Earth, is rounding error. A ball of hydrogen with no surface to land on, spinning so fast its day is under ten hours, wearing a storm — the Great Red Spot — that has been raging since before the telescope was pointed at it.",
    "Its gravity has shaped everything; it flings comets, herds asteroids, and may have shielded the inner worlds long enough for one of them to grow quiet and wet.",
  ] },
  Saturn: { facts: [["Day", "10.7 hours"], ["Year", "29.4 years"], ["Rings", "270,000 km wide, ~10 m thick"], ["Density", "less than water"], ["Moons", "146 known"]], text: [
    "The rings are the thing, and they are almost nothing: billions of shards of nearly pure water ice, a quarter of a million kilometres across yet mostly thinner than a house is tall. Proportionally, a sheet of paper the size of a football pitch is a thousand times too thick.",
    "They are young — perhaps younger than the dinosaurs — and they are temporary. Ring rain is falling into Saturn constantly; in another hundred million years or so, the Solar System's most beautiful structure may simply be gone. We are lucky to be here while it lasts.",
  ] },
  Uranus: { facts: [["Day", "17.2 hours"], ["Year", "84 years"], ["Axial tilt", "98° — it rolls"], ["Coldest recorded", "−224 °C"], ["Moons", "28 known"]], text: [
    "Something enormous once knocked Uranus over. The planet orbits on its side, poles where equators should be, so each pole takes a 42-year day followed by a 42-year night. It is the coldest planet — colder than more-distant Neptune — as if the blow that tipped it also let its ancient heat escape.",
    "It has been visited exactly once, by Voyager 2 in 1986, for a single afternoon.",
  ] },
  Neptune: { facts: [["Day", "16.1 hours"], ["Year", "165 years"], ["Winds", "2,100 km/h"], ["Distance", "30 AU"], ["Moons", "16 known"]], text: [
    "The outermost planet was found with mathematics before it was found with a telescope: Uranus kept straying from its predicted path, and in 1846 the missing mass was calculated, then seen within a degree of where the arithmetic said to look.",
    "It receives a thousandth of the sunlight Earth does, yet hosts the fastest winds in the Solar System — supersonic rivers of frozen methane in near-darkness. Since its discovery, it has completed one orbit.",
  ] },
  Pluto: { facts: [["Year", "248 years"], ["Day", "6.4 Earth days"], ["Surface", "−229 °C"], ["Moons", "5"], ["Reclassified", "2006"]], text: [
    "Pluto was supposed to be a dead ice ball; New Horizons found a world. A glacier of frozen nitrogen the size of Texas, mountains of water ice the height of the Rockies, a thin blue haze — and almost no craters on its young heart, meaning something still renews this surface, three decades of sunlight-hours from the Sun.",
    "Its demotion in 2006 changed nothing about it and everything about us: the Solar System turned out to be richer than nine tidy planets.",
  ] },
  Io: { facts: [["Orbit", "1.77 days"], ["Volcanoes", "400+ active"], ["Cause", "tidal kneading"]], text: [
    "Io is the most volcanically violent body known. Jupiter's gravity kneads it like dough on every 42-hour orbit, melting its interior; its plumes throw sulphur three hundred kilometres into space and repaint the surface faster than craters can form.",
  ] },
  Europa: { facts: [["Orbit", "3.55 days"], ["Crust", "ice, ~15–25 km"], ["Beneath", "a 60–150 km ocean"]], text: [
    "Under Europa's cracked shell of ice lies a salt-water ocean holding perhaps twice the water of all Earth's seas — kept liquid for four billion years by the same tidal flexing that torments Io. It is, by most reckonings, the most promising address for life beyond Earth.",
  ] },
  Ganymede: { facts: [["Orbit", "7.15 days"], ["Size", "larger than Mercury"], ["Field", "its own magnetosphere"]], text: [
    "The largest moon in the Solar System — bigger than the planet Mercury — and the only moon that generates its own magnetic field. It too hides an ocean, buried deeper than Europa's, sandwiched between layers of exotic ice.",
  ] },
  Callisto: { facts: [["Orbit", "16.7 days"], ["Surface", "the most cratered known"], ["Age", "~4 billion years untouched"]], text: [
    "Callisto is the Solar System's archive: a surface so old and unchanged that it remembers the era of heavy bombardment every other world has erased. Far enough from Jupiter's radiation to be quiet, it is a leading candidate for a future crewed base.",
  ] },
  Titan: { facts: [["Orbit", "15.9 days"], ["Atmosphere", "denser than Earth's"], ["Lakes", "liquid methane"]], text: [
    "Titan is the only moon with a thick atmosphere and the only world besides Earth with standing liquid on its surface — rivers, rain and seas of methane at −179 °C. Beneath the orange haze, a complete hydrological cycle runs on hydrocarbons instead of water. A drone named Dragonfly is on its way.",
  ] },
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

/** procedural surface maps for worlds without photographic textures —
 *  blobs and features painted on a 512×256 equirect canvas (drawn thrice,
 *  ±width, so the seam wraps cleanly). Believable at the scale moons are seen. */
function worldTexture(kind: string): THREE.Texture {
  const W = 512, H = 256;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const blob = (cx: number, cy: number, r: number, col: string, a: number) => {
    for (const ox of [-W, 0, W]) {
      const g = x.createRadialGradient(cx + ox, cy, 0, cx + ox, cy, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      x.globalAlpha = a; x.fillStyle = g;
      x.beginPath(); x.arc(cx + ox, cy, r, 0, 6.29); x.fill();
    }
    x.globalAlpha = 1;
  };
  const R = (n: number) => Math.random() * n;
  if (kind === "Io") {
    x.fillStyle = "#c9a23c"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) blob(R(W), R(H), 14 + R(46), ["#e0c068", "#a87830", "#d8d8a8", "#906028"][i % 4]!, 0.5);
    for (let i = 0; i < 26; i++) { const px = R(W), py = R(H); blob(px, py, 5 + R(9), "#3a2410", 0.9); blob(px, py, 12 + R(14), "#e85820", 0.28); }
  } else if (kind === "Europa") {
    x.fillStyle = "#d9d2c4"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) blob(R(W), R(H), 20 + R(60), ["#e8e2d6", "#c4b8a4"][i % 2]!, 0.4);
    x.strokeStyle = "rgba(150,84,52,.5)"; x.lineWidth = 1.3;
    for (let i = 0; i < 34; i++) {
      let px = R(W), py = R(H);
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 7; s++) { px += 18 + R(34); py += R(26) - 13; x.lineTo(px, py); }
      x.stroke();
    }
  } else if (kind === "Ganymede") {
    x.fillStyle = "#8a7d6c"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) blob(R(W), R(H), 18 + R(56), ["#a89a86", "#6a5e50", "#998b78"][i % 3]!, 0.5);
    for (let i = 0; i < 60; i++) { const px = R(W), py = R(H), r = 1.5 + R(3.5); blob(px, py, r, "#cfc4b2", 0.8); }
  } else if (kind === "Callisto") {
    x.fillStyle = "#564d42"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) blob(R(W), R(H), 14 + R(40), ["#6a6054", "#473e34"][i % 2]!, 0.5);
    for (let i = 0; i < 170; i++) { const px = R(W), py = R(H), r = 1 + R(3); blob(px, py, r, "#b8ac98", 0.75); }
  } else if (kind === "Titan") {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#b67f33"); g.addColorStop(0.5, "#cf9440"); g.addColorStop(1, "#a87328");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) blob(R(W), R(H), 30 + R(80), "#daa64e", 0.18);
  } else { // Pluto
    x.fillStyle = "#b59f86"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) blob(R(W), R(H), 16 + R(50), ["#8a6e52", "#cbb89e", "#6e503c"][i % 3]!, 0.5);
    blob(W * 0.62, H * 0.58, 56, "#efe6d4", 0.95);          // the heart — Sputnik Planitia
    blob(W * 0.7, H * 0.62, 40, "#f4ecdc", 0.9);
    for (let i = 0; i < 5; i++) blob(W * (0.15 + R(0.3)), H * (0.45 + R(0.2)), 22 + R(20), "#41281c", 0.55);   // the dark whale
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** the blue limb of an atmosphere — fresnel rim, additive */
const ATMO_VERT = `varying vec3 vN; varying vec3 vV;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const ATMO_FRAG = `varying vec3 vN; varying vec3 vV;
void main(){ float rim = pow(1.0 - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(0.42, 0.62, 1.0, 1.0) * rim * 1.15; }`;

export function mountAtlas(opts: Opts): () => void {
  const { canvas, labels, name, dist, line, more, sheet, time, date } = opts;
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
    const pb = addBody(pn, km, m, 0.00012);
    // the system RUNS: every planet recomputes its true position as sim time flows
    pb.update = (date) => {
      const q = planetPosition(pn, date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      pb.pos.x = kk.x; pb.pos.y = kk.y; pb.pos.z = kk.z;
    };
    pb.update(now, 0);
  }

  // the Moon — mean circular orbit (good to a few degrees)
  const earth = bodies.find(b => b.name === "Earth")!;
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADII["Moon"]!, 48, 24),
    new THREE.MeshPhongMaterial({ map: T("moon.jpg"), shininess: 2 }),
  );
  const moon = addBody("Moon", { x: 0, y: 0, z: 0 }, moonMesh, 0.00001);
  moon.labelMax = 2.5e7;
  moon.update = (_d, simDays) => {
    const ang = (218.316 + 13.176396 * simDays) * D2R;
    moon.pos.x = earth.pos.x + Math.cos(ang) * 384400;
    moon.pos.y = earth.pos.y;
    moon.pos.z = earth.pos.z - Math.sin(ang) * 384400;
  };

  // the great moons of Jupiter and Saturn — circular orbits, true radii/periods
  const jupiter = bodies.find(b => b.name === "Jupiter")!;
  const saturn = bodies.find(b => b.name === "Saturn")!;
  const MOONS: { n: string; parent: Body; orbR: number; perD: number; col: number; lblMax: number }[] = [
    { n: "Io",       parent: jupiter, orbR: 421700,  perD: 1.769,  col: 0xd8c060, lblMax: 8e7 },
    { n: "Europa",   parent: jupiter, orbR: 671034,  perD: 3.551,  col: 0xd8cdb8, lblMax: 8e7 },
    { n: "Ganymede", parent: jupiter, orbR: 1070412, perD: 7.155,  col: 0x9a8d7d, lblMax: 8e7 },
    { n: "Callisto", parent: jupiter, orbR: 1882709, perD: 16.689, col: 0x6f665c, lblMax: 8e7 },
    { n: "Titan",    parent: saturn,  orbR: 1221870, perD: 15.945, col: 0xd8a35a, lblMax: 8e7 },
  ];
  for (const mn of MOONS) {
    const mm = new THREE.Mesh(
      new THREE.SphereGeometry(RADII[mn.n]!, 48, 24),
      new THREE.MeshPhongMaterial({ map: worldTexture(mn.n), shininess: 3 }),
    );
    const mb = addBody(mn.n, { x: 0, y: 0, z: 0 }, mm, 0.00002);
    mb.labelMax = mn.lblMax;
    const phase = Math.random() * 6.2832;
    mb.update = (_d, simDays) => {
      const ang = phase + (simDays / mn.perD) * 6.2832;
      mb.pos.x = mn.parent.pos.x + Math.cos(ang) * mn.orbR;
      mb.pos.y = mn.parent.pos.y;
      mb.pos.z = mn.parent.pos.z - Math.sin(ang) * mn.orbR;
    };
    mb.update(now, 0);
  }

  // Pluto — the heart-bearing dwarf, on its true inclined orbit
  {
    const pm = new THREE.Mesh(
      new THREE.SphereGeometry(RADII["Pluto"]!, 48, 24),
      new THREE.MeshPhongMaterial({ map: worldTexture("Pluto"), shininess: 3 }),
    );
    const pb = addBody("Pluto", { x: 0, y: 0, z: 0 }, pm, 0.00002);
    pb.update = (date) => {
      const q = plutoPosition(date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      pb.pos.x = kk.x; pb.pos.y = kk.y; pb.pos.z = kk.z;
    };
    pb.update(now, 0);
  }

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
  {
    // Pluto's inclined, eccentric path — 248 years in one faint line
    const pts: THREE.Vector3[] = [];
    const N = 256;
    for (let i = 0; i <= N; i++) {
      const d = new Date(now.getTime() + (i / N) * 90560 * 86400000);
      const q = plutoPosition(d);
      const k = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
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
    // arrive on the DAY side: come in from the Sun's direction (offset a
    // little for three-quarter light), never into a black hemisphere
    const sl = Math.hypot(b.pos.x, b.pos.y, b.pos.z);
    if (sl > 1) {
      tgtYaw = Math.atan2(-b.pos.x, -b.pos.z) + 0.5;
      tgtPitch = Math.min(0.5, Math.max(-0.5, Math.asin(-b.pos.y / sl))) + 0.14;
      // unwind yaw so the eased camera takes the short way around
      while (tgtYaw - yaw > Math.PI) tgtYaw -= 2 * Math.PI;
      while (tgtYaw - yaw < -Math.PI) tgtYaw += 2 * Math.PI;
    }
    if (click) { try { playClick(); } catch (_e) { /* off */ } }
    name.textContent = b.name;
    line.textContent = b.line;
    name.classList.remove("in"); void name.offsetWidth; name.classList.add("in");
    if (sheet.classList.contains("open")) fillSheet(b);   // the open sheet follows the journey
  }

  const camKm = { x: 0, y: 0, z: 0 };          // doubles — the true camera position
  const v = new THREE.Vector3();

  /* ---------- simulated time: the system actually runs ---------- */
  let simMs = now.getTime();
  let speed = 1;                                // sim-seconds per real second
  let lastDateTxt = "";
  function bindTime() {
    time.querySelectorAll<HTMLButtonElement>("button").forEach(btn => {
      btn.addEventListener("click", () => {
        speed = Number(btn.dataset["speed"] ?? "1");
        time.querySelectorAll("button").forEach(o => o.classList.toggle("on", o === btn));
        try { playClick(); } catch (_e) { /* off */ }
      });
    });
  }
  bindTime();

  /* ---------- the jewel info sheet ---------- */
  const shName = sheet.querySelector<HTMLElement>(".at-sheet-name")!;
  const shFacts = sheet.querySelector<HTMLElement>(".at-sheet-facts")!;
  const shProse = sheet.querySelector<HTMLElement>(".at-sheet-prose")!;
  const shClose = sheet.querySelector<HTMLElement>(".at-sheet-close")!;
  function fillSheet(b: Body) {
    const inf = INFO[b.name];
    shName.textContent = b.name;
    shFacts.innerHTML = (inf?.facts ?? []).map(([k, val]) =>
      `<div class="at-fact"><span class="at-fact-k">${k}</span><span class="at-fact-v">${val}</span></div>`).join("");
    shProse.innerHTML = (inf?.text ?? [b.line]).map(p => `<p>${p}</p>`).join("");
  }
  more.addEventListener("click", () => {
    fillSheet(focus);
    sheet.classList.add("open");
    sheet.removeAttribute("hidden");
    try { playClick(); } catch (_e) { /* off */ }
  });
  shClose.addEventListener("click", () => { sheet.classList.remove("open"); });
  addEventListener("keydown", e => { if (e.key === "Escape") sheet.classList.remove("open"); });

  function frame(nowMs: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((nowMs - last) / 1000, 0.05); last = nowMs;

    // time flows — at whatever rate the visitor chose — and the worlds move
    simMs += dt * 1000 * speed;
    const simDate = new Date(simMs);
    const simDays = (simMs - Date.UTC(2000, 0, 1, 12)) / 86400000;
    for (const b of bodies) b.update?.(simDate, simDays);
    const dTxt = speed === 1 ? "now" : simDate.toUTCString().slice(5, 16);
    if (dTxt !== lastDateTxt) { date.textContent = dTxt; lastDateTxt = dTxt; }

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
        if (ang > 0.004 || (b.labelMax !== undefined && d > b.labelMax)) { mat.opacity = 0; }
        else {
          // a planet must OUTSHINE the background stars — never become a label
          // floating over nothing
          mat.opacity = Math.min(1, (0.004 - ang) / 0.0015);
          b.dot.scale.setScalar(Math.max(b.radius * 2.5, d * 0.0095));
        }
      }
    }
    orbitGroup.position.set(-camKm.x, -camKm.y, -camKm.z);
    // orbit lines belong to the SYSTEM view — near a world they'd streak the
    // sky, so they fade out below ~1M km and return as you pull away
    const t01 = Math.min(1, Math.max(0, (distKm - 8e5) / 7e6));
    orbitMat.opacity = 0.16 * t01 * t01 * (3 - 2 * t01);
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
    for (const b of bodies) {
      v.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      const d = v.length();
      v.project(camera);
      const behind = v.z > 1;
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      const tooClose = b === focus && d < b.radius * 24;
      const tooFar = b.labelMax !== undefined && d > b.labelMax && b !== focus;   // moons merge into their parent at range
      if (behind || tooClose || tooFar || sx < -40 || sx > w + 40 || sy < 70 || sy > h + 20) {
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
