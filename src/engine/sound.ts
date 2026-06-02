/**
 * CELESTIUM — SOUND (opt-in, off by default)
 * No audio files: a quiet ambient drone and short UI ticks are
 * synthesised with the Web Audio API. A nav toggle enables it; the
 * choice persists. Audio only starts from a user gesture (the toggle
 * itself, or the first interaction on a return visit), per browser
 * autoplay rules.
 */

const KEY = "celestium:sound";
type Pad = { master: GainNode; nodes: OscillatorNode[] };

let ctx: AudioContext | null = null;
let pad: Pad | null = null;
let enabled = false;
let wantPad = false;

const ICON_ON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>';
const ICON_OFF =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9l-5 6M17 9l5 6"/></svg>';

function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function startPad(): void {
  if (pad) return;
  const c = audio();
  const nodes: OscillatorNode[] = [];

  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);

  // a touch of space — a soft feedback delay
  const delay = c.createDelay(1);
  delay.delayTime.value = 0.34;
  const fb = c.createGain(); fb.gain.value = 0.26;
  const wet = c.createGain(); wet.gain.value = 0.45;
  delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 0.6;
  filter.connect(master); filter.connect(delay);

  // a calm open-fifths drone, very quiet, spread across the stereo field
  const freqs = [55, 82.41, 110, 164.81];
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "sine" : "triangle";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    const g = c.createGain(); g.gain.value = 0.15;
    const pan = c.createStereoPanner(); pan.pan.value = (i % 2 ? 1 : -1) * 0.32;
    o.connect(g); g.connect(pan); pan.connect(filter);
    o.start(); nodes.push(o);
  });

  // a high shimmer (an octave + a fifth up) that breathes in and out
  const air = c.createBiquadFilter();
  air.type = "lowpass"; air.frequency.value = 2400; air.connect(master); air.connect(delay);
  [220, 329.63].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f; o.detune.value = (i ? 1 : -1) * 5;
    const g = c.createGain(); g.gain.value = 0.028;
    const pan = c.createStereoPanner(); pan.pan.value = (i ? 1 : -1) * 0.5;
    const swell = c.createOscillator(); swell.frequency.value = 0.03 + i * 0.013;
    const swellAmt = c.createGain(); swellAmt.gain.value = 0.026;
    swell.connect(swellAmt); swellAmt.connect(g.gain); swell.start(); nodes.push(swell);
    o.connect(g); g.connect(pan); pan.connect(air);
    o.start(); nodes.push(o);
  });

  // slow filter sweep for movement
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = c.createGain(); lfoGain.gain.value = 160;
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
  lfo.start(); nodes.push(lfo);

  master.gain.linearRampToValueAtTime(0.05, c.currentTime + 3);
  pad = { master, nodes };
}

function stopPad(): void {
  if (!pad || !ctx) return;
  const c = ctx;
  const p = pad;
  pad = null;
  p.master.gain.cancelScheduledValues(c.currentTime);
  p.master.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
  setTimeout(() => { p.nodes.forEach(n => { try { n.stop(); } catch (_e) { /* already stopped */ } }); }, 1400);
}

/** A short, soft UI tick. No-op unless sound is enabled. */
export function playClick(): void {
  if (!enabled || !ctx) return;
  const c = ctx;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(840, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(460, c.currentTime + 0.07);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.14);
}

export function initSound(btn: HTMLElement | null, opts: { pad?: boolean } = {}): void {
  if (!btn) return;
  wantPad = !!opts.pad;
  enabled = localStorage.getItem(KEY) === "on";

  const render = () => {
    btn.innerHTML = enabled ? ICON_ON : ICON_OFF;
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    btn.classList.toggle("on", enabled);
  };
  render();

  // Resume on a return visit only once the user interacts (autoplay policy).
  if (enabled && wantPad) {
    const kick = () => { audio().resume(); startPad(); removeEventListener("pointerdown", kick); removeEventListener("keydown", kick); };
    addEventListener("pointerdown", kick, { once: true });
    addEventListener("keydown", kick, { once: true });
  }

  btn.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem(KEY, enabled ? "on" : "off");
    audio().resume();
    if (enabled) { if (wantPad) startPad(); playClick(); }
    else { stopPad(); }
    render();
  });
}
