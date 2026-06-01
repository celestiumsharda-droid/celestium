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

import { helio, julianCenturies, deg, norm360 } from "./ephemeris";

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

/* -------------------- Ephemeris --------------------
   Orbital mechanics live in ./ephemeris (shared with the cosmic map). */

interface PlanetVisibility {
  name: string;
  elongation: number;
}

interface SkyState {
  evening: PlanetVisibility[];
  morning: PlanetVisibility[];
}

export function tonightsPlanets(date: Date = new Date()): SkyState {
  const T = julianCenturies(date);
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

/* -------------------- ISS live position --------------------
   wheretheiss.at — HTTPS, no key, CORS-enabled. */
export async function loadISS(target: HTMLElement | null): Promise<void> {
  if (!target) return;
  try {
    const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!r.ok) throw new Error(`ISS HTTP ${r.status}`);
    const j = await r.json();
    const lat = (j.latitude as number).toFixed(1);
    const lon = (j.longitude as number).toFixed(1);
    const ns = (j.latitude as number) >= 0 ? "N" : "S";
    const ew = (j.longitude as number) >= 0 ? "E" : "W";
    const alt = Math.round(j.altitude as number);
    const vel = Math.round(j.velocity as number);
    target.innerHTML =
      `<div class="lab"><span class="beat"></span>The Space Station, right now</div>` +
      `<div class="big" style="font-size:2.1rem">${Math.abs(+lat)}°${ns} &nbsp;${Math.abs(+lon)}°${ew}</div>` +
      `<div class="sub">streaking <b>${alt.toLocaleString()} km</b> overhead at <b>${vel.toLocaleString()} km/h</b> — a full lap of Earth every ninety minutes, with people aboard.</div>`;
  } catch (_e) {
    target.innerHTML =
      `<div class="lab">The Space Station</div>` +
      `<div class="big" style="font-size:1.6rem">Circling overhead.</div>` +
      `<div class="sub">Live position unavailable right now — but it is up there, lapping the planet every ninety minutes.</div>`;
  }
}

/** Start the ISS card and refresh it every few seconds. */
export function startISS(target: HTMLElement | null): void {
  if (!target) return;
  loadISS(target);
  setInterval(() => loadISS(target), 8000);
}

/* -------------------- Aurora / space weather --------------------
   NOAA SWPC planetary Kp index — HTTPS, no key, CORS-enabled. */
export async function loadAurora(target: HTMLElement | null): Promise<void> {
  if (!target) return;
  try {
    const r = await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json");
    if (!r.ok) throw new Error(`SWPC HTTP ${r.status}`);
    const rows = (await r.json()) as string[][];
    const last = rows[rows.length - 1];
    const kp = Math.round(parseFloat(last?.[1] ?? "0"));
    let txt: string;
    if (kp >= 7) txt = "Severe storm — aurora possible far from the poles tonight.";
    else if (kp >= 5) txt = "Geomagnetic storm — aurora pushing toward lower latitudes.";
    else if (kp >= 4) txt = "Unsettled — aurora active across high latitudes.";
    else txt = "Quiet — the aurora is keeping to the polar regions.";
    target.innerHTML =
      `<div class="lab">Aurora · planetary Kp index</div>` +
      `<div class="big">${kp}<span style="font-size:1.2rem"> Kp</span></div>` +
      `<div class="sub">${txt}</div>`;
  } catch (_e) {
    target.innerHTML =
      `<div class="lab">Aurora · Kp index</div>` +
      `<div class="big" style="font-size:1.6rem">Watching the Sun.</div>` +
      `<div class="sub">Space-weather feed unavailable right now. The Sun is still throwing wind at us.</div>`;
  }
}
