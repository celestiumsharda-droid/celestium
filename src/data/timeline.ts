import type { TimelineEntry } from "../engine/types";

/** "Two clocks, one story" — 14 events in three acts. `ya` is years before
 *  present it happened (the cosmic clock); `knew` is the year we understood
 *  it (the discovery clock). `id` links to a full discovery where one exists.
 *  The order here is the order the swarm materialises through. */
const TIMELINE: readonly TimelineEntry[] = [
  // ACT I — IGNITION
  { w: "13.8 Bya", t: "The Big Bang",            ya: 13.8e9, knew: 1964, b: 'Space, time, energy and the rules themselves begin from a state we still cannot fully describe. There is no "before" we can point to.', d: "Inferred from cosmic expansion (Lemaître, 1927) and confirmed by the leftover heat — the cosmic microwave background, found by accident in <b>1964</b>." },
  { w: "13.8 Bya", t: "First light",             ya: 13.79e9, knew: 1965, b: "After 380,000 years of opaque fog, the universe cools enough for atoms to form and light to fly free for the first time.", d: "That ancient flash is the oldest thing we can ever see — caught by <b>Penzias &amp; Wilson</b> in 1965 and mapped by COBE, WMAP and Planck." },
  { w: "13.5 Bya", t: "The first stars ignite",  ya: 13.5e9, knew: 2022, b: "Gravity pulls primordial hydrogen into the first suns. They burn ferociously, die young, and light up the dark.", d: "JWST was built largely to catch these earliest galaxies — and in <b>2022–2024</b> it found them brighter and earlier than expected." },
  { w: "13 Bya →", t: "Forged in dying stars", ya: 13e9, knew: 1957, b: "The first stars die as supernovae, fusing and scattering carbon, oxygen and iron — the heavy atoms that everything solid, including you, is built from.", d: "Worked out in the landmark <b>1957 B²FH</b> paper; confirmed by the elements seen in stellar spectra and supernova remnants." },
  { w: "4.6 Bya", t: "The Sun and its worlds",   ya: 4.6e9, knew: 1956, b: "A collapsing cloud of that enriched dust spins into a disk; our Sun lights up and the planets sweep their orbits clear.", d: "Pieced together from meteorites — the oldest rocks we can hold — dated radiometrically by <b>Patterson in 1956</b>." },
  // ACT II — AWAKENING
  { w: "3.7 Bya", t: "Life begins on Earth",     ya: 3.7e9, knew: 1977, b: "Somewhere in the young oceans, chemistry crosses a line into biology. Self-copying begins and never stops.", d: "Read from the oldest microbial traces in rock; the deep tree of life resolved only with <b>DNA sequencing</b> from the 1970s on." },
  { w: "2.4 Bya", t: "The breath of oxygen",     ya: 2.4e9, knew: 1968, b: "Microbes invent photosynthesis and flood the air with oxygen — a poison to most life then, and the fuel for all complex life after.", d: "Read from banded-iron formations in the rock record; the <b>Great Oxidation</b> dated to about 2.4 billion years ago." },
  { w: "66 Mya", t: "The day the sky fell",      ya: 66e6, knew: 1980, b: "A city-sized rock ends the dinosaurs in an afternoon, and the small survivors inherit the planet.", d: "The smoking gun: a global iridium layer (<b>Alvarez, 1980</b>) and the buried Chicxulub crater." },
  { w: "300,000 ya", t: "A mind appears",        ya: 300000, knew: 2010, b: "A primate on one continent develops symbolic thought — and eventually starts asking what all of this is.", d: "Dated by fossils and the molecular clock written in our own genomes — including the DNA of the extinct relatives we interbred with.", id: "ancient-dna" },
  // ACT III — THE UNIVERSE EXAMINES ITSELF
  { w: "1610 CE", t: "Galileo turns a lens upward", ya: 416, knew: 1610, b: "Moons circle Jupiter; Venus shows phases. We gain a new sense, and Earth is demoted from the centre of everything.", d: "The discovery moment itself — the night a hand-ground lens becomes an instrument of cosmic measurement." },
  { w: "1915 CE", t: "Gravity becomes geometry", ya: 111, knew: 1919, b: "Einstein reframes gravity as curved spacetime, predicting black holes, an expanding cosmos, and starlight bending around the Sun.", d: "Tested almost immediately by the <b>1919</b> eclipse, and still passing every test a century on.", id: "black-hole-image" },
  { w: "1929 CE", t: "The universe is growing",  ya: 13.8e9, knew: 1929, b: "Galaxies are all rushing away, and the farther ones faster — space itself is stretching. Run it backwards and everything began together.", d: "<b>Hubble's</b> 1929 measurement of redshift versus distance; the seed of Big Bang cosmology.", id: "expanding-universe" },
  { w: "2015 CE", t: "We hear spacetime ring",   ya: 1.3e9, knew: 2015, b: "Two black holes merged 1.3 billion years ago; the ripple in spacetime reached us in 2015 and stretched our detectors by less than a proton's width.", d: "<b>LIGO</b> — the discovery that opened an entirely new sense for observing the universe.", id: "gravitational-waves" },
  { w: "Now", t: "You, right now",               ya: 0, knew: 2026, b: "A configuration of that primordial stardust, complex enough to model its own 13.8-billion-year origin. That is the strangest fact on this page.", d: "The discovery is ongoing. Every instrument above is adding to it while you sit here." },
];

export default TIMELINE;
