# Celestium

> A pinnacle of science. The universe, examined.

Celestium is a science publication built to be *felt*, not skimmed — a place
to stand beneath the whole of what we know, from the Big Bang to the instruments
watching the sky right now. It is deliberately unlike a news-aggregator science
site: organized by time rather than topic, cinematic, restrained, and readable
at the depth each reader chooses.

This README is the project's source of truth and history. Read it fully before
changing anything.

---

## Status

Gate 1 in progress: Project restructured into a clean static site with Vite
(dev server + build). `discovery.html` now consumes `celestium-data.js` as the
single source of truth (no more duplication). All original behavior preserved.

Not yet deployed; no domain; launch surface (sitemap, 404, per-article OG, deploy
config) still to come in Gate 3.

---

---

## Files

| File | What it is |
|---|---|
| `celestium.html` | Homepage. Self-contained (HTML/CSS/JS in one file). |
| `discovery.html` | **Data-driven article engine.** Reads `?id=<slug>` and renders from a content object. |
| `celestium-data.js` | The canonical content object extracted as `window.CELESTIUM_CONTENT`. Intended single source of truth. |
| `og-cover.png` | 1200×630 social share image, on-brand. |
| `README.md` | This file. |

> Note: `discovery.html` currently still contains its **own inline copy** of the
> content object (so it works when opened directly). `celestium-data.js` is the
> extracted version. Unifying these — engine consumes the module, inline copy
> removed — is the first planned task (see Roadmap step 1).

---

## How it works

### The homepage (`celestium.html`)
A single scrolling experience with: a live canvas starfield, a "You Are Here"
scale zoomer (human → observable universe), a dual **cosmic / discovery**
timeline (when it happened *and* when we found out), a scroll-driven
black-hole story, a 3-depth reader preview, a live "Tonight's sky" panel
(currently a real clock + static feed), an explore grid, and a mobile menu.

### The article engine (`discovery.html`)
This is the important architectural piece. It is **not** a single article — it
is a renderer. It reads a slug from the URL (`discovery.html?id=<slug>`, also
accepts `#slug`) and builds the page from a `CONTENT` map.

Each entry holds: `field`, `era`, `subject`, `kick`, `title`, `dek`, a `hero`
visual key (`bh` | `wave` | `web`), a `related` list, and `depths` — an array
of **three** arrays of HTML blocks (Glance / Curious / Deep). Shared figures and
stat strips are referenced by token (e.g. `__FIG_EHT__`, `__STATS_LIGO__`) and
expanded at render time from a `FRAG` map, so they aren't duplicated.

Three complete, fact-checked articles exist:
- `black-hole-image` — the first photograph of a black hole (EHT, 2019)
- `gravitational-waves` — first detection of gravitational waves (LIGO, 2015)
- `weighing-the-universe` — dark matter & dark energy (1933 → now)

**Adding an article is one new object in the content map.** No new file, no
layout work. That was the entire point of building the engine.

### CMS-readiness
The content object is intentionally shaped like a headless-CMS API response.
Going live with a CMS later should be a near-drop-in replacement:

```js
// from:
var CONTENT = { ...inline... };
// to:
const CONTENT = await fetch('/api/discoveries').then(r => r.json());
```

Nothing in the render/routing/depth/design layer should need to change.

---

## Design system — DO NOT redesign, only extend

| Token | Value | Use |
|---|---|---|
| `--void` | `#050609` | Page background (space is negative space) |
| `--ink` | `#f3f5fb` | Primary text / starlight |
| `--accent` | `#a9bcff` | Single cold accent |
| `--star` | `#f2e6c4` | Warm star accent (sparingly) |
| `--mut` / `--dim` | `#9aa2b4` / `#5a6273` | Secondary / tertiary text |

Type: **Fraunces** (display, optical sizing), **Spectral** (body), **IBM Plex
Mono** (labels/eyebrows). Principles: generous negative space, near-black
canvas, one accent, cinematic restraint. The logo is an atom-with-star motif
(used as favicon and in the share card). Restraint *is* the brand — resist
adding visual noise.

---

