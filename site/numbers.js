/* numbers chapter: three big numbers, pinned while the section is under the viewport.
   1 odometer (light blue), 2 tunnel (light pink), 3 stack (navy). All three.js, one canvas.
   Inside a chapter the motion is scrubbed by scroll. Between chapters the next colour sheet crosses on its own 760ms clock,
   triggered at a scroll line, so the sheet edge never parks across a number. The covered chapter is pushed up 22%.
   After the last chapter #work covers the whole stage the same way. */
import * as THREE from 'three';

/* Real values go here, as strings ('150K+', '3,677' and so on work). Until Kirtan gives them, they stay '000'. Never invent one. */
const NUMBERS = [
  { value: '000', label: 'number to come' },
  { value: '000', label: 'number to come' },
  { value: '000', label: 'number to come' },
];

/* index.html maps only 'three', so the addons load by full URL. Their own 'three' import still resolves through the page's map. */
const ADDONS = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/';
const FONT_URL = new URL('./bowlby-one.ttf', import.meta.url).href;
const C = { ink: 0x0c0d0f, paper: 0xf1f2f0, blue: 0xc9d8f7, pink: 0xf2a7b6, sky: 0x7d9bf0, cobalt: 0x1c3bb0, navy: 0x0f2545 };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RMK = RM ? 0 : 1;

/* Scroll plan, in screens. 0 is the moment the section pins (it enters from -1). */
const TL = { roll: [-0.8, 0.7], at: [1.0, 3.15], fly: [1.1, 2.95], build: [3.3, 4.6], pin: 5.1 };
const MOVE_MS = 760;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rng = (p, a, b) => clamp((p - a) / (b - a));
const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = t => { const c = 0.7, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
/* the page-wide motion curves, as functions for the canvas: move = cubic-bezier(.7,0,.2,1) */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; t = clamp(t); } return Y(t); };
}
const eMove = bezier(0.7, 0, 0.2, 1);

/* ---------- DOM ---------- */
const SEC = document.getElementById('numbers');
const css = document.createElement('style');
css.textContent = `
#numbers{position:relative;background:transparent;--nm-arrive:cubic-bezier(.2,.8,.2,1);--nm-move:cubic-bezier(.7,0,.2,1);--nm-leave:cubic-bezier(.6,0,.85,.3)}
.nm-stage{position:absolute;left:0;top:0;width:100%;height:100vh;height:100svh;overflow:hidden;background:#c9d8f7}
.nm-stage.nm-fix,.nm-stage.nm-post{position:fixed}
.nm-stage.nm-post{z-index:-1}
.nm-stage.nm-gone{visibility:hidden}
.nm-canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.nm-layer{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;visibility:hidden}
.nm-lab{position:absolute;left:0;top:0;margin:0;font:500 clamp(19px,1.9vw,30px)/1.15 "Bricolage Grotesque",system-ui,sans-serif;white-space:nowrap}
.nm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
`;
document.head.appendChild(css);
SEC.innerHTML = `<div class="nm-stage"><canvas class="nm-canvas" aria-hidden="true"></canvas>
<div class="nm-layer" data-i="0"><p class="nm-lab" style="color:#0c0d0f" aria-hidden="true"></p></div>
<div class="nm-layer" data-i="1"></div>
<div class="nm-layer" data-i="2"><p class="nm-lab" style="color:#f1f2f0" aria-hidden="true"></p></div>
<ul class="nm-sr"></ul></div>`;
const stage = SEC.querySelector('.nm-stage'), canvas = SEC.querySelector('.nm-canvas');
const layers = [...SEC.querySelectorAll('.nm-layer')];
const labs = [layers[0].querySelector('.nm-lab'), null, layers[2].querySelector('.nm-lab')];
labs[0].textContent = NUMBERS[0].label; labs[2].textContent = NUMBERS[2].label;
SEC.querySelector('.nm-sr').innerHTML = NUMBERS.map(n => `<li>${n.value} ${n.label}</li>`).join('');

let W = 1, H = 1, ASP = 1;
function sizeSection() {
  W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight; ASP = W / H;
  SEC.style.height = Math.round((TL.pin + 1) * H) + 'px';
}
sizeSection();

