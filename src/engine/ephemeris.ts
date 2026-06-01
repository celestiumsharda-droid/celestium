/* =====================================================================
   CELESTIUM — EPHEMERIS
   Shared low-precision planetary positions, used by both the homepage
   "Tonight" panel and the 3D cosmic map. Single source of truth for
   the orbital mechanics so the two features can never disagree.

   Method: J2000 mean Keplerian elements (Standish 1992) with linear
   per-century rates, solved for true position in the heliocentric
   ecliptic frame. Accuracy is ~arcminute over this century — far more
   than enough to say where a planet honestly is right now.
   ===================================================================== */

export interface OrbitalElements {
  a: [number, number];  // semi-major axis (AU) + per-century rate
  e: [number, number];  // eccentricity
  I: [number, number];  // inclination to ecliptic (deg)
  L: [number, number];  // mean longitude (deg)
  LP: [number, number]; // longitude of perihelion (deg)
  N: [number, number];  // longitude of ascending node (deg)
}

/** J2000 mean orbital elements. First entry = value at J2000,
 *  second = per-Julian-century rate. */
export const PLANETS: Record<string, OrbitalElements> = {
  Mercury: { a:[0.38709927, 0.00000037], e:[0.20563593, 0.00001906], I:[7.00497902, -0.00594749], L:[252.25032350, 149472.67411175], LP:[77.45779628, 0.16047689], N:[48.33076593, -0.12534081] },
  Venus:   { a:[0.72333566, 0.00000390], e:[0.00677672,-0.00004107], I:[3.39467605, -0.00078890], L:[181.97909950,  58517.81538729], LP:[131.60246718, 0.00268329], N:[76.67984255, -0.27769418] },
  Earth:   { a:[1.00000261, 0.00000562], e:[0.01671123,-0.00004392], I:[-0.00001531,-0.01294668], L:[100.46457166,  35999.37244981], LP:[102.93768193, 0.32327364], N:[ 0,             0           ] },
  Mars:    { a:[1.52371034, 0.00001847], e:[0.09339410, 0.00007882], I:[1.84969142, -0.00813131], L:[ -4.55343205,  19140.30268499], LP:[-23.94362959, 0.44441088], N:[49.55953891, -0.29257343] },
  Jupiter: { a:[5.20288700,-0.00011607], e:[0.04838624,-0.00013253], I:[1.30439695, -0.00183714], L:[ 34.39644051,   3034.74612775], LP:[ 14.72847983, 0.21252668], N:[100.47390909, 0.20469106] },
  Saturn:  { a:[9.53667594,-0.00125060], e:[0.05386179,-0.00050991], I:[2.48599187,  0.00193609], L:[ 49.95424423,   1222.49362201], LP:[ 92.59887831,-0.41897216], N:[113.66242448,-0.28867794] },
  Uranus:  { a:[19.18916464,-0.00196176], e:[0.04725744,-0.00004397], I:[0.77263783, -0.00242939], L:[313.23810451,    428.48202785], LP:[170.95427630, 0.40805281], N:[74.01692503,  0.04240589] },
  Neptune: { a:[30.06992276, 0.00026291], e:[0.00859048, 0.00005105], I:[1.77004347,  0.00035372], L:[-55.12002969,    218.45945325], LP:[44.96476227, -0.32241464], N:[131.78422574,-0.00508664] },
};

export type PlanetName = keyof typeof PLANETS;

const DEG = Math.PI / 180;
export const rad = (d: number) => d * DEG;
export const deg = (r: number) => r / DEG;
export const norm360 = (d: number) => { d %= 360; return d < 0 ? d + 360 : d; };

/** Solve Kepler's equation M = E − e·sinE for the eccentric anomaly. */
export function kepler(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

export interface Vec3 { x: number; y: number; z: number; r: number; }

/** Julian centuries past J2000 for a given date. */
export function julianCenturies(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525.0;
}

/** Heliocentric ecliptic position of a planet, in AU.
 *  x toward the vernal equinox, z toward the ecliptic north pole. */
export function helio(body: PlanetName, T: number): Vec3 {
  const el = PLANETS[body]!;
  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = rad(el.I[0] + el.I[1] * T);
  const L = el.L[0] + el.L[1] * T;
  const N = rad(el.N[0] + el.N[1] * T);
  const w = rad(el.LP[0] + el.LP[1] * T) - N;
  const M = rad(norm360(L - el.LP[0] - el.LP[1] * T));

  const E = kepler(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const u = v + w;
  const cosN = Math.cos(N), sinN = Math.sin(N);
  const cosI = Math.cos(I), sinI = Math.sin(I);
  const cosU = Math.cos(u), sinU = Math.sin(u);
  return {
    x: r * (cosN * cosU - sinN * sinU * cosI),
    y: r * (sinN * cosU + cosN * sinU * cosI),
    z: r * (sinU * sinI),
    r,
  };
}

/** Convenience: heliocentric position of a planet at a given date. */
export function planetPosition(body: PlanetName, date: Date = new Date()): Vec3 {
  return helio(body, julianCenturies(date));
}
