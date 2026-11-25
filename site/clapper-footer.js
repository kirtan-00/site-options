/* The footer IS the clapper. The whole footer is the white slate: a thick striped bar runs along its top edge and
   the board fills everything below it. The stick, hinged at the left, swings up out of the footer and over the
   section above, like a real clapper arm. It opens as the footer scrolls into view. Press space (or click the
   footer) and the stick slams shut, the clack plays on impact, and the count on the board goes up by one.
   three.js carries the motion and a quiet sense of depth; the look stays flat and graphic.
   The count is BASE plus the claps made on this device. A shared count needs a small counter on a server
   (the wall's Worker in wall-backend/ can do it); until then, set BASE by hand. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const BASE = 4281;
const KEY = 'kp-claps';
const HINT_CLAPS = 3;   // the "press space" hint goes away after this many claps on this device
const EMAIL = '';       // fallback only: the address normally comes from CONTACT.email in index.html
const F = document.getElementById('signwall');

if (F) {
  const PINK = '#f2a7b6', BOARD = '#f1f1ee';
  const MARK = '#141518', STRIPE_B = '#0b0b0c', STRIPE_W = '#f6f6f2';
  const FAM = '"Schibsted Grotesk",system-ui,sans-serif';
  const SENTENCE = 'people have clapped this clapper.';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  let email = EMAIL;
  try { if (typeof CONTACT !== 'undefined' && CONTACT && CONTACT.email) email = String(CONTACT.email).trim(); } catch (e) {}

  /* sound lives in its own file; the footer still works without it.
     unlock() runs once, on the first pointerdown or keydown anywhere on the page. */
  let snd = null, wantUnlock = false;
  const doUnlock = () => { try { snd && snd.unlock && snd.unlock(); } catch (e) {} };
  import('./clap-sound.js').then((m) => { snd = m; if (wantUnlock) doUnlock(); }).catch(() => {});
  const firstGesture = () => {
    if (wantUnlock) return; wantUnlock = true; doUnlock();
    removeEventListener('pointerdown', firstGesture); removeEventListener('keydown', firstGesture);
  };
  addEventListener('pointerdown', firstGesture, { passive: true });
  addEventListener('keydown', firstGesture);
  const fireClack = () => { try { snd && snd.clack && snd.clack(1); } catch (e) {} };

  /* the footer sits above the work list (z 0 to 2) so the arm can rise over it,
     and below the project pages (z 9) and the fixed Contact button (z 10).
     Its own background is the board white, so nothing dark shows before WebGL paints. */
  const css = `
/* on a phone the open arm would rise over the last cards of the work list (it hid a card's caption), so the work
   section keeps a strip of its own background, as tall as the swing, for the arm to rise into. --cf-swing is set in measure() */
#work{padding-bottom:var(--cf-swing,0px)}
/* the shadow is a copy of the board pushed down 60vh: when iOS bounces past the end of the page, board white shows
   under the footer instead of a band of the page's blue. A shadow adds no scroll height */
#signwall{position:relative;z-index:3;background:${BOARD};box-shadow:0 60vh 0 0 ${BOARD};color:${MARK};padding:0;height:80vh;overflow:visible;font-family:${FAM}}
.cf-stage{position:absolute;left:0;right:0;bottom:0;pointer-events:none}
.cf-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.cf-slate{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer;border:0;padding:0;margin:0;background:none;color:inherit;outline:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.cf-slate:focus,.cf-slate:focus-visible{outline:none}
.cf-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:${PINK};opacity:0;transition:opacity .2s;pointer-events:none}
.cf-slate:focus-visible .cf-dot{opacity:1}
.cf-mail{position:absolute;display:block;color:transparent;text-decoration:none;border-radius:3px;z-index:2;outline:none}
.cf-mail::before{content:"";position:absolute;inset:-13px -6px}
.cf-mail:focus-visible{box-shadow:0 0 0 2px ${PINK}}
.cf-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let mine = 0; try { mine = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) {}
  const fmt = (n) => n.toLocaleString('en-IN');
  const count = () => BASE + mine;
  let hintOn = mine < HINT_CLAPS;
  const HINT = touch ? 'Tap to clap' : 'Press space to clap';
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  F.innerHTML = `
    <p class="cf-sr"><span id="cf-sr-n">${fmt(count())}</span> ${SENTENCE}</p>
    <div class="cf-stage" aria-hidden="true"></div>
    <button class="cf-slate" id="cf-s" type="button" aria-label="Clap the clapper"><span class="cf-dot"></span></button>
    ${email ? `<a class="cf-mail" id="cf-mail" href="mailto:${esc(email)}">${esc(email)}</a>` : ''}`;
  const btn = document.getElementById('cf-s'), srN = document.getElementById('cf-sr-n');
  const stage = F.querySelector('.cf-stage'), dot = F.querySelector('.cf-dot'), mailEl = document.getElementById('cf-mail');

  /* ---------- layout, in CSS px of the footer (y = 0 is the footer's top edge) ---------- */
  const clamp = (a, v, b) => Math.max(a, Math.min(b, v));
  function frameLayout(Wc, vh) {
    const mobile = Wc < 700;
    const sh = clamp(60, Wc * 0.09, 104);               // stick and bar height
    const gap = 0;                                       // the shut arm lies flush on the bar
    const H = Math.round(mobile ? clamp(520, vh * 0.78, 760) : clamp(560, vh * 0.72, 900));
    const open = mobile ? 0.35 : 0.3;                    // the arm may run off the top of the screen, like clapper.in
    const inset = Math.round(clamp(4, sh * 0.085, 9) + 5);   // the pivot: the arm's bottom left corner, on the bar's top edge, just far enough in that the pin stays on screen
    const W = Wc, SL = Wc - inset;                       // bar and board are full bleed; the arm starts at the pivot
    const plate = { w: inset + Math.round(sh * 0.4), h: Math.round(sh * 0.86) };   // the hinge plate over the joint
    const yBar = 0, yHinge = -gap, yBody = sh, BH = H - sh;
    const rise = SL * Math.sin(open) + sh * Math.cos(open);
    const swing = Math.ceil(rise + gap + 12);            // how far the canvas reaches above the footer
    return { mobile, W, SL, inset, plate, sh, gap, BH, H, open, yBar, yHinge, yBody, swing };
  }

  /* env(safe-area-inset-bottom) in px, read from a hidden probe (0 where there is none) */
  let safeProbe = null;
  const safeBottom = () => {
    if (!safeProbe) { safeProbe = document.createElement('div'); safeProbe.setAttribute('aria-hidden', 'true'); safeProbe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom)'; document.body.appendChild(safeProbe); }
    return Math.min(60, parseFloat(getComputedStyle(safeProbe).paddingBottom) || 0);
  };
  const font = (w, px) => `${w} ${px}px ${FAM}`;
  function wrap(c, text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  const tracked = (c, px) => { if ('letterSpacing' in c) c.letterSpacing = `${-0.04 * px}px`; };
  const untracked = (c) => { if ('letterSpacing' in c) c.letterSpacing = '0px'; };

  /* the board's type, in board px (fw x fh): count and sentence as the hero, the hint under it,
     a hairline and the email at the bottom */
  function faceLayout(fw, fh, mobile, c) {
    const L = { mobile };
    L.m = mobile ? 24 : clamp(40, fw * 0.045, 88);
    /* on a phone the address is 16px and sits clear of the home-indicator strip (the safe area plus a thumb's margin),
       so a tap on it is not read as the swipe home. Desktop is unchanged */
    L.mailFont = 16;
    L.mailBase = mobile ? fh - (L.m + 16 + safeBottom()) : fh - L.m;
    L.rule = L.mailBase - L.mailFont * 2.2;
    L.hintFont = mobile ? 15 : clamp(15, fw * 0.011, 18);
    const t = fmt(count());
    if (!mobile) {
      /* the count starts the sentence: "4,281 people have clapped this clapper." on one baseline, sized so the
         line spans the board. If a long count ever crowds it, the sentence takes two lines */
      const RATIO = 0.36, GAPK = 0.17;
      c.font = font(600, 100); tracked(c, 100); const cw1 = c.measureText(t).width / 100; untracked(c);
      c.font = font(500, 100); if ('letterSpacing' in c) c.letterSpacing = '-2px';
      const one = c.measureText(SENTENCE).width / 100 * RATIO;
      const l2 = ['people have clapped', 'this clapper.'];
      const two = Math.max(...l2.map((s) => c.measureText(s).width)) / 100 * RATIO;
      untracked(c);
      const byHeight = (L.rule - L.m * 2 - L.hintFont * 4) / 0.95;
      const fit1 = (fw - L.m * 2) / (cw1 + GAPK + one), fit2 = (fw - L.m * 2) / (cw1 + GAPK + two);
      const useOne = Math.min(fit1, byHeight) >= Math.min(fit2, byHeight) * 0.8;
      L.countFont = Math.min(useOne ? fit1 : fit2, byHeight, 420);
      L.sentFont = L.countFont * RATIO;
      L.sentLines = useOne ? [SENTENCE] : l2; L.sentLH = L.sentFont * 1.05;
      L.countBox = { x: L.m, w: cw1 * L.countFont };
      L.sentX = L.m + (cw1 + GAPK) * L.countFont;
      // hero block (count, swipe, hint) sits a little above the middle of the space over the rule
      const blockH = L.countFont * 0.95 + L.hintFont * 3.4;
      const free = L.rule - L.m - blockH;
      L.base = L.m + L.countFont * 0.74 + Math.max(0, free * 0.42);
      L.hintBase = L.base + L.countFont * 0.21 + L.hintFont * 2.4;
    } else {
      L.countFont = Math.min(fh * 0.24, 124);
      c.font = font(600, L.countFont); tracked(c, L.countFont);
      const cw = c.measureText(t).width; untracked(c);
      if (cw > fw - L.m * 2) L.countFont *= (fw - L.m * 2) / cw;
      L.countBox = { x: L.m, w: fw - L.m * 2 };
      L.sentFont = clamp(22, fw * 0.07, 30);
      c.font = font(500, L.sentFont);
      L.sentLines = wrap(c, SENTENCE, fw - L.m * 2); L.sentLH = L.sentFont * 1.15;
      const blockH = L.countFont * 0.95 + 22 + L.sentLines.length * L.sentLH + L.hintFont * 3;
      const free = L.rule - L.m - blockH;
      L.base = L.m + L.countFont * 0.76 + Math.max(0, free * 0.48);
      L.sentY = L.base + L.countFont * 0.21 + 22 + L.sentFont * 0.8;
      L.hintBase = L.sentY + (L.sentLines.length - 1) * L.sentLH + L.hintFont * 2.6;
    }
    L.len = t.length;
    return L;
  }

  /* the board: white, the sentence, a hairline and the email. Count and hint have their own planes */
  function drawFace(cv, fw, fh, k, L) {
    const c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    const gr = c.createLinearGradient(0, 0, fw * 0.25, fh);   // the faintest fall of light, top left to bottom
    gr.addColorStop(0, '#f6f6f3'); gr.addColorStop(1, '#ebebe7');
    c.fillStyle = gr; c.fillRect(0, 0, fw, fh);
    c.textBaseline = 'alphabetic'; c.fillStyle = MARK;
    c.font = font(500, L.sentFont);
    if (!L.mobile) {
      if ('letterSpacing' in c) c.letterSpacing = `${-0.02 * L.sentFont}px`;   // matches the -2px per 100px used to measure it
      L.sentLines.forEach((s, j) => c.fillText(s, L.sentX, L.base - (L.sentLines.length - 1 - j) * L.sentLH));
    } else {
      if ('letterSpacing' in c) c.letterSpacing = `${-0.012 * L.sentFont}px`;
      L.sentLines.forEach((s, j) => c.fillText(s, L.m, L.sentY + j * L.sentLH));
    }
    untracked(c);
    c.fillStyle = 'rgba(20,21,24,0.2)'; c.fillRect(L.m, L.rule, fw - L.m * 2, 1);
    if (email) {
      c.font = font(500, L.mailFont); c.fillStyle = 'rgba(20,21,24,0.72)';
      c.fillText(email, L.m, L.mailBase);
      L.mailW = c.measureText(email).width;
    }
  }

  /* the count: black, with a pink marker swipe under it. box is w x h, baseline at h*0.76 */
  function drawCount(cv, w, h, k, L) {
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(k, 0, 0, k, 0, 0);
    let f = L.countFont; const t = fmt(count());
    c.font = font(600, f); tracked(c, f);
    let mw = c.measureText(t).width; if (mw > w + 1) { f *= w / mw; c.font = font(600, f); tracked(c, f); mw = c.measureText(t).width; }
    const by = h * 0.76;
    c.strokeStyle = PINK; c.lineCap = 'round'; c.lineWidth = Math.max(5, f * 0.07);
    c.beginPath(); c.moveTo(f * 0.05, by + f * 0.13); c.quadraticCurveTo(mw * 0.5, by + f * 0.1, mw - f * 0.03, by + f * 0.145); c.stroke();
    c.fillStyle = MARK; c.textBaseline = 'alphabetic';
    c.fillText(t, -f * 0.035, by);
    untracked(c);
  }

  /* the hint, small and quiet, with a key outline round "space". box is w x h, baseline at h*0.7 */
  function hintSize(L) { return { w: L.hintFont * 14, h: L.hintFont * 2 }; }
  function drawHint(cv, w, h, k, L) {
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(k, 0, 0, k, 0, 0);
    const f = L.hintFont, y = h * 0.7;
    c.font = font(500, f); c.fillStyle = 'rgba(20,21,24,0.55)'; c.textBaseline = 'alphabetic';
    if (touch) { c.fillText(HINT, 1, y); return; }
    let x = 1; c.fillText('Press ', x, y); x += c.measureText('Press ').width;
    const kw = c.measureText('space').width + f * 0.9, kh = f * 1.45;
    c.strokeStyle = 'rgba(20,21,24,0.4)'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x, y - kh * 0.74, kw, kh, 5); c.stroke();
    c.fillText('space', x + f * 0.45, y); x += kw + c.measureText(' ').width;
    c.fillText('to clap', x, y);
  }

  /* flat black and white bands at 45 degrees with a fixed width: longer sticks get more bands, never wider ones */
  function stripes(len, h, k, dir, band) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(len * k)); cv.height = Math.max(2, Math.round(h * k));
    const c = cv.getContext('2d'); c.scale(k, k);
    c.fillStyle = STRIPE_W; c.fillRect(0, 0, len, h);
    c.fillStyle = STRIPE_B;
    const sl = h * dir;
    for (let x = -h * 2; x < len + h * 2; x += band * 2) {
      c.beginPath(); c.moveTo(x, h); c.lineTo(x + band, h); c.lineTo(x + band + sl, 0); c.lineTo(x + sl, 0); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(12,13,15,0.35)'; c.lineWidth = 1;   // a hairline edge keeps the white bands crisp on the light page
    c.strokeRect(0.5, 0.5, len - 1, h - 1);
    return cv;
  }
  const bandFor = (sh) => sh * 0.5;

  /* ---------- scroll: the stick swings open as the footer comes into view ---------- */
  let scrub = reduce ? 1 : 0;
  const readScrub = () => {
    if (reduce) { scrub = 1; return; }
    const r = F.getBoundingClientRect(), vh = innerHeight || 1;
    scrub = clamp(0, (vh - r.top) / Math.min(r.height, vh), 1);
  };

  let onCount = () => {};
  function bump() {
    mine++; try { localStorage.setItem(KEY, String(mine)); } catch (e) {}
    srN.textContent = fmt(count());
    onCount();
  }

  /* size the footer and the stage that reaches above it; place the focus dot and the email link */
  let A = null, L = null, lastW = 0, lastVh = 0;
  function measure() {
    const Wc = F.clientWidth || innerWidth, vh = innerHeight;
    A = frameLayout(Wc, vh);
    F.style.height = A.H + 'px';
    stage.style.top = -A.swing + 'px';
    document.documentElement.style.setProperty('--cf-swing', A.mobile ? A.swing + 'px' : '0px');
    lastW = Wc; lastVh = vh;
  }
  function placeDom() {
    if (!L) return;
    dot.style.left = (L.m - 20) + 'px';
    dot.style.top = Math.round(A.yBody + L.base - L.countFont * 0.36) + 'px';
    if (mailEl && L.mailW) {
      mailEl.style.left = (L.m - 3) + 'px';
      mailEl.style.top = (A.yBody + L.mailBase - L.mailFont * 1.02) + 'px';
      mailEl.style.width = (L.mailW + 6) + 'px';
      mailEl.style.height = (L.mailFont * 1.35) + 'px';
      mailEl.style.fontSize = L.mailFont + 'px';
    }
  }
  measure();

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch (e) { renderer = null; }

  let clap = () => {};
  let rebuild = () => {};

  if (!renderer) {
    /* no WebGL: the same slate drawn flat in 2D; the count and sound still work */
    const cv = document.createElement('canvas'); stage.appendChild(cv);
    let shut = false;
    const paint = () => {
      const Wc = stage.clientWidth, Hc = stage.clientHeight, k = Math.min(devicePixelRatio || 1, 2), oy = A.swing;
      cv.width = Wc * k; cv.height = Hc * k;
      const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0);
      const fc = document.createElement('canvas'); fc.width = A.W * k; fc.height = A.BH * k;
      L = faceLayout(A.W, A.BH, A.mobile, fc.getContext('2d'));
      drawFace(fc, A.W, A.BH, k, L); c.drawImage(fc, 0, oy + A.yBody, A.W, A.BH);
      const ch = L.countFont * 1.1, cc = document.createElement('canvas'); cc.width = L.countBox.w * k; cc.height = ch * k;
      drawCount(cc, L.countBox.w, ch, k, L); c.drawImage(cc, L.countBox.x, oy + A.yBody + L.base - ch * 0.76, L.countBox.w, ch);
      if (hintOn) {
        const hs = hintSize(L), hc = document.createElement('canvas'); hc.width = hs.w * k; hc.height = hs.h * k;
        drawHint(hc, hs.w, hs.h, k, L); c.drawImage(hc, L.m, oy + A.yBody + L.hintBase - hs.h * 0.7, hs.w, hs.h);
      }
      c.drawImage(stripes(A.W, A.sh, k, -1, bandFor(A.sh)), 0, oy + A.yBar, A.W, A.sh);
      c.save(); c.translate(A.inset, oy + A.yHinge); c.rotate(shut ? 0 : -A.open * scrub);
      c.drawImage(stripes(A.SL, A.sh, k, 1, bandFor(A.sh)), 0, -A.sh, A.SL, A.sh); c.restore();
      c.fillStyle = '#1d1e21'; c.beginPath(); c.roundRect(-3, oy + A.yHinge - A.plate.h / 2, A.plate.w, A.plate.h, 3); c.fill();
      c.fillStyle = '#b4b8be'; c.beginPath(); c.arc(A.inset, oy + A.yHinge, clamp(4, A.sh * 0.085, 9), 0, Math.PI * 2); c.fill();
      placeDom();
    };
    rebuild = paint;
    if (document.fonts && document.fonts.load) document.fonts.load('600 100px "Schibsted Grotesk"').then(paint, () => {});
    onCount = () => { if (mine >= HINT_CLAPS) hintOn = false; paint(); };
    let lastS = -1;
    addEventListener('scroll', () => { readScrub(); if (Math.abs(scrub - lastS) > 0.02) { lastS = scrub; paint(); } }, { passive: true });
    readScrub(); paint();
    let busy = false;
    clap = () => {
      if (busy) return; busy = true; shut = true; paint(); fireClack(); bump();
      setTimeout(() => { shut = false; paint(); busy = false; }, 220);
    };
  } else {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    stage.appendChild(renderer.domElement);
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const maxTex = Math.min(4096, renderer.capabilities.maxTextureSize);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 500);
    // soft, even light; the edges only need enough shading to read as thickness
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3b40, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(-3, 5, 6); scene.add(key);

    const S = 100;   // CSS px per world unit
    const edgeWhite = new THREE.MeshStandardMaterial({ color: 0xe9e9e5, roughness: 0.92, metalness: 0 });
    const edgeBlack = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.85, metalness: 0 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xb4b8be, roughness: 0.4, metalness: 0.6 });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: 0.55, metalness: 0.2 });
    const shared = new Set([edgeWhite, edgeBlack, pinMat, plateMat]);
    const flat = (t, transparent) => new THREE.MeshBasicMaterial({ map: t, transparent: !!transparent, toneMapped: false, depthWrite: !transparent });
    const canvasTex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

    const slate = new THREE.Group(); scene.add(slate);   // pointer tilt
    const rig = new THREE.Group(); slate.add(rig);       // the jolt
    let pivot = null, countMesh = null, countCv = null, countTex = null, hintMesh = null, kFace = 1, cBox = null, built = [];
    const own = (o) => { built.push(o); return o; };

    function build() {
      for (const o of built) {
        o.geometry && o.geometry.dispose();
        if (o.material && !shared.has(o.material)) { o.material.map && o.material.map.dispose(); o.material.dispose(); }
        o.parent && o.parent.remove(o);
      }
      built = []; hintMesh = null;
      const Wc = stage.clientWidth || 1, Hc = stage.clientHeight || 1, oy = A.swing;
      renderer.setSize(Wc, Hc, false);
      camera.aspect = Wc / Hc;
      const dist = (Hc / S / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.near = dist * 0.5; camera.far = dist * 2;   // a tight depth range keeps the thin layers from fighting
      camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
      const wx = (x) => (x - Wc / 2) / S, wy = (y) => (Hc / 2 - (y + oy)) / S;   // footer px to world
      const Db = 8 / S, Ds = 12 / S, R = 1.5 / S;

      // board: full bleed, with a little extra past the sides and bottom so a tilt never shows an edge
      const by = wy(A.yBody + A.BH / 2);
      const body = own(new THREE.Mesh(new RoundedBoxGeometry((A.W + 40) / S, (A.BH + 40) / S, Db, 2, R), edgeWhite));
      body.position.set(0, by - 0.2, 0); rig.add(body);
      kFace = Math.min(Math.min(devicePixelRatio || 1, 2) * 1.25, maxTex / Math.max(A.W, A.BH));
      const faceCv = document.createElement('canvas'); faceCv.width = Math.round(A.W * kFace); faceCv.height = Math.round(A.BH * kFace);
      L = faceLayout(A.W, A.BH, A.mobile, faceCv.getContext('2d'));
      drawFace(faceCv, A.W, A.BH, kFace, L);
      const face = own(new THREE.Mesh(new THREE.PlaneGeometry(A.W / S, A.BH / S), flat(canvasTex(faceCv))));
      face.position.set(0, by, Db / 2 + 0.004); rig.add(face);

      const ch = L.countFont * 1.1;
      cBox = { w: L.countBox.w + L.countFont * 0.05, h: ch };
      countCv = document.createElement('canvas'); countCv.width = Math.round(cBox.w * kFace); countCv.height = Math.round(ch * kFace);
      drawCount(countCv, cBox.w, ch, kFace, L);
      countTex = canvasTex(countCv);
      countMesh = own(new THREE.Mesh(new THREE.PlaneGeometry(cBox.w / S, ch / S), flat(countTex, true)));
      countMesh.userData.y = wy(A.yBody + L.base - ch * 0.76 + ch / 2);
      countMesh.position.set(wx(L.countBox.x + cBox.w / 2), countMesh.userData.y, Db / 2 + 0.009); rig.add(countMesh);

      if (hintOn) {
        const hs = hintSize(L), hc = document.createElement('canvas'); hc.width = Math.round(hs.w * kFace); hc.height = Math.round(hs.h * kFace);
        drawHint(hc, hs.w, hs.h, kFace, L);
        hintMesh = own(new THREE.Mesh(new THREE.PlaneGeometry(hs.w / S, hs.h / S), flat(canvasTex(hc), true)));
        hintMesh.position.set(wx(L.m + hs.w / 2), wy(A.yBody + L.hintBase - hs.h * 0.7 + hs.h / 2), Db / 2 + 0.009); rig.add(hintMesh);
      }

      // the fixed bar along the footer's top edge, stripes slanting one way
      const kS = Math.min(2, maxTex / A.W), band = bandFor(A.sh);
      const barY = wy(A.yBar + A.sh / 2);
      const bar = own(new THREE.Mesh(new RoundedBoxGeometry((A.W + 40) / S, A.sh / S, Ds, 2, R), edgeBlack));
      bar.position.set(0, barY, 0); rig.add(bar);
      const barFace = own(new THREE.Mesh(new THREE.PlaneGeometry((A.W + 40) / S, A.sh / S), flat(canvasTex(stripes(A.W + 40, A.sh, kS, -1, band)))));
      barFace.position.set(0, barY, Ds / 2 + 0.004); rig.add(barFace);

      // the stick, hinged at its bottom left corner, stripes slanting the other way
      pivot = own(new THREE.Group()); pivot.position.set(wx(A.inset), wy(A.yHinge), 0); rig.add(pivot);
      const stick = new THREE.Mesh(new RoundedBoxGeometry(A.SL / S, A.sh / S, Ds, 2, R), edgeBlack);
      stick.position.set(A.SL / 2 / S, A.sh / 2 / S, 0); pivot.add(stick); built.push(stick);
      const stickFace = new THREE.Mesh(new THREE.PlaneGeometry(A.SL / S, A.sh / S), flat(canvasTex(stripes(A.SL, A.sh, kS, 1, band))));
      stickFace.position.set(A.SL / 2 / S, A.sh / 2 / S, Ds / 2 + 0.004); pivot.add(stickFace); built.push(stickFace);

      // the hinge: a small dark plate fixed over the left end of the joint, half on the arm and half on the bar,
      // with the pin centred on the pivot. The arm turns under it
      const pw = A.plate.w, ph = A.plate.h;
      const plateM = own(new THREE.Mesh(new RoundedBoxGeometry(pw / S, ph / S, 0.03, 3, 3 / S), plateMat));
      plateM.position.set(wx(pw / 2 - 3), wy(A.yHinge), Ds / 2 + 0.02); rig.add(plateM);
      const pr = clamp(4, A.sh * 0.085, 9) / S;
      const pin = own(new THREE.Mesh(new THREE.CylinderGeometry(pr, pr, 0.03, 40), pinMat));
      pin.rotation.x = Math.PI / 2; pin.position.set(wx(A.inset), wy(A.yHinge), Ds / 2 + 0.05); rig.add(pin);

      placeDom();
      F._cf = { faceCanvas: [faceCv.width, faceCv.height], facePlane: [A.W, A.BH], stripeCanvas: [barFace.material.map.image.width, barFace.material.map.image.height], stripePlane: [A.W + 40, A.sh], open: A.open, H: A.H, swing: A.swing };
    }

    let tickT = -1, hintFadeT = -1;
    onCount = () => {
      if (!countCv) return;
      if (fmt(count()).length !== L.len) build();   // a new digit or comma: lay the board out again
      else { drawCount(countCv, cBox.w, cBox.h, kFace, L); countTex.needsUpdate = true; }
      tickT = performance.now();
      if (hintOn && mine >= HINT_CLAPS) {           // third clap: the hint has done its job
        hintOn = false;
        if (reduce || !hintMesh) { if (hintMesh) hintMesh.visible = false; } else hintFadeT = performance.now();
      }
    };

    /* ---------- motion ---------- */
    let angle = 0, phase = 'rest', slamFrom = 0, slamT0 = 0, slamDur = 80, hitT = 0;
    const jolt = { y: 0, vy: 0 };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const ease = (p) => 1 - Math.pow(1 - p, 2.2);
    const openNow = () => A.open * (reduce ? 1 : ease(scrub));
    let running = false, last = 0;
    const draw = () => { pivot.rotation.z = angle; renderer.render(scene, camera); };
    const renderOnce = () => { if (!running && pivot) draw(); };

    clap = () => {
      if (phase === 'slam' || !pivot) return;
      if (reduce) {
        angle = 0; fireClack(); bump(); phase = 'after'; renderOnce();
        clearTimeout(clap.t); clap.t = setTimeout(() => { angle = A.open; phase = 'rest'; renderOnce(); }, 220);
        return;
      }
      slamFrom = angle; slamT0 = performance.now();
      slamDur = 64 + 26 * Math.min(1, angle / A.open);   // a half-open stick lands sooner
      phase = 'slam';
    };
    function impact(now) {
      angle = 0; phase = 'after'; hitT = now;
      fireClack(); bump();
      jolt.vy -= 1.2;
    }

    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      readScrub();
      const target = openNow();
      if (reduce) angle = phase === 'after' ? 0 : target;   // reduced motion: shut or open, nothing between
      else if (phase === 'slam') {
        const t = Math.min(1, (now - slamT0) / slamDur);
        angle = slamFrom * (1 - t * t * t);   // ease in: it speeds up into the bar
        if (t >= 1) impact(now);
      } else if (phase === 'after') {
        const e = now - hitT;
        if (e < 90) angle = Math.min(target, A.open * 0.06) * Math.sin(Math.PI * e / 90);   // tiny rebound
        else if (e < 200) angle = 0;
        else if (e < 720) { const k = (e - 200) / 520; angle = target * (1 - Math.pow(1 - k, 3)); }
        else phase = 'rest';
      } else {
        angle += (target - angle) * Math.min(1, dt * 10);   // follow the scroll, softly
      }

      const K = 380, C = 22;
      jolt.vy += (-K * jolt.y - C * jolt.vy) * dt; jolt.y += jolt.vy * dt;
      rig.position.y = jolt.y * 0.04;

      if (!reduce) {
        tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 3);
        tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 3);
        slate.rotation.set(tilt.x, tilt.y, 0);
      }
      if (tickT >= 0 && countMesh) {
        const k = Math.min(1, (now - tickT) / 260), e = 1 - Math.pow(1 - k, 3);
        countMesh.position.y = countMesh.userData.y + (1 - e) * 0.1;
        countMesh.material.opacity = 0.35 + 0.65 * e;
        if (k >= 1) tickT = -1;
      }
      if (hintFadeT >= 0 && hintMesh) {
        const k = Math.min(1, (now - hintFadeT) / 500);
        hintMesh.material.opacity = 1 - k;
        if (k >= 1) { hintMesh.visible = false; hintFadeT = -1; }
      }
      draw();
    }

    rebuild = () => { build(); renderOnce(); };
    build();
    readScrub(); angle = openNow();
    // watch the stage, not the footer: the arm's part above the footer must never sit there as a stale frame
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      else if (!e.isIntersecting) running = false;
    }).observe(stage);
    renderOnce();

    if (!reduce) {
      F.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = F.getBoundingClientRect();
        tilt.ty = clamp(-1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2), 1) * 0.008;
        tilt.tx = clamp(-1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2), 1) * 0.005;
      });
      F.addEventListener('pointerleave', () => { tilt.tx = tilt.ty = 0; });
    }
    if (document.fonts && document.fonts.load) document.fonts.load('600 100px "Schibsted Grotesk"').then(rebuild, () => {});
  }

  // resize: width changes always; height only on a real change (not a phone's address bar sliding)
  let rt = 0;
  addEventListener('resize', () => {
    const w = F.clientWidth || innerWidth, vh = innerHeight;
    if (w === lastW && Math.abs(vh - lastVh) < 120) return;
    clearTimeout(rt); rt = setTimeout(() => { measure(); rebuild(); }, 120);
  });

  // a pointer clap should not leave the button focused (no focus ring later when space is pressed)
  btn.addEventListener('click', (e) => { clap(); if (e.detail > 0) btn.blur(); });

  // space claps while the footer is on screen, unless someone is typing or on another control
  let seen = false;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: 0.35 }).observe(F);
  addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || !seen) return;
    const t = e.target;
    if (t !== btn && t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return;
    e.preventDefault();   // also stops the button's own space click, so one press is one clap
    if (!e.repeat) clap();
  });
  btn.addEventListener('keyup', (e) => { if (e.code === 'Space') e.preventDefault(); });
}
