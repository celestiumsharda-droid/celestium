/* THE LAUNCHER — the home orb summons a deck of image-rich live tiles.
   The orb holds a living particle universe that leans toward your pointer/touch;
   the Atlas tile is a slideshow; the Tonight tile is alive (clock + moon phase). */

import { initLivingOrb } from "./living-orb";

const MUSIC_KEY = "celestium:music";

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
    home.setAttribute("aria-label", v ? "Close Celestium" : "Open Celestium");
    deck.setAttribute("aria-hidden", String(!v));
    document.body.classList.toggle("deck-open", v);
    if (label) label.textContent = v ? "Close" : "Home";
  };
  home.addEventListener("click", () => setOpen(!open));
  deck.addEventListener("click", e => { if (e.target === deck) setOpen(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && open) setOpen(false); });

  initLivingOrb(document.getElementById("lh-orb") as HTMLCanvasElement | null, {
    count: 128,
    connectionDistance: 30,
    drift: 0.0048,
    parallax: 0.92,
  });
  initSlideshow();
  initLiveTiles(deck);
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
    const play = () => audio.play().then(() => localStorage.setItem(MUSIC_KEY, "on")).catch(() => { /* gesture needed */ });
    const pause = () => { audio.pause(); localStorage.setItem(MUSIC_KEY, "off"); };

    toggle.addEventListener("click", () => { if (audio.paused) void play(); else pause(); });
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    sync();

    if (localStorage.getItem(MUSIC_KEY) === "on") {
      const kick = () => {
        void play();
        removeEventListener("pointerdown", kick);
        removeEventListener("keydown", kick);
      };
      addEventListener("pointerdown", kick, { once: true });
      addEventListener("keydown", kick, { once: true });
    }
  }

  const ubtn = document.getElementById("updates-btn");
  const panel = document.getElementById("updates-panel");
  if (ubtn && panel) {
    const setU = (v: boolean) => {
      panel.classList.toggle("open", v);
      panel.setAttribute("aria-hidden", String(!v));
      ubtn.setAttribute("aria-expanded", String(v));
    };
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

/* ---- lightweight live-tile pulse: one tile surfaces its signal at a time ---- */
function initLiveTiles(deck: HTMLElement): void {
  const tiles = Array.from(deck.querySelectorAll<HTMLElement>(".tile"));
  if (tiles.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0;
  const mark = () => {
    tiles.forEach(t => t.classList.remove("live-focus"));
    tiles[i]?.classList.add("live-focus");
    i = (i + 1) % tiles.length;
  };
  mark();
  setInterval(mark, 5200);
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
