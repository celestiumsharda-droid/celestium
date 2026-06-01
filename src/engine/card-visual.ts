/**
 * Deterministic, discipline-tinted generative artwork for discovery
 * cards. Pure SVG, seeded by slug so it never flickers and stays crisp
 * at any size. Shared by the index grid and the homepage explore grid.
 */

interface Pal { a: string; b: string; }

export const FIELD_COLORS: Record<string, Pal> = {
  "Cosmology":         { a: "#a9bcff", b: "#6c7cff" },
  "Spacetime":         { a: "#b9a9ff", b: "#7d6cff" },
  "Origins":           { a: "#ffd6a0", b: "#f2a65a" },
  "Planetary Science": { a: "#9ee6c4", b: "#5ab98a" },
  "Quantum Reality":   { a: "#c4b5ff", b: "#8a7dff" },
  "Deep Time":         { a: "#dcc69e", b: "#b8975a" },
  "Earth Science":     { a: "#7fb0e8", b: "#4a78b8" },
  "Life & Origins":    { a: "#9ee6c4", b: "#6cc49a" },
  "Biotechnology":     { a: "#c4f29e", b: "#86cf5a" },
  "Human History":     { a: "#e8a9b0", b: "#c46c78" },
};
const DEFAULT_PAL: Pal = { a: "#a9bcff", b: "#6c7cff" };

export function cardVisual(slug: string, field: string): string {
  const pal = FIELD_COLORS[field] ?? DEFAULT_PAL;
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) & 0x7fffffff;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const id = "g" + slug.replace(/[^a-z0-9]/gi, "");
  let s = `<svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${field} — abstract motif" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><radialGradient id="${id}" cx="78%" cy="12%" r="95%">` +
       `<stop offset="0%" stop-color="${pal.a}" stop-opacity=".42"/>` +
       `<stop offset="42%" stop-color="${pal.b}" stop-opacity=".14"/>` +
       `<stop offset="100%" stop-color="#0a0c12" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect width="400" height="230" fill="#0a0c12"/>`;
  s += `<rect width="400" height="230" fill="url(#${id})"/>`;
  const rings = 2 + Math.floor(rnd() * 2);
  const cx = 300 + rnd() * 60, cy = 30 + rnd() * 40;
  for (let i = 0; i < rings; i++) {
    const rx = 70 + i * 46 + rnd() * 20, ry = rx * (0.32 + rnd() * 0.16), rot = rnd() * 180;
    s += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="none" stroke="${pal.a}" stroke-opacity="0.14" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  for (let i = 0; i < 34; i++) {
    const x = rnd() * 400, y = rnd() * 230, r = rnd() * 1.5 + 0.4;
    const c = rnd() > 0.7 ? pal.a : "#f3f5fb";
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.18 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  s += `</svg>`;
  return s;
}
