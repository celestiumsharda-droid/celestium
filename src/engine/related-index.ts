import type { RelatedIndex } from "./types";

/** Lightweight metadata for "Pull another thread" cards.
 *  The "__scale" pseudo-entry routes back to the homepage scale tool. */
const RELATED_INDEX: RelatedIndex = {
  "black-hole-image":      { field: "Cosmology",          title: "We took a photograph of the unphotographable." },
  "gravitational-waves":   { field: "Spacetime",          title: "The night we heard two black holes collide." },
  "weighing-the-universe": { field: "Cosmology",          title: "How we weighed the entire universe." },
  "first-exoplanet":       { field: "Planetary Science", title: "The night we found a world around another sun." },
  "double-slit":           { field: "Quantum Reality",   title: "Does a particle exist before you look?" },
  "age-of-earth":          { field: "Deep Time",         title: "Reading four billion years out of a rock." },
  "double-helix":          { field: "Life & Origins",    title: "The shape that copies itself." },
  "ancient-dna":           { field: "Human History",     title: "Reading the genomes of the dead." },
  "cosmic-background":     { field: "Origins",           title: "The static that turned out to be the Big Bang." },
  "plate-tectonics":       { field: "Earth Science",     title: "The discovery that the ground is moving." },
  "penicillin":            { field: "Medicine",          title: "The mould that beat infection." },
  "crispr":                { field: "Biotechnology",     title: "We learned to edit the code of life." },
  "expanding-universe":    { field: "Cosmology",         title: "The night we learned the universe is growing." },
  "periodic-table":        { field: "Chemistry",         title: "The table that predicted the unknown." },
  "vaccination":           { field: "Medicine",          title: "How we taught the body to remember a disease." },
  "__scale":               { field: "Perspective",       title: "Find where you sit in thirteen orders of magnitude.", href: "/#scale", cta: "Open the tool" },
};

export default RELATED_INDEX;
