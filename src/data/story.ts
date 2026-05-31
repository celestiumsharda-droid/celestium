import type { StoryStep } from "../engine/types";

/** Scroll-driven black-hole story on the homepage. */
const STORY: readonly StoryStep[] = [
  { k: "2019 · The impossible photograph", h: "You cannot photograph the unseeable.",       p: 'A black hole emits no light by definition. For decades, "imaging" one sounded like a contradiction in terms.' },
  { k: "The method",                       h: "So we built a telescope the size of Earth.", p: "Eight radio observatories across the planet were linked into one virtual dish — the Event Horizon Telescope — using the spin of the Earth itself as the lens." },
  { k: "The data",                         h: "Five petabytes, flown on hard drives.",      p: "The data was too vast for the internet. It was physically shipped, then painstakingly reassembled into a single faint ring." },
  { k: "2019 · First sight",               h: "A shadow, exactly where theory said.",       p: "The silhouette of M87’s black hole appeared — a glowing ring around a void, matching Einstein’s century-old equations to the pixel." },
];

export default STORY;