/* ---------- pinning, chapter switch and the hand-off to #work ---------- */
/* Sticky would be the natural tool, but after the landing body becomes its own scroll container and sticky never engages.
   So the stage goes fixed while the section is under it. Past the end it stays fixed, drops behind #work and is pushed up 22%,
   so #work covers it like each chapter covers the last. #work needs an opaque background for that to read. */
let pinMode = '';
const wipe = [null, { v: 0, from: 0, to: 0, t0: 0 }, { v: 0, from: 0, to: 0, t0: 0 }];
function setWipe(i, to) {
  const w = wipe[i]; if (w.to === to) return;
  w.from = w.v; w.to = to; w.t0 = performance.now(); if (RM) w.v = w.from = to;
}
function pin() {
  const top = SEC.getBoundingClientRect().top, max = SEC.offsetHeight - H, s = -top / H;
  const mode = top > 0 ? 'pre' : (-top < max ? 'fix' : 'post');
  if (mode !== pinMode) {
    pinMode = mode;
    stage.classList.toggle('nm-fix', mode === 'fix'); stage.classList.toggle('nm-post', mode === 'post');
    if (mode !== 'post') { stage.style.transform = ''; stage.classList.remove('nm-gone'); }
  }
  if (mode === 'post') {
    const p = clamp((-top - max) / H);
    stage.style.transform = RM ? '' : `translateY(${(-0.22 * p * H).toFixed(1)}px)`;
    stage.classList.toggle('nm-gone', p >= 1);
  }
  setWipe(1, s >= TL.at[0] ? 1 : 0); setWipe(2, s >= TL.at[1] ? 1 : 0);
}
addEventListener('scroll', () => { window.__nmSettled = false; pin(); kick(); }, { passive: true });
pin();

/* ---------- boot only when needed ---------- */
let booted = false, visible = false;
function wake() { if (!booted) { booted = true; boot().catch(e => console.error('[numbers]', e)); } }
if (window.KP && window.KP.final) wake();
addEventListener('kp:final', wake, { once: true });
new IntersectionObserver(([en]) => {
  visible = en.isIntersecting && en.intersectionRatio > 0;
  if (visible) { wake(); kick(); }
}, { threshold: [0, 0.01] }).observe(SEC);

/* ---------- three ---------- */
let renderer, FONT, TextGeometry;
const FOV = 30, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), D = 12;
let VH = 2 * D * TAN, VW = VH;
const makeCam = () => { const c = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400); c.position.set(0, 0, D); return c; };
function lights(scene, k = 1) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.3 * k));
  const key = new THREE.DirectionalLight(0xffffff, 2.2 * k); key.position.set(-3, 7, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4 * k); fill.position.set(5, -2, 6); scene.add(fill);
}
const glyphCache = new Map();
function glyph(ch, opt) { // centred on x and z; y keeps the font baseline
  const key = ch + JSON.stringify(opt);
  if (glyphCache.has(key)) return glyphCache.get(key);
  const g = new TextGeometry(ch, Object.assign({ font: FONT, size: 1, curveSegments: 10 }, opt));
  g.computeBoundingBox(); const bb = g.boundingBox;
  g.userData = { w: bb.max.x - bb.min.x, minY: bb.min.y, maxY: bb.max.y };
  g.translate(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2);
  glyphCache.set(key, g); return g;
}
let MID = 0.5, CAPH = 1; // set from the real '0' glyph at boot
const _v = new THREE.Vector3();
function toScreen(obj, cam, x, y, z) { obj.updateMatrixWorld(true); _v.set(x, y, z); obj.localToWorld(_v); _v.project(cam); return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }

