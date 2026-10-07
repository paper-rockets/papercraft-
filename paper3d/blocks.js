import {Paper3D,PaperCard,PaperNode,compose,translation,rotation,rectangle} from './engine.js';
import {texturePaths} from './demos.js';

/* Paper base-ten blocks in 3D (test, 3 Oct). One block = 6 thin card faces with a printed grid,
   so a thousand is one big cube, not 1000 little ones (keeps the tablet fast).
   Tap a block to break it into ten of the next size down; tap again to put it back.
   Colours are the 3D lab's paper (user's pick): ones teal, tens mustard, hundreds cream, thousand kraft. */
const U = 18; // one unit cube
const PAPER = { one: 'teal', ten: 'mustard', hundred: 'cream', thousand: 'kraft' };
const INK = { teal: '#1f6b63', mustard: '#e9b530', cream: '#f6efe2', kraft: '#c9a27a' };
const LINE = { teal: '#0d3d38', mustard: '#8a6410', cream: '#9c8466', kraft: '#7a5634' };

// Printed grid textures, made from the lab's paper tiles once they have loaded.
function gridTexture(engine, paper, cols, rows) {
  const key = `${paper}-${cols}x${rows}`;
  if (engine.textures.has(key)) return key;
  const base = engine.textures.get(paper === 'kraft' ? 'cream' : paper);
  if (!base) return paper;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.drawImage(base, 0, 0, 256, 256);
  if (paper === 'kraft') { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#d8b48c'; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = 'source-over'; }
  g.strokeStyle = LINE[paper]; g.globalAlpha = 0.45; g.lineWidth = 3;
  for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(i * 256 / cols, 0); g.lineTo(i * 256 / cols, 256); g.stroke(); }
  for (let j = 1; j < rows; j++) { g.beginPath(); g.moveTo(0, j * 256 / rows); g.lineTo(256, j * 256 / rows); g.stroke(); }
  engine.textures.set(key, c);
  return key;
}

// A paper box sx by sy by sz (in unit cubes), centred on its node. Each face gets a grid of its size.
function block(engine, { id, size: [sx, sy, sz], node, paper, visible, onTap }) {
  const [w, h, d] = [sx * U, sy * U, sz * U];
  const faces = [
    ['front', translation(0, 0, d / 2), w, h, sx, sy], ['back', compose(translation(0, 0, -d / 2), rotation('y', Math.PI)), w, h, sx, sy],
    ['left', compose(translation(-w / 2, 0, 0), rotation('y', -Math.PI / 2)), d, h, sz, sy], ['right', compose(translation(w / 2, 0, 0), rotation('y', Math.PI / 2)), d, h, sz, sy],
    ['top', compose(translation(0, h / 2, 0), rotation('x', -Math.PI / 2)), w, d, sx, sz], ['bottom', compose(translation(0, -h / 2, 0), rotation('x', Math.PI / 2)), w, d, sx, sz],
  ];
  return faces.map(([side, matrix, fw, fh, cols, rows]) => {
    const card = engine.add(new PaperCard({ id: `${id}-${side}`, points: rectangle(fw, fh), node: new PaperNode({ parent: node, matrix }), texture: paper, color: INK[paper], edge: LINE[paper], thickness: 0, visible, onTap }));
    card.grid = [paper, cols, rows];
    return card;
  });
}

const ease = t => t * t * (3 - 2 * t);
// Where the 10 smaller pieces go when a block breaks: spread out with a small hop.
function piecePose(kind, i, t) {
  const hop = Math.sin(Math.PI * t) * 40;
  if (kind === 'ten') return translation((i - 4.5) * U * (1 + 0.6 * t) , hop * 0.5 + U / 2, 0);                       // rod -> 10 ones in a row
  if (kind === 'hundred') return translation(0, hop * 0.4 + U / 2, (i - 4.5) * U * (1 + 0.5 * t));                     // flat -> 10 rods side by side
  return translation(0, i * U * (1 + 0.45 * t) + U + hop * 0.2, 0);                                                // thousand -> 10 flats, a lifted stack
}

export function baseTenScene(canvas, number = 1246, options = {}) {
  const engine = new Paper3D(canvas, { extent: 760, tableY: -95, ...options });
  engine.camera = { yaw: -0.55, pitch: 0.62, zoom: 1 }; engine.defaultCamera = { ...engine.camera };
  const digits = String(number).padStart(4, '0').split('').map(Number);
  const root = new PaperNode({ matrix: translation(0, -95, 0) });
  const groups = [];
  const kinds = ['thousand', 'hundred', 'ten', 'one'];
  const SIZE = { thousand: [10, 10, 10], hundred: [10, 1, 10], ten: [10, 1, 1], one: [1, 1, 1] };
  const SMALL = { thousand: 'hundred', hundred: 'ten', ten: 'one' };
  const colX = [-330, -95, 110, 270];
  kinds.forEach((kind, place) => {
    for (let n = 0; n < digits[place]; n++) {
      const key = `split-${kind}-${n}`, id = `${kind}-${n}`;
      engine.state[key] = 0;
      // Where this block sits on the table: thousands alone, hundreds stacked, tens side by side, ones in a little grid.
      const at = kind === 'thousand' ? [colX[0], 5 * U, 0] : kind === 'hundred' ? [colX[1], U / 2 + n * U * 1.15, 0]
        : kind === 'ten' ? [colX[2] + n * U * 1.5, U / 2, 0] : [colX[3] + (n % 2) * U * 1.6, U / 2, (Math.floor(n / 2) - 1) * U * 1.6];
      const place3 = new PaperNode({ parent: root, matrix: kind === 'ten' ? compose(translation(...at), rotation('y', Math.PI / 2)) : translation(...at) });
      const toggle = () => { if (!SMALL[kind]) return; engine.animate(key, engine.state[key] > 0.5 ? 0 : 1, { duration: 1200 }); };
      const whole = block(engine, { id, size: SIZE[kind], node: place3, paper: PAPER[kind], visible: s => !SMALL[kind] || (s[key] || 0) === 0, onTap: SMALL[kind] ? toggle : (card, e) => e.react(card, { kind: 'lift' }) });
      if (SMALL[kind]) {
        const small = SMALL[kind];
        // The ten pieces start packed exactly where the whole block is.
        const base = kind === 'thousand' ? -5 * U : 0;
        for (let i = 0; i < 10; i++) {
          const node = new PaperNode({ parent: place3, pose: s => compose(translation(0, base - U / 2, 0), piecePose(kind, i, ease(s[key] || 0))) });
          block(engine, { id: `${id}-piece-${i}`, size: SIZE[small], node, paper: PAPER[small], visible: s => (s[key] || 0) > 0, onTap: toggle });
        }
      }
      groups.push({ key, kind });
    }
  });
  engine.groups = groups;
  // Break every block at once (and back): the heaviest scene, used as the speed test.
  engine.breakAll = on => groups.forEach(g => { if (g.kind !== 'one') engine.animate(g.key, on ? 1 : 0, { duration: 1200 }); });
  engine.loadTextures(texturePaths).then(() => {
    for (const card of engine.cards) if (card.grid) card.texture = gridTexture(engine, ...card.grid);
    engine.invalidate();
  });
  return engine;
}
