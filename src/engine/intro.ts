/**
 * CELESTIUM — cinematic intro.
 * A brief, once-per-session title card: the atom-and-star mark draws
 * itself, the wordmark rises, then the curtain lifts to reveal the page.
 * Skippable (click / any key), and skipped entirely for repeat visits
 * in a session or when reduced motion is requested. Calls `onReveal`
 * exactly once — at the moment the page is uncovered — so the hero can
 * begin its own animation in a clean handoff.
 */

const KEY = "celestium:intro";

export function playIntro(onReveal: () => void): void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (_e) { /* private mode */ }

  if (reduced || seen) { onReveal(); return; }
  try { sessionStorage.setItem(KEY, "1"); } catch (_e) { /* ignore */ }

  const ov = document.createElement("div");
  ov.className = "intro";
  ov.setAttribute("role", "presentation");
  ov.innerHTML =
    '<div class="intro-in">' +
    '<svg class="intro-mark" viewBox="0 0 100 100" fill="none" stroke="#f3f5fb" stroke-width="3" aria-hidden="true">' +
    '<ellipse cx="50" cy="50" rx="40" ry="16"/>' +
    '<ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(60 50 50)"/>' +
    '<ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(120 50 50)"/>' +
    '<circle class="intro-nuc" cx="50" cy="50" r="6" fill="#f3f5fb" stroke="none"/>' +
    '<path class="intro-star" d="M76 16 l3 7 7 1 -5 5 1 7 -6-3 -6 3 1-7 -5-5 7-1z" fill="#f2e6c4" stroke="none"/>' +
    '</svg>' +
    '<div class="intro-word">CELESTIUM</div>' +
    '<div class="intro-sub">The universe, examined</div>' +
    "</div>";
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    removeEventListener("keydown", skip);
    ov.classList.add("out");
    onReveal();
    setTimeout(() => { ov.remove(); document.body.style.overflow = ""; }, 760);
  }
  const skip = () => finish();
  const timer = setTimeout(finish, 1850);
  ov.addEventListener("click", skip);
  addEventListener("keydown", skip);

  requestAnimationFrame(() => ov.classList.add("show"));
}
