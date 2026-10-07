import * as THREE from './vendor/three.module.js';
import {texturePaths} from './demos.js';

/* Paper base-ten blocks drawn with three.js (side-by-side test with blocks.js, 3 Oct).
   Same scene as blocks3d-test.html: 1246 on a paper table, tap a block = it breaks into ten of the
   next size down and back, drag = turn, pinch / wheel = zoom (a lens zoom, so the camera never goes
   inside a block), two fingers or right-drag = slide the view.
   Grid: every face repeats one printed unit square, so lines stay straight in perspective and stay
   visible when zoomed out (the GPU picks a smaller copy of the square instead of skipping it).
   Returns an object shaped like the old engine (state, watchers, animate, breakAll, reset, render)
   so sound.js and the speed readout work unchanged. */
const U = 18; // one unit cube, same as blocks.js
const PAPER = { one: 'teal', ten: 'mustard', hundred: 'cream', thousand: 'kraft' };
const LINE = { teal: '#0d3d38', mustard: '#8a6410', cream: '#9c8466', kraft: '#7a5634' };
const TINT = { teal: 0xffffff, mustard: 0xffffff, cream: 0xffffff, kraft: 0xd8b48c };
const SIZE = { thousand: [10, 10, 10], hundred: [10, 1, 10], ten: [10, 1, 1], one: [1, 1, 1] };
const SMALL = { thousand: 'hundred', hundred: 'ten', ten: 'one' };
const TABLE_Y = -95;
const ease = t => t * t * (3 - 2 * t);

function loadImage(src) {
  return new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; });
}

// One printed unit square: a piece of the lab's paper with a grid line around its edge.
// The line is half on each side of the square's border, so repeated squares join seamlessly.
function unitSquare(base, paper, maxAniso) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  if (base) g.drawImage(base, 0, 0, 128, 128, 0, 0, S, S); else { g.fillStyle = '#eee'; g.fillRect(0, 0, S, S); }
  g.strokeStyle = LINE[paper]; g.globalAlpha = 0.5; g.lineWidth = 7;
  g.strokeRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

// A box sx by sy by sz unit cubes whose UVs count unit squares, so each face shows its own grid.
const boxCache = new Map();
function boxGeometry([sx, sy, sz]) {
  const key = `${sx}x${sy}x${sz}`;
  if (boxCache.has(key)) return boxCache.get(key);
  const geo = new THREE.BoxGeometry(sx * U, sy * U, sz * U);
  const uv = geo.attributes.uv;
  // BoxGeometry faces come in this order: +x, -x, +y, -y, +z, -z; 4 corners each.
  const reps = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v; uv.setXY(i, uv.getX(i) * reps[f][0], uv.getY(i) * reps[f][1]);
  }
  boxCache.set(key, geo);
  return geo;
}

