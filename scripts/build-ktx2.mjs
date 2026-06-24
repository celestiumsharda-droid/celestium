/* Encode the exoplanet PBR model packs to KTX2 (GPU-compressed) for the Atlas.
   albedo -> ETC1S 4K (sRGB)   normal -> UASTC 2K (+zstd, linear)
   rough  -> ETC1S 2K (linear) emit   -> ETC1S 2K (sRGB)
   Parallel across cores, and RESUMABLE (skips files already written) so a
   restart continues where it left off. Output: public/textures/exo/<pack>/<key>_<map>.ktx2
   Run: node scripts/build-ktx2.mjs [onlyPackSlug] */
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdirSync, readdirSync, existsSync, statSync, rmSync } from "fs";
import os from "os";
import sharp from "sharp";
const execFileP = promisify(execFile);

const TOKTX = "C:/Users/devan/ktx/bin/toktx.exe";
const PACK_DIR = "C:/Users/devan/Downloads/solar system done";
const OUT_ROOT = "C:/Users/devan/celestium/public/textures/exo";
const TMP = "C:/Users/devan/celestium/.ktxtmp";
const only = process.argv[2] || null;
const CONCURRENCY = Math.max(2, Math.min(6, os.cpus().length - 1));

const MAPS = [
  { src: "albedo",    out: "albedo", res: 4096, enc: ["--encode", "etc1s", "--clevel", "3", "--qlevel", "255"], oetf: "srgb" },
  { src: "normal",    out: "normal", res: 1024, enc: ["--encode", "uastc", "--uastc_quality", "1", "--zcmp", "9"], oetf: "linear" },
  { src: "roughness", out: "rough",  res: 2048, enc: ["--encode", "etc1s", "--clevel", "1", "--qlevel", "160"], oetf: "linear" },
  { src: "emissive",  out: "emit",   res: 2048, enc: ["--encode", "etc1s", "--clevel", "1", "--qlevel", "200"], oetf: "srgb" },
];
const packSlug = f => f.replace(/_4K_scientific_model_pack$/, "").replace(/_scientific_model_pack$/, "");

mkdirSync(TMP, { recursive: true });
let folders = readdirSync(PACK_DIR).filter(f => existsSync(`${PACK_DIR}/${f}/textures_4k`));
if (only) folders = folders.filter(f => packSlug(f) === only || f.includes(only));

// ---- build the full job list (skipping anything already encoded) ----
const jobs = [];
for (const folder of folders) {
  const slug = packSlug(folder);
  const texDir = `${PACK_DIR}/${folder}/textures_4k`;
  const outDir = `${OUT_ROOT}/${slug}`;
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(texDir);
  const prefixes = files.filter(f => /_albedo_4k\.(jpg|png)$/i.test(f)).map(f => f.replace(/_albedo_4k\.(jpg|png)$/i, ""));
  const SYS = prefixes.reduce((a, b) => (a.length <= b.length ? a : b));
  for (const P of prefixes) {
    const key = P === SYS ? "star" : P.slice(SYS.length).replace(/^_/, "");
    for (const m of MAPS) {
      if (key === "star" && (m.src === "normal" || m.src === "roughness")) continue;
      const srcFile = files.find(f => new RegExp(`^${P.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_${m.src}_4k\\.(jpg|png)$`, "i").test(f));
      if (!srcFile) continue;
      const outFile = `${outDir}/${key}_${m.out}.ktx2`;
      if (existsSync(outFile) && statSync(outFile).size > 256) continue;   // resume: already done
      jobs.push({ src: `${texDir}/${srcFile}`, out: outFile, m, label: `${slug}/${key}_${m.out}` });
    }
  }
}
console.log(`${jobs.length} jobs to encode @ ${CONCURRENCY} parallel`);

// ---- run with a concurrency pool ----
let idx = 0, done = 0, failed = 0;
async function worker(w) {
  while (idx < jobs.length) {
    const j = jobs[idx++];
    const tmpPng = `${TMP}/w${w}_${idx}.png`;
    try {
      await sharp(j.src).resize(j.m.res, j.m.res / 2, { fit: "fill" }).flip().png().toFile(tmpPng);
      await execFileP(TOKTX, ["--t2", "--genmipmap", ...j.m.enc, "--assign_oetf", j.m.oetf, j.out, tmpPng]);
    } catch (e) { failed++; console.warn("FAIL", j.label, (e.message || "").slice(0, 80)); }
    finally { rmSync(tmpPng, { force: true }); }
    if (++done % 25 === 0) console.log(`  ${done}/${jobs.length} …`);
  }
}
const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, (_, w) => worker(w)));
rmSync(TMP, { recursive: true, force: true });
const total = readdirSync(OUT_ROOT).flatMap(d => { try { return readdirSync(`${OUT_ROOT}/${d}`).filter(f => f.endsWith(".ktx2")); } catch { return []; } }).length;
console.log(`\nDONE in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${done} encoded (${failed} failed). Total KTX2 on disk: ${total}`);
