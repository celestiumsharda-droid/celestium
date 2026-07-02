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
import { initSiteChrome } from "./site-chrome";
import { initCommandPalette } from "./command-palette";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

enableViewTransitions();
initSiteChrome();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* scroll-progress bar */
const prog = $("prog");
addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });

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

initCommandPalette();
