/* fluid-g.js: the Lusion-style pointer fluid for the work section.
   One fixed canvas over the page (pointer-events:none). A small stable-fluids sim (velocity at 1/4 of CSS pixels,
   dye at 1/2) runs only while the pointer moves and for ~1.4 s after; at rest there is no frame work at all.
   - Trail: the edges of the dye are drawn as a thin "oil-slick" ribbon whose film colour runs
     paper -> pink -> paper -> sky -> paper (pink and sky never mix, so no violet anywhere).
   - Lens: every attached img/video is redrawn as a plane exactly over its box, sampled through the same velocity
     field (UV push plus a slight colour split along the flow), with a short blur-to-sharp focus when the pointer
     enters it. The DOM media stays underneath; it is hidden only while its GL copy is drawn (the fluid is awake).

   import { createFluid } from './fluid-g.js';
   const fluid = createFluid({ root: document.body });
   fluid.attach(img, { clip: img.parentElement });        // clip: the element whose box and radius crop the media
   fluid.attach(video, { kind: 'video' });
   fluid.detach(img); fluid.setEnabled(false); fluid.destroy();

   Options: root (default body), zIndex (default 30), kpPause: 'ignore' | 'pause' | 'inverse' (how to treat the
   page's kp:pause event: its paused:true means #work covers the screen, so the work section wants 'ignore'),
   renderer (share an existing THREE.WebGLRenderer: no canvas, no planes, sim only; sample fluid.velocity /
   fluid.dye with fluid.GLSL in your own shader). */
import * as THREE from 'three';

const PAPER = [0.945, 0.949, 0.941], PINK = [1.0, 0.435, 0.682], SKY = [0.49, 0.608, 0.941], NAVY = [0.059, 0.145, 0.271];
const VEL_DIV = 4, DYE_DIV = 2;           // CSS px per sim cell
const VEL_DECAY = 3.0, DYE_DECAY = 5.2;   // per second (exp)
const SLEEP_MS = 1400;                    // after the last pointer move
const LENS_K = 0.014;                     // seconds of flow the photo is pushed by
const FOCUS_S = 0.5, FOCUS_PX = 7;
const FADE_S = 0.16;                     // GL copy crossfade over the DOM media       // hover focus: duration, start blur radius (CSS px)

const noop = () => {};
const STUB = { attach: noop, detach: noop, setEnabled: noop, destroy: noop, get active() { return false; }, stats: { tick: 0 } };

/* ---------------- shaders ---------------- */
const VQ = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const F_SPLAT = `
uniform sampler2D uT; uniform vec2 uA; uniform vec2 uB; uniform float uAsp; uniform float uR; uniform vec3 uV; varying vec2 vUv;
void main(){
  vec2 p = vUv * vec2(uAsp, 1.0), a = uA * vec2(uAsp, 1.0), b = uB * vec2(uAsp, 1.0), ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
  vec2 d = p - a - ab * h;
  float g = exp(-dot(d, d) / (uR * uR));
  vec4 base = texture2D(uT, vUv);
  gl_FragColor = vec4(base.xyz + uV * g, 1.0);
}`;
const F_ADVECT = `
uniform sampler2D uVel; uniform sampler2D uSrc; uniform vec2 uVelTx; uniform float uDt; uniform float uKeep; uniform float uCap; varying vec2 vUv;
void main(){
  vec2 c = vUv - uDt * texture2D(uVel, vUv).xy * uVelTx;
  vec4 s = texture2D(uSrc, c) * uKeep;
  gl_FragColor = vec4(min(s.xyz, vec3(uCap)), 1.0);
}`;
const F_CURL = `
uniform sampler2D uVel; uniform vec2 uTx; varying vec2 vUv;
void main(){
  float l = texture2D(uVel, vUv - vec2(uTx.x, 0.0)).y, r = texture2D(uVel, vUv + vec2(uTx.x, 0.0)).y;
  float b = texture2D(uVel, vUv - vec2(0.0, uTx.y)).x, t = texture2D(uVel, vUv + vec2(0.0, uTx.y)).x;
  gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`;
