/**
 * One-off: process the supplied hero/atmospheric images into the
 * responsive set used by the article hero + cards. Run with:
 *   npx tsx scripts/process-hero-images.ts "<source folder>"
 *
 * hero-<slug>.png -> <slug>-{720,1280}.{avif,webp,jpg}
 * home-<name>.png -> <name>-{720,1280}.{avif,webp,jpg}
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join, basename, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = process.argv[2] || "C:/Users/devan/Downloads/celestium images";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "img");
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
for (const f of files) {
  const base = basename(f, extname(f)).replace(/^(hero|home)-/, "");
  const src = join(SRC, f);
  const meta = await sharp(src).metadata();
  for (const w of [720, 1280]) {
    const pipe = sharp(src).resize({ width: w, withoutEnlargement: true });
    await pipe.clone().avif({ quality: 52 }).toFile(join(OUT, `${base}-${w}.avif`));
    await pipe.clone().webp({ quality: 74 }).toFile(join(OUT, `${base}-${w}.webp`));
    await pipe.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, `${base}-${w}.jpg`));
  }
  console.log(`  ✓ ${f} (${meta.width}x${meta.height}) -> ${base}-{720,1280}.{avif,webp,jpg}`);
}
console.log(`\nProcessed ${files.length} images into ${OUT}`);
