/**
 * Cursor spotlight: a soft glow that tracks the pointer across a grid of
 * cards, giving the glass a sense of depth and life. Pointer-only (skipped
 * on touch and under reduced motion). Delegated — one listener per grid.
 */
export function attachSpotlight(container: HTMLElement | null, selector: string): void {
  if (!container) return;
  if (matchMedia("(hover: none), (pointer: coarse)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Batch to one layout read + style write per frame: pointermove can fire
  // several times per frame, and reading the rect each time forces a sync
  // layout. rAF coalesces them, so the effect never costs a dropped frame.
  let raf = 0;
  let pendingCard: HTMLElement | null = null;
  let px = 0, py = 0;

  container.addEventListener("pointermove", (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (!card || !container.contains(card)) return;
    pendingCard = card; px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const c = pendingCard;
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${((px - r.left) / r.width) * 100}%`);
      c.style.setProperty("--my", `${((py - r.top) / r.height) * 100}%`);
    });
  }, { passive: true });
}
