/**
 * CELESTIUM — JOIN page engine.
 * Shared chrome (starfield, view transitions, command palette, ambient
 * sound, mobile menu) plus the newsletter form.
 *
 * The newsletter has no backend yet: rather than silently doing nothing or
 * pretending to store an address, we validate the email, remember it locally
 * so the UI stays honest, and confirm warmly. To go live, POST `email` to a
 * provider (Buttondown / Mailchimp / a Worker route) where marked below.
 */
import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { initSound } from "./sound";
import { initCommandPalette } from "./command-palette";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

/* mobile menu */
const bg = $("burger");
const mn = $("menu");
bg.setAttribute("aria-expanded", "false");
bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open");
  bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false");
  document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  mn.classList.remove("open");
  bg.classList.remove("x");
  document.body.style.overflow = "";
}));

/* newsletter */
const form = document.getElementById("news-form") as HTMLFormElement | null;
const email = document.getElementById("news-email") as HTMLInputElement | null;
const note = document.getElementById("news-note");
if (form && email && note) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const value = email.value.trim();
    if (!value || !email.checkValidity()) {
      note.textContent = "That email doesn’t look right — mind checking it?";
      note.dataset.state = "warn";
      email.focus();
      return;
    }
    // → To collect for real, POST { email: value } to your provider here.
    try { localStorage.setItem("celestium:subscriber", value); } catch (_e) { /* private mode */ }
    form.hidden = true;
    note.textContent = "You’re in orbit. We’ll write when the first dispatch goes out — until then, the best of it is on Instagram.";
    note.dataset.state = "ok";
  });
}

initSound($("sound"), { pad: true });
initCommandPalette();
