import type { ScaleStep } from "../engine/types";

/** The "You Are Here" scale zoomer — thirteen orders of magnitude. */
const SCALES: readonly ScaleStep[] = [
  { g: "🧍", l: "Human",   n: "A person",                       s: "≈ 1.7 metres",         d: "The only scale evolution prepared you to grasp. Everything past this, your species had to reason toward." },
  { g: "🌍", l: "Planet",  n: "Earth",                          s: "12,742 km across",     d: "A single pale stone. Every war, ocean and idea you know of has happened on this one dot." },
  { g: "☀️", l: "System",  n: "The Solar System",               s: "≈ 9 billion km wide",  d: "Eight planets around an ordinary star. Light from the Sun takes 8 minutes to reach you here." },
  { g: "✨", l: "Cluster", n: "Local Stellar Neighbourhood",    s: "≈ 30 light-years",     d: "The handful of stars near enough to name. The fastest probe we have built would need 70,000 years to cross to the closest." },
  { g: "🌌", l: "Galaxy",  n: "The Milky Way",                  s: "≈ 100,000 light-years", d: "Up to 400 billion suns in a slow spiral. Our Sun is one anonymous spark, two-thirds of the way out." },
  { g: "🪐", l: "Group",   n: "The Local Group",                s: "≈ 10 million ly",      d: "Roughly 80 galaxies bound by gravity, with Andromeda and the Milky Way drifting toward an eventual merger." },
  { g: "🕸️", l: "Web",     n: "The Cosmic Web",                 s: "≈ hundreds of Mly",    d: "Galaxies are not scattered — they string along vast filaments around emptier voids, like foam in the dark." },
  { g: "⚪", l: "All",     n: "The Observable Universe",        s: "93 billion ly across", d: "Everything light has had time to bring us. Beyond its edge, almost certainly more — forever out of reach." },
] as const;

export const TICK_LABELS = ["Body", "Planet", "System", "Stars", "Galaxy", "Group", "Web", "All"] as const;

export default SCALES;