/* ---------- 1. odometer ---------- */
const odo = { scene: new THREE.Scene(), cam: makeCam(), group: new THREE.Group(), drums: [] };
function buildOdo() {
  const { scene, group } = odo;
  scene.background = new THREE.Color(C.blue); lights(scene); scene.add(group);
  const face = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.42 });
  const side = new THREE.MeshStandardMaterial({ color: C.navy, roughness: 0.5 });
  const body = new THREE.MeshStandardMaterial({ color: C.cobalt, roughness: 0.5 });
  const TH = 0.24, opt = { height: TH, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.014, bevelSegments: 2 };
  const G = ch => { const g = glyph(ch, opt); if (!g.userData.c) { g.translate(0, -MID, 0); g.userData.c = 1; } return g; };
  let dw = 0; for (let d = 0; d < 10; d++) dw = Math.max(dw, G(String(d)).userData.w);
  const chars = [...NUMBERS[0].value], cellW = dw * 1.18, gap = 0.1;
  const widths = chars.map(ch => /\d/.test(ch) ? cellW : G(ch).userData.w + 0.1);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  // ten digits round each drum, with air between them
  const R = odo.R = 10 * CAPH * 1.5 / (Math.PI * 2), STEP = odo.STEP = Math.PI * 2 / 10;
  const cyl = new THREE.CylinderGeometry(R - TH / 2 - 0.004, R - TH / 2 - 0.004, cellW, 96, 1, false); cyl.rotateZ(Math.PI / 2);
  let x = -total / 2; const nd = chars.filter(c => /\d/.test(c)).length; let j = 0;
  chars.forEach((ch, i) => {
    const cx = x + widths[i] / 2; x += widths[i] + gap;
    if (/\d/.test(ch)) {
      const drum = new THREE.Group(); drum.position.x = cx; drum.add(new THREE.Mesh(cyl, body));
      for (let k = 0; k < 10; k++) {
        const m = new THREE.Mesh(G(String(k)), [face, side]), phi = -k * STEP;
        m.position.set(0, R * Math.sin(phi), R * Math.cos(phi)); m.rotation.x = -phi; drum.add(m);
      }
      drum.userData = { target: +ch, j, revs: 1 + (nd - 1 - j) * 0.6 };
      j++; group.add(drum); odo.drums.push(drum);
    } else { const m = new THREE.Mesh(G(ch), [face, side]); m.position.set(cx, 0, R); group.add(m); }
  });
  odo.width = total; odo.nd = nd;
}
function layoutOdo() {
  // the whole drum stays inside the frame: digits roll over its top and bottom, never off the frame edge
  odo.s = Math.min(VW * (ASP < 1 ? 0.8 : 0.5) / odo.width, VH * 0.8 / (2 * odo.R + 0.3), VH * 0.3 / CAPH);
}
function updateOdo(s) {
  const { group, drums, R, STEP, nd } = odo, sc = odo.s;
  drums.forEach(d => {
    const u = d.userData, end = TL.roll[1] - (nd - 1 - u.j) * 0.14;
    const e = RM ? 1 : eBack(rng(s, TL.roll[0], end));
    d.rotation.x = -u.target * STEP + (1 - e) * u.revs * Math.PI * 2 * RMK;
  });
  group.scale.setScalar(sc);
  group.rotation.set(lerp(0.22, -0.04, eIO(rng(s, -1, 0.9))) * RMK, lerp(-0.12, 0.06, eIO(rng(s, -1, 1.2))) * RMK, 0);
  group.position.set(0, 0, -R * sc);
  // label: beside the number when there is room, under the drums when there is not
  const lab = labs[0], lw = lab.offsetWidth, lh = lab.offsetHeight, right = toScreen(group, odo.cam, odo.width / 2, -CAPH / 2, R);
  if (ASP >= 1 && W - right.x > lw + 72) lab.style.transform = `translate(${(right.x + 36).toFixed(1)}px,${(right.y - lh * 0.95).toFixed(1)}px)`;
  else { const b = toScreen(group, odo.cam, 0, -R, 0); lab.style.transform = `translate(${((W - lw) / 2).toFixed(1)}px,${Math.min(b.y + 22, H - lh - 36).toFixed(1)}px)`; }
}

