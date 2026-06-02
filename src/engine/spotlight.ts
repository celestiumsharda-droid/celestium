/**
 * Cursor spotlight: a soft glow that tracks the pointer across a grid of
 * cards, giving the glass a sense of depth and life. Pointer-only (skipped
 * on touch and under reduced motion). Delegated — one listener per grid.
 */
export function attachSpotlight(container: HTMLElement | null, selector: string): void {
  if (!container) return;
  if (matchMedia("(hover: none), (pointer: coarse)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  container.addEventListener("pointermove", (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (!card || !container.contains(card)) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, { passive: true });
}
