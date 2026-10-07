// The paper capybara who keeps the child company in every animation.
// Poses are whole cut-out pictures (public/capy-paper), swapped by mood; the hop and breathing are CSS.
window.CapyHelper = (() => {
  const POSES = ['sit', 'wave', 'cheer', 'think', 'laugh', 'content'];
  const base = '../../capy-paper/capy-';
  const stage = document.getElementById('stage');
  const box = document.createElement('div');
  box.id = 'capy-helper';
  box.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.alt = ''; img.draggable = false;
  box.appendChild(img);
  stage.appendChild(box);
  for (const p of POSES) { const pre = new Image(); pre.src = base + p + '.webp'; }
  let mood = 'sit', resting = 'sit', timer = 0;

  function show(pose, moveClass) {
    img.src = base + pose + '.webp';
    box.dataset.pose = pose;
    if (moveClass) { box.classList.remove('hop', 'wobble'); void box.offsetWidth; box.classList.add(moveClass); }
  }
  // A lasting mood (sit, wave, laugh at the end).
  function set(next) {
    resting = next;
    clearTimeout(timer);
    if (next !== mood) { mood = next; show(next, next === 'wave' ? 'hop' : next === 'laugh' ? 'hop' : null); }
  }
  // A short reaction, then back to the lasting mood.
  function react(pose, ms = 1000) {
    clearTimeout(timer);
    mood = pose;
    show(pose, pose === 'think' ? 'wobble' : 'hop');
    timer = setTimeout(() => { mood = resting; show(resting, null); }, ms);
  }
  show('sit');
  return {set, react, el: box};
})();
