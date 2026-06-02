/**
 * Progressive-enhancement for select article figures: the static SVG is
 * shipped (and server-rendered) for no-JS / crawlers; when JS runs we
 * upgrade marked figures into scrubbable, interactive diagrams.
 *
 * Currently: the radioactive-decay clock (age-of-earth). Drag the slider
 * and watch the parent halve while the daughter accumulates.
 */

const U238_GYR = 4.468; // half-life of uranium-238, billions of years

function fmtYears(gyr: number): string {
  if (gyr < 1) return `${Math.round(gyr * 1000)} million years`;
  return `${gyr.toFixed(2)} billion years`;
}

function enhanceDecay(fig: HTMLElement): void {
  if (fig.dataset["enhanced"]) return;
  fig.dataset["enhanced"] = "1";

  const X0 = 70, X1 = 660, Y0 = 250, Y1 = 50, tMax = 4;
  const px = (t: number) => X0 + (t / tMax) * (X1 - X0);
  const py = (f: number) => Y0 + f * (Y1 - Y0);
  const parentF = (t: number) => Math.pow(0.5, t);

  let parent = "", daughter = "";
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * tMax, f = parentF(t);
    parent += `${i === 0 ? "M" : "L"} ${px(t).toFixed(1)} ${py(f).toFixed(1)} `;
    daughter += `${i === 0 ? "M" : "L"} ${px(t).toFixed(1)} ${py(1 - f).toFixed(1)} `;
  }

  let svg = '<svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An interactive radioactive-decay curve. Drag the slider to advance time in half-lives.">';
  svg += `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#363c4a"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#363c4a"/>`;
  for (let t = 1; t <= tMax; t++) {
    svg += `<line x1="${px(t)}" y1="${Y0}" x2="${px(t)}" y2="${Y1}" stroke="rgba(243,245,251,.06)" stroke-dasharray="3 5"/>`;
    svg += `<text x="${px(t)}" y="${Y0 + 18}" fill="#828b9e" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle">${t} t&#189;</text>`;
  }
  svg += `<path d="${parent}" fill="none" stroke="#a9bcff" stroke-width="2"/>`;
  svg += `<path d="${daughter}" fill="none" stroke="#f2e6c4" stroke-width="2" opacity=".85"/>`;
  svg += `<text x="${px(0.12)}" y="${py(0.95)}" fill="#a9bcff" font-family="IBM Plex Mono,monospace" font-size="11">PARENT (uranium)</text>`;
  svg += `<text x="${px(2.0)}" y="${py(0.9)}" fill="#f2e6c4" font-family="IBM Plex Mono,monospace" font-size="11">DAUGHTER (lead)</text>`;
  // dynamic marker
  svg += `<line class="if-mk" x1="0" y1="${Y1}" x2="0" y2="${Y0}" stroke="rgba(243,245,251,.3)" stroke-dasharray="2 3"/>`;
  svg += `<circle class="if-pd" cx="0" cy="0" r="5.5" fill="#a9bcff"/>`;
  svg += `<circle class="if-dd" cx="0" cy="0" r="5.5" fill="#f2e6c4"/>`;
  svg += "</svg>";

  const cap = fig.querySelector("figcaption")?.outerHTML ?? "";

  fig.innerHTML =
    `<div class="if-stage">${svg}</div>` +
    `<div class="if-controls">` +
    `<div class="if-bars">` +
    `<div class="if-bar"><div class="if-track"><span class="if-fill if-pf"></span></div><div class="if-lab"><span style="color:#a9bcff">Parent</span> <b class="if-pp">50%</b></div></div>` +
    `<div class="if-bar"><div class="if-track"><span class="if-fill if-df"></span></div><div class="if-lab"><span style="color:#f2e6c4">Daughter</span> <b class="if-dp">50%</b></div></div>` +
    `</div>` +
    `<input class="if-slider" type="range" min="0" max="4" step="0.02" value="1" aria-label="Time elapsed in half-lives">` +
    `<div class="if-time"><span class="if-hl">1.00</span> half-lives &nbsp;·&nbsp; <span class="if-yr">&#8776; 4.47 billion years</span> of uranium-238</div>` +
    `</div>` +
    cap;
  fig.classList.add("ifig");

  const q = <T extends Element>(s: string) => fig.querySelector(s) as T;
  const mk = q<SVGLineElement>(".if-mk");
  const pd = q<SVGCircleElement>(".if-pd");
  const dd = q<SVGCircleElement>(".if-dd");
  const pf = q<HTMLElement>(".if-pf");
  const df = q<HTMLElement>(".if-df");
  const pp = q<HTMLElement>(".if-pp");
  const dp = q<HTMLElement>(".if-dp");
  const hl = q<HTMLElement>(".if-hl");
  const yr = q<HTMLElement>(".if-yr");
  const slider = q<HTMLInputElement>(".if-slider");

  function update(t: number): void {
    const f = parentF(t);
    const x = px(t);
    mk.setAttribute("x1", String(x)); mk.setAttribute("x2", String(x));
    pd.setAttribute("cx", String(x)); pd.setAttribute("cy", String(py(f)));
    dd.setAttribute("cx", String(x)); dd.setAttribute("cy", String(py(1 - f)));
    pf.style.width = `${f * 100}%`;
    df.style.width = `${(1 - f) * 100}%`;
    pp.textContent = `${Math.round(f * 100)}%`;
    dp.textContent = `${Math.round((1 - f) * 100)}%`;
    hl.textContent = t.toFixed(2);
    yr.textContent = `≈ ${fmtYears(t * U238_GYR)}`;
  }
  slider.addEventListener("input", () => update(parseFloat(slider.value)));
  update(1);
}

export function initInteractiveFigures(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('figure[data-fig="decay"]').forEach(enhanceDecay);
}
