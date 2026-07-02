/* THE LAUNCHER — the home orb summons a deck of image-rich live tiles.
   The orb holds a living particle universe that leans toward your pointer/touch;
   the Atlas tile is a slideshow; the Tonight tile is alive (clock + moon phase). */

import { initLivingOrb } from "./living-orb";
import { wireAudioWave } from "./audio-wave";

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
    count: 330,
    parallax: 0.92,
  });
  initSlideshow();
  initLiveTiles(deck);
  initTonight();
  initChrome();
  initQuotes();
}

/* ---- the quotes: captions for the film drifting behind them ---- */
const QUOTES: Array<[string, string]> = [
  ["We are star stuff, exploring the universe, understanding ourselves.", "Carl Sagan"],
  ["Astronomy compels the soul to look upward, and leads us from this world to another.", "Plato"],
  ["Equipped with his five senses, man explores the universe around him and calls the adventure Science.", "Edwin Hubble"],
  ["Somewhere, something incredible is waiting to be known.", "Carl Sagan"],
  ["Not only is the universe stranger than we think, it is stranger than we can think.", "Werner Heisenberg"],
  ["The history of astronomy is a history of receding horizons.", "Edwin Hubble"],
  ["The nitrogen in our DNA, the calcium in our teeth, the iron in our blood were made in the interiors of collapsing stars.", "Carl Sagan"],
  ["For small creatures such as we, the vastness is bearable only through love.", "Carl Sagan"],
];

function initQuotes(): void {
  const q = document.querySelector<HTMLElement>(".lnch-quote");
  if (!q || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const p = q.querySelector("p"), cite = q.querySelector("cite");
  if (!p || !cite) return;
  let i = 0;
  setInterval(() => {
    q.classList.add("q-out");
    setTimeout(() => {
      i = (i + 1) % QUOTES.length;
      p.textContent = QUOTES[i]![0];
      cite.textContent = QUOTES[i]![1];
      q.classList.remove("q-out");
    }, 900);
  }, 16000);
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
    wireAudioWave(audio, Array.from(pill.querySelectorAll<HTMLElement>(".mp-wave i")), pill);

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
  initTilt(tiles);
}

/* ---- the jewel lean: each tile is a slab of glass that tilts toward your
   pointer, and its art glides the opposite way — real thickness, no library ---- */
function initTilt(tiles: HTMLElement[]): void {
  if (matchMedia("(hover: none)").matches) return;
  for (const t of tiles) {
    let raf = 0, nx = 0, ny = 0;
    const apply = () => {
      raf = 0;
      t.style.setProperty("--rx", `${(-ny * 3.4).toFixed(2)}deg`);
      t.style.setProperty("--ry", `${(nx * 4.2).toFixed(2)}deg`);
      t.style.setProperty("--px", `${(nx * -7).toFixed(1)}px`);
      t.style.setProperty("--py", `${(ny * -5).toFixed(1)}px`);
    };
    t.addEventListener("pointermove", e => {
      const r = t.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    t.addEventListener("pointerleave", () => {
      nx = ny = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }
}

/* ---- the live Tonight tile: a real, computed sky in miniature ---- */
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
  // the real sky, computed — moon phase and which planets are up right now
  void import("./sky-tonight").then(({ approxLocation, moonNow, planetsTonight }) => {
    const loc = approxLocation();
    const live = () => {
      const now = new Date();
      const m = moonNow(now, loc.lat, loc.lon);
      const dark = document.querySelector<HTMLElement>("#tile-moon .moon-dark");
      const moonName = document.getElementById("tile-moon-name");
      const mx = m.phase < 0.5 ? -(m.phase / 0.5) * 110 : 110 - ((m.phase - 0.5) / 0.5) * 110;
      if (dark) dark.style.setProperty("--mx", `${mx.toFixed(0)}%`);
      if (moonName) moonName.textContent = `${m.name.toLowerCase()} · ${Math.round(m.illum * 100)}% lit`;
      const rowsEl = document.getElementById("tile-tonight-rows");
      if (rowsEl) {
        const up = planetsTonight(now, loc.lat, loc.lon).filter(p => p.naked);
        const fmt = (d2: Date | null) => d2 ? d2.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const rows = up.slice(0, 3).map(p =>
          `<span class="tn-row"><b>${p.name}</b><u>${p.up ? `up now · ${Math.round(p.alt)}°` : `rises ${fmt(p.rise)}`}</u></span>`).join("");
        rowsEl.innerHTML =
          `<span class="tn-row"><b id="tile-clock-time">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b><u id="tile-clock-date">${new Date().toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}</u></span>` + rows;
      }
    };
    live();
    setInterval(live, 120000);
  });
}
