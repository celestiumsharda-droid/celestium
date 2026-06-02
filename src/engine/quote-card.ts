/**
 * Renders a highlighted quote into a shareable 1080×1080 image — a dark
 * Celestium card with the quote in Fraunces, the article title, and the
 * atom-and-star mark. Used by highlight-to-share.
 */

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "#f3f5fb"; ctx.lineWidth = r * 0.1;
  for (const rot of [0, 60, 120]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.4, (rot * Math.PI) / 180, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#f3f5fb";
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2); ctx.fill();
  // little star, top-right
  ctx.fillStyle = "#f2e6c4";
  ctx.font = `${r * 0.7}px Fraunces, Georgia, serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("✦", cx + r * 0.7, cy - r * 0.5);
  ctx.restore();
}

export async function makeQuoteCard(quote: string, title: string): Promise<Blob | null> {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // make sure the brand fonts are ready before we paint text
  try {
    await Promise.all([
      document.fonts.load('300 56px Fraunces'),
      document.fonts.load('italic 300 56px Fraunces'),
      document.fonts.load('500 26px "IBM Plex Mono"'),
      document.fonts.ready,
    ]);
  } catch (_e) { /* fall back to system serif */ }

  // background
  ctx.fillStyle = "#050609"; ctx.fillRect(0, 0, S, S);
  const g = ctx.createRadialGradient(S * 0.72, S * 0.16, 0, S * 0.72, S * 0.16, S * 0.95);
  g.addColorStop(0, "rgba(169,188,255,0.12)");
  g.addColorStop(0.45, "rgba(242,230,196,0.04)");
  g.addColorStop(1, "rgba(5,6,9,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // a sprinkle of stars
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 70; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, rnd() * 1.6 + 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,228,255,${(0.1 + rnd() * 0.5).toFixed(2)})`;
    ctx.fill();
  }

  const M = 110;            // margin
  // opening quote glyph
  ctx.fillStyle = "rgba(169,188,255,0.55)";
  ctx.font = "200px Fraunces, Georgia, serif";
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("“", M - 8, 300);

  // quote text
  const fs = quote.length > 200 ? 44 : quote.length > 120 ? 52 : 60;
  ctx.font = `300 ${fs}px Fraunces, Georgia, serif`;
  ctx.fillStyle = "#f3f5fb";
  ctx.textBaseline = "top";
  const lh = fs * 1.34;
  const lines = wrapLines(ctx, `“${quote}”`, S - M * 2);
  const shown = lines.slice(0, 9);
  if (lines.length > 9) shown[8] = shown[8]!.replace(/[\s\S]{0,2}$/, "…”");
  const blockH = shown.length * lh;
  let y = Math.max(330, (S - blockH) / 2 - 40);
  for (const line of shown) { ctx.fillText(line, M, y); y += lh; }

  // accent rule + attribution
  ctx.fillStyle = "#a9bcff"; ctx.fillRect(M, y + 22, 54, 3);
  ctx.font = '500 26px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#9aa2b4";
  const t = title.length > 52 ? title.slice(0, 51).trimEnd() + "…" : title;
  ctx.fillText(t.toUpperCase(), M + 74, y + 12);

  // footer: mark + wordmark
  drawMark(ctx, M + 18, S - M + 4, 22);
  ctx.font = '600 30px Fraunces, Georgia, serif';
  ctx.fillStyle = "#f3f5fb";
  ctx.fillText("CELESTIUM", M + 64, S - M - 10);
  ctx.font = '400 18px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#5a6273";
  ctx.textAlign = "right";
  ctx.fillText("A PINNACLE OF SCIENCE", S - M, S - M + 2);

  return new Promise(res => canvas.toBlob(b => res(b), "image/png", 0.95));
}
