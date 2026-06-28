/* THE LAUNCHER — the home orb summons a deck of image-rich live tiles.
   The orb holds a living particle universe that leans toward your pointer/touch;
   the Atlas tile is a slideshow; the Tonight tile is alive (clock + moon phase). */

export function initLauncher(): void {
  const home = document.getElementById("lnch-home");
  const deck = document.getElementById("lnch-deck");
  if (!home || !deck) return;

  deck.querySelectorAll<HTMLElement>(".tile").forEach((t, i) => t.style.setProperty("--i", String(i)));

  const label = document.getElementById("lh-label");
  let open = false;
  const setOpen = (v: boolean) => {
    open = v;
    home.setAttribute("aria-expanded", String(v));
    deck.setAttribute("aria-hidden", String(!v));
    document.body.classList.toggle("deck-open", v);
    if (label) label.textContent = v ? "Close" : "Home";
  };
  home.addEventListener("click", () => setOpen(!open));
  deck.addEventListener("click", e => { if (e.target === deck) setOpen(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && open) setOpen(false); });

  initOrb(document.getElementById("lh-orb") as HTMLCanvasElement | null);
  initSlideshow();
  initTonight();
  initChrome();
}

/* ---- top-right chrome: the now-playing music pill + the Updates panel ---- */
function initChrome(): void {
  const audio = document.getElementById("bg-audio") as HTMLAudioElement | null;
  const pill = document.getElementById("music-pill");
  const toggle = document.getElementById("mp-toggle");
  const sub = document.getElementById("mp-sub");
  if (audio && toggle && pill) {
    audio.volume = 0.5;
    const playIc = pill.querySelector<HTMLElement>(".mp-play-ic");
    const pauseIc = pill.querySelector<HTMLElement>(".mp-pause-ic");
    const sync = () => {
      const playing = !audio.paused;
      pill.classList.toggle("playing", playing);
      if (playIc) playIc.hidden = playing;
      if (pauseIc) pauseIc.hidden = !playing;
      toggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
      if (sub) sub.textContent = playing ? "now playing" : "ambient";
    };
    toggle.addEventListener("click", () => { if (audio.paused) audio.play().catch(() => { /* gesture needed */ }); else audio.pause(); });
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    sync();
  }

  const ubtn = document.getElementById("updates-btn");
  const panel = document.getElementById("updates-panel");
  if (ubtn && panel) {
    const setU = (v: boolean) => { panel.classList.toggle("open", v); ubtn.setAttribute("aria-expanded", String(v)); };
    ubtn.addEventListener("click", () => setU(!panel.classList.contains("open")));
    document.getElementById("up-close")?.addEventListener("click", () => setU(false));
    addEventListener("keydown", e => { if (e.key === "Escape") setU(false); });
    document.addEventListener("click", e => {
      const t = e.target as Node;
      if (panel.classList.contains("open") && !panel.contains(t) && !ubtn.contains(t)) setU(false);
    });
  }
}

/* ---- the orb: a sphere of stars that leans toward the pointer/touch ---- */
function initOrb(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = W * 0.45;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = 92;
  const pts: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * 6.2832, r = Math.sqrt(1 - u * u);
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t), z: u });
  }
  let ry = 0, rx = 0.18, tgx = 0.18, tgy = 0.2, hover = 0;
  addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    tgy = 0.2 + Math.max(-2.2, Math.min(2.2, nx)) * 0.85;
    tgx = Math.max(-2.2, Math.min(2.2, ny)) * 0.55;
    hover = (Math.abs(nx) < 1.5 && Math.abs(ny) < 1.5) ? 1 : 0;
  }, { passive: true });
  const draw = () => {
    ry += (tgy - ry) * 0.06 + (reduce ? 0 : 0.0032);
    rx += (tgx - rx) * 0.06;
    const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      const x1 = p.x * cY - p.z * sY, z1 = p.x * sY + p.z * cY;
      const y2 = p.y * cX - z1 * sX, z2 = p.y * sX + z1 * cX;
      const depth = (z2 + 1) / 2;
      const sx = cx + x1 * R, sy = cy + y2 * R;
      const size = (0.5 + depth * 2.1) * (W / 176);
      const a = (0.22 + depth * 0.78) * (0.82 + hover * 0.18);
      ctx.beginPath(); ctx.arc(sx, sy, size, 0, 6.2832);
      ctx.fillStyle = `rgba(${(206 + depth * 49) | 0},${(220 + depth * 35) | 0},255,${a.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  draw();
}

/* ---- the Atlas tile slideshow ---- */
function initSlideshow(): void {
  const slides = Array.from(document.querySelectorAll<HTMLElement>("#atlas-slides .slide"));
  if (slides.length < 2) return;
  let i = 0;
  setInterval(() => {
    slides[i]!.classList.remove("on");
    i = (i + 1) % slides.length;
    slides[i]!.classList.add("on");
  }, 4200);
}

/* ---- the live Tonight tile ---- */
function initTonight(): void {
  const time = document.getElementById("tile-clock-time");
  const date = document.getElementById("tile-clock-date");
  if (time) {
    const tick = () => {
      const d = new Date();
      time.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (date) date.textContent = d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
    };
    tick();
    setInterval(tick, 15000);
  }
  const dark = document.querySelector<HTMLElement>("#tile-moon .moon-dark");
  const moonName = document.getElementById("tile-moon-name");
  if (dark) {
    const SYN = 29.530588853;
    const known = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
    const phase = (((Date.now() / 86400000 - known) % SYN + SYN) % SYN) / SYN;
    const illum = Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);
    const mx = phase < 0.5 ? -(phase / 0.5) * 110 : 110 - ((phase - 0.5) / 0.5) * 110;
    dark.style.setProperty("--mx", `${mx.toFixed(0)}%`);
    if (moonName) moonName.textContent = `${phaseName(phase)} · ${illum}% lit`;
  }
}

function phaseName(p: number): string {
  if (p < 0.03 || p > 0.97) return "new moon";
  if (p < 0.22) return "waxing crescent";
  if (p < 0.28) return "first quarter";
  if (p < 0.47) return "waxing gibbous";
  if (p < 0.53) return "full moon";
  if (p < 0.72) return "waning gibbous";
  if (p < 0.78) return "last quarter";
  return "waning crescent";
}
