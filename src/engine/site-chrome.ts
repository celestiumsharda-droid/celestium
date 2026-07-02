import { initLivingOrb } from "./living-orb";

const MUSIC_KEY = "celestium:music";

const MARK =
  '<span class="cc-core" aria-hidden="true">' +
    '<span class="cc-core-glow"></span>' +
    '<canvas class="cc-core-orb" width="96" height="96"></canvas>' +
  '</span>';

const BRAND_MARK =
  '<svg class="cc-brand-mark" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">' +
    '<ellipse cx="50" cy="50" rx="40" ry="16"/>' +
    '<ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(60 50 50)"/>' +
    '<ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(120 50 50)"/>' +
    '<circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"/>' +
    '<path d="M76 16 l3 7 7 1 -5 5 1 7 -6-3 -6 3 1-7 -5-5 7-1z" fill="#f2e6c4" stroke="none"/>' +
  '</svg>';

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>';
const ICON_NOTE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 17.2V6.4l9-1.8v10.8"/><path d="M9 9.2l9-1.8"/><circle cx="6.8" cy="17.3" r="2.3" fill="currentColor" stroke="none"/><circle cx="15.8" cy="15.4" r="2.3" fill="currentColor" stroke="none"/><path d="M3.6 7.6c1.2-1.5 2.9-2.6 4.8-3.1" opacity=".5"/><path d="M20.4 17.4c-1 1.3-2.3 2.3-3.9 3" opacity=".5"/></svg>';
const ICON_PLAY =
  '<svg class="cc-play-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE =
  '<svg class="cc-pause-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" hidden><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z"/></svg>';
const ICON_UPDATES =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 4.5h8.1l3.1 3.1v11.9H6.5z"/><path d="M14.4 4.8v3.1h3.1"/><path d="M9.4 11.2h5.3M9.4 14.5h4.1"/><path d="M19 5.2h.1"/><circle cx="18.8" cy="5.2" r="2.2" fill="currentColor" stroke="none" opacity=".22"/><circle cx="18.8" cy="5.2" r=".8" fill="currentColor" stroke="none"/></svg>';
const ICON_HOME =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 11.5 12 5l7.5 6.5"/><path d="M7 10.5V19h10v-8.5"/></svg>';
const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const PAGES = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/atlas/", label: "Atlas", short: "Atlas" },
  { href: "/discoveries/", label: "Discoveries", short: "Discover" },
  { href: "/timeline/", label: "Timeline", short: "Time" },
  { href: "/stardust/", label: "Stardust", short: "Matter" },
  { href: "/about/", label: "About", short: "About" },
  { href: "/join/", label: "Join", short: "Join" },
];

function activeHref(): string {
  const p = location.pathname;
  if (p === "/" || p === "/index.html") return "/";
  const match = PAGES.find(page => page.href !== "/" && p.startsWith(page.href));
  return match?.href ?? "";
}

function navHTML(): string {
  const active = activeHref();
  return PAGES.map(page => {
    const current = page.href === active ? ' aria-current="page"' : "";
    return `<a class="cc-centre-link" href="${page.href}"${current}><span>${page.short}</span><b>${page.label}</b></a>`;
  }).join("");
}

function injectChrome(): HTMLElement {
  document.querySelectorAll<HTMLElement>("body > nav#nav, body > #menu").forEach(el => el.remove());

  const existing = document.getElementById("site-chrome");
  if (existing) return existing;

  const root = document.createElement("div");
  root.id = "site-chrome";
  root.className = "cc-chrome";
  root.innerHTML =
    `<a class="cc-brand" href="/">${BRAND_MARK}<span class="cc-brand-word">CELESTIUM</span></a>` +
    `<button class="cc-orb-trigger" id="cc-orb-trigger" type="button" aria-label="Open Celestium control centre" aria-haspopup="dialog" aria-controls="cc-centre" aria-expanded="false">${MARK}</button>` +
    '<section class="cc-centre" id="cc-centre" role="dialog" aria-label="Celestium control centre" aria-hidden="true">' +
      '<div class="cc-centre-head"><span>Control centre</span><button class="cc-centre-close" id="cc-centre-close" type="button" aria-label="Close control centre">' + ICON_CLOSE + '</button></div>' +
      '<a class="cc-centre-home" href="/"><span>' + ICON_HOME + '</span><b>Return home</b><i>Living launch orb</i></a>' +
      '<nav class="cc-centre-nav" aria-label="Celestium sections">' + navHTML() + '</nav>' +
      '<div class="cc-centre-tools">' +
        `<button class="cc-centre-tool cc-search-trigger" type="button">${ICON_SEARCH}<span><b>Search</b><i>Find pages and discoveries</i></span></button>` +
        '<div class="music-pill cc-player cc-centre-player" id="music-pill" aria-label="Ambient soundtrack">' +
          `<span class="cc-player-icon" aria-hidden="true">${ICON_NOTE}</span>` +
          '<span class="cc-player-copy"><i id="mp-sub">ambient</i><b>Mountain Wakes</b></span>' +
          '<span class="cc-player-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
          `<button class="cc-player-toggle" id="mp-toggle" type="button" aria-label="Play music">${ICON_PLAY}${ICON_PAUSE}</button>` +
        '</div>' +
        `<button class="updates-btn cc-centre-tool cc-update-action" id="updates-btn" type="button" aria-controls="updates-panel" aria-expanded="false">${ICON_UPDATES}<span><b>Updates</b><i>Recent Celestium changes</i></span><em>3</em></button>` +
      '</div>' +
      '<aside class="updates-panel cc-updates-panel cc-centre-updates" id="updates-panel" aria-hidden="true" aria-label="Celestium updates">' +
        '<div class="cc-up-list">' +
          '<a class="cc-up-item" href="/atlas/"><span class="cc-up-img" style="background-image:url(/img/first-exoplanet-720.webp)"></span><span><i>Atlas - 2h</i><b>New system added</b><em>Kepler-1649 is now mapped.</em></span></a>' +
          '<a class="cc-up-item" href="/discoveries/"><span class="cc-up-img" style="background-image:url(/img/hotjupiter-720.webp)"></span><span><i>Discovery - 5h</i><b>K2-18b water signal</b><em>JWST evidence, in context.</em></span></a>' +
          '<a class="cc-up-item" href="/timeline/"><span class="cc-up-img" style="background-image:url(/img/expanding-universe-720.webp)"></span><span><i>Timeline - 1d</i><b>Cosmic eras refined</b><em>The journey reads cleaner.</em></span></a>' +
        '</div>' +
      '</aside>' +
    '</section>' +
    '<audio id="bg-audio" src="/audio/when-the-mountain-wakes.mp3" loop preload="metadata"></audio>';
  document.body.prepend(root);
  document.body.classList.add("has-site-chrome");
  return root;
}

