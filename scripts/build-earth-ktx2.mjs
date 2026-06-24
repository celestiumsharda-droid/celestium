import { execFileSync } from "child_process";
import { mkdirSync, rmSync, statSync, existsSync } from "fs";
import sharp from "sharp";
const TOKTX = "C:/Users/devan/ktx/bin/toktx.exe";
const SRC = "C:/Users/devan/celestium/.earthtmp";
const OUT = "C:/Users/devan/celestium/public/textures";
const TMP = "C:/Users/devan/celestium/.ktxtmp"; mkdirSync(TMP, { recursive: true });
// src, out, width, encoding, oetf
const jobs = [
  ["daymap.jpg",   "earth_day.ktx2",    8192, ["--encode","etc1s","--clevel","3","--qlevel","255"], "srgb"],
  ["nightmap.jpg", "earth_night.ktx2",  8192, ["--encode","etc1s","--clevel","3","--qlevel","255"], "srgb"],
  ["clouds.jpg",   "earth_clouds.ktx2", 4096, ["--encode","etc1s","--clevel","3","--qlevel","240"], "srgb"],
  ["water4k.png",  "earth_spec.ktx2",   2048, ["--encode","etc1s","--clevel","2","--qlevel","180"], "linear"],
  ["normal2k.jpg", "earth_normal.ktx2", 2048, ["--encode","uastc","--uastc_quality","2","--zcmp","9"], "linear"],
];
for (const [src, out, w, enc, oetf] of jobs) {
  if (existsSync(`${OUT}/${out}`) && statSync(`${OUT}/${out}`).size > 1000) { console.log(`${out}: skip (done)`); continue; }
  const tmp = `${TMP}/e.png`;
  await sharp(`${SRC}/${src}`).resize(w, w / 2, { fit: "fill" }).flip().png().toFile(tmp);
  execFileSync(TOKTX, ["--t2", "--genmipmap", ...enc, "--assign_oetf", oetf, `${OUT}/${out}`, tmp]);
  rmSync(tmp, { force: true });
  console.log(`${out}: ${(statSync(`${OUT}/${out}`).size / 1024).toFixed(0)} KB`);
}
rmSync(TMP, { recursive: true, force: true });
console.log("earth ktx2 done");
