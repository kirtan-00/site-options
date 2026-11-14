/* numbers chapter: three big numbers, pinned while the section is under the viewport.
   1 odometer (light blue, three.js, scrubbed by scroll), 2 two-plate print (light pink), 3 cut strips into a slot (sky blue).
   Each chapter arrives from below and covers the one before, which is pushed up 22%. Then #work covers the whole stage the same way. */
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
const COL = { ink: '#0c0d0f', paper: '#f1f2f0', blue: '#c9d8f7', pink: '#f2a7b6', sky: '#7d9bf0', cobalt: '#1c3bb0', navy: '#0f2545' };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RMK = RM ? 0 : 1;

/* Scroll plan, in screens. 0 is the moment the section pins (it enters from -1).
   The odometer rolls with the scroll; the other two chapters are triggered at a line and then play on their own clock. */
const TL = { roll: [-0.8, 0.7], at: [1.1, 2.5], pin: 3.6 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rng = (p, a, b) => clamp((p - a) / (b - a));
const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = t => { const c = 0.7, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/* ---------- DOM and CSS ---------- */
const SEC = document.getElementById('numbers');
const css = document.createElement('style');
css.textContent = `
#numbers{position:relative;background:transparent;color:${COL.ink};
  --nm-arrive:cubic-bezier(.2,.8,.2,1);--nm-move:cubic-bezier(.7,0,.2,1);--nm-leave:cubic-bezier(.6,0,.85,.3)}
.nm-stage{position:absolute;left:0;top:0;width:100%;height:100vh;height:100svh;overflow:hidden;background:${COL.blue}}
.nm-stage.nm-fix,.nm-stage.nm-post{position:fixed}
.nm-stage.nm-post{z-index:-1}
.nm-stage.nm-gone{visibility:hidden}
.nm-ch{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;transform:translateY(100%);transition:transform 760ms var(--nm-move);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(18px,3.2vh,34px)}
.nm-ch.nm-on{transform:none}
.nm-ch.nm-up{transform:translateY(-22%)}
.nm-ch[data-i="0"]{background:${COL.blue};z-index:1;transform:none}
.nm-ch[data-i="0"].nm-up{transform:translateY(-22%)}
.nm-ch[data-i="1"]{background:${COL.pink};z-index:2}
.nm-ch[data-i="2"]{background:${COL.sky};z-index:3}
.nm-canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.nm-lab{margin:0;font:500 clamp(19px,1.9vw,30px)/1.15 "Bricolage Grotesque",system-ui,sans-serif;white-space:nowrap;color:${COL.ink}}
.nm-ch[data-i="0"] .nm-lab{position:absolute;left:0;top:0;opacity:1;animation:none!important}
.nm-fig{position:relative;font-family:"Bowlby One","Bricolage Grotesque",sans-serif;font-weight:400;line-height:.9;text-align:center;color:${COL.ink};
  overflow:hidden;padding:.05em .06em .08em}
.nm-line{display:block;white-space:nowrap}
.nm-ink,.nm-reg,.nm-strip{display:block}
.nm-reg,.nm-strip{position:absolute;left:0;top:0;width:100%;height:100%;padding:inherit;box-sizing:border-box}
/* two-plate print: the ink plate rises into place, then the cobalt plate prints over it, out of register, and steps home at 12 frames a second */
.nm-print .nm-ink{transform:translateY(110%)}
.nm-print .nm-reg{color:${COL.cobalt};mix-blend-mode:multiply;opacity:0}
.nm-go .nm-print .nm-ink{animation:nm-rise 480ms var(--nm-arrive) 300ms both}
.nm-go .nm-print .nm-reg{animation:nm-reg 840ms steps(1,end) 900ms both}
@keyframes nm-rise{from{transform:translateY(110%)}to{transform:none}}
@keyframes nm-reg{
  0%{opacity:0;transform:translateY(26px)}
  10%{opacity:1;transform:translateY(26px)}
  20%{transform:translateY(17px)}
  30%{transform:translateY(11px)}
  40%{transform:translateY(7px)}
  50%,70%{transform:translateY(4px)}
  80%{transform:translateY(2px)}
  90%,100%{opacity:1;transform:translateY(1px)}}
/* cut strips: the number is sliced into vertical strips that rise out of a slot one after another; a hairline of each cut stays */
.nm-cut .nm-ink{visibility:hidden}
.nm-cut .nm-strip{transform:translateY(110%)}
.nm-go .nm-cut .nm-strip{animation:nm-rise 560ms var(--nm-arrive) both}
.nm-slot{width:100%;height:2px;background:${COL.ink};margin-top:-2px}
.nm-figbox{display:flex;flex-direction:column;align-items:stretch}
.nm-ch .nm-lab{opacity:0;transform:translateY(14px)}
.nm-go .nm-lab{animation:nm-cap 480ms var(--nm-arrive) both}
.nm-ch[data-i="1"].nm-go .nm-lab{animation-delay:1500ms}
.nm-ch[data-i="2"].nm-go .nm-lab{animation-delay:1000ms}
@keyframes nm-cap{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.nm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
@media (prefers-reduced-motion: reduce){
  .nm-ch{transition:none}
  .nm-go .nm-ink,.nm-go .nm-reg,.nm-go .nm-strip,.nm-go .nm-lab{animation-duration:1ms!important;animation-delay:0s!important}
}`;
document.head.appendChild(css);

SEC.innerHTML = `<div class="nm-stage">
<div class="nm-ch nm-on nm-go" data-i="0"><canvas class="nm-canvas" aria-hidden="true"></canvas><p class="nm-lab" aria-hidden="true"></p></div>
<div class="nm-ch" data-i="1" aria-hidden="true"><div class="nm-figbox"><div class="nm-fig nm-print"></div></div><p class="nm-lab"></p></div>
<div class="nm-ch" data-i="2" aria-hidden="true"><div class="nm-figbox"><div class="nm-fig nm-cut"></div><div class="nm-slot"></div></div><p class="nm-lab"></p></div>
<ul class="nm-sr"></ul></div>`;
const stage = SEC.querySelector('.nm-stage'), canvas = SEC.querySelector('.nm-canvas');
const chs = [...SEC.querySelectorAll('.nm-ch')];
chs.forEach((c, i) => { c.querySelector('.nm-lab').textContent = NUMBERS[i].label; });
SEC.querySelector('.nm-sr').innerHTML = NUMBERS.map(n => `<li>${n.value} ${n.label}</li>`).join('');
const odoLab = chs[0].querySelector('.nm-lab');

let W = 1, H = 1, ASP = 1;
function sizeSection() {
  W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight; ASP = W / H;
  SEC.style.height = Math.round((TL.pin + 1) * H) + 'px';
}
sizeSection();

/* ---------- the big DOM figures (chapters 2 and 3) ---------- */
/* On a phone a three-character number is set as stacked lines, one equal group per line, so it fills the frame instead of
   sitting in a thin band. Uneven splits are never used, so a number never reads as two different numbers. */
const meas = document.createElement('canvas').getContext('2d');
const splitLines = (v, k) => { const ch = [...v], n = ch.length / k; return Array.from({ length: k }, (_, i) => ch.slice(i * n, (i + 1) * n).join('')); };
function emWidth(t) { meas.font = '400 100px "Bowlby One"'; return meas.measureText(t).width / 100; }
function fitFigure(value) {
  const n = [...value].length, LH = 0.9, availW = Math.min(W - 40, W * 0.86), availH = H * (ASP < 1 ? 0.6 : 0.52);
  let best = { k: 1, fs: 0 };
  for (let k = 1; k <= Math.min(3, n); k++) {
    if (n % k) continue;
    const w = Math.max(...splitLines(value, k).map(emWidth)) + 0.12, h = k * LH + 0.13;
    const fs = Math.min(availW / w, availH / h);
    if (fs > best.fs * 1.08) best = { k, fs };
  }
  return { lines: splitLines(value, best.k), fs: Math.floor(best.fs) };
}
const STRIPS = () => (ASP < 1 ? 6 : 9);
function layoutFigures() {
  [1, 2].forEach(i => {
    const fig = chs[i].querySelector('.nm-fig'), { lines, fs } = fitFigure(NUMBERS[i].value);
    const txt = lines.map(l => `<span class="nm-line">${l}</span>`).join('');
    fig.style.fontSize = fs + 'px';
    if (i === 1) fig.innerHTML = `<span class="nm-ink">${txt}</span><span class="nm-reg" aria-hidden="true">${txt}</span>`;
    else {
      const N = STRIPS(); let h = `<span class="nm-ink">${txt}</span>`;
      for (let s = 0; s < N; s++) {
        const L = (s / N) * 100, R = 100 - ((s + 1) / N) * 100;
        h += `<span class="nm-strip" aria-hidden="true" style="clip-path:inset(0 calc(${R.toFixed(3)}% + 1px) 0 ${L.toFixed(3)}%);animation-delay:${200 + s * 55}ms">${txt}</span>`;
      }
      fig.innerHTML = h;
    }
  });
}

/* ---------- pinning and the chapter switch ---------- */
/* Sticky would be the natural tool, but after the landing body becomes its own scroll container and sticky never engages.
   So the stage goes fixed while the section is under it. Past the end it stays fixed, drops behind #work and is pushed up 22%,
   so #work covers it the way each chapter covers the last. #work needs an opaque background for that to read. */
let pinMode = '', active = 0;
const resetTimers = [];
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
  const a = s >= TL.at[1] ? 2 : s >= TL.at[0] ? 1 : 0;
  if (a !== active) setActive(a);
}
function setActive(a) {
  active = a;
  chs.forEach((c, i) => {
    c.classList.toggle('nm-on', i === a); c.classList.toggle('nm-up', i < a);
    c.setAttribute('aria-hidden', String(i !== a));
    clearTimeout(resetTimers[i]);
    if (i === a) c.classList.add('nm-go');
    // a chapter that slid back down below the fold prints again next time; one that was covered from above keeps its print
    else if (i > a) resetTimers[i] = setTimeout(() => c.classList.remove('nm-go'), 800);
  });
  kick();
}
addEventListener('scroll', () => { pin(); kick(); }, { passive: true });
pin();

/* ---------- boot the odometer only when needed ---------- */
let booted = false, visible = false;
function wake() { if (!booted) { booted = true; boot().catch(e => console.error('[numbers]', e)); } }
if (window.KP && window.KP.final) wake();
addEventListener('kp:final', wake, { once: true });
new IntersectionObserver(([en]) => {
  visible = en.isIntersecting && en.intersectionRatio > 0;
  if (visible) { wake(); kick(); }
}, { threshold: [0, 0.01] }).observe(SEC);

/* ---------- 1. odometer ---------- */
let renderer, FONT, TextGeometry;
const FOV = 30, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), D = 12;
let VH = 2 * D * TAN, VW = VH;
const odo = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(FOV, 1, 0.1, 100), group: new THREE.Group(), drums: [] };
odo.cam.position.set(0, 0, D);
let MID = 0.5, CAPH = 1;
const glyphCache = new Map();
function glyph(ch, opt) {
  const key = ch + JSON.stringify(opt);
  if (glyphCache.has(key)) return glyphCache.get(key);
  const g = new TextGeometry(ch, Object.assign({ font: FONT, size: 1, curveSegments: 10 }, opt));
  g.computeBoundingBox(); const bb = g.boundingBox;
  g.userData = { w: bb.max.x - bb.min.x, minY: bb.min.y, maxY: bb.max.y };
  g.translate(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2);
  glyphCache.set(key, g); return g;
}
const _v = new THREE.Vector3();
function toScreen(obj, x, y, z) { obj.updateMatrixWorld(true); _v.set(x, y, z); obj.localToWorld(_v); _v.project(odo.cam); return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }
function buildOdo() {
  const { scene, group } = odo;
  scene.background = new THREE.Color(COL.blue); scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 7, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(5, -2, 6); scene.add(fill);
  const face = new THREE.MeshStandardMaterial({ color: COL.paper, roughness: 0.42 });
  const side = new THREE.MeshStandardMaterial({ color: COL.navy, roughness: 0.5 });
  const body = new THREE.MeshStandardMaterial({ color: COL.cobalt, roughness: 0.5 });
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
  // the whole drum stays inside the frame: digits roll over its top and bottom, they are never cut by the frame edge
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
  const lw = odoLab.offsetWidth, lh = odoLab.offsetHeight, right = toScreen(group, odo.width / 2, -CAPH / 2, R);
  if (ASP >= 1 && W - right.x > lw + 72) odoLab.style.transform = `translate(${(right.x + 36).toFixed(1)}px,${(right.y - lh * 0.95).toFixed(1)}px)`;
  else { const b = toScreen(group, 0, -R, 0); odoLab.style.transform = `translate(${((W - lw) / 2).toFixed(1)}px,${Math.min(b.y + 22, H - lh - 36).toFixed(1)}px)`; }
}

