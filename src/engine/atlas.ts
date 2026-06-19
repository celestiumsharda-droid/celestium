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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { planetPosition, PLANETS, kepler, rad, norm360, julianCenturies, type PlanetName } from "./ephemeris";
import EXO_SYSTEMS from "../data/exo";
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
  nav: HTMLElement;                  // the Navigate jewel button
  consoleEl: HTMLElement;            // the destination console
  conList: HTMLElement;              // its list body
  conSearch: HTMLInputElement;       // its search field
  conClose: HTMLElement;             // its close button
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
  labelMax?: number;                 // hide the LABEL beyond this camera distance
  drift?: boolean;                   // a drifting object — its dot stays visible past labelMax; only the name hides
  arriveK?: number;                  // fly-to framing distance = radius × this (default 5)
  arrivePitch?: number;              // override the arrival pitch (rings open above the plane)
  update?: (date: Date, simDays: number) => void;   // live orbital motion
  kind?: "star";                     // catalogue stars live by different label rules
  foreign?: boolean;                 // belongs to another star system (TRAPPIST, exoplanets) — gated by labelMax, not the "our planets retire" rule
  system?: string;                   // which system this body belongs to (for the drill-down navigator)
  dotK?: number;                     // apparent-size class of its point of light
  adhoc?: boolean;                   // the reusable "fly to any star" body — hidden from menus/search
}

/* ---- the stellar neighbourhood: real stars, real places ----
   Every system within ~13 light-years plus the famous beacons. RA (hours),
   Dec (degrees), distance (ly), photosphere colour, radius in suns, type. */
const LY = 9.4607e12;                // km
interface StarRow { n: string; ra: number; dec: number; ly: number; c: number; r: number; t: string; }
const STARS: StarRow[] = [
  { n: "Alpha Centauri", ra: 14.66, dec: -60.83, ly: 4.37, c: 0xfff3d8, r: 1.22, t: "sun-like double star" },
  { n: "Barnard's Star", ra: 17.963, dec: 4.69, ly: 5.96, c: 0xff7a50, r: 0.2, t: "red dwarf" },
  { n: "Wolf 359", ra: 10.94, dec: 7.01, ly: 7.86, c: 0xff5c3c, r: 0.16, t: "red dwarf" },
  { n: "Lalande 21185", ra: 11.06, dec: 35.97, ly: 8.31, c: 0xff8a5e, r: 0.39, t: "red dwarf" },
  { n: "Sirius", ra: 6.752, dec: -16.72, ly: 8.66, c: 0xcfe2ff, r: 1.71, t: "the brightest star in our sky" },
  { n: "Luyten 726-8", ra: 1.65, dec: -17.95, ly: 8.79, c: 0xff6448, r: 0.14, t: "red-dwarf pair" },
  { n: "Ross 154", ra: 18.83, dec: -23.84, ly: 9.71, c: 0xff7a52, r: 0.24, t: "red dwarf" },
  { n: "Ross 248", ra: 23.70, dec: 44.18, ly: 10.29, c: 0xff6448, r: 0.16, t: "red dwarf" },
  { n: "Epsilon Eridani", ra: 3.55, dec: -9.46, ly: 10.48, c: 0xffc890, r: 0.74, t: "young orange star with a dust ring" },
  { n: "Lacaille 9352", ra: 23.10, dec: -35.85, ly: 10.74, c: 0xff9468, r: 0.47, t: "red dwarf" },
  { n: "Ross 128", ra: 11.79, dec: 0.80, ly: 11.01, c: 0xff7a52, r: 0.21, t: "quiet red dwarf with a temperate world" },
  { n: "61 Cygni", ra: 21.115, dec: 38.75, ly: 11.40, c: 0xffb87e, r: 0.66, t: "orange double — first star ever measured" },
  { n: "Procyon", ra: 7.655, dec: 5.22, ly: 11.46, c: 0xf4f0e0, r: 2.05, t: "bright yellow-white star" },
  { n: "Epsilon Indi", ra: 22.06, dec: -56.78, ly: 11.87, c: 0xffb87e, r: 0.73, t: "orange star with brown-dwarf companions" },
  { n: "Tau Ceti", ra: 1.735, dec: -15.94, ly: 11.91, c: 0xffe9c0, r: 0.79, t: "the nearest single sun-like star" },
  { n: "Groombridge 34", ra: 0.31, dec: 44.02, ly: 11.62, c: 0xff8a5e, r: 0.38, t: "red-dwarf pair" },
  { n: "Luyten's Star", ra: 7.456, dec: 5.23, ly: 12.35, c: 0xff7a52, r: 0.29, t: "red dwarf with a temperate world" },
  { n: "Kapteyn's Star", ra: 5.195, dec: -44.95, ly: 12.83, c: 0xff8a5e, r: 0.29, t: "ancient halo star, orbiting backwards" },
  { n: "Gliese 581", ra: 15.32, dec: -7.72, ly: 20.5, c: 0xff7a52, r: 0.30, t: "red dwarf with a packed planet system" },
  { n: "TRAPPIST-1", ra: 23.108, dec: -5.04, ly: 40.66, c: 0xff5038, r: 0.121, t: "seven Earth-sized worlds" },
  { n: "Altair", ra: 19.846, dec: 8.87, ly: 16.7, c: 0xe8ecf8, r: 1.8, t: "fast-spinning white star" },
  { n: "Vega", ra: 18.615, dec: 38.78, ly: 25.0, c: 0xcfe0ff, r: 2.36, t: "the once and future pole star" },
  { n: "Pollux", ra: 7.755, dec: 28.03, ly: 33.8, c: 0xffcf96, r: 8.8, t: "orange giant with a planet" },
  { n: "Arcturus", ra: 14.26, dec: 19.18, ly: 36.7, c: 0xffc080, r: 25.4, t: "orange giant — the northern sky's brightest" },
  { n: "Capella", ra: 5.28, dec: 46.0, ly: 42.9, c: 0xffe2ac, r: 12, t: "a pair of yellow giants" },
  { n: "Castor", ra: 7.576, dec: 31.89, ly: 51, c: 0xd8e4fa, r: 2.4, t: "six stars in one point of light" },
  { n: "Aldebaran", ra: 4.598, dec: 16.51, ly: 65.3, c: 0xffb87e, r: 45.1, t: "the orange eye of the Bull" },
  { n: "Regulus", ra: 10.14, dec: 11.97, ly: 79.3, c: 0xc4d6ff, r: 4.35, t: "blue-white heart of the Lion" },
  { n: "Mizar", ra: 13.42, dec: 54.93, ly: 83, c: 0xd8e4fa, r: 2.4, t: "the double in the Plough's handle" },
  { n: "Achernar", ra: 1.628, dec: -57.24, ly: 139, c: 0xbcd2ff, r: 9.3, t: "the flattest star known — spun into an ellipsoid" },
  { n: "Spica", ra: 13.42, dec: -11.16, ly: 250, c: 0xb4c8ff, r: 7.5, t: "blue double star" },
  { n: "Bellatrix", ra: 5.418, dec: 6.35, ly: 250, c: 0xb8ccff, r: 5.75, t: "blue giant — Orion's shoulder" },
  { n: "Canopus", ra: 6.40, dec: -52.70, ly: 310, c: 0xf0f0e2, r: 71, t: "the second-brightest star in our sky" },
  { n: "Polaris", ra: 2.53, dec: 89.26, ly: 433, c: 0xf0ecd8, r: 37.5, t: "the North Star — a pulsing supergiant" },
  { n: "Betelgeuse", ra: 5.919, dec: 7.41, ly: 548, c: 0xff6038, r: 764, t: "red supergiant, due to explode" },
  { n: "Antares", ra: 16.49, dec: -26.43, ly: 554, c: 0xff5e3a, r: 680, t: "the rival of Mars — a dying red giant" },
  { n: "Rigel", ra: 5.242, dec: -8.20, ly: 863, c: 0xc8dcff, r: 79, t: "blue supergiant — Orion's foot" },
  { n: "Deneb", ra: 20.69, dec: 45.28, ly: 2615, c: 0xd4e2ff, r: 203, t: "one of the most luminous stars known" },
];
/** RA (hours), Dec (deg), distance (ly) → our ecliptic km frame */
function skyPos(raH: number, decD: number, ly: number): { x: number; y: number; z: number } {
  const ra = raH * 15 * D2R, dec = decD * D2R, eps = 23.439 * D2R;
  const xe = Math.cos(dec) * Math.cos(ra), ye = Math.cos(dec) * Math.sin(ra), ze = Math.sin(dec);
  const x = xe, y = ye * Math.cos(eps) + ze * Math.sin(eps), z = -ye * Math.sin(eps) + ze * Math.cos(eps);
  const d = ly * LY;
  return E2T({ x: x * d, y: y * d, z: z * d });
}
function starPos(s: StarRow): { x: number; y: number; z: number } { return skyPos(s.ra, s.dec, s.ly); }

/* ---- exoplanet prose helpers (data → readable catalogue text) ---- */
const cap = (s: string): string => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
interface ExoP { key: string; name: string; rE: number; au: number; per: number; kind: string; massE: number | null; tempK: number | null; }
interface ExoSys { star: string; ly: number; kindStar: string; }
function describeExo(p: ExoP, _sys: ExoSys): string {
  const yr = p.per > 700 ? `${(p.per / 365.25).toFixed(p.per > 3650 ? 0 : 1)} years` : `${p.per.toFixed(p.per < 10 ? 1 : 0)} days`;
  return `${p.au.toPrecision(2)} AU out · a year of ${yr}`;
}
function exoPlanetInfo(p: ExoP, sys: ExoSys, lyTxt: number): { facts: [string, string][]; text: string[] } {
  const facts: [string, string][] = [];
  if (p.rE) facts.push(["Radius", `${p.rE} Earth radii`]);
  if (p.massE) facts.push(["Mass", p.massE > 100 ? `${(p.massE / 317.8).toPrecision(2)} Jupiters` : `${p.massE.toPrecision(2)} Earths`]);
  facts.push(["Orbit", `${p.au.toPrecision(2)} AU`]);
  facts.push(["Year", p.per > 700 ? `${(p.per / 365.25).toFixed(1)} years` : `${p.per.toFixed(1)} days`]);
  if (p.tempK) facts.push(["Temperature", `${Math.round(p.tempK)} K`]);
  facts.push(["Class", cap(p.kind)]);
  const giant = /gas giant|hot jupiter/i.test(p.kind);
  const text = giant
    ? `${cap(p.kind)} orbiting ${sys.star}, ${lyTxt} light-years from Earth. It rounds its star every ${p.per > 700 ? `${(p.per / 365.25).toFixed(1)} years` : `${p.per.toFixed(1)} days`} at ${p.au.toPrecision(2)} AU — a world of gas and storm, never seen as more than a point of light or a dip in its star's brightness.`
    : `${cap(p.kind)} orbiting ${sys.star}, ${lyTxt} light-years away. At ${p.au.toPrecision(2)} AU its year lasts ${p.per > 700 ? `${(p.per / 365.25).toFixed(1)} years` : `${p.per.toFixed(1)} days`}. No telescope has resolved its surface — what you see is a scientific portrait, painted from its size, temperature and the light of its sun.`;
  return { facts, text: [text] };
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
  "Halley's Comet": "Once every 76 years — the comet that keeps its appointments. Next: 2061.",
  "Hale–Bopp": "The great comet of 1997, climbing away on a 2,500-year ellipse.",
  "Voyager 1": "The farthest human-made object — and still calling home.",
  "Voyager 2": "The only machine ever to visit Uranus and Neptune.",
  "New Horizons": "The mission that turned Pluto into a world.",
  JWST: "A gold mirror at L2, reading the light of the first galaxies.",
  Hubble: "Thirty-five years of the sharpest eyes humanity has owned.",
  Io: "Jupiter's tortured moon — the most volcanic body we know.",
  Europa: "An ocean world in an ice shell; the best place to look for neighbours.",
  Ganymede: "The largest moon in the Solar System — bigger than Mercury.",
  Callisto: "An ancient, crater-saturated archive of the early Solar System.",
  Titan: "Saturn's giant moon, with rain, rivers and seas — of methane.",
  Enceladus: "A tiny ice moon firing geysers of seawater into space.",
  Tethys: "An icy Saturnian moon split by a vast canyon, Ithaca Chasma.",
  Dione: "Wispy ice cliffs streak the trailing face of this Saturnian moon.",
  Rhea: "Saturn's second-largest moon — a heavily cratered ball of ice.",
  Iapetus: "The two-faced moon: one hemisphere snow-white, the other pitch-black.",
  Triton: "Neptune's captured moon, orbiting backwards over nitrogen geysers.",
  Charon: "Pluto's partner, half its width — a true double world.",
  Vesta: "The second-largest asteroid — a battered protoplanet in the belt.",
};

const RADII: Record<string, number> = {
  Sun: 696340, Mercury: 2439.7, Venus: 6051.8, Earth: 6371, Moon: 1737.4,
  Mars: 3389.5, Jupiter: 69911, Saturn: 58232, Uranus: 25362, Neptune: 24622,
  Io: 1821.6, Europa: 1560.8, Ganymede: 2634.1, Callisto: 2410.3, Titan: 2574.7, Pluto: 1188.3,
  Charon: 606, Enceladus: 252.1, Tethys: 531.1, Dione: 561.4, Rhea: 763.8, Iapetus: 734.5, Triton: 1353.4, Vesta: 262.7,
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
  Enceladus: { facts: [["Radius", "252 km"], ["Orbit", "1.37 days"], ["South pole", "erupting geysers"], ["Beneath", "a global ocean"]], text: [
    "This brilliant white snowball — only 500 km across — is one of the Solar System's best bets for life. From cracks at its south pole, the 'tiger stripes', it fires towering geysers of salty water vapour straight into space, feeding one of Saturn's rings. The water comes from a global ocean beneath the ice, laced with the organic molecules and energy that life would need.",
  ] },
  Tethys: { facts: [["Radius", "531 km"], ["Orbit", "1.89 days"], ["Made of", "almost pure ice"], ["Feature", "Ithaca Chasma"]], text: [
    "A ball of nearly pure water ice, so light it would float. A colossal canyon, Ithaca Chasma, runs three-quarters of the way around it, and the giant crater Odysseus spans two-fifths of its width — a near-fatal blow that left it cracked but whole.",
  ] },
  Dione: { facts: [["Radius", "561 km"], ["Orbit", "2.74 days"], ["Trailing side", "bright ice cliffs"]], text: [
    "Dione's trailing hemisphere is laced with bright wispy streaks — once thought to be frost, now known to be a network of towering ice cliffs, fractures hundreds of metres high. A faint wisp of oxygen clings to it, and it too may hide liquid water below.",
  ] },
  Rhea: { facts: [["Radius", "764 km"], ["Orbit", "4.52 days"], ["Saturn's", "2nd-largest moon"], ["Possible", "a tenuous ring"]], text: [
    "Saturn's second-largest moon is a frozen, heavily cratered world three-quarters ice, one-quarter rock. It may be the only moon in the Solar System with its own faint ring of debris — and its thin oxygen-and-carbon-dioxide atmosphere is generated as Saturn's radiation splits the surface ice.",
  ] },
  Iapetus: { facts: [["Radius", "735 km"], ["Orbit", "79.3 days"], ["One side", "snow-white"], ["Other side", "darker than coal"]], text: [
    "Iapetus is the strangest of Saturn's moons: one hemisphere is bright as snow, the other black as tar — it sweeps up dark dust as it orbits, which warms and drives off the ice beneath. A bizarre ridge of mountains, ten kilometres high, runs exactly along its equator, as if the moon were a walnut.",
  ] },
  Triton: { facts: [["Radius", "1,353 km"], ["Orbit", "5.9 days, backwards"], ["Surface", "−235 °C — the coldest"], ["Geysers", "nitrogen, active"]], text: [
    "Triton orbits Neptune backwards — the only large moon to do so — which means it didn't form there: it was captured, a Kuiper Belt world like Pluto, dragged in and slowly spiralling to its doom. Its surface, the coldest measured in the Solar System, erupts with geysers of nitrogen, and its strange cantaloupe terrain suggests an interior that still churns.",
  ] },
  Vesta: { facts: [["Radius", "263 km"], ["Orbit", "2.36 AU · in the belt"], ["Mass", "9% of the belt"], ["Visited", "Dawn, 2011"]], text: [
    "Vesta is a protoplanet that never finished — a world frozen mid-formation, with a layered iron core, mantle and crust like the rocky planets. A giant impact near its south pole tore out a crater almost as wide as Vesta itself and flung debris across the Solar System; about one in twenty meteorites that fall to Earth are chips of Vesta.",
  ] },
  "Proxima Centauri": { facts: [["Distance", "4.25 light-years"], ["Type", "red dwarf"], ["Planets", "at least 2"], ["Lifespan", "trillions of years"]], text: [
    "The nearest star to the Sun is one you will never see with your eyes — a dim red ember a seventh the size of our star. Yet it holds a planet, Proxima b, in its temperate zone: the closest possibly-habitable world that will ever exist for us, four and a quarter light-years away.",
    "Our fastest spacecraft would take seventy thousand years to reach it. Red dwarfs like Proxima will still be burning, unchanged, when every sun-like star in the universe has died.",
  ] },
  "Alpha Centauri": { facts: [["Distance", "4.37 light-years"], ["Stars", "two sun-like, + Proxima"], ["Discovered double", "1689"]], text: [
    "The nearest sun-like stars: a pair much like our own, circling each other every eighty years, with little Proxima drifting far around them both. From a planet there, our Sun would be a bright star in Cassiopeia — and someone looking back would see our sky's brightest constellation missing one star: theirs.",
  ] },
  Sirius: { facts: [["Distance", "8.66 light-years"], ["Brightness", "−1.46 — the brightest"], ["Companion", "a white dwarf"]], text: [
    "The brightest star in Earth's night sky has a secret: a dead star circles it. Sirius B was once the heavier of the pair; it burned out first, collapsed to the size of the Earth with the mass of a Sun, and now a teaspoon of it would weigh tonnes. The Dog Star's brilliance marked the flooding of the Nile and the 'dog days' of summer.",
  ] },
  Betelgeuse: { facts: [["Distance", "~550 light-years"], ["Size", "~764 Suns wide"], ["Fate", "supernova, 'soon'"]], text: [
    "Put Betelgeuse where the Sun is and it would swallow Mercury, Venus, Earth, Mars and most of Jupiter's orbit. It is a star at the end of its life — fusing heavier and heavier elements in shells, swelling and dimming erratically — and within the next hundred thousand years it will detonate as a supernova bright enough to read by at night.",
    "When it goes, it will outshine the full Moon for weeks. Astronomers are, frankly, hoping.",
  ] },
  Vega: { facts: [["Distance", "25 light-years"], ["Type", "white A-class"], ["Pole star", "in 12,000 years — again"]], text: [
    "Vega was the first star ever photographed and the standard against which stellar brightness was long measured. Earth's axis slowly traces a 26,000-year circle, and Vega sits on it: it was the pole star when mammoths walked, and it will be again around the year 13,700.",
  ] },
  Polaris: { facts: [["Distance", "433 light-years"], ["Type", "pulsing supergiant"], ["Holds the pole", "for now"]], text: [
    "The North Star is not the brightest in the sky — it is simply the one that happens to stand above Earth's axis in this era. It is a Cepheid, a supergiant that swells and brightens on a four-day heartbeat; the same kind of star Henrietta Leavitt used to give humanity its first ruler for measuring the universe.",
  ] },
  "TRAPPIST-1": { facts: [["Distance", "40.7 light-years"], ["Star", "barely bigger than Jupiter"], ["Planets", "seven, Earth-sized"]], text: [
    "Around a star scarcely larger than Jupiter circle seven worlds the size of our own, three of them in the temperate zone — the densest system of Earth-sized planets known. The whole architecture would fit inside Mercury's orbit; from any one of those worlds, the others hang in the sky like moons.",
  ] },
  Deneb: { facts: [["Distance", "~2,600 light-years"], ["Luminosity", "~200,000 Suns"], ["Size", "~200 Suns wide"]], text: [
    "The farthest thing your naked eye can easily see as a single star. Deneb burns with the light of two hundred thousand Suns — the light leaving it tonight left around the time of Homer. That it still ranks among our brightest stars, across such a gulf, is the measure of what a supergiant is.",
  ] },
  "Barnard's Star": { facts: [["Distance", "5.96 light-years"], ["Motion", "fastest in our sky"], ["Age", "~10 billion years"]], text: [
    "The fastest-moving star in Earth's sky — old, quiet, and rushing toward us. In about 11,800 years it will pass within 3.8 light-years and briefly become the closest star. It has been the favourite target of interstellar-travel dreamers for a century.",
  ] },
};

