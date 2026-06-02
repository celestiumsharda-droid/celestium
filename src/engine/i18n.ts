/**
 * CELESTIUM — i18n scaffolding (client-side UI strings).
 *
 * This is the foundation, not a full translation. English is the only
 * shipped locale and the default, so behaviour is unchanged today.
 *
 * ─── To add a locale (e.g. French) ──────────────────────────────────
 *   1. Copy the `en` dictionary below to a new `fr` object and translate
 *      the values (keep the keys).
 *   2. Register it:  DICTS.fr = fr;
 *   3. The `<html lang>` attribute (or a saved choice) selects it; call
 *      setLocale("fr") from a language switcher.
 *
 * Two notes on scope:
 *   • These are the small, repeated UI strings the engine generates at
 *     runtime. Strings baked into the page HTML would also need
 *     extracting, and the article prose lives in src/data — that content
 *     would be translated in the data layer (or fetched per-locale from a
 *     CMS; see src/data/discoveries.ts).
 *   • Build-time SSR (scripts/*) runs in Node with no `document`; it would
 *     read the target locale from an env var rather than this module.
 */

type Dict = Record<string, string>;

const en: Dict = {
  "depth.glance": "Glance",
  "depth.curious": "Curious",
  "depth.deep": "Deep",
  "depth.glance.tag": "The Glance — the essence in twenty seconds",
  "depth.curious.tag": "The Curious Read — the story, with the mechanism",
  "depth.deep.tag": "The Deep Dive — the full physics and the safeguards",
  "share.quote": "Share quote",
  "share.saved": "Quote card saved · text copied",
  "share.copied": "Quote copied to clipboard",
  "surprise": "Surprise me",
  "read": "Read",
  "sources.heading": "Sources & further reading",
};

const DICTS: Record<string, Dict> = { en };
// DICTS.fr = fr;  // ← register additional locales here

const SAVED_KEY = "celestium:locale";

export function getLocale(): string {
  let saved = "";
  try { saved = localStorage.getItem(SAVED_KEY) || ""; } catch (_e) { /* ignore */ }
  const lang = saved || (typeof document !== "undefined" ? document.documentElement.lang : "") || "en";
  return DICTS[lang] ? lang : "en";
}

/** Translate a key for the active locale, falling back to English then
 *  the key itself, so a missing string is never blank. */
export function t(key: string): string {
  const d = DICTS[getLocale()] ?? en;
  return d[key] ?? en[key] ?? key;
}

export function availableLocales(): string[] {
  return Object.keys(DICTS);
}

export function setLocale(locale: string): void {
  if (!DICTS[locale]) return;
  try { localStorage.setItem(SAVED_KEY, locale); } catch (_e) { /* ignore */ }
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}
