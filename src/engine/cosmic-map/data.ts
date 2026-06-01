/* =====================================================================
   CELESTIUM — COSMIC MAP DATA
   Display parameters and real catalog data for the 3D universe map.
   Astronomy is real; only the visual radii / spacing are stylised so
   that, e.g., Mercury is not an invisible speck next to Neptune.
   ===================================================================== */

import type { PlanetName } from "../ephemeris";

/* ---- Planets: real texture map + relative display size ---- */
export interface PlanetStyle {
  name: PlanetName;
  map: string;        // texture file in /public/textures
  color: number;      // fallback / accent colour
  size: number;       // display radius (scene units), NOT to scale
  ring?: boolean;     // draw the textured Saturn ring
  tilt?: number;      // axial tilt (radians) for the ring
}

export const PLANET_STYLES: PlanetStyle[] = [
  { name: "Mercury", map: "mercury.jpg", color: 0x9a8c7a, size: 1.0 },
  { name: "Venus",   map: "venus.jpg",   color: 0xd8b87a, size: 1.5 },
  { name: "Earth",   map: "earth_day.jpg", color: 0x6fb1ff, size: 1.7 },
  { name: "Mars",    map: "mars.jpg",    color: 0xd9764a, size: 1.4 },
  { name: "Jupiter", map: "jupiter.jpg", color: 0xd8a878, size: 3.4 },
  { name: "Saturn",  map: "saturn.jpg",  color: 0xe6cd92, size: 2.6, ring: true, tilt: 0.47 },
  { name: "Uranus",  map: "uranus.jpg",  color: 0x9fe3e6, size: 2.4 },
  { name: "Neptune", map: "neptune.jpg", color: 0x5a7bff, size: 2.4 },
];

/* ---- Nearest stars: real positions ----
   RA in hours, Dec in degrees (J2000), distance in light-years,
   colour keyed to spectral class. The Sun is the implicit origin. */
export interface NearStar {
  name: string;
  ra: number;     // hours
  dec: number;    // degrees
  dist: number;   // light-years
  color: number;  // spectral-type colour
  size: number;   // relative display size
  label?: boolean;
  hab?: boolean;  // hosts a planet in (or near) its habitable zone
}

// Colours by spectral class: M red, K orange, G yellow-white, F white,
// A blue-white. Sizes scaled by rough luminosity/radius (Sirius, Vega
// large; the many red dwarfs small). The Sun sits at the origin.
export const NEAR_STARS: NearStar[] = [
  { name: "Proxima Centauri", ra: 14.495, dec: -62.68, dist: 4.24, color: 0xff7a52, size: 3.4, label: true, hab: true },
  { name: "Alpha Centauri",   ra: 14.660, dec: -60.83, dist: 4.37, color: 0xfff2da, size: 6.2, label: true },
  { name: "Barnard's Star",   ra: 17.963, dec:   4.69, dist: 5.96, color: 0xff7a52, size: 3.2 },
  { name: "Wolf 359",         ra: 10.564, dec:   7.01, dist: 7.86, color: 0xff6a44, size: 2.8 },
  { name: "Lalande 21185",    ra: 11.057, dec:  35.97, dist: 8.31, color: 0xff9858, size: 3.4 },
  { name: "Sirius",           ra:  6.752, dec: -16.72, dist: 8.60, color: 0xdcebff, size: 8.5, label: true },
  { name: "Luyten 726-8",     ra:  1.640, dec: -17.95, dist: 8.73, color: 0xff6a44, size: 2.6 },
  { name: "Ross 154",         ra: 18.831, dec: -23.84, dist: 9.69, color: 0xff7a52, size: 2.8 },
  { name: "Teegarden's Star", ra:  2.883, dec:  16.88, dist: 12.50, color: 0xff6a44, size: 2.6, hab: true },
  { name: "Epsilon Eridani",  ra:  3.548, dec:  -9.46, dist: 10.50, color: 0xffbe78, size: 4.4, label: true },
  { name: "Lacaille 9352",    ra: 23.090, dec: -35.85, dist: 10.74, color: 0xff9858, size: 3.2 },
  { name: "Ross 128",         ra: 11.793, dec:   0.80, dist: 11.01, color: 0xff7a52, size: 2.8, hab: true },
  { name: "Procyon",          ra:  7.655, dec:   5.22, dist: 11.46, color: 0xfff6e6, size: 6.4, label: true },
  { name: "61 Cygni",         ra: 21.069, dec:  38.75, dist: 11.40, color: 0xffaa66, size: 3.6 },
  { name: "Tau Ceti",         ra:  1.734, dec: -15.94, dist: 11.91, color: 0xfff0c8, size: 5.0, label: true, hab: true },
  { name: "Epsilon Indi",     ra: 22.057, dec: -56.79, dist: 11.87, color: 0xffb86a, size: 3.8 },
  { name: "TRAPPIST-1",       ra: 23.108, dec:  -5.04, dist: 40.66, color: 0xff5a3a, size: 2.6, label: true, hab: true },
  { name: "Altair",           ra: 19.846, dec:   8.87, dist: 16.73, color: 0xf2f6ff, size: 6.8, label: true },
  { name: "Vega",             ra: 18.616, dec:  38.78, dist: 25.04, color: 0xcfe0ff, size: 8.2, label: true },
  { name: "Fomalhaut",        ra: 22.961, dec: -29.62, dist: 25.13, color: 0xe8f0ff, size: 6.6, label: true },
];