function initControlCentre(root: HTMLElement): void {
  const trigger = root.querySelector<HTMLButtonElement>("#cc-orb-trigger");
  const centre = root.querySelector<HTMLElement>("#cc-centre");
  const close = root.querySelector<HTMLButtonElement>("#cc-centre-close");
  if (!trigger || !centre) return;

  const setOpen = (open: boolean) => {
    root.classList.toggle("cc-centre-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "Close Celestium control centre" : "Open Celestium control centre");
    centre.setAttribute("aria-hidden", String(!open));
  };

  trigger.addEventListener("click", () => setOpen(!root.classList.contains("cc-centre-open")));
  close?.addEventListener("click", () => setOpen(false));
  root.querySelectorAll<HTMLAnchorElement>(".cc-centre a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  root.querySelectorAll<HTMLElement>(".cc-search-trigger").forEach(btn => btn.addEventListener("click", () => setOpen(false)));

  addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
  document.addEventListener("click", e => {
    const target = e.target as Node;
    if (root.classList.contains("cc-centre-open") && !centre.contains(target) && !trigger.contains(target)) setOpen(false);
  });
}

function initMusic(root: HTMLElement): void {
  const audio = root.querySelector<HTMLAudioElement>("#bg-audio");
  const pill = root.querySelector<HTMLElement>("#music-pill");
  const toggle = root.querySelector<HTMLButtonElement>("#mp-toggle");
  const sub = root.querySelector<HTMLElement>("#mp-sub");
  if (!audio || !pill || !toggle) return;

  audio.volume = 0.55;
  const playIc = pill.querySelector<HTMLElement>(".cc-play-ic");
  const pauseIc = pill.querySelector<HTMLElement>(".cc-pause-ic");
  const sync = () => {
    const playing = !audio.paused;
    pill.classList.toggle("playing", playing);
    if (playIc) playIc.hidden = playing;
    if (pauseIc) pauseIc.hidden = !playing;
    toggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    if (sub) sub.textContent = playing ? "now playing" : "ambient";
  };

  const play = () => audio.play().then(() => localStorage.setItem(MUSIC_KEY, "on")).catch(() => {});
  const pause = () => { audio.pause(); localStorage.setItem(MUSIC_KEY, "off"); };

  toggle.addEventListener("click", () => { if (audio.paused) void play(); else pause(); });
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  sync();

  if (localStorage.getItem(MUSIC_KEY) === "on") {
    const kick = () => { void play(); removeEventListener("pointerdown", kick); removeEventListener("keydown", kick); };
    addEventListener("pointerdown", kick, { once: true });
    addEventListener("keydown", kick, { once: true });
  }
}

function initUpdates(root: HTMLElement): void {
  const btn = root.querySelector<HTMLElement>("#updates-btn");
  const panel = root.querySelector<HTMLElement>("#updates-panel");
  if (!btn || !panel) return;

  const setOpen = (open: boolean) => {
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", String(!open));
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () => setOpen(!panel.classList.contains("open")));
  addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
}

function initCore(root: HTMLElement): void {
  initLivingOrb(root.querySelector<HTMLCanvasElement>(".cc-core-orb"), {
    count: 86,
    connectionDistance: 30,
    drift: 0.0046,
    parallax: 0.78,
  });
}

export function initSiteChrome(): void {
  if (document.body.classList.contains("lhome")) return;
  const root = injectChrome();
  initCore(root);
  initControlCentre(root);
  initMusic(root);
  initUpdates(root);
}
