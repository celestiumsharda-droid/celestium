/**
 * Highlight-to-share. Select a passage in an article and a small glass
 * button appears; tapping it shares the quote (Web Share API where
 * available, otherwise copies a formatted quote + link to the clipboard).
 */

const ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>';

function toast(msg: string): void {
  let t = document.querySelector<HTMLElement>(".hl-toast");
  if (!t) { t = document.createElement("div"); t.className = "hl-toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout((t as HTMLElement & { _t?: number })._t);
  (t as HTMLElement & { _t?: number })._t = window.setTimeout(() => t!.classList.remove("show"), 2200);
}

export function initHighlightShare(): void {
  const article = document.querySelector<HTMLElement>("article");
  if (!article) return;
  const root: HTMLElement = article;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hl-share";
  btn.setAttribute("aria-label", "Share this quote");
  btn.innerHTML = `${ICON}<span>Share quote</span>`;
  btn.hidden = true;
  document.body.appendChild(btn);

  let quoteText = "";
  const hide = () => { btn.hidden = true; };

  function check(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { hide(); return; }
    const text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < 12) { hide(); return; }
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const host = node.nodeType === 1 ? (node as Element) : node.parentElement;
    if (!host || !root.contains(host)) { hide(); return; }
    // ignore selections inside the reference list / boxes we don't want quoted bare
    if (host.closest(".sources, .byl, .lvltag")) { hide(); return; }
    quoteText = text.length > 280 ? text.slice(0, 277).trimEnd() + "…" : text;

    const r = range.getBoundingClientRect();
    btn.hidden = false;
    const top = r.top + scrollY - btn.offsetHeight - 12;
    btn.style.top = `${Math.max(scrollY + 8, top)}px`;
    btn.style.left = `${Math.min(Math.max(r.left + r.width / 2, 80), innerWidth - 80)}px`;
  }

  document.addEventListener("mouseup", () => setTimeout(check, 10));
  document.addEventListener("touchend", () => setTimeout(check, 10), { passive: true });
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) hide();
  });
  addEventListener("scroll", hide, { passive: true });
  // don't let a click on the button collapse the selection before we read it
  btn.addEventListener("mousedown", e => e.preventDefault());

  btn.addEventListener("click", async () => {
    const url = location.href;
    const title = document.title.replace(/\s+—\s+Celestium\s*$/, "");
    const text = `“${quoteText}”\n— ${title} · Celestium`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Celestium", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast("Quote copied to clipboard");
      }
    } catch (_e) { /* user cancelled / clipboard blocked */ }
    hide();
    window.getSelection()?.removeAllRanges();
  });
}
