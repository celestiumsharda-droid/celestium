/**
 * CELESTIUM — TONIGHT page engine.
 * The shared chrome plus a live, honest sky: everything on this page is
 * computed in sky-tonight.ts from real orbital mechanics for the visitor's
 * own horizon — the Moon, the planets, the fall of darkness, the meteors —
 * with the Station and the APOD fetched live from their public APIs.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSiteChrome } from "./site-chrome";
import { initCommandPalette } from "./command-palette";
import {
  approxLocation, moonNow, planetsTonight, sunTimes, currentShower,
} from "./sky-tonight";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
initSiteChrome();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });
initCommandPalette();

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* ---------- the clock beats every second ---------- */
const clockEl = $("tn-clock");
setInterval(() => {
  clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}, 1000);
clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ---------- location: a graceful guess first, exact on request ---------- */
let LAT = 0, LON = 0;
const whereEl = $("tn-where");
const fmtT = (d: Date | null): string =>
  d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const compass = (az: number): string =>
  ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][Math.round(az / 22.5) % 16]!;

function renderSky(): void {
  const now = new Date();

  /* the Moon */
  const m = moonNow(now, LAT, LON);
  $("tn-moon-name").textContent = m.name;
  $("tn-moon-illum").textContent = `${Math.round(m.illum * 100)}% of its face is lit`;
  $("tn-moonrise").textContent = fmtT(m.rise);
  $("tn-moonset").textContent = fmtT(m.set);
  $("tn-moon-up").textContent = m.alt > 0 ? `yes — ${Math.round(m.alt)}° up, ${compass(m.az)}` : "below your horizon";
  // shade the disc: slide the shadow across with the phase, as on the tile
  const mx = m.phase < 0.5 ? -(m.phase / 0.5) * 110 : 110 - ((m.phase - 0.5) / 0.5) * 110;
  $("tn-moon-dark").style.setProperty("--mx", `${mx.toFixed(0)}%`);

  /* the planets */
  const rows = planetsTonight(now, LAT, LON).map(p => {
    const state = p.up
      ? `<b>${Math.round(p.alt)}°</b> up · ${compass(p.az)}`
      : (p.rise ? `rises ${fmtT(p.rise)}` : "not tonight");
    return `<div class="tn-planet${p.up ? " up" : ""}${p.naked ? "" : " tele"}">` +
      `<i class="tn-updot${p.up ? " on" : ""}"></i>` +
      `<span class="tn-pname">${p.name}</span>` +
      `<span class="tn-pstate">${state}</span>` +
      `<span class="tn-pdist mono">${p.distAU.toFixed(2)} AU</span>` +
      `</div>`;
  }).join("");
  $("tn-planets").innerHTML = rows;

  /* darkness */
  const s = sunTimes(now, LAT, LON);
  $("tn-sunset").textContent = fmtT(s.sunset);
  $("tn-civil").textContent = fmtT(s.civilDusk);
  $("tn-nautical").textContent = fmtT(s.nauticalDusk);
  $("tn-astro").textContent = s.astroDusk ? fmtT(s.astroDusk) : "never fully dark tonight";
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  $("tn-sunrise").textContent = fmtT(sunTimes(tomorrow, LAT, LON).sunrise);

  /* meteors */
  const sh = currentShower(now);
  $("tn-shower-name").textContent = sh.shower.name;
  $("tn-shower-state").textContent = sh.active
    ? "Active now — look up after true darkness."
    : `Next up — peaks in ${Math.round(sh.daysToPeak)} day${Math.round(sh.daysToPeak) === 1 ? "" : "s"}.`;
  $("tn-shower-from").textContent = sh.shower.from;
  $("tn-shower-zhr").textContent = `~${sh.shower.zhr} / hour at peak`;
  $("tn-shower-peak").textContent = sh.shower.peak;
}

function setLocation(lat: number, lon: number, label: string, exact: boolean): void {
  LAT = lat; LON = lon;
  whereEl.textContent = exact
    ? `under your sky — ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
    : `under the sky of ${label} — approximate until you share your location`;
  renderSky();
}

const guess = approxLocation();
setLocation(guess.lat, guess.lon, guess.label, false);
setInterval(renderSky, 60000);                 // the sky moves; the page moves with it

$("tn-locate").addEventListener("click", () => {
  whereEl.textContent = "asking your browser…";
  navigator.geolocation.getCurrentPosition(
    pos => {
      setLocation(pos.coords.latitude, pos.coords.longitude, "", true);
      $("tn-locate").style.display = "none";
    },
    () => { whereEl.textContent = `under the sky of ${guess.label} — location was not shared`; },
    { timeout: 8000 },
  );
});

/* ---------- the Station, live ---------- */
async function pollISS(): Promise<void> {
  try {
    const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json() as { latitude: number; longitude: number; altitude: number };
    const ns = d.latitude >= 0 ? "N" : "S", ew = d.longitude >= 0 ? "E" : "W";
    $("tn-iss-where").textContent = regionName(d.latitude, d.longitude);
    $("tn-iss-coords").textContent = `${Math.abs(d.latitude).toFixed(1)}°${ns}, ${Math.abs(d.longitude).toFixed(1)}°${ew}`;
    $("tn-iss-alt").textContent = `${Math.round(d.altitude)} km`;
  } catch {
    $("tn-iss-where").textContent = "Overhead somewhere";
    $("tn-iss-note").textContent = "The tracker could not be reached — the Station is still up there.";
  }
}
function regionName(lat: number, lon: number): string {
  const ocean =
    lon > -70 && lon < 20 && lat < 60 && lat > -60 ? "over the Atlantic" :
    (lon > 40 && lon < 100 && lat < 25 && lat > -45) ? "over the Indian Ocean" :
    (lon > 140 || lon < -100) ? "over the Pacific" : "crossing land";
  return ocean;
}
void pollISS();
setInterval(() => void pollISS(), 8000);

/* ---------- NASA's picture of the day ---------- */
(async function apod() {
  const body = $("tn-apod-body");
  try {
    const r = await fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true");
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json() as { title?: string; url?: string; thumbnail_url?: string; media_type?: string; explanation?: string };
    const img = d.media_type === "video" ? d.thumbnail_url : d.url;
    body.innerHTML =
      (img ? `<a class="tn-apod-img" href="https://apod.nasa.gov/apod/astropix.html" target="_blank" rel="noopener" style="background-image:url('${img}')" aria-label="NASA astronomy picture of the day"></a>` : "") +
      `<h2 class="tn-big">${d.title ?? "Astronomy Picture of the Day"}</h2>` +
      `<p class="tn-sub">${(d.explanation ?? "").split(". ").slice(0, 2).join(". ")}.</p>`;
  } catch {
    body.innerHTML = `<h2 class="tn-big">The sky, daily</h2><p class="tn-sub">NASA's picture of the day could not be fetched right now — it returns tomorrow, as it has every day since 1995.</p>`;
  }
})();
