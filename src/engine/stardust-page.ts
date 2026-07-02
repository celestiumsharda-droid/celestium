/**
 * CELESTIUM — "You Are Stardust" page entry.
 * Shared chrome + the lazy-mounted particle journey. The written chapters
 * in the HTML are the base experience (no-JS / reduced motion); when motion
 * is welcome we light up the canvas and tuck the prose into the a11y tree.
 */
import { enableViewTransitions } from "./view-transitions";
import { initSiteChrome } from "./site-chrome";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

enableViewTransitions();
initSiteChrome();

/* progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* command palette (deferred) */
const iw = window as IdleWindow;
const loadPalette = () => { import("./command-palette").then(m => m.initCommandPalette()); };
if (iw.requestIdleCallback) iw.requestIdleCallback(loadPalette, { timeout: 2000 }); else setTimeout(loadPalette, 1200);

/* ---- personalisation ---- */
interface Saved { name: string; birth: string }
const KEY = "celestium:stardust";
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
function bigNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(n >= 1e13 ? 0 : 1)} trillion`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} million`;
  return Math.round(n).toLocaleString();
}
function computePerson(name: string, birthStr: string) {
  const safe = esc(name.trim());
  const youTitle = safe ? `You, ${safe}.` : "You.";
  const finaleTitle = safe ? `${safe}, you are the universe,<br>looking back at itself.` : "You are the universe,<br>looking back at itself.";
  const birth = birthStr ? new Date(birthStr) : null;
  let finaleLine: string;
  if (birth && !isNaN(birth.getTime())) {
    const days = Math.max(1, Math.floor((Date.now() - birth.getTime()) / 86400000));
    const km = 29.78 * days * 86400;
    finaleLine = `In your ${days.toLocaleString()} days, your roughly 7 × 10²⁷ atoms have carried you ${bigNum(km)} km around the Sun — and the oldest of them are 13.8 billion years old. You are the briefest arrangement of the most ancient things in existence.`;
  } else {
    finaleLine = "Your roughly 7 × 10²⁷ atoms were forged in dying stars and in the first light of the universe — up to 13.8 billion years old. You are the briefest arrangement of the most ancient things in existence.";
  }
  return { youTitle, finaleTitle, finaleLine };
}

/* mount the particle journey (unless reduced motion) */
const section = document.getElementById("stardust");
const track = document.getElementById("sd-track");
const canvas = document.getElementById("sd-canvas") as HTMLCanvasElement | null;
const caption = document.getElementById("sd-caption");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (section && track && canvas && caption && !reduce) {
  import("./stardust")
    .then(m => {
      section.classList.add("live");
      let saved: Saved | null = null;
      try { const raw = localStorage.getItem(KEY); if (raw) saved = JSON.parse(raw) as Saved; } catch (_e) { /* ignore */ }
      const handle = m.mountStardust({ canvas, track, caption, person: saved ? computePerson(saved.name, saved.birth) : null });
      buildPersonalizer(handle, saved);
    })
    .catch(err => console.warn("Stardust unavailable; keeping the written journey.", err));
}

function buildPersonalizer(handle: { setPerson: (p: ReturnType<typeof computePerson> | null) => void }, saved: Saved | null): void {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sd-personalize";
  btn.innerHTML = saved ? "✦ It's yours" : "✦ Make it yours";
  document.body.appendChild(btn);

  const modal = document.createElement("div");
  modal.className = "sd-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Make this yours");
  modal.innerHTML =
    '<div class="sd-modal-back"></div>' +
    '<form class="sd-modal-panel glass" id="sd-form">' +
    '<p class="eyebrow">Make this yours</p>' +
    '<h2>Whose stardust?</h2>' +
    '<p class="sd-modal-dek">Optional — and private. Nothing leaves your device; it just personalises the ending.</p>' +
    '<label class="sd-field"><span>Your name</span><input type="text" id="sd-name" maxlength="40" autocomplete="given-name" placeholder="(optional)"></label>' +
    '<label class="sd-field"><span>Date of birth</span><input type="date" id="sd-birth" max="2030-12-31"></label>' +
    '<div class="sd-modal-cta"><button type="submit" class="btn fill">Personalise</button><button type="button" class="btn" id="sd-skip">Close</button></div>' +
    '</form>';
  document.body.appendChild(modal);

  const nameI = modal.querySelector<HTMLInputElement>("#sd-name")!;
  const birthI = modal.querySelector<HTMLInputElement>("#sd-birth")!;
  if (saved) { nameI.value = saved.name; birthI.value = saved.birth; }

  const open = () => { modal.hidden = false; requestAnimationFrame(() => { modal.classList.add("show"); nameI.focus(); }); document.body.style.overflow = "hidden"; };
  const close = () => { modal.classList.remove("show"); document.body.style.overflow = ""; setTimeout(() => { modal.hidden = true; }, 300); };
  btn.addEventListener("click", open);
  modal.querySelector(".sd-modal-back")!.addEventListener("click", close);
  modal.querySelector("#sd-skip")!.addEventListener("click", close);
  addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });

  modal.querySelector("#sd-form")!.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameI.value.trim(), birth = birthI.value;
    if (!name && !birth) { close(); return; }
    try { localStorage.setItem(KEY, JSON.stringify({ name, birth })); } catch (_e) { /* private mode */ }
    handle.setPerson(computePerson(name, birth));
    btn.innerHTML = "✦ It's yours";
    close();
    // glide to the finale so the personalised ending is felt
    const tr = document.getElementById("sd-track");
    if (tr) { const top = tr.getBoundingClientRect().top + scrollY; const span = tr.offsetHeight - innerHeight; scrollTo({ top: top + span * 0.98, behavior: "smooth" }); }
  });
}