/* ---------- 2. tunnel ---------- */
const tun = { scene: new THREE.Scene(), cam: makeCam(), group: new THREE.Group(), L: 72, SP: 2.6, F: 0.72 };
function buildTunnel() {
  const { scene, group } = tun;
  scene.background = new THREE.Color(C.pink);
  scene.fog = new THREE.Fog(C.pink, 14, 52);
  scene.add(group); tun.cam.position.set(0, 0, 0);
  const ink = new THREE.MeshBasicMaterial({ color: C.ink });
  // the number printed on the walls: real glyph outlines, so they stay sharp at any distance
  const flat = glyph(NUMBERS[1].value, { height: 0.001, bevelEnabled: false, curveSegments: 12 });
  const g2 = flat.clone(); g2.translate(0, -(flat.userData.minY + flat.userData.maxY) / 2, 0);
  tun.numW = flat.userData.w; tun.numH = flat.userData.maxY - flat.userData.minY;
  const rows = tun.rows = Math.ceil(tun.L / tun.SP) + 2;
  tun.walls = new THREE.InstancedMesh(g2, ink, rows * 4); group.add(tun.walls);
  tun.rings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), ink, Math.ceil(rows / 2) * 4); group.add(tun.rings);
  // the far wall: paper, the number in ink, the label printed under it
  tun.capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  tun.cap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), tun.capMat); group.add(tun.cap);
  const big = glyph(NUMBERS[1].value, { height: 0.12, bevelEnabled: false, curveSegments: 14 });
  tun.big = new THREE.Mesh(big, ink); group.add(tun.big); tun.bigW = big.userData.w;
}
function capTexture(aw, ah) {
  const cw = innerWidth < 700 ? 1400 : 2048, ch = Math.round(cw * ah / aw);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
  g.fillStyle = '#f1f2f0'; g.fillRect(0, 0, cw, ch);
  g.fillStyle = '#0c0d0f'; g.textAlign = 'center'; g.textBaseline = 'top';
  g.font = `500 ${Math.round(cw * (ASP < 1 ? 0.075 : 0.034))}px "Bricolage Grotesque"`;
  g.fillText(NUMBERS[1].label, cw / 2, ch * tun.labY);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function layoutTunnel() {
  // the cross-section matches the screen's shape, so the far wall sits in the frame like a page
  const base = 4, Aw = ASP >= 1 ? base * ASP : base, Ah = ASP >= 1 ? base : base / ASP;
  tun.Aw = Aw; tun.Ah = Ah;
  const { L, SP, rows } = tun, m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0, -1);
  const walls = [ // [normal, centre, wall width]
    [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -Ah / 2, 0), Aw],
    [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, Ah / 2, 0), Aw],
    [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-Aw / 2, 0, 0), Ah],
    [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(Aw / 2, 0, 0), Ah],
  ];
  let n = 0;
  walls.forEach(([nrm, ctr, ww]) => {
    const r = new THREE.Vector3().crossVectors(up, nrm); q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, up, nrm));
    const k = Math.min(ww * 0.6 / tun.numW, SP * 0.58 / tun.numH);
    for (let i = 0; i < rows; i++) {
      p.copy(ctr).addScaledVector(nrm, 0.004); p.z = 2 - SP * (i + 0.5);
      sv.set(k, k, 1); m.compose(p, q, sv); tun.walls.setMatrixAt(n++, m);
    }
  });
  tun.walls.instanceMatrix.needsUpdate = true;
  // thin ink frames every other row, to mark the speed
  const t = 0.05; n = 0; q.identity();
  for (let i = 0; i < Math.ceil(rows / 2); i++) {
    const z = 2 - SP * 2 * i - SP;
    for (const [x, y, w, h] of [[0, -Ah / 2, Aw, t], [0, Ah / 2, Aw, t], [-Aw / 2, 0, t, Ah], [Aw / 2, 0, t, Ah]]) {
      p.set(x, y, z); sv.set(w + t, h + t, t); m.compose(p, q, sv); tun.rings.setMatrixAt(n++, m);
    }
  }
  tun.rings.instanceMatrix.needsUpdate = true;
  tun.cap.scale.set(Aw, Ah, 1); tun.cap.position.z = -L;
  const k = Math.min(Aw * (ASP < 1 ? 0.8 : 0.6) / tun.bigW, Ah * 0.42 / CAPH);
  tun.big.scale.set(k, k, 1); tun.big.position.set(0, -MID * k + Ah * 0.05, -L + 0.07);
  tun.labY = 0.5 - 0.05 + (CAPH * k * 0.5 + Ah * 0.06) / Ah; // just under the number, in texture space (top down)
  if (tun.capMat.map) tun.capMat.map.dispose();
  tun.capMat.map = capTexture(Aw, Ah); tun.capMat.needsUpdate = true;
  const d = Ah / (2 * tun.F * TAN); // where the far wall fills F of the frame
  tun.stop = L - d;
  tun.scene.fog.near = d + 3; tun.scene.fog.far = d + 46; // the far wall is never tinted at rest
}
function updateTunnel(s) {
  const f = eIO(rng(s, TL.fly[0], TL.fly[1]));
  tun.group.position.z = lerp(0, tun.stop, f);
  tun.group.rotation.z = lerp(-0.5, 0, eIO(rng(s, TL.fly[0], TL.fly[1] - 0.15))) * RMK;
}