function fmtDist(km: number): string {
  if (km < 1e6) return `${Math.round(km).toLocaleString()} km`;
  if (km < 0.1 * AU) return `${(km / 1e6).toPrecision(3)} million km`;
  if (km < 60 * AU) return `${(km / AU).toPrecision(3)} AU`;
  const ly = km / 9.4607e12;
  return ly >= 1000 ? `${Math.round(ly).toLocaleString()} light-years` : `${ly.toPrecision(3)} light-years`;
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

/** the blue limb of an atmosphere — fresnel rim, additive.
 *  ALL custom shaders here must carry the log-depth chunks: the renderer
 *  runs a logarithmic depth buffer, and a shader that skips them writes
 *  garbage depth — surfaces z-fight the sky and look transparent. */
const ATMO_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN; varying vec3 vV;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
const ATMO_FRAG = `#include <common>
#include <logdepthbuf_pars_fragment>
varying vec3 vN; varying vec3 vV;
void main(){
#include <logdepthbuf_fragment>
float rim = pow(1.0 - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(0.42, 0.62, 1.0, 1.0) * rim * 1.15; }`;

/* ---- THE LIVING EARTH ---- a Google-Earth-grade day/night globe:
   sunlit day texture, city lights glowing on the dark side, a sun-glint
   that skips across the oceans, and a soft dawn-tinted terminator. */
const EARTH_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP;
void main(){ vUv = uv; vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz;
  vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
const EARTH_FRAG = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D dayMap; uniform sampler2D nightMap; uniform vec3 sunDir;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP;
void main(){
#include <logdepthbuf_fragment>
  vec3 N = normalize(vWN);
  float lam = dot(N, sunDir);                       // -1 night .. 1 noon
  float day = smoothstep(-0.12, 0.22, lam);         // soft terminator
  vec3 dayCol = texture2D(dayMap, vUv).rgb;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float ocean = smoothstep(0.015, 0.10, dayCol.b - dayCol.r * 0.9);   // blue → water
  vec3 V = normalize(cameraPosition - vWP);
  vec3 H = normalize(sunDir + V);
  float spec = pow(max(dot(N, H), 0.0), 80.0) * ocean * smoothstep(0.0, 0.2, lam);
  vec3 lit = dayCol * (0.05 + 1.05 * max(lam, 0.0));
  vec3 col = mix(night * 1.6, lit, day);            // city lights on the night side
  col += vec3(1.0, 0.95, 0.82) * spec * 1.7;        // the ocean sun-glint
  col += vec3(0.9, 0.5, 0.3) * smoothstep(0.06, -0.06, lam) * smoothstep(-0.3, 0.0, lam) * 0.18;  // dawn band
  gl_FragColor = vec4(col, 1.0);
}`;

/* ---- THE LIVING STAR ----
   A star's photosphere is weather: convection granulation that churns,
   bright active regions drifting, darkening toward the limb — and at the
   limb itself, prominences licking into space. Two passes: the boiling
   surface, and an additive flare shell that only lives at the edge. */
const STAR_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vN = normalize(normalMatrix * normal); vP = normalize(position); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
const STAR_NOISE = `
float h31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vno(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p){ float v=0.0,a=0.55; for(int i=0;i<4;i++){ v+=a*vno(p); p=p*2.04+vec3(3.7,1.3,7.1); a*=0.5; } return v; }`;
const STAR_FRAG = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCol; uniform vec3 uHot; uniform float uTime; uniform float uScale;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
${STAR_NOISE}
void main(){
#include <logdepthbuf_fragment>
  vec3 p = vP;
  // convection: two scales of churn, drifting against each other
  float g1 = fbm3(p*uScale        + vec3( uTime*0.020, -uTime*0.013,  uTime*0.016));
  float g2 = fbm3(p*uScale*2.7    + vec3(-uTime*0.031,  uTime*0.024, -uTime*0.018));
  float gran = g1*0.62 + g2*0.38;
  vec3 col = mix(uCol*0.5, uHot, smoothstep(0.3, 0.78, gran));
  // bright active regions, slowly wandering
  float plage = smoothstep(0.6, 0.8, fbm3(p*uScale*0.55 + vec3(0.0, uTime*0.008, uTime*0.005)));
  col += uHot * plage * 0.55;
  // darker star-spots
  float spot = smoothstep(0.7, 0.86, fbm3(p*uScale*0.4 - vec3(uTime*0.004)));
  col *= 1.0 - spot*0.5;
  // limb darkening — the real signature of a stellar disk
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  col *= 0.5 + 0.5*pow(mu, 0.58);
  gl_FragColor = vec4(col * 1.25, 1.0);
}`;
const FLARE_FRAG = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCol; uniform vec3 uHot; uniform float uTime; uniform float uScale;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
${STAR_NOISE}
void main(){
#include <logdepthbuf_fragment>
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float rim = pow(1.0 - mu, 2.2);
  // prominences: tongues of plasma that rise, lean and collapse at the limb
  float f1 = fbm3(vP*uScale*1.6 + vec3(uTime*0.05, uTime*0.03, -uTime*0.04));
  float f2 = fbm3(vP*uScale*4.0 - vec3(uTime*0.08, 0.0, uTime*0.06));
  float tongue = smoothstep(0.48, 0.85, f1*0.65 + f2*0.35);
  float a = rim * tongue * 1.6;
  gl_FragColor = vec4(mix(uCol, uHot, tongue) * 1.4, a);
}`;
const starMats: THREE.ShaderMaterial[] = [];
function livingStar(radiusKm: number, color: number, granScale: number, seg = 64): THREE.Group {
  const base = new THREE.Color(color);
  const hot = base.clone().lerp(new THREE.Color(0xffffff), 0.6);
  const uniforms = () => ({ uCol: { value: base.clone() }, uHot: { value: hot.clone() }, uTime: { value: 0 }, uScale: { value: granScale } });
  const surf = new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: uniforms() });
  const flare = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: FLARE_FRAG, uniforms: uniforms(),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  starMats.push(surf, flare);
  const g = new THREE.Group();
  const surfMesh = new THREE.Mesh(new THREE.SphereGeometry(radiusKm, seg, seg / 2), surf);
  const flareMesh = new THREE.Mesh(new THREE.SphereGeometry(radiusKm * 1.045, seg, seg / 2), flare);
  g.add(surfMesh); g.add(flareMesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  halo.scale.setScalar(radiusKm * 7);
  halo.frustumCulled = false;     // a big sprite must not vanish when its centre leaves the screen
  g.add(halo);
  // the halo belongs to the DISTANT star — close up it would fog the living
  // surface, so the frame loop fades it with proximity via userData.
  // LOD: the costly fbm surface shaders only render when the star is near
  // enough to read as a disk — sub-pixel stars show only their halo + dot.
  g.userData["halo"] = halo;
  g.userData["starR"] = radiusKm;
  g.userData["lod"] = [surfMesh, flareMesh];
  g.userData["lodMats"] = [surf, flare];
  return g;
}

export function mountAtlas(opts: Opts): () => void {
  const { canvas, labels, name, dist, line, more, sheet, time, date, nav, consoleEl, conList, conSearch, conClose } = opts;
  const small = matchMedia("(max-width: 760px)").matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false,
      logarithmicDepthBuffer: true, powerPreference: "high-performance",
    });
  } catch (_e) { return () => {}; }
  // a fixed, sensible pixel ratio — no per-frame resizing (that was the jitter).
  // The star LOD keeps the scene light enough that this stays smooth.
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.6));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 2e19);
  scene.add(new THREE.AmbientLight(0x223044, 0.55));
  const sunLight = new THREE.PointLight(0xfff2dc, 2.6, 0, 0);
  scene.add(sunLight);

  // Textures decode OFF the main thread via createImageBitmap, so a heavy map
  // streaming in mid-flight can never freeze a frame — the synchronous JPEG
  // decode was the cause of the big stutters. The bitmap is pre-flipped (WebGL
  // ignores flipY on ImageBitmap) and non-premultiplied to match the renderer.
  // The texture pops in when ready, exactly as before, just without the stall.
  const texLoader = new THREE.TextureLoader();
  const T = (f: string): THREE.Texture => {
    const t = new THREE.Texture();
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.flipY = false;
    if (typeof createImageBitmap === "function") {
      fetch(`/textures/${f}`)
        .then(r => r.ok ? r.blob() : Promise.reject(r.status))
        .then(b => createImageBitmap(b, { imageOrientation: "flipY", premultiplyAlpha: "none" }))
        .then(bm => { t.image = bm; t.needsUpdate = true; })
        .catch(() => { /* a missing texture simply stays blank */ });
      return t;
    }
    // ancient fallback: the classic main-thread loader
    const tl = texLoader.load(`/textures/${f}`); tl.colorSpace = THREE.SRGBColorSpace; tl.anisotropy = 4; return tl;
  };

  /* ---------- the engine core ----------
     Two registries make the Atlas extensible: `bodies` (everything the
     camera can fly to) and `frameHooks` (each subsystem's per-frame update).
     A new world, system, galaxy or effect registers its own hook at its
     creation site and never touches the render loop — so the engine scales
     by ADDING declarations, not by editing shared code. */
  const now = new Date();
  const bodies: Body[] = [];
  const segMain = small ? 48 : 96;

  interface FrameCtx {
    dt: number; nowMs: number; simDays: number; simDate: Date;
    camKm: { x: number; y: number; z: number };   // true camera position (km, doubles)
    distKm: number;                                 // distance to the focus
    focus: Body;
  }
  const frameHooks: ((c: FrameCtx) => void)[] = [];
  /** Register a per-frame update. Called once per rendered frame, after every
   *  body has been positioned in the floating-origin frame and before labels
   *  are projected. The one extension point the whole Atlas is built on. */
  const onFrame = (fn: (c: FrameCtx) => void): void => { frameHooks.push(fn); };

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

  /* ---------- defineWorld: the one-call factory for textured worlds ----------
     A planet, moon or exoplanet is now a single declaration — a PBR sphere
     (albedo + optional normal map), an optional circular orbit (around a
     centre that may itself move), an optional orbit ring, plus all the
     catalogue metadata. This is how new worlds get added: data in, body out,
     no other code touched. */
  type Vec3 = { x: number; y: number; z: number };
  interface WorldDef {
    name: string; radiusKm: number; map: string; normal?: string;
    roughMap?: string; specMap?: string; clouds?: string; cloudOpacity?: number;
    segments?: number; tiltDeg?: number; spin?: number; roughness?: number;
    orbit?: { center: () => Vec3; radiusKm: number; periodDays: number; phase?: number; incDeg?: number; ringGroup?: THREE.Group; ringMat?: THREE.Material };
    fixedPos?: Vec3;
    labelMax?: number; arriveK?: number; arrivePitch?: number; minDk?: number;
    dotK?: number; dotColor?: number; line?: string; foreign?: boolean; system?: string;
    info?: { facts: [string, string][]; text: string[] };
  }
  function defineWorld(def: WorldDef): Body {
    const seg = def.segments ?? segMain;
    const mat = new THREE.MeshStandardMaterial({ map: T(def.map), roughness: def.roughness ?? 0.92, metalness: 0 });
    if (def.normal) { const nm = T(def.normal); nm.colorSpace = THREE.NoColorSpace; mat.normalMap = nm; mat.normalScale = new THREE.Vector2(1.1, 1.1); }
    // PBR surface detail from the full texture pack: a roughness map (smooth on
    // ice/water → a wet glint under the star) and a faint specular→metalness
    // map (capped low so water sheens but land stays dielectric).
    if (def.roughMap) { const rm = T(def.roughMap); rm.colorSpace = THREE.NoColorSpace; mat.roughnessMap = rm; mat.roughness = 1; }
    if (def.specMap)  { const sm = T(def.specMap);  sm.colorSpace = THREE.NoColorSpace; mat.metalnessMap = sm; mat.metalness = 0.2; }
    const m = new THREE.Mesh(new THREE.SphereGeometry(def.radiusKm, seg, Math.max(8, seg / 2)), mat);
    if (def.tiltDeg) m.rotation.z = def.tiltDeg * D2R;
    // a thin drifting cloud shell (the loop at the bottom rotates userData.clouds)
    if (def.clouds) {
      const cm = new THREE.Mesh(
        new THREE.SphereGeometry(def.radiusKm * 1.018, seg, Math.max(8, seg / 2)),
        new THREE.MeshPhongMaterial({ map: T(def.clouds), transparent: true, opacity: def.cloudOpacity ?? 0.9, depthWrite: false }),
      );
      m.add(cm);
      (m as THREE.Mesh & { userData: { clouds?: THREE.Mesh } }).userData["clouds"] = cm;
    }
    const b = addBody(def.name, def.fixedPos ?? { x: 0, y: 0, z: 0 }, m, def.spin ?? 0.00018);
    b.radius = def.radiusKm;
    b.minD = def.radiusKm * (def.minDk ?? 1.4);
    if (def.labelMax !== undefined) b.labelMax = def.labelMax;
    if (def.arriveK !== undefined) b.arriveK = def.arriveK;
    if (def.arrivePitch !== undefined) b.arrivePitch = def.arrivePitch;
    if (def.dotK !== undefined) b.dotK = def.dotK;
    if (def.line) b.line = def.line;
    if (def.dotColor !== undefined && b.dot) (b.dot.material as THREE.SpriteMaterial).color.set(def.dotColor);
    if (def.foreign) b.foreign = true;
    if (def.system) b.system = def.system;
    if (def.info) INFO[def.name] = def.info;
    if (def.orbit) {
      const o = def.orbit, phase = o.phase ?? Math.random() * 6.2832;
      if (o.ringGroup && o.ringMat) {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 128; i++) { const a = (i / 128) * 6.2832; pts.push(new THREE.Vector3(Math.cos(a) * o.radiusKm, 0, -Math.sin(a) * o.radiusKm)); }
        o.ringGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), o.ringMat));
      }
      const inc = (o.incDeg ?? 0) * D2R;
      b.update = (_d, simDays) => {
        const c = o.center(), ang = phase + (simDays / o.periodDays) * 6.2832;
        const ox = Math.cos(ang) * o.radiusKm, oz = -Math.sin(ang) * o.radiusKm;
        b.pos.x = c.x + ox; b.pos.y = c.y - oz * Math.sin(inc); b.pos.z = c.z + oz * Math.cos(inc);
      };
      b.update(now, 0);
    }
    return b;
  }

  // the Sun — a LIVING photosphere: churning granulation, drifting active
  // regions, prominences at the limb — plus the beacon glow that scales
  // with distance so it never fades to a dim dot
  const sunMesh = livingStar(RADII["Sun"]!, 0xffc06a, 26, 80);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(RADII["Sun"]! * 6.5);
  glow.frustumCulled = false;
  sunMesh.add(glow);
  addBody("Sun", { x: 0, y: 0, z: 0 }, sunMesh, 0.00002);

  // planets — real heliocentric positions, textured, lit by the Sun
  const PLANET_TEX: Record<string, string> = {
    Mercury: "mercury.jpg", Venus: "venus.jpg", Earth: "earth_day.jpg", Mars: "mars.jpg",
    Jupiter: "jupiter.jpg", Saturn: "saturn.jpg", Uranus: "uranus.jpg", Neptune: "neptune.jpg",
  };
  // Photoreal normal maps (from Grok Imagine) for depth on key bodies
  const PLANET_NORMALS: Record<string, string> = {}; // Earth and Mars reverted to original per request; other enhancements untouched
  const TILT: Record<string, number> = { Mercury: 0.03, Venus: 177.4, Earth: 23.4, Mars: 25.2, Jupiter: 3.1, Saturn: 26.7, Uranus: 97.8, Neptune: 28.3 };
  let earthMat: THREE.ShaderMaterial | null = null;
  let earthBody: Body | null = null;
  for (const pn of Object.keys(PLANETS) as PlanetName[]) {
    const p = planetPosition(pn, now);
    const km = E2T({ x: p.x * AU, y: p.y * AU, z: p.z * AU });
    const mat: THREE.Material = pn === "Earth"
      ? (earthMat = new THREE.ShaderMaterial({
          vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG,
          uniforms: {
            dayMap: { value: T("earth_day.jpg") },
            nightMap: { value: T("earth_night.jpg") },
            sunDir: { value: new THREE.Vector3(1, 0, 0) },
          },
        }))
      : new THREE.MeshStandardMaterial({
          map: T(PLANET_TEX[pn]!),
          roughness: (pn === "Jupiter" || pn === "Saturn") ? 0.75 : 0.95,
          metalness: 0,
        });
    const nrmFile = PLANET_NORMALS[pn];
    if (nrmFile && mat instanceof THREE.MeshStandardMaterial) {
      const nm = T(nrmFile); // reuse loader (it sets SRGB but we'll override below)
      nm.colorSpace = THREE.NoColorSpace;
      nm.flipY = true;
      mat.normalMap = nm;
      mat.normalScale = new THREE.Vector2(1.12, 1.12);
    }
    const pseg = pn === "Earth" ? 128 : segMain;       // Earth gets the finest sphere
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(RADII[pn]!, pseg, pseg / 2),
      mat,
    );
    // axial tilt + spin are applied together as a quaternion in update() so the
    // pole stays FIXED in space (a plain rotation.z + rotation.y would cone)
    if (pn === "Earth") {
      // a living Earth: drifting cloud shell + the blue limb of an atmosphere (reverted Earth core to original behavior)
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
      // the ORIGINAL gorgeous Cassini ring photo (saturn_ring.png) — but
      // rendered in the OPAQUE pass with alphaTest, not the crowded transparent
      // pass where the huge galaxy/panorama meshes were swallowing it. alphaTest
      // carves the gaps (Cassini division) from the texture's real alpha.
      const ringTex = T("saturn_ring.png");
      ringTex.anisotropy = 8;
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        map: ringTex, side: THREE.DoubleSide, transparent: false, alphaTest: 0.28,
      }));
      ring.rotation.x = Math.PI / 2;
      ring.frustumCulled = false;
      m.add(ring);
    }
    // true sidereal rotation periods (hours); negative = retrograde
    // (Venus and Uranus spin backwards). Rotation now tracks SIM TIME at the
    // real rate — a planet turns once per its true day and freezes when paused.
    const ROT_H: Record<string, number> = {
      Mercury: 1407.6, Venus: -5832.5, Earth: 23.934, Mars: 24.623,
      Jupiter: 9.925, Saturn: 10.656, Uranus: -17.24, Neptune: 16.11,
    };
    const rotH = ROT_H[pn]!;
    const pb = addBody(pn, km, m, 0);   // rotation handled in update, not the generic spin
    if (pn === "Earth") earthBody = pb;
    if (pn === "Saturn") { pb.arriveK = 8; pb.arrivePitch = 0.62; }   // frame the rings, looking down on them
    // a planet spins about its OWN tilted axis, fixed in space (never the world
    // vertical — that would cone the pole). Earth is special-cased to genuine
    // real time: its geography is pinned to Greenwich sidereal time, so the right
    // meridian faces the Sun at the actual current instant — true day and night.
    const tiltRad = (TILT[pn] ?? 0) * D2R;
    const localY = new THREE.Vector3(0, 1, 0);
    const qTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltRad);
    const spinAxis = localY.clone().applyQuaternion(qTilt);            // this planet's pole, in world
    const qSpin = new THREE.Quaternion();
    // Earth's orientation is built rigorously from astronomy — no fudge factor.
    // Body frame → equatorial frame with Greenwich at the true Greenwich Mean
    // Sidereal Time → ecliptic (obliquity) → our world frame. So the sub-solar
    // point — hence day and night — is exactly right for the actual instant,
    // everywhere on Earth (verified across solstices, equinoxes and longitudes).
    const EPS = 23.4393 * D2R, cE = Math.cos(EPS), sE = Math.sin(EPS);
    const eclToWorld = new THREE.Matrix4().multiplyMatrices(
      new THREE.Matrix4().set(1, 0, 0, 0,  0, 0, 1, 0,  0, -1, 0, 0,  0, 0, 0, 1),     // ecliptic → world (E2T)
      new THREE.Matrix4().set(1, 0, 0, 0,  0, cE, sE, 0,  0, -sE, cE, 0,  0, 0, 0, 1));  // equatorial → ecliptic
    const mEq = new THREE.Matrix4(), full = new THREE.Matrix4();
    pb.update = (date, simDays) => {
      const q = planetPosition(pn, date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      pb.pos.x = kk.x; pb.pos.y = kk.y; pb.pos.z = kk.z;
      if (pn === "Earth") {
        const jd = date.getTime() / 86400000 + 2440587.5;
        const gmst = ((((280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360) + 360) % 360) * D2R;
        const cg = Math.cos(gmst), sg = Math.sin(gmst);
        mEq.set(cg, 0, sg, 0,  sg, 0, -cg, 0,  0, 1, 0, 0,  0, 0, 0, 1);   // body → equatorial at GMST
        full.multiplyMatrices(eclToWorld, mEq);
        m.quaternion.setFromRotationMatrix(full);
      } else {
        qSpin.setFromAxisAngle(spinAxis, (simDays * 24 / rotH) * 2 * Math.PI);
        m.quaternion.copy(qSpin).multiply(qTilt);
      }
    };
    pb.update(now, 0);
  }

  // the Moon — real 4K lunar albedo (8K source from the Solar System Scope
  // CC-BY set) with a luminance-derived bump for crater relief; mean circular
  // orbit, inclined 5.1° to the ecliptic and tidally locked
  const earth = bodies.find(b => b.name === "Earth")!;
  const moonBump = T("moon_bump.jpg"); moonBump.colorSpace = THREE.NoColorSpace;
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADII["Moon"]!, 128, 80),
    new THREE.MeshStandardMaterial({ map: T("moon_4k.jpg"), bumpMap: moonBump, bumpScale: 12, roughness: 1, metalness: 0 }),
  );
  const moon = addBody("Moon", { x: 0, y: 0, z: 0 }, moonMesh, 0);   // tidally locked: no free spin
  moon.labelMax = 2.5e7;
  const MOON_INC = 5.14 * D2R;                  // the Moon's real orbital tilt to the ecliptic
  moon.update = (_d, simDays) => {
    const ang = (218.316 + 13.176396 * simDays) * D2R;
    const ox = Math.cos(ang) * 384400, oz = -Math.sin(ang) * 384400;
    moon.pos.x = earth.pos.x + ox;
    moon.pos.y = earth.pos.y - oz * Math.sin(MOON_INC);   // bob above/below the ecliptic
    moon.pos.z = earth.pos.z + oz * Math.cos(MOON_INC);
    moonMesh.rotation.y = ang - Math.PI / 2;   // tidal lock — one face forever toward Earth
  };

  // the major moons of Jupiter, Saturn and Neptune — real radii, orbital
  // radii and periods, each in its planet's equatorial plane (inc ≈ the
  // planet's axial tilt to the ecliptic). Triton orbits RETROGRADE (negative
  // period) and steeply tilted — the sign of a captured world.
  const jupiter = bodies.find(b => b.name === "Jupiter")!;
  const saturn = bodies.find(b => b.name === "Saturn")!;
  const neptune = bodies.find(b => b.name === "Neptune")!;
  const MOONS: { n: string; parent: Body; orbR: number; perD: number; col: number; lblMax: number; inc: number }[] = [
    { n: "Io",        parent: jupiter, orbR: 421700,  perD: 1.769,  col: 0xd8c060, lblMax: 8e7, inc: 3.1 },
    { n: "Europa",    parent: jupiter, orbR: 671034,  perD: 3.551,  col: 0xd8cdb8, lblMax: 8e7, inc: 3.1 },
    { n: "Ganymede",  parent: jupiter, orbR: 1070412, perD: 7.155,  col: 0x9a8d7d, lblMax: 8e7, inc: 3.1 },
    { n: "Callisto",  parent: jupiter, orbR: 1882709, perD: 16.689, col: 0x6f665c, lblMax: 8e7, inc: 3.1 },
    { n: "Enceladus", parent: saturn,  orbR: 237948,  perD: 1.370,  col: 0xf0f4ff, lblMax: 8e7, inc: 26.7 },
    { n: "Tethys",    parent: saturn,  orbR: 294619,  perD: 1.888,  col: 0xd8d8d2, lblMax: 8e7, inc: 26.7 },
    { n: "Dione",     parent: saturn,  orbR: 377396,  perD: 2.737,  col: 0xcccac2, lblMax: 8e7, inc: 26.7 },
    { n: "Rhea",      parent: saturn,  orbR: 527108,  perD: 4.518,  col: 0xc4bfb6, lblMax: 8e7, inc: 26.7 },
    { n: "Titan",     parent: saturn,  orbR: 1221870, perD: 15.945, col: 0xd8a35a, lblMax: 1e8, inc: 26.7 },
    { n: "Iapetus",   parent: saturn,  orbR: 3560820, perD: 79.32,  col: 0x9a8568, lblMax: 1.4e8, inc: 17.3 },
    { n: "Triton",    parent: neptune, orbR: 354759,  perD: -5.877, col: 0xe8d8c8, lblMax: 8e7, inc: 157 },
  ];
  for (const mn of MOONS) {
    // real mission-derived surface maps (Galileo/Voyager via Björn Jónsson &
    // the Solar System Scope set), with the albedo doubling as a subtle bump
    const mTex = T(`moons/${mn.n.toLowerCase()}.jpg`);
    const mBump = T(`moons/${mn.n.toLowerCase()}.jpg`); mBump.colorSpace = THREE.NoColorSpace;
    const mm = new THREE.Mesh(
      new THREE.SphereGeometry(RADII[mn.n]!, 72, 48),
      new THREE.MeshStandardMaterial({ map: mTex, bumpMap: mBump, bumpScale: 4, roughness: 1, metalness: 0 }),
    );
    const mb = addBody(mn.n, { x: 0, y: 0, z: 0 }, mm, 0);   // tidally locked: no free spin
    mb.labelMax = mn.lblMax;
    const phase = Math.random() * 6.2832, inc = mn.inc * D2R;
    mb.update = (_d, simDays) => {
      const ang = phase + (simDays / mn.perD) * 6.2832;
      const ox = Math.cos(ang) * mn.orbR, oz = -Math.sin(ang) * mn.orbR;
      mb.pos.x = mn.parent.pos.x + ox;
      mb.pos.y = mn.parent.pos.y - oz * Math.sin(inc);   // ride the planet's equatorial plane
      mb.pos.z = mn.parent.pos.z + oz * Math.cos(inc);
      mm.rotation.y = ang - Math.PI / 2;   // tidal lock — every major moon keeps one face to its planet
    };
    mb.update(now, 0);
  }

  // Pluto — the heart-bearing dwarf, on its true inclined orbit (using new PBR model from downloads/pluto.html + textures)
  {
    const diff = T("pluto_diffuse.png");
    const nrm = T("pluto_normal.png");
    nrm.colorSpace = THREE.NoColorSpace;
    nrm.flipY = true;
    const spec = T("pluto_specular.png");
    spec.colorSpace = THREE.NoColorSpace;
    const pm = new THREE.Mesh(
      new THREE.SphereGeometry(RADII["Pluto"]!, 96, 64),
      new THREE.MeshStandardMaterial({
        map: diff,
        normalMap: nrm,
        normalScale: new THREE.Vector2(1.4, 1.4),
        roughnessMap: spec,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    pm.rotation.z = THREE.MathUtils.degToRad(119.5);
    const pb = addBody("Pluto", { x: 0, y: 0, z: 0 }, pm, 0.00002);
    pb.update = (date) => {
      const q = plutoPosition(date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      pb.pos.x = kk.x; pb.pos.y = kk.y; pb.pos.z = kk.z;
    };
    pb.update(now, 0);

    // Charon — Pluto's partner, half its size: a true binary, both tidally
    // locked, forever showing each other the same face (New Horizons map)
    const chBump = T("moons/charon.jpg"); chBump.colorSpace = THREE.NoColorSpace;
    const cm = new THREE.Mesh(new THREE.SphereGeometry(RADII["Charon"]!, 64, 40),
      new THREE.MeshStandardMaterial({ map: T("moons/charon.jpg"), bumpMap: chBump, bumpScale: 3, roughness: 1, metalness: 0 }));
    const cb = addBody("Charon", { x: 0, y: 0, z: 0 }, cm, 0);
    cb.labelMax = 4e7; cb.minD = RADII["Charon"]! * 2.5; cb.dotK = 0.006;
    cb.line = "Pluto's partner, half its width — the two whirl about a point in empty space between them.";
    INFO["Charon"] = { facts: [["Radius", "606 km"], ["Distance", "19,591 km from Pluto"], ["Month = day", "6.4 days, locked both ways"], ["Visited", "New Horizons, 2015"]], text: [
      "Charon is so large beside Pluto — half its diameter — that the two don't quite orbit each other: they both circle a point in the empty space between them, a true double world. Each keeps one face permanently toward the other, so from Pluto's near side Charon hangs motionless in the sky, never rising, never setting.",
    ] };
    const chPhase = Math.random() * 6.2832, chInc = 99 * D2R;
    cb.update = (_d, simDays) => {
      const ang = chPhase + (simDays / 6.387) * 6.2832;
      const ox = Math.cos(ang) * 19591, oz = -Math.sin(ang) * 19591;
      cb.pos.x = pb.pos.x + ox; cb.pos.y = pb.pos.y - oz * Math.sin(chInc); cb.pos.z = pb.pos.z + oz * Math.cos(chInc);
      cm.rotation.y = ang - Math.PI / 2;   // tidally locked
    };
    cb.update(now, 0);
  }

  /* ---------- the dwarf planets — Ceres in the belt, the rest far beyond Neptune ----------
     real radii, orbital distances, periods and inclinations; Ceres from Dawn,
     the trans-Neptunians from the Solar System Scope artist's set (no surface
     maps exist for those — humanity has never seen them as more than a dot). */
  const sunCentre = () => ({ x: 0, y: 0, z: 0 });
  defineWorld({
    name: "Ceres", radiusKm: 473, map: "ceres.jpg", segments: 64, dotColor: 0xb9ad96, dotK: 0.006,
    orbit: { center: sunCentre, radiusKm: 2.77 * AU, periodDays: 1680, incDeg: 10.6 },
    line: "The largest body in the asteroid belt — a dwarf planet of rock and water ice.",
    info: { facts: [["Radius", "473 km"], ["Orbit", "2.77 AU · in the belt"], ["Year", "4.6 years"], ["Class", "dwarf planet"], ["Visited", "Dawn, 2015"]], text: [
      "Ceres is the asteroid belt's one true world — round under its own gravity, a third of all the belt's mass in a single body. Beneath its dark, salt-stained crust lies a layer of brine and water ice; bright spots in Occator crater are deposits of salt left where that water reached the surface and boiled away.",
    ] },
  });
  defineWorld({
    name: "Vesta", radiusKm: RADII["Vesta"]!, map: "vesta.jpg", segments: 56, dotColor: 0xc6bca8, dotK: 0.005,
    orbit: { center: sunCentre, radiusKm: 2.36 * AU, periodDays: 1325, incDeg: 7.1 },
    line: LINES["Vesta"]!, info: INFO["Vesta"],
  });
  defineWorld({
    name: "Makemake", radiusKm: 715, map: "makemake.jpg", segments: 48, dotColor: 0xc9a878, dotK: 0.006,
    orbit: { center: sunCentre, radiusKm: 45.4 * AU, periodDays: 111800, incDeg: 29.0 },
    line: "A frozen dwarf world of the Kuiper Belt, wrapped in methane ice.",
    info: { facts: [["Radius", "715 km"], ["Orbit", "45.4 AU"], ["Year", "306 years"], ["Surface", "−240 °C, methane ice"], ["Moon", "1 (MK2)"]], text: [
      "Makemake is one of the larger dwarf planets of the Kuiper Belt, bright with frozen methane and ethane. It helped end Pluto's reign: its 2005 discovery, alongside Eris, forced astronomers to either admit a tenth planet or redraw the definition — and in 2006 they redrew it.",
    ] },
  });
  defineWorld({
    name: "Haumea", radiusKm: 780, map: "haumea.jpg", segments: 48, tiltDeg: 28, dotColor: 0xd8d0c0, dotK: 0.006,
    orbit: { center: sunCentre, radiusKm: 43.1 * AU, periodDays: 103700, incDeg: 28.2 },
    line: "A dwarf planet spun into an egg shape, with rings and two moons.",
    info: { facts: [["Shape", "ellipsoid — a stretched egg"], ["Orbit", "43.1 AU"], ["Year", "284 years"], ["Day", "under 4 hours"], ["Rings", "yes — first KBO found with them"]], text: [
      "Haumea spins so fast — once every four hours — that it has been flung into the shape of an egg, twice as long as it is wide. It trails two small moons and a thin ring, and a family of icy shards knocked off in the ancient collision that set it spinning.",
    ] },
  });
  defineWorld({
    name: "Eris", radiusKm: 1163, map: "eris.jpg", segments: 48, dotColor: 0xd0d0cc, dotK: 0.006,
    orbit: { center: sunCentre, radiusKm: 67.8 * AU, periodDays: 204000, incDeg: 44.0 },
    line: "The most massive dwarf planet — the discovery that demoted Pluto.",
    info: { facts: [["Radius", "1,163 km"], ["Mass", "27% more than Pluto"], ["Orbit", "67.8 AU"], ["Year", "559 years"], ["Moon", "1 (Dysnomia)"]], text: [
      "Eris is very nearly Pluto's twin in size and actually heavier — and finding it in 2005, far out in the scattered disc, is what forced the reckoning. If Pluto was a planet, so was Eris, and so were the dozens more surely waiting in the dark. The word 'planet' was redrawn instead. Fittingly, it is named for the goddess of strife.",
    ] },
  });

  /* orbit lines + inner sun-centred structures (floating-origin offset);
     gated to the inner-system scale. The OUTER group (belts, Oort) is
     sun-centred too but visible out to interstellar range. */
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  const outerGroup = new THREE.Group();
  scene.add(outerGroup);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: 0.16 });

  // ---- the asteroid belt (2.1–3.3 AU) and the Kuiper belt (30–50 AU) ----
  const beltPoints = (count: number, rIn: number, rOut: number, thick: number, color: number, size: number, opacity: number) => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = (rIn + Math.random() * (rOut - rIn)) * AU;
      const th = Math.random() * 6.2832;
      arr[i * 3] = Math.cos(th) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2 * thick * AU;
      arr[i * 3 + 2] = -Math.sin(th) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, transparent: true, opacity, depthWrite: false }));
  };
  outerGroup.add(beltPoints(2600, 2.1, 3.3, 0.18, 0xb9ad96, 1.5, 0.5));    // main asteroid belt
  outerGroup.add(beltPoints(2000, 30, 50, 1.4, 0xa8b8d0, 1.4, 0.42));      // Kuiper belt

  /* ---------- the stellar neighbourhood: real stars at their true places ---------- */
  for (const s of STARS) {
    if (s.n === "TRAPPIST-1") continue;     // built as a full textured system below
    const p = starPos(s);
    const rKm = s.r * 696340;
    // every star is ALIVE: granulation scaled to its class — supergiants
    // churn in vast slow cells, dwarfs seethe in fine ones
    const granScale = s.r > 50 ? 6 : s.r > 3 ? 10 : s.r > 0.5 ? 22 : 16;
    const g = livingStar(rKm, s.c, granScale, 48);
    const sb = addBody(s.n, p, g, 0);
    sb.kind = "star";
    // honest presence at range: a supergiant's point of light OUTSHINES a
    // red dwarf's — dot size follows the star's true class
    sb.dotK = s.r > 50 ? 0.016 : s.r > 3 ? 0.012 : s.r > 0.5 ? 0.009 : 0.006;
    sb.line = `${s.t.charAt(0).toUpperCase() + s.t.slice(1)} · ${s.ly < 100 ? s.ly : Math.round(s.ly)} light-years from home.`;
    sb.minD = rKm * 4;
    if (!INFO[s.n]) INFO[s.n] = {
      facts: [["Distance", `${s.ly < 100 ? s.ly : Math.round(s.ly)} light-years`], ["Type", s.t], ["Size", `${s.r < 3 ? s.r : Math.round(s.r)} Suns`]],
      text: [sb.line],
    };
    if (sb.dot) (sb.dot.material as THREE.SpriteMaterial).color.set(s.c);
  }

  /* ---------- TRAPPIST-1: a second sun and its seven worlds ----------
     A real exoplanet system, built from the NASA-derived 4K model pack —
     an ultra-cool red dwarf and seven rocky Earth-sized planets at their
     true radii, orbital distances and periods, lit by their own star. */
  const ER = 6371;                          // km per Earth radius
  // every foreign sun (TRAPPIST + the exoplanet hosts) registers here; one
  // shared light follows whichever system the camera is currently inside,
  // so the scene is always lit by exactly the right star, at any scale.
  const foreignSuns: { pos: Vec3; col: number; span: number; orbits?: THREE.Group }[] = [];
  let trLight: THREE.PointLight | null = null;
  const trOrbitGroup = new THREE.Group(); scene.add(trOrbitGroup);
  const trOrbitMat = new THREE.LineBasicMaterial({ color: 0xff9a6a, transparent: true, opacity: 0.22 });
  const TR_C = starPos(STARS.find(s => s.n === "TRAPPIST-1")!);
  {
    const starR = 13.0 * ER;                // 82,823 km — Jupiter-sized M-dwarf
    const sg = new THREE.Group();
    sg.add(new THREE.Mesh(new THREE.SphereGeometry(starR, 64, 32),
      new THREE.MeshBasicMaterial({ map: T("trappist/star.jpg") })));
    const sglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff5a30, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sglow.scale.setScalar(starR * 7); sglow.frustumCulled = false; sg.add(sglow);
    const shalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff5a30, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    shalo.scale.setScalar(starR * 7); shalo.frustumCulled = false; sg.add(shalo);
    sg.userData["halo"] = shalo; sg.userData["starR"] = starR;
    const trStar = addBody("TRAPPIST-1", TR_C, sg, 0.00001);
    trStar.kind = "star"; trStar.foreign = true; trStar.system = "TRAPPIST-1"; trStar.radius = starR; trStar.minD = starR * 4; trStar.dotK = 0.006;
    trStar.line = "An ultra-cool red dwarf 40 light-years away — and seven Earth-sized worlds, three in the temperate zone.";
    if (trStar.dot) (trStar.dot.material as THREE.SpriteMaterial).color.set(0xff5038);
    INFO["TRAPPIST-1"] = { facts: [["Distance", "40.7 light-years"], ["Type", "ultra-cool M-dwarf"], ["Size", "Jupiter-sized"], ["Planets", "seven, Earth-sized"], ["Temperate", "three of them"]], text: [
      "Around a star scarcely larger than Jupiter and a thousand times fainter than the Sun circle seven rocky worlds the size of our own — the richest system of Earth-sized planets we know. The whole architecture would fit comfortably inside Mercury's orbit; from the surface of any one, the others would hang in the sky as discs, larger than our Moon.",
      "Three sit in the temperate zone where liquid water could pool. This red dwarf will burn steady and cool for trillions of years — long after our Sun is a cold cinder — making TRAPPIST-1 one of the most patient bets for life beyond Earth.",
    ] };

    // a light at the dwarf so its planets are lit by their own star
    trLight = new THREE.PointLight(0xff8a52, 3.4, 0, 0);
    scene.add(trLight);
    foreignSuns.push({ pos: TR_C, col: 0xff8a52, span: 1e8, orbits: trOrbitGroup });

    // the seven worlds — real radii (Earth radii), orbits (AU), periods (days)
    const TP: [string, number, number, number, string, string][] = [
      ["b", 1.116, 0.01154, 1.510826, "Hot rocky world", "398 K · scorched, tidally baked"],
      ["c", 1.097, 0.0158, 2.421937, "Warm rocky world", "340 K · a Venus-like furnace"],
      ["d", 0.788, 0.02227, 4.049219, "Temperate rocky world", "286 K · on the inner edge of the zone"],
      ["e", 0.920, 0.02925, 6.101013, "Habitable-zone world", "250 K · the best bet — likely rocky and watery"],
      ["f", 1.045, 0.03849, 9.20754, "Cool habitable-zone world", "218 K · possibly an ocean under ice"],
      ["g", 1.129, 0.04683, 12.352446, "Cold outer-zone world", "197 K · the largest of the seven"],
      ["h", 0.755, 0.06189, 18.772866, "Very cold rocky world", "172 K · the frozen outermost"],
    ];
    // each world is now one declarative defineWorld(...) call — the factory
    // builds the textured sphere, the orbit ring, the live orbit and the
    // catalogue entry. This is the template for adding any new world.
    for (const [k, rE, au, per, kind, sub] of TP) {
      defineWorld({
        name: `TRAPPIST-1${k}`, radiusKm: rE * ER,
        map: `trappist/${k}.jpg`, normal: `trappist/${k}_n.jpg`,
        roughMap: `trappist/${k}_r.jpg`, specMap: `trappist/${k}_s.jpg`,
        clouds: `trappist/${k}_c.png`, cloudOpacity: 0.85,
        segments: 48, tiltDeg: 2.9, minDk: 3, dotK: 0.006, labelMax: 6e7, foreign: true, system: "TRAPPIST-1",
        line: `${kind} around TRAPPIST-1 · ${sub}.`,
        orbit: { center: () => TR_C, radiusKm: au * AU, periodDays: per, ringGroup: trOrbitGroup, ringMat: trOrbitMat },
        info: { facts: [["Radius", `${rE} Earth radii`], ["Orbit", `${au} AU`], ["Year", `${per.toFixed(1)} days`], ["Class", kind]], text: [
          `${kind} — ${sub}. It circles its red dwarf once every ${per.toFixed(1)} days at just ${au} AU, far closer than Mercury hugs our Sun, yet bathed in light so faint it would feel like deep dusk at noon.`,
        ] },
      });
    }
  }

  /* ---------- the exoplanet systems — 22 real systems at their true places ----------
     Each is built straight from the data file: a textured host star at its
     real RA/Dec/distance, and its real planets (radii, orbits, periods) via
     defineWorld. The shared foreign-sun light handles illumination; planets
     appear only once you're in the system (labelMax). Adding a system later
     is just another row in src/data/exo.ts — nothing here changes. */
  const exoCentres: Record<string, Vec3> = {};
  for (const sys of EXO_SYSTEMS) {
    const C = skyPos(sys.ra, sys.dec, sys.ly);
    exoCentres[sys.pack] = C;
    const starR = Math.max(sys.rSun * 696340, sys.pulsar ? 1.4e4 : 0);   // pulsars are tiny — give a visible minimum
    const r = sys.pulsar ? 2.2e4 : starR;
    const sg = new THREE.Group();
    sg.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), new THREE.MeshBasicMaterial({ map: T(`exo/${sys.pack}/star.jpg`) })));
    const glowCol = sys.pulsar ? 0xbcd2ff : sys.col;
    const sglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: glowCol, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sglow.scale.setScalar(r * 7); sglow.frustumCulled = false; sg.add(sglow);
    const shalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: glowCol, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    shalo.scale.setScalar(r * 7); shalo.frustumCulled = false; sg.add(shalo);
    sg.userData["halo"] = shalo; sg.userData["starR"] = r;
    const sb = addBody(sys.star, C, sg, 0.00001);
    sb.kind = "star"; sb.foreign = true; sb.system = sys.star; sb.radius = r; sb.minD = r * 4; sb.dotK = 0.007;
    const lyTxt = sys.ly < 100 ? sys.ly : Math.round(sys.ly);
    sb.line = `${sys.kindStar} · ${lyTxt} light-years away — ${sys.planets.length} known planet${sys.planets.length > 1 ? "s" : ""}.`;
    if (sb.dot) (sb.dot.material as THREE.SpriteMaterial).color.set(glowCol);
    if (!INFO[sys.star]) INFO[sys.star] = {
      facts: [["Distance", `${lyTxt} light-years`], ["Star", sys.kindStar + (sys.spec ? ` (${sys.spec})` : "")], ["Planets", `${sys.planets.length} known`], ...(sys.tempK ? [["Temperature", `${Math.round(sys.tempK)} K`] as [string, string]] : [])],
      text: [sb.line],
    };
    const outerAU = sys.planets.reduce((m, p) => Math.max(m, p.au), 0);
    const sysOrbits = new THREE.Group(); sysOrbits.visible = false; scene.add(sysOrbits);
    const sysOrbitMat = new THREE.LineBasicMaterial({ color: glowCol, transparent: true, opacity: 0.2 });
    foreignSuns.push({ pos: C, col: glowCol, span: Math.max(2e9, outerAU * AU * 2.5), orbits: sysOrbits });

    sys.planets.forEach((p, i) => {
      const span = p.au * AU;
      defineWorld({
        name: p.name, radiusKm: Math.max(p.rE * ER, 600), map: `exo/${sys.pack}/${p.key}.jpg`,
        segments: 40, foreign: true, system: sys.star, minDk: 3, dotK: 0.006,
        labelMax: Math.max(3e9, span * 6), tiltDeg: ((i % 2) ? 1 : -1) * (1.5 + i * 1.5),
        orbit: { center: () => C, radiusKm: span, periodDays: p.per, incDeg: (i - (sys.planets.length - 1) / 2) * 1.6, ringGroup: sysOrbits, ringMat: sysOrbitMat },
        line: `${cap(p.kind)} · ${describeExo(p, sys)}`,
        info: exoPlanetInfo(p, sys, lyTxt),
      });
    });
  }

  /* ---------- comets: true elements, tails that wake near the Sun ---------- */
  interface CometEl { a: number; e: number; i: number; N: number; w: number; periMs: number; periodD: number; }
  function cometPos(el: CometEl, date: Date): { x: number; y: number; z: number } {
    const frac = (((date.getTime() - el.periMs) / (el.periodD * 86400000)) % 1 + 1) % 1;
    const M = frac * 2 * Math.PI;
    let E = M;                                          // high-e orbits need patience
    for (let i = 0; i < 30; i++) {
      const dE = (E - el.e * Math.sin(E) - M) / (1 - el.e * Math.cos(E));
      E -= dE; if (Math.abs(dE) < 1e-12) break;
    }
    const xv = el.a * (Math.cos(E) - el.e), yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    const vt = Math.atan2(yv, xv), r = Math.hypot(xv, yv), u = vt + el.w * D2R;
    const N = el.N * D2R, I = el.i * D2R;
    const cN = Math.cos(N), sN = Math.sin(N), cI = Math.cos(I), sI = Math.sin(I), cU = Math.cos(u), sU = Math.sin(u);
    return { x: r * (cN * cU - sN * sU * cI), y: r * (sN * cU + cN * sU * cI), z: r * (sU * sI) };
  }
  const COMETS: { n: string; el: CometEl }[] = [
    { n: "Halley's Comet", el: { a: 17.834, e: 0.96714, i: 162.26, N: 58.42, w: 111.33, periMs: Date.UTC(1986, 1, 9), periodD: 27510 } },
    { n: "Hale–Bopp", el: { a: 186.0, e: 0.99492, i: 89.43, N: 282.47, w: 130.59, periMs: Date.UTC(1997, 3, 1), periodD: 925000 } },
  ];
  /** a comet's nucleus: an irregular, crusted lump of dirty ice */
  function cometNucleus(): THREE.Mesh {
    const geo = new THREE.IcosahedronGeometry(60, 2);
    const posA = geo.attributes["position"] as THREE.BufferAttribute;
    for (let i = 0; i < posA.count; i++) {
      const vx = posA.getX(i), vy = posA.getY(i), vz = posA.getZ(i);
      const j = 0.72 + 0.45 * Math.abs(Math.sin(vx * 0.11 + vy * 0.07) * Math.cos(vz * 0.09 - vx * 0.05));
      posA.setXYZ(i, vx * j * 1.25, vy * j * 0.9, vz * j);   // lumpy, elongated
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: worldTexture("Callisto"), color: 0x8a857c, shininess: 6 }));
  }
  /** one tail: particles laid along +Z, flaring laterally with distance */
  function cometTail(count: number, color: number, spread: number, lenScale: number): THREE.Points {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const f = Math.pow(Math.random(), 1.4);            // denser near the nucleus
      const lat = Math.pow(f, 0.8) * spread;
      arr[i * 3] = (Math.random() - 0.5) * 2 * lat;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2 * lat;
      arr[i * 3 + 2] = f * lenScale;
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return new THREE.Points(tg, new THREE.PointsMaterial({
      color, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  }
  for (const cm of COMETS) {
    const g = new THREE.Group();
    g.add(cometNucleus());
    // the coma — a soft envelope that brightens near the Sun
    const coma = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color: 0xd8ecff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0,
    }));
    coma.scale.setScalar(2.4e5);
    g.add(coma);
    // TWO tails, as in life: a broad warm dust tail and a straight blue ion tail
    const tails = new THREE.Group();
    const dust = cometTail(170, 0xffe2c4, 9e5, 1.05e7);
    const ion = cometTail(110, 0x7ec8ff, 3.2e5, 1.7e7);
    tails.add(dust); tails.add(ion);
    g.add(tails);
    const cb = addBody(cm.n, { x: 0, y: 0, z: 0 }, g, 0.00004);
    cb.minD = 2500;
    cb.dotK = 0.007;
    cb.drift = true; cb.labelMax = 6e8;   // drifts as a point; named only within ~4 AU
    if (cb.dot) (cb.dot.material as THREE.SpriteMaterial).color.set(0xbfe0ff);
    const Z = new THREE.Vector3(0, 0, 1), dirV = new THREE.Vector3();
    cb.update = (date) => {
      const q = cometPos(cm.el, date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      cb.pos.x = kk.x; cb.pos.y = kk.y; cb.pos.z = kk.z;
      const rAU = Math.hypot(q.x, q.y, q.z);
      const wake = Math.max(0, Math.min(1, (4 - rAU) / 3.2));
      // both tails point away from the Sun, always
      dirV.set(kk.x, kk.y, kk.z).normalize();
      tails.quaternion.setFromUnitVectors(Z, dirV);
      tails.scale.setScalar(Math.max(wake, 1e-4));
      (dust.material as THREE.PointsMaterial).opacity = wake * 0.75;
      (ion.material as THREE.PointsMaterial).opacity = wake * 0.6;
      (coma.material as THREE.SpriteMaterial).opacity = wake * 0.5;
    };
    cb.update(now, 0);
    // its long ellipse, drawn once
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const d = new Date(cm.el.periMs + (i / 256) * cm.el.periodD * 86400000);
      const q = cometPos(cm.el, d);
      const k = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      pts.push(new THREE.Vector3(k.x, k.y, k.z));
    }
    orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
  }

  /* ---------- visited small bodies: real radar/SfM shape models ----------
     Five worlds humanity has flown to and mapped — four near-Earth asteroids
     and a comet — each rendered from its ACTUAL shape model (NASA, JAXA, ESA),
     scaled to true size, placed at its real position today from JPL osculating
     elements, and tumbling at its measured spin period. Irregular lumps, as
     they are in life — never spheres. The small GLBs load lazily; until each
     arrives the body still drifts as its point of light. */
  interface ShapeDef {
    name: string; file: string; rKm: number; color: number; dotCol: number;
    spinH: number; retro?: boolean; comet?: boolean; line: string;
    a: number; e: number; i: number; N: number; w: number; tpJD: number; perD: number;
    info: { facts: [string, string][]; text: string[] };
  }
  const jd2ms = (jd: number): number => (jd - 2440587.5) * 86400000;
  const SHAPES: ShapeDef[] = [
    { name: "Bennu", file: "/models/asteroids/bennu.glb", rKm: 0.252, color: 0x5d574e, dotCol: 0x9c958a, spinH: 4.296, retro: true,
      a: 1.12639103, e: 0.20374508, i: 6.03494, N: 2.06087, w: 66.22306, tpJD: 2455439.141941, perD: 436.64873,
      line: "A fragile rubble-pile asteroid — and a fistful of it is now on Earth.",
      info: { facts: [["Type", "Carbonaceous (B-type)"], ["Width", "490 metres"], ["Day", "4.3 hours"], ["Visited", "OSIRIS-REx, 2018–21"], ["Sample", "121 g, home 2023"]], text: [
        "Bennu is a loose pile of rubble barely 490 metres across, held together more by its own feeble gravity than by any solid rock. NASA's OSIRIS-REx orbited it for over two years — the smallest world ever orbited — and in 2020 reached down and touched its surface, which behaved less like ground than like a ball pit: the sampling arm sank in as if into a fluid.",
        "In September 2023 a capsule parachuted 121 grams of Bennu into the Utah desert — pristine carbon-rich dust older than the planets, carrying the water-bearing clays and organic molecules from which the chemistry of life was built. Bennu also carries a small chance of striking Earth in the late 2100s, which is part of why we went to meet it." ] } },
    { name: "Ryugu", file: "/models/asteroids/ryugu.glb", rKm: 0.502, color: 0x575650, dotCol: 0x9a958e, spinH: 7.6326, retro: true,
      a: 1.19091893, e: 0.19107300, i: 5.86644, N: 251.28971, w: 211.60899, tpJD: 2461118.296422, perD: 474.70273,
      line: "A spinning-top of primordial carbon — twice sampled, brought home to Japan.",
      info: { facts: [["Type", "Carbonaceous (Cb-type)"], ["Width", "900 metres"], ["Day", "7.6 hours"], ["Visited", "Hayabusa2, 2018–19"], ["Sample", "5.4 g, home 2020"]], text: [
        "Ryugu is a top-shaped pile of rubble, its equator bulged into a sharp ridge by a faster spin long ago. Japan's Hayabusa2 met it in 2018, dropped rovers that hopped across the surface in the microgravity, and fired a copper impactor to blast an artificial crater and expose buried, unweathered material.",
        "It then collected samples from two sites — including from beneath the surface — and returned 5.4 grams to the Australian outback in December 2020. In them, scientists found amino acids and the building blocks of RNA: hard evidence that the ingredients of life were sown across the young Solar System by bodies exactly like this one." ] } },
    { name: "Eros", file: "/models/asteroids/eros.glb", rKm: 17.2, color: 0x9a8568, dotCol: 0xd0bc94, spinH: 5.27,
      a: 1.45824372, e: 0.22287796, i: 10.82854, N: 304.26797, w: 178.91813, tpJD: 2461088.813494, perD: 643.19639,
      line: "The first asteroid ever orbited — and the first ever landed on.",
      info: { facts: [["Type", "Stony (S-type)"], ["Length", "34 km"], ["Day", "5.3 hours"], ["Class", "Amor near-Earth"], ["Visited", "NEAR Shoemaker, 2000–01"]], text: [
        "Eros is an elongated stony asteroid, 34 kilometres end to end and shaped like a peanut or a foot. In February 2000 NASA's NEAR Shoemaker became the first spacecraft ever to orbit an asteroid, circling Eros for a year and mapping every crater, ridge and boulder of its battered grey surface.",
        "Then, in an ending nobody had planned, controllers gently set the orbiter down onto Eros in February 2001 — the first soft landing on an asteroid — and it kept transmitting from the surface for two more weeks. Eros is an Amor-class near-Earth object: its orbit reaches in past Mars but never quite crosses our own." ] } },
    { name: "Itokawa", file: "/models/asteroids/itokawa.glb", rKm: 0.268, color: 0xa89074, dotCol: 0xccb792, spinH: 12.132,
      a: 1.32405228, e: 0.28017764, i: 1.62094, N: 69.07450, w: 162.84090, tpJD: 2460936.702994, perD: 556.48842,
      line: "A 500-metre rubble pile — the first asteroid we ever brought home.",
      info: { facts: [["Type", "Stony (S-type)"], ["Length", "535 metres"], ["Day", "12.1 hours"], ["Class", "Apollo near-Earth"], ["Visited", "Hayabusa, 2005"]], text: [
        "Itokawa is a tiny, sea-otter-shaped rubble pile just 535 metres long — not solid rock but a loose heap of gravel and boulders barely held together by gravity. Japan's first Hayabusa probe reached it in 2005, surveyed its smooth 'seas' and rough 'highlands', and made two fraught touchdowns to grab a sample.",
        "After a crippled, years-long limp home, Hayabusa's capsule streaked back through Earth's atmosphere in 2010 carrying some 1,500 microscopic grains — the first material ever returned from an asteroid. Those grains proved that the common S-type asteroids are the parent bodies of the most common meteorites that fall to Earth." ] } },
    { name: "Comet 67P", file: "/models/asteroids/comet67p.glb", rKm: 2.15, color: 0x4a443d, dotCol: 0xbcd0e0, spinH: 12.7613, comet: true,
      a: 3.46224949, e: 0.64090813, i: 7.04029, N: 50.13557, w: 12.79825, tpJD: 2457247.588658, perD: 2353.07607,
      line: "The duck-shaped comet where a robot landed — Rosetta's whole world.",
      info: { facts: [["Type", "Jupiter-family comet"], ["Shape", "4.3 km, two lobes"], ["Day", "12.4 hours"], ["Orbit", "6.4 years"], ["Visited", "Rosetta & Philae, 2014–16"]], text: [
        "Comet 67P/Churyumov–Gerasimenko is a four-kilometre chunk of ice and dust shaped like a rubber duck — two bodies that gently merged in the dawn of the Solar System. ESA's Rosetta chased it for ten years and arrived in 2014, the first spacecraft ever to orbit a comet, then dropped the little lander Philae onto its surface — the first soft landing on a comet's nucleus.",
        "For two years Rosetta flew alongside as 67P fell sunward and woke, its ices boiling into jets and a lengthening tail. It found the comet's water chemically unlike Earth's oceans, oxygen locked in its ice since the Solar System's birth, and the amino acid glycine drifting in its coma. In 2016 Rosetta ended its mission by descending to land on the comet itself." ] } },
  ];
  const shapeLoader = new GLTFLoader();
  for (const sh of SHAPES) {
    const g = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.rotation.set(0.5, 0, 0.28);          // a gentle, fixed obliquity so it tumbles rather than spins upright
    g.add(pivot);
    const el: CometEl = { a: sh.a, e: sh.e, i: sh.i, N: sh.N, w: sh.w, periMs: jd2ms(sh.tpJD), periodD: sh.perD };
    const cb = addBody(sh.name, { x: 0, y: 0, z: 0 }, g, 0);
    cb.radius = sh.rKm;
    cb.minD = Math.max(sh.rKm * 1.3, 0.08);
    cb.drift = true;                            // stays a point of light at range; only its name hides
    cb.labelMax = 8e7;                          // named only within ~0.5 AU
    cb.dotK = 0.007;
    cb.arriveK = 6;
    cb.line = sh.line;
    INFO[sh.name] = sh.info;
    if (cb.dot) (cb.dot.material as THREE.SpriteMaterial).color.set(sh.dotCol);
    // the real shape model — small GLBs, loaded lazily; rocky matte material, true size
    shapeLoader.load(sh.file, (gltf) => {
      const mat = new THREE.MeshStandardMaterial({ color: sh.color, roughness: 0.97, metalness: 0 });
      gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat; });
      gltf.scene.scale.setScalar(sh.rKm);
      pivot.add(gltf.scene);
    });
    // a comet wakes near the Sun: a coma and two tails, always pointing away from it
    let tails: THREE.Group | null = null, dust: THREE.Points | null = null, ion: THREE.Points | null = null, coma: THREE.Sprite | null = null;
    if (sh.comet) {
      coma = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xd8ecff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      coma.scale.setScalar(8e4); g.add(coma);
      tails = new THREE.Group();
      dust = cometTail(150, 0xffe2c4, 7e5, 9e6);
      ion = cometTail(100, 0x7ec8ff, 2.6e5, 1.5e7);
      tails.add(dust); tails.add(ion); g.add(tails);
    }
    const spinRate = (Math.PI * 2 * 24 / sh.spinH) * (sh.retro ? -1 : 1);   // rad per sim-day, real sidereal rate
    const Z = new THREE.Vector3(0, 0, 1), dirV = new THREE.Vector3();
    cb.update = (date, sd) => {
      const q = cometPos(el, date);
      const kk = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      cb.pos.x = kk.x; cb.pos.y = kk.y; cb.pos.z = kk.z;
      pivot.rotation.y = (sd * spinRate) % (Math.PI * 2);
      if (tails) {
        const rAU = Math.hypot(q.x, q.y, q.z);
        const wake = Math.max(0, Math.min(1, (3.5 - rAU) / 2.6));
        dirV.set(kk.x, kk.y, kk.z).normalize();
        tails.quaternion.setFromUnitVectors(Z, dirV);
        tails.scale.setScalar(Math.max(wake, 1e-4));
        (dust!.material as THREE.PointsMaterial).opacity = wake * 0.7;
        (ion!.material as THREE.PointsMaterial).opacity = wake * 0.55;
        (coma!.material as THREE.SpriteMaterial).opacity = wake * 0.45;
      }
    };
    cb.update(now, 0);
    // its real orbit, drawn once
    const opts: THREE.Vector3[] = [];
    for (let k = 0; k <= 256; k++) {
      const d = new Date(el.periMs + (k / 256) * el.periodD * 86400000);
      const q = cometPos(el, d);
      const p = E2T({ x: q.x * AU, y: q.y * AU, z: q.z * AU });
      opts.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(opts), orbitMat));
  }

  /* ---------- the Oort cloud: the Sun's farthest country ---------- */
  let oortMat: THREE.PointsMaterial | null = null;
  {
    const N = 11000;                              // a real shell you can fall into, not a whisper
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * 6.2832, rr = Math.sqrt(1 - u * u);
      const R = (5000 + Math.pow(Math.random(), 1.6) * 45000) * AU;
      arr[i * 3] = R * rr * Math.cos(th); arr[i * 3 + 1] = R * u * 0.92; arr[i * 3 + 2] = R * rr * Math.sin(th);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    oortMat = new THREE.PointsMaterial({
      color: 0xc4d8f4, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const cloud = new THREE.Points(gg, oortMat);
    // the cloud is SUN-centred (outerGroup carries the floating-origin offset);
    // it fades out as you leave so it never hangs as a ball at the Sun from afar
    outerGroup.add(cloud);
  }

  /* ---------- the machines: humanity's farthest emissaries ----------
     Each spacecraft is BUILT, part by part, at icon scale (1 unit = 1 km):
     dishes, booms, gold foil, mirrors, sunshields — recognisably itself. */
  const M = {
    white: new THREE.MeshPhongMaterial({ color: 0xe9ecf2, shininess: 30 }),
    silver: new THREE.MeshPhongMaterial({ color: 0xb9c0cc, shininess: 80, specular: 0x888888 }),
    dark: new THREE.MeshPhongMaterial({ color: 0x2c2f36, shininess: 10 }),
    gold: new THREE.MeshPhongMaterial({ color: 0xc89530, shininess: 36, specular: 0x6a531a, emissive: 0x4a380c }),
    foil: new THREE.MeshPhongMaterial({ color: 0xc9a23c, shininess: 60, emissive: 0x2c2208 }),
    panel: new THREE.MeshPhongMaterial({ color: 0x27355c, shininess: 60, side: THREE.DoubleSide }),
    shield: new THREE.MeshPhongMaterial({ color: 0xd6dae2, shininess: 70, side: THREE.DoubleSide, specular: 0xaaaaaa }),
  };
  function buildVoyager(): THREE.Group {
    const g = new THREE.Group();
    // the 3.7 m high-gain dish — the icon
    const dish = new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 12, 0, Math.PI * 2, 0, 0.62), M.white);
    dish.rotation.x = Math.PI / 2; dish.scale.z = 0.55;
    g.add(dish);
    const feed = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 10), M.dark);
    feed.rotation.x = -Math.PI / 2; feed.position.z = 2.2; g.add(feed);
    // ten-sided bus behind the dish
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.1, 10), M.dark);
    bus.rotation.x = Math.PI / 2; bus.position.z = -1.2; g.add(bus);
    // the golden record on the bus
    const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24), M.gold);
    rec.rotation.x = Math.PI / 2; rec.position.set(-1.2, 1.1, -1.2); g.add(rec);
    // RTG boom (three dark drums) + science boom + the long magnetometer boom
    const rtgArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 5.6, 6), M.silver);
    rtgArm.rotation.z = Math.PI / 2; rtgArm.position.set(-4, 0, -1.2); g.add(rtgArm);
    for (let i = 0; i < 3; i++) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12), M.dark);
      drum.rotation.z = Math.PI / 2; drum.position.set(-5 - i * 1.3, 0, -1.2); g.add(drum);
    }
    const sciArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7.2, 6), M.silver);
    sciArm.rotation.z = Math.PI / 2; sciArm.rotation.y = 0.5; sciArm.position.set(3.4, 0.6, -1.4); g.add(sciArm);
    const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 16, 5), M.silver);
    mag.rotation.z = Math.PI / 2; mag.rotation.y = -0.35; mag.position.set(7.4, -0.8, -1.0); g.add(mag);
    return g;
  }
  function buildNewHorizons(): THREE.Group {
    const g = new THREE.Group();
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.4, 6), M.foil);
    bus.rotation.x = Math.PI / 2; g.add(bus);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(3.1, 28, 10, 0, Math.PI * 2, 0, 0.6), M.white);
    dish.rotation.x = Math.PI / 2; dish.scale.z = 0.5; dish.position.z = 1.3; g.add(dish);
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 4.2, 8), M.dark);
    rtg.rotation.z = Math.PI / 2; rtg.position.set(-3.6, 0, -0.4); g.add(rtg);
    return g;
  }
  function buildJWST(): THREE.Group {
    const g = new THREE.Group();
    // 18 gold hexagons in the honeycomb — rings 1 and 2 around an empty centre
    const hexGeo = new THREE.CylinderGeometry(1.18, 1.18, 0.12, 6);
    const axial: [number, number][] = [];
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
      const s = -q - r, d = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (d === 1 || d === 2) axial.push([q, r]);
    }
    for (const [q, r] of axial) {
      const hx = 1.25 * 1.732 * (q + r / 2), hy = 1.25 * 1.5 * r;
      const hex = new THREE.Mesh(hexGeo, M.gold);
      hex.rotation.x = Math.PI / 2; hex.rotation.y = Math.PI / 6;
      hex.position.set(hx, hy + 1.8, 0); g.add(hex);
    }
    // secondary mirror on three struts
    const sec = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16), M.dark);
    sec.rotation.x = Math.PI / 2; sec.position.set(0, 1.8, 5.4); g.add(sec);
    for (const sx of [-3.4, 0, 3.4]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.6, 5), M.silver);
      strut.position.set(sx / 2, 1.8 + (sx === 0 ? 1.6 : -0.4), 2.7);
      strut.lookAt(0, 1.8, 5.4); strut.rotateX(Math.PI / 2);
      g.add(strut);
    }
    // the five-layer kite sunshield beneath
    for (let i = 0; i < 5; i++) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(14.2 - i * 0.5, 8.6 - i * 0.35), M.shield);
      sheet.rotation.x = Math.PI / 2; sheet.position.set(0, -1.6 - i * 0.42, 0); g.add(sheet);
    }
    return g;
  }
  function buildHubble(): THREE.Group {
    const g = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 13.2, 28), M.silver);
    tube.rotation.x = Math.PI / 2; g.add(tube);
    const aft = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.7, 2.6, 28), M.white);
    aft.rotation.x = Math.PI / 2; aft.position.z = -7.4; g.add(aft);
    // the open aperture door
    const door = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.12, 28), M.dark);
    door.position.set(0, 1.6, 8.2); door.rotation.x = Math.PI / 4; g.add(door);
    // twin solar wings
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), M.silver);
      arm.rotation.z = Math.PI / 2; arm.position.set(sx * 3.1, 0, 0.6); g.add(arm);
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.6), M.panel);
      wing.position.set(sx * 7.4, 0, 0.6); g.add(wing);
    }
    return g;
  }

  function addCraft(n: string, pos: { x: number; y: number; z: number }, model: THREE.Group, labelMax?: number): Body {
    const cb = addBody(n, pos, model, 0.00005);   // a slow, living tumble
    cb.radius = 14; cb.minD = 90; cb.dotK = 0.006;
    cb.drift = true;                              // a point that drifts; named only up close
    cb.labelMax = labelMax ?? 8e8;
    if (cb.dot) (cb.dot.material as THREE.SpriteMaterial).color.set(0xdfe8f8);
    return cb;
  }
  const raDec = (raH: number, decD: number, distKmV: number) => {
    const ra = raH * 15 * D2R, dec = decD * D2R, eps = 23.439 * D2R;
    const xe = Math.cos(dec) * Math.cos(ra), ye = Math.cos(dec) * Math.sin(ra), ze = Math.sin(dec);
    return E2T({ x: xe * distKmV, y: (ye * Math.cos(eps) + ze * Math.sin(eps)) * distKmV, z: (-ye * Math.sin(eps) + ze * Math.cos(eps)) * distKmV });
  };
  addCraft("Voyager 1", raDec(17.27, 12.45, 167 * AU), buildVoyager());
  addCraft("Voyager 2", raDec(20.12, -58.96, 139 * AU), buildVoyager());
  addCraft("New Horizons", raDec(19.6, -20.5, 61 * AU), buildNewHorizons());
  {
    const jwst = addCraft("JWST", { x: 0, y: 0, z: 0 }, buildJWST(), 4e8);
    jwst.update = () => {
      const d = Math.hypot(earth.pos.x, earth.pos.y, earth.pos.z) || 1;
      const f = (d + 1.5e6) / d;      // Sun–Earth L2: 1.5M km anti-sunward of Earth
      jwst.pos.x = earth.pos.x * f; jwst.pos.y = earth.pos.y * f; jwst.pos.z = earth.pos.z * f;
    };
    jwst.update(now, 0);
    const hst = addCraft("Hubble", { x: 0, y: 0, z: 0 }, buildHubble(), 6e5);
    hst.update = (_d, simDays) => {
      const ang = (simDays * 86400 / 5760) * 2 * Math.PI;   // a 96-minute orbit
      hst.pos.x = earth.pos.x + Math.cos(ang) * 6911;
      hst.pos.y = earth.pos.y + Math.sin(ang) * 2400;
      hst.pos.z = earth.pos.z - Math.sin(ang) * 6911;
    };
    hst.update(now, 0);
  }

  INFO["Halley's Comet"] = { facts: [["Period", "75–76 years"], ["Last here", "1986"], ["Returns", "2061"], ["Nucleus", "15 km of ice and dust"]], text: [
    "The first comet ever recognised as a visitor that returns. Every record of it — 240 BC in Chinese annals, 1066 on the Bayeux Tapestry, 1910, 1986 — is the same fifteen-kilometre lump of ice and soot, falling sunward again and again. Run time forward to 2061 and watch its tail wake as it falls back in.",
    "Each pass costs it a metre or two of surface. It has perhaps a few thousand returns left.",
  ] };
  INFO["Hale–Bopp"] = { facts: [["Seen", "1996–97, for 18 months"], ["Nucleus", "~60 km — a giant"], ["Next return", "~year 4385"]], text: [
    "The great comet of 1997 — visible to the naked eye for a record eighteen months, watched by more humans than any comet in history. Its nucleus is some sixty kilometres across, ten times Halley's width. It is now far beyond Neptune, climbing away on a 2,500-year ellipse.",
  ] };
  INFO["Voyager 1"] = { facts: [["Launched", "1977"], ["Distance", "~167 AU — the farthest"], ["Status", "still calling home"]], text: [
    "The farthest human-made object. Launched in 1977 with a golden record of Earth's sounds, it crossed into interstellar space in 2012 and still whispers data home daily — a signal that takes nearly a full day to arrive, transmitted with the power of a refrigerator light bulb.",
    "It carries Chuck Berry, Bach, greetings in 55 languages, and the sound of a kiss. It will outlast the Earth.",
  ] };
  INFO["Voyager 2"] = { facts: [["Launched", "1977"], ["Grand Tour", "all four giant planets"], ["Distance", "~139 AU"]], text: [
    "The only spacecraft ever to visit Uranus and Neptune — the Grand Tour, riding a planetary alignment that occurs once every 176 years. Nearly everything in our textbooks about the ice giants came from its few days of flyby in 1986 and 1989.",
  ] };
  INFO["New Horizons"] = { facts: [["Launched", "2006"], ["Pluto flyby", "14 July 2015"], ["Distance", "~61 AU"]], text: [
    "The fastest launch in history — it passed the Moon in nine hours — and the mission that turned Pluto from a dot into a world with mountains and a heart. It is still flying outward through the Kuiper Belt, with power to keep observing into the 2040s.",
  ] };
  INFO["JWST"] = { facts: [["Orbit", "Sun–Earth L2, 1.5M km out"], ["Mirror", "6.5 m, gold-plated"], ["Sees", "the first galaxies"]], text: [
    "The largest telescope ever sent to space rides a point of gravitational balance 1.5 million kilometres behind Earth, hiding from the Sun behind a tennis-court-sized shield, chilled to −233 °C so it can feel the infrared warmth of the universe's first galaxies. It can detect the heat of a bumblebee at the distance of the Moon.",
  ] };
  INFO["Hubble"] = { facts: [["Launched", "1990"], ["Orbit", "~540 km up, 96 minutes"], ["Legacy", "1.6M+ observations"]], text: [
    "Thirty-five years of the sharpest eyes humanity has owned. Hubble measured the age of the universe, proved its expansion is accelerating, and took the Deep Fields — pictures of 'empty' sky that turned out to hold thousands of galaxies each. Much of what this Atlas shows, Hubble taught us.",
  ] };

  /* ---------- S4: THE GALAXY — the neighbourhood dissolves into the Milky Way ----------
     Ninety thousand points form the real thing: a four-arm logarithmic spiral
     100,000 ly across, warm bulge, thin disk — CENTRED on Sagittarius A*'s true
     sky position (26,660 ly toward Sagittarius) with the disk aligned to the
     real galactic plane. It fades in as you rise above the stellar
     neighbourhood, while the camera-glued panorama fades out — the backdrop
     becoming the OBJECT. */
  const GAL_C = raDec(17.7611, -29.008, 26660 * LY);
  const poleK = raDec(12.8567, 27.13, 1);
  const galaxy = new THREE.Group();
  galaxy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(poleK.x, poleK.y, poleK.z).normalize());
  scene.add(galaxy);

  /** the Milky Way as a PAINTING: a procedural photo-real disk — blazing
   *  barred core, two grand arms and two minor ones as soft density waves,
   *  dark dust lanes along their inner edges, blue OB knots and pink HII
   *  regions — over which 3D point-grain gives parallax and depth. */
  // a tight grand-design spiral, shared by the texture AND the 3D grain so
  // the painted structure and the point sparkle reinforce each other
  const G_RC = 44, G_RE = 970, G_TURNS = 2.65, G_SWEEP = G_TURNS * 2 * Math.PI;
  const G_K = Math.log(G_RE / G_RC) / G_SWEEP;
  const G_ARMS = [0.0, Math.PI, 0.5 * Math.PI + 0.4, 1.5 * Math.PI + 0.4];  // 2 dominant + 2 spurs
  function galaxyTexture(): THREE.Texture {
    const S = 2048, C = S / 2;
    const c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d")!;
    const R = () => Math.random();
    const blob = (bx: number, by: number, r: number, col: string) => {
      const g = x.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.beginPath(); x.arc(bx, by, r, 0, 6.29); x.fill();
    };
    const spiral = (arm: number, t: number) => {
      const th = arm + t * G_SWEEP, r = G_RC * Math.exp(G_K * t * G_SWEEP);
      return { px: C + Math.cos(th) * r, py: C + Math.sin(th) * r, r };
    };

    // 1) a faint exponential disk haze — just enough body, kept dim for contrast
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 240; i++) {
      const rr = Math.pow(R(), 0.6) * G_RE, th = R() * 6.2832;
      const bluish = Math.min(1, rr / G_RE);
      blob(C + Math.cos(th) * rr, C + Math.sin(th) * rr, 60 + R() * 120,
        `rgba(${188 - bluish * 40 | 0},${190 - bluish * 18 | 0},${205 + bluish * 40 | 0},${0.035 + 0.04 * (1 - bluish)})`);
    }

    // 2) the arms — dense, TIGHT, feathered ribbons of stars (gold core → blue rim).
    //    high blob counts so the ribbons read smooth and bright, not dotty.
    G_ARMS.forEach((arm, ai) => {
      const major = ai < 2;
      const N = major ? 1500 : 760;
      for (let i = 0; i < N; i++) {
        const t = i / N;
        const s = spiral(arm, t);
        if (s.r > G_RE) break;
        const spread = s.r * (0.03 + t * 0.085);          // tighter than before
        const px = s.px + (R() - 0.5) * 2 * spread + (R() - 0.5) * spread;
        const py = s.py + (R() - 0.5) * 2 * spread + (R() - 0.5) * spread;
        const warm = Math.max(0, 1 - t * 1.5);
        const cr = 190 + warm * 65, cg = 206 + warm * 38, cb = 255 - warm * 55;
        const a = (major ? 0.16 : 0.08) * (1 - t * 0.32);
        blob(px, py, (major ? 13 : 9) * (1 - t * 0.22), `rgba(${cr|0},${cg|0},${cb|0},${a})`);
      }
    });

    // 3) HII regions (pink) + OB clusters (blue) + bright knots, dense on the arms
    G_ARMS.forEach((arm, ai) => {
      const N = ai < 2 ? 320 : 150;
      for (let i = 0; i < N; i++) {
        const t = 0.05 + R() * 0.95, s = spiral(arm, t);
        if (s.r > G_RE) continue;
        const spread = s.r * (0.025 + t * 0.08);
        const px = s.px + (R() - 0.5) * 2 * spread, py = s.py + (R() - 0.5) * 2 * spread;
        const roll = R();
        if (roll < 0.36) blob(px, py, 4 + R() * 10, `rgba(255,${110 + R() * 50 | 0},${145 + R() * 45 | 0},${0.4 + R() * 0.35})`);   // HII
        else if (roll < 0.72) blob(px, py, 3 + R() * 6, `rgba(${160 + R() * 60 | 0},200,255,${0.35 + R() * 0.3})`);                  // OB
        else blob(px, py, 1.5 + R() * 3, `rgba(255,255,255,${0.5 + R() * 0.4})`);                                                    // knots
      }
    });

    // 4) the bar + bulge + blazing compact nucleus (brighter, tighter than before)
    x.save(); x.translate(C, C); x.rotate(0.0); x.scale(2.0, 0.95);
    blob(0, 0, 175, "rgba(255,222,164,0.55)");
    blob(0, 0, 95, "rgba(255,230,180,0.7)");
    x.restore();
    blob(C, C, 200, "rgba(255,224,172,0.6)");
    blob(C, C, 96, "rgba(255,238,202,0.9)");
    blob(C, C, 42, "rgba(255,252,238,1)");

    // 5) dust lanes — strong, dark, on the inner edge of each dominant arm,
    //    plus the flocculent dust ring around the bulge
    x.globalCompositeOperation = "source-over";
    G_ARMS.slice(0, 2).forEach(arm => {
      for (let i = 0; i < 500; i++) {
        const t = i / 500, s = spiral(arm - 0.12, t);     // inner edge of the bright arm
        if (s.r > G_RE * 0.96 || s.r < 60) continue;
        const spread = s.r * 0.045;
        const px = s.px + (R() - 0.5) * 2 * spread, py = s.py + (R() - 0.5) * 2 * spread;
        blob(px, py, 8 * (1 - t * 0.2) + R() * 4, `rgba(24,12,7,${0.24 * (1 - t * 0.35)})`);
      }
    });
    for (let i = 0; i < 150; i++) {
      const th = R() * 6.2832, rr = 110 + R() * 140;
      blob(C + Math.cos(th) * rr, C + Math.sin(th) * rr, 7 + R() * 9, `rgba(34,18,10,${0.12 + R() * 0.1})`);
    }

    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }
  const galFadeMats: { m: THREE.Material & { opacity: number }; max: number; core?: boolean }[] = [];
  {
    // the painted disk is the HERO — the photoreal galaxy itself. An additive
    // copy underneath makes it glow like the real thing; the texture on top
    // carries the structure.
    const galTex = galaxyTexture();
    const diskGeo = new THREE.CircleGeometry(52000 * LY, 96);
    const glowDisk = new THREE.Mesh(diskGeo, new THREE.MeshBasicMaterial({
      map: galTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }));
    galaxy.add(glowDisk);
    galFadeMats.push({ m: glowDisk.material as THREE.MeshBasicMaterial, max: 0.85, core: true });
    const disk = new THREE.Mesh(diskGeo, new THREE.MeshBasicMaterial({
      map: galTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    }));
    galaxy.add(disk);
    galFadeMats.push({ m: disk.material as THREE.MeshBasicMaterial, max: 1, core: true });
    // 3D grain: a faint stellar haze that gives the disk THICKNESS at angles —
    // deliberately dim and tiny so it never speckles over the painted structure
    const N = small ? 18000 : 30000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const cWarm = new THREE.Color(0xffe2bb), cBlue = new THREE.Color(0xb8ccff), cWhite = new THREE.Color(0xeae6f4), tmp = new THREE.Color();
    // grain placed ALONG the same spiral arms as the painted texture (in true
    // light-year scale), so the 3D sparkle reinforces the structure instead of
    // forming a fuzzy halo — plus a tight bulge. Disk radius ~50,000 ly.
    const DISK = 50000 * LY, GC = G_RC, GE = 940;
    for (let i = 0; i < N; i++) {
      const kind = Math.random();
      let gx = 0, gy = 0, gz = 0;
      if (kind < 0.16) {           // tight bulge/bar
        const r = Math.pow(Math.random(), 1.8) * 5000 * LY;
        const u = Math.random() * 2 - 1, th2 = Math.random() * 6.2832, rr = Math.sqrt(1 - u * u);
        gx = r * rr * Math.cos(th2) * 1.9; gy = r * rr * Math.sin(th2); gz = r * u * 0.5;
        tmp.copy(cWarm);
      } else {                     // on an arm: sample the shared log-spiral
        const arm = G_ARMS[(Math.random() * 4) | 0]!;
        const t = Math.pow(Math.random(), 0.8);
        const th = arm + t * G_SWEEP;
        const rTex = GC * Math.exp(G_K * t * G_SWEEP);     // texture-space radius
        const r = (rTex / GE) * DISK;                       // → light-years
        const spread = r * (0.03 + t * 0.08);
        gx = Math.cos(th) * r + (Math.random() - 0.5) * 2 * spread;
        gy = Math.sin(th) * r + (Math.random() - 0.5) * 2 * spread;
        gz = (Math.random() + Math.random() + Math.random() - 1.5) * (260 + 600 * Math.exp(-r / (9000 * LY))) * LY * 0.7;
        tmp.copy(cWarm).lerp(cBlue, Math.min(1, t * 1.4)).lerp(cWhite, 0.25);
        if (Math.random() < 0.05) tmp.setRGB(1, 0.5, 0.62);  // a few pink HII sparks
      }
      tmp.multiplyScalar(0.7);
      pos[i * 3] = gx; pos[i * 3 + 1] = gy; pos[i * 3 + 2] = gz;
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    gg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const grain = new THREE.Points(gg, new THREE.PointsMaterial({
      size: 1.1, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    galaxy.add(grain);
    galFadeMats.push({ m: grain.material as THREE.PointsMaterial, max: 0.32 });
    // the core's vertical glow (a galaxy glows brightest where it is deepest)
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color: 0xffe9c4, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0,
    }));
    core.scale.setScalar(9000 * LY);
    galaxy.add(core);
    galFadeMats.push({ m: core.material as THREE.SpriteMaterial, max: 0.75, core: true });
  }

  // Sagittarius A* — a REAL raymarched, gravitationally-lensed black hole.
  // Photons are integrated along the Schwarzschild geodesic on a single
  // camera-facing quad, so the accretion disk's far side genuinely bends up
  // and over the event horizon (the Interstellar/Gargantua look), with a
  // photon ring and Doppler beaming. Ported from the cosmic-map renderer.
  let bhUpdate: ((camKmX: number, camKmY: number, camKmZ: number) => void) | null = null;
  {
    const RS = 4e7;                          // event-horizon scale (km)
    const QUAD = RS * 42;                     // the quad that frames hole + lensed disk
    const BH_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
    const BH_FRAG = `
      precision highp float;
      varying vec2 vUv; uniform float uTime; uniform float uFade; uniform vec3 uViewDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.)); vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      vec4 disk(vec3 hit, vec3 vel){
        float r=length(hit.xz); float inR=2.2,outR=8.4; if(r<inR||r>outR) return vec4(0.);
        float t=(r-inR)/(outR-inR);
        vec3 hot=vec3(1.,.96,.92), mid=vec3(1.,.58,.20), cool=vec3(.78,.20,.06);
        vec3 col = t<.5 ? mix(hot,mid,t/.5) : mix(mid,cool,(t-.5)/.5);
        float omega=uTime*(1.1/(.5+r*.22)); float ca=cos(omega),sa=sin(omega);
        vec2 q=vec2(hit.x*ca-hit.z*sa, hit.x*sa+hit.z*ca);
        float n1=fbm(q*.85), n2=fbm(q*2.3+11.), n3=fbm(q*5.5+27.);
        float gas=n1*.6+n2*.32+n3*.2; float bright=(1.-t)*1.7+.3; bright*=.4+1.15*gas;
        float fil=pow(n2,2.2)+.6*pow(n3,3.); bright+=.7*fil*(1.-t*.7);
        vec3 orbit=normalize(vec3(-hit.z,0.,hit.x)); float dop=dot(orbit,normalize(-vel));
        bright*=clamp(.74+.6*dop,.22,1.9); col+=vec3(0.,.05,.18)*max(0.,dop);
        float edge=smoothstep(0.,.10,t)*smoothstep(0.,.16,1.-t);
        return vec4(col*bright, clamp(bright*edge,0.,1.));
      }
      void main(){
        vec2 uv=(vUv-.5)*2.;
        vec3 ro=uViewDir*13.; vec3 fwd=normalize(-ro);
        vec3 wup= abs(fwd.y)>.985 ? vec3(0.,0.,1.) : vec3(0.,1.,0.);
        vec3 rgt=normalize(cross(fwd,wup)); vec3 upv=cross(rgt,fwd);
        vec3 rd=normalize(uv.x*rgt+uv.y*upv+.95*fwd);
        vec3 p=ro, vv=rd; float dt=.16; vec4 acc=vec4(0.); bool horizon=false;
        for(int i=0;i<200;i++){
          float r=length(p); if(r<1.){horizon=true;break;} if(r>36.) break;
          vec3 h=cross(p,vv); vec3 a3=-1.5*dot(h,h)*p/pow(r,5.);
          vec3 nv=vv+a3*dt; vec3 np=p+nv*dt;
          if(p.y*np.y<0.){ float k=-p.y/(np.y-p.y); vec4 dc=disk(mix(p,np,k),nv);
            acc.rgb+=(1.-acc.a)*dc.rgb; acc.a+=(1.-acc.a)*dc.a; if(acc.a>.99) break; }
          vv=nv; p=np;
        }
        float a=acc.a; if(horizon) a=1.;
        a*=smoothstep(1.,.85,max(abs(uv.x),abs(uv.y)));
        gl_FragColor=vec4(acc.rgb, a*uFade);
      }`;
    const bhMat = new THREE.ShaderMaterial({
      vertexShader: BH_VERT, fragmentShader: BH_FRAG,
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uViewDir: { value: new THREE.Vector3(0, 0.32, 1).normalize() } },
      transparent: true, depthWrite: false, depthTest: false,
    });
    starMats.push(bhMat);                     // shares the cheap uTime tick
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(QUAD, QUAD), bhMat);
    quad.renderOrder = 999;                   // drawn last, over the galaxy core
    const g = new THREE.Group();
    g.add(quad);
    const sgr = addBody("Sagittarius A*", GAL_C, g, 0);
    sgr.kind = "star"; sgr.radius = RS; sgr.minD = QUAD * 0.6; sgr.dotK = 0.015;
    sgr.line = "Four million Suns crushed into a single point — the still centre our galaxy turns around, 26,660 light-years in.";
    if (sgr.dot) (sgr.dot.material as THREE.SpriteMaterial).color.set(0xffc890);
    bhUpdate = (cx, cy, cz) => {
      quad.quaternion.copy(camera.quaternion);                 // billboard
      const dx = cx - GAL_C.x, dy = cy - GAL_C.y, dz = cz - GAL_C.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      (bhMat.uniforms["uViewDir"]!.value as THREE.Vector3).set(dx / len, dy / len, dz / len);
      // only render when reasonably close — invisible (and uncomputed) far away
      const show = len < QUAD * 60;
      quad.visible = show;
      if (show) bhMat.uniforms["uFade"]!.value = Math.min(1, (QUAD * 60 - len) / (QUAD * 30));
    };
  }
  INFO["Sagittarius A*"] = { facts: [["Mass", "4.3 million Suns"], ["Distance", "26,660 light-years"], ["Imaged", "2022, by the EHT"], ["Nobel Prize", "2020"]], text: [
    "Every star you have flown past in this Atlas is falling around this point. At the exact centre of the Milky Way sits a black hole of four million solar masses — found by watching stars whip around an invisible nothing at thousands of kilometres per second, work that won the 2020 Nobel Prize, and finally photographed as a glowing ring in 2022.",
    "The Sun completes one circuit around it every 230 million years. The last time we were on this side of the orbit, the dinosaurs had not yet evolved.",
  ] };

  /* ---------- orbit lines (sampled true orbits, faint) ---------- */
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
    new THREE.MeshBasicMaterial({ map: T("stars_milky_way.jpg"), side: THREE.BackSide, depthWrite: false, transparent: true }),
  );
  (mw.material as THREE.MeshBasicMaterial).color.setScalar(0.42);   // a soft galactic backdrop; the REAL stars are the foreground
  mw.rotation.x = 60.2 * D2R;        // the galactic plane really is tilted ~60° to the ecliptic
  mw.rotation.y = 0.6;
  mw.renderOrder = -2;               // band first, real stars on top
  skyGroup.add(mw);
  // ---- the REAL sky: every catalogued star within 3,000 ly (HYG), at its true
  // 3D place. Not a backdrop painted on a dome but real suns in real positions —
  // so from Earth you see the true constellations, and from another star the sky
  // shifts with parallax. One GPU point cloud, coloured by real B–V temperature,
  // sized by real apparent magnitude; sun-centred, offset by the floating origin.
  // EXTREME LOD: the shader knows each star's ABSOLUTE magnitude and the real
  // distance to the camera, so it computes the star's APPARENT magnitude from
  // wherever you are — and draws only the ones bright enough to actually see.
  // From the Solar System that's the true naked-eye sky (~few thousand stars);
  // fly to another sun and a different set lights up (real parallax brightness).
  // The faint majority cost nothing — point size 0, never rasterised.
  const STAR_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 aColor; attribute float aMag;
uniform float uSizeK; uniform float uLimit;
varying vec3 vColor;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float distPc = max(length(mv.xyz) / 3.0856776e13, 1e-4);   // km → parsecs
  float absMag = aMag * 30.0 - 10.0;                          // decode absolute magnitude
  float appMag = absMag + 5.0 * (log(distPc) * 0.4342945 - 1.0);   // apparent mag from HERE
  float flux = pow(10.0, -0.4 * (appMag - 6.0));
  vColor = aColor * clamp(flux, 0.05, 1.7);
  float bright = clamp((6.2 - appMag) / 7.5, 0.0, 1.0);
  float vis = step(appMag, uLimit);                          // 1 if visible from here, else cull
  gl_PointSize = uSizeK * (0.55 + 2.3 * bright) * vis;       // size 0 → not drawn at all
  gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
  const STAR_FRAG = `#include <common>
