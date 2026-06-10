/**
 * CELESTIUM — LIQUID GLASS
 * Gives every glass surface a live specular highlight that follows the
 * pointer, so it reads as a real curved sheet of glass catching light.
 * One delegated pointer listener sets two CSS custom properties (--gx / --gy)
 * on whichever glass surface is under the cursor; the surface's own background
 * gradient (see tokens.css) renders the highlight. Cheap regardless of how
 * many cards are on the page, and a no-op on touch / reduced-motion.
 */
const SURFACES = ".glass, .glass-soft, .card, .feat, .exp, .nextseries, .et-tile, .cmdk-panel, .navsearch, .soundtoggle, .btn, .reader, .toggle, .seg, .cat-card, .et-begin, .et-continue, .sd-personalize";

/** Inject the shared SVG displacement filter once — it bends (refracts) the
 *  backdrop behind a glass pane like a real thick lens. Referenced from CSS
 *  via `backdrop-filter: url(#lg-refract)` on the showcase surfaces. */
function injectRefraction(): void {
  if (document.getElementById("lg-refract-svg")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "lg-refract-svg";
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  svg.innerHTML =
    '<filter id="lg-refract" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.004 0.0065" numOctaves="2" seed="11" result="n"/>' +
      '<feGaussianBlur in="n" stdDeviation="9" result="nb"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="nb" scale="44" xChannelSelector="R" yChannelSelector="G"/>' +
    "</filter>";
  document.body.appendChild(svg);
}

export function initLiquidGlass(): void {
  injectRefraction();   // always — the static refraction is part of the material
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // phones & tablets: the glass reacts to MOVEMENT — tilting the device slides
  // the catch-light across every pane (custom properties inherit, so setting
  // the root moves all glass at once; pointer values still win per-element).
  if (matchMedia("(hover: none)").matches) {
    let raf = 0, gx = 24, gy = -10, ga = 240;
    addEventListener("deviceorientation", e => {
      if (e.gamma == null || e.beta == null) return;
      gx = 50 + Math.max(-30, Math.min(30, e.gamma)) * 1.8;          // left-right tilt
      gy = 10 + Math.max(-30, Math.min(30, e.beta - 40)) * 1.6;      // toward-away tilt
      ga = 240 + Math.max(-30, Math.min(30, e.gamma)) * 2.4;         // the rim glints swing with the tilt
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        const s = document.documentElement.style;
        s.setProperty("--gx", `${gx.toFixed(1)}%`);
        s.setProperty("--gy", `${gy.toFixed(1)}%`);
        s.setProperty("--ga", `${ga.toFixed(1)}deg`);
      });
    }, { passive: true });
    return;                                                          // no pointer sheen on touch
  }

  let raf = 0;
  let pending: { el: HTMLElement; x: number; y: number; a: number } | null = null;
  const flush = () => {
    raf = 0;
    if (!pending) return;
    pending.el.style.setProperty("--gx", `${pending.x}%`);
    pending.el.style.setProperty("--gy", `${pending.y}%`);
    pending.el.style.setProperty("--ga", `${pending.a}deg`);
  };

  document.addEventListener("pointermove", e => {
    const el = (e.target as HTMLElement)?.closest?.(SURFACES) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    // the rim's bright glint swings around the edge to FACE the pointer —
    // conic 0deg points up, so convert pointer bearing and centre the glint
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const a = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90 - 34;
    pending = { el, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, a: Math.round(a * 10) / 10 };
    if (!raf) raf = requestAnimationFrame(flush);
  }, { passive: true });

  // ease the highlight back to its rest corner when the pointer leaves a surface
  document.addEventListener("pointerout", e => {
    const el = (e.target as HTMLElement)?.closest?.(SURFACES) as HTMLElement | null;
    if (el && !el.contains(e.relatedTarget as Node | null)) {
      el.style.removeProperty("--gx");
      el.style.removeProperty("--gy");
      el.style.removeProperty("--ga");
    }
  }, { passive: true });
}