const F_VORT = `
uniform sampler2D uVel; uniform sampler2D uCurl; uniform vec2 uTx; uniform float uK; uniform float uDt; varying vec2 vUv;
void main(){
  float l = texture2D(uCurl, vUv - vec2(uTx.x, 0.0)).x, r = texture2D(uCurl, vUv + vec2(uTx.x, 0.0)).x;
  float b = texture2D(uCurl, vUv - vec2(0.0, uTx.y)).x, t = texture2D(uCurl, vUv + vec2(0.0, uTx.y)).x;
  float c = texture2D(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  f /= length(f) + 1e-4; f *= uK * c; f.y *= -1.0;
  vec2 v = texture2D(uVel, vUv).xy + f * uDt;
  gl_FragColor = vec4(clamp(v, -2000.0, 2000.0), 0.0, 1.0);
}`;
const F_DIV = `
uniform sampler2D uVel; uniform vec2 uTx; varying vec2 vUv;
void main(){
  float l = texture2D(uVel, vUv - vec2(uTx.x, 0.0)).x, r = texture2D(uVel, vUv + vec2(uTx.x, 0.0)).x;
  float b = texture2D(uVel, vUv - vec2(0.0, uTx.y)).y, t = texture2D(uVel, vUv + vec2(0.0, uTx.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`;
const F_PRES = `
uniform sampler2D uP; uniform sampler2D uDiv; uniform vec2 uTx; varying vec2 vUv;
void main(){
  float l = texture2D(uP, vUv - vec2(uTx.x, 0.0)).x, r = texture2D(uP, vUv + vec2(uTx.x, 0.0)).x;
  float b = texture2D(uP, vUv - vec2(0.0, uTx.y)).x, t = texture2D(uP, vUv + vec2(0.0, uTx.y)).x;
  gl_FragColor = vec4((l + r + b + t - texture2D(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`;
