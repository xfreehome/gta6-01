// Synthetic WebAudio: siren, engine, gunshot, explosion, radio loop. No audio files.
let ctx = null, master = null, engineOsc = null, engineGain = null, radioNodes = null;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    return true;
  } catch (e) { return false; }
}
function tone(freq, dur, type, vol, slideTo) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
}
function noise(dur, vol, low) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = low || 1200;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master); src.start();
}
export const sfx = {
  siren() { if (!ctx) return; tone(720, 0.5, 'sine', 0.12, 980); setTimeout(() => tone(980, 0.5, 'sine', 0.12, 720), 480); },
  shot() { noise(0.12, 0.5, 3000); tone(180, 0.08, 'square', 0.2, 60); },
  punch() { noise(0.08, 0.3, 500); },
  explosion() { noise(0.9, 0.9, 400); tone(90, 0.7, 'sine', 0.5, 30); },
  steal() { tone(300, 0.15, 'square', 0.15, 500); },
  pickup() { tone(660, 0.1, 'sine', 0.2); setTimeout(() => tone(880, 0.15, 'sine', 0.2), 100); },
  click() { tone(440, 0.05, 'square', 0.12); },
};
export function engineStart() {
  if (!ctx || engineOsc) return;
  engineOsc = ctx.createOscillator(); engineGain = ctx.createGain();
  engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
  engineGain.gain.value = 0.0;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
  engineOsc.connect(f); f.connect(engineGain); engineGain.connect(master); engineOsc.start();
}
export function engineSet(speedNorm, on) {
  if (!ctx || !engineOsc) return;
  engineOsc.frequency.setTargetAtTime(55 + speedNorm * 140, ctx.currentTime, 0.1);
  engineGain.gain.setTargetAtTime(on ? 0.05 + speedNorm * 0.06 : 0.0, ctx.currentTime, 0.1);
}
// Tiny radio loop: a warm two-chord pad + bass pulse, DORADA 98.4.
export function radioStart() {
  if (!ctx || radioNodes) return;
  const g = ctx.createGain(); g.gain.value = 0.05; g.connect(master);
  const notes = [110, 164.8, 220, 261.6];
  const oscs = notes.map((f, i) => {
    const o = ctx.createOscillator(); o.type = i < 2 ? 'triangle' : 'sine';
    o.frequency.value = f; o.connect(g); o.start(); return o;
  });
  radioNodes = { g, oscs };
}
export function radioStop() {
  if (!radioNodes) return;
  radioNodes.oscs.forEach((o) => { try { o.stop(); } catch (e) {} });
  radioNodes = null;
}
