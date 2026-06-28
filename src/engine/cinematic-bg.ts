/* THE LIVE CINEMATIC BACKGROUND — the real Atlas engine, mounted headless
   behind the home: no HUD, no labels, no input. An auto-pilot drifts through
   hero scenes (Earth, Saturn, Jupiter, the galaxy) and the engine's own
   log-space camera ease carries a hyperdrive rush between them. Pure reuse —
   the Atlas page is untouched; we just feed it hidden stubs and drive the
   public fly hooks. Lazy-loaded so the page still paints instantly. */

type AtlasWin = Window & {
  __atlasFly?: (name: string) => void;
  __atlasDist?: (km: number) => void;
  __atlasGalView?: () => void;
};

const div = (html?: string): HTMLElement => {
  const d = document.createElement("div");
  if (html) d.innerHTML = html;
  return d;
};

export async function mountCinematicBackground(canvas: HTMLCanvasElement): Promise<(() => void) | null> {
  // labels render into a hidden container → no labels in the cinematic view
  const labels = div();
  labels.style.cssText = "position:absolute;inset:0;display:none";
  (canvas.parentElement ?? document.body).appendChild(labels);

  // stubs the engine wires harmlessly; sheet + time need their inner shape
  const sheet = div('<div class="at-sheet-name"></div><div class="at-sheet-facts"></div><div class="at-sheet-prose"></div><button class="at-sheet-close"></button>');
  const time = div('<button data-speed="0"></button><button data-speed="1" class="on"></button>');
  const conSearch = document.createElement("input");

  let dispose: (() => void) | null = null;
  try {
    const m = await import("./atlas");
    dispose = m.mountAtlas({
      canvas, labels,
      name: div(), dist: div(), line: div(), more: div(), sheet,
      time, date: div(), nav: div(), consoleEl: div(), conList: div(),
      conSearch, conClose: div(),
    });
  } catch (e) {
    console.warn("Cinematic background unavailable — keeping the starfield.", e);
    return null;
  }

  // ---- the auto-pilot tour: fly to the body, then ease to a hero-framed
  // distance (radii that fill the frame); the galaxy frames itself ----
  const w = window as AtlasWin;
  let frameT = 0;
  const shot = (name: string, dist: number) => () => {
    w.__atlasFly?.(name);
    frameT = window.setTimeout(() => w.__atlasDist?.(dist), 2400);   // settle to cinematic framing
  };
  const SCENES: Array<() => void> = [
    shot("Earth", 16000),
    shot("Saturn", 230000),
    shot("Jupiter", 205000),
    () => w.__atlasGalView?.(),
  ];
  let i = 0, hold = 0;
  const next = () => {
    try { SCENES[i % SCENES.length]?.(); } catch { /* a scene may not be ready yet */ }
    i++;
    hold = window.setTimeout(next, 11000);   // dwell; the eased fly is the hyperdrive between
  };
  const begin = window.setTimeout(next, 1600);   // let the engine settle its first frame

  return () => { clearTimeout(hold); clearTimeout(begin); clearTimeout(frameT); try { dispose?.(); } catch { /* */ } };
}