/* ---------- 3. stack ---------- */
/* The number can be set on one line or stacked, one equal group per line. On a phone, '000' set as three stacked digits
   fills the frame, where one line would be a thin band. Uneven splits are never used, so it never reads as two numbers. */
const stk = { scene: new THREE.Scene(), cam: makeCam(), group: new THREE.Group() };
const meas = document.createElement('canvas').getContext('2d');
function capEm() { meas.font = '400 100px "Bowlby One"'; const m = meas.measureText('0'); return (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100; }
const splitLines = (v, k) => { const ch = [...v], n = ch.length / k; return Array.from({ length: k }, (_, i) => ch.slice(i * n, (i + 1) * n).join('')); };
function lineWidths(lines, fs) { meas.font = `400 ${fs}px "Bowlby One"`; return lines.map(l => [...l].reduce((a, ch) => a + meas.measureText(ch).width, 0) + fs * 0.14 * (l.length - 1)); }
function pickLines(value) {
  const n = [...value].length, CAP = capEm(); let best = 1, bestS = 0;
  for (let k = 1; k <= Math.min(3, n); k++) {
    if (n % k) continue;
    const w = Math.max(...lineWidths(splitLines(value, k), 100)) / 100, h = k * CAP + (k - 1) * CAP * 0.3;
    const sc = Math.min(0.86 * ASP / w, (ASP < 1 ? 0.68 : 0.44) / h);
    if (sc > bestS * 1.08) { bestS = sc; best = k; }
  }
  return best;
}
function rasterize(value, rowsTarget, k) {
  const fs = 300, CAP = capEm(), lines = splitLines(value, k), ws = lineWidths(lines, fs), gap = fs * CAP * 0.3;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const w = Math.ceil(Math.max(...ws)) + 60, h = Math.ceil(60 + k * fs * CAP + (k - 1) * gap + fs * 0.3);
  c.width = w; c.height = h;
  // one character at a time with air between, so neighbouring digits never fuse into one block shape
  g.font = `400 ${fs}px "Bowlby One"`; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  lines.forEach((l, i) => {
    let x = 30 + (Math.max(...ws) - ws[i]) / 2; const y = 30 + fs * CAP * (i + 1) + gap * i;
    for (const ch of l) { g.fillText(ch, x, y); x += g.measureText(ch).width + fs * 0.14; }
  });
  const cell = fs * CAP / rowsTarget, data = g.getImageData(0, 0, w, h).data;
  let cells = [];
  for (let r = 0; r < Math.floor(h / cell); r++) for (let q = 0; q < Math.floor(w / cell); q++) {
    const px = Math.floor((q + 0.5) * cell), py = Math.floor((r + 0.5) * cell);
    if (data[(py * w + px) * 4 + 3] > 120) cells.push({ c: q, r });
  }
  const minc = Math.min(...cells.map(o => o.c)), maxc = Math.max(...cells.map(o => o.c));
  const minr = Math.min(...cells.map(o => o.r)), maxr = Math.max(...cells.map(o => o.r));
  cells = cells.map(o => ({ c: o.c - minc, r: o.r - minr }));
  return { cells, cols: maxc - minc + 1, rows: maxr - minr + 1 };
}
function buildStack() {
  const { scene, group } = stk;
  scene.background = new THREE.Color(C.navy); lights(scene, 1.05); scene.add(group);
  stk.mat = new THREE.MeshStandardMaterial({ color: C.blue, roughness: 0.5 });
  stk.box = new THREE.BoxGeometry(0.92, 0.92, 1);
}
function setStackGrid(k) { // made again when the layout changes between one line and stacked lines
  const { group } = stk;
  if (stk.mesh) { group.remove(stk.mesh, stk.ghost); stk.mesh.dispose(); stk.ghost.material.map.dispose(); stk.ghost.material.dispose(); stk.ghost.geometry.dispose(); }
  const grid = stk.grid = rasterize(NUMBERS[2].value, k > 1 ? 7 : 8, k); stk.k = k;
  // built like a wall: column by column, left to right, bottom up
  grid.cells.sort((a, b) => (a.c - b.c) || (b.r - a.r));
  stk.mesh = new THREE.InstancedMesh(stk.box, stk.mat, grid.cells.length);
  stk.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); stk.mesh.frustumCulled = false; group.add(stk.mesh);
  // the empty number as an outline, behind the blocks, so the frame has its shape before a block lands
  const cpx = 48, c = document.createElement('canvas'); c.width = grid.cols * cpx; c.height = grid.rows * cpx;
  const g = c.getContext('2d'); g.strokeStyle = '#7d9bf0'; g.lineWidth = 3;
  grid.cells.forEach(o => g.strokeRect(o.c * cpx + 5, o.r * cpx + 5, cpx - 10, cpx - 10));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  stk.ghost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  stk.ghost.frustumCulled = false; group.add(stk.ghost);
}
function layoutStack() {
  const k = pickLines(NUMBERS[2].value);
  if (k !== stk.k) setStackGrid(k);
  const { cols, rows } = stk.grid;
  stk.u = Math.min(VW * (ASP < 1 ? 0.86 : 0.74) / cols, VH * (ASP < 1 ? 0.68 : 0.44) / rows);
  stk.depth = 1.6;
  // a single line on a phone would still be a band: build it big, track the wall, then pull back
  stk.zoom = ASP < 1 && k === 1 ? Math.max(1, Math.min(2.6, VH * 0.44 / (rows * stk.u))) : 1;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function updateStack(s) {
  const { cells, cols, rows } = stk.grid, u = stk.u, N = cells.length, drop = VH * 1.25;
  const [a, b] = TL.build, span = b - a;
  cells.forEach((o, k) => {
    const t0 = a + (k / N) * span * 0.78, f = rng(s, t0, t0 + span * 0.16);
    const tx = (o.c - (cols - 1) / 2) * u, ty = ((rows - 1) / 2 - o.r) * u;
    const fall = RM ? 0 : (1 - f * f) * drop; // gravity: slow off the top, fast into place, hard stop
    const z = f > 0 ? u : 1e-5;
    _p.set(tx, ty + fall, 0); _s.set(z, z, f > 0 ? u * stk.depth : 1e-5);
    _m.compose(_p, _q, _s); stk.mesh.setMatrixAt(k, _m);
  });
  stk.mesh.instanceMatrix.needsUpdate = true;
  stk.ghost.scale.set(cols * u, rows * u, 1); stk.ghost.position.z = -u * stk.depth * 0.5 - 0.01;
  const g = stk.group;
  const pull = eIO(rng(s, b - 0.45, b + 0.1)), Z = lerp(stk.zoom, 1, pull);
  const front = rng(s, a + span * 0.1, a + span * 0.94) * (cols - 1); // follows the blocks as they land
  g.scale.setScalar(Z);
  g.rotation.set(0.3 * RMK, lerp(0.5, -0.18, eIO(rng(s, TL.at[1], TL.pin))) * RMK, 0);
  g.position.set(stk.zoom > 1 ? -(front - (cols - 1) / 2) * u * Z * (1 - pull) : 0, VH * 0.05, 0);
  const lab = labs[2], lw = lab.offsetWidth;
  const sc = toScreen(g, stk.cam, 0, -(rows / 2) * u - u * 0.6, u * stk.depth * 0.5);
  lab.style.transform = `translate(${((W - lw) / 2).toFixed(1)}px,${Math.min(sc.y + 14, H - lab.offsetHeight - 36).toFixed(1)}px)`;
}

/* ---------- frame ---------- */
const chapters = [{ ch: odo, update: updateOdo }, { ch: tun, update: updateTunnel }, { ch: stk, update: updateStack }];
function stepWipes(now) { // returns true while a sheet is still moving
  let moving = false;
  for (const w of [wipe[1], wipe[2]]) {
    if (w.v === w.to) continue;
    const t = clamp((now - w.t0) / MOVE_MS);
    w.v = t >= 1 ? w.to : lerp(w.from, w.to, eMove(t)); moving = moving || t < 1;
  }
  return moving;
}
function draw(s) {
  const r1 = wipe[1].v, r2 = wipe[2].v;
  const e1 = Math.round(H * (1 - r1)), e2 = Math.round(H * (1 - r2));
  const bands = [[0, Math.min(e1, e2)], [e1, e2], [e2, H]];
  // each new sheet carries its chapter up with it (no sliding underneath); the covered one is pushed up 22%
  const shift = [-r1 * 0.22 * H, H * (1 - r1) - r2 * 0.22 * H, H * (1 - r2)];
  renderer.setScissorTest(true);
  chapters.forEach((c, i) => {
    const [top, bot] = bands[i], lay = layers[i];
    if (bot - top < 1) { lay.style.visibility = 'hidden'; return; }
    c.update(s);
    const cam = c.ch.cam; cam.setViewOffset(W, H, 0, -shift[i], W, H);
    renderer.setScissor(0, H - bot, W, bot - top);
    renderer.render(c.ch.scene, cam);
    lay.style.visibility = 'visible';
    lay.style.clipPath = `inset(${top}px 0 ${H - bot}px 0)`;
    const lab = labs[i]; if (lab) lab.style.translate = `0 ${shift[i].toFixed(1)}px`;
  });
}

let cur = null, prev = null, dirty = true, raf = 0, lastT = 0, ready = false;
const target = () => -SEC.getBoundingClientRect().top / H;
function frame(now) {
  raf = 0;
  const dt = Math.min(64, now - (lastT || now)) / 16.667; lastT = now;
  const t = target();
  if (cur === null || RM) cur = t;
  else { cur += (t - cur) * (1 - Math.pow(1 - 0.14, dt)); if (Math.abs(t - cur) < 0.0004) cur = t; }
  const moving = ready && stepWipes(now);
  if (ready && (cur !== prev || dirty || moving)) { draw(cur); prev = cur; dirty = moving; }
  window.__nmSettled = ready && cur === t && !moving;
  if (visible || moving) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && ready) { lastT = 0; raf = requestAnimationFrame(frame); } }

