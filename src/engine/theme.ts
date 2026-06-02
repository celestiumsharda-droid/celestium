/**
 * CELESTIUM — THEME (dark ⇄ light)
 *
 * The brand is dark by default; light is an option. The initial theme is
 * set by a tiny inline script in each page's <head> (so there's no flash
 * of the wrong theme before this module loads). Here we just inject the
 * nav toggle and persist the choice.
 */

const KEY = "celestium:theme";

const SUN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>';
const MOON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"/></svg>';

function current(): "light" | "dark" {
  return document.documentElement.dataset["theme"] === "light" ? "light" : "dark";
}

function apply(theme: "light" | "dark"): void {
  if (theme === "light") document.documentElement.dataset["theme"] = "light";
  else delete document.documentElement.dataset["theme"];
  // tell theme-color meta + anything listening (e.g. the starfield)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#eef0f6" : "#050609";
  dispatchEvent(new CustomEvent("celestium:themechange", { detail: theme }));
}

export function initTheme(): void {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "themetoggle";

  const sync = () => {
    const t = current();
    btn.innerHTML = t === "light" ? MOON : SUN;
    btn.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
    btn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
  };
  sync();

  btn.addEventListener("click", () => {
    const next = current() === "light" ? "dark" : "light";
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (_e) { /* private mode */ }
    sync();
  });

  // place it with the other nav icon buttons (before the sound toggle)
  const sound = document.getElementById("sound");
  if (sound && sound.parentElement) sound.parentElement.insertBefore(btn, sound);
  else document.querySelector("nav")?.appendChild(btn);
}