const F_GRAD = `
uniform sampler2D uP; uniform sampler2D uVel; uniform vec2 uTx; varying vec2 vUv;
void main(){
  float l = texture2D(uP, vUv - vec2(uTx.x, 0.0)).x, r = texture2D(uP, vUv + vec2(uTx.x, 0.0)).x;
  float b = texture2D(uP, vUv - vec2(0.0, uTx.y)).x, t = texture2D(uP, vUv + vec2(0.0, uTx.y)).x;
  gl_FragColor = vec4(texture2D(uVel, vUv).xy - 0.5 * vec2(r - l, t - b), 0.0, 1.0);
}`;
/* the film colour: paper -> pink -> paper -> sky -> paper; pink and sky are never interpolated with each other */
const GLSL_FILM = `
vec3 kpFilm(float t){
  t = fract(t);
  vec3 P = vec3(${PAPER}), K = vec3(${PINK}), S = vec3(${SKY});
  if (t < 0.25) return mix(P, K, smoothstep(0.0, 0.25, t));
  if (t < 0.5)  return mix(K, P, smoothstep(0.25, 0.5, t));
  if (t < 0.75) return mix(P, S, smoothstep(0.5, 0.75, t));
  return mix(S, P, smoothstep(0.75, 1.0, t));
}`;
const F_TRAIL = `
uniform sampler2D uDye; uniform vec2 uTx; uniform float uTime; varying vec2 vUv;
${GLSL_FILM}
void main(){
  float d = texture2D(uDye, vUv).x;
  if (d < 0.012) discard;
  float l = texture2D(uDye, vUv - vec2(uTx.x, 0.0)).x, r = texture2D(uDye, vUv + vec2(uTx.x, 0.0)).x;
  float b = texture2D(uDye, vUv - vec2(0.0, uTx.y)).x, t = texture2D(uDye, vUv + vec2(0.0, uTx.y)).x;
  vec2 g = vec2(r - l, t - b);
  float edge = clamp(length(g) * 5.0, 0.0, 1.0);
  float ph = d * 1.35 + atan(g.y, g.x) * 0.08 + uTime * 0.04;
  vec3 col = mix(kpFilm(ph), vec3(${PAPER}), 0.18);
  col = mix(col, vec3(${NAVY}), 0.10 * edge * edge);          // a faint dark hairline in the steepest part of the edge
  float a = (edge * 0.55 + smoothstep(0.05, 0.5, d) * 0.06) * smoothstep(0.012, 0.09, d);
  a = clamp(a, 0.0, 0.6);
  gl_FragColor = vec4(col * a, a);
}`;
const V_PLANE = `
varying vec2 vS;   // CSS px, y down
uniform vec4 uClip; uniform vec2 uRes;
void main(){
  vS = uClip.xy + uv * vec2(1.0, -1.0) * uClip.zw + vec2(0.0, uClip.w);
  vec2 ndc = vec2(vS.x / uRes.x * 2.0 - 1.0, 1.0 - vS.y / uRes.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;
const F_PLANE = `
uniform sampler2D uTex; uniform sampler2D uVel; uniform vec2 uRes; uniform vec4 uClip; uniform vec4 uRect; uniform vec2 uImg;
uniform vec2 uPos; uniform float uRad; uniform float uBlur; uniform float uA; uniform float uK; uniform float uCell; uniform float uSplit;
varying vec2 vS;
float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec2 texUv(vec2 p){
  float s = max(uRect.z / uImg.x, uRect.w / uImg.y);
  vec2 dr = uImg * s, off = (uRect.zw - dr) * uPos;
  vec2 t = (p - uRect.xy - off) / dr;
  return vec2(t.x, 1.0 - t.y);
}
vec3 tap(vec2 p){
  if (uBlur < 0.05) return texture2D(uTex, texUv(p)).rgb;
  vec3 c = texture2D(uTex, texUv(p)).rgb * 0.2;
  float r = uBlur;
  c += texture2D(uTex, texUv(p + vec2( r, 0.0))).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2(-r, 0.0))).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2(0.0,  r))).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2(0.0, -r))).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2( r,  r) * 0.7071)).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2(-r,  r) * 0.7071)).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2( r, -r) * 0.7071)).rgb * 0.1;
  c += texture2D(uTex, texUv(p + vec2(-r, -r) * 0.7071)).rgb * 0.1;
  return c;
}
void main(){
  float d = box(vS - (uClip.xy + uClip.zw * 0.5), uClip.zw * 0.5, uRad);
  float a = (1.0 - smoothstep(-0.5, 0.5, d)) * uA;
  if (a <= 0.001) discard;
  vec2 v = texture2D(uVel, vec2(vS.x / uRes.x, 1.0 - vS.y / uRes.y)).xy;
  vec2 o = vec2(v.x, -v.y) * uCell * uK;                     // CSS px the content is carried by the flow
  float m = length(o);
  o *= min(1.0, 40.0 / max(m, 1e-4));                        // never more than 40 px
  vec2 p = vS - o;
  vec2 sp = o / max(m, 1e-4) * min(m * uSplit, 1.0);         // the colour split runs along the flow, 1 CSS px at most
  vec3 c = vec3(tap(p - sp).r, tap(p).g, tap(p + sp).b);
  gl_FragColor = vec4(c * a, a);
}`;
/* for a shared renderer: sample with kpFluidOffset(gl_FragCoord-derived screen uv) */
const GLSL_SAMPLE = `
uniform sampler2D uKpVel; uniform float uKpCell;
vec2 kpFluidPx(vec2 screenUv, float k){ vec2 v = texture2D(uKpVel, screenUv).xy; return vec2(v.x, -v.y) * uKpCell * k; }
${GLSL_FILM}`;

/* ---------------- module ---------------- */
export function createFluid(opts = {}) {
  const mm = (q) => (window.matchMedia ? matchMedia(q).matches : false);
  if (mm('(prefers-reduced-motion: reduce)') || mm('(pointer: coarse)') || !mm('(hover: hover)')) return STUB;
  const root = opts.root || document.body;
  const shared = opts.renderer || null;
  let renderer = shared, canvas = null;
  if (!renderer) {
    canvas = document.createElement('canvas');
    canvas.className = 'kp-fluid';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${opts.zIndex ?? 30};contain:strict`;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return STUB; }
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
  }
  const ext = renderer.extensions;
  if (!(ext.has('EXT_color_buffer_half_float') || ext.has('EXT_color_buffer_float'))) { if (!shared) renderer.dispose(); return STUB; }
  if (canvas) root.appendChild(canvas);
  if (!document.getElementById('kp-fluid-css')) {
    const st = document.createElement('style'); st.id = 'kp-fluid-css';
    st.textContent = '.kpf-hide{opacity:0!important}';
    document.head.appendChild(st);
  }

  const DPR = () => Math.min(1.5, window.devicePixelRatio || 1);
  let W = 1, H = 1;
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(quadGeo); quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad);
  const mat = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VQ, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending, ...extra });
  const V2 = () => new THREE.Vector2();
  const M = {
    splat: mat(F_SPLAT, { uT: { value: null }, uA: { value: V2() }, uB: { value: V2() }, uAsp: { value: 1 }, uR: { value: 0.02 }, uV: { value: new THREE.Vector3() } }),
    advect: mat(F_ADVECT, { uVel: { value: null }, uSrc: { value: null }, uVelTx: { value: V2() }, uDt: { value: 0.016 }, uKeep: { value: 1 }, uCap: { value: 1e4 } }),
    curl: mat(F_CURL, { uVel: { value: null }, uTx: { value: V2() } }),
    vort: mat(F_VORT, { uVel: { value: null }, uCurl: { value: null }, uTx: { value: V2() }, uK: { value: 8 }, uDt: { value: 0.016 } }),
    div: mat(F_DIV, { uVel: { value: null }, uTx: { value: V2() } }),
    pres: mat(F_PRES, { uP: { value: null }, uDiv: { value: null }, uTx: { value: V2() } }),
    grad: mat(F_GRAD, { uP: { value: null }, uVel: { value: null }, uTx: { value: V2() } }),
    trail: mat(F_TRAIL, { uDye: { value: null }, uTx: { value: V2() }, uTime: { value: 0 } }, { blending: THREE.NormalBlending, transparent: true, premultipliedAlpha: true }),
  };
  const rtOpts = (lin) => ({ type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, magFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, depthBuffer: false, stencilBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping });
  const pair = (lin) => { const p = { a: new THREE.WebGLRenderTarget(1, 1, rtOpts(lin)), b: new THREE.WebGLRenderTarget(1, 1, rtOpts(lin)) }; p.swap = () => { const t = p.a; p.a = p.b; p.b = t; }; return p; };
  const vel = pair(true), dye = pair(true), prs = pair(false);
  const divRT = new THREE.WebGLRenderTarget(1, 1, rtOpts(false)), curlRT = new THREE.WebGLRenderTarget(1, 1, rtOpts(false));
  let vw = 1, vh = 1, dw = 1, dh = 1;

  const prevTarget = { rt: null, color: new THREE.Color(), alpha: 0, auto: true };
  function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, cam); }
  function clearRT(rt) { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false); }
  function clearAll() { [vel.a, vel.b, dye.a, dye.b, prs.a, prs.b, divRT, curlRT].forEach(clearRT); }

  function resize() {
    W = document.documentElement.clientWidth || innerWidth; H = innerHeight;
    vw = Math.max(8, Math.round(W / VEL_DIV)); vh = Math.max(8, Math.round(H / VEL_DIV));
    dw = Math.max(8, Math.round(W / DYE_DIV)); dh = Math.max(8, Math.round(H / DYE_DIV));
    [vel.a, vel.b, prs.a, prs.b, divRT, curlRT].forEach(r => r.setSize(vw, vh));
    [dye.a, dye.b].forEach(r => r.setSize(dw, dh));
    if (canvas) { renderer.setPixelRatio(DPR()); renderer.setSize(W, H, false); }
    saveState(); clearAll(); restoreState();
    planeRes.set(W, H);
  }
  function saveState() { prevTarget.rt = renderer.getRenderTarget(); renderer.getClearColor(prevTarget.color); prevTarget.alpha = renderer.getClearAlpha(); prevTarget.auto = renderer.autoClear; renderer.autoClear = false; }
  function restoreState() { renderer.setRenderTarget(prevTarget.rt); renderer.setClearColor(prevTarget.color, prevTarget.alpha); renderer.autoClear = prevTarget.auto; }

  /* ---------- pointer ---------- */
  const ptr = { x: -1, y: -1, has: false, last: 0, ts: 0 };
  const segs = [];                                 // pointer segments since the last tick
  function onMove(e) {
    if (e.pointerType === 'touch') return;
    const x = e.clientX, y = e.clientY;
    const gap = e.timeStamp - ptr.ts;
    if (ptr.has && gap < 100) {                                  // a longer gap is a re-entry, not a stroke
      const len = Math.hypot(x - ptr.x, y - ptr.y);
      segs.push([ptr.x, ptr.y, x, y, Math.min(3200, len / Math.max(gap, 4) * 1000)]);   // speed from event times, CSS px/s
    }
    ptr.x = x; ptr.y = y; ptr.ts = e.timeStamp; ptr.has = true; ptr.last = performance.now();
    wake();
  }
  function onLeave() { ptr.has = false; }
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  /* ---------- planes ---------- */
  const planeScene = new THREE.Scene();
  const planeRes = new THREE.Vector2(1, 1);
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const recs = new Map();                          // el -> rec
  const uploads = [];
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach(e => { const r = recs.get(e.target) || [...recs.values()].find(r => r.clipEl === e.target); if (r) r.on = e.isIntersecting; }), { rootMargin: '10% 0px' }) : null;

  function readStyle(rec) {
    const cs = getComputedStyle(rec.el), ccs = rec.clipEl === rec.el ? cs : getComputedStyle(rec.clipEl);
    rec.u.uRad.value = parseFloat(ccs.borderTopLeftRadius) || parseFloat(cs.borderTopLeftRadius) || 0;
    const op = (cs.objectPosition || '50% 50%').split(/\s+/).map(s => s.endsWith('%') ? parseFloat(s) / 100 : 0.5);
    rec.u.uPos.value.set(op[0] ?? 0.5, op[1] ?? 0.5);
    rec.fit = cs.objectFit || 'fill';
  }
  function attach(el, o = {}) {
    if (!el || recs.has(el) || shared) return;
    const kind = o.kind || (el.tagName === 'VIDEO' ? 'video' : 'img');
    const u = {
      uTex: { value: null }, uVel: { value: vel.a.texture }, uRes: { value: planeRes }, uClip: { value: new THREE.Vector4() }, uRect: { value: new THREE.Vector4() },
      uImg: { value: new THREE.Vector2(16, 9) }, uPos: { value: new THREE.Vector2(0.5, 0.5) }, uRad: { value: 0 }, uBlur: { value: 0 }, uA: { value: 0 },
      uK: { value: o.strength ?? LENS_K }, uCell: { value: VEL_DIV }, uSplit: { value: o.split ?? 0.22 },
    };
    const m = new THREE.ShaderMaterial({ vertexShader: V_PLANE, fragmentShader: F_PLANE, uniforms: u, transparent: true, premultipliedAlpha: true, blending: THREE.NormalBlending, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(planeGeo, m); mesh.frustumCulled = false; mesh.visible = false; planeScene.add(mesh);
    const rec = { el, clipEl: o.clip || el, kind, u, mesh, ready: false, on: !io, hov: false, focus: 1, hidden: false, tex: null, a: 0 };
    recs.set(el, rec);
    readStyle(rec);
    if (io) io.observe(rec.clipEl);
    const ready = (tex, w, h) => uploads.push(() => { renderer.initTexture(tex); rec.tex = tex; u.uTex.value = tex; u.uImg.value.set(w, h); rec.ready = true; });
    if (kind === 'video') {
      const v = el.tagName === 'VIDEO' ? el : Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, src: o.src });
      const go = () => { const t = new THREE.VideoTexture(v); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; ready(t, v.videoWidth || 16, v.videoHeight || 9); };
      if (v.readyState >= 2) go(); else v.addEventListener('loadeddata', go, { once: true });
    } else {
      const src = o.src || el.currentSrc || el.src;
      const im = new Image(); im.decoding = 'async';
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => {
        const t = new THREE.Texture(im); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; t.needsUpdate = true;
        ready(t, im.naturalWidth, im.naturalHeight);
      });
      im.src = src;
    }
  }
  function show(rec, on) { if (rec.hidden === on) return; rec.hidden = on; rec.el.classList.toggle('kpf-hide', on); }
  function detach(el) {
    const rec = recs.get(el); if (!rec) return;
    show(rec, false); if (io) io.unobserve(rec.clipEl);
    planeScene.remove(rec.mesh); rec.mesh.material.dispose(); if (rec.tex) rec.tex.dispose();
    recs.delete(el);
  }

  /* ---------- loop ---------- */
  const ticker = window.KP && window.KP.gsap && window.KP.gsap.ticker;
  let awake = false, enabled = true, paused = false, raf = 0, lastT = 0, t0 = performance.now();
  const stats = { tick: 0, frames: 0 };
  function wake() {
    if (awake || !enabled || paused || document.hidden) return;
    awake = true; lastT = performance.now();
    if (ticker) ticker.add(tickG); else raf = requestAnimationFrame(tickR);
  }
  function sleep() {
    if (!awake) return;
    awake = false;
    if (ticker) ticker.remove(tickG); else cancelAnimationFrame(raf);
    for (const r of recs.values()) { show(r, false); r.mesh.visible = false; r.focus = 1; r.a = 0; }   // hov is kept: a pause inside a card does not replay the focus
    saveState(); clearAll();
    if (canvas) { renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 0); renderer.clear(); }
    restoreState();
    segs.length = 0;
  }
  function tickG() { frame(performance.now()); }
  function tickR(t) { if (!awake) return; frame(t); if (awake) raf = requestAnimationFrame(tickR); }

  function splat(target, ax, ay, bx, by, r, v) {
    const s = M.splat.uniforms;
    s.uT.value = target.a.texture; s.uA.value.set(ax / W, 1 - ay / H); s.uB.value.set(bx / W, 1 - by / H);
    s.uAsp.value = W / H; s.uR.value = r / H; s.uV.value.set(v[0], v[1], v[2]);
    pass(M.splat, target.b); target.swap();
  }

  function frame(now) {
    const c0 = performance.now();
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - lastT) / 1000)); lastT = now;
    if (uploads.length) uploads.shift()();
    const idle = now - ptr.last;
    let anim = false;
    saveState();
    /* 1. pointer segments become velocity and dye */
    for (const [ax, ay, bx, by, sp] of segs) {
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      if (len < 0.5) continue;
      const k = sp / len;
      splat(vel, ax, ay, bx, by, 26, [dx * k / VEL_DIV, -dy * k / VEL_DIV, 0]);
      splat(dye, ax, ay, bx, by, 9, [Math.min(0.9, 0.18 + sp / 2600), 0, 0]);
    }
    segs.length = 0;
    /* 2. the sim */
    const vtx = M.curl.uniforms.uTx.value.set(1 / vw, 1 / vh);
    M.curl.uniforms.uVel.value = vel.a.texture; pass(M.curl, curlRT);
    const vo = M.vort.uniforms; vo.uVel.value = vel.a.texture; vo.uCurl.value = curlRT.texture; vo.uTx.value.copy(vtx); vo.uDt.value = dt;
    pass(M.vort, vel.b); vel.swap();
    M.div.uniforms.uVel.value = vel.a.texture; M.div.uniforms.uTx.value.copy(vtx); pass(M.div, divRT);
    const pr = M.pres.uniforms; pr.uDiv.value = divRT.texture; pr.uTx.value.copy(vtx);
    for (let i = 0; i < 8; i++) { pr.uP.value = prs.a.texture; pass(M.pres, prs.b); prs.swap(); }
    const gr = M.grad.uniforms; gr.uP.value = prs.a.texture; gr.uVel.value = vel.a.texture; gr.uTx.value.copy(vtx); pass(M.grad, vel.b); vel.swap();
    const ad = M.advect.uniforms; ad.uDt.value = dt; ad.uVelTx.value.set(1 / vw, 1 / vh);
    ad.uVel.value = vel.a.texture; ad.uSrc.value = vel.a.texture; ad.uKeep.value = Math.exp(-VEL_DECAY * dt); ad.uCap.value = 1e4; pass(M.advect, vel.b); vel.swap();
    ad.uVel.value = vel.a.texture; ad.uSrc.value = dye.a.texture; ad.uKeep.value = Math.exp(-DYE_DECAY * dt); ad.uCap.value = 1.0; pass(M.advect, dye.b); dye.swap();
    /* 3. draw: planes, then the trail over them */
    if (canvas) {
      renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 0); renderer.clear();
      const px = ptr.has ? ptr.x : -1e4, py = ptr.has ? ptr.y : -1e4;
      for (const r of recs.values()) {
        const vis = r.ready && r.on && !r.el.closest('[hidden]');
        if (!vis) { r.mesh.visible = false; show(r, false); r.hov = false; r.a = 0; continue; }
        const b = r.el.getBoundingClientRect(), cb = r.clipEl === r.el ? b : r.clipEl.getBoundingClientRect();
        if (cb.bottom < 0 || cb.top > H || cb.right < 0 || cb.left > W || cb.width < 2) { r.mesh.visible = false; show(r, false); r.a = 0; continue; }
        const over = px >= cb.left && px <= cb.right && py >= cb.top && py <= cb.bottom;
        if (over && !r.hov) r.focus = 0;
        r.hov = over;
        if (r.focus < 1) { r.focus = Math.min(1, r.focus + dt / FOCUS_S); anim = true; }
        const e = 1 - Math.pow(1 - r.focus, 3);
        const u = r.u;
        u.uBlur.value = (1 - e) * FOCUS_PX;
        u.uClip.value.set(cb.left, cb.top, cb.width, cb.height);
        u.uRect.value.set(b.left, b.top, b.width, b.height);
        if (r.fit === 'fill' && r.kind === 'img') u.uImg.value.set(b.width, b.height);     // stretched like the DOM
        u.uVel.value = vel.a.texture;
        /* crossfade over the DOM copy: in on wake, out just before sleep, so the swap never pops */
        const at = idle > SLEEP_MS - FADE_S * 1000 && r.focus >= 1 ? 0 : 1;
        if (r.a !== at) { r.a = at ? Math.min(1, r.a + dt / FADE_S) : Math.max(0, r.a - dt / FADE_S); anim = anim || at === 0 && r.a > 0; }
        u.uA.value = r.a;
        r.mesh.visible = r.a > 0;
        show(r, r.a >= 1);
      }
      renderer.render(planeScene, cam);
      const tr = M.trail.uniforms; tr.uDye.value = dye.a.texture; tr.uTx.value.set(1 / dw, 1 / dh); tr.uTime.value = (now - t0) / 1000;
      quad.material = M.trail; renderer.setRenderTarget(null); renderer.render(qScene, cam);
    }
    restoreState();
    if (window.__kpfFinish) renderer.getContext().finish();   // debug only: makes stats.tick include GPU time
    stats.tick = performance.now() - c0; stats.frames++;
    if (idle > SLEEP_MS && !anim) sleep();
  }

  /* ---------- lifecycle ---------- */
  const onResize = () => { resize(); if (!awake) sleep(); };
  addEventListener('resize', onResize);
  const onVis = () => { if (document.hidden) sleep(); };
  document.addEventListener('visibilitychange', onVis);
  const mode = opts.kpPause || 'ignore';
  const onKP = (e) => {
    if (mode === 'ignore') return;
    const p = !!(e.detail && e.detail.paused);
    paused = mode === 'pause' ? p : !p;
    if (paused) sleep();
  };
  addEventListener('kp:pause', onKP);
  resize();

  return {
    attach, detach,
    setEnabled(on) { enabled = !!on; if (!enabled) sleep(); },
    destroy() {
      sleep();
      for (const el of [...recs.keys()]) detach(el);
      removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave);
      removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); removeEventListener('kp:pause', onKP);
      if (io) io.disconnect();
      [vel.a, vel.b, dye.a, dye.b, prs.a, prs.b, divRT, curlRT].forEach(r => r.dispose());
      Object.values(M).forEach(m => m.dispose()); quadGeo.dispose(); planeGeo.dispose();
      if (canvas) { renderer.dispose(); canvas.remove(); }
    },
    get active() { return awake; },
    get velocity() { return vel.a.texture; },
    get dye() { return dye.a.texture; },
    GLSL: GLSL_SAMPLE, cell: VEL_DIV, stats,
  };
}
