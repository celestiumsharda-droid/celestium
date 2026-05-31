# Celestium roadmap

Phased plan, in order. **Do not skip phases.** Each one assumes the
previous is solid.

Status legend: ✅ done · 🔧 in progress · 🟡 next · ⏸ later

---

## Phase 0 — Foundation ✅

The scaffolding that everything else compounds on.

- ✅ Vite + TypeScript project (`vite.config.ts`, `tsconfig.json`, strict mode).
- ✅ Data layer: every piece of content as a typed module under `src/data/`.
- ✅ Engine layer: TS engines for homepage and article (`src/engine/`).
- ✅ Style layer: `tokens.css` + `home.css` + `discovery.css`.
- ✅ Per-slug HTML build (`scripts/build-discoveries.ts`).
- ✅ Per-article SVG OG card generation (`scripts/build-og-images.ts`).
- ✅ Sitemap generation (`scripts/build-sitemap.ts`).
- ✅ 404, robots, Cloudflare `_redirects`, `_headers`.
- ✅ Accessibility baseline: reduced-motion, focus rings, skip link,
  ARIA on toggles + menu, semantic landmarks.
- ✅ Living-sky panel: NASA APOD + client-side planet ephemeris.
- ✅ View-Transitions API opt-in (multi-page mode).
- ✅ Image pipeline scaffolding (`vite-imagetools`).
- ✅ Four fact-checked articles (EHT, LIGO, dark-mass, first exoplanet).
- ✅ `DEPLOY.md`, `CONTRIBUTING.md`, this file.

**Exit criteria:** `npm run dev` renders the homepage and all articles
cleanly; `npm run build` produces a complete `dist/` with per-slug
pages, OG cards, and sitemap; `npm run typecheck` is green.

---

## Phase 1 — Visual elevation 🟡

Lift each article from "good landing page" to "Pudding-class essay."
Foundation already supports this — Phase 1 just uses what's there.

- ⏸ **Per-article scrollytelling component.** A reusable `<scrolly>`
  module that takes data (steps) and a render callback (canvas / WebGL /
  SVG). Black-hole article uses it as the reference implementation;
  others follow.
- ⏸ **WebGL hero variants** beyond the static SVG ones we have today.
  Start with a particle-field deep-field for `first-exoplanet`.
- ⏸ **Variable-font choreography.** Animate Fraunces optical size /
  weight on scroll-position so headlines breathe.
- ⏸ **Per-article custom OG art.** Replace the generic SVG template
  with art that matches the article hero. Generated at build time.
- ⏸ **Sound design** (muted by default, opt-in toggle in nav). One
  ambient pad on the homepage; subtle UI clicks on toggles.
- ⏸ **Image pipeline used.** Add real photos to articles where they
  matter (EHT M87 image, LIGO control room, etc.), with full
  responsive srcset + AVIF/WebP via `vite-imagetools`.

**Exit criteria:** at least one article (recommend EHT) is at "I would
share this on Twitter and people would say 'wait, what site is this?'"
quality.

---

## Phase 2 — Content depth ⏸

Four more articles, each with an inline interactive.

- ⏸ **JWST and the early universe** — interactive deep-field zoom.
- ⏸ **The cosmic microwave background, 1964** — interactive
  spectrum dial showing the 2.725 K blackbody curve.
- ⏸ **Hubble's law / cosmic expansion (1929)** — distance-vs-velocity
  scatter plot with a user-drawable slope.
- ⏸ **The Drake equation revisited** — slider-driven calculator.

Each piece must:
- pass science accuracy review by the human,
- include citations in a footnote / "Further reading" section,
- ship with its own bespoke hero variant.

---

## Phase 3 — Live sky maximalist ⏸

Expand the "Tonight" panel into a real-time observatory dashboard.

- ⏸ **JWST schedule** — STScI public JSON of upcoming observations.
- ⏸ **ISS live position** — NASA Open API.
- ⏸ **NOAA aurora forecast** — Kp index + ovation map for the user's
  latitude.
- ⏸ **Geolocation-aware visible sky** — once user opts in, show what's
  above their horizon right now.
- ⏸ **A live constellation map** — small canvas, real coordinates.

---

## Phase 4 — Engineering polish ⏸

- ⏸ **Playwright visual-regression tests** on the four articles + homepage.
- ⏸ **CI on every PR** — GitHub Actions: typecheck, build, test.
- ⏸ **Lighthouse 100s** — performance, accessibility, best-practices, SEO.
- ⏸ **Decap CMS at `/admin`** — git-based, free; non-devs can edit.
- ⏸ **Article schema.org structured data** for better Google previews.

---

## Phase 5 — Content scale ⏸

Bring the article count to 10–15. New articles only after Phase 1's
visual upgrade is in place, so they ship at the higher bar.

Topics to consider (human picks): pulsars, neutron-star merger
GW170817, dark-matter direct detection, exoplanet atmospheres,
Voyager + the interstellar medium, the Great Oxygenation Event,
RNA-world hypothesis, the age of the Earth, plate tectonics, the
Anthropocene as a stratigraphic concept, antimatter asymmetry.

---

## Out of scope (for now)

- A native app.
- A user-account / saved-reading system.
- Comments or social features.
- Multilingual content.
- Print / export as PDF.

These are not "no forever" — they are "not until everything in this
file is shipped."
