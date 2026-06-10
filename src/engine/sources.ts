/**
 * Renders an article's primary-source reference list. Pure (no DOM), so
 * it runs both in the browser (discovery.ts) and at build time
 * (scripts/build-discoveries.ts) for crawler-visible, server-rendered
 * citations.
 */

import SOURCES from "../data/sources";
import { t } from "./i18n";

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Inner HTML for the #sources section. Empty string if none. */
export function sourcesHTML(slug: string): string {
  const list = SOURCES[slug];
  if (!list || list.length === 0) return "";
  const items = list
    .map(
      s =>
        `<li><span class="src-by">${esc(s.by)}</span>` +
        `<span class="src-t">${esc(s.title)}</span>` +
        `<span class="src-w">${esc(s.where)}</span></li>`,
    )
    .join("");
  return (
    `<h2 class="srch">${esc(t("sources.heading"))}</h2>` +
    `<div class="srcstamp"><span class="srcstamp-dot"></span>${list.length} primary ${list.length === 1 ? "source" : "sources"} · checked against the original papers</div>` +
    `<ol class="srclist">${items}</ol>` +
    `<p class="srcnote">Celestium retells peer-reviewed science for a general audience. Where a claim rests on a specific result, the primary work is cited above — read it at the source.</p>`
  );
}
