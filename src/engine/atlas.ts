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
  labelMax?: number;                 // hide label/dot beyond this camera distance (moons)
  arriveK?: number;                  // fly-to framing distance = radius × this (default 5)
  arrivePitch?: number;              // override the arrival pitch (rings open above the plane)
  update?: (date: Date, simDays: number) => void;   // live orbital motion
  kind?: "star";                     // catalogue stars live by different label rules
  dotK?: number;                     // apparent-size class of its point of light
}

/* ---- the stellar neighbourhood: real stars, real places ----
   Every system within ~13 light-years plus the famous beacons. RA (hours),
   Dec (degrees), distance (ly), photosphere colour, radius in suns, type. */
const LY = 9.4607e12;                // km
interface StarRow { n: string; ra: number; dec: number; ly: number; c: number; r: number; t: string; }
const STARS: StarRow[] = [
  { n: "Proxima Centauri", ra: 14.495, dec: -62.68, ly: 4.25, c: 0xff6b4a, r: 0.15, t: "red dwarf — the nearest star" },
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
  { n: "Fomalhaut", ra: 22.96, dec: -29.62, ly: 25.1, c: 0xd8e4fa, r: 1.84, t: "white star ringed by debris" },
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
/** RA/Dec (equatorial) → our ecliptic km frame */
function starPos(s: StarRow): { x: number; y: number; z: number } {
  const ra = s.ra * 15 * D2R, dec = s.dec * D2R, eps = 23.439 * D2R;
  const xe = Math.cos(dec) * Math.cos(ra), ye = Math.cos(dec) * Math.sin(ra), ze = Math.sin(dec);
  const x = xe, y = ye * Math.cos(eps) + ze * Math.sin(eps), z = -ye * Math.sin(eps) + ze * Math.cos(eps);
  const d = s.ly * LY;
  return E2T({ x: x * d, y: y * d, z: z * d });
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
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 2e19);
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

  // the Sun — a LIVING photosphere: churning granulation, drifting active
  // regions, prominences at the limb — plus the beacon glow that scales
  // with distance so it never fades to a dim dot
  const sunMesh = livingStar(RADII["Sun"]!, 0xffc06a, 26, 80);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(RADII["Sun"]! * 6.5);
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
  for (const pn of Object.keys(PLANETS) as PlanetName[]) {
    const p = planetPosition(pn, now);
    const km = E2T({ x: p.x * AU, y: p.y * AU, z: p.z * AU });
    const mat = new THREE.MeshStandardMaterial({
      map: T(PLANET_TEX[pn]!),
      roughness: (pn === "Jupiter" || pn === "Saturn") ? 0.75 : 0.95,
      metalness: 0,
    });
    const nrmFile = PLANET_NORMALS[pn];
    if (nrmFile) {
      const nm = T(nrmFile); // reuse loader (it sets SRGB but we'll override below)
      nm.colorSpace = THREE.NoColorSpace;
      nm.flipY = true;
      mat.normalMap = nm;
      mat.normalScale = new THREE.Vector2(1.12, 1.12);
    }
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(RADII[pn]!, segMain, segMain / 2),
      mat,
    );
    m.rotation.z = (TILT[pn] ?? 0) * D2R;
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
      // a procedural ring strip — radial profile painted in-canvas: gold/tan
      // bands, the dark Cassini division, soft inner/outer fade, real alpha.
      // (the shipped saturn_ring.png renders invisible — its alpha is broken.)
      const ringTex = (() => {
        const W = 1024, H = 8, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const cx = cv.getContext("2d")!;
        for (let i = 0; i < W; i++) {
          const u = i / W;                                  // 0 inner → 1 outer
          // crisp alpha (for alphaTest) + a banded gold luminance profile
          let lum = 0.55, alpha = 1.0;
          if (u < 0.06) { alpha = 0; }                                               // inner gap before the rings
          else if (u < 0.10) { alpha = 1; lum = 0.42 + 0.06 * Math.sin(u * 120); }   // faint C ring
          else if (u < 0.63) { alpha = 1; lum = 0.62 + 0.13 * Math.sin(u * 95); }    // bright B ring, banded
          else if (u < 0.69) { alpha = 0; }                                          // Cassini division — a true gap
          else if (u < 0.97) { alpha = 1; lum = 0.58 + 0.11 * Math.sin(u * 130); }   // A ring, banded
          else { alpha = 0; }                                                        // outer edge
          const r = Math.min(255, 232 * lum + 34), g = Math.min(255, 206 * lum + 24), bl = Math.min(255, 158 * lum + 14);
          cx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha})`;
          cx.fillRect(i, 0, 1, H);
        }
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
      })();
      // OPAQUE pass + alphaTest (exactly the config the test ring rendered in).
      // The crowded transparent pass was swallowing the ring behind the huge
      // transparent galaxy/panorama meshes; alphaTest carves the gaps instead.
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        map: ringTex, side: THREE.DoubleSide, transparent: false, alphaTest: 0.5,
      }));
      ring.rotation.x = Math.PI / 2;
      ring.frustumCulled = false;
      m.add(ring);
    }
    const pb = addBody(pn, km, m, 0.00012);
    if (pn === "Saturn") { pb.arriveK = 8; pb.arrivePitch = 0.62; }   // frame the rings, looking down on them
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
  const moonNormal = T("moon_normal.jpg");
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.flipY = true;
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADII["Moon"]!, 64, 40),
    new THREE.MeshStandardMaterial({ map: T("moon.jpg"), normalMap: moonNormal, normalScale: new THREE.Vector2(1.25, 1.25), roughness: 0.96, metalness: 0 }),
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
  }

  /* orbit lines + sun-centred structures live here (floating-origin offset) */
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: 0.16 });

  /* ---------- the stellar neighbourhood: real stars at their true places ---------- */
  for (const s of STARS) {
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

  /* ---------- the Oort cloud: the Sun's farthest country ---------- */
  {
    const N = 4200;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * 6.2832, rr = Math.sqrt(1 - u * u);
      const R = (5000 + Math.pow(Math.random(), 1.6) * 45000) * AU;
      arr[i * 3] = R * rr * Math.cos(th); arr[i * 3 + 1] = R * u * 0.92; arr[i * 3 + 2] = R * rr * Math.sin(th);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const cloud = new THREE.Points(gg, new THREE.PointsMaterial({
      color: 0xa8c0e8, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.28, depthWrite: false,
    }));
    // the cloud is SUN-centred (orbitGroup already carries the floating-origin
    // offset) — pure atmosphere, no label
    orbitGroup.add(cloud);
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
    if (labelMax) cb.labelMax = labelMax;
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
    // a logarithmic spiral, ~2.4 turns, tight grand-design pitch
    const RC = 64, RE = 940, K = Math.log(RE / RC) / (2.4 * 2 * Math.PI);
    const spiral = (arm: number, t: number) => {       // t 0..1 → {px,py,r,th}
      const th = arm + t * (2.4 * 2 * Math.PI);
      const r = RC * Math.exp(K * t * (2.4 * 2 * Math.PI));
      return { px: C + Math.cos(th) * r, py: C + Math.sin(th) * r, r, th };
    };

    // 1) the smooth stellar disk — exponential brightness falloff, pale gold→blue
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 320; i++) {
      const rr = Math.pow(R(), 0.5) * RE;
      const th = R() * 6.2832;
      const px = C + Math.cos(th) * rr, py = C + Math.sin(th) * rr;
      const bluish = Math.min(1, rr / RE);
      const cr = 200 - bluish * 40, cg = 196 - bluish * 20, cb = 200 + bluish * 40;
      blob(px, py, 70 + R() * 130, `rgba(${cr|0},${cg|0},${cb|0},${0.05 + 0.05 * (1 - bluish)})`);
    }

    // 2) the arms — dense feathered streams of stars, gold inside → blue outside
    const ARMS = [0.2, 0.2 + Math.PI, 0.2 + Math.PI * 0.5, 0.2 - Math.PI * 0.5];
    ARMS.forEach((arm, ai) => {
      const major = ai < 2;
      const N = major ? 820 : 460;
      for (let i = 0; i < N; i++) {
        const t = i / N;
        const s = spiral(arm, t);
        if (s.r > RE) break;
        // feathering: scatter blobs around the arm spine, wider outward
        const spread = s.r * (0.05 + t * 0.14);
        const px = s.px + (R() - 0.5) * 2 * spread + (R() - 0.5) * spread;
        const py = s.py + (R() - 0.5) * 2 * spread + (R() - 0.5) * spread;
        const warm = Math.max(0, 1 - t * 1.7);
        const cr = 200 + warm * 55, cg = 210 + warm * 25, cb = 255 - warm * 35;
        const a = (major ? 0.13 : 0.07) * (1 - t * 0.4);
        blob(px, py, (major ? 16 : 11) * (1 - t * 0.3), `rgba(${cr|0},${cg|0},${cb|0},${a})`);
      }
    });

    // 3) HII regions (pink) + OB clusters (blue-white) studding the arms
    ARMS.forEach((arm, ai) => {
      const N = ai < 2 ? 230 : 120;
      for (let i = 0; i < N; i++) {
        const t = 0.06 + R() * 0.94;
        const s = spiral(arm, t);
        if (s.r > RE) continue;
        const spread = s.r * (0.04 + t * 0.12);
        const px = s.px + (R() - 0.5) * 2 * spread, py = s.py + (R() - 0.5) * 2 * spread;
        const roll = R();
        if (roll < 0.34) blob(px, py, 4 + R() * 9, `rgba(255,${120 + R() * 50 | 0},${150 + R() * 40 | 0},${0.35 + R() * 0.3})`);   // HII
        else if (roll < 0.7) blob(px, py, 3 + R() * 6, `rgba(${170 + R() * 50 | 0},200,255,${0.3 + R() * 0.3})`);                    // OB
        else blob(px, py, 2 + R() * 3, `rgba(255,255,255,${0.4 + R() * 0.4})`);                                                      // bright knots
      }
    });

    // 4) the central bar + bulge + blazing nucleus
    x.save(); x.translate(C, C); x.rotate(0.2); x.scale(2.1, 1);
    blob(0, 0, 200, "rgba(255,224,168,0.5)");
    blob(0, 0, 120, "rgba(255,232,182,0.6)");
    x.restore();
    blob(C, C, 240, "rgba(255,226,176,0.55)");
    blob(C, C, 120, "rgba(255,240,206,0.85)");
    blob(C, C, 54, "rgba(255,250,232,1)");

    // 5) dust lanes — dark dust weaving on the inner edge of each major arm,
    //    plus a flocculent dust ring around the bulge
    x.globalCompositeOperation = "source-over";
    ARMS.slice(0, 2).forEach(arm => {
      for (let i = 0; i < 360; i++) {
        const t = i / 360;
        const s = spiral(arm - 0.14, t);            // a touch inside the bright arm
        if (s.r > RE * 0.97 || s.r < 70) continue;
        const spread = s.r * 0.05;
        const px = s.px + (R() - 0.5) * 2 * spread, py = s.py + (R() - 0.5) * 2 * spread;
        blob(px, py, 9 * (1 - t * 0.25) + R() * 4, `rgba(40,20,12,${0.16 * (1 - t * 0.4)})`);
      }
    });
    for (let i = 0; i < 120; i++) {                 // bulge dust flecks
      const th = R() * 6.2832, rr = 130 + R() * 150;
      blob(C + Math.cos(th) * rr, C + Math.sin(th) * rr, 8 + R() * 10, `rgba(50,28,16,${0.1 + R() * 0.08})`);
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
    for (let i = 0; i < N; i++) {
      const kind = Math.random();
      let gx = 0, gy = 0, gz = 0;
      if (kind < 0.18) {           // bulge/bar grain
        const r = Math.pow(Math.random(), 1.7) * 4200 * LY;
        const u = Math.random() * 2 - 1, th2 = Math.random() * 6.2832, rr = Math.sqrt(1 - u * u);
        gx = r * rr * Math.cos(th2) * 1.7; gy = r * rr * Math.sin(th2); gz = r * u * 0.55;
        const ca = Math.cos(0.35), sa = Math.sin(0.35);
        const bx = gx * ca - gy * sa, by = gx * sa + gy * ca; gx = bx; gy = by;
        tmp.copy(cWarm);
      } else if (kind < 0.93) {    // the broad stellar disk (smooth, not stringy)
        const r = Math.min(48000, (-Math.log(1 - Math.random()) * 13000)) * LY;
        const th2 = Math.random() * 6.2832;
        gx = Math.cos(th2) * r; gy = Math.sin(th2) * r;
        gz = (Math.random() + Math.random() + Math.random() - 1.5) * (300 + 700 * Math.exp(-r / (9000 * LY))) * LY * 0.7;
        tmp.copy(cWarm).lerp(cBlue, Math.min(1, r / (30000 * LY)) * 0.7).lerp(cWhite, 0.3);
      } else {                     // sparse halo, kept within the disk radius
        const r = Math.pow(Math.random(), 0.6) * 50000 * LY;
        const u = Math.random() * 2 - 1, th2 = Math.random() * 6.2832, rr = Math.sqrt(1 - u * u);
        gx = r * rr * Math.cos(th2); gy = r * rr * Math.sin(th2); gz = r * u * 0.7;
        tmp.copy(cWhite).multiplyScalar(0.4);
      }
      tmp.multiplyScalar(0.55);      // dim — the grain is haze, not the subject
      pos[i * 3] = gx; pos[i * 3 + 1] = gy; pos[i * 3 + 2] = gz;
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    gg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const grain = new THREE.Points(gg, new THREE.PointsMaterial({
      size: 0.85, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    galaxy.add(grain);
    galFadeMats.push({ m: grain.material as THREE.PointsMaterial, max: 0.2 });
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

  /* ---------- the navigation console: every destination, one tap away ---------- */
  const REALMS: [string, (b: Body) => boolean][] = [
    ["The Sun & its worlds", b => !b.kind && ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(b.name)],
    ["Moons", b => ["Moon", "Io", "Europa", "Ganymede", "Callisto", "Titan"].includes(b.name)],
    ["The machines", b => ["Hubble", "JWST", "New Horizons", "Voyager 2", "Voyager 1"].includes(b.name)],
    ["The wanderers", b => b.name.includes("Comet") || b.name.includes("Bopp")],
    ["The stars", b => b.kind === "star" && b.name !== "Sagittarius A*"],
    ["The galaxy", b => b.name === "Sagittarius A*"],
  ];
  function conDistance(b: Body): string {
    const d = Math.hypot(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
    return fmtDist(d);
  }
  function dotColorOf(b: Body): string {
    if (b.dot) return `#${(b.dot.material as THREE.SpriteMaterial).color.getHexString()}`;
    return "#f2e6c4";   // the Sun
  }
  function buildConsole(filter = "") {
    const q = filter.trim().toLowerCase();
    let html = "";
    for (const [label, match] of REALMS) {
      const members = bodies.filter(b => match(b) && (!q || b.name.toLowerCase().includes(q)));
      if (label === "The stars") members.sort((a, b2) =>
        Math.hypot(a.pos.x, a.pos.y, a.pos.z) - Math.hypot(b2.pos.x, b2.pos.y, b2.pos.z));
      if (!members.length) continue;
      html += `<div class="at-con-group">${label}</div>`;
      for (const b of members) {
        html += `<button type="button" class="at-con-item${b === focus ? " on" : ""}" data-n="${b.name}">` +
          `<i style="--c:${dotColorOf(b)}"></i><span>${b.name}</span><b>${conDistance(b)}</b></button>`;
      }
    }
    conList.innerHTML = html || `<div class="at-con-none">Nothing in the Atlas by that name — yet.</div>`;
    conList.querySelectorAll<HTMLButtonElement>(".at-con-item").forEach(btn => {
      btn.addEventListener("click", () => {
        focusBody(btn.dataset["n"]!, true);
        closeConsole();
      });
    });
  }
  function openConsole() {
    sheet.classList.remove("open");      // one panel at a time
    buildConsole(conSearch.value);
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

  function frame(nowMs: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((nowMs - last) / 1000, 0.05); last = nowMs;

    // the stars breathe — granulation, plage and prominences all animate
    for (const m of starMats) (m.uniforms["uTime"] as { value: number }).value = nowMs * 0.001;

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
        const planetRetired = b.kind !== "star" && b.name !== "Sun" && Math.hypot(camKm.x, camKm.y, camKm.z) > 2.5e11;
        if (ang > 0.004 || planetRetired || (b.labelMax !== undefined && d > b.labelMax)) { mat.opacity = 0; }
        else {
          // a planet must OUTSHINE the background stars — never become a label
          // floating over nothing
          mat.opacity = Math.min(1, (0.004 - ang) / 0.0015);
          b.dot.scale.setScalar(Math.max(b.radius * 2.5, d * (b.dotK ?? 0.0095)));
        }
      }
    }
    orbitGroup.position.set(-camKm.x, -camKm.y, -camKm.z);
    // orbit lines belong to the SYSTEM view — near a world they'd streak the
    // sky, so they fade out below ~1M km and return as you pull away
    const t01 = Math.min(1, Math.max(0, (distKm - 8e5) / 7e6));
    orbitMat.opacity = 0.16 * t01 * t01 * (3 - 2 * t01);
    orbitGroup.visible = orbitMat.opacity > 0.004 && distKm < 2e10;   // skip drawing when invisible

    // the galaxy emerges as you rise above the neighbourhood — and the
    // camera-glued panorama hands over to the real 3D structure
    galaxy.position.set(GAL_C.x - camKm.x, GAL_C.y - camKm.y, GAL_C.z - camKm.z);
    {
      const sd = Math.hypot(camKm.x, camKm.y, camKm.z);
      const g01 = Math.min(1, Math.max(0, (sd - 6e15) / 7.4e16));
      const gFade = g01 * g01 * (3 - 2 * g01);
      galaxy.visible = gFade > 0.003;            // 48k points never drawn in system view
      if (galaxy.visible) {
        // near the galactic CORE the flat painted disk and core glow would wash
        // the view — they retreat as you close in on the black hole, leaving the
        // 3D grain (which reads fine up close) and a clean shadow against stars
        const cd = Math.hypot(camKm.x - GAL_C.x, camKm.y - GAL_C.y, camKm.z - GAL_C.z);
        const c01 = Math.min(1, Math.max(0, (cd - 1200 * LY) / (7000 * LY)));
        const coreFade = c01 * c01 * (3 - 2 * c01);
        for (const f of galFadeMats) f.m.opacity = gFade * f.max * (f.core ? coreFade : 1);
      }
      (mw.material as THREE.MeshBasicMaterial).opacity = 1 - gFade;
      mw.visible = gFade < 0.985;                // panorama not drawn once fully galaxy
    }
    bhUpdate?.(camKm.x, camKm.y, camKm.z);     // billboard + lens-direction for the black hole
    skyGroup.position.set(0, 0, 0);            // the sky rides with the camera
    sunLight.position.set(-camKm.x, -camKm.y, -camKm.z);

    // the Sun must read as the system's beacon from any distance — its glow
    // grows with range so it never fades to a dim dot
    {
      const ds = Math.hypot(camKm.x, camKm.y, camKm.z);
      glow.scale.setScalar(Math.max(RADII["Sun"]! * 6.5, ds * 0.05));
    }

    // labels: project each body, place its name beside it. The Atlas has
    // scales — inside the system, planet names; pull past ~Neptune and the
    // star names wake while the planets retire.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const sunD = Math.hypot(camKm.x, camKm.y, camKm.z);
    for (const b of bodies) {
      v.set(b.pos.x - camKm.x, b.pos.y - camKm.y, b.pos.z - camKm.z);
      const d = v.length();
      v.project(camera);
      const behind = v.z > 1;
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      const tooClose = b === focus && d < b.radius * 24;
      const tooFar = b.labelMax !== undefined && d > b.labelMax && b !== focus;   // moons merge into their parent at range
      const wrongScale = b !== focus && (
        (b.kind === "star" && sunD < 2e10) ||                      // stars sleep inside the system
        (b.kind !== "star" && b.name !== "Sun" && sunD > 2.5e11)   // planets retire among the stars
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
