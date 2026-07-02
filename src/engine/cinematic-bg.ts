/* THE LIVE CINEMATIC BACKGROUND — the real Atlas engine, mounted headless
   behind the home. No HUD, no labels, no input: just a documentary camera
   drifting through the worlds we actually have — the Solar System and the
   exoplanet systems — composed off-centre like a film, with the engine's own
   log-space ease carrying the hyperdrive rush between systems. Lazy-loaded,
   desktop-only; the static hero underneath remains the instant first paint. */

interface CineCmd {
  on?: boolean;
  name?: string; radii?: number;
  offX?: number; offY?: number;
  driftYaw?: number; driftPitch?: number; dolly?: number;
  yaw?: number; pitch?: number;
}
type AtlasWin = Window & { __atlasCine?: (c: CineCmd) => void };

const div = (html?: string): HTMLElement => {
  const d = document.createElement("div");
  if (html) d.innerHTML = html;
  return d;
};

/* One documentary shot: a world, its framing, its motion. offX places the
   subject left (+) or right (−) of centre; drift is the slow orbital creep
   during the dwell; dolly breathes the distance (− pushes in, + pulls out). */
interface Shot {
  name: string; radii: number;
  offX?: number; offY?: number;
  driftYaw?: number; driftPitch?: number; dolly?: number;
  dwell?: number;            // ms on the shot once framed (travel adds on top)
}

/* The tour. Anchored at home, then out through the neighbourhood, then the
   far worlds — lava, ultra-hot, temperate — and back in. Compositions swing
   between thirds so consecutive shots cut like a sequence, and every dwell
   has a different motion so no two shots feel machine-made. */
const TOUR: Shot[] = [
  // the quote lives on the LEFT — every world composes right of centre,
  // varying how far right + how high so the sequence still cuts like film
  { name: "Earth",        radii: 2.7, offX: +0.34, offY: -0.10, driftYaw: +0.016, dolly: -0.004, dwell: 12000 },
  { name: "Moon",         radii: 3.1, offX: +0.38, offY: -0.04, driftYaw: -0.014, dolly: -0.005, dwell: 10500 },
  { name: "Mars",         radii: 2.9, offX: +0.30, offY: +0.08, driftYaw: +0.018, driftPitch: -0.004, dwell: 10500 },
  { name: "Jupiter",      radii: 3.3, offX: +0.40, offY: -0.08, driftYaw: +0.012, dolly: -0.003, dwell: 12000 },
  { name: "55 Cnc e",     radii: 2.9, offX: +0.32, offY: -0.02, driftYaw: +0.02,  dolly: -0.004, dwell: 12500 },
  { name: "Saturn",       radii: 4.4, offX: +0.26, offY: -0.12, driftYaw: -0.010, dolly: -0.003, dwell: 13000 },
  { name: "KELT-9 b",     radii: 3.4, offX: +0.30, offY: -0.08, driftYaw: -0.016, dolly: -0.004, dwell: 12500 },
  { name: "Neptune",      radii: 3.1, offX: +0.36, offY: +0.06, driftYaw: +0.015, driftPitch: +0.003, dwell: 11000 },
  { name: "Kepler-452 b", radii: 2.8, offX: +0.32, offY: -0.06, driftYaw: +0.017, dolly: -0.005, dwell: 12500 },
  { name: "HD 209458 b",  radii: 3.5, offX: +0.40, offY: -0.10, driftYaw: -0.013, dolly: -0.003, dwell: 12500 },
  { name: "Venus",        radii: 2.9, offX: +0.28, offY: +0.04, driftYaw: +0.014, dwell: 10000 },
  { name: "51 Peg b",     radii: 3.4, offX: +0.36, offY: -0.08, driftYaw: +0.015, dolly: -0.004, dwell: 12000 },
];

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
    console.warn("Cinematic background unavailable — keeping the still.", e);
    return null;
  }

  const w = window as AtlasWin;
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };

  // engage cinema, then run the tour; exoplanet shots wait for the far
  // universe to stream in (the engine builds it across the first frames)
  let i = 0;
  const play = () => {
    const s = TOUR[i % TOUR.length]!;
    i++;
    w.__atlasCine?.({
      on: true,
      name: s.name, radii: s.radii,
      offX: s.offX ?? 0, offY: s.offY ?? 0,
      driftYaw: s.driftYaw ?? 0, driftPitch: s.driftPitch ?? 0, dolly: s.dolly ?? 0,
    });
    // travel (the engine's ease) + dwell, then the next shot
    later(play, (s.dwell ?? 11000) + 4200);
  };
  later(play, 2600);   // let the first frame settle before the first cut

  return () => {
    timers.forEach(clearTimeout);
    w.__atlasCine?.({ on: false });
    try { dispose?.(); } catch { /* already gone */ }
  };
}
