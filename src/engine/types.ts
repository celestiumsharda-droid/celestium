/**
 * Celestium — content contracts.
 *
 * These types are the spine of the whole project. Every article, every
 * timeline node, every homepage card validates against them. If a CMS
 * (Decap, Sanity) is wired in later, these are the types the CMS
 * response must conform to — nothing downstream changes.
 */

/** Visual variants registered on the article page (extensible). */
export type HeroVariant = "bh" | "wave" | "web" | "wobble" | "deep-field";

/** A single fragment token that gets expanded at render time. */
export type FragmentToken = `__${string}__`;

/** A discovery's three reading altitudes. Each level is an array of HTML
 *  block strings, with `__TOKEN__` placeholders allowed for shared
 *  fragments registered in src/engine/fragments.ts. */
export type DepthBlocks = readonly string[];

export interface Discovery {
  /** URL slug. When present in a DiscoveryMap value, MUST equal the
   *  object key. Often omitted — engines derive it from the key. */
  slug?: string;
  /** Top-of-page field label, e.g. "Cosmology". */
  field: string;
  /** When the science happened, human-readable, e.g. "2019 CE" or "13.8 Bya". */
  era: string;
  /** Short identifier of the subject of the article. Shown in the byline. */
  subject: string;
  /** Eyebrow over the headline. */
  kick: string;
  /** Display title — may contain inline HTML (`<br>`, `<i>`). */
  title: string;
  /** Subtitle / standfirst. Plain text or limited inline markup. */
  dek: string;
  /** Optional named author. Shown in the byline if present. */
  byline?: string;
  /** Hero visual variant. */
  hero: HeroVariant;
  /** Slugs of related articles to surface in "Pull another thread". */
  related: ReadonlyArray<string | "__scale">;
  /** Three depths: Glance / Curious / Deep. Order is canonical. */
  depths: readonly [DepthBlocks, DepthBlocks, DepthBlocks];
  /** Optional override for the social-card image. Otherwise the
   *  auto-generated per-article OG image is used. */
  ogImage?: string;
}

export type DiscoveryMap = Record<string, Discovery>;

/** Light metadata used by the related-cards rail. Includes pseudo-slugs
 *  like "__scale" that point at non-article destinations. */
export interface RelatedCard {
  field: string;
  title: string;
  href?: string;
  cta?: string;
}

export type RelatedIndex = Record<string, RelatedCard>;

/** Timeline entry on the homepage. `id` (when present) is the slug of
 *  the discovery that closes the loop on this event. */
export interface TimelineEntry {
  /** When it happened — already formatted for display. */
  w: string;
  /** Title of the event. */
  t: string;
  /** Body paragraph shown when expanded. */
  b: string;
  /** "How we know" footnote shown after the body. May contain `<b>`. */
  d: string;
  /** Slug of the corresponding discovery article, if any. */
  id?: string;
}

/** "You Are Here" scale entry. */
export interface ScaleStep {
  /** Glyph (emoji or short symbol). */
  g: string;
  /** Label tag, e.g. "Human", "Planet". */
  l: string;
  /** Subject name, e.g. "Earth", "The Milky Way". */
  n: string;
  /** Size string, e.g. "12,742 km across". */
  s: string;
  /** One-paragraph description. */
  d: string;
}

/** Scrollytelling step (homepage black-hole sequence). */
export interface StoryStep {
  /** Eyebrow. */
  k: string;
  /** Headline. */
  h: string;
  /** Paragraph. */
  p: string;
}

/** Card on the explore grid. */
export interface ExploreCard {
  field: string;
  title: string;
  /** Slug of the discovery this card points at. */
  slug: string;
  /** Call-to-action label, e.g. "Read the discovery". */
  cta: string;
}
