/* SKY TONIGHT — a compact, honest ephemeris. Everything the Tonight page
   shows is computed here, client-side, from real orbital mechanics:
   -  the Sun: rise, set and the three twilights (NOAA hour-angle method)
   -  the Moon: position (truncated Meeus), phase, illumination, rise/set
   -  the planets: J2000 mean elements + rates → Kepler solve → geocentric
      RA/Dec → alt/az for YOUR horizon, with rise/set found by scanning
   Accuracy is a few arc-minutes — far beyond what a naked eye can tell. */

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

/* ---------- time ---------- */
export function julianDay(d: Date): number { return d.getTime() / 86400000 + 2440587.5; }
const centuries = (jd: number): number => (jd - 2451545.0) / 36525;

/* ---------- the Sun (low-precision solar coordinates, ~0.01°) ---------- */
function sunEclipticLon(T: number): number {
  const M = (357.52911 + 35999.05029 * T) * D2R;
  const L0 = 280.46646 + 36000.76983 * T;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  return (L0 + C) % 360;
}
function obliquity(T: number): number { return (23.439291 - 0.0130042 * T) * D2R; }

export interface EqCoord { ra: number; dec: number; distAU: number }
function sunEquatorial(jd: number): EqCoord {
  const T = centuries(jd);
  const lam = sunEclipticLon(T) * D2R, eps = obliquity(T);
  return {
    ra: Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)),
    dec: Math.asin(Math.sin(eps) * Math.sin(lam)),
    distAU: 1,
  };
}

/* ---------- the observer's sky: RA/Dec → altitude/azimuth ---------- */
function gmst(jd: number): number {   // Greenwich mean sidereal time, radians
  const T = centuries(jd);
  let g = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
  g = ((g % 360) + 360) % 360;
  return g * D2R;
}
export function altAz(eq: EqCoord, jd: number, latDeg: number, lonDeg: number): { alt: number; az: number } {
  const lat = latDeg * D2R;
  const H = gmst(jd) + lonDeg * D2R - eq.ra;   // hour angle
  const alt = Math.asin(Math.sin(lat) * Math.sin(eq.dec) + Math.cos(lat) * Math.cos(eq.dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(eq.dec) * Math.cos(lat));
  return { alt: alt * R2D, az: ((az * R2D + 180) % 360 + 360) % 360 };   // az from north, clockwise
}

/* ---------- rise & set by scanning the real altitude curve ----------
   Robust at any latitude (returns null for never-rises / never-sets),
   works identically for the Sun, the Moon and every planet. */
function riseSet(
  body: (jd: number) => EqCoord, dayStart: Date, latDeg: number, lonDeg: number, h0 = -0.5667,
): { rise: Date | null; set: Date | null } {
  const jd0 = julianDay(dayStart);
  let rise: Date | null = null, set: Date | null = null;
  let prev = altAz(body(jd0), jd0, latDeg, lonDeg).alt - h0;
  const STEP = 5 / 1440;                        // 5-minute scan
  for (let i = 1; i <= 288; i++) {
    const jd = jd0 + i * STEP;
    const cur = altAz(body(jd), jd, latDeg, lonDeg).alt - h0;
    if (prev < 0 && cur >= 0 && !rise) {
      const f = prev / (prev - cur);            // linear refine inside the step
      rise = new Date((jd0 + (i - 1 + f) * STEP - 2440587.5) * 86400000);
    }
    if (prev >= 0 && cur < 0 && !set) {
      const f = prev / (prev - cur);
      set = new Date((jd0 + (i - 1 + f) * STEP - 2440587.5) * 86400000);
    }
    prev = cur;
  }
  return { rise, set };
}

export interface SunTimes {
  sunrise: Date | null; sunset: Date | null;
  civilDusk: Date | null; nauticalDusk: Date | null; astroDusk: Date | null;
}
export function sunTimes(day: Date, lat: number, lon: number): SunTimes {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const s = riseSet(sunEquatorial, start, lat, lon, -0.833);
  const noonish = new Date(start); noonish.setHours(12);
  const dusk = (deg: number) => riseSet(sunEquatorial, noonish, lat, lon, deg).set;   // scan from noon → evening crossings
  return { sunrise: s.rise, sunset: s.set, civilDusk: dusk(-6), nauticalDusk: dusk(-12), astroDusk: dusk(-18) };
}

/* ---------- the Moon (truncated Meeus ch. 47 — the dominant terms) ---------- */
function moonEquatorial(jd: number): EqCoord {
  const T = centuries(jd);
  const Lp = (218.3164477 + 481267.88123421 * T) * D2R;   // mean longitude
  const D = (297.8501921 + 445267.1114034 * T) * D2R;     // mean elongation
  const M = (357.5291092 + 35999.0502909 * T) * D2R;      // sun mean anomaly
  const Mp = (134.9633964 + 477198.8675055 * T) * D2R;    // moon mean anomaly
  const F = (93.272095 + 483202.0175233 * T) * D2R;       // argument of latitude
  const lon = Lp
    + (6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * D - Mp) + 0.658314 * Math.sin(2 * D)
     + 0.213618 * Math.sin(2 * Mp) - 0.185116 * Math.sin(M) - 0.114332 * Math.sin(2 * F)
     + 0.058793 * Math.sin(2 * D - 2 * Mp) + 0.057066 * Math.sin(2 * D - M - Mp)
     + 0.053322 * Math.sin(2 * D + Mp) + 0.045758 * Math.sin(2 * D - M)) * D2R;
  const lat = (5.128122 * Math.sin(F) + 0.280602 * Math.sin(Mp + F) + 0.277693 * Math.sin(Mp - F)
     + 0.173237 * Math.sin(2 * D - F)) * D2R;
  const dist = 385000.56 - 20905.355 * Math.cos(Mp) - 3699.111 * Math.cos(2 * D - Mp) - 2955.968 * Math.cos(2 * D);
  const eps = obliquity(T);
  const sl = Math.sin(lon), cl = Math.cos(lon), sb = Math.sin(lat), cb = Math.cos(lat);
  return {
    ra: Math.atan2(sl * cb * Math.cos(eps) - sb * Math.sin(eps), cl * cb),
    dec: Math.asin(sb * Math.cos(eps) + cb * Math.sin(eps) * sl),
    distAU: dist / 149597870.7,
  };
}

