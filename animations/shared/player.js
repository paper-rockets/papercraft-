// Interactive player shared by every paper animation.
// Ava's lines play one at a time, each locked to its own part of the paper timeline.
// After each line the paper pointer taps the piece that moves next; the child taps it to go on.
// Two ways to watch (user, 3 Oct): "Tap along" waits for the child's tap after each line; "Just watch"
// plays by itself and the pointer shows each tap before doing it. The start screen offers both, a small
// corner button switches, and the choice is remembered on this device.
// ?auto=1 starts in "Just watch". ?render=1 is for frame checks.
(() => {
  const A = window.PV, T = window.TIMING, FILM = window.FILM;
  const q = new URLSearchParams(location.search);
  let AUTO = q.get('auto') === '1';
  try { if (!q.has('auto') && localStorage.getItem('paper-animation-mode') === 'watch') AUTO = true; } catch { /* default: tap along */ }
  const stage = document.getElementById('stage');
  const playBtn = document.getElementById('play'), replayBtn = document.getElementById('replay');
  const muteBtn = document.getElementById('mute'), status = document.getElementById('status');
  let bigPlay = document.getElementById('bigplay');
  if (!bigPlay) {
    bigPlay = document.createElement('button');
    bigPlay.id = 'bigplay'; bigPlay.type = 'button'; bigPlay.hidden = true;
    stage.appendChild(bigPlay);
  }
  // Second start choice beside the big Play (which becomes "Tap along"): play it all by itself.
  const bigWatch = document.createElement('button');
  bigWatch.id = 'bigwatch'; bigWatch.type = 'button'; bigWatch.hidden = true;
  stage.appendChild(bigWatch);
  const modeBtn = document.createElement('button');
  modeBtn.id = 'mode'; modeBtn.type = 'button';
  document.getElementById('controls')?.insertBefore(modeBtn, muteBtn);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const SFX = window.PaperSfx;
  const CAPY = window.CapyHelper || {set() {}, react() {}};

  // Paper pointer (the red-tipped stick), a ring around the target, and a fallback Next card.
  const hint = document.createElement('div');
  hint.id = 'tap-hint'; hint.hidden = true;
  hint.innerHTML = '<div class="tap-ring"></div><img class="tap-stick" src="assets/props/pointer.webp" alt="" draggable="false">';
  stage.appendChild(hint);
  const nextCard = document.createElement('button');
  nextCard.id = 'tap-next'; nextCard.type = 'button'; nextCard.hidden = true;
  nextCard.setAttribute('aria-label', 'Next');
  nextCard.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 4.9a1.3 1.3 0 0 1 1.8 0l6.2 6.2a1.3 1.3 0 0 1 0 1.8l-6.2 6.2a1.3 1.3 0 1 1-1.8-1.8L14 12 8.6 6.7a1.3 1.3 0 0 1 0-1.8z"/></svg>';
  stage.appendChild(nextCard);

  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.6v12.8a1.1 1.1 0 0 0 1.7.94l10-6.4a1.1 1.1 0 0 0 0-1.88l-10-6.4A1.1 1.1 0 0 0 8 5.6z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="6" y="5" width="4.4" height="14" rx="1.5"/><rect fill="currentColor" x="13.6" y="5" width="4.4" height="14" rx="1.5"/></svg>',
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 12.4a7.5 7.5 0 1 0 2.3-5.6"/><path d="M5.6 3.8v4.4H10"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.6c0-.6.5-1.1 1.1-1.1h2.8l4.4-3.7c.7-.6 1.7-.1 1.7.8v12.8c0 .9-1 1.4-1.7.8l-4.4-3.7H4.6c-.6 0-1.1-.5-1.1-1.1z"/><path d="M16.3 9.2a4 4 0 0 1 0 5.6M18.9 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>',
    hand: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V4.8a1.6 1.6 0 0 1 3.2 0V10m0-1.2a1.6 1.6 0 0 1 3.2 0V11m0-.8a1.6 1.6 0 0 1 3.2 0v4.3c0 3.6-2.5 6-6 6h-.8c-2.2 0-3.6-.9-4.8-2.5L4 15.1a1.6 1.6 0 0 1 2.4-2.1L9 15"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.6c0-.6.5-1.1 1.1-1.1h2.8l4.4-3.7c.7-.6 1.7-.1 1.7.8v12.8c0 .9-1 1.4-1.7.8l-4.4-3.7H4.6c-.6 0-1.1-.5-1.1-1.1z"/><path d="M16.2 9.3l5 5.2M21.2 9.3l-5 5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };
  const setButton = (btn, icon, text) => { btn.innerHTML = ICON[icon] + '<span>' + text + '</span>'; };
  // Corner controls use the Codex paper buttons (public/paper-set/btn-*.webp). Pause, Tap along and
  // Just watch have no painted button: they get the plain paper disc with the icon drawn on it.
  const PAPER_BTN = {play: 'play', replay: 'replay', sound: 'sound', muted: 'mute'};
  for (const n of ['play', 'replay', 'sound', 'mute', 'blank']) new Image().src = '/papercraft-/paper-set/btn-' + n + '.webp';
  const setPaper = (btn, icon, text) => {
    const pic = PAPER_BTN[icon];
    btn.style.backgroundImage = `url('/papercraft-/paper-set/btn-${pic || 'blank'}.webp')`;
    btn.classList.add('paper-btn');
    btn.innerHTML = (pic ? '' : ICON[icon]) + '<span>' + text + '</span>';
  };

  let duration = 60, beats = [], segments = [];
  let current = 0, playing = false, waiting = false, ready = false, finished = false;
  let raf = 0, lastWall = 0, seg = 0, voiceOn = null, muted = false, target = null, autoTimer = 0;
  const voices = {};

  // ---------- segments: one per narration line ----------
  // A segment runs from its line's start to its "gate": when Ava has finished and the paper has settled.
  function buildSegments() {
    const keys = FILM.beats.map(b => b.key).filter(k => T.voice[k] != null).sort((a, b) => T.voice[a] - T.voice[b]);
    const tweens = A.PAPER.getChildren(true, true, false);
    const owner = new Map(A.pieces.map(p => [p.st, p]));
    segments = keys.map((key, i) => {
      const start = i ? T.voice[key] : 0;
      const next = i + 1 < keys.length ? T.voice[keys[i + 1]] : duration;
      const voiceEnd = T.voice[key] + (window.VOICE[key]?.dur || 2);
      let settle = voiceEnd;
      for (const tw of tweens) {
        const s = tw.startTime();
        if (s >= T.voice[key] - 0.01 && s < next - 0.01) settle = Math.max(settle, Math.min(next, tw.endTime()));
      }
      const gate = i + 1 < keys.length ? Math.min(next - 0.02, settle + 0.35) : duration;
      return {key, start, voiceAt: T.voice[key], next, gate, target: null};
    });
    // The tap target for a gate is a piece already on the table that the next line moves.
    const gates = window.GATES || {};
    segments.forEach((s, i) => {
      const nextSeg = segments[i + 1];
      if (!nextSeg) return;
      const wanted = gates[nextSeg.key];
      if (wanted === 'none') return;
      A.renderAt(s.gate);
      const visible = p => p.st.op > 0.15 && p.st.x > 0 && p.st.x < 2400 && p.st.y > 0 && p.st.y < 1350 && !/^decor\//.test(p.src);
      if (wanted) { s.target = A.pieces.find(p => p.src === wanted && p.st.op > 0.15 && p.st.x > 0 && p.st.x < 2400) || null; return; }
      let best = null;
      for (const tw of tweens) {
        const st = tw.startTime();
        if (st < nextSeg.voiceAt - 0.05 || st > nextSeg.voiceAt + 3.5) continue;
        const p = owner.get(tw.targets()[0]);
        if (!p || p === window.PAPER_FILM?.heading || !visible(p)) continue;
        const v = tw.vars || {};
        const moves = v.x != null || v.y != null || v.rot != null || v.keyframes;
        const score = st - nextSeg.voiceAt + (v.op === 0 ? 10 : 0) + (moves ? 0 : 2);
        if (!best || score < best.score) best = {p, score};
      }
      s.target = best && best.score < 10 ? best.p : null;
    });
    A.renderAt(0);
  }

  // ---------- sound ----------
  function voice(key) {
    if (!voices[key]) {
      const a = new Audio('assets/audio/voice/' + key + '.mp3');
      a.preload = 'auto';
      voices[key] = a;
    }
    return voices[key];
  }
  function stopVoice() { if (voiceOn) { voiceOn.audio.pause(); voiceOn = null; } }
  function startVoice(s, offset) {
    stopVoice();
    const a = voice(s.key);
    a.muted = muted;
    try { a.currentTime = Math.max(0, offset); } catch {}
    voiceOn = {audio: a, seg: s, asked: performance.now(), offset: Math.max(0, offset)};
    const p = a.play();
    if (p && p.catch) p.catch(() => { if (voiceOn && voiceOn.audio === a) voiceOn.failed = true; });
  }
  function fireCues(from, to) {
    if (to <= from) return;
    for (const c of A.CUES) if (c.type === 'sfx' && c.t > from && c.t <= to) SFX.play(c.name, c.gain);
  }

  // ---------- clock ----------
  function paint() {
    const s = segments[seg];
    const pose = reduced.matches && s ? (playing || waiting ? s.gate : current) : current;
    A.renderAt(Math.min(duration, pose));
    A.renderCaption && A.renderCaption(current);
    if (waiting) placeHint();
  }
  function frame(now) {
    if (!playing) return;
    const dt = Math.min(0.1, (now - lastWall) / 1000); lastWall = now;
    const s = segments[seg];
    let t = current + dt;
    // Ava's line is the master clock while she speaks.
    if (voiceOn && !voiceOn.failed && !voiceOn.audio.paused && voiceOn.audio.currentTime > 0)
      t = voiceOn.seg.voiceAt + voiceOn.audio.currentTime;
    // the line has been asked to start but no sound yet: hold the paper (up to 0.6 s) so nothing runs ahead of Ava
    else if (voiceOn && !voiceOn.failed && !voiceOn.audio.ended && voiceOn.audio.currentTime <= voiceOn.offset && now - voiceOn.asked < 600)
      t = Math.min(t, voiceOn.seg.voiceAt + voiceOn.offset);
    if (s && current < s.voiceAt && t >= s.voiceAt) startVoice(s, t - s.voiceAt);
    if (s && t >= s.gate) t = s.gate;
    fireCues(current, t);
    current = t;
    paint();
    if (s && current >= s.gate) { reachGate(); return; }
    raf = requestAnimationFrame(frame);
  }
  function run() {
    cancelAnimationFrame(raf);
    lastWall = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // ---------- gates ----------
  function reachGate() {
    playing = false; cancelAnimationFrame(raf);
    if (seg >= segments.length - 1) { endFilm(); return; }
    waiting = true;
    target = segments[seg].target;
    if (AUTO) {
      // Just watch: the pointer shows what would be tapped, taps it, and the film goes on by itself.
      status.textContent = 'Playing';
      if (target && !q.has('auto')) {
        hint.hidden = false; hint.classList.remove('on-next'); placeHint();
        autoTimer = setTimeout(() => {
          hint.classList.remove('tapped'); void hint.offsetWidth; hint.classList.add('tapped'); SFX.play('pop', 0.7);
          autoTimer = setTimeout(advance, 260);
        }, 1100);
      } else autoTimer = setTimeout(advance, 650);
      syncUI(); return;
    }
    status.textContent = 'Your turn: tap';
    CAPY.set('wave');
    hint.hidden = false; nextCard.hidden = Boolean(target);
    hint.classList.toggle('on-next', !target);
    placeHint();
    SFX.play('ready', 0.8);
    syncUI();
  }
  function advance() {
    if (!waiting) return;
    clearTimeout(autoTimer);
    waiting = false; hint.hidden = true; nextCard.hidden = true;
    CAPY.set('sit');
    const tapped = target;
    seg++;
    current = Math.max(current, segments[seg].voiceAt - 0.01);
    // The tapped piece answers with a little paper hop (on its picture, so the timeline keeps its place).
    if (tapped && !reduced.matches) {
      tapped.img.classList.remove('tap-hop'); void tapped.img.offsetWidth; tapped.img.classList.add('tap-hop');
    }
    playing = true; status.textContent = 'Playing'; syncUI();
    run();
  }
  function placeHint() {
    const sr = stage.getBoundingClientRect();
    const k = sr.width / stage.offsetWidth || 1;
    let cx, cy, w, h;
    if (target) {
      const r = target.el.getBoundingClientRect();
      cx = (r.left + r.width / 2 - sr.left) / k; cy = (r.top + r.height / 2 - sr.top) / k;
      w = r.width / k; h = r.height / k;
    } else {
      const r = nextCard.getBoundingClientRect();
      cx = (r.left + r.width / 2 - sr.left) / k; cy = (r.top + r.height / 2 - sr.top) / k;
      w = r.width / k; h = r.height / k;
    }
    const size = Math.max(110, Math.min(360, Math.max(w, h) + 50));
    hint.style.setProperty('--x', cx + 'px'); hint.style.setProperty('--y', cy + 'px');
    hint.style.setProperty('--ring', size + 'px');
    // the stick touches the lower-left edge, so the thing to tap stays in view
    hint.style.setProperty('--tx', (cx - size * 0.3) + 'px'); hint.style.setProperty('--ty', (cy + size * 0.3) + 'px');
  }
  function hitTarget(ev) {
    if (!target) return false;
    const r = target.el.getBoundingClientRect(), pad = 40;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad && ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }
  stage.addEventListener('pointerdown', ev => {
    // tapping the capybara is always allowed: it giggles, and it never counts as a wrong tap
    if (ev.target.closest && ev.target.closest('#capy-helper')) { SFX.start(); SFX.play('pop', 0.8); CAPY.react('laugh', 900); return; }
    if (!waiting || AUTO) return;
    if (ev.target.closest && ev.target.closest('#bigplay')) return;
    if (ev.target.closest && ev.target.closest('#tap-next') || hitTarget(ev)) {
      SFX.start(); SFX.play('pop', 1); CAPY.react('cheer', 1200);
      hint.classList.remove('tapped'); void hint.offsetWidth; hint.classList.add('tapped');
      setTimeout(advance, 120);
    } else {
      SFX.play('nudge', 0.8); CAPY.react('think', 900);
      hint.classList.remove('shake'); void hint.offsetWidth; hint.classList.add('shake');
    }
  });

  // ---------- controls ----------
  function syncUI() {
    const active = playing || waiting;
    setPaper(playBtn, active ? 'pause' : 'play', ready ? (active ? 'Pause' : 'Play') : 'Loading…');
    setPaper(replayBtn, 'replay', 'Replay');
    setPaper(muteBtn, muted ? 'muted' : 'sound', muted ? 'Unmute' : 'Mute');
    muteBtn.setAttribute('aria-pressed', String(muted));
    bigPlay.hidden = !ready || active;
    const fresh = !finished && current <= 0.05;
    setButton(bigPlay, finished ? 'replay' : fresh ? 'hand' : 'play', finished ? 'Again' : fresh ? 'Tap along' : 'Keep going');
    bigPlay.classList.toggle('again', finished);
    bigWatch.hidden = bigPlay.hidden || !fresh;
    setButton(bigWatch, 'eye', 'Just watch');
    setPaper(modeBtn, AUTO ? 'eye' : 'hand', AUTO ? 'Just watch' : 'Tap along');
    modeBtn.setAttribute('aria-label', AUTO ? 'Just watch is on. Tap to tap along instead' : 'Tap along is on. Tap to just watch instead');
    document.body.classList.toggle('two-starts', !bigWatch.hidden);
  }
  function play() {
    if (!ready || playing || waiting) return;
    SFX.start();
    if (finished) { restart(); return; }
    const s = segments[seg];
    if (s && current >= s.gate - 0.001 && seg < segments.length - 1) { reachGate(); return; }
    if (s && current > s.voiceAt && current < s.voiceAt + (window.VOICE[s.key]?.dur || 0)) startVoice(s, current - s.voiceAt);
    playing = true; status.textContent = 'Playing'; syncUI(); run();
  }
  function pause() {
    const was = playing || waiting;
    playing = false; cancelAnimationFrame(raf); clearTimeout(autoTimer);
    if (waiting) { waiting = false; hint.hidden = true; nextCard.hidden = true; CAPY.set('sit'); }
    stopVoice();
    if (was) status.textContent = 'Paused';
    syncUI(); paint();
  }
  function restart() {
    pause(); finished = false; seg = 0; current = 0; paint(); CAPY.set('sit');
    SFX.start(); playing = true; status.textContent = 'Playing'; syncUI(); run();
  }
  function endFilm() {
    playing = false; waiting = false; finished = true; current = duration;
    stopVoice(); paint(); status.textContent = 'Finished'; syncUI();
    CAPY.set('content'); CAPY.react('laugh', 2000);
  }
  function setMuted(m) {
    muted = m; SFX.setMuted(m);
    for (const a of Object.values(voices)) a.muted = m;
    syncUI();
  }
  function fitStage() {
    const portrait = innerWidth < innerHeight * 0.9;
    document.body.classList.toggle('portrait', portrait);
    const w = portrait ? 1080 : 1920, h = portrait ? 1640 : 1080;
    // The whole screen is the stage now: the small controls float in the corner over the table.
    stage.style.transform = document.body.classList.contains('render') ? '' : `scale(${Math.min(innerWidth / w, innerHeight / h)})`;
    paint();
  }

  A.finish = function (dur, filmBeats) {
    duration = dur; beats = filmBeats;
    A.PAPER.progress(1, true).progress(0, true); A.CAMERA.progress(1, true).progress(0, true);
    A.CUES.sort((a, b) => a.t - b.t);
    window.renderAt = A.renderAt; window.CUES = A.CUES; window.DURATION = dur; window.BEATS = beats;
    if (q.has('render')) document.body.classList.add('render');
    buildSegments();
    for (const s of segments) voice(s.key);
    fitStage(); addEventListener('resize', fitStage); reduced.addEventListener('change', paint);
    playBtn.addEventListener('click', () => (playing || waiting) ? pause() : play());
    replayBtn.addEventListener('click', restart);
    const setMode = watch => {
      AUTO = watch;
      try { localStorage.setItem('paper-animation-mode', watch ? 'watch' : 'tap'); } catch { /* still works this time */ }
      if (waiting) { pause(); play(); } else syncUI();
    };
    bigPlay.addEventListener('click', () => { if (!finished && current <= 0.05) setMode(false); play(); });
    bigWatch.addEventListener('click', () => { setMode(true); play(); });
    modeBtn.addEventListener('click', () => setMode(!AUTO));
    muteBtn.addEventListener('click', () => { SFX.start(); setMuted(!muted); });
    addEventListener('keydown', e => {
      if (/BUTTON|INPUT/.test(e.target.tagName)) return;
      if ((e.code === 'Space' || e.code === 'Enter') && waiting) { e.preventDefault(); SFX.start(); SFX.play('pop', 1); advance(); return; }
      if (e.code === 'Space') { e.preventDefault(); (playing || waiting) ? pause() : play(); }
    });
    if (q.get('muted') === '1') setMuted(true);
    syncUI();
    const images = [...document.images].filter(im => !im.closest('#tap-hint')).map(im => im.complete ? (im.naturalWidth ? Promise.resolve() : Promise.reject(new Error('Artwork failed: ' + im.src))) : new Promise((r, j) => { im.onload = r; im.onerror = () => j(new Error('Artwork failed: ' + im.src)); }));
    window.READY = Promise.all([...images, document.fonts?.ready]).then(() => {
      ready = true; playBtn.disabled = false; replayBtn.disabled = false; status.textContent = 'Ready'; syncUI(); paint(); return true;
    });
    window.READY.catch(() => { status.textContent = 'Some pictures did not load. Please reload the page.'; });
    document.addEventListener('visibilitychange', () => { if (document.hidden && (playing || waiting)) pause(); });
    window.PLAYER = {
      segments, play, pause, restart, advance,
      // for checks: stand at the gate of line i, as if it had just finished
      jumpToGate(i) { pause(); finished = false; seg = i; current = segments[i].gate; paint(); play(); },
      get state() { return {current, playing, waiting, finished, seg, target: target ? target.src : null, muted}; },
    };
    if (q.has('render')) window.FILM_TEST = {play, pause, replay: restart, seek(t) { pause(); current = t; A.renderAt(t); }, get state() { return {playing, current, pieces: A.pieces.length, muted}; }};
    addEventListener('message', event => {
      if (event.source !== parent || event.origin !== location.origin) return;
      if (event.data?.type === 'paper-animation-pause') pause();
      if (event.data?.type === 'paper-animation-mute') setMuted(Boolean(event.data.muted));
    });
    paint();
  };
})();
