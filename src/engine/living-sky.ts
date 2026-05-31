/**
 * CELESTIUM — LIVING SKY
 *
 * • Coordinated cosmic time (real UTC clock)
 * • NASA APOD card
 * • Tonight's visible planets — geocentric ephemeris computed
 *   client-side from low-precision Keplerian elements (J2000 epoch).
 *   No API needed for the planets. Accuracy ≈1° this century — plenty
 *   to tell the reader which planets ride the evening sky.
 *
 * Designed to fail gracefully: if APOD is unreachable the card reverts
 * to a sensible static line. The ephemeris always works.
 */

const APOD_KEY: string = (import.meta.env.VITE_NASA_API_KEY as string) || "DEMO_KEY";

/* -------------------- UTC clock -------------------- */

export function startClock(): void {
  const c = document.getElementById("clock");
  const d = document.getElementById("datestr");
  if (!c || !d) return;
  function tick() {
    const t = new Date();
    c!.textContent = t.toUTCString().slice(17, 25) + " UTC";
    d!.textContent = t.toUTCString().slice(0, 16);
  }
  tick();
  setInterval(tick, 1000);
}

/* -------------------- NASA APOD card -------------------- */

interface ApodResponse {
  url?: string;
  hdurl?: string;
  media_type?: string;
  thumbnail_url?: string;
  title?: string;
  explanation?: string;
}

const ESC = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function loadAPOD(target: HTMLElement | null): Promise<void> {
  if (!target) return;
  try {
    const r = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${APOD_KEY}&thumbs=true`);
    if (!r.ok) throw new Error(`APOD HTTP ${r.status}`);
    const j = (await r.json()) as ApodResponse;
    const img = j.media_type === "video" ? (j.thumbnail_url || "") : (j.url || "");
    const title = ESC(j.title || "");
    const explanation = ESC((j.explanation || "").split(/\s+/).slice(0, 28).join(" ")) + "…";
    target.innerHTML =
      `<div class="lab">Astronomy picture of the day · NASA</div>` +
      (img
        ? `<a class="apod-link" href="${j.hdurl || j.url}" target="_blank" rel="noopener noreferrer" aria-label="Open full-resolution image on NASA">` +
          `<img class="apod-img" src="${img}" alt="${title}" loading="lazy">` +
          `</a>`
        : "") +
      `<div class="apod-title">${title}</div>` +
      `<div class="sub apod-sub">${explanation}</div>`;
  } catch (_e) {
    target.innerHTML =
      `<div class="lab">Astronomy picture of the day</div>` +
      `<div class="big" style="font-size:1.5rem">A photograph is coming.</div>` +
      `<div class="sub">NASA's APOD feed is unreachable from here right now. Try again shortly.</div>`;
  }
}

/* -------------------- Ephemeris -------------------- */

interface OrbitalElements {
  a: [number, number];
  e: [number, number];
  I: [number, number];
  L: [number, number];
  LP: [number, number];
  N: [number, number];
}

/* J2000 mean orbital elements (Standish 1992). a (AU), e, I (deg),
 * L (deg), LP (longitude of perihelion, deg), N (longitude of asc.
 * node, deg) — first entry is value at J2000, second is per-century rate. */
