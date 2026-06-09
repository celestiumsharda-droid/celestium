/**
 * CELESTIUM — LIQUID GLASS
 * Gives every glass surface a live specular highlight that follows the
 * pointer, so it reads as a real curved sheet of glass catching light.
 * One delegated pointer listener sets two CSS custom properties (--gx / --gy)
 * on whichever glass surface is under the cursor; the surface's own background
 * gradient (see tokens.css) renders the highlight. Cheap regardless of how
 * many cards are on the page, and a no-op on touch / reduced-motion.
 */
const SURFACES = ".glass, .glass-soft, .card, .feat, .et-tile, .cmdk-panel, .navsearch, .soundtoggle";

export function initLiquidGlass(): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (matchMedia("(hover: none)").matches) return;            // touch: no pointer sheen

  let raf = 0;
  let pending: { el: HTMLElement; x: number; y: number } | null = null;
  const flush = () => {
    raf = 0;
    if (!pending) return;
    pending.el.style.setProperty("--gx", `${pending.x}%`);
    pending.el.style.setProperty("--gy", `${pending.y}%`);
  };

  document.addEventListener("pointermove", e => {
    const el = (e.target as HTMLElement)?.closest?.(SURFACES) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    pending = { el, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    if (!raf) raf = requestAnimationFrame(flush);
  }, { passive: true });

  // ease the highlight back to its rest corner when the pointer leaves a surface
  document.addEventListener("pointerout", e => {
    const el = (e.target as HTMLElement)?.closest?.(SURFACES) as HTMLElement | null;
    if (el && !el.contains(e.relatedTarget as Node | null)) {
      el.style.removeProperty("--gx");
      el.style.removeProperty("--gy");
    }
  }, { passive: true });
}
