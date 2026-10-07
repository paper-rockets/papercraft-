/* Paper-cutout animation engine.
 * Every supplied PNG becomes a "piece" (a DOM image layer). Each piece has a plain state object
 * { x, y, rot, s, lift, hy, op, z } that GSAP tweens; render() turns states into CSS transforms.
 *
 * Two clocks:
 *   PAPER  timeline - all paper objects; sampled at 12 fps (stop-motion steps)
 *   CAMERA timeline - the overhead camera; sampled smoothly every frame
 * renderAt(t) is deterministic, so the same call drives live preview and frame-by-frame video export.
 */
(function () {
  "use strict";
  const SIZES = window.MANIFEST.sizes;
  const LENS = window.MANIFEST.lens;
  const STAGE_W = 1920, STAGE_H = 1080;
  const PAPER_FPS = 12;
  const STOP_MOTION = new URLSearchParams(location.search).get('stopmotion') === '1';

  const world = document.getElementById("world");
  const camEl = document.getElementById("camera");
  const PAPER = gsap.timeline({ paused: true });
  const CAMERA = gsap.timeline({ paused: true });
  const cam = { x: 1200, y: 675, s: 1 };
  const CUES = [];
  const pieces = [];

  // ---------- deterministic randomness ----------
  let seed = 20260930;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  const rr = (a, b) => a + (b - a) * rnd();
  function hash(i, j) {
    let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(j + 0x632be5ab, 0xc2b2ae35);
    h = Math.imul(h ^ (h >>> 15), 0x27d4eb2f);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967295;
  }

  // ---------- pieces ----------
  function piece(src, k, o = {}) {
    const size = SIZES[src];
    if (!size) throw new Error("missing asset " + src);
    const w = size[0] * k, h = size[1] * k;
    const el = document.createElement("div");
    el.className = "piece";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.dataset.src = src;
    const img = document.createElement("img");
    img.src = window.ASSET_URLS?.[src] || window.ASSET_ROOT + src + ".webp";
    img.alt = "";
    img.draggable = false;
    el.appendChild(img);
    world.appendChild(el);
    const st = o.st || {
      x: o.x ?? -3000, y: o.y ?? -3000, rot: o.rot ?? rr(-2, 2), s: 1,
      lift: 0, hy: 0, op: o.op ?? 1, z: o.z ?? 20,
    };
    const p = { el, img, st, w, h, k, src, id: pieces.length, zo: o.zo || 0, last: {} };
    pieces.push(p);
    return p;
  }

  // magnifier view: an enlarged copy of one piece, clipped to the lens circle
  let lensView = null;
  function makeLensView(glassPiece, target, zoom, bg) {
    const el = document.createElement("div");
    el.className = "lens-view";
    if (bg) el.style.background = bg; // what the table looks like under the enlarged piece
    const img = document.createElement("img");
    img.src = target.img.src;
    img.alt = "";
    img.style.width = target.w * zoom + "px";
    img.style.height = target.h * zoom + "px";
    el.appendChild(img);
    world.appendChild(el);
    lensView = { el, img, glass: glassPiece, target, zoom };
  }

  function renderPieces(tp) {
    const step = Math.floor(tp * PAPER_FPS + 1e-6);
    for (const p of pieces) {
      const s = p.st, L = s.lift;
      const vis = s.op > 0.003 && s.x > -2500;
      if (!vis) {
        if (p.last.vis !== false) { p.el.style.display = "none"; p.last.vis = false; }
        continue;
      }
      if (p.last.vis !== true) { p.el.style.display = ""; p.last.vis = true; }
      // "boil": paper held in the hand wobbles a little between stop-motion frames
      const bx = L > 0.02 ? (hash(p.id, step) - 0.5) * 3 * L : 0;
      const by = L > 0.02 ? (hash(p.id + 7777, step) - 0.5) * 3 * L : 0;
      const br = L > 0.02 ? (hash(p.id + 3333, step) - 0.5) * 1.6 * L : 0;
      const sc = s.s * (1 + 0.07 * L);
      const tf = `translate(${(s.x + bx - p.w / 2).toFixed(1)}px,${(s.y + s.hy + by - p.h / 2).toFixed(1)}px) rotate(${(s.rot + br).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      if (tf !== p.last.tf) { p.el.style.transform = tf; p.last.tf = tf; }
      const z = Math.round(s.z) + p.zo;
      if (z !== p.last.z) { p.el.style.zIndex = z; p.last.z = z; }
      const op = s.op >= 0.999 ? "1" : s.op.toFixed(3);
      if (op !== p.last.op) { p.el.style.opacity = op; p.last.op = op; }
      // lifted paper throws a longer, softer shadow down-right (light is upper-left, like the artwork)
      const f = L > 0.02
        ? `drop-shadow(${(8 * L).toFixed(1)}px ${(13 * L).toFixed(1)}px ${(10 * L).toFixed(1)}px rgba(74,48,22,${(0.3 * L).toFixed(3)}))`
        : "none";
      if (f !== p.last.f) { p.el.style.filter = f; p.last.f = f; }
    }
    if (lensView) renderLens();
  }

  function renderLens() {
    const { el, img, glass, target, zoom } = lensView;
    const g = glass.st, t = target.st;
    // the upright layout moves pieces after this step, so there the loupe is shown as plain glass
    if (g.op < 0.01 || g.x < -2500 || document.body.classList.contains("portrait")) { el.style.display = "none"; return; }
    el.style.display = "";
    // lens centre in world space (rotate the lens offset with the magnifier)
    const k = glass.k * g.s * (1 + 0.07 * g.lift);
    const ox = (LENS.cx - SIZES[glass.src][0] / 2) * k, oy = (LENS.cy - SIZES[glass.src][1] / 2) * k;
    const a = (g.rot * Math.PI) / 180;
    const cx = g.x + ox * Math.cos(a) - oy * Math.sin(a);
    const cy = g.y + g.hy + ox * Math.sin(a) + oy * Math.cos(a);
    const r = LENS.r * k * 0.96;
    el.style.width = el.style.height = 2 * r + "px";
    el.style.transform = `translate(${cx - r}px,${cy - r}px)`;
    el.style.zIndex = Math.round(g.z) - 1;
    // the target, enlarged around the lens centre
    const ts = t.s * (1 + 0.07 * t.lift);
    const tx = t.x, ty = t.y + t.hy;
    const px = cx + (tx - cx) * zoom, py = cy + (ty - cy) * zoom;
    const W = target.w * zoom, H = target.h * zoom;
    img.style.transform =
      `translate(${px - (cx - r)}px,${py - (cy - r)}px) rotate(${t.rot}deg) scale(${ts}) translate(${-W / 2}px,${-H / 2}px)`;
  }

  function renderCamera() {
    camEl.style.transform = `translate(${STAGE_W / 2 - cam.x * cam.s}px,${STAGE_H / 2 - cam.y * cam.s}px) scale(${cam.s})`;
  }

  function renderAt(t) {
    // Smooth by default; ?stopmotion=1 brings back the 12-a-second paper steps.
    const tp = STOP_MOTION ? Math.floor(t * PAPER_FPS + 1e-6) / PAPER_FPS : t;
    PAPER.seek(tp, false);
    CAMERA.seek(t, false);
    renderPieces(tp);
    renderCamera();
    if (A.afterRender) A.afterRender(t);
    if (A.layout) A.layout(t);
    renderCaption(t);
  }

  // Caption: the spoken sentence, with the word Ava is saying marked like a highlighter pen.
  const capEl = document.getElementById("caption");
  let capKey, capWords = [];
  function renderCaption(t) {
    const lines = window.CAPTION_LINES || window.FILM.lines;
    const times = window.CAPTION_TIMES || window.TIMING?.voice || {};
    const active = Object.entries(times).filter(([, start]) => t >= start).at(-1);
    const key = active ? active[0] : null;
    if (key !== capKey) {
      capKey = key; capWords = []; capEl.textContent = "";
      const text = key ? lines[key] || "" : "";
      const parts = text.split(" "), spoken = window.VOICE?.[key]?.words || [];
      if (parts.length && parts.length === spoken.length) {
        parts.forEach((w, i) => {
          const span = document.createElement("span");
          span.className = "w"; span.textContent = w;
          capEl.append(span, i < parts.length - 1 ? " " : "");
          capWords.push([span, times[key] + spoken[i][1]]);
        });
      } else capEl.textContent = text;
    }
    if (!capWords.length) return;
    const end = times[capKey] + window.VOICE[capKey].dur - 0.15;
    let on = -1;
    if (t < end) capWords.forEach(([, start], i) => { if (t >= start - 0.04) on = i; });
    capWords.forEach(([span], i) => span.classList.toggle("on", i === on));
  }

  // ---------- choreography helpers (all times are absolute seconds) ----------
  const A = {
    PAPER, CAMERA, cam, CUES, pieces, piece, rr, makeLensView,

    set(p, v, t) { PAPER.set(p.st, v, t); },
    to(p, v, t, d, ease = "power2.inOut") { PAPER.to(p.st, { ...v, duration: d, ease }, t); },
    camTo(v, t, d, ease = "sine.inOut") { CAMERA.to(cam, { ...v, duration: d, ease }, t); },
    camSet(v) { Object.assign(cam, v); },
    sfx(name, t, gain = 1) { CUES.push({ type: "sfx", name, t: +t.toFixed(3), gain }); },
    voice(key, t) { CUES.push({ type: "voice", name: key, t: +t.toFixed(3), gain: 1 }); },

    /** instantly put a piece somewhere (e.g. off-stage before it enters) */
    place(p, x, y, t, extra = {}) { PAPER.set(p.st, { x, y, hy: 0, ...extra }, t); },

    /** drop from above the camera onto the table: big + shadowed -> lands with a small settle */
    drop(p, x, y, t, o = {}) {
      const d = o.d ?? (o.heavy ? 0.38 : 0.3);
      const rot = o.rot ?? rr(-2.5, 2.5);
      PAPER.set(p.st, { x: x + (o.dx ?? rr(-20, 20)), y: y - (o.fall ?? 40), s: o.from ?? 1.28, lift: 1, rot: rot + rr(-7, 7), op: 1, z: 70, hy: 0 }, t);
      PAPER.to(p.st, { x, y, s: 1, lift: 0, rot, duration: d, ease: "power2.in" }, t);
      PAPER.set(p.st, { z: o.z ?? 20 }, t + d);
      // paper flexes on landing
      PAPER.to(p.st, { keyframes: [{ s: o.heavy ? 0.965 : 0.98, duration: 0.07 }, { s: 1, duration: 0.12, ease: "power1.out" }] }, t + d);
      if (o.sound !== false) A.sfx(o.sound || (o.heavy ? "thump-heavy" : o.light ? "thump-light" : "thump"), t + d - 0.02, o.gain ?? 1);
      return t + d;
    },

    /** slide flat along the table (no lifting) */
    slide(p, x, y, t, d = 0.45, o = {}) {
      PAPER.to(p.st, { x, y, rot: o.rot ?? p.st.rot, duration: d, ease: o.ease || "back.out(1.25)" }, t);
      if (o.sound !== false) A.sfx(o.sound || "slide", t, o.gain ?? 0.8);
      return t + d;
    },

    /** enter by sliding in from off-stage */
    slideIn(p, fromX, fromY, x, y, t, d = 0.5, o = {}) {
      const rot = o.rot ?? rr(-2.5, 2.5);
      PAPER.set(p.st, { x: fromX, y: fromY, rot: rot + rr(-6, 6), s: 1, lift: 0, op: 1, hy: 0, z: o.z ?? 20 }, t);
      PAPER.to(p.st, { x, y, rot, duration: d, ease: o.ease || "back.out(1.2)" }, t);
      if (o.sound !== false) A.sfx(o.sound || "slide", t, o.gain ?? 0.8);
      return t + d;
    },

    /** pick up, carry in an arc, put down */
    carry(p, x, y, t, d = 0.75, o = {}) {
      const arc = o.arc ?? 90;
      const rot = o.rot ?? rr(-2.5, 2.5);
      PAPER.set(p.st, { z: o.airZ ?? 70 }, t);
      PAPER.to(p.st, { lift: 1, s: 1.05, duration: 0.14, ease: "power2.out" }, t);
      PAPER.to(p.st, { x, y, duration: d, ease: "power2.inOut" }, t + 0.08);
      PAPER.to(p.st, { rot: rot + rr(-5, 5), duration: d * 0.5, ease: "sine.out" }, t + 0.08);
      PAPER.to(p.st, { rot, duration: d * 0.5, ease: "sine.inOut" }, t + 0.08 + d * 0.5);
      PAPER.to(p.st, { keyframes: [{ hy: -arc, duration: d / 2, ease: "sine.out" }, { hy: 0, duration: d / 2, ease: "sine.in" }] }, t + 0.08);
      const land = t + 0.08 + d;
      if (!o.keepLift) PAPER.to(p.st, { lift: 0, s: 1, duration: 0.12, ease: "power2.in" }, land - 0.06);
      PAPER.set(p.st, { z: o.z ?? 20 }, land);
      if (o.sound !== false) A.sfx(o.sound || "whoosh", t, o.gain ?? 0.35);
      if (o.landSound !== false) A.sfx(o.landSound || "thump-light", land - 0.02, o.landGain ?? 0.7);
      return land;
    },

    /** fast, flat slap onto the table (labels, tags) */
    slap(p, x, y, t, o = {}) {
      return A.drop(p, x, y, t, { d: 0.2, from: 1.18, fall: 26, light: true, gain: 0.8, ...o });
    },

    /** little wiggle to point attention at something */
    wiggle(p, t, o = {}) {
      const a = o.amp ?? 5, r = p.st.rot;
      PAPER.to(p.st, {
        keyframes: [
          { rot: r - a, s: o.s ?? 1.07, lift: o.lift ?? 0.35, duration: 0.1, ease: "power1.out" },
          { rot: r + a * 0.8, duration: 0.12 },
          { rot: r - a * 0.4, duration: 0.1 },
          { rot: r, s: 1, lift: 0, duration: 0.14, ease: "power1.inOut" },
        ],
      }, t);
      if (o.sound) A.sfx(o.sound, t, o.gain ?? 0.6);
      return t + 0.46;
    },

    /** quick hop in place */
    hop(p, t, h = 22, o = {}) {
      PAPER.to(p.st, { keyframes: [{ hy: -h, lift: 0.4, s: 1.04, duration: 0.13, ease: "power2.out" }, { hy: 0, lift: 0, s: 1, duration: 0.13, ease: "power2.in" }] }, t);
      if (o.sound) A.sfx(o.sound, t + 0.24, o.gain ?? 0.5);
      return t + 0.26;
    },
  };

  // Adapted playback for watch-only films. Audio is the single master clock.
  let duration=60, current=0, playing=false, ready=false, raf=0, playbackRevision=0;
  const audio=new Audio('assets/audio/mix.m4a');
  audio.preload='none'; // the shared player plays each line on its own
  const playBtn=document.getElementById('play'), status=document.getElementById('status');
  const replayBtn=document.getElementById('replay'), muteBtn=document.getElementById('mute');
  const bigPlay=document.getElementById('bigplay');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Drawn icons, one stroke weight, so the controls read before a child can read the words.
  const ICON={
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.6v12.8a1.1 1.1 0 0 0 1.7.94l10-6.4a1.1 1.1 0 0 0 0-1.88l-10-6.4A1.1 1.1 0 0 0 8 5.6z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="6" y="5" width="4.4" height="14" rx="1.5"/><rect fill="currentColor" x="13.6" y="5" width="4.4" height="14" rx="1.5"/></svg>',
    replay:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 12.4a7.5 7.5 0 1 0 2.3-5.6"/><path d="M5.6 3.8v4.4H10"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.6c0-.6.5-1.1 1.1-1.1h2.8l4.4-3.7c.7-.6 1.7-.1 1.7.8v12.8c0 .9-1 1.4-1.7.8l-4.4-3.7H4.6c-.6 0-1.1-.5-1.1-1.1z"/><path d="M16.3 9.2a4 4 0 0 1 0 5.6M18.9 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    muted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.6c0-.6.5-1.1 1.1-1.1h2.8l4.4-3.7c.7-.6 1.7-.1 1.7.8v12.8c0 .9-1 1.4-1.7.8l-4.4-3.7H4.6c-.6 0-1.1-.5-1.1-1.1z"/><path d="M16.2 9.3l5 5.2M21.2 9.3l-5 5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };
  const setButton=(btn,icon,text)=>{btn.innerHTML=ICON[icon]+'<span>'+text+'</span>';};
  function syncUI(){
    const finished=current>=duration-.05;
    setButton(playBtn,playing?'pause':'play',ready?(playing?'Pause':'Play'):'Loading…');
    setButton(replayBtn,'replay','Replay');
    setButton(muteBtn,audio.muted?'muted':'sound',audio.muted?'Unmute':'Mute');
    muteBtn.setAttribute('aria-pressed',String(audio.muted));
    bigPlay.hidden=!ready||playing;
    setButton(bigPlay,finished?'replay':'play',finished?'Watch again':current>.05?'Keep watching':'Play');
    bigPlay.classList.toggle('again',finished);
  }
  let beats=[];
  function paint(){
    // Reduced motion presents deliberate still poses instead of moving paper.
    const index=beats.findLastIndex(b=>current>=b.t);
    const pose=reduced.matches&&index>=0?(beats[index+1]?.t??duration)-.3:current;
    renderAt(Math.min(duration,pose));renderCaption(current);
  }
  function frame(){
    if(!playing)return;
    current=Math.min(duration,audio.currentTime);paint();
    if(current>=duration-.04){pause();status.textContent='Finished';return;}
    raf=requestAnimationFrame(frame);
  }
  async function play(){
    if(playing||!ready)return;
    const revision=++playbackRevision;
    if(current>=duration-.05){current=0;audio.currentTime=0;}
    try{await audio.play();if(revision!==playbackRevision)return;playing=true;status.textContent='Playing';syncUI();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
    catch{if(revision===playbackRevision)status.textContent='Sound could not start. Press Play to try again.';}
  }
  function pause(){playbackRevision++;audio.pause();playing=false;cancelAnimationFrame(raf);current=Math.min(duration,audio.currentTime);status.textContent='Paused';syncUI();paint();}
  function replay(){pause();current=0;audio.currentTime=0;paint();play();}
  function fitStage(){
    const stage=document.getElementById('stage');
    const portrait=innerWidth<innerHeight*.9;
    document.body.classList.toggle('portrait',portrait);
    const w=portrait?1080:STAGE_W,h=portrait?1640:STAGE_H;
    stage.style.transform=document.body.classList.contains('render')?'':`scale(${Math.min(innerWidth/w,(innerHeight-90)/h)})`;
    paint();
  }
  audio.addEventListener('ended',()=>{playing=false;cancelAnimationFrame(raf);current=duration;paint();status.textContent='Finished';syncUI();});
  audio.addEventListener('error',()=>{pause();status.textContent='Audio file unavailable. Please use the local preview server.';});
  audio.addEventListener('waiting',()=>{if(playing)status.textContent='Buffering…';});
  audio.addEventListener('playing',()=>{status.textContent='Playing';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
  A.finish=function(dur,filmBeats){
    duration=dur;beats=filmBeats;
    PAPER.progress(1,true).progress(0,true);CAMERA.progress(1,true).progress(0,true);
    CUES.sort((a,b)=>a.t-b.t);
    window.renderAt=renderAt;window.CUES=CUES;window.DURATION=dur;window.BEATS=beats;
    const q=new URLSearchParams(location.search);
    if(q.has('render'))document.body.classList.add('render');
    fitStage();addEventListener('resize',fitStage);reduced.addEventListener('change',paint);
    playBtn.addEventListener('click',()=>playing?pause():play());replayBtn.addEventListener('click',replay);
    bigPlay.addEventListener('click',()=>play());
    const setMuted=m=>{audio.muted=m;syncUI();};
    muteBtn.addEventListener('click',()=>setMuted(!audio.muted));
    addEventListener('keydown',e=>{if(e.code==='Space'&&!/BUTTON|INPUT/.test(e.target.tagName)){e.preventDefault();playing?pause():play();}});
    if(q.get('muted')==='1')audio.muted=true;
    syncUI();
    const images=[...document.images].map(im=>im.complete?(im.naturalWidth?Promise.resolve():Promise.reject(new Error('Artwork failed: '+im.src))):new Promise((r,j)=>{im.onload=r;im.onerror=()=>j(new Error('Artwork failed: '+im.src));}));
    window.READY=Promise.all([...images,document.fonts?.ready]).then(()=>{
      ready=true;playBtn.disabled=false;replayBtn.disabled=false;status.textContent='Ready';syncUI();paint();return true;
    });
    window.READY.catch(()=>{status.textContent='Some pictures did not load. Please reload the page.';}).catch(error=>{status.textContent='Artwork could not load. Reload to try again.';throw error;});
    if(q.has('render'))window.FILM_TEST={audio,play,pause,replay,seek(t){pause();current=t;audio.currentTime=t;renderAt(t);},get state(){return{playing,current,pieces:pieces.length,muted:audio.muted};}};
    // Parent app can pause or update its shared sound preference without seeking.
    addEventListener('message',event=>{
      if(event.source!==parent||event.origin!==location.origin)return;
      if(event.data?.type==='paper-animation-pause')pause();
      if(event.data?.type==='paper-animation-mute')setMuted(Boolean(event.data.muted));
    });
    paint();
  };

  A.renderAt = renderAt; A.renderCaption = renderCaption;
  window.PV = A;
})();
