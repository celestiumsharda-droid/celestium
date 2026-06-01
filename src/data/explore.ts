import type { ExploreCard } from "../engine/types";

/** Explore grid on the homepage. */
const EXPLORE: readonly ExploreCard[] = [
  { field: "Cosmology",          title: "How we weighed the entire universe.",         slug: "weighing-the-universe", cta: "Read the discovery" },
  { field: "Spacetime",          title: "The night we heard two black holes collide.", slug: "gravitational-waves",  cta: "Read the discovery" },
  { field: "Cosmology",          title: "We photographed the unphotographable.",       slug: "black-hole-image",     cta: "Read the discovery" },
  { field: "Planetary Science",  title: "A world around another sun.",                  slug: "first-exoplanet",       cta: "Read the discovery" },
  { field: "Quantum Reality",    title: "Does a particle exist before you look?",       slug: "double-slit",          cta: "Read the discovery" },
  { field: "Deep Time",          title: "Reading four billion years out of rock.",      slug: "age-of-earth",         cta: "Read the discovery" },
  { field: "Life & Origins",     title: "The shape that copies itself.",                slug: "double-helix",         cta: "Read the discovery" },
  { field: "Human History",      title: "Reading the genomes of the dead.",             slug: "ancient-dna",          cta: "Read the discovery" },
];

export default EXPLORE;
