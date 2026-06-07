/**
 * CELESTIUM — COMMAND PALETTE (⌘K / Ctrl-K)
 *
 * A global, glass-styled search overlay available on every page. Fuzzy-
 * matches every discovery (title / field / idea) plus the main
 * destinations, with full keyboard navigation. Self-contained: it
 * injects its own DOM and a nav search button, so pages only call
 * initCommandPalette() once.
 */
import DISCOVERIES from "../data/discoveries";
import { t } from "./i18n";

interface Item { title: string; sub: string; href: string; q: string; kind: "article" | "page"; }

const flat = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

const ORDER = [
  "black-hole-image", "gravitational-waves", "weighing-the-universe", "cosmic-background", "expanding-universe",
  "first-exoplanet", "double-slit", "periodic-table", "age-of-earth", "plate-tectonics",
  "double-helix", "crispr", "ancient-dna", "penicillin", "vaccination",
];

/** A random discovery URL — powers "Surprise me" everywhere. */
export function randomDiscoveryHref(): string {
  const valid = ORDER.filter(s => DISCOVERIES[s]);
  const slug = valid[Math.floor(Math.random() * valid.length)] ?? "black-hole-image";
  return `/discoveries/${slug}/`;
}

function buildItems(): Item[] {
  const order = ORDER;
  const items: Item[] = [];
  for (const slug of order) {
    const d = DISCOVERIES[slug];
    if (!d) continue;
    const title = flat(d.title);
    items.push({ title, sub: d.field, href: `/discoveries/${slug}/`, kind: "article", q: (title + " " + d.field + " " + flat(d.dek)).toLowerCase() });
  }
  const pages: Item[] = [
    { title: t("surprise"), sub: "Open a random discovery", href: "#random", kind: "page", q: "surprise me random shuffle lucky any discovery roll dice" },
    { title: "All discoveries", sub: "The series index", href: "/discoveries/", kind: "page", q: "all discoveries series index browse" },
    { title: "Home", sub: "The front page", href: "/", kind: "page", q: "home front cover" },
    { title: "The universe map", sub: "You are here", href: "/#scale", kind: "page", q: "universe map perspective scale you are here zoom" },
    { title: "Cosmic timeline", sub: "13.8 billion years", href: "/timeline/", kind: "page", q: "timeline history big bang cosmic" },
    { title: "You are stardust", sub: "Your atoms' origin story", href: "/stardust/", kind: "page", q: "stardust you are atoms origin supernova made of stars personal" },
    { title: "Tonight's sky", sub: "Live above you now", href: "/#sky-sec", kind: "page", q: "tonight sky live planets aurora iss" },
    { title: "About Celestium", sub: "How it's made", href: "/about/", kind: "page", q: "about methodology how made philosophy sources standards" },
    { title: "Join us", sub: "Follow, subscribe, contribute", href: "/join/", kind: "page", q: "join us follow instagram social newsletter subscribe contribute pitch contact community" },
  ];
  return [...items, ...pages];
}

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

export function initCommandPalette(): void {
  const items = buildItems();

  // --- overlay DOM ---
  const root = document.createElement("div");
  root.className = "cmdk";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Search Celestium");
  root.hidden = true;
  root.innerHTML =
    '<div class="cmdk-backdrop"></div>' +
    '<div class="cmdk-panel glass glass-sheen">' +
    `<div class="cmdk-search">${ICON_SEARCH}` +
    '<input class="cmdk-input" type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" placeholder="Search discoveries and pages…" autocomplete="off" spellcheck="false" aria-label="Search Celestium">' +
    '<kbd class="cmdk-esc">esc</kbd></div>' +
    '<ul class="cmdk-list" id="cmdk-list" role="listbox" aria-label="Results"></ul>' +
    '<div class="cmdk-empty" hidden>No matches. Try another word.</div>';
  document.body.appendChild(root);

  const input = root.querySelector<HTMLInputElement>(".cmdk-input")!;
  const list = root.querySelector<HTMLUListElement>(".cmdk-list")!;
  const emptyEl = root.querySelector<HTMLElement>(".cmdk-empty")!;
  const backdrop = root.querySelector<HTMLElement>(".cmdk-backdrop")!;

  let active = 0;
  let shown: Item[] = [];
  let lastFocus: HTMLElement | null = null;

  function render() {
    const query = input.value.trim().toLowerCase();
    shown = query === ""
      ? items
      : items.filter(i => query.split(/\s+/).every(w => i.q.includes(w)));
    active = 0;
    list.innerHTML = shown
      .map((it, i) =>
        `<li class="cmdk-item${i === 0 ? " on" : ""}" id="cmdk-opt-${i}" role="option" aria-selected="${i === 0}" data-href="${it.href}">` +
        `<span class="cmdk-kind cmdk-${it.kind}">${it.kind === "article" ? "Discovery" : "Go"}</span>` +
        `<span class="cmdk-main"><span class="cmdk-t">${it.title}</span><span class="cmdk-sub">${it.sub}</span></span>` +
        `<span class="cmdk-arrow" aria-hidden="true">&#8594;</span></li>`)
      .join("");
    emptyEl.hidden = shown.length !== 0;
    input.setAttribute("aria-activedescendant", shown.length ? "cmdk-opt-0" : "");
    list.querySelectorAll<HTMLLIElement>(".cmdk-item").forEach((li, i) => {
      li.addEventListener("mousemove", () => setActive(i));
      li.addEventListener("click", () => go(i));
    });
  }

  function setActive(i: number) {
    if (!shown.length) return;
    active = (i + shown.length) % shown.length;
    list.querySelectorAll<HTMLLIElement>(".cmdk-item").forEach((li, n) => {
      const on = n === active;
      li.classList.toggle("on", on);
      li.setAttribute("aria-selected", on ? "true" : "false");
    });
    input.setAttribute("aria-activedescendant", `cmdk-opt-${active}`);
    const el = list.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }

  function go(i: number) {
    const it = shown[i];
    if (!it) return;
    close();
    location.href = it.href === "#random" ? randomDiscoveryHref() : it.href;
  }

  function open() {
    if (!root.hidden) return;
    lastFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    render();
    requestAnimationFrame(() => { root.classList.add("show"); input.focus(); });
  }

  function close() {
    if (root.hidden) return;
    root.classList.remove("show");
    document.body.style.overflow = "";
    root.hidden = true;
    lastFocus?.focus?.();
  }

  input.addEventListener("input", render);
  backdrop.addEventListener("click", close);

  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); go(active); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });

  // global shortcut: ⌘K / Ctrl-K toggles
  addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      root.hidden ? open() : close();
    }
  });

  // inject a search button into the nav (before the sound toggle)
  const sound = document.getElementById("sound");
  if (sound && sound.parentElement) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "navsearch";
    btn.setAttribute("aria-label", "Search — Command or Control + K");
    btn.innerHTML = ICON_SEARCH;
    sound.parentElement.insertBefore(btn, sound);
    btn.addEventListener("click", open);
  }
}
