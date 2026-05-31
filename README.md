# Celestium

> A pinnacle of science. The universe, examined.

A science publication built to be *felt*, not skimmed — organised by time
rather than topic, cinematic, restrained, and readable at the depth each
reader chooses.

**Status:** working foundation, pre-launch. Vite project with a
TypeScript engine, data modules as single source of truth, four
fact-checked articles, live "Tonight" panel (NASA APOD + client-side
planet ephemeris), accessibility pass complete, build emits per-article
HTML + per-article OG cards + sitemap, ready to deploy.

This README + `ROADMAP.md` + `CONTRIBUTING.md` are the project's source
of truth. Read them fully before changing anything.

---

## Quick start

```powershell
npm install
npm run dev       # vite dev server on http://localhost:5173/
npm run build     # vite + per-slug HTML + per-article OG + sitemap
npm run preview   # serve the built dist/ on http://localhost:4173/
npm run typecheck # tsc --noEmit, strict mode
npm run lint
npm run format
npm test          # playwright (when tests exist)
```

### Environment

Copy `.env.example` to `.env.local` to set a real NASA API key for the
homepage APOD card. `DEMO_KEY` works for dev (~30 req/h shared across
all NASA endpoints).

---

## Project shape

```
celestium/
├── public/                       # copied verbatim to dist/
│   ├── og-cover.png              # default social card
│   ├── robots.txt
│   ├── _redirects                # Cloudflare legacy URL rules
│   └── _headers                  # Cloudflare cache rules
├── src/
│   ├── index.html
│   ├── discovery.html            # template — emitted per slug at build
│   ├── 404.html
│   ├── vite-env.d.ts
│   ├── data/                     # single source of truth
│   │   ├── discoveries.ts
│   │   ├── timeline.ts
│   │   ├── scales.ts
│   │   ├── story.ts
│   │   ├── depth-preview.ts
│   │   └── explore.ts
│   ├── engine/
│   │   ├── types.ts              # content contracts
│   │   ├── home.ts
│   │   ├── discovery.ts
│   │   ├── starfield.ts
│   │   ├── living-sky.ts         # APOD + ephemeris
│   │   ├── fragments.ts
│   │   ├── related-index.ts
│   │   └── view-transitions.ts
│   └── styles/
│       ├── tokens.css            # design tokens — DO NOT redesign, only extend
│       ├── home.css
│       └── discovery.css
├── scripts/
│   ├── build-discoveries.ts      # per-slug HTML emission
│   ├── build-og-images.ts        # per-article OG card SVG/PNG
│   └── build-sitemap.ts
├── site.config.ts                # origin / brand / OG defaults (single value)
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── CONTRIBUTING.md               # how multiple agents collaborate
├── ROADMAP.md                    # phased plan
└── DEPLOY.md                     # Cloudflare Pages walkthrough
```

---

## How it works

### Engine
- `src/engine/types.ts` defines `Discovery`, `TimelineEntry`, etc.
  Every data file validates against these.
- `home.ts` and `discovery.ts` are tiny — they read data, render DOM,
  attach behaviour. No frameworks.
- `starfield.ts` runs the canvas starfield, with parallax + reduced-
  motion + visibility-aware pause.
- `living-sky.ts` is the live "Tonight" panel: NASA APOD fetch
  + a low-precision Keplerian ephemeris for the visible planets.
- `view-transitions.ts` opts into the multi-page View Transitions API.
- `fragments.ts` holds shared HTML fragments (stat strips, the EHT
  figure) referenced by token in article depths.

### Build
1. **Vite** bundles `index.html`, `discovery.html`, `404.html` and
   all TypeScript / CSS.
2. **`scripts/build-discoveries.ts`** clones `dist/discovery.html`
   once per discovery slug into `dist/discoveries/<slug>/index.html`,
   stamping in per-article `<title>`, `meta`, OG, Twitter, canonical.
   Crawlers that don't run JS see the right preview.
3. **`scripts/build-og-images.ts`** generates a 1200×630 SVG OG card
   per article (and PNG via optional `sharp`).
4. **`scripts/build-sitemap.ts`** emits `dist/sitemap.xml`.

### Adding a discovery
1. Add one object to `src/data/discoveries.ts` validating `Discovery`.
2. Add a row in `src/engine/related-index.ts`.
3. (Optional) Add a timeline entry in `src/data/timeline.ts`.
4. (Optional) Add an explore-grid card in `src/data/explore.ts`.

No new files. No layout changes. No build config changes.

---

## Design system — DO NOT redesign

| Token         | Value      | Use                                  |
|---------------|------------|--------------------------------------|
| `--void`      | `#050609`  | Page background                      |
| `--ink`       | `#f3f5fb`  | Primary text / starlight             |
| `--accent`    | `#a9bcff`  | Single cold accent                   |
| `--star`      | `#f2e6c4`  | Warm star accent (sparingly)         |
| `--mut`       | `#9aa2b4`  | Secondary text                       |
| `--dim`       | `#5a6273`  | Tertiary text / dividers             |

Type: **Fraunces** (display), **Spectral** (body), **IBM Plex Mono**
(labels). Generous negative space, near-black canvas, one accent,
cinematic restraint. Restraint *is* the brand.

All tokens live in `src/styles/tokens.css`. Both pages import it.

---

## See also

- **`ROADMAP.md`** — phased plan with status. Read before picking work.
- **`CONTRIBUTING.md`** — rules for multi-agent collaboration. Read before pushing.
- **`DEPLOY.md`** — exact click-path to deploy on Cloudflare Pages.
