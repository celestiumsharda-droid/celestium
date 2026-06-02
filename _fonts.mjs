import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
const css = readFileSync('./_gf.css', 'utf8');
const OUT = join(process.cwd(), 'src/public/fonts');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const KEEP = new Set(['latin', 'latin-ext']);
const faces = [];
const dls = new Map();
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  const subset = m[1];
  if (!KEEP.has(subset)) continue;
  const body = m[2];
  const fam = (body.match(/font-family:\s*'([^']+)'/) || [])[1];
  const style = (body.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
  const weight = (body.match(/font-weight:\s*([\d ]+)/) || [])[1].trim();
  const url = (body.match(/src:\s*url\(([^)]+)\)/) || [])[1];
  const urange = (body.match(/unicode-range:\s*([^;]+)/) || [])[1].trim();
  const slug = fam.toLowerCase().replace(/\s+/g, '-');
  const file = `${slug}-${weight.replace(/\s+/g,'_')}-${style}-${subset}.woff2`;
  dls.set(url, file);
  faces.push({ fam, style, weight, file, urange, subset });
}
writeFileSync('./_dls.txt', [...dls].map(([u,f]) => `${u} ${f}`).join('\n'));
const out = faces.map(f =>
`@font-face {
  font-family: '${f.fam}';
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: swap;
  src: url(/fonts/${f.file}) format('woff2');
  unicode-range: ${f.urange};
}`).join('\n');
writeFileSync(join(OUT, 'fonts.css'), out + '\n');
console.log(`Faces kept: ${faces.length}, unique files: ${dls.size}`);
for (const f of faces) console.log(`  ${f.fam} ${f.weight} ${f.style} [${f.subset}] -> ${f.file}`);
