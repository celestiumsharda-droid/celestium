import { mount as mountStarfield } from "./starfield";
import { enableViewTransitions } from "./view-transitions";
import { startClock, loadAPOD, renderTonightsPlanets } from "./living-sky";
import SCALES, { TICK_LABELS } from "../data/scales";
import TIMELINE from "../data/timeline";
import STORY from "../data/story";
import DEPTH_PREVIEW from "../data/depth-preview";
import EXPLORE from "../data/explore";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/* ---------- view transitions + starfield ---------- */
enableViewTransitions();
mountStarfield($<HTMLCanvasElement>("sky"), { parallax: true });

/* ---------- nav + progress + reveals ---------- */
const nav = $("nav");
const prog = $("prog");
function onScroll() {
  const sc = scrollY;
  nav.classList.toggle("solid", sc > 80);
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (h > 0 ? (sc / h) * 100 : 0) + "%";
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const io = new IntersectionObserver(
  es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
  { threshold: 0.15 }
);
document.querySelectorAll<HTMLElement>(".reveal").forEach(el => io.observe(el));

/* ---------- hero letters ---------- */
const ttl = $("title");
const txt = ttl.textContent ?? "";
ttl.textContent = "";
txt.split("").forEach((ch, i) => {
  const sp = document.createElement("span");
  sp.textContent = ch;
  sp.style.animationDelay = (0.45 + i * 0.07) + "s";
  ttl.appendChild(sp);
});
setTimeout(() => ttl.classList.add("go"), 100);

/* ---------- scale zoomer ---------- */
const zoom = $<HTMLInputElement>("zoom");
const tk = $("ticks");
TICK_LABELS.forEach((label, i) => {
  const s = document.createElement("span");
  s.textContent = label;
  s.setAttribute("role", "button");
  s.setAttribute("tabindex", "0");
  s.setAttribute("aria-label", `Jump to ${label} scale`);
  const jump = () => { zoom.value = String(i); paint(i); };
  s.addEventListener("click", jump);
  s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); } });
  tk.appendChild(s);
});
function paint(i: number) {
  const o = SCALES[i]!;
  $("glyph").textContent = o.g;
  $("s-lvl").textContent = "Level 0" + (i + 1) + " — " + o.l;
  $("s-name").textContent = o.n;
  $("s-size").textContent = o.s;
  $("s-desc").textContent = o.d;
  tk.querySelectorAll<HTMLElement>("span").forEach((sp, j) => sp.classList.toggle("on", j === i));
}
zoom.addEventListener("input", () => paint(+zoom.value));
paint(0);

/* ---------- timeline ---------- */
const rail = document.querySelector<HTMLElement>(".tlrail")!;
TIMELINE.forEach((e, i) => {
  const r = document.createElement("div");
  r.className = "tlrow";
  if (i === 0) r.classList.add("act");
  const link = e.id
    ? `<a href="/discoveries/${e.id}/" class="discov" style="display:block;width:fit-content;margin-top:18px;color:var(--accent);border-color:var(--accent-dim)" onclick="event.stopPropagation()">Read the full discovery &nbsp;→</a>`
    : "";
  r.innerHTML =
    `<div class="when">${e.w}</div><div class="knot"></div>` +
    `<h3>${e.t}</h3><div class="body"><p>${e.b}</p>` +
    `<span class="discov">How we know — ${e.d}</span>${link}</div>`;
  r.addEventListener("click", () => {
    const was = r.classList.contains("act");
    rail.querySelectorAll(".tlrow").forEach(o => o.classList.remove("act"));
    if (!was) r.classList.add("act");
  });
  rail.appendChild(r);
});

/* ---------- scrollytelling ---------- */
const steps = $("steps");
STORY.forEach(s => {
  const d = document.createElement("div");
  d.className = "step";
  d.innerHTML = `<div class="k">${s.k}</div><h3>${s.h}</h3><p>${s.p}</p>`;
  steps.appendChild(d);
});
const cta = document.createElement("div");
cta.className = "step";
cta.innerHTML =
  '<div class="k">The full account</div><h3>Read the whole discovery.</h3>' +
  "<p>The Earth-sized telescope, the petabytes flown on aircraft, the ring that proved Einstein right — at the depth you choose.</p>" +
  '<a href="/discoveries/black-hole-image/" class="btn fill" style="margin-top:30px;display:inline-block">Open the discovery →</a>';
steps.appendChild(cta);

const stEls = steps.querySelectorAll<HTMLElement>(".step");
const disk = $("disk");
const bh = $("bh");
const sio = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    stEls.forEach(x => x.classList.remove("on"));
    e.target.classList.add("on");
    const idx = Array.prototype.indexOf.call(stEls, e.target);
    disk.style.opacity = idx >= 2 ? "1" : "0";
    bh.style.transform = `scale(${1 + idx * 0.06})`;
  }
}), { threshold: 0.55 });
stEls.forEach(el => sio.observe(el));

/* ---------- depth preview ---------- */
const rbody = $("rbody");
const tog = $("toggle");
function renderDepth(l: number) {
  rbody.innerHTML =
    DEPTH_PREVIEW[l]!.join("") +
    `<div class="rmeta">READING DEPTH ${l + 1} / 3 · SAME FACTS · YOUR ALTITUDE</div>`;
}
tog.querySelectorAll<HTMLButtonElement>("button").forEach(b => {
  b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false");
  b.addEventListener("click", () => {
    tog.querySelectorAll<HTMLButtonElement>("button").forEach(o => {
      o.classList.remove("on");
      o.setAttribute("aria-pressed", "false");
    });
    b.classList.add("on");
    b.setAttribute("aria-pressed", "true");
    renderDepth(Number(b.dataset["l"]));
  });
});
renderDepth(0);

/* ---------- living sky ---------- */
startClock();
renderTonightsPlanets($("planets-card"));
loadAPOD($("apod-card"));

/* ---------- explore grid ---------- */
const grid = $("grid");
EXPLORE.forEach(g => {
  const a = document.createElement("a");
  a.className = "cell";
  a.href = `/discoveries/${g.slug}/`;
  a.innerHTML =
    `<div class="field">${g.field}</div><h3>${g.title}</h3>` +
    `<div class="read">${g.cta} &nbsp;→</div>`;
  grid.appendChild(a);
});

/* ---------- mobile menu ---------- */
const bg = $<HTMLButtonElement>("burger");
const mn = $("menu");
bg.setAttribute("aria-expanded", "false");
bg.setAttribute("aria-controls", "menu");
bg.addEventListener("click", () => {
  const o = mn.classList.toggle("open");
  bg.classList.toggle("x", o);
  bg.setAttribute("aria-expanded", o ? "true" : "false");
  document.body.style.overflow = o ? "hidden" : "";
});
mn.querySelectorAll<HTMLAnchorElement>("a").forEach(a => a.addEventListener("click", () => {
  mn.classList.remove("open");
  bg.classList.remove("x");
  bg.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}));