/* ---- Local Group: principal members ----
   Position is a stylised but directionally-honest layout in Mly,
   with the Milky Way at the origin. Andromeda lies ~2.5 Mly away. */
export interface LocalGalaxy {
  name: string;
  x: number; y: number; z: number; // Mly
  size: number;
  color: number;
  kind: "spiral" | "blob";
  label?: boolean;
}

export const LOCAL_GROUP: LocalGalaxy[] = [
  { name: "Milky Way",          x: 0,    y: 0,    z: 0,    size: 9,  color: 0xbcd0ff, kind: "spiral", label: true },
  { name: "Andromeda (M31)",    x: 2.2,  y: 0.3,  z: 1.1,  size: 12, color: 0xdfe6ff, kind: "spiral", label: true },
  { name: "Triangulum (M33)",   x: 2.0,  y: -0.5, z: 1.6,  size: 6,  color: 0xc7d4ff, kind: "spiral", label: true },
  { name: "Large Magellanic",   x: -0.15, y: -0.1, z: 0.05, size: 3,  color: 0xe6dcff, kind: "blob" },
  { name: "Small Magellanic",   x: -0.2, y: -0.18, z: 0.0, size: 2,  color: 0xe6dcff, kind: "blob" },
  { name: "Leo I",              x: 0.82, y: 0.4,  z: -0.3, size: 1.4, color: 0xd8d8e8, kind: "blob" },
  { name: "NGC 6822",           x: 1.6,  y: -1.0, z: -0.6, size: 1.6, color: 0xd0d8ee, kind: "blob" },
  { name: "IC 1613",            x: 2.4,  y: 0.9,  z: -0.4, size: 1.6, color: 0xd0d8ee, kind: "blob" },
  { name: "Wolf-Lundmark",      x: 3.0,  y: -1.4, z: 0.7,  size: 1.4, color: 0xccd4ea, kind: "blob" },
];

/* ---- Stage metadata: the words that ride the map ----
   `size` is the representative human-readable scale of each stage,
   used for the live readout interpolation. */
export interface StageInfo {
  key: string;
  level: string;
  name: string;
  scale: string;
  desc: string;
  live?: boolean;       // positions are genuinely real-time at this stage
  readout?: string;     // fixed readout text (overrides the interpolated scale)
}

export const STAGES: StageInfo[] = [
  {
    key: "earth",
    level: "Level 01 — Home",
    name: "Earth",
    scale: "12,742 km across",
    desc: "A single pale stone. Every war, ocean and idea you know of has happened on this one dot — the only world we have ever touched.",
  },
  {
    key: "system",
    level: "Level 02 — The Solar System",
    name: "The Solar System, right now",
    scale: "≈ 9 billion km wide",
    desc: "Eight planets around an ordinary star, shown at their true orbital positions this very second. Light from the Sun takes eight minutes to reach you.",
    live: true,
  },
  {
    key: "neighborhood",
    level: "Level 03 — Stellar Neighbourhood",
    name: "The nearest stars",
    scale: "≈ 30 light-years",
    desc: "The nearest suns in their real three-dimensional places, coloured by what they are — red dwarfs, white Sirius, our G-type neighbours. Green rings mark stars with a world in the habitable zone: Proxima b, the TRAPPIST-1 system, Tau Ceti. The fastest probe we have built would need 70,000 years to reach the closest.",
  },
  {
    key: "blackhole",
    level: "Level 04 — The Galactic Centre",
    name: "Sagittarius A*",
    scale: "4 million solar masses",
    readout: "Sgr A* · 4 million M☉",
    desc: "Four million Suns crushed past the point of return, ringed by gas shredded and heated white-hot as it spirals in. The supermassive black hole at the heart of the Milky Way — the still point every star in the galaxy, ours included, quietly orbits.",
  },
  {
    key: "galaxy",
    level: "Level 05 — The Milky Way",
    name: "Our galaxy",
    scale: "≈ 100,000 light-years",
    desc: "Up to 400 billion suns in a slow spiral. Our own is one anonymous spark about two-thirds of the way out — marked, if you can find it.",
  },
  {
    key: "localgroup",
    level: "Level 06 — The Local Group",
    name: "Our cluster of galaxies",
    scale: "≈ 10 million light-years",
    desc: "Roughly 80 galaxies bound by gravity. The Milky Way and Andromeda drift toward an eventual merger four billion years from now.",
  },
  {
    key: "web",
    level: "Level 07 — The Cosmic Web",
    name: "The observable universe",
    scale: "93 billion light-years across",
    desc: "Galaxies are not scattered — they string along vast filaments around emptier voids, like foam in the dark. Everything light has had time to bring us.",
  },
];

/** Convert a star's RA (hours) / Dec (deg) / distance to Cartesian. */
export function raDecToXYZ(raHours: number, decDeg: number, dist: number): [number, number, number] {
  const ra = (raHours * 15 * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return [
    dist * Math.cos(dec) * Math.cos(ra),
    dist * Math.sin(dec),
    dist * Math.cos(dec) * Math.sin(ra),
  ];
}