/* ---------- frame loop (odometer only) ---------- */
let cur = null, prev = null, dirty = true, raf = 0, lastT = 0, ready = false;
const target = () => -SEC.getBoundingClientRect().top / H;
function frame(now) {
  raf = 0;
  const dt = Math.min(64, now - (lastT || now)) / 16.667; lastT = now;
  const t = target();
  if (cur === null || RM) cur = t;
  else { cur += (t - cur) * (1 - Math.pow(1 - 0.14, dt)); if (Math.abs(t - cur) < 0.0004) cur = t; }
  // the odometer is drawn only while it can be seen: before it is covered, and while the next chapter is sliding over it
  const seen = active === 0 || (active === 1 && cur < TL.at[0] + 0.6);
  if (ready && seen && (cur !== prev || dirty)) { updateOdo(cur); renderer.render(odo.scene, odo.cam); prev = cur; dirty = false; }
  window.__nmSettled = ready && cur === t;
  if (visible) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && ready) { lastT = 0; raf = requestAnimationFrame(frame); } }

function resize() {
  sizeSection(); pin(); layoutFigures();
  if (!ready) return;
  renderer.setSize(W, H, false);
  VH = 2 * D * TAN; VW = VH * ASP;
  odo.cam.aspect = ASP; odo.cam.updateProjectionMatrix();
  layoutOdo(); dirty = true; kick();
}
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
document.fonts.load('400 100px "Bowlby One"').then(layoutFigures);
layoutFigures();

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
  buildOdo();
  ready = true; resize();
  renderer.compile(odo.scene, odo.cam);
  dirty = true; kick();
  window.__nmReady = true;
}
