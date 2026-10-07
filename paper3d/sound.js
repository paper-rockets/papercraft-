/* Subtle paper sounds for Paper3D scenes, made live in the browser (no sound files).
   attachPaperSound(engine) listens to the scene's fold values every frame:
   - while a fold moves: soft crinkle grains, more of them the faster the paper moves;
   - a fold arriving at closed (1): a quiet crease "tock"; arriving back flat (0): a soft pat.
   Hand folding and tap animations both change the same values, so both make the same sounds. */
let ctx = null, master = null, noise = null, enabled = true;

function start() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}
// Browsers only allow sound after a touch or click, so wake the sound on the first one.
addEventListener('pointerdown', start, { once: true, capture: true });
addEventListener('keydown', start, { once: true, capture: true });

function burst({ type = 'bandpass', freq = 3000, q = 0.8, attack = 0.002, decay = 0.03, gain = 0.3, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t, Math.random() * 0.8); src.stop(t + attack + decay + 0.02);
}
function tone({ freq = 180, freqTo = 120, decay = 0.06, gain = 0.08, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freqTo, t + decay);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.004 + decay);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + decay + 0.03);
}

const ready = () => enabled && ctx && ctx.state === 'running';
export const sounds = {
  crinkle(k = 1) { if (!ready()) return; burst({ freq: 2200 + Math.random() * 3200, q: 0.6 + Math.random(), decay: 0.012 + Math.random() * 0.03, gain: (0.05 + Math.random() * 0.07) * k }); },
  crease(k = 1) { if (!ready()) return; burst({ type: 'lowpass', freq: 1400, decay: 0.05, gain: 0.32 * k }); burst({ type: 'highpass', freq: 3800, decay: 0.012, gain: 0.12 * k, delay: 0.004 }); tone({ freq: 210, freqTo: 140, gain: 0.06 * k }); },
  pat(k = 1) { if (!ready()) return; burst({ type: 'lowpass', freq: 900, decay: 0.07, gain: 0.22 * k }); tone({ freq: 120, freqTo: 80, decay: 0.08, gain: 0.05 * k }); },
  tick(k = 1, delay = 0) { if (!ready()) return; burst({ type: 'highpass', freq: 3200, decay: 0.014, gain: 0.16 * k, delay }); tone({ freq: 900, freqTo: 700, decay: 0.02, gain: 0.025 * k, delay }); },
};
export function setPaperSound(on) { enabled = on; if (on) start(); }
export function paperSoundOn() { return enabled; }

const FOLD_KEY = /^(fold|open)/;
// keys: which state values are folds. Ten-rod 'split' gets ticks instead of crinkles.
export function attachPaperSound(engine) {
  const last = { ...engine.state };
  let travel = 0;
  engine.watchers.push(() => {
    let moved = 0, sides = 0, landed = '', ticks = 0;
    for (const [key, value] of Object.entries(engine.state)) {
      if (typeof value !== 'number') continue;
      const before = last[key] ?? value, delta = Math.abs(value - before);
      last[key] = value;
      if (!delta) continue;
      if (key.startsWith('split')) {
        // Ten little cubes: a tick each time the split passes another tenth.
        const steps = Math.floor(Math.max(value, before) * 10) - Math.floor(Math.min(value, before) * 10);
        for (let i = 0; i < Math.min(steps, 3) && ticks < 4; i++, ticks++) sounds.tick(0.8, ticks * 0.03);
        continue;
      }
      if (!FOLD_KEY.test(key)) continue;
      moved = Math.max(moved, delta); sides++;
      if (value >= 0.995 && before < 0.995) landed = 'crease';
      else if (value <= 0.005 && before > 0.005 && !landed) landed = 'pat';
    }
    // Several sides closing in the same moment make one crease sound, not a pile of them.
    if (landed) sounds[landed]();
    // Crinkle grains follow how much paper moved this frame (capped, so it never gets loud).
    // Many sides moving together sound like one sheet, only a little fuller.
    travel += moved * 14 * (1 + 0.15 * Math.max(0, sides - 1));
    let grains = 0;
    while (travel >= 1 && grains < 3) { sounds.crinkle(); travel -= 1; grains++; }
    if (travel > 3) travel = 3;
  });
}
