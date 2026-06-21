/**
 * CELESTIUM — the cursor.
 * A small adaptive crystal bead that lags the pointer (liquid), inverts against
 * whatever is behind it — bright on dark, dark on light, the way the macOS
 * cursor reads over any background — and swells over anything you can touch.
 * Desktop / fine-pointer only; touch keeps the native behaviour.
 */
export function initCursor(): void {
  if (!matchMedia("(pointer: fine) and (hover: hover)").matches) return;
  if (document.querySelector(".lj-cursor")) return;                 // never double-init

  const lens = document.createElement("div"); lens.className = "lj-cursor lj-lens"; lens.setAttribute("aria-hidden", "true");
  const bead = document.createElement("div"); bead.className = "lj-cursor lj-bead"; bead.setAttribute("aria-hidden", "true");
  document.body.append(lens, bead);

  const HOT = "a,button,input,textarea,select,label,summary,[role=button],[onclick]," +
    ".lg-shot,.card,.cell,.exp,.feat,.tlrow,.at-label,.at-con-item,.at-con-cat,.at-more,.at-sheet-close,.at-con-close,.at-time button,.btn,.cmdk-item";

  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, shown = false;
  function loop(): void {
    // one eased point — the lens and the adaptive bead stay perfectly concentric,
    // so the crystal reads as a single drop of glass with a little liquid weight
    x += (tx - x) * 0.34; y += (ty - y) * 0.34;
    const tf = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    lens.style.transform = tf; bead.style.transform = tf;
    requestAnimationFrame(loop);
  }
  addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; lens.classList.add("show"); bead.classList.add("show"); }
    const el = e.target as Element | null;
    const hot = !!(el && el.closest && el.closest(HOT));
    lens.classList.toggle("hot", hot); bead.classList.toggle("hot", hot);
  }, { passive: true });
  addEventListener("pointerdown", () => { lens.classList.add("down"); bead.classList.add("down"); });
  addEventListener("pointerup", () => { lens.classList.remove("down"); bead.classList.remove("down"); });
  document.addEventListener("mouseleave", () => { lens.classList.remove("show"); bead.classList.remove("show"); shown = false; });
  loop();
}