const PLANETS: Record<string, OrbitalElements> = {
  Mercury: { a:[0.38709927, 0.00000037], e:[0.20563593, 0.00001906], I:[7.00497902, -0.00594749], L:[252.25032350, 149472.67411175], LP:[77.45779628, 0.16047689], N:[48.33076593, -0.12534081] },
  Venus:   { a:[0.72333566, 0.00000390], e:[0.00677672,-0.00004107], I:[3.39467605, -0.00078890], L:[181.97909950,  58517.81538729], LP:[131.60246718, 0.00268329], N:[76.67984255, -0.27769418] },
  Earth:   { a:[1.00000261, 0.00000562], e:[0.01671123,-0.00004392], I:[-0.00001531,-0.01294668], L:[100.46457166,  35999.37244981], LP:[102.93768193, 0.32327364], N:[ 0,             0           ] },
  Mars:    { a:[1.52371034, 0.00001847], e:[0.09339410, 0.00007882], I:[1.84969142, -0.00813131], L:[ -4.55343205,  19140.30268499], LP:[-23.94362959, 0.44441088], N:[49.55953891, -0.29257343] },
  Jupiter: { a:[5.20288700,-0.00011607], e:[0.04838624,-0.00013253], I:[1.30439695, -0.00183714], L:[ 34.39644051,   3034.74612775], LP:[ 14.72847983, 0.21252668], N:[100.47390909, 0.20469106] },
  Saturn:  { a:[9.53667594,-0.00125060], e:[0.05386179,-0.00050991], I:[2.48599187,  0.00193609], L:[ 49.95424423,   1222.49362201], LP:[ 92.59887831,-0.41897216], N:[113.66242448,-0.28867794] },
};

const DEG = Math.PI / 180;
const rad = (d: number) => d * DEG;
const deg = (r: number) => r / DEG;
const norm360 = (d: number) => { d %= 360; return d < 0 ? d + 360 : d; };

function kepler(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

interface Helio { x: number; y: number; z: number; r: number; }

function helio(body: keyof typeof PLANETS, T: number): Helio {
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

function jd(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

interface PlanetVisibility {
  name: string;
  elongation: number;
}

interface SkyState {
  evening: PlanetVisibility[];
  morning: PlanetVisibility[];
}

export function tonightsPlanets(date: Date = new Date()): SkyState {
  const T = (jd(date) - 2451545.0) / 36525.0;
  const earth = helio("Earth", T);
  const out: PlanetVisibility[] = [];
  for (const name of ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const) {
    const p = helio(name, T);
    const gx = p.x - earth.x;
    const gy = p.y - earth.y;
    const planetLon = norm360(deg(Math.atan2(gy, gx)));
    const sunLon = norm360(deg(Math.atan2(-earth.y, -earth.x)));
    const elongation = ((planetLon - sunLon + 540) % 360) - 180;
    out.push({ name, elongation });
  }
  const evening = out.filter(p => p.elongation > 15).sort((a, b) => Math.abs(b.elongation) - Math.abs(a.elongation));
  const morning = out.filter(p => p.elongation < -15).sort((a, b) => Math.abs(b.elongation) - Math.abs(a.elongation));
  return { evening, morning };
}

export function renderTonightsPlanets(target: HTMLElement | null): void {
  if (!target) return;
  try {
    const { evening, morning } = tonightsPlanets();
    let inner = `<div class="lab">Tonight, naked-eye</div>`;
    if (evening.length) {
      const names = evening.map(p => `<b>${p.name}</b>`).join(", ");
      inner +=
        `<div class="big" style="font-size:2.2rem">${evening.length}</div>` +
        `<div class="sub">${evening.length === 1 ? "planet rides" : "planets ride"} the evening sky after dusk — ${names}.</div>`;
    } else if (morning.length) {
      const names = morning.map(p => `<b>${p.name}</b>`).join(", ");
      inner +=
        `<div class="big" style="font-size:2.2rem">${morning.length}</div>` +
        `<div class="sub">${morning.length === 1 ? "planet rises" : "planets rise"} before the Sun — ${names}. The evening sky is quiet.</div>`;
    } else {
      inner +=
        `<div class="big" style="font-size:1.8rem">A quiet sky.</div>` +
        `<div class="sub">No naked-eye planets well placed tonight. The fixed stars are still there.</div>`;
    }
    target.innerHTML = inner;
  } catch (_e) {
    target.innerHTML =
      `<div class="lab">Tonight, naked-eye</div>` +
      `<div class="big" style="font-size:1.8rem">The fixed stars.</div>` +
      `<div class="sub">Planet ephemeris unavailable. Step outside anyway.</div>`;
  }
}