export interface MoonNow {
  phase: number;              // 0 new … 0.5 full … 1 new
  illum: number;              // 0..1 lit fraction
  name: string;
  rise: Date | null; set: Date | null;
  alt: number; az: number;
}
export function moonNow(now: Date, lat: number, lon: number): MoonNow {
  const jd = julianDay(now);
  const SYN = 29.530588853;
  const phase = (((jd - 2451550.26) % SYN + SYN) % SYN) / SYN;   // from the 2000-01-06 new moon
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const rs = riseSet(moonEquatorial, start, lat, lon, 0.125);
  const aa = altAz(moonEquatorial(jd), jd, lat, lon);
  return { phase, illum, name: moonPhaseName(phase), rise: rs.rise, set: rs.set, alt: aa.alt, az: aa.az };
}
export function moonPhaseName(p: number): string {
  if (p < 0.033 || p > 0.967) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

/* ---------- the planets: J2000 mean elements + centennial rates ----------
   a e i Ω ϖ L  (AU, deg) — JPL approximate elements, valid 1800–2050. */
interface El { a: number; e: number; i: number; O: number; w: number; L: number;
               da: number; de: number; di: number; dO: number; dw: number; dL: number }
const ELEMENTS: Record<string, El> = {
  Mercury: { a: 0.38709927, e: 0.20563593, i: 7.00497902, O: 48.33076593, w: 77.45779628, L: 252.25032350,
             da: 0.00000037, de: 0.00001906, di: -0.00594749, dO: -0.12534081, dw: 0.16047689, dL: 149472.67411175 },
  Venus:   { a: 0.72333566, e: 0.00677672, i: 3.39467605, O: 76.67984255, w: 131.60246718, L: 181.97909950,
             da: 0.00000390, de: -0.00004107, di: -0.00078890, dO: -0.27769418, dw: 0.00268329, dL: 58517.81538729 },
  Earth:   { a: 1.00000261, e: 0.01671123, i: -0.00001531, O: 0, w: 102.93768193, L: 100.46457166,
             da: 0.00000562, de: -0.00004392, di: -0.01294668, dO: 0, dw: 0.32327364, dL: 35999.37244981 },
  Mars:    { a: 1.52371034, e: 0.09339410, i: 1.84969142, O: 49.55953891, w: -23.94362959, L: -4.55343205,
             da: 0.00001847, de: 0.00007882, di: -0.00813131, dO: -0.29257343, dw: 0.44441088, dL: 19140.30268499 },
  Jupiter: { a: 5.20288700, e: 0.04838624, i: 1.30439695, O: 100.47390909, w: 14.72847983, L: 34.39644051,
             da: -0.00011607, de: -0.00013253, di: -0.00183714, dO: 0.20469106, dw: 0.21252668, dL: 3034.74612775 },
  Saturn:  { a: 9.53667594, e: 0.05386179, i: 2.48599187, O: 113.66242448, w: 92.59887831, L: 49.95424423,
             da: -0.00125060, de: -0.00050991, di: 0.00193609, dO: -0.28867794, dw: -0.41897216, dL: 1222.49362201 },
  Uranus:  { a: 19.18916464, e: 0.04725744, i: 0.77263783, O: 74.01692503, w: 170.95427630, L: 313.23810451,
             da: -0.00196176, de: -0.00004397, di: -0.00242939, dO: 0.04240589, dw: 0.40805281, dL: 428.48202785 },
  Neptune: { a: 30.06992276, e: 0.00859048, i: 1.77004347, O: 131.78422574, w: 44.96476227, L: -55.12002969,
             da: 0.00026291, de: 0.00005105, di: 0.00035372, dO: -0.00508664, dw: -0.32241464, dL: 218.45945325 },
};

function helio(name: string, T: number): { x: number; y: number; z: number } {
  const el = ELEMENTS[name]!;
  const a = el.a + el.da * T, e = el.e + el.de * T;
  const i = (el.i + el.di * T) * D2R, O = (el.O + el.dO * T) * D2R;
  const wBar = (el.w + el.dw * T) * D2R, L = (el.L + el.dL * T) * D2R;
  const M = L - wBar, w = wBar - O;
  let E = M + e * Math.sin(M);                 // Kepler solve (Newton, 6 rounds is plenty)
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i);
  return {
    x: (cw * cO - sw * sO * ci) * xv + (-sw * cO - cw * sO * ci) * yv,
    y: (cw * sO + sw * cO * ci) * xv + (-sw * sO + cw * cO * ci) * yv,
    z: (sw * si) * xv + (cw * si) * yv,
  };
}

