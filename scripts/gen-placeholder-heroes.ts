/**
 * One-off: generate tasteful on-brand cosmic placeholder banners for the
 * About and Join pages, so the cinematic hero scaffolding is live and looks
 * intentional before real artwork arrives. When the real images are supplied
 * (hero-about.png / hero-join.png), process-hero-images.ts overwrites these
 * with the same filenames — a clean drop-in.
 *
 *   npx tsx scripts/gen-placeholder-heroes.ts
 */
import sharp from "sharp";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "img");
await mkdir(OUT, { recursive: true });

const W = 1600, H = 900;

// deterministic star field
function stars(seed: number, n: number): string {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (rnd() * W).toFixed(0);
    const y = (rnd() * H * 0.92).toFixed(0);
    const r = (rnd() * 1.4 + 0.3).toFixed(2);
    const o = (rnd() * 0.6 + 0.18).toFixed(2);
    const warm = rnd() > 0.82;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${warm ? "#f2e6c4" : "#f3f5fb"}" opacity="${o}"/>`;
  }
  return out;
}

function svg(variant: "about" | "join"): string {
  if (variant === "about") {
    // observatory night: cool deep sky, faint warm glow on the horizon
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <radialGradient id="sky" cx="64%" cy="6%" r="120%">
          <stop offset="0%" stop-color="#11172b"/>
          <stop offset="42%" stop-color="#080b16"/>
          <stop offset="100%" stop-color="#050609"/>
        </radialGradient>
        <radialGradient id="horizon" cx="50%" cy="116%" r="70%">
          <stop offset="0%" stop-color="#3a3322" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#1c1a16" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#050609" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="cool" cx="74%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#a9bcff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#a9bcff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" fill="url(#cool)"/>
      ${stars(7, 220)}
      <rect width="${W}" height="${H}" fill="url(#horizon)"/>
    </svg>`;
  }
  // join: cool nebula glow, sense of depth
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="48%" r="95%">
        <stop offset="0%" stop-color="#0c1124"/>
        <stop offset="55%" stop-color="#070a14"/>
        <stop offset="100%" stop-color="#050609"/>
      </radialGradient>
      <radialGradient id="neb" cx="40%" cy="44%" r="52%">
        <stop offset="0%" stop-color="#a9bcff" stop-opacity="0.22"/>
        <stop offset="55%" stop-color="#6c7cff" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#6c7cff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="warm" cx="72%" cy="62%" r="34%">
        <stop offset="0%" stop-color="#f2e6c4" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#f2e6c4" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#neb)"/>
    <rect width="${W}" height="${H}" fill="url(#warm)"/>
    ${stars(23, 260)}
  </svg>`;
}

for (const variant of ["about", "join"] as const) {
  const buf = Buffer.from(svg(variant));
  for (const w of [720, 1280]) {
    const pipe = sharp(buf, { density: 200 }).resize({ width: w });
    await pipe.clone().avif({ quality: 52 }).toFile(join(OUT, `${variant}-${w}.avif`));
    await pipe.clone().webp({ quality: 78 }).toFile(join(OUT, `${variant}-${w}.webp`));
    await pipe.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(join(OUT, `${variant}-${w}.jpg`));
  }
  console.log(`  ✓ ${variant}-{720,1280}.{avif,webp,jpg}`);
}
console.log("Placeholder hero banners generated.");
