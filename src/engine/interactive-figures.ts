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

/* ---- double-slit fringe builder ----
   Fire single particles and watch the interference pattern emerge dot by
   dot. Switch on a which-slit detector and it collapses to two plain
   bands — the heart of the experiment, made tactile. */
function enhanceDoubleSlit(fig: HTMLElement): void {
  if (fig.dataset["enhanced"]) return;
  fig.dataset["enhanced"] = "1";

  const W = 720, H = 260;
  let detector = false;
  let count = 0;

  const cap = fig.querySelector("figcaption")?.outerHTML ?? "";
  fig.innerHTML =
    `<div class="if-stage"><canvas class="if-canvas" width="${W}" height="${H}" role="img" aria-label="A detection screen where single particles accumulate into an interference pattern."></canvas></div>` +
    `<div class="if-controls">` +
    `<div class="if-row">` +
    `<button class="if-btn if-fire" type="button">Fire 300 particles</button>` +
    `<label class="if-toggle"><input type="checkbox" class="if-det"><span class="if-sw"></span>Watch which slit</label>` +
    `</div>` +
    `<div class="if-time"><span class="if-count">0</span> particles &nbsp;·&nbsp; <span class="if-mode">both slits open — they interfere</span></div>` +
    `</div>` + cap;
  fig.classList.add("ifig");

  const canvas = fig.querySelector(".if-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countEl = fig.querySelector(".if-count") as HTMLElement;
  const modeEl = fig.querySelector(".if-mode") as HTMLElement;
  const detEl = fig.querySelector(".if-det") as HTMLInputElement;
  const fireBtn = fig.querySelector(".if-fire") as HTMLButtonElement;

  function clearScreen(): void {
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, W, H);
    count = 0;
    countEl.textContent = "0";
  }
  // probability of a hit at normalized position xn ∈ [-1, 1]
  function prob(xn: number): number {
    if (detector) {
      const a = Math.exp(-Math.pow((xn - 0.34) / 0.17, 2));
      const b = Math.exp(-Math.pow((xn + 0.34) / 0.17, 2));
      return (a + b) / 1;
    }
    const env = Math.exp(-(xn * xn) / 0.42);          // single-slit envelope
    const fr = Math.pow(Math.cos(xn * Math.PI * 5.2), 2); // two-slit interference
    return fr * env;
  }
  function fire(n: number): void {
    for (let i = 0; i < n; i++) {
      let xn = 0, p = 0, tries = 0;
      do { xn = Math.random() * 2 - 1; p = prob(xn); tries++; } while (Math.random() > p && tries < 40);
      const x = W / 2 + xn * (W / 2 - 24);
      const y = 14 + Math.random() * (H - 28);
      const r = Math.random() * 1.1 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.29);
      ctx.fillStyle = `rgba(242,230,196,${(0.45 + Math.random() * 0.45).toFixed(2)})`;
      ctx.fill();
      count++;
    }
    countEl.textContent = String(count);
  }

  fireBtn.addEventListener("click", () => fire(300));
  detEl.addEventListener("change", () => {
    detector = detEl.checked;
    modeEl.textContent = detector
      ? "detector on — the interference is gone"
      : "both slits open — they interfere";
    clearScreen();
    fire(300);
  });

  clearScreen();
  fire(220);
}

/* ---- gravitational-wave chirp: hear two black holes merge ----
   Synthesises the rising-pitch "whoop" of GW150914 with the Web Audio
   API on a user gesture, and pulses the waveform while it plays. */
const PLAY_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

function enhanceChirp(fig: HTMLElement): void {
  if (fig.dataset["enhanced"]) return;
  fig.dataset["enhanced"] = "1";

  const cap = fig.querySelector("figcaption");
  const controls = document.createElement("div");
  controls.className = "if-controls if-chirp";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "if-btn if-play";
  btn.innerHTML = `${PLAY_ICON}<span>Hear the chirp</span>`;
  controls.appendChild(btn);
  if (cap) fig.insertBefore(controls, cap); else fig.appendChild(controls);
  fig.classList.add("ifig");

  let actx: AudioContext | null = null;
  let playing = false;
  const label = btn.querySelector("span")!;

  btn.addEventListener("click", () => {
    if (playing) return;
    playing = true;
    fig.classList.remove("chirp-playing"); void fig.offsetWidth; // restart anim
    fig.classList.add("chirp-playing");
    label.textContent = "Playing…";
    try {
      actx = actx ?? new AudioContext();
      if (actx.state === "suspended") void actx.resume();
      const dur = 0.95;
      const now = actx.currentTime;
      const N = 120;
      const f = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        f[i] = t < 0.86 ? 38 + Math.pow(t / 0.86, 2.3) * (300 - 38) : 300 - ((t - 0.86) / 0.14) * 120;
      }
      const gain = actx.createGain();
      gain.connect(actx.destination);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + dur * 0.84);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      const oscs = [0, 6].map(detune => {
        const o = actx!.createOscillator();
        o.type = "sine"; o.detune.value = detune;
        o.frequency.setValueCurveAtTime(f, now, dur);
        o.connect(gain); o.start(now); o.stop(now + dur);
        return o;
      });
      oscs[0]!.onended = () => {
        playing = false;
        fig.classList.remove("chirp-playing");
        label.textContent = "Hear it again";
      };
    } catch (_e) {
      playing = false;
      fig.classList.remove("chirp-playing");
      label.textContent = "Hear the chirp";
    }
  });
}

export function initInteractiveFigures(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('figure[data-fig="decay"]').forEach(enhanceDecay);
  root.querySelectorAll<HTMLElement>('figure[data-fig="dslit"]').forEach(enhanceDoubleSlit);
  root.querySelectorAll<HTMLElement>('figure[data-fig="chirp"]').forEach(enhanceChirp);
}
