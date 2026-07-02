/**
 * Kept as a compatibility hook for older page entrypoints.
 * Celestium now uses the native cursor so controls feel predictable.
 */
export function initCursor(): void {
  document.querySelectorAll(".lj-cursor").forEach(el => el.remove());
}
