/* Regenerate src/data/exo.ts from the "solar system done" scientific model packs.
   Physical truth (radii, masses, orbits, periods, temps) comes from each pack's
   model_manifest.json; sky position (RA/Dec) + distance + spectral type come from
   the NASA Exoplanet Archive pscomppars table (the same source the packs cite). */
import { writeFileSync, readdirSync, readFileSync, existsSync } from "fs";

const PACK_DIR = "C:/Users/devan/Downloads/solar system done";
const OUT = "C:/Users/devan/celestium/src/data/exo.ts";
const LY_PER_PC = 3.2615638;

// ---- name helpers -------------------------------------------------------
const CONSTEL = { Peg: "Pegasi", Cnc: "Cancri", Mic: "Microscopii", Pic: "Pictoris" };
const GREEK = { bet: "Beta", alf: "Alpha", gam: "Gamma", del: "Delta", eps: "Epsilon", tau: "Tau", ups: "Upsilon" };
function prettyStar(n) {
  let s = n.trim().replace(/\bstar\b/i, "Star");
  const toks = s.split(/\s+/);
  // Bayer/Flamsteed: expand the trailing 3-letter constellation + leading greek
  if (toks.length === 2 && CONSTEL[toks[1]]) {
    const lead = GREEK[toks[0].toLowerCase()] || toks[0];
    s = `${lead} ${CONSTEL[toks[1]]}`;
  }
  return s;
}
function packSlug(folder) {
  return folder.replace(/_4K_scientific_model_pack$/, "").replace(/_scientific_model_pack$/, "");
}
function planetKey(planetName, starName) {
  // the trailing designation letter(s): "HD 189733 b" -> "b", "PSR ... b" -> "b"
  const m = planetName.trim().match(/([a-z]{1,2})$/i);
  return m ? m[1] : planetName.split(/\s+/).pop();
}
function shortKind(k) {
  if (!k) return "planet";
  return k.split("/")[0].trim().replace(/\s+/g, " ").toLowerCase();
}

// ---- star colour from effective temperature (blackbody, Tanner Helland) --
function tempToHex(K) {
  if (!K || K <= 0) return 0xfff2dc;
  const t = K / 100; let r, g, b;
  if (t <= 66) r = 255; else r = 329.698727 * Math.pow(t - 60, -0.1332047592);
  if (t <= 66) g = 99.4708025861 * Math.log(t) - 161.1195681661;
  else g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const cl = v => Math.max(0, Math.min(255, Math.round(v)));
  // warm the result slightly toward the eye's impression of stars
  return (cl(r) << 16) | (cl(g) << 8) | cl(b);
}
function kindStar(spec, K) {
  const c = (spec || "").trim().charAt(0).toUpperCase();
  const map = { O: "blue O-type star", B: "blue-white B-type star", A: "white A-type star",
    F: "yellow-white F-type star", G: "Sun-like G-type star", K: "orange K-type dwarf", M: "red-dwarf star" };
  if (map[c]) return map[c] + (/V/i.test(spec) ? " (main sequence)" : "");
  if (K >= 30000) return "blue O-type star"; if (K >= 10000) return "blue-white B-type star";
  if (K >= 7500) return "white A-type star"; if (K >= 6000) return "yellow-white F-type star";
  if (K >= 5200) return "Sun-like G-type star"; if (K >= 3700) return "orange K-type dwarf";
  return "red-dwarf star";
}

// ---- 1) read every pack manifest ---------------------------------------
const folders = readdirSync(PACK_DIR).filter(f => existsSync(`${PACK_DIR}/${f}/metadata`));
const packs = [];
for (const folder of folders) {
  const mdDir = `${PACK_DIR}/${folder}/metadata`;
  const mf = readdirSync(mdDir).find(f => /manifest.*\.json$/i.test(f));
  if (!mf) { console.warn("no manifest:", folder); continue; }
  const man = JSON.parse(readFileSync(`${mdDir}/${mf}`, "utf8"));
  const star = man.bodies.find(b => /host|star/i.test(b.kind) || b.key === "star");
  const planets = man.bodies.filter(b => b !== star);
  packs.push({ slug: packSlug(folder), folder, star, planets });
}

