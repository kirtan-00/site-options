/* numbers chapter: three big numbers, pinned while the section is under the viewport.
   1 odometer (light blue), 2 tunnel (light pink), 3 stack (navy). All three.js, one canvas.
   Everything is scrubbed by scroll, both ways. The chapters hand over through their own shapes, not a sliding sheet:
   1 to 2: the view zooms into the counter of the centre drum's digit. The counter is a hole cut through the drum (a depth mask),
           and the pink tunnel is behind it, so the hole grows until the tunnel mouth fills the frame.
   2 to 3: the camera keeps pushing into the paper end wall while a square, one cube cell of the stack, opens from the
           counter of the middle digit and grows into the frame's shape (the tunnel's ink frames), flooding it navy.
           Its edge is a sky line, the same line as the stack's empty cells.
   Reduced motion: a crossfade. After the last chapter #work covers the whole stage, pushed up 22%. */
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
/* the two hand-offs, in screens of scroll: odometer holds from 0.68, tunnel holds from 2.95 */
const HO = [[0.9, 1.25], [3.07, 3.42]];
let H1 = 0, H2 = 0; // hand-off progress, set per frame

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rng = (p, a, b) => clamp((p - a) / (b - a));
const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = t => { const c = 0.7, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const eOut = t => 1 - Math.pow(1 - t, 3);

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
.nm-lab{position:absolute;left:0;top:0;margin:0;transform-origin:0 0;font:500 clamp(19px,1.9vw,30px)/1.15 "Bricolage Grotesque",system-ui,sans-serif;white-space:nowrap}
.nm-sq{position:absolute;left:0;top:0;border:3px solid #7d9bf0;box-sizing:border-box;pointer-events:none;visibility:hidden}
.nm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
`;
document.head.appendChild(css);
SEC.innerHTML = `<div class="nm-stage"><canvas class="nm-canvas" aria-hidden="true"></canvas>
<div class="nm-layer" data-i="0"><p class="nm-lab" style="color:#0c0d0f" aria-hidden="true"></p></div>
<div class="nm-layer" data-i="1"></div>
<div class="nm-layer" data-i="2"><p class="nm-lab" style="color:#f1f2f0" aria-hidden="true"></p></div>
<div class="nm-sq" aria-hidden="true"></div>
<ul class="nm-sr"></ul></div>`;
const stage = SEC.querySelector('.nm-stage'), canvas = SEC.querySelector('.nm-canvas');
const layers = [...SEC.querySelectorAll('.nm-layer')];
const sqEl = SEC.querySelector('.nm-sq');
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
function pin() {
  const top = SEC.getBoundingClientRect().top, max = SEC.offsetHeight - H;
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
/* A real counter. Ten digits printed round each cobalt drum, bent onto its curve. Navy rims between the drums, end plates and an axle.
   The count runs as a real odometer does: the units drum turns, and a drum only moves while every drum to its right passes 9 to 0.
   It spins up with the sheet, slows, ticks the last counts with a short detent, and every drum rolls over onto the number together.
   All of it is a pure function of scroll, so it scrubs both ways and rests exactly. */
const ODO = { spin: [-0.85, 0.16], tick: [0.16, 0.68], ticks: 3, pitch: 1.36 };
const odo = { scene: new THREE.Scene(), cam: makeCam(), group: new THREE.Group(), drums: [] };
function bendGlyph(src, R, maxLen) { // tessellate, then wrap y round the drum: flat type becomes print on a cylinder
  const pos = src.attributes.position.array, nor = src.attributes.normal.array;
  const P = [], N = [], groups = [], L2 = maxLen * maxLen;
  const vtx = i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const mid = (a, b) => { const m = a.map((v, i) => (v + b[i]) / 2), l = Math.hypot(m[3], m[4], m[5]) || 1; m[3] /= l; m[4] /= l; m[5] /= l; return m; };
  const tri = (a, b, c, n) => {
    const ab = d2(a, b), bc = d2(b, c), ca = d2(c, a), mx = Math.max(ab, bc, ca);
    if (mx <= L2 || n > 14) { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); N.push(v[3], v[4], v[5]); } return; }
    if (mx === ab) { const m = mid(a, b); tri(a, m, c, n + 1); tri(m, b, c, n + 1); }
    else if (mx === bc) { const m = mid(b, c); tri(a, b, m, n + 1); tri(a, m, c, n + 1); }
    else { const m = mid(c, a); tri(a, b, m, n + 1); tri(m, b, c, n + 1); }
  };
  const gs = src.groups.length ? src.groups : [{ start: 0, count: pos.length / 3, materialIndex: 0 }];
  let minZ = Infinity; for (let i = 2; i < pos.length; i += 3) minZ = Math.min(minZ, pos[i]);
  for (const g of gs) {
    const start = P.length / 3;
    for (let i = g.start; i < g.start + g.count; i += 3) tri(vtx(i), vtx(i + 1), vtx(i + 2), 0);
    groups.push({ start, count: P.length / 3 - start, materialIndex: g.materialIndex });
  }
  for (let i = 0; i < P.length; i += 3) {
    const a = P[i + 1] / R, r = R + P[i + 2] - minZ - 0.006, ca = Math.cos(a), sa = Math.sin(a), ny = N[i + 1], nz = N[i + 2];
    P[i + 1] = r * sa; P[i + 2] = r * ca;
    N[i + 1] = ny * ca + nz * sa; N[i + 2] = -ny * sa + nz * ca;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  groups.forEach(o => g.addGroup(o.start, o.count, o.materialIndex));
  return g;
}
function buildOdo() {
  const { scene, group } = odo;
  scene.background = new THREE.Color(C.blue); scene.add(group);
  // its own lights: a soft key from high left, so each drum turns from lit paper and cobalt at the top into shade underneath
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223066, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-4, 6.5, 9); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(6, -3, 5); scene.add(fill);
  const face = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.4, emissive: C.paper, emissiveIntensity: 0.2 });
  const edge = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.6, emissive: C.paper, emissiveIntensity: 0.08 });
  const body = new THREE.MeshStandardMaterial({ color: C.cobalt, roughness: 0.44 });
  const rim = new THREE.MeshStandardMaterial({ color: C.navy, roughness: 0.32, metalness: 0.25 });
  const opt = { height: 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 1, curveSegments: 14 };
  const G = ch => { const g = glyph(ch, opt); if (!g.userData.c) { g.translate(0, -MID, 0); g.userData.c = 1; } return g; };
  let dw = 0; for (let d = 0; d < 10; d++) dw = Math.max(dw, G(String(d)).userData.w);
  const chars = [...NUMBERS[0].value], cellW = dw * 1.2, ringW = 0.07, gap = ringW - 0.006; // rims sit flush on the drum ends, no daylight between
  const R = odo.R = 10 * CAPH * ODO.pitch / (Math.PI * 2), STEP = odo.STEP = Math.PI * 2 / 10, RR = odo.RR = R + 0.075;
  const digitGeo = Array.from({ length: 10 }, (_, k) => bendGlyph(G(String(k)), R, 0.07));
  const widths = chars.map(ch => /\d/.test(ch) ? cellW : G(ch).userData.w + 0.12);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  const cyl = new THREE.CylinderGeometry(R - 0.004, R - 0.004, cellW, 128, 1, true); cyl.rotateZ(Math.PI / 2);
  const ringG = new THREE.CylinderGeometry(RR, RR, ringW, 128, 1, false); ringG.rotateZ(Math.PI / 2);
  const ring = x => { const m = new THREE.Mesh(ringG, rim); m.position.x = x; group.add(m); };
  // a drum's two sides are closed by the rims, so its own cylinder can stay open
  let x = -total / 2; const nd = chars.filter(c => /\d/.test(c)).length; let j = 0;
  ring(x - ringW / 2);
  chars.forEach((ch, i) => {
    const cx = x + widths[i] / 2; x += widths[i];
    if (/\d/.test(ch)) {
      const drum = new THREE.Group(); drum.position.x = cx; drum.add(new THREE.Mesh(cyl, body));
      for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(digitGeo[k], [face, edge]); m.rotation.x = k * STEP; drum.add(m); }
      drum.userData = { target: +ch, place: nd - 1 - j }; j++;
      group.add(drum); odo.drums.push(drum);
    } else { const m = new THREE.Mesh(bendGlyph(G(ch), R, 0.07), [face, edge]); m.position.x = cx; group.add(m); }
    ring(i < chars.length - 1 ? x + gap / 2 : x + ringW / 2);
    x += gap;
  });
  // the axle, showing past the outer rims
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.2, R * 0.2, total + ringW * 2 + 0.2, 48), rim); axle.rotation.z = Math.PI / 2; group.add(axle);
  odo.width = total + ringW * 2 + 0.2; odo.nd = nd;
  const digits = NUMBERS[0].value.replace(/\D/g, '');
  odo.mod = 10 ** nd; odo.end = (parseInt(digits || '0', 10) || 0) + odo.mod; // a full roll over onto the number
  buildPortal(R);
}
/* the hand-off hole: the counter of the digit on the drum nearest the centre, as a flat shape bent onto the drum just under
   the digit's face. It writes depth only, so whatever the drum would draw behind it is cut away and the tunnel shows through.
   A digit with no counter (1 2 3 5 7) gives its own outline instead, set just proud of the face. */
function holeOf(ch) {
  const shapes = FONT.generateShapes(ch, 1); let best = null, area = 0, outer = null, oa = 0, mnx = Infinity, mxx = -Infinity;
  shapes.forEach(sh => {
    const o = sh.getPoints(24); o.forEach(p => { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); });
    const a = Math.abs(THREE.ShapeUtils.area(o)); if (a > oa) { oa = a; outer = o; }
    sh.holes.forEach(hp => { const pts = hp.getPoints(24), ar = Math.abs(THREE.ShapeUtils.area(pts)); if (ar > area) { area = ar; best = pts; } });
  });
  return { pts: best || outer, front: !best, dx: -(mnx + mxx) / 2 };
}
function buildPortal(R) {
  const order = odo.drums.map((d, i) => i).sort((a, b) => Math.abs(a - (odo.drums.length - 1) / 2) - Math.abs(b - (odo.drums.length - 1) / 2));
  let pick = order[0], h = holeOf(String(odo.drums[pick].userData.target));
  for (const i of order) { const t = holeOf(String(odo.drums[i].userData.target)); if (!t.front) { pick = i; h = t; break; } }
  const drum = odo.drums[pick], pts = h.pts.map(p => new THREE.Vector2(p.x + h.dx, p.y - MID));
  const flat = new THREE.ShapeGeometry(new THREE.Shape(pts)).toNonIndexed();
  const g = bendGlyph(flat, R, 0.03), rr = R + (h.front ? 0.045 : 0.005), k = rr / (R - 0.006), P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) { P[i + 1] *= k; P[i + 2] *= k; }
  // keep the flat coordinates, so the hole can open from its own centre (an iris the shape of the counter)
  const FX = new Float32Array(P.length / 3), FY = new Float32Array(P.length / 3);
  for (let i = 0, j = 0; i < P.length; i += 3, j++) { FX[j] = P[i]; FY[j] = Math.atan2(P[i + 1], P[i + 2]) * R; }
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = drum.userData.target * odo.STEP; m.layers.set(1); drum.add(m);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
  odo.mask = m; odo.mR = rr; odo.hb = { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; odo.FX = FX; odo.FY = FY; odo.irisK = 1;
  // stands in for the light blue background while the hole is open, since the scene clear would wipe the tunnel
  odo.back = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: C.blue }));
  odo.back.position.z = -60; odo.back.visible = false; odo.scene.add(odo.back);
}
/* zoom the lens (not the camera, so nothing clips) into the counter until it holds the whole frame */
function odoZoom(cam) {
  cam.clearViewOffset(); odo.Z = 1;
  if (!(H1 > 0) || RM) return;
  const m = odo.mask, hb = odo.hb, R = odo.R;
  const pt = (x, y) => { const a = y / R; return toScreen(m, cam, x, odo.mR * Math.sin(a), odo.mR * Math.cos(a)); };
  const c = pt(hb.cx, hb.cy), l = pt(hb.x0, hb.cy), r = pt(hb.x1, hb.cy), t = pt(hb.cx, hb.y1), b = pt(hb.cx, hb.y0);
  const ax = Math.abs(r.x - l.x) / 2, ay = Math.abs(b.y - t.y) / 2;
  const Zend = 1.12 * Math.hypot(W / 2 / ax, H / 2 / ay), Z = Math.pow(Zend, eIO(H1));
  const k = eIO(rng(H1, 0, 0.7)), sx = lerp(c.x, W / 2, k), sy = lerp(c.y, H / 2, k);
  cam.setViewOffset(W, H, c.x - sx / Z, c.y - sy / Z, W / Z, H / Z);
  odo.Z = Z;
  // the counter opens from its centre over the first part, so the tunnel never pops in
  const ik = Math.max(0.001, eOut(rng(H1, 0, 0.22)));
  if (ik !== odo.irisK) {
    odo.irisK = ik; const P = m.geometry.attributes.position.array, { FX, FY } = odo;
    for (let j = 0, i = 0; j < FX.length; j++, i += 3) {
      const a = (hb.cy + (FY[j] - hb.cy) * ik) / R;
      P[i] = hb.cx + (FX[j] - hb.cx) * ik; P[i + 1] = odo.mR * Math.sin(a); P[i + 2] = odo.mR * Math.cos(a);
    }
    m.geometry.attributes.position.needsUpdate = true;
  }
}
function layoutOdo() {
  // the whole drum stays inside the frame: digits roll over its top and bottom, never off the frame edge
  odo.s = Math.min(VW * (ASP < 1 ? 0.86 : 0.6) / odo.width, VH * (ASP < 1 ? 0.6 : 0.84) / (2 * odo.RR));
}
/* the count, as each drum's position in digits. Place 0 is the units drum. */
const tick = t => { const c = 1.25, d = c + 1; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const eQIO = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function odoCount(s, place) {
  const n = ODO.ticks, end = odo.end, p10 = 10 ** place;
  const nines = b => b % p10 === p10 - 1; // every drum to the right shows 9: this one is being carried
  if (RM || s >= ODO.tick[1]) return end / p10;
  if (s < ODO.tick[0]) { // spin up with the sheet, then slow to a stop a few counts short
    const v = lerp(end - 44, end - n, eQIO(rng(s, ODO.spin[0], ODO.spin[1]))), b = Math.floor(v), f = v - b;
    return Math.floor(b / p10) + (place === 0 ? f : nines(b) ? eIO(rng(f, 0.5, 1)) : 0);
  }
  // the last counts tick over one at a time; the final roll over is a little longer, carries every drum, right to left
  const w = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1.5 : 1)), sum = w.reduce((a, b) => a + b, 0);
  let t = rng(s, ODO.tick[0], ODO.tick[1]) * sum, i = 0; while (i < n - 1 && t > w[i]) { t -= w[i]; i++; }
  const l = t / w[i], b = end - n + i, last = i === n - 1;
  const f = tick(rng(l, last ? place * 0.07 : 0, last ? 0.62 + place * 0.07 : 0.6));
  return Math.floor(b / p10) + (place === 0 || nines(b) ? f : 0);
}
function updateOdo(s) {
  const { group, drums, R, STEP } = odo, sc = odo.s;
  drums.forEach(d => { d.rotation.x = -odoCount(s, d.userData.place) * STEP; });
  group.scale.setScalar(sc);
  group.rotation.set(lerp(0.2, -0.03, eIO(rng(s, -1, 0.66))) * RMK, lerp(-0.14, 0.05, eIO(rng(s, -1, 0.72))) * RMK, 0); // dead still well before the tunnel
  const pxw = VH / H; // world units per css pixel on the plane the drum faces sit in
  // the label sits right of the number on its baseline when there is room, so number and label centre as one block
  const lab = labs[0], lw = lab.offsetWidth, lh = lab.offsetHeight, digH = CAPH * sc / pxw, gapL = Math.max(24, digH * 0.2);
  const side = ASP >= 1 && odo.width * sc / pxw + gapL + lw + 120 < W;
  const shiftX = side ? -(gapL + lw) / 2 * pxw : 0;
  // before the pin the stage rides up with the page: the drums start high on the sheet and settle to the centre as it lands
  const mechH = 2 * odo.RR * sc / pxw, room = (H - mechH) / 2 - H * 0.04;
  const lift = room > 0 ? room * (1 - eIO(rng(s, -1, 0))) * RMK : 0;
  group.position.set(shiftX, lift * pxw, -R * sc);
  odoZoom(odo.cam);
  const Z = odo.Z; lab.style.opacity = RM ? 1 - H1 : 1 - rng(H1, 0, 0.3);
  const a = -CAPH / 2 / R, base = toScreen(group, odo.cam, odo.width / 2 - 0.1, R * Math.sin(a), R * Math.cos(a));
  if (side) lab.style.transform = `translate(${(base.x + gapL * Z).toFixed(1)}px,${(base.y - lh * 0.86 * Z).toFixed(1)}px) scale(${Z.toFixed(3)})`;
  else {
    const l = toScreen(group, odo.cam, -odo.width / 2 + 0.1, 0, R), b = toScreen(group, odo.cam, 0, -odo.RR, 0);
    lab.style.transform = `translate(${Math.max(16, l.x).toFixed(1)}px,${Math.min(b.y + 20, H - lh - 36).toFixed(1)}px)`;
  }
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
  tun.stop = L - d; tun.d = d;
  tun.scene.fog.near = d + 3; tun.scene.fog.far = d + 46; // the far wall is never tinted at rest
}
function updateTunnel(s) {
  const f = eIO(rng(s, TL.fly[0], TL.fly[1]));
  // into the second hand-off the camera keeps going, towards the paper end wall
  tun.group.position.z = lerp(0, tun.stop, f) + (RM ? 0 : Math.pow(H2, 1.6) * tun.d * 0.55);
  // the square opens from the counter of the middle digit on the end wall
  if (H2 > 0 && H2 < 1) tun.sc = toScreen(tun.group, tun.cam, 0, tun.big.position.y + MID * tun.big.scale.y, -tun.L + 0.13);
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
  const zz = H2 > 0 && H2 < 1 && !RM ? lerp(1.22, 1, eIO(H2)) : 1; // the stack settles back as the square opens
  if (stk.cam.zoom !== zz) { stk.cam.zoom = zz; stk.cam.updateProjectionMatrix(); }
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
  if (H2 > 0 && H2 < 1 && !RM) { // the square: opens from the end wall's middle counter until it holds the frame
    // a cell-sized square that grows into the frame's own shape, the shape of the tunnel's ink frames, centring as it goes,
    // so it reaches all four edges together and never reads as a band
    const c = tun.sc, s0 = Math.min(W, H) * 0.06, e = H2 < 0.12 ? 0 : eIO((H2 - 0.12) / 0.88), g0 = H2 < 0.12 ? eOut(H2 / 0.12) : 1;
    const w = lerp(s0 * g0, W + 10, e), h = lerp(s0 * g0, H + 10, e), cx = lerp(c.x, W / 2, e), cy = lerp(c.y, H / 2, e);
    stk.sq = { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  const lab = labs[2], lw = lab.offsetWidth;
  lab.style.opacity = RM ? H2 : rng(H2, 0.82, 1);
  const sc = toScreen(g, stk.cam, 0, -(rows / 2) * u - u * 0.6, u * stk.depth * 0.5);
  lab.style.transform = `translate(${((W - lw) / 2).toFixed(1)}px,${Math.min(sc.y + 14, H - lab.offsetHeight - 36).toFixed(1)}px)`;
}

/* ---------- frame ---------- */
const chapters = [{ ch: odo, update: updateOdo }, { ch: tun, update: updateTunnel }, { ch: stk, update: updateStack }];
let fadeRT = null; const fadeScene = new THREE.Scene(), fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
let fadeQuad = null;
function showLayers(a, b) { layers.forEach((l, i) => { l.style.visibility = i === a || i === b ? 'visible' : 'hidden'; }); }
function plain(i, s) {
  chapters[i].update(s);
  renderer.setScissorTest(false); renderer.autoClear = true;
  renderer.render(chapters[i].ch.scene, chapters[i].ch.cam);
}
function fade(i, j, s, h) { // reduced motion: the outgoing chapter fades off the incoming one
  if (!fadeRT) {
    const v = renderer.getDrawingBufferSize(new THREE.Vector2());
    fadeRT = new THREE.WebGLRenderTarget(v.x, v.y, { type: THREE.HalfFloatType, samples: 4 });
    fadeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: fadeRT.texture, transparent: true, depthTest: false, depthWrite: false }));
    fadeQuad.position.z = -1; fadeScene.add(fadeQuad);
  }
  chapters[i].update(s); chapters[j].update(s);
  renderer.setScissorTest(false); renderer.autoClear = true;
  renderer.setRenderTarget(fadeRT); renderer.render(chapters[i].ch.scene, chapters[i].ch.cam);
  renderer.setRenderTarget(null); renderer.render(chapters[j].ch.scene, chapters[j].ch.cam);
  fadeQuad.material.opacity = 1 - eIO(h);
  renderer.autoClear = false; renderer.render(fadeScene, fadeCam); renderer.autoClear = true;
}
function hand1(s) { // the tunnel first, then the drum with its counter cut out of the depth buffer
  updateTunnel(s); updateOdo(s);
  renderer.setScissorTest(false); renderer.autoClear = true;
  renderer.render(tun.scene, tun.cam);
  const sc = odo.scene, cam = odo.cam, bg = sc.background;
  renderer.autoClear = false; renderer.clearDepth(); sc.background = null;
  cam.layers.set(1); renderer.render(sc, cam);
  cam.layers.set(0); odo.back.visible = true; renderer.render(sc, cam);
  odo.back.visible = false; sc.background = bg; renderer.autoClear = true;
}
function hand2(s) { // the tunnel, then the stack inside the opening square
  updateTunnel(s); updateStack(s);
  renderer.setScissorTest(false); renderer.autoClear = true;
  renderer.render(tun.scene, tun.cam);
  const q = stk.sq, x0 = Math.max(0, Math.floor(q.x)), y0 = Math.max(0, Math.floor(q.y));
  const x1 = Math.min(W, Math.ceil(q.x + q.w)), y1 = Math.min(H, Math.ceil(q.y + q.h));
  if (x1 > x0 && y1 > y0) {
    renderer.setScissorTest(true); renderer.setScissor(x0, H - y1, x1 - x0, y1 - y0);
    renderer.render(stk.scene, stk.cam); renderer.setScissorTest(false);
  }
  const b = 1.5;
  sqEl.style.width = (q.w + 2 * b).toFixed(1) + 'px'; sqEl.style.height = (q.h + 2 * b).toFixed(1) + 'px';
  sqEl.style.transform = `translate(${(q.x - b).toFixed(1)}px,${(q.y - b).toFixed(1)}px)`;
  sqEl.style.visibility = 'visible';
}
function draw(s) {
  H1 = rng(s, HO[0][0], HO[0][1]); H2 = rng(s, HO[1][0], HO[1][1]);
  const in1 = H1 > 0 && H1 < 1, in2 = H2 > 0 && H2 < 1;
  if (!in2 || RM) sqEl.style.visibility = 'hidden';
  if (in1) { showLayers(0); RM ? fade(0, 1, s, H1) : hand1(s); }
  else if (in2) { showLayers(2); RM ? fade(1, 2, s, H2) : hand2(s); }
  else { const i = H1 <= 0 ? 0 : H2 <= 0 ? 1 : 2; showLayers(i); plain(i, s); }
}

let cur = null, prev = null, dirty = true, raf = 0, lastT = 0, ready = false;
const target = () => -SEC.getBoundingClientRect().top / H;
function frame(now) {
  raf = 0;
  const dt = Math.min(64, now - (lastT || now)) / 16.667; lastT = now;
  const t = target();
  if (cur === null || RM) cur = t;
  else { cur += (t - cur) * (1 - Math.pow(1 - 0.14, dt)); if (Math.abs(t - cur) < 0.0004) cur = t; }
  if (ready && (cur !== prev || dirty)) { draw(cur); prev = cur; dirty = false; }
  window.__nmSettled = ready && cur === t;
  if (visible) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && ready) { lastT = 0; raf = requestAnimationFrame(frame); } }

function resize() {
  sizeSection(); pin();
  if (!ready) return;
  renderer.setSize(W, H, false);
  if (fadeRT) { const v = renderer.getDrawingBufferSize(new THREE.Vector2()); fadeRT.setSize(v.x, v.y); }
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
  // upload every chapter once, so the first wipe never stalls
  chapters.forEach(c => { c.ch.scene.traverse(o => { o.frustumCulled = false; }); renderer.compile(c.ch.scene, c.ch.cam); });
  dirty = true; kick();
  window.__nmReady = true;
}