function planetEquatorial(name: string) {
  return (jd: number): EqCoord => {
    const T = centuries(jd);
    const p = helio(name, T), e0 = helio("Earth", T);
    const x = p.x - e0.x, y = p.y - e0.y, z = p.z - e0.z;   // geocentric ecliptic
    const eps = obliquity(T);
    const xe = x, ye = y * Math.cos(eps) - z * Math.sin(eps), ze = y * Math.sin(eps) + z * Math.cos(eps);
    return { ra: Math.atan2(ye, xe), dec: Math.asin(ze / Math.hypot(xe, ye, ze)), distAU: Math.hypot(x, y, z) };
  };
}

export interface PlanetTonight {
  name: string;
  alt: number; az: number;            // right now
  up: boolean;                        // above the horizon now
  rise: Date | null; set: Date | null;
  distAU: number;
  naked: boolean;                     // naked-eye planet
}
const PLANETS = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
export function planetsTonight(now: Date, lat: number, lon: number): PlanetTonight[] {
  const jd = julianDay(now);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  return PLANETS.map(name => {
    const body = planetEquatorial(name);
    const aa = altAz(body(jd), jd, lat, lon);
    const rs = riseSet(body, start, lat, lon);
    return {
      name, alt: aa.alt, az: aa.az, up: aa.alt > 0,
      rise: rs.rise, set: rs.set,
      distAU: body(jd).distAU,
      naked: name !== "Uranus" && name !== "Neptune",
    };
  });
}

