/**
 * Lightweight wrapper around the View Transitions API.
 *
 * Where supported (Chromium 111+, Safari 18+), cross-page navigations
 * within the same origin get a soft crossfade. Where unsupported, links
 * navigate normally — no behavioural difference, only a missing flourish.
 *
 * This is deliberately minimal: no SPA routing, no client-side state
 * machine. We're a static site; navigations remain full document loads.
 * The View Transitions API works on full navigations via the same-origin
 * `pageswap` / `pagereveal` events (multi-page mode).
 */

declare global {
  interface Document {
    startViewTransition?: (cb: () => void | Promise<void>) => unknown;
  }
}

export function enableViewTransitions(): void {
  // Multi-page View Transitions need this meta to opt in. Inject if absent.
  if (!document.querySelector('meta[name="view-transition"]')) {
    const m = document.createElement("meta");
    m.name = "view-transition";
    m.content = "same-origin";
    document.head.appendChild(m);
  }
}