export function baseTenThree(canvas, number = 1246) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  // Background and fog match the lit table, so the far edge of the table fades away instead of showing a line.
  scene.background = new THREE.Color(0xe2cfa6);
  scene.fog = new THREE.Fog(0xe2cfa6, 2600, 5200);
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb8a588, 1.9));
  const sun = new THREE.DirectionalLight(0xfff4e2, 1.6);
  sun.position.set(-260, 620, 380);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -560, right: 560, top: 420, bottom: -420, near: 100, far: 1500 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6; sun.shadow.radius = 4;
  scene.add(sun);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const materials = {};
  for (const paper of ['teal', 'mustard', 'cream', 'kraft'])
    materials[paper] = new THREE.MeshStandardMaterial({ color: TINT[paper], roughness: 0.92, metalness: 0 });

  // The paper table the blocks sit on.
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 1 });
  const table = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), tableMat);
  table.rotation.x = -Math.PI / 2; table.position.y = TABLE_Y; table.receiveShadow = true;
  scene.add(table);

  const root = new THREE.Group(); root.position.y = TABLE_Y; scene.add(root);
  const state = {}, watchers = [], groups = [], tappable = [];
  const anims = new Map();
  const block = (kind, parent, onTap) => {
    const mesh = new THREE.Mesh(boxGeometry(SIZE[kind]), materials[PAPER[kind]]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.onTap = onTap;
    parent.add(mesh); tappable.push(mesh);
    return mesh;
  };

  // Layout copied from blocks.js: thousands alone, hundreds stacked, tens side by side, ones in a little grid.
  const digits = String(number).padStart(4, '0').split('').map(Number);
  const colX = [-330, -95, 110, 270];
  const updaters = [];
  ['thousand', 'hundred', 'ten', 'one'].forEach((kind, place) => {
    for (let n = 0; n < digits[place]; n++) {
      const key = `split-${kind}-${n}`; state[key] = 0;
      const at = kind === 'thousand' ? [colX[0], 5 * U, 0] : kind === 'hundred' ? [colX[1], U / 2 + n * U * 1.15, 0]
        : kind === 'ten' ? [colX[2] + n * U * 1.5, U / 2, 0] : [colX[3] + (n % 2) * U * 1.6, U / 2, (Math.floor(n / 2) - 1) * U * 1.6];
      const spot = new THREE.Group(); spot.position.set(...at);
      if (kind === 'ten') spot.rotation.y = Math.PI / 2;
      root.add(spot);
      const small = SMALL[kind];
      if (!small) {
        // Ones cannot break: a tap makes them hop.
        const hopKey = `hop-one-${n}`; state[hopKey] = 0;
        const mesh = block(kind, spot, () => { state[hopKey] = 0; animate(hopKey, 1, { duration: 450 }); });
        updaters.push(() => { mesh.position.y = Math.sin(Math.PI * state[hopKey]) * 16; });
        continue;
      }
      const toggle = () => animate(key, state[key] > 0.5 ? 0 : 1, { duration: 1200 });
      const whole = block(kind, spot, toggle);
      const base = kind === 'thousand' ? -5 * U : 0;
      const pieces = [];
      for (let i = 0; i < 10; i++) { const m = block(small, spot, toggle); m.visible = false; pieces.push(m); }
      updaters.push(() => {
        const s = state[key], t = ease(s), hop = Math.sin(Math.PI * t) * 40;
        whole.visible = s === 0;
        pieces.forEach((m, i) => {
          m.visible = s > 0;
          if (!m.visible) return;
          // Same paths as piecePose() in blocks.js.
          if (kind === 'ten') m.position.set((i - 4.5) * U * (1 + 0.6 * t), hop * 0.5, 0);
          else if (kind === 'hundred') m.position.set(0, hop * 0.4, (i - 4.5) * U * (1 + 0.5 * t));
          else m.position.set(0, base + i * U * (1 + 0.45 * t) + U / 2 + hop * 0.2, 0);
        });
      });
      groups.push({ key, kind });
    }
  });

  // Paper textures: use the lab tiles when they arrive.
  Promise.all(['teal', 'mustard', 'cream'].map(p => loadImage(texturePaths[p]))).then(([teal, mustard, cream]) => {
    const imgs = { teal, mustard, cream, kraft: cream };
    for (const paper in materials) { materials[paper].map = unitSquare(imgs[paper], paper, maxAniso); materials[paper].needsUpdate = true; }
    // The table: plain paper, no grid line, one tile every 120 units.
    const c = document.createElement('canvas'); c.width = c.height = 256;
    if (cream) c.getContext('2d').drawImage(cream, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(100, 100); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    tableMat.map = t; tableMat.needsUpdate = true;
    invalidate();
  });

  // Camera: turns around a point (yaw / pitch); zoom is a lens zoom; the point can slide.
  const camera = new THREE.PerspectiveCamera(30, 1, 50, 6000);
  const defaultView = { yaw: -0.55, pitch: 0.62, zoom: 1, target: new THREE.Vector3(-70, TABLE_Y + 60, 0) };
  const view = { ...defaultView, target: defaultView.target.clone() };
  let distance = 1600;
  function fit() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Far enough that the whole 1246 scene (about 820 wide, 420 tall) fits at zoom 1.
    const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
    distance = Math.max(480 / Math.tan(hf), 300 / Math.tan(vf));
  }
  function placeCamera() {
    const cp = Math.cos(view.pitch);
    camera.position.set(view.target.x + distance * cp * Math.sin(view.yaw), view.target.y + distance * Math.sin(view.pitch), view.target.z + distance * cp * Math.cos(view.yaw));
    camera.lookAt(view.target);
    camera.zoom = view.zoom; camera.updateProjectionMatrix();
  }

  let frame = 0;
  function render() { renderer.render(scene, camera); }
  const api = { state, watchers, groups, renderer, scene, camera, render: () => render() };
  function invalidate() { if (!frame) frame = requestAnimationFrame(tick); }
  function tick(now) {
    frame = 0;
    let busy = false;
    for (const [key, a] of anims) {
      const t = Math.min(1, (now - a.start) / a.duration);
      state[key] = a.from + (a.to - a.from) * t;
      if (t >= 1) { state[key] = a.to; anims.delete(key); } else busy = true;
    }
    updaters.forEach(f => f());
    watchers.forEach(f => f());
    placeCamera();
    api.render();
    if (busy) invalidate();
  }
  function animate(key, to, { duration = 720 } = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) duration = 1;
    anims.set(key, { from: state[key] || 0, to, duration, start: performance.now() });
    invalidate();
  }

  // Touch and mouse: one finger drags = turn; two fingers = pinch zoom + slide; short tap = break / hop.
  const pointers = new Map(); let downAt = null, moved = 0, pinch = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button, shift: e.shiftKey });
    if (pointers.size === 1) { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = 0; }
    else { downAt = null; pinch = null; }
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (pointers.size === 1) {
      if (p.button === 2 || p.shift) slide(dx, dy);
      else { view.yaw -= dx * 0.008; view.pitch = THREE.MathUtils.clamp(view.pitch + dy * 0.006, 0.08, 1.45); }
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, gap = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) { zoomBy(gap / pinch.gap); slide(mid.x - pinch.mid.x, mid.y - pinch.mid.y); }
      pinch = { mid, gap };
    }
    invalidate();
  });
  const up = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (downAt && pointers.size === 0 && moved < 10 && performance.now() - downAt.t < 600) tap(e);
    if (pointers.size === 0) downAt = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); downAt = null; pinch = null; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015)); invalidate(); }, { passive: false });
  function zoomBy(k) { view.zoom = THREE.MathUtils.clamp(view.zoom * k, 0.7, 5); }
  function slide(dx, dy) {
    // Move the turning point across the table, by as much as the finger moved on screen.
    const per = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / (canvas.clientHeight || 1) / view.zoom;
    const right = new THREE.Vector3(Math.cos(view.yaw), 0, -Math.sin(view.yaw));
    const ahead = new THREE.Vector3(-Math.sin(view.yaw), 0, -Math.cos(view.yaw));
    view.target.addScaledVector(right, -dx * per).addScaledVector(ahead, dy * per / Math.max(0.3, Math.sin(view.pitch)));
    view.target.x = THREE.MathUtils.clamp(view.target.x, -500, 500); view.target.z = THREE.MathUtils.clamp(view.target.z, -400, 400);
  }
  function tap(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(tappable.filter(m => m.visible), false)[0];
    if (hit) hit.object.userData.onTap();
  }

  api.animate = animate;
  api.invalidate = invalidate;
  api.breakAll = on => groups.forEach(g => { if (g.kind !== 'one') animate(g.key, on ? 1 : 0, { duration: 1200 }); });
  api.reset = () => { Object.assign(view, { ...defaultView, target: defaultView.target.clone() }); invalidate(); };
  api.view = view;
  // For test scripts: put every piece where the current state says, without waiting for a frame.
  api.pose = () => { updaters.forEach(f => f()); placeCamera(); };
  new ResizeObserver(() => { fit(); invalidate(); }).observe(canvas);
  fit(); invalidate();
  return api;
}
