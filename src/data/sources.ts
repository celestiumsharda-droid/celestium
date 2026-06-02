/**
 * CELESTIUM — SOURCES (primary literature)
 *
 * Each discovery cites the landmark work(s) it rests on. These are the
 * actual papers, rendered as a reference list at the foot of every
 * article — the evidence behind "how we know it is real". Curated by
 * hand; kept deliberately short (the seminal result, a key confirmation,
 * and the recognition where one exists).
 */

import type { SourceMap } from "../engine/types";

const SOURCES: SourceMap = {
  "black-hole-image": [
    { by: "Event Horizon Telescope Collaboration", title: "First M87 Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole", where: "The Astrophysical Journal Letters, 2019" },
    { by: "Event Horizon Telescope Collaboration", title: "First Sagittarius A* EHT Results. I. The Shadow of the Supermassive Black Hole in the Centre of the Milky Way", where: "The Astrophysical Journal Letters, 2022" },
    { by: "A. Einstein", title: "Die Grundlage der allgemeinen Relativitätstheorie", where: "Annalen der Physik, 1916" },
  ],
  "gravitational-waves": [
    { by: "B. P. Abbott et al. (LIGO Scientific & Virgo Collaborations)", title: "Observation of Gravitational Waves from a Binary Black Hole Merger", where: "Physical Review Letters, 2016" },
    { by: "B. P. Abbott et al.", title: "GW170817: Observation of Gravitational Waves from a Binary Neutron Star Inspiral", where: "Physical Review Letters, 2017" },
    { by: "R. Weiss, B. C. Barish & K. S. Thorne", title: "The Nobel Prize in Physics", where: "awarded 2017" },
  ],
  "weighing-the-universe": [
    { by: "F. Zwicky", title: "Die Rotverschiebung von extragalaktischen Nebeln", where: "Helvetica Physica Acta, 1933" },
    { by: "V. C. Rubin & W. K. Ford", title: "Rotation of the Andromeda Nebula from a Spectroscopic Survey of Emission Regions", where: "The Astrophysical Journal, 1970" },
    { by: "A. G. Riess et al.; S. Perlmutter et al.", title: "Evidence for an accelerating universe from Type Ia supernovae", where: "Astron. J., 1998; Astrophys. J., 1999" },
    { by: "Planck Collaboration", title: "Planck 2018 Results. VI. Cosmological Parameters", where: "Astronomy & Astrophysics, 2020" },
  ],
  "first-exoplanet": [
    { by: "M. Mayor & D. Queloz", title: "A Jupiter-mass companion to a solar-type star", where: "Nature, 1995" },
    { by: "M. Mayor & D. Queloz", title: "The Nobel Prize in Physics", where: "awarded 2019" },
  ],
  "double-slit": [
    { by: "T. Young", title: "The Bakerian Lecture: Experiments and Calculations Relative to Physical Optics", where: "Phil. Trans. of the Royal Society, 1804" },
    { by: "M. Born", title: "Zur Quantenmechanik der Stoßvorgänge (the probability interpretation)", where: "Zeitschrift für Physik, 1926" },
    { by: "C. Davisson & L. H. Germer", title: "Diffraction of Electrons by a Crystal of Nickel", where: "Physical Review, 1927" },
    { by: "A. Tonomura et al.", title: "Demonstration of single-electron buildup of an interference pattern", where: "American Journal of Physics, 1989" },
  ],
  "age-of-earth": [
    { by: "C. C. Patterson", title: "Age of meteorites and the earth", where: "Geochimica et Cosmochimica Acta, 1956" },
    { by: "J. W. Valley et al.", title: "Hadean age for a post-magma-ocean zircon confirmed by atom-probe tomography", where: "Nature Geoscience, 2014" },
  ],
  "double-helix": [
    { by: "J. D. Watson & F. H. C. Crick", title: "Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid", where: "Nature, 1953" },
    { by: "R. E. Franklin & R. G. Gosling", title: "Molecular Configuration in Sodium Thymonucleate (Photo 51)", where: "Nature, 1953" },
    { by: "M. Meselson & F. W. Stahl", title: "The Replication of DNA in Escherichia coli", where: "PNAS, 1958" },
  ],
  "ancient-dna": [
    { by: "R. E. Green et al.", title: "A Draft Sequence of the Neandertal Genome", where: "Science, 2010" },
    { by: "D. Reich et al.", title: "Genetic history of an archaic hominin group from Denisova Cave in Siberia", where: "Nature, 2010" },
    { by: "S. Pääbo", title: "The Nobel Prize in Physiology or Medicine", where: "awarded 2022" },
  ],
  "cosmic-background": [
    { by: "A. A. Penzias & R. W. Wilson", title: "A Measurement of Excess Antenna Temperature at 4080 Mc/s", where: "The Astrophysical Journal, 1965" },
    { by: "R. H. Dicke, P. J. E. Peebles, P. G. Roll & D. T. Wilkinson", title: "Cosmic Black-Body Radiation", where: "The Astrophysical Journal, 1965" },
    { by: "J. C. Mather et al.", title: "A Preliminary Measurement of the CMB Spectrum by COBE (FIRAS)", where: "The Astrophysical Journal, 1990" },
    { by: "G. F. Smoot et al.", title: "Structure in the COBE Differential Microwave Radiometer First-Year Maps", where: "The Astrophysical Journal Letters, 1992" },
  ],
  "plate-tectonics": [
    { by: "A. Wegener", title: "Die Entstehung der Kontinente und Ozeane (The Origin of Continents and Oceans)", where: "1915" },
    { by: "H. H. Hess", title: "History of Ocean Basins", where: "Petrologic Studies, Geological Society of America, 1962" },
    { by: "F. J. Vine & D. H. Matthews", title: "Magnetic Anomalies over Oceanic Ridges", where: "Nature, 1963" },
  ],
  "penicillin": [
    { by: "A. Fleming", title: "On the Antibacterial Action of Cultures of a Penicillium, with Special Reference to their Use in the Isolation of B. influenzæ", where: "British Journal of Experimental Pathology, 1929" },
    { by: "E. Chain, H. W. Florey et al.", title: "Penicillin as a Chemotherapeutic Agent", where: "The Lancet, 1940" },
    { by: "A. Fleming, E. Chain & H. Florey", title: "The Nobel Prize in Physiology or Medicine", where: "awarded 1945" },
  ],
  "crispr": [
    { by: "M. Jinek, K. Chylinski, I. Fonfara, M. Hauer, J. A. Doudna & E. Charpentier", title: "A Programmable Dual-RNA–Guided DNA Endonuclease in Adaptive Bacterial Immunity", where: "Science, 2012" },
    { by: "R. Barrangou et al.", title: "CRISPR Provides Acquired Resistance Against Viruses in Prokaryotes", where: "Science, 2007" },
    { by: "E. Charpentier & J. A. Doudna", title: "The Nobel Prize in Chemistry", where: "awarded 2020" },
  ],
  "expanding-universe": [
    { by: "E. Hubble", title: "A Relation between Distance and Radial Velocity among Extra-Galactic Nebulae", where: "PNAS, 1929" },
    { by: "G. Lemaître", title: "Un Univers homogène de masse constante et de rayon croissant…", where: "Annales de la Société Scientifique de Bruxelles, 1927" },
    { by: "H. S. Leavitt & E. C. Pickering", title: "Periods of 25 Variable Stars in the Small Magellanic Cloud", where: "Harvard College Observatory Circular, 1912" },
  ],
  "periodic-table": [
    { by: "D. Mendeleev", title: "On the Relationship of the Properties of the Elements to their Atomic Weights", where: "Zeitschrift für Chemie, 1869" },
    { by: "D. Mendeleev", title: "The Periodic Law of the Chemical Elements (predicting eka-silicon)", where: "Journal of the Chemical Society, 1871" },
    { by: "H. G. J. Moseley", title: "The High-Frequency Spectra of the Elements (atomic number)", where: "Philosophical Magazine, 1913" },
  ],
  "vaccination": [
    { by: "E. Jenner", title: "An Inquiry into the Causes and Effects of the Variolae Vaccinae", where: "1798" },
    { by: "F. Fenner, D. A. Henderson, I. Arita, Z. Ježek & I. D. Ladnyi", title: "Smallpox and its Eradication", where: "World Health Organization, 1988" },
    { by: "World Health Organization", title: "Declaration of Global Eradication of Smallpox", where: "Resolution WHA33.3, 1980" },
  ],
};

export default SOURCES;