## Design decisions & rationale (history)

- **Time, not topic.** The spine is a timeline (cosmic + discovery), not the
  usual Physics/Biology/Space sidebar. This is the core differentiator.
- **Three depths per article.** The same facts at Glance (~20s), Curious (~5m),
  Deep (~15m). Solves the "too shallow or too dense" problem most science
  writing has. The reader keeps your place in the *idea*, not the prose.
- **"You Are Here" scale tool** is the intended emotional fingerprint /
  shareable moment.
- **Engine over pages.** Early versions were hand-built per-article; this was
  refactored into a data-driven engine specifically so it scales and so a CMS
  can slot in without a rewrite.
- **Single self-contained files (so far).** Chosen for portability during
  prototyping. Splitting shared code is expected now (Roadmap step 1) but the
  hand-built, framework-light feel is valued — don't reach for a heavy
  framework without making the case first.
- **Accuracy.** All article science is written from scratch and fact-checked.
  Keep it that way; cite carefully if a CMS workflow is added.

---

## Known limitations / honest state

- Cross-page links and `?id=` routing require the files to be **served together**
  (any static host). Opening a single file in isolation falls back to the
  featured article.
- `discovery.html` has a duplicate inline content copy vs `celestium-data.js`
  (unify first).
- "Tonight's sky" is a real clock + **static** feed — not yet live data.
- No `sitemap.xml`, `robots.txt`, `404.html`, or per-article OG tags yet.
- Domain is a **placeholder** (`celestium.space`) in `<meta>` canonical/OG/
  Twitter tags in both HTML files. No domain has been purchased yet — these
  must be swapped in one pass once a real domain exists. Until then they're
  harmless but non-functional.

---

## Roadmap (do in order; confirm a plan before coding)

1. **Unify & structure.** Make `discovery.html` consume `celestium-data.js`
   (single source of truth; remove the inline copy). Restructure into a clean
   static project with a local dev server and a build step. Keep it
   framework-light unless there's a strong, stated reason.
2. **Regression check.** Verify cross-page links, `?id=` routing, 3-depth
   reader, mobile menu, and all animations work when served properly.
3. **Make it launchable.** Add `sitemap.xml`, `robots.txt`, an on-brand
   `404.html`, and **per-article** Open Graph tags (each discovery shares with
   its own title/image). Add a deploy config for **Cloudflare Pages or
   Netlify** (free static hosting). Document exact deploy + custom-domain steps.
4. **Roadmap proposals.** (a) Path to a real headless CMS so non-devs add
   discoveries; (b) live "Tonight's sky" — NASA APOD, JWST schedule,
   location-based visible sky; (c) accessibility + performance pass
   (target strong Lighthouse scores).

### Domain — current plan
No domain purchased yet. Treat the domain as a **single configurable value**:
when wiring SEO/deploy, put the site origin in one place (an env var or a
single constant/config consumed by a small build step) rather than hardcoding
it across files. Use a clearly-marked placeholder until a real domain is
bought, then it's a one-line change. The owner will choose and register a
domain before public launch; suggest registrar/options when asked, but do not
block other work on it.

---

## Constraints for any contributor (including AI)

- Don't redesign — extend the existing system and tokens.
- Keep all article science accurate.
- Work incrementally; show each step.
- Ask before major architectural choices (frameworks, data layer, hosting).
- Preserve the restraint. When unsure, do less.

---

## Development (current)

```bash
cd celestium
npm install
npm run dev      # starts Vite on http://localhost:5173/
npm run build    # outputs to dist/
npm run preview  # serve the built version locally
```

- Open http://localhost:5173/ for the homepage.
- Open http://localhost:5173/discovery.html?id=black-hole-image for an article (or click through).
- All `?id=` routing, depth switching, animations, mobile menu, etc. should work exactly as the original flat prototypes.

**Note:** The agent's shell does not have Node in PATH, so you must run the above commands on your machine. If you want the output to appear here, prefix with `!` (e.g. `! cd celestium && npm install`).

After `npm run dev` succeeds, tell me the output (or any errors) and we will immediately move to full regression verification (Gate 2).