// ---- 2) fetch RA/Dec/dist/spec from NASA for all hostnames -------------
const hostnames = [...new Set(packs.map(p => p.star.name))];
const inList = hostnames.map(h => `'${h.replace(/'/g, "''")}'`).join(",");
const q = `select hostname,ra,dec,sy_dist,st_spectype,st_teff,st_rad from pscomppars where hostname in (${inList})`;
const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(q)}&format=csv`;
const CACHE = "C:/Users/devan/celestium/.exo-sky-cache.csv";
let csv;
if (existsSync(CACHE)) { csv = readFileSync(CACHE, "utf8"); console.log("using cached NASA sky data"); }
else {
  for (let attempt = 1; attempt <= 4 && !csv; attempt++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(40000) }); csv = await r.text(); }
    catch (e) { console.warn(`NASA fetch attempt ${attempt} failed: ${e.message}`); }
  }
  if (!csv || !/hostname/.test(csv)) throw new Error("could not fetch NASA sky data");
  writeFileSync(CACHE, csv);
}
const sky = {};
for (const line of csv.trim().split(/\r?\n/).slice(1)) {
  const cells = line.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0).map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
  const [host, ra, dec, dist, spec, teff, srad] = cells;
  if (!sky[host]) sky[host] = { ra: +ra, dec: +dec, dist: +dist, spec, teff: +teff, srad: +srad };
}

// ---- 3) assemble the NEW pack systems ----------------------------------
const systems = [];
for (const p of packs) {
  const s = sky[p.star.name] || {};
  const teff = p.star.temperature_k || s.teff || 5000;
  const distPc = p.star.distance_pc || s.dist || 10;
  const rSun = p.star.radius_solar || (s.srad || (p.star.radius_earth ? p.star.radius_earth / 109.2 : 1));
  const sys = {
    pack: p.slug,
    star: prettyStar(p.star.name),
    ra: s.ra != null ? +(s.ra / 15).toFixed(4) : 0,          // degrees -> hours
    dec: s.dec != null ? +s.dec.toFixed(4) : 0,
    ly: +((distPc) * LY_PER_PC).toFixed(3),
    tempK: Math.round(teff),
    spec: (s.spec || "").trim() || "—",
    rSun: +(+rSun).toFixed(3),
    col: tempToHex(teff),
    pulsar: /pulsar|PSR/i.test(p.star.kind || "") || /^PSR/.test(p.star.name),
    kindStar: kindStar(s.spec, teff),
    pbr: true,                                              // full PBR scientific-model pack
    planets: p.planets.map(b => ({
      key: planetKey(b.name, p.star.name),
      name: b.name,
      rE: +(+b.radius_earth || 1).toFixed(3),
      au: +(+b.semi_major_axis_au || 0.05).toFixed(5),
      per: +(+b.orbital_period_days || 10).toFixed(4),
      kind: shortKind(b.kind),
      massE: b.mass_earth != null ? +(+b.mass_earth).toFixed(3) : null,
      tempK: b.temperature_k != null ? Math.round(+b.temperature_k) : null,
    })),
  };
  systems.push(sys);
}

// ---- 3b) MERGE: keep the existing systems the new packs DON'T cover ------
// (so we never lose Proxima Centauri, Fomalhaut, TOI-700, … — only the 7 that
//  the new packs replace are dropped from the old set.)
// Keep the hand-authored (non-pack) systems already in exo.ts — Proxima,
// Fomalhaut, TOI-700, … — but never duplicate a star the packs now cover.
let kept = [];
try {
  const oldTxt = readFileSync(OUT, "utf8");
  const arrStr = oldTxt.slice(oldTxt.indexOf("] = [") + 4, oldTxt.lastIndexOf("]") + 1);
  kept = JSON.parse(arrStr).filter(s => s.pbr === false);
} catch { /* first run — no prior exo.ts */ }
const packStars = new Set(systems.map(s => s.star));
kept = kept.filter(s => !packStars.has(s.star)).map(s => ({ ...s, pbr: false }));
const merged = [...kept, ...systems];
console.log(`merge: kept ${kept.length} existing + ${systems.length} new packs = ${merged.length} systems`);

// ---- 4) write exo.ts ----------------------------------------------------
const header = `/* CELESTIUM — EXOPLANET SYSTEMS (data). ${merged.length} real systems at their
   true J2000 sky positions. Physical truth (radii, masses, orbits, periods,
   temperatures) from the per-system scientific model packs (NASA Exoplanet
   Archive pscomppars); sky position (RA/Dec) + distance + spectral type from the
   same archive. Star colour derived from effective temperature (blackbody).
   GENERATED by scripts/build-exo.mjs — edit the packs/script, not this file. */
export interface ExoPlanet { key: string; name: string; rE: number; au: number; per: number; kind: string; massE: number | null; tempK: number | null; }
export interface ExoSystem { pack: string; star: string; ra: number; dec: number; ly: number; tempK: number | null; spec: string; rSun: number; col: number; pulsar: boolean; kindStar: string; pbr?: boolean; planets: ExoPlanet[]; }
const EXO_SYSTEMS: ExoSystem[] = ${JSON.stringify(merged, null, 1)};
export default EXO_SYSTEMS;
`;
writeFileSync(OUT, header);
console.log(`wrote ${merged.length} systems, ${merged.reduce((a, s) => a + s.planets.length, 0)} planets -> ${OUT}`);
const bad = systems.filter(s => s.ra === 0 && s.dec === 0);
if (bad.length) console.warn("MISSING sky position:", bad.map(b => b.star).join(", "));
console.log("PBR packs:", merged.filter(s => s.pbr).length, "| kept basic:", merged.filter(s => !s.pbr).length);
