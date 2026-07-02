/* THE HONEST WAVE — the music pill's bars stop miming and start listening.
   A WebAudio analyser taps the ambient track and the bars move to the real
   spectrum: quiet passages sit low, the swells lift them. Falls back to the
   CSS animation wherever WebAudio is unavailable. */

export function wireAudioWave(audio: HTMLAudioElement, bars: HTMLElement[], pill: HTMLElement): void {
  if (!bars.length || !("AudioContext" in window)) return;
  let wired = false;

  const wire = (): void => {
    if (wired) return;
    wired = true;
    try {
      const actx = new AudioContext();
      const src = actx.createMediaElementSource(audio);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;
      src.connect(analyser);
      analyser.connect(actx.destination);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      pill.classList.add("live");

      const loop = (): void => {
        analyser.getByteFrequencyData(bins);
        for (let i = 0; i < bars.length; i++) {
          const v = (bins[2 + i * 3] ?? 0) / 255;                 // low-mids, spread across the bars
          bars[i]!.style.transform = `scaleY(${(0.22 + v * 1.55).toFixed(2)})`;
        }
        requestAnimationFrame(loop);
      };
      loop();
      // browsers suspend fresh AudioContexts until a gesture — resume with play
      audio.addEventListener("play", () => { void actx.resume(); });
      if (!audio.paused) void actx.resume();
    } catch { /* the CSS wave remains */ }
  };

  // wiring reroutes the element through WebAudio — only do it once sound starts
  if (!audio.paused) wire();
  else audio.addEventListener("play", wire, { once: true });
}