#include <logdepthbuf_pars_fragment>
varying vec3 vColor;
void main(){
#include <logdepthbuf_fragment>
  float a = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.7);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;
  // ---- the star you FLY to: one reusable living star, re-skinned for whichever
  // catalogued sun you tap. (The ~40 hero stars keep their own detailed bodies;
  // a tap on one of those routes to it instead — see heroByCloudIdx.) ----
  const R_SUN = 695700;                          // km
  const flyGroup = livingStar(R_SUN, 0xfff0e0, 26);
  flyGroup.visible = false;
  const flyStar = addBody("✦", { x: 2e17, y: 0, z: 0 }, flyGroup, 0.00002);
  flyStar.kind = "star"; flyStar.labelMax = 6e7; flyStar.adhoc = true;
  if (flyStar.dot) flyStar.dot.visible = false;
  const STAR_R_SUN: Record<string, number> = { O: 8, B: 4, A: 1.8, F: 1.4, G: 1.0, K: 0.8, M: 0.45, L: 0.12, T: 0.1 };
  function estStarRadiusKm(spect: string): number {
    const s = (spect || "").trim(), c = s.charAt(0).toUpperCase();
    let r = STAR_R_SUN[c] ?? 1.0;
    if (c === "D" || /VII/.test(s)) r = 0.013;            // white dwarf
    else if (/IV/.test(s)) r *= 2.4;                       // subgiant
    else if (/III/.test(s)) r = (STAR_R_SUN[c] ?? 1) * 18; // giant
    else if (/II/.test(s)) r = (STAR_R_SUN[c] ?? 1) * 45;  // bright giant
    else if (/Ia|Iab|Ib/.test(s)) r = (STAR_R_SUN[c] ?? 1) * 110;  // supergiant
    return Math.max(0.01, r) * R_SUN;
  }
  function skinFlyStar(col: number, radiusKm: number, name: string, line: string) {
    const c = new THREE.Color(col), hot = c.clone().lerp(new THREE.Color(0xffffff), 0.55);
    for (const m of flyGroup.userData["lodMats"] as THREE.ShaderMaterial[]) {
      (m.uniforms["uCol"]!.value as THREE.Color).copy(c);
      (m.uniforms["uHot"]!.value as THREE.Color).copy(hot);
    }
    ((flyGroup.userData["halo"] as THREE.Sprite).material as THREE.SpriteMaterial).color.copy(c);
    flyGroup.scale.setScalar(radiusKm / R_SUN);
    flyGroup.userData["starR"] = radiusKm;
    flyGroup.visible = true;
    flyStar.radius = radiusKm; flyStar.minD = radiusKm * 1.6;
    flyStar.name = name; flyStar.line = line; flyStar.label.textContent = name;
  }
  let heroByCloudIdx: Map<number, string> | null = null;
  let nameToCloud: Int32Array | null = null;     // names-table index → cloud star index, for search

  // shared with the picker so any of the 108k stars can be studied (positions
  // and metadata are index-aligned, built from the same catalogue pass)
  let bubblePos: Float32Array | null = null;
  let bubbleCol: Uint8Array | null = null;
  let starMeta: DataView | null = null;
  let starJson: { spect: string[]; con: string[]; names: string[] } | null = null;
  let starN = 0;
  const STAR_LIMIT = 6.6;                        // naked-eye-ish magnitude cutoff (a rich, uncluttered sky)
  const starUniforms = { uSizeK: { value: (small ? 1.5 : 2.0) * (devicePixelRatio || 1) }, uLimit: { value: STAR_LIMIT } };
  Promise.all([
    fetch("/stars/bubble_pos.f32").then(r => r.arrayBuffer()),
    fetch("/stars/bubble_col.u8").then(r => r.arrayBuffer()),
    fetch("/stars/bubble_meta.bin").then(r => r.arrayBuffer()),
    fetch("/stars/bubble_meta.json").then(r => r.json()),
  ]).then(([pb, cb, mb, mj]) => {
    const positions = new Float32Array(pb), colU8 = new Uint8Array(cb);
    bubblePos = positions; bubbleCol = colU8; starMeta = new DataView(mb as ArrayBuffer); starJson = mj as typeof starJson; starN = positions.length / 3;
    // map each detailed hero star to its catalogue point, so tapping that point
    // flies to the real body (its true surface) rather than a generic fly-star
    heroByCloudIdx = new Map();
    for (const b of bodies) {
      if (b.kind !== "star" || b.adhoc || b.name === "Sagittarius A*" || b.name === "Sun") continue;
      const bl = Math.hypot(b.pos.x, b.pos.y, b.pos.z); if (bl < 1) continue;
      const bx = b.pos.x / bl, by = b.pos.y / bl, bz = b.pos.z / bl;
      // a hero and its catalogue twin share a DIRECTION (same RA/Dec) even when
      // the two catalogues disagree on distance — so match the brightest cloud
      // star within ~0.6° of the hero's line of sight, not the nearest in 3D.
      let bi = -1, bestMag = 99;
      for (let i = 0; i < starN; i++) {
        const px = positions[i * 3]!, py = positions[i * 3 + 1]!, pz = positions[i * 3 + 2]!;
        const pl = Math.hypot(px, py, pz) || 1;
        if ((px * bx + py * by + pz * bz) / pl < 0.99994) continue;     // outside the cone
        const mag = starMeta!.getInt16(i * 16 + 4, true) / 100;
        if (mag < bestMag) { bestMag = mag; bi = i; }
      }
      if (bi >= 0) heroByCloudIdx.set(bi, b.name);
    }
    // index every NAMED star so search can find it among the 108k
    nameToCloud = new Int32Array((mj as typeof starJson)!.names.length).fill(-1);
    for (let i = 0; i < starN; i++) {
      const ni = (starMeta as DataView).getUint16(i * 16 + 12, true);
      if (ni !== 65535) nameToCloud[ni] = i;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const ib = new THREE.InterleavedBuffer(colU8, 4);
    geo.setAttribute("aColor", new THREE.InterleavedBufferAttribute(ib, 3, 0, true));
    geo.setAttribute("aMag", new THREE.InterleavedBufferAttribute(ib, 1, 3, true));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3e16);
    const cloud = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: starUniforms, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    cloud.frustumCulled = false;
    cloud.renderOrder = -1;                            // over the band, under everything solid
    scene.add(cloud);
    onFrame(({ camKm }) => cloud.position.set(-camKm.x, -camKm.y, -camKm.z));
  }).catch(() => { /* the sky simply stays dark if the catalogue can't load */ });

  // ---- the constellation figures: the 88 patterns humans drew on this sky ----
  // They are an Earth-bound illusion — Orion is only Orion from here — so they
  // belong to ONE place: standing on Earth, looking up. In free flight they are
  // hidden (they only cluttered the view); the planetarium turns them on.
  let earthView = false;                          // true only while standing on Earth, looking up
  let conLines: THREE.LineSegments | null = null;
  const conMat = new THREE.LineBasicMaterial({ color: 0x8198cc, transparent: true, opacity: 0, depthWrite: false });
  fetch("/stars/constellations.f32").then(r => r.arrayBuffer()).then(buf => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3e16);
    conLines = new THREE.LineSegments(g, conMat);
    conLines.frustumCulled = false; conLines.renderOrder = -1;
    conLines.visible = false;
    scene.add(conLines);
  }).catch(() => { /* figures are optional grace */ });
  onFrame(({ camKm }) => {
    if (!conLines) return;
    conLines.position.set(-camKm.x, -camKm.y, -camKm.z);
    conMat.opacity = earthView ? 0.42 : 0;
    conLines.visible = earthView;
  });

  /* ===================== THE EARTH PLANETARIUM =====================
     Stand on the real Earth, at the visitor's own location, and look up at
     tonight's actual sky. The observer's zenith and the cardinal directions are
     derived from Earth's already-rigorous orientation (GMST + obliquity), so the
     horizon, the slowly-turning stars and the constellations are all correct for
     THIS place and THIS instant. A random night-landscape dome rings the horizon;
     N/E/S/W and the constellation names float as liquid-jewel tags. */
  let obsLat = 28.61, obsLon = 77.21, obsName = "a default sky", obsExact = false;
  const zenith = new THREE.Vector3(0, 1, 0), north = new THREE.Vector3(0, 0, 1), east = new THREE.Vector3(1, 0, 0);
  const lookDir = new THREE.Vector3(0, 0, 1);
  const _zb = new THREE.Vector3(), _ncp = new THREE.Vector3();
  function computeHorizon(): void {
    if (!earthBody) return;
    const phi = obsLat * D2R, lam = obsLon * D2R, cphi = Math.cos(phi);
    _zb.set(cphi * Math.cos(lam), Math.sin(phi), -cphi * Math.sin(lam));     // zenith in Earth's body frame
    zenith.copy(_zb).applyQuaternion(earthBody.mesh.quaternion).normalize(); // → world
    _ncp.set(0, 1, 0).applyQuaternion(earthBody.mesh.quaternion).normalize();// north celestial pole
    north.copy(_ncp).addScaledVector(zenith, -_ncp.dot(zenith)).normalize(); // true north along the horizon
    east.crossVectors(north, zenith).normalize();                            // E = N × up
  }

  // the ground: a random night-landscape dome. Sky half is transparent (the real
  // stars show through); the opaque ground is drawn over whatever lies below the
  // horizon (depthTest off → it always wins beneath the skyline).
  const PANOS = ["mountains", "forest", "desert", "city", "plains"];
  const domeMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false, opacity: 0 });
  const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(5e7, 64, 40), domeMat);
  domeMesh.renderOrder = 3; domeMesh.frustumCulled = false; domeMesh.visible = false;
  scene.add(domeMesh);
  const _basis = new THREE.Matrix4();
  function pickPano(): void { domeMat.map = T(`panorama/pano-${PANOS[(Math.random() * PANOS.length) | 0]}.png`); domeMat.needsUpdate = true; }
  pickPano();

  // liquid-jewel tags (cardinals + constellation names) live in the labels layer
  const stageEl = (canvas.parentElement ?? canvas) as HTMLElement;
  function tag(cls: string, txt: string): HTMLElement { const e = document.createElement("div"); e.className = cls; e.textContent = txt; e.style.opacity = "0"; labels.appendChild(e); return e; }
  const cardinals: { v: THREE.Vector3; el: HTMLElement }[] = [
    { v: north, el: tag("at-card", "N") }, { v: east, el: tag("at-card", "E") },
    { v: new THREE.Vector3(), el: tag("at-card", "S") }, { v: new THREE.Vector3(), el: tag("at-card", "W") },
  ];
  let conTags: { dir: THREE.Vector3; el: HTMLElement }[] | null = null;
  function buildConLabels(): void {
    if (conTags || !bubblePos || !starMeta || !starJson) return;
    const acc: { x: number; y: number; z: number; n: number }[] = Array.from({ length: 88 }, () => ({ x: 0, y: 0, z: 0, n: 0 }));
    for (let i = 0; i < starN; i++) {
      const ci = starMeta.getUint8(i * 16 + 8); const a = acc[ci]!;
      const px = bubblePos[i * 3]!, py = bubblePos[i * 3 + 1]!, pz = bubblePos[i * 3 + 2]!;
      const l = Math.hypot(px, py, pz) || 1; a.x += px / l; a.y += py / l; a.z += pz / l; a.n++;
    }
    conTags = [];
    for (let c = 0; c < 88; c++) {
      const a = acc[c]!; if (a.n < 6) continue;
      conTags.push({ dir: new THREE.Vector3(a.x, a.y, a.z).normalize(), el: tag("at-con-label", starJson.con[c] || "") });
    }
  }

  // the planetarium HUD + the two doorways (step outside / back to space)
  const skyHud = document.createElement("div"); skyHud.className = "at-sky"; skyHud.hidden = true;
  skyHud.innerHTML = `<p class="at-sky-k">Your sky · tonight</p><h2 class="at-sky-place" id="at-sky-place">—</h2><p class="at-sky-time mono" id="at-sky-time">—</p><p class="at-sky-hint">Drag to look around · tap a star to study it</p>`;
  stageEl.appendChild(skyHud);
  const skyPlace = skyHud.querySelector<HTMLElement>("#at-sky-place")!, skyTime = skyHud.querySelector<HTMLElement>("#at-sky-time")!;
  const skyHint = skyHud.querySelector<HTMLElement>(".at-sky-hint")!;
  const groundBtn = document.createElement("button"); groundBtn.type = "button"; groundBtn.className = "at-ground"; groundBtn.innerHTML = `Step outside &mdash; tonight's sky&nbsp;&nbsp;&#8595;`; groundBtn.style.display = "none"; stageEl.appendChild(groundBtn);
  const leaveBtn = document.createElement("button"); leaveBtn.type = "button"; leaveBtn.className = "at-leave"; leaveBtn.innerHTML = `&#8593;&nbsp;&nbsp;Back to space`; leaveBtn.hidden = true; stageEl.appendChild(leaveBtn);
  const fade = document.createElement("div"); fade.className = "at-fade"; stageEl.appendChild(fade);
  function fadeThen(cb: () => void): void { fade.classList.add("on"); setTimeout(() => { cb(); fade.classList.remove("on"); }, 620); }

  async function resolvePlace(): Promise<void> {
    const ns = obsLat >= 0 ? "N" : "S", ew = obsLon >= 0 ? "E" : "W";
    obsName = `${Math.abs(obsLat).toFixed(1)}°${ns}, ${Math.abs(obsLon).toFixed(1)}°${ew}`;
    try {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${obsLat}&longitude=${obsLon}&localityLanguage=en`);
      if (r.ok) { const j = await r.json() as { city?: string; locality?: string; principalSubdivision?: string; countryName?: string };
        const place = [j.city || j.locality, j.principalSubdivision, j.countryName].filter(Boolean).slice(0, 2).join(", ");
        if (place) obsName = place;
      }
    } catch { /* coordinates are a fine fallback */ }
    skyPlace.textContent = obsName;
    skyHint.textContent = obsExact ? "Drag to look around · tap a star to study it" : "A default sky — allow location for your own";
  }

  function enterPlanetarium(): void {
    if (earthView) return;
    buildConLabels(); pickPano();
    fadeThen(() => {
      earthView = true;
      focusOn(earth, false);
      tgtYaw = yaw = 0.0; tgtPitch = pitch = 0.62;          // look up toward the south-ish sky
      domeMesh.visible = true;
      skyHud.hidden = false; leaveBtn.hidden = false; groundBtn.style.display = "none";
      requestAnimationFrame(() => { skyHud.classList.add("in"); leaveBtn.classList.add("in"); });
      try { playClick(); } catch { /* off */ }
    });
    void resolvePlace();
  }
  function exitPlanetarium(): void {
    if (!earthView) return;
    skyHud.classList.remove("in"); leaveBtn.classList.remove("in");
    fadeThen(() => {
      earthView = false;
      domeMesh.visible = false; domeMat.opacity = 0;
      skyHud.hidden = true; leaveBtn.hidden = true;
      for (const c of cardinals) c.el.style.opacity = "0";
      if (conTags) for (const t of conTags) t.el.style.opacity = "0";
      tgtDist = earth.radius * 5; tgtPitch = 0.22;
      focusOn(earth, false);
      try { playClick(); } catch { /* off */ }
    });
  }
  groundBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      groundBtn.classList.add("loading");
      navigator.geolocation.getCurrentPosition(
        pos => { obsLat = pos.coords.latitude; obsLon = pos.coords.longitude; obsExact = true; groundBtn.classList.remove("loading"); enterPlanetarium(); },
        () => { obsExact = false; groundBtn.classList.remove("loading"); enterPlanetarium(); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 6e5 },
      );
    } else enterPlanetarium();
  });
  leaveBtn.addEventListener("click", exitPlanetarium);
  addEventListener("keydown", e => { if (e.key === "Escape" && earthView) exitPlanetarium(); });

  // per-frame: orient the dome to the live horizon, place the tags, run the HUD clock
  const _p = new THREE.Vector3();
  let lastClock = "";
  onFrame(() => {
    // the doorway shows whenever you're resting at Earth and not already inside
    groundBtn.style.display = (!earthView && focus === earth) ? "" : "none";
    if (!earthView) return;
    computeHorizon();
    cardinals[2]!.v.copy(north).negate(); cardinals[3]!.v.copy(east).negate();   // S, W
    _basis.makeBasis(east, zenith, north); domeMesh.quaternion.setFromRotationMatrix(_basis);
    domeMat.opacity = Math.min(1, domeMat.opacity + 0.04);

    const w = canvas.clientWidth, h = canvas.clientHeight;
    const place = (dir: THREE.Vector3, el: HTMLElement, minAlt: number, base: number): void => {
      const alt = dir.dot(zenith);
      _p.copy(dir).multiplyScalar(1e9); _p.project(camera);
      const sx = (_p.x * 0.5 + 0.5) * w, sy = (-_p.y * 0.5 + 0.5) * h;
      if (alt < minAlt || _p.z > 1 || sx < -60 || sx > w + 60 || sy < 60 || sy > h + 30) { el.style.opacity = "0"; el.style.pointerEvents = "none"; }
      else { el.style.opacity = String(base); el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`; }
    };
    for (const c of cardinals) place(c.v, c.el, -0.18, 0.92);
    if (conTags) for (const t of conTags) place(t.dir, t.el, 0.12, 0.62);

    if (skyTime) { const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); if (t !== lastClock) { skyTime.textContent = `${t} · local`; lastClock = t; } }
  });

  /* ---------- the floating-origin camera ---------- */
  let focus = earth;
  let prevFocus = earth;
  let focusBlend = 1;                          // 0→1 while flying between bodies
  let distKm = earth.radius * 5;
  let yaw = 0.6, pitch = 0.22;
  let tgtDist = distKm, tgtYaw = yaw, tgtPitch = pitch;

  function focusBody(n: string, click = false) {
    const b = bodies.find(x => x.name === n);
    if (b) focusOn(b, click);
  }
  function focusOn(b: Body, click = false) {
    if (b === focus && !b.adhoc) return;        // re-tap of a fixed body: ignore; the fly-star always re-targets
    prevFocus = focus; focus = b; focusBlend = 0;
    tgtDist = Math.max(b.radius * (b.arriveK ?? 5), b.minD * 2);
    // arrive on the DAY side: come in from the Sun's direction (offset a
    // little for three-quarter light), never into a black hemisphere
    const sl = Math.hypot(b.pos.x, b.pos.y, b.pos.z);
    if (sl > 1) {
      tgtYaw = Math.atan2(-b.pos.x, -b.pos.z) + 0.5;
      tgtPitch = Math.min(0.5, Math.max(-0.5, Math.asin(-b.pos.y / sl))) + 0.14;
      // ringed worlds: come in well ABOVE the ring plane so the rings open
      // (the day-side approach otherwise lands nearly edge-on)
      if (b.arrivePitch !== undefined) tgtPitch = b.arrivePitch;
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
  addEventListener("keydown", e => { if (e.key === "Escape") { sheet.classList.remove("open"); closeConsole(); } });

  /* ---------- the navigation console: a drill-down chart ----------
     Root → category → (for the exoplanets) system → planets. Only one level
     shows at a time, so the Atlas scales to hundreds of bodies without ever
     becoming an endless scroll. Search flattens across everything. */
  const DWARFS = ["Ceres", "Vesta", "Pluto", "Haumea", "Makemake", "Eris"];
  const MOON_NAMES = ["Moon", "Io", "Europa", "Ganymede", "Callisto", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Iapetus", "Triton", "Charon"];
  interface Cat { label: string; sub: string; match: (b: Body) => boolean; systems?: boolean; sort?: "dist" | "orbit"; }
  const CATS: Cat[] = [
    { label: "The Sun & its planets", sub: "Sol — eight worlds", match: b => !b.kind && ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].includes(b.name) },
    { label: "Moons", sub: "of Earth, the giants & Pluto", match: b => MOON_NAMES.includes(b.name) },
    { label: "Dwarf planets & asteroids", sub: "Ceres, Vesta, the far dwarfs", match: b => DWARFS.includes(b.name) },
    { label: "Near-Earth asteroids", sub: "the rocks we've flown to", match: b => ["Bennu", "Ryugu", "Eros", "Itokawa"].includes(b.name) },
    { label: "The machines", sub: "humanity's emissaries", match: b => ["Hubble", "JWST", "New Horizons", "Voyager 2", "Voyager 1"].includes(b.name) },
    { label: "The wanderers", sub: "comets, drifting in", match: b => b.name.includes("Comet") || b.name.includes("Bopp") },
    { label: "TRAPPIST-1", sub: "a second sun, seven worlds", match: b => b.system === "TRAPPIST-1", systems: true },
    { label: "Exoplanet systems", sub: "worlds around other suns", match: b => b.kind === "star" && !!b.foreign && b.system !== "TRAPPIST-1", systems: true, sort: "dist" },
    { label: "The stars", sub: "the solar neighbourhood", match: b => b.kind === "star" && !b.foreign && !b.adhoc && b.name !== "Sagittarius A*", sort: "dist" },
    { label: "The galaxy", sub: "the heart of the Milky Way", match: b => b.name === "Sagittarius A*" },
  ];
  type NavView = { kind: "root" } | { kind: "cat"; i: number } | { kind: "sys"; star: string; from: number };
  const TRAPPIST_CAT = CATS.findIndex(c => c.label === "TRAPPIST-1");
  const EXO_CAT = CATS.findIndex(c => c.label === "Exoplanet systems");
  // open the console where you ALREADY are — inside a system it shows that
  // system's worlds, so you can hop between siblings without restarting at the top.
  const contextView = (): NavView => {
    const sys = focus.system;
    if (sys) return { kind: "sys", star: sys, from: sys === "TRAPPIST-1" ? TRAPPIST_CAT : EXO_CAT };
    const ci = CATS.findIndex(c => !c.systems && c.match(focus));
    return ci >= 0 ? { kind: "cat", i: ci } : { kind: "root" };
  };
  let cnav: NavView = { kind: "root" };
  const conBack = consoleEl.querySelector<HTMLElement>(".at-con-back")!;
  const conTitle = consoleEl.querySelector<HTMLElement>(".at-con-title")!;

  const conDistance = (b: Body): string => fmtDist(Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z));
  const dotColorOf = (b: Body): string => b.dot ? `#${(b.dot.material as THREE.SpriteMaterial).color.getHexString()}` : "#f2e6c4";
  const sysDist = (b: Body): number => Math.hypot(b.pos.x, b.pos.y, b.pos.z);
  const itemRow = (b: Body, sub?: string): string =>
    `<button type="button" class="at-con-item${b === focus ? " on" : ""}" data-n="${b.name}">` +
    `<i style="--c:${dotColorOf(b)}"></i><span>${b.name}</span><b>${sub ?? conDistance(b)}</b></button>`;
  const catRow = (label: string, sub: string, attr: string): string =>
    `<button type="button" class="at-con-cat" ${attr}><span class="at-cat-txt"><span class="at-cat-l">${label}</span><span class="at-cat-s">${sub}</span></span><span class="at-cat-chev">&#8250;</span></button>`;

  function wireRows() {
    conList.querySelectorAll<HTMLButtonElement>(".at-con-item").forEach(btn =>
      btn.addEventListener("click", () => {
        if (btn.dataset["star"] !== undefined) { flyToStar(+btn.dataset["star"]!); closeConsole(); }   // a catalogue-star search hit
        else {
          focusBody(btn.dataset["n"]!, true);                          // a body — fly, but STAY in the menu so you can hop
          if (conSearch.value) { conSearch.value = ""; cnav = contextView(); }   // from search → land in its system/group
          renderConsole();
        }
      }));
    conList.querySelectorAll<HTMLButtonElement>(".at-con-cat").forEach(btn =>
      btn.addEventListener("click", () => {
        try { playClick(); } catch (_e) { /* off */ }
        if (btn.dataset["cat"]) cnav = { kind: "cat", i: +btn.dataset["cat"]! };
        else if (btn.dataset["sys"]) cnav = { kind: "sys", star: btn.dataset["sys"]!, from: cnav.kind === "cat" ? cnav.i : 7 };
        renderConsole();
      }));
  }
  function setHead(title: string, back: null | (() => void)) {
    conTitle.textContent = title;
    if (back) { conBack.removeAttribute("hidden"); conBack.onclick = () => { try { playClick(); } catch (_e) { /* off */ } back(); }; }
    else { conBack.setAttribute("hidden", ""); conBack.onclick = null; }
  }
  function renderConsole() {
    const q = conSearch.value.trim().toLowerCase();
    if (q) {                                   // search flattens across planets, systems AND the star catalogue
      const hits = bodies.filter(b => !b.adhoc && b.name.toLowerCase().includes(q)).sort((a, b) =>
        Math.hypot(a.pos.x - camKm.x, a.pos.y - camKm.y, a.pos.z - camKm.z) - Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z));
      let html = hits.slice(0, 30).map(b => itemRow(b, b.system && b.system !== b.name ? b.system : undefined)).join("");
      // the 108k catalogue: every NAMED star is findable by name
      if (nameToCloud && starJson && starMeta && q.length >= 2) {
        const names = starJson.names; let n = 0;
        for (let ni = 0; ni < names.length && n < 50; ni++) {
          if (!names[ni]!.toLowerCase().includes(q)) continue;
          const ci = nameToCloud[ni]!; if (ci < 0 || heroByCloudIdx?.has(ci)) continue;   // skip those already shown as bodies
          const distLy = starMeta.getUint16(ci * 16 + 6, true) / 10;
          html += `<button type="button" class="at-con-item" data-star="${ci}"><i style="--c:#cfe0ff"></i><span>${names[ni]}</span><b>${distLy.toFixed(0)} ly</b></button>`;
          n++;
        }
      }
      conList.innerHTML = html || `<div class="at-con-none">Nothing in the Atlas by that name — yet.</div>`;
      setHead("Search", null); wireRows(); return;
    }
    if (cnav.kind === "root") {
      conList.innerHTML = CATS.map((c, i) => bodies.some(c.match) ? catRow(c.label, c.sub, `data-cat="${i}"`) : "").join("");
      setHead("Destinations", null); wireRows(); return;
    }
    if (cnav.kind === "cat") {
      const c = CATS[cnav.i]!;
      const back = () => { cnav = { kind: "root" }; renderConsole(); };
      if (c.systems) {
        const stars = bodies.filter(c.match).sort((a, b) => sysDist(a) - sysDist(b));
        if (c.label === "TRAPPIST-1") {        // single system → straight to its planets
          cnav = { kind: "sys", star: "TRAPPIST-1", from: cnav.i }; renderConsole(); return;
        }
        conList.innerHTML = stars.map(s => {
          const np = bodies.filter(b => b.system === s.name && b !== s).length;
          return catRow(s.name, `${np} planet${np !== 1 ? "s" : ""} · ${conDistance(s)}`, `data-sys="${s.name}"`);
        }).join("");
        setHead(c.label, back); wireRows(); return;
      }
      const members = bodies.filter(c.match);
      if (c.sort === "dist") members.sort((a, b) => sysDist(a) - sysDist(b));
      conList.innerHTML = members.map(b => itemRow(b)).join("");
      setHead(c.label, back); wireRows(); return;
    }
    // system view: the star, then its planets by orbit
    const v = cnav;
    if (v.kind !== "sys") return;
    const star = bodies.find(b => b.name === v.star);
    const planets = bodies.filter(b => b.system === v.star && b !== star);
    const list = star ? [star, ...planets] : planets;
    conList.innerHTML = list.map(b => itemRow(b, b === star ? "the star" : conDistance(b))).join("");
    setHead(v.star, () => { cnav = { kind: "cat", i: v.from }; renderConsole(); });
    wireRows();
  }
  const buildConsole = (_f?: string) => renderConsole();
  function openConsole() {
    sheet.classList.remove("open");      // one panel at a time
    conSearch.value = "";
    cnav = contextView();                // open where you ARE, not always the top
    renderConsole();
    consoleEl.removeAttribute("hidden");
    requestAnimationFrame(() => consoleEl.classList.add("open"));
    if (matchMedia("(hover: hover)").matches) conSearch.focus();
  }
  function closeConsole() { consoleEl.classList.remove("open"); }
  nav.addEventListener("click", () => {
    if (consoleEl.classList.contains("open")) closeConsole(); else { openConsole(); try { playClick(); } catch (_e) { /* off */ } }
  });
  conClose.addEventListener("click", closeConsole);
  conSearch.addEventListener("input", () => buildConsole(conSearch.value));
  canvas.addEventListener("pointerdown", closeConsole);

  // the shared context object passed to every frame hook (mutated in place
  // each frame to avoid per-frame allocation)
  const frameCtx: FrameCtx = { dt: 0, nowMs: 0, simDays: 0, simDate: now, camKm, distKm: 0, focus };

  /* ---------- per-frame subsystems ----------
     Each block below is one self-contained update, registered as a hook.
     They run every frame after the bodies are placed; none of them touch
     the render loop or each other. Adding a galaxy, system or effect means
     adding another onFrame(...) here — nothing else changes. */

  // the Sun is the system's beacon: its glow grows with range so it never
  // fades to a dim dot, however far out you fly
  onFrame(({ camKm }) => {
    const ds = Math.hypot(camKm.x, camKm.y, camKm.z);
    glow.scale.setScalar(Math.max(RADII["Sun"]! * 6.5, ds * 0.05));
    sunLight.position.set(-camKm.x, -camKm.y, -camKm.z);
  });

  // orbit lines (inner system) + the belts/Oort (outer) — placed in the
  // floating-origin frame, faded out near a world and gone far past the system
  onFrame(({ camKm, distKm }) => {
    orbitGroup.position.set(-camKm.x, -camKm.y, -camKm.z);
    outerGroup.position.set(-camKm.x, -camKm.y, -camKm.z);
    const t01 = Math.min(1, Math.max(0, (distKm - 8e5) / 7e6));
    orbitMat.opacity = 0.16 * t01 * t01 * (3 - 2 * t01);
    orbitGroup.visible = orbitMat.opacity > 0.004 && distKm < 2e10;
    // the belts + Oort belong to the Sun: fade the Oort shell out as you leave
    // the neighbourhood (so it never becomes a ball hanging at the Sun from
    // another star), and drop the whole outer layer once you're truly away.
    const sunDist = Math.hypot(camKm.x, camKm.y, camKm.z);
    if (oortMat) oortMat.opacity = 0.55 * Math.min(1, Math.max(0, (2.8e13 - sunDist) / 1.3e13));
    outerGroup.visible = distKm > 4e7 && sunDist < 3e13;
  });

  // the galaxy emerges as you rise above the neighbourhood; the camera-glued
  // panorama hands over to the real 3D structure; the core retreats up close
  onFrame(({ camKm }) => {
    galaxy.position.set(GAL_C.x - camKm.x, GAL_C.y - camKm.y, GAL_C.z - camKm.z);
    const sd = Math.hypot(camKm.x, camKm.y, camKm.z);
    const g01 = Math.min(1, Math.max(0, (sd - 6e15) / 7.4e16));
    const gFade = g01 * g01 * (3 - 2 * g01);
    galaxy.visible = gFade > 0.003;
    if (galaxy.visible) {
      const cd = Math.hypot(camKm.x - GAL_C.x, camKm.y - GAL_C.y, camKm.z - GAL_C.z);
      const c01 = Math.min(1, Math.max(0, (cd - 1200 * LY) / (7000 * LY)));
      const coreFade = c01 * c01 * (3 - 2 * c01);
      for (const f of galFadeMats) f.m.opacity = gFade * f.max * (f.core ? coreFade : 1);
    }
    (mw.material as THREE.MeshBasicMaterial).opacity = 1 - gFade;
    mw.visible = gFade < 0.985;
  });

  // the lensed black hole: billboard the quad + feed it the view direction
  onFrame(({ camKm }) => bhUpdate?.(camKm.x, camKm.y, camKm.z));

  // the living Earth's day/night terminator tracks the true Sun direction
  onFrame(() => {
    if (!earthMat || !earthBody) return;
    const ep = earthBody.pos, el = Math.hypot(ep.x, ep.y, ep.z) || 1;
    (earthMat.uniforms["sunDir"]!.value as THREE.Vector3).set(-ep.x / el, -ep.y / el, -ep.z / el);
  });

  // every foreign system (TRAPPIST + the 22 exoplanet hosts): its star lights
  // its own worlds and shows its own orbit rings, and only ONE star lights the
  // scene at a time (our point lights have no inverse-square falloff)
  let shownOrbits: THREE.Group | null = null;
  onFrame(({ camKm }) => {
    if (!trLight) return;
    // find the nearest foreign sun (TRAPPIST or any exoplanet host); if the
    // camera is inside that system, the shared light becomes that star —
    // right colour, right place — and our Sun stands down
    let best: { pos: Vec3; col: number; span: number; orbits?: THREE.Group } | null = null, bestD = Infinity;
    for (const fs of foreignSuns) {
      const d = Math.hypot(camKm.x - fs.pos.x, camKm.y - fs.pos.y, camKm.z - fs.pos.z);
      if (d < bestD) { bestD = d; best = fs; }
    }
    const inForeign = best !== null && bestD < best.span;
    if (inForeign && best) {
      trLight.position.set(best.pos.x - camKm.x, best.pos.y - camKm.y, best.pos.z - camKm.z);
      trLight.color.set(best.col);
      trLight.intensity = 3.4;
    } else {
      trLight.intensity = 0;
    }
    sunLight.intensity = inForeign ? 0 : 2.6;
    // each system's orbit rings show only while you're inside it — the nearest
    // system's rings are placed + revealed, any previously-shown ones hidden
    const want = inForeign && best ? best.orbits ?? null : null;
    if (want !== shownOrbits) { if (shownOrbits) shownOrbits.visible = false; shownOrbits = want; }
    if (want && best) { want.position.set(best.pos.x - camKm.x, best.pos.y - camKm.y, best.pos.z - camKm.z); want.visible = true; }
  });

  function frame(nowMs: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((nowMs - last) / 1000, 0.05); last = nowMs;

    // the stars breathe — granulation, plage and prominences all animate
    for (const m of starMats) (m.uniforms["uTime"] as { value: number }).value = nowMs * 0.001;

    // time flows — at whatever rate the visitor chose — and the worlds move.
    // "Now" is the TRUE present, locked to the wall clock every frame (so it can
    // never drift, and tapping Now after a fast-forward snaps the whole system
    // back to this instant). Any other speed accumulates from wherever we are.
    if (speed === 1) simMs = Date.now();
    else simMs += dt * 1000 * speed;
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

    if (earthView && earthBody) {
      // standing on the surface: the camera sits at the observer's feet and is
      // free to look around the real sky (yaw = azimuth, pitch = altitude)
      computeHorizon();
      const ca = Math.cos(pitch), saa = Math.sin(pitch);
      lookDir.copy(north).multiplyScalar(ca * Math.cos(yaw)).addScaledVector(east, ca * Math.sin(yaw)).addScaledVector(zenith, saa).normalize();
      camKm.x = earthBody.pos.x + zenith.x * earthBody.radius;
      camKm.y = earthBody.pos.y + zenith.y * earthBody.radius;
      camKm.z = earthBody.pos.z + zenith.z * earthBody.radius;
      camera.position.set(0, 0, 0);
      camera.up.set(zenith.x, zenith.y, zenith.z);
      camera.lookAt(lookDir.x, lookDir.y, lookDir.z);
    } else {
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      camKm.x = fx + distKm * cp * Math.sin(yaw);
      camKm.y = fy + distKm * sp;
      camKm.z = fz + distKm * cp * Math.cos(yaw);
      // floating origin: camera sits at 0; the world is placed relative to it
      camera.position.set(0, 0, 0);
      camera.up.set(0, 1, 0);
      camera.lookAt(fx - camKm.x, fy - camKm.y, fz - camKm.z);
    }
    for (const b of bodies) {
      b.mesh.position.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      if (b.spin) b.mesh.rotation.y += b.spin * dt * 60;
      const cl = (b.mesh as THREE.Object3D & { userData: { clouds?: THREE.Mesh } }).userData["clouds"];
      if (cl) cl.rotation.y += 0.000016 * dt * 60;
      // a star's halo fades as you approach, so the boiling surface owns the view
      const sh = b.mesh.userData["halo"] as THREE.Sprite | undefined;
      if (sh) {
        const sr = b.mesh.userData["starR"] as number;
        const ds = Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
        (sh.material as THREE.SpriteMaterial).opacity = Math.min(1, Math.max(0.06, (ds - sr * 6) / (sr * 40)));
        // LOD: the costly fbm surface + flare shaders render only when the
        // star is big enough on screen to read as a disk — a vast saving when
        // dozens of stars are tiny points across the neighbourhood view
        const lod = b.mesh.userData["lod"] as THREE.Mesh[] | undefined;
        if (lod) { const show = sr / ds > 0.0012; if (lod[0]!.visible !== show) { lod[0]!.visible = show; lod[1]!.visible = show; } }
      }
      if (b.dot) {
        // hold every world at a minimum apparent size; hand over to the real
        // disk as you get close enough for it to be visibly round
        const d = Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
        const ang = b.radius / d;                       // ~radians subtended
        const mat = b.dot.material as THREE.SpriteMaterial;
        const planetRetired = b.kind !== "star" && b.name !== "Sun" && !b.foreign && Math.hypot(camKm.x, camKm.y, camKm.z) > 2.5e11;
        // drifting objects (comets, craft) keep their point past labelMax — only
        // their NAME hides — so they drift visibly without cluttering with tags
        const dotCulled = b.labelMax !== undefined && !b.drift && d > b.labelMax;
        if (ang > 0.004 || planetRetired || dotCulled) { mat.opacity = 0; }
        else {
          // a planet must OUTSHINE the background stars — never become a label
          // floating over nothing
          mat.opacity = Math.min(1, (0.004 - ang) / 0.0015);
          b.dot.scale.setScalar(Math.max(b.radius * 2.5, d * (b.dotK ?? 0.0095)));
        }
      }
    }
    skyGroup.position.set(0, 0, 0);            // the sky always rides with the camera

    // every registered subsystem updates here — galaxy, black hole, the Sun's
    // beacon, the belts, Earth's terminator, the TRAPPIST system, and anything
    // added later — all from one generic pass over the hook registry
    frameCtx.dt = dt; frameCtx.nowMs = nowMs; frameCtx.simDays = simDays; frameCtx.simDate = simDate;
    frameCtx.distKm = distKm; frameCtx.focus = focus;
    for (const hk of frameHooks) hk(frameCtx);

    // labels: project each body, place its name beside it. The Atlas has
    // scales — inside the system, planet names; pull past ~Neptune and the
    // star names wake while the planets retire.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const sunD = Math.hypot(camKm.x, camKm.y, camKm.z);
    const trapD = Math.hypot(camKm.x - TR_C.x, camKm.y - TR_C.y, camKm.z - TR_C.z);
    // "in a system" = deep inside the Sun's OR TRAPPIST's neighbourhood: the
    // distant catalogue stars hush so the system you're visiting reads cleanly
    const inSystem = sunD < 2e10 || trapD < 8e9;
    for (const b of bodies) {
      v.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      const d = v.length();
      v.project(camera);
      const behind = v.z > 1;
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      const tooClose = b === focus && d < b.radius * 24;
      const tooFar = b.labelMax !== undefined && d > b.labelMax && b !== focus;   // moons merge into their parent at range
      const wrongScale = b !== focus && (
        (b.kind === "star" && inSystem && d > 8e9) ||             // distant stars hush while you're inside a system
        (b.kind !== "star" && b.name !== "Sun" && !b.foreign && sunD > 2.5e11)   // our planets retire among the stars (TRAPPIST's are gated by labelMax)
      );
      if (behind || tooClose || tooFar || wrongScale || sx < -40 || sx > w + 40 || sy < 70 || sy > h + 20) {
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
  function clampDist() { tgtDist = Math.min(Math.max(tgtDist, focus.minD), 2.6e18); }
  // wheel listens on the whole STAGE — a label under the cursor must never
  // swallow the zoom (panels stop propagation so their own scroll works)
  const stage = canvas.parentElement ?? canvas;
  stage.addEventListener("wheel", e => {
    if ((e.target as HTMLElement).closest?.(".at-sheet, .at-console")) return;   // panels scroll themselves
    e.preventDefault();
    // gentle, controllable steps — a fast flick can't blow past the Oort cloud
    // or the outer planets the way a ×1.6-per-event curve did
    tgtDist *= Math.exp(Math.sign(e.deltaY) * 0.135 * Math.min(Math.abs(e.deltaY) / 100, 1.6));
    clampDist();
  }, { passive: false });

  /* ---------- studying a star: tap any of the 108k catalogued suns ---------- */
  const sv = new THREE.Vector3();
  let selStar = -1;
  const ringCanvas = document.createElement("canvas"); ringCanvas.width = ringCanvas.height = 64;
  { const c = ringCanvas.getContext("2d")!; c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 2.5; c.beginPath(); c.arc(32, 32, 23, 0, 6.2832); c.stroke(); }
  const selMarker = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(ringCanvas), transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
  selMarker.renderOrder = 6; selMarker.visible = false; scene.add(selMarker);
  // a plain-language read of a spectral type (e.g. "G2V" → "yellow main-sequence star")
  function starClass(spect: string): string {
    const s = (spect || "").trim(), c = s.charAt(0).toUpperCase();
    if (c === "D") return "white dwarf";
    const colour: Record<string, string> = { O: "blue", B: "blue-white", A: "white", F: "yellow-white", G: "yellow", K: "orange", M: "red", L: "deep-red", T: "infrared", C: "carbon", S: "red", W: "Wolf–Rayet" };
    const col = colour[c] || "";
    let lum = "star";
    if (/VII/.test(s)) lum = "white dwarf";
    else if (/VI/.test(s)) lum = "subdwarf";
    else if (/IV/.test(s)) lum = "subgiant";
    else if (/III/.test(s)) lum = "giant";
    else if (/II/.test(s)) lum = "bright giant";
    else if (/Ia|Iab|Ib/.test(s)) lum = "supergiant";
    else if (/V/.test(s)) lum = "main-sequence star";
    return (col ? col + " " : "") + lum;
  }
  function selectStar(idx: number) {
    if (!starMeta || !starJson) return;
    const o = idx * 16;
    const hip = starMeta.getInt32(o, true);
    const mag = starMeta.getInt16(o + 4, true) / 100;
    const distLy = starMeta.getUint16(o + 6, true) / 10;
    const conName = starJson.con[starMeta.getUint8(o + 8)] || "—";
    const spect = starJson.spect[starMeta.getUint16(o + 10, true)] || "";
    const ni = starMeta.getUint16(o + 12, true);
    const name = ni !== 65535 ? starJson.names[ni]! : (hip ? `HIP ${hip}` : "Unnamed star");
    selStar = idx;
    const cls = starClass(spect);
    const article = /^[aeiou]/i.test(cls) ? "an" : "a";
    const seen = mag < 6.5 ? "Bright enough to see with the unaided eye." : "Too faint to see without a telescope.";
    shName.textContent = name;
    shFacts.innerHTML = ([["Type", spect || "—"], ["Distance", `${distLy.toFixed(1)} ly`], ["Apparent magnitude", mag.toFixed(2)], ["Constellation", conName], ["Catalogue", hip ? `HIP ${hip}` : "—"]] as [string, string][])
      .map(([k, val]) => `<div class="at-fact"><span class="at-fact-k">${k}</span><span class="at-fact-v">${val}</span></div>`).join("");
    shProse.innerHTML = `<p>${name} is ${article} ${cls} in the constellation ${conName}, ${distLy.toFixed(1)} light-years from the Sun. ${seen}</p>`;
    sheet.classList.add("open"); sheet.removeAttribute("hidden");
  }
  // fly to a catalogued star by its cloud index — a hero star routes to its real
  // body; any other re-skins the fly-star. Used by both tapping and search.
  function flyToStar(idx: number) {
    if (!starMeta || !bubblePos || !bubbleCol) return;
    try { playClick(); } catch (_e) { /* off */ }
    const hero = heroByCloudIdx?.get(idx);
    if (hero) {
      focusBody(hero, false);
    } else {
      const o = idx * 16, ci = idx * 4;
      const spect = starJson!.spect[starMeta.getUint16(o + 10, true)] || "";
      const distLy = starMeta.getUint16(o + 6, true) / 10;
      const niv = starMeta.getUint16(o + 12, true), hipv = starMeta.getInt32(o, true);
      const nm = niv !== 65535 ? starJson!.names[niv]! : (hipv ? `HIP ${hipv}` : "Unnamed star");
      const col = (bubbleCol[ci]! << 16) | (bubbleCol[ci + 1]! << 8) | bubbleCol[ci + 2]!;
      flyStar.pos.x = bubblePos[idx * 3]!; flyStar.pos.y = bubblePos[idx * 3 + 1]!; flyStar.pos.z = bubblePos[idx * 3 + 2]!;
      skinFlyStar(col, estStarRadiusKm(spect), nm, `${starClass(spect)} · ${distLy.toFixed(1)} light-years from home.`);
      focusOn(flyStar, false);
    }
    selectStar(idx);
  }
  function pickStarAt(clientX: number, clientY: number) {
    if (!bubblePos || !bubbleCol) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top, w = canvas.clientWidth, h = canvas.clientHeight;
    let best = -1, bestScore = 1e9;
    for (let i = 0; i < starN; i++) {
      const dx = bubblePos[i * 3]! - camKm.x, dy = bubblePos[i * 3 + 1]! - camKm.y, dz = bubblePos[i * 3 + 2]! - camKm.z;
      sv.set(dx, dy, dz).project(camera);
      if (sv.z > 1) continue;
      const dp = Math.hypot((sv.x * 0.5 + 0.5) * w - px, (-sv.y * 0.5 + 0.5) * h - py);
      if (dp > 14) continue;
      // only stars actually visible from here are pickable (matches the LOD shader)
      const absMag = bubbleCol[i * 4 + 3]! / 255 * 30 - 10;
      const distPc = Math.max(Math.hypot(dx, dy, dz) / 3.0856776e13, 1e-4);
      const appMag = absMag + 5 * (Math.log10(distPc) - 1);
      if (appMag > STAR_LIMIT) continue;
      const score = dp + (appMag + 2) * 1.4;       // a bright star a few px off beats a faint one dead-centre
      if (score < bestScore) { bestScore = score; best = i; }
    }
    if (best >= 0) flyToStar(best);
  }
  // the selection ring rides with its star, at a constant apparent size, while the sheet is open
  onFrame(({ camKm }) => {
    if (selStar < 0 || !bubblePos || !sheet.classList.contains("open")) { selMarker.visible = false; return; }
    const x = bubblePos[selStar * 3]! - camKm.x, y = bubblePos[selStar * 3 + 1]! - camKm.y, z = bubblePos[selStar * 3 + 2]! - camKm.z;
    const d = Math.hypot(x, y, z) || 1;
    selMarker.position.set(x, y, z); selMarker.scale.setScalar(d * 0.018);
    selMarker.material.opacity = 0.85; selMarker.visible = true;
  });

  const ptrs = new Map<number, { x: number; y: number }>();
  let pinchD = 0;
  let tapX = 0, tapY = 0, tapMoved = false, tapTime = 0;
  canvas.addEventListener("pointerdown", e => {
    if (ptrs.size === 0) { tapX = e.clientX; tapY = e.clientY; tapMoved = false; tapTime = performance.now(); }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a!.x - b!.x, a!.y - b!.y); }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (Math.abs(e.clientX - tapX) > 6 || Math.abs(e.clientY - tapY) > 6) tapMoved = true;
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
  const lift = (e: PointerEvent) => {
    // a clean tap (no drag, one finger, quick) studies the star under it
    if (ptrs.size === 1 && !tapMoved && performance.now() - tapTime < 400) pickStarAt(e.clientX, e.clientY);
    ptrs.delete(e.pointerId); pinchD = 0;
  };
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
  // pre-compile every material now, in one upfront cost, so flying to a new
  // world or system never stutters on a first-frame shader compile
  try { renderer.compile(scene, camera); } catch (_e) { /* compile is best-effort */ }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", vis);
    removeEventListener("resize", resize);
    labels.innerHTML = "";
    renderer.dispose();
  };
}