/* ---------- the year's meteor showers (IMO annual calendar) ---------- */
export interface Shower { name: string; peak: string; zhr: number; from: string; active: [string, string] }
export const SHOWERS: Shower[] = [
  { name: "Quadrantids",       peak: "Jan 3",  zhr: 110, from: "Boötes",     active: ["Dec 28", "Jan 12"] },
  { name: "Lyrids",            peak: "Apr 22", zhr: 18,  from: "Lyra",       active: ["Apr 14", "Apr 30"] },
  { name: "Eta Aquariids",     peak: "May 6",  zhr: 50,  from: "Aquarius",   active: ["Apr 19", "May 28"] },
  { name: "Delta Aquariids",   peak: "Jul 30", zhr: 25,  from: "Aquarius",   active: ["Jul 12", "Aug 23"] },
  { name: "Perseids",          peak: "Aug 12", zhr: 100, from: "Perseus",    active: ["Jul 17", "Aug 24"] },
  { name: "Orionids",          peak: "Oct 21", zhr: 20,  from: "Orion",      active: ["Oct 2", "Nov 7"] },
  { name: "Leonids",           peak: "Nov 17", zhr: 15,  from: "Leo",        active: ["Nov 6", "Nov 30"] },
  { name: "Geminids",          peak: "Dec 14", zhr: 150, from: "Gemini",     active: ["Dec 4", "Dec 20"] },
  { name: "Ursids",            peak: "Dec 22", zhr: 10,  from: "Ursa Minor", active: ["Dec 17", "Dec 26"] },
];
/** the shower whose activity window contains `now`, else the next to peak */
export function currentShower(now: Date): { shower: Shower; active: boolean; daysToPeak: number } {
  const year = now.getFullYear();
  const parse = (s: string, y: number) => new Date(`${s}, ${y}`);
  let best: { shower: Shower; active: boolean; daysToPeak: number } | null = null;
  for (const sh of SHOWERS) {
    for (const y of [year, year + 1]) {
      const peak = parse(sh.peak, y);
      let a = parse(sh.active[0], y), b = parse(sh.active[1], y);
      if (b < a) a = new Date(a.getTime() - 31536000000);       // window wraps the new year
      const days = (peak.getTime() - now.getTime()) / 86400000;
      const active = now >= a && now <= b;
      if (days >= -1 && (best === null || days < best.daysToPeak || (active && !best.active))) {
        if (best === null || (active && !best.active) || (active === best.active && days < best.daysToPeak)) {
          best = { shower: sh, active, daysToPeak: Math.max(0, days) };
        }
      }
    }
  }
  return best ?? { shower: SHOWERS[0]!, active: false, daysToPeak: 365 };
}

/* ---------- a graceful location: geolocation if granted, else a rough
   timezone-centroid guess so the page always shows a real sky ---------- */
export function approxLocation(): { lat: number; lon: number; label: string } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const guesses: Record<string, [number, number, string]> = {
    "Asia/Kolkata": [28.6, 77.2, "northern India"],
    "Asia/Calcutta": [28.6, 77.2, "northern India"],
    "America/New_York": [40.7, -74.0, "US East Coast"],
    "America/Chicago": [41.9, -87.6, "US Midwest"],
    "America/Denver": [39.7, -105.0, "US Mountain"],
    "America/Los_Angeles": [34.1, -118.2, "US West Coast"],
    "Europe/London": [51.5, -0.1, "Britain"],
    "Europe/Paris": [48.9, 2.4, "western Europe"],
    "Europe/Berlin": [52.5, 13.4, "central Europe"],
    "Asia/Tokyo": [35.7, 139.7, "Japan"],
    "Asia/Shanghai": [31.2, 121.5, "eastern China"],
    "Asia/Dubai": [25.2, 55.3, "the Gulf"],
    "Australia/Sydney": [-33.9, 151.2, "eastern Australia"],
  };
  const g = guesses[tz];
  if (g) return { lat: g[0], lon: g[1], label: g[2] };
  // fall back to the UTC offset as a crude longitude
  const off = -new Date().getTimezoneOffset() / 60;
  return { lat: 25, lon: off * 15, label: "your timezone" };
}
