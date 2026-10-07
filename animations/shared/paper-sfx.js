// Paper sound effects made live in the browser, so they play in time with what moves.
// No sound files: every sound is built from a short noise burst and a few tones.
window.PaperSfx = (() => {
  let ctx = null, master = null, noise = null, muted = false;

  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  }

  // One shaped burst of filtered noise.
  function burst(t, {type = 'lowpass', freq = 900, freqTo, q = 0.7, attack = 0.003, decay = 0.1, gain = 1, len}) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (freqTo) filter.frequency.exponentialRampToValueAtTime(freqTo, t + (len || decay));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + attack + decay + 0.05);
  }

  // One tone with a quick fade, optionally gliding in pitch.
  function tone(t, {freq = 440, freqTo, type = 'sine', attack = 0.004, decay = 0.2, gain = 0.4}) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqTo) osc.frequency.exponentialRampToValueAtTime(freqTo, t + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    osc.connect(g); g.connect(master);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }

  const SOUNDS = {
    // card lands flat on the table
    thump: (t, k) => { burst(t, {freq: 1100, decay: 0.09, gain: 0.7 * k}); tone(t, {freq: 130, freqTo: 80, decay: 0.1, gain: 0.35 * k}); },
    'thump-light': (t, k) => { burst(t, {freq: 2200, decay: 0.06, gain: 0.45 * k}); tone(t, {freq: 210, freqTo: 140, decay: 0.06, gain: 0.18 * k}); },
    'thump-heavy': (t, k) => { burst(t, {freq: 650, decay: 0.16, gain: 0.9 * k}); tone(t, {freq: 95, freqTo: 52, decay: 0.18, gain: 0.5 * k}); },
    // card pushed along the table
    slide: (t, k) => burst(t, {type: 'bandpass', freq: 1500, freqTo: 700, q: 0.9, attack: 0.03, decay: 0.24, gain: 0.5 * k, len: 0.27}),
    // card carried through the air
    whoosh: (t, k) => burst(t, {type: 'bandpass', freq: 450, freqTo: 1700, q: 1.2, attack: 0.12, decay: 0.3, gain: 0.55 * k, len: 0.42}),
    chime: (t, k) => [1047, 1319, 1568].forEach((f, i) => tone(t + i * 0.09, {freq: f, decay: 1.1, gain: 0.16 * k, type: 'triangle'})),
    tick: (t, k) => { burst(t, {type: 'highpass', freq: 3500, decay: 0.018, gain: 0.5 * k}); tone(t, {freq: 1900, decay: 0.03, gain: 0.12 * k, type: 'square'}); },
    snap: (t, k) => burst(t, {type: 'highpass', freq: 1400, decay: 0.045, gain: 0.8 * k}),
    'pencil-tap': (t, k) => { burst(t, {type: 'bandpass', freq: 2600, q: 2, decay: 0.03, gain: 0.5 * k}); },
    // the child's own tap: a bright paper pop
    pop: (t, k) => { tone(t, {freq: 520, freqTo: 980, decay: 0.09, gain: 0.3 * k}); burst(t, {type: 'highpass', freq: 2500, decay: 0.03, gain: 0.25 * k}); },
    // a tap that missed: soft and low, never a buzzer
    nudge: (t, k) => tone(t, {freq: 260, freqTo: 220, decay: 0.12, gain: 0.16 * k}),
    // the pointer arrives: a small rising sparkle
    ready: (t, k) => [784, 1175].forEach((f, i) => tone(t + i * 0.07, {freq: f, decay: 0.35, gain: 0.08 * k, type: 'triangle'})),
  };

  function play(name, gain = 1, delay = 0) {
    if (muted || !ctx || ctx.state === 'closed') return;
    const make = SOUNDS[name] || SOUNDS.thump;
    make(ctx.currentTime + 0.005 + Math.max(0, delay), Math.max(0.05, Math.min(1.5, gain)));
  }

  return {
    start, play,
    setMuted(m) { muted = m; },
    get muted() { return muted; },
    get running() { return Boolean(ctx && ctx.state === 'running'); },
  };
})();