function resize() {
  sizeSection(); pin();
  if (!ready) return;
  renderer.setSize(W, H, false);
  VH = 2 * D * TAN; VW = VH * ASP;
  chapters.forEach(c => { c.ch.cam.aspect = ASP; c.ch.cam.updateProjectionMatrix(); });
  layoutOdo(); layoutTunnel(); layoutStack();
  dirty = true; kick();
}
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

async function boot() {
  const [{ TTFLoader }, { Font }, tg] = await Promise.all([
    import(ADDONS + 'loaders/TTFLoader.js'), import(ADDONS + 'loaders/FontLoader.js'), import(ADDONS + 'geometries/TextGeometry.js'),
  ]);
  TextGeometry = tg.TextGeometry;
  const [json] = await Promise.all([
    new TTFLoader().loadAsync(FONT_URL),
    document.fonts.load('400 100px "Bowlby One"'), document.fonts.load('500 20px "Bricolage Grotesque"'),
  ]);
  FONT = new Font(json);
  const zero = glyph('0', { height: 0.01, bevelEnabled: false });
  CAPH = zero.userData.maxY - zero.userData.minY; MID = (zero.userData.maxY + zero.userData.minY) / 2;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  buildOdo(); buildTunnel(); buildStack();
  ready = true; resize();
  // a wipe already decided before boot (page reloaded mid-section) lands straight away
  wipe.forEach(w => { if (w) w.v = w.from = w.to; });
  // upload every chapter once, so the first wipe never stalls
  chapters.forEach(c => { c.ch.scene.traverse(o => { o.frustumCulled = false; }); renderer.compile(c.ch.scene, c.ch.cam); });
  dirty = true; kick();
  window.__nmReady = true;
}
