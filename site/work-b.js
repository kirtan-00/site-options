/* work version B: a hand-packed grid of every project, and a calm panel
   that slides over it for each one. Everything is prefixed wkb-.
   Loaded by work.js when the address has ?work=b. */

const KP = window.KP || {};
const BASE = KP.content || '../content/';
const INK = '#0c0d0f', PAPER = '#f1f2f0';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const PHONE = matchMedia('(max-width: 760px)');

/* Order is editorial: it decides the packing below. */
const ORDER = ['spectra', 'zepto', 'clapper', 'sorted', 'crav-social', 'deepdive', 'vibe-raas-led',
  'fitkit', 'cravache', 'palladium', 'deepdive-blog', 'vibe-raas-tickets', 'dvc', 'sportified', 'fourside-studios'];
const LEAVE_OUT = new Set(['gujarat-titans']);
const TEXT_ONLY = new Set(['clapper', 'fitkit', 'fourside-studios', 'palladium', 'dvc']);
/* Flat tiles for the text-only projects: palette colour and the ink on it. */
const FLAT = {
  clapper: ['#f2a7b6', INK],
  fitkit: ['#7d9bf0', INK],
  'fourside-studios': [INK, PAPER],
  palladium: ['#1c3bb0', PAPER],
  dvc: ['#0f2545', PAPER],
};
const WING = { software: 'On screen', media: 'On set' };
/* Desktop rows on a 12-column grid. The packer walks these in turn. */
const ROWS = [[7, 5], [4, 4, 4], [5, 7], [4, 4, 4], [6, 6]];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const src = (p) => BASE + p;
const fact = (p, ...labels) => {
  for (const l of labels) { const f = (p.facts || []).find((x) => x.label === l); if (f) return f.value; }
  return '';
};
const subline = (p) => fact(p, 'Client', 'Kind', 'Format', 'Work', 'Role');
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

/* ---------- styles ---------- */
const css = `
#work{background:#c9d8f7;color:${INK};padding:clamp(72px,10vw,140px) 32px 96px;position:relative}
.wkb-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.wkb-title{font:400 clamp(48px,8.4vw,128px)/.9 "Bowlby One",system-ui,sans-serif;letter-spacing:-.01em}
.wkb-filter{display:flex;gap:4px;padding-bottom:6px}
.wkb-filter button{font:500 16px/1 "Bricolage Grotesque",system-ui,sans-serif;color:${INK};background:transparent;border:1.5px solid transparent;border-radius:999px;padding:10px 16px;cursor:pointer;transition:border-color .25s,background-color .25s,color .25s}
.wkb-filter button:hover{border-color:${INK}}
.wkb-filter button[aria-pressed="true"]{background:${INK};color:${PAPER};border-color:${INK}}
.wkb-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:clamp(240px,24vw,400px);gap:8px;grid-auto-flow:row dense}
.wkb-tile{grid-column:span var(--d,4);position:relative;overflow:hidden;background:#0f2545;color:${PAPER};isolation:isolate;
  opacity:1;transform:none;transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1)}
.wkb-tile.wkb-pre{opacity:0;transform:translateY(24px)}
.wkb-tile img,.wkb-tile video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
.wkb-tile video{opacity:0;transition:opacity .35s}
.wkb-tile.wkb-playing video{opacity:1}
.wkb-tile::before{content:"";position:absolute;inset:0 0 auto 0;height:55%;background:linear-gradient(rgba(12,13,15,.62),rgba(12,13,15,0));z-index:1;pointer-events:none}
.wkb-tile::after{content:"";position:absolute;inset:auto 0 0 0;height:40%;background:linear-gradient(rgba(12,13,15,0),rgba(12,13,15,.55));z-index:1;pointer-events:none;opacity:0;transition:opacity .35s}
.wkb-cap{position:absolute;left:18px;top:16px;right:18px;z-index:2;pointer-events:none}
.wkb-name{font:500 clamp(22px,2vw,30px)/1.08 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.01em}
.wkb-sub{font:500 clamp(15px,1.15vw,18px)/1.25 "Bricolage Grotesque",system-ui,sans-serif;opacity:.82;margin-top:4px}
.wkb-hit{position:absolute;inset:0;z-index:2;outline-offset:-4px}
.wkb-hit:focus-visible{outline:3px solid ${PAPER}}
.wkb-acts{position:absolute;left:18px;bottom:16px;z-index:3;display:flex;gap:8px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .4s cubic-bezier(.2,.7,.2,1);pointer-events:none}
.wkb-acts button{font:500 15px/1 "Bricolage Grotesque",system-ui,sans-serif;background:${PAPER};color:${INK};border:0;border-radius:999px;padding:10px 16px;cursor:pointer}
.wkb-acts button:hover{background:#f2a7b6}
.wkb-acts button:focus-visible{outline:2px solid ${PAPER};outline-offset:2px}
@media (hover:hover) and (pointer:fine){
  .wkb-tile:hover img{transform:scale(1.035)}
  .wkb-tile:hover::after,.wkb-tile:focus-within::after,.wkb-tile.wkb-playing::after{opacity:1}
  .wkb-tile:hover .wkb-acts,.wkb-tile:focus-within .wkb-acts,.wkb-tile.wkb-playing .wkb-acts{opacity:1;transform:none;pointer-events:auto}
}
.wkb-flat::before,.wkb-flat::after{display:none}
.wkb-flat{background:var(--bg);color:var(--fg)}
.wkb-flat .wkb-cap{top:20px;left:22px;right:22px;bottom:20px;display:flex;flex-direction:column;justify-content:space-between}
.wkb-flat .wkb-name{font:400 clamp(30px,3.3vw,54px)/.98 "Bowlby One",system-ui,sans-serif;letter-spacing:0}
.wkb-flat .wkb-line{font:500 clamp(15px,1.2vw,18px)/1.35 "Bricolage Grotesque",system-ui,sans-serif;max-width:34ch;text-wrap:pretty}
.wkb-flat .wkb-sub{margin-top:8px}
.wkb-flat .wkb-hit:focus-visible{outline-color:var(--fg)}
.wkb-flat .wkb-acts{left:auto;right:22px;bottom:20px}
@media (max-width:760px){
  #work{padding:72px 16px 72px}
  .wkb-head{margin-bottom:20px;gap:14px}
  .wkb-filter button{padding:9px 13px;font-size:15px}
  .wkb-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;gap:6px}
  .wkb-tile{grid-column:span 1;aspect-ratio:3/4}
  .wkb-tile[data-m="full"]{grid-column:span 2;aspect-ratio:4/3}
  .wkb-flat[data-m="full"]{aspect-ratio:auto;min-height:250px}
  .wkb-cap{left:14px;top:12px;right:14px}
  .wkb-name{font-size:19px}
  .wkb-sub{font-size:14px}
  .wkb-flat .wkb-cap{position:relative;inset:auto;padding:20px 18px;min-height:250px;gap:28px}
  .wkb-flat .wkb-name{font-size:34px}
  .wkb-flat .wkb-line{font-size:16px}
}

/* ---------- the project panel ---------- */
.wkb-layer{position:fixed;inset:0;z-index:9;display:flex;pointer-events:none;visibility:hidden}
.wkb-layer.wkb-open{pointer-events:auto;visibility:visible}
.wkb-rail{flex:0 0 52px;background:${PAPER};color:${INK};border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;
  opacity:0;transition:opacity .4s;font:500 17px/1 "Bricolage Grotesque",system-ui,sans-serif}
.wkb-rail span{writing-mode:vertical-rl;transform:rotate(180deg)}
.wkb-rail::after{content:"";position:absolute;right:-1px;top:50%;margin-top:-8px;border:8px solid transparent;border-right-color:#0f2545;transition:transform .3s}
.wkb-rail:hover::after{transform:translateX(-4px)}
.wkb-rail:focus-visible{outline:3px solid #1c3bb0;outline-offset:-6px}
.wkb-open .wkb-rail{opacity:1}
.wkb-panel{flex:1;min-width:0;background:#0f2545;color:${PAPER};overflow-y:auto;overscroll-behavior:contain;transform:translateX(102%);
  transition:transform .75s cubic-bezier(.7,0,.2,1);-webkit-overflow-scrolling:touch}
.wkb-open .wkb-panel{transform:none}
.wkb-panel:focus{outline:none}
.wkb-back{display:none}
.wkb-in{max-width:1240px;margin:0 auto;padding:36px 56px 96px}
.wkb-ph{text-align:center;padding:4px 120px 26px;border-bottom:1px solid rgba(241,242,240,.22)}
.wkb-ph h2{font:400 clamp(30px,3vw,44px)/1.05 "Bowlby One",system-ui,sans-serif;outline:none}
.wkb-ph p{font:500 17px/1.3 "Bricolage Grotesque",system-ui,sans-serif;opacity:.82;margin-top:8px}
.wkb-copy{max-width:640px;margin:44px auto 52px}
.wkb-hl{font:800 clamp(24px,2.2vw,32px)/1.18 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.012em;text-align:center;text-wrap:balance;margin-bottom:28px}
.wkb-copy .wkb-w{font:500 18px/1.6 "Bricolage Grotesque",system-ui,sans-serif;color:rgba(241,242,240,.86);text-wrap:pretty}
.wkb-copy .wkb-w + .wkb-w{margin-top:16px}
.wkb-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:18px 28px;margin-top:34px;padding-top:24px;border-top:1px solid rgba(241,242,240,.22)}
.wkb-facts dt{font:500 14px/1.3 "Bricolage Grotesque",system-ui,sans-serif;opacity:.66}
.wkb-facts dd{font:800 17px/1.3 "Bricolage Grotesque",system-ui,sans-serif;margin-top:4px}
.wkb-link{display:inline-block;margin-top:30px;font:500 16px/1 "Bricolage Grotesque",system-ui,sans-serif;color:${INK};background:${PAPER};padding:13px 20px;border-radius:999px;text-decoration:none}
.wkb-link:hover{background:#f2a7b6}
.wkb-main{position:relative;background:${INK};overflow:hidden}
.wkb-main img,.wkb-main video{display:block;width:100%;height:auto}
.wkb-main.wkb-v{display:flex;justify-content:center}
.wkb-main.wkb-v video,.wkb-main.wkb-v img{width:auto;max-width:100%;height:min(82vh,860px);aspect-ratio:9/16;object-fit:cover}
.wkb-gal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
.wkb-gal.wkb-v{grid-template-columns:repeat(4,minmax(0,1fr))}
.wkb-gal figure{background:rgba(12,13,15,.35);overflow:hidden}
.wkb-gal img{display:block;width:100%;height:auto;opacity:0;transition:opacity .6s}
.wkb-gal img.wkb-ld{opacity:1}
.wkb-more{margin-top:88px;padding-top:28px;border-top:1px solid rgba(241,242,240,.22)}
.wkb-more-h{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:22px}
.wkb-more-h h3{font:400 clamp(28px,3vw,44px)/1 "Bowlby One",system-ui,sans-serif}
.wkb-blocks{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:clamp(120px,10.5vw,168px);gap:10px;grid-auto-flow:dense}
.wkb-blk{all:unset;box-sizing:border-box;position:relative;display:block;cursor:pointer;grid-column:span var(--c);grid-row:span var(--r);-webkit-tap-highlight-color:transparent}
.wkb-blk-in{position:absolute;inset:0;transform-style:preserve-3d;
  transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateZ(var(--z,0px));
  transition:transform .6s cubic-bezier(.2,.7,.2,1),box-shadow .5s}
.wkb-blk.wkb-hov .wkb-blk-in{--z:28px;transition:transform .16s ease-out,box-shadow .5s;box-shadow:0 26px 34px -20px rgba(12,13,15,.7)}
.wkb-face,.wkb-backf{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.wkb-face{background:#0f2545}
.wkb-face img,.wkb-face video{position:absolute;left:-5%;top:-5%;width:110%;height:110%;object-fit:cover;display:block;
  transform:translate(var(--px,0%),var(--py,0%)) scale(var(--s,1));transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.wkb-hov .wkb-face img,.wkb-hov .wkb-face video{transition:transform .16s ease-out}
.wkb-armed .wkb-face img{--s:1.06}
.wkb-face video{opacity:0;transition:opacity .3s}
.wkb-vplay .wkb-face video{opacity:1}
.wkb-face::after{content:"";position:absolute;inset:auto 0 0 0;height:70%;background:linear-gradient(rgba(12,13,15,0),rgba(12,13,15,.72));opacity:0;transition:opacity .35s;pointer-events:none}
.wkb-hov .wkb-face::after,.wkb-armed .wkb-face::after,.wkb-blk:focus-visible .wkb-face::after{opacity:1}
.wkb-bcap{position:absolute;left:12px;right:12px;bottom:10px;z-index:1;color:${PAPER};transform:translateY(calc(100% + 16px));transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.wkb-hov .wkb-bcap,.wkb-armed .wkb-bcap,.wkb-blk:focus-visible .wkb-bcap{transform:none}
.wkb-bcap b{display:block;font:500 17px/1.1 "Bricolage Grotesque",system-ui,sans-serif}
.wkb-bcap span{display:block;font:500 13px/1.25 "Bricolage Grotesque",system-ui,sans-serif;opacity:.8;margin-top:3px}
.wkb-ticks{position:absolute;left:12px;top:12px;width:42%;display:flex;gap:3px;z-index:1;opacity:0;transition:opacity .3s}
.wkb-ticks i{flex:1;height:2px;background:rgba(241,242,240,.38)}
.wkb-ticks i.on{background:${PAPER}}
.wkb-hov .wkb-ticks,.wkb-armed .wkb-ticks{opacity:1}
.wkb-ff{background:var(--bg);color:var(--fg);padding:14px 14px 12px;display:flex;flex-direction:column;justify-content:space-between}
.wkb-ff::after{display:none}
.wkb-ff b{font:400 clamp(17px,1.6vw,24px)/1 "Bowlby One",system-ui,sans-serif;font-weight:400}
.wkb-ff .wkb-ol{font:500 13.5px/1.3 "Bricolage Grotesque",system-ui,sans-serif;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden;
  transform:translateY(calc(100% + 14px));opacity:0;transition:transform .5s cubic-bezier(.2,.7,.2,1),opacity .3s}
.wkb-hov .wkb-ff .wkb-ol,.wkb-blk:focus-visible .wkb-ff .wkb-ol{transform:none;opacity:1}
.wkb-backf{background:var(--bg,#0f2545);color:var(--fg,${PAPER});transform:rotateY(180deg);padding:46px 14px 12px;display:flex;flex-direction:column;justify-content:flex-end}
.wkb-backf p{font:500 14px/1.3 "Bricolage Grotesque",system-ui,sans-serif;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:6;overflow:hidden}
.wkb-blk.wkb-flip .wkb-blk-in{transform:perspective(900px) rotateY(180deg)}
.wkb-hint{position:absolute;right:8px;top:8px;z-index:2;background:${PAPER};color:${INK};font:500 13px/1 "Bricolage Grotesque",system-ui,sans-serif;padding:7px 10px;border-radius:999px;
  opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .35s cubic-bezier(.2,.7,.2,1);pointer-events:none}
.wkb-armed .wkb-hint{opacity:1;transform:none}
.wkb-blk:focus-visible{outline:3px solid #1c3bb0;outline-offset:3px}
.wkb-in.wkb-swap{animation:wkb-swap .55s cubic-bezier(.2,.7,.2,1)}
@keyframes wkb-swap{from{opacity:0;transform:translateY(18px)}}
.wkb-close{font:500 15px/1 "Bricolage Grotesque",system-ui,sans-serif;color:${PAPER};background:none;border:1.5px solid rgba(241,242,240,.5);border-radius:999px;padding:10px 16px;cursor:pointer;flex:none}
.wkb-close:hover{border-color:${PAPER}}
@media (max-width:760px){
  .wkb-rail{display:none}
  .wkb-back{display:block;position:sticky;top:0;z-index:2;height:0}
  .wkb-back button{position:absolute;left:16px;top:18px;font:500 16px/1 "Bricolage Grotesque",system-ui,sans-serif;background:${PAPER};color:${INK};border:0;border-radius:999px;padding:12px 18px;cursor:pointer}
  .wkb-in{padding:84px 16px 72px}
  .wkb-ph{padding:4px 0 20px}
  .wkb-ph h2{font-size:30px}
  .wkb-ph p{font-size:16px}
  .wkb-copy{margin:30px auto 36px}
  .wkb-hl{font-size:23px;text-align:left;margin-bottom:20px}
  .wkb-copy .wkb-w{font-size:17px}
  .wkb-facts{grid-template-columns:1fr 1fr;gap:16px 18px}
  .wkb-main.wkb-v video,.wkb-main.wkb-v img{height:auto;width:100%}
  .wkb-gal{grid-template-columns:1fr;gap:8px;margin-top:8px}
  .wkb-gal.wkb-v{grid-template-columns:1fr 1fr}
  .wkb-more{margin-top:56px}
  .wkb-blocks{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:132px;gap:8px}
  .wkb-blk{grid-column:span var(--cm);grid-row:span var(--rm)}
  .wkb-ff b{font-size:19px}
  .wkb-backf p{-webkit-line-clamp:3}
  .wkb-more-h .wkb-close{display:none}
}
@media (prefers-reduced-motion:reduce){
  .wkb-tile,.wkb-tile img,.wkb-gal img{transition:none}
  .wkb-tile.wkb-pre{opacity:1;transform:none}
  .wkb-panel{transform:none;opacity:0;transition:opacity .2s}
  .wkb-open .wkb-panel{opacity:1}
  .wkb-tile:hover img{transform:none}
  .wkb-blk-in,.wkb-blk.wkb-hov .wkb-blk-in{transform:none;transition:none}
  .wkb-face img,.wkb-face video{transform:none!important;transition:none}
  .wkb-backf{transform:none;opacity:0;transition:opacity .2s}
  .wkb-blk.wkb-flip .wkb-blk-in{transform:none}
  .wkb-blk.wkb-flip .wkb-backf{opacity:1}
  .wkb-bcap,.wkb-ff .wkb-ol{transition:none}
  .wkb-in.wkb-swap{animation:none}
}
`;

/* ---------- packing ---------- */
/* Desktop: walk the row patterns; a short last row is split evenly. */
function packDesktop(n) {
  const spans = []; let r = 0;
  while (spans.length < n) {
    const left = n - spans.length;
    let row = ROWS[r % ROWS.length];
    if (left <= 3) row = Array(left).fill(12 / left);
    else if (left - row.length === 1) row = row.length === 3 ? [6, 6] : [4, 4, 4];
    spans.push(...row); r++;
  }
  return spans;
}
/* Phone: text tiles are full width; images run full, half, half.
   The grid is dense, so a half split by a text tile still finds its
   partner. An odd half out at the end grows to full. */
function packPhone(items) {
  let beat = 0; const halves = [];
  const out = items.map((p, i) => {
    if (TEXT_ONLY.has(p.id)) return 'full';
    const m = beat++ % 3 === 0 ? 'full' : 'half';
    if (m === 'half') halves.push(i);
    return m;
  });
  if (halves.length % 2) out[halves[halves.length - 1]] = 'full';
  return out;
}

/* ---------- build ---------- */
async function load() {
  const [sw, md] = await Promise.all(['software/manifest.json', 'media/manifest.json'].map((f) => fetch(BASE + f).then((r) => r.json())));
  const all = [...sw, ...md].filter((p) => !LEAVE_OUT.has(p.id));
  const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  const ordered = ORDER.filter((id) => byId[id]).map((id) => byId[id]);
  all.forEach((p) => { if (!ORDER.includes(p.id)) ordered.push(p); });
  /* text-only projects never show images, whatever the manifest says */
  ordered.forEach((p) => { if (TEXT_ONLY.has(p.id)) { p.hero = null; p.gallery = []; p.video = null; } });
  return ordered;
}

function tileHTML(p) {
  const sub = subline(p);
  if (TEXT_ONLY.has(p.id)) {
    const [bg, fg] = FLAT[p.id] || ['#7d9bf0', INK];
    return `<article class="wkb-tile wkb-flat" data-id="${esc(p.id)}" style="--bg:${bg};--fg:${fg}">
      <div class="wkb-cap"><div><h3 class="wkb-name">${esc(p.name)}</h3>${sub ? `<p class="wkb-sub">${esc(sub)}</p>` : ''}</div>
      <p class="wkb-line">${esc(p.one_line)}</p></div>
      <a class="wkb-hit" href="#work/${esc(p.id)}" aria-label="Open ${esc(p.name)}"></a>
    </article>`;
  }
  const img = p.hero || (p.gallery || [])[0];
  return `<article class="wkb-tile" data-id="${esc(p.id)}">
    ${img ? `<img src="${esc(src(img))}" alt="" loading="lazy" decoding="async">` : ''}
    <div class="wkb-cap"><h3 class="wkb-name">${esc(p.name)}</h3>${sub ? `<p class="wkb-sub">${esc(sub)}</p>` : ''}</div>
    <a class="wkb-hit" href="#work/${esc(p.id)}" aria-label="Open ${esc(p.name)}"></a>
    <div class="wkb-acts">${p.video ? `<button type="button" data-act="play">Play</button>` : ''}<button type="button" data-act="open">Open</button></div>
  </article>`;
}

/* Block sizes for the more-work grid: [desktop cols, rows, phone cols, rows] */
const BLK = { b: [2, 2, 2, 2], w: [2, 1, 2, 1], t: [1, 2, 1, 2], s: [1, 1, 1, 1] };
const BLK_SEQ = ['b', 's', 's', 'w', 's', 't', 's', 'w', 's', 's', 'b', 's', 'w', 's'];

function blockHTML(q, k) {
  const [c, r, cm, rm] = BLK[BLK_SEQ[k % BLK_SEQ.length]];
  const size = `--c:${c};--r:${r};--cm:${cm};--rm:${rm}`;
  const hint = '<span class="wkb-hint" aria-hidden="true">Tap again to open</span>';
  if (TEXT_ONLY.has(q.id)) {
    let [bg, fg] = FLAT[q.id] || ['#7d9bf0', INK];
    if (bg === '#0f2545') [bg, fg] = [PAPER, INK]; /* navy would vanish on the navy panel */
    return `<button type="button" class="wkb-blk" data-go="${esc(q.id)}" style="${size};--bg:${bg};--fg:${fg}" aria-label="Open ${esc(q.name)}">
      <span class="wkb-blk-in"><span class="wkb-face wkb-ff"><b>${esc(q.name)}</b><span class="wkb-ol">${esc(q.one_line)}</span></span>
      <span class="wkb-backf"><p>${esc(q.one_line)}</p></span></span>${hint}</button>`;
  }
  const hero = q.hero || (q.gallery || [])[0];
  const frames = q.video ? [] : [...new Set([hero, ...(q.gallery || [])])].filter(Boolean).slice(0, 6).map(src);
  return `<button type="button" class="wkb-blk" data-go="${esc(q.id)}" style="${size}" aria-label="Open ${esc(q.name)}"
    ${frames.length > 1 ? `data-frames="${esc(JSON.stringify(frames))}"` : ''}>
    <span class="wkb-blk-in"><span class="wkb-face">
      ${hero ? `<img src="${esc(src(hero))}" alt="" loading="lazy" decoding="async">` : ''}
      ${q.video ? `<video muted loop playsinline preload="none" data-src="${esc(src(q.video))}" aria-hidden="true"></video>` : ''}
      ${frames.length > 1 ? `<span class="wkb-ticks">${frames.map((_, n) => `<i${n ? '' : ' class="on"'}></i>`).join('')}</span>` : ''}
      <span class="wkb-bcap"><b>${esc(q.name)}</b><span>${esc(subline(q))}</span></span>
    </span></span>${hint}</button>`;
}

function panelHTML(p, others) {
  const sub = [WING[p.wing], subline(p)].filter(Boolean).join(', ');
  const vert = p.orientation === 'vertical';
  let main = '';
  if (p.video) {
    main = `<div class="wkb-main${vert ? ' wkb-v' : ''}"><video class="wkb-mv" muted loop playsinline controls preload="none"
      ${p.hero ? `poster="${esc(src(p.hero))}"` : ''} data-src="${esc(src(p.video))}" aria-label="${esc(p.name)} film"></video></div>`;
  } else if (p.hero) {
    main = `<div class="wkb-main${vert ? ' wkb-v' : ''}"><img src="${esc(src(p.hero))}" alt="${esc(p.name)}" decoding="async"></div>`;
  }
  const gal = (p.gallery || []).filter((g) => p.video || g !== p.hero);
  const galHTML = gal.length ? `<div class="wkb-gal${vert ? ' wkb-v' : ''}">${gal.map((g) =>
    `<figure><img src="${esc(src(g))}" alt="" loading="lazy" decoding="async"></figure>`).join('')}</div>` : '';
  const facts = (p.facts || []).filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  const lk = p.link ? `<a class="wkb-link" href="${esc(p.link)}" target="_blank" rel="noopener">Visit ${esc(host(p.link) || 'the site')}</a>` : '';
  return `
    <div class="wkb-in">
      <header class="wkb-ph"><h2 tabindex="-1">${esc(p.name)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</header>
      <div class="wkb-copy">
        <p class="wkb-hl">${esc(p.one_line)}</p>
        ${(p.writeup || []).map((w) => `<p class="wkb-w">${esc(w)}</p>`).join('')}
        ${facts.length ? `<dl class="wkb-facts">${facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : ''}
        ${lk}
      </div>
      ${main}${galHTML}
      <section class="wkb-more" aria-label="More work">
        <div class="wkb-more-h"><h3>More work</h3><button type="button" class="wkb-close" data-close>Back to the work</button></div>
        <div class="wkb-blocks">${others.map(blockHTML).join('')}</div>
      </section>
    </div>`;
}

(async function init() {
  const root = document.getElementById('work');
  if (!root) return;
  const style = document.createElement('style'); style.id = 'wkb-style'; style.textContent = css;
  document.head.appendChild(style);

  let items;
  try { items = await load(); } catch (e) {
    root.innerHTML = '<p style="padding:40px 20px">The work list could not load.</p>'; return;
  }
  const byId = Object.fromEntries(items.map((p) => [p.id, p]));

  root.innerHTML = `
    <div class="wkb-head">
      <h2 class="wkb-title">The work</h2>
      <div class="wkb-filter" role="group" aria-label="Filter the work">
        <button type="button" data-f="all" aria-pressed="true">All</button>
        <button type="button" data-f="media" aria-pressed="false">On set</button>
        <button type="button" data-f="software" aria-pressed="false">On screen</button>
      </div>
    </div>
    <div class="wkb-grid"></div>`;
  const grid = root.querySelector('.wkb-grid');

  /* ----- grid ----- */
  let filter = 'all';
  const shown = () => items.filter((p) => filter === 'all' || p.wing === filter);
  const seen = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.remove('wkb-pre'); seen.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  const tileVid = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) stopTile(e.target);
  }), { threshold: 0.15 });

  function renderGrid(animate) {
    stopAllTiles();
    const list = shown();
    const spans = packDesktop(list.length);
    const m = packPhone(list);
    grid.innerHTML = list.map(tileHTML).join('');
    [...grid.children].forEach((t, i) => {
      t.style.setProperty('--d', spans[i]);
      t.dataset.m = m[i];
      if (!RM.matches) {
        t.classList.add('wkb-pre');
        t.style.transitionDelay = animate ? `${Math.min(i, 8) * 45}ms` : `${(i % 3) * 70}ms`;
        if (animate) requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove('wkb-pre')));
        else seen.observe(t);
      }
      if (byId[t.dataset.id].video) tileVid.observe(t);
    });
  }
  renderGrid(false);

  root.querySelector('.wkb-filter').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]'); if (!b || b.dataset.f === filter) return;
    filter = b.dataset.f;
    root.querySelectorAll('.wkb-filter button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    renderGrid(true);
  });

  function stopTile(t) {
    const v = t.querySelector('video'); if (!v) return;
    v.pause(); t.classList.remove('wkb-playing');
    const b = t.querySelector('[data-act="play"]'); if (b) b.textContent = 'Play';
  }
  function stopAllTiles() { grid.querySelectorAll('.wkb-playing').forEach(stopTile); }
  function playTile(t) {
    const p = byId[t.dataset.id];
    let v = t.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'auto' });
      v.setAttribute('aria-hidden', 'true');
      v.src = src(p.video);
      t.insertBefore(v, t.querySelector('.wkb-cap'));
    }
    stopAllTiles();
    t.classList.add('wkb-playing');
    t.querySelector('[data-act="play"]').textContent = 'Pause';
    v.play().catch(() => {});
  }

  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.wkb-tile'); if (!t) return;
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'play') {
      e.preventDefault();
      t.classList.contains('wkb-playing') ? stopTile(t) : playTile(t);
      return;
    }
    if (act || e.target.closest('.wkb-hit')) { e.preventDefault(); open(t.dataset.id, t.querySelector('.wkb-hit')); }
  });

  /* ----- panel ----- */
  const layer = document.createElement('div');
  layer.className = 'wkb-layer'; layer.id = 'wkb-layer';
  layer.innerHTML = `
    <button class="wkb-rail" type="button" aria-label="Back to the work"><span>Work</span></button>
    <div class="wkb-panel" role="dialog" aria-modal="true" aria-label="Project" tabindex="-1">
      <div class="wkb-back"><button type="button" data-close>Back</button></div>
      <div class="wkb-body"></div>
    </div>`;
  document.body.appendChild(layer);
  const panel = layer.querySelector('.wkb-panel');
  const body = layer.querySelector('.wkb-body');
  let current = null, returnTo = null, pushed = false, closeTimer = 0;

  const mainVid = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !RM.matches) {
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else if (!e.isIntersecting) v.pause();
  }), { root: panel, threshold: 0.35 });

  function fill(id) {
    const p = byId[id]; if (!p) return false;
    const list = items; const i = list.indexOf(p);
    mainVid.disconnect();
    disarmAll();
    body.querySelectorAll('video').forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    const others = [...list.slice(i + 1), ...list.slice(0, i)];
    body.innerHTML = panelHTML(p, others);
    body.querySelectorAll('.wkb-blk').forEach(bindBlock);
    panel.setAttribute('aria-label', p.name);
    panel.scrollTop = 0;
    body.querySelectorAll('.wkb-gal img').forEach((im) => {
      if (im.complete) im.classList.add('wkb-ld');
      else im.addEventListener('load', () => im.classList.add('wkb-ld'), { once: true });
    });
    const v = body.querySelector('.wkb-mv');
    if (v) {
      if (RM.matches) v.src = v.dataset.src; else mainVid.observe(v);
      v.addEventListener('play', () => { if (!v.src) v.src = v.dataset.src; }, { once: true });
    }
    current = id;
    return true;
  }

  function show(id) {
    if (!fill(id)) return;
    clearTimeout(closeTimer);
    stopAllTiles();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    layer.classList.add('wkb-open');
    requestAnimationFrame(() => body.querySelector('h2')?.focus({ preventScroll: true }));
  }
  function hide() {
    if (!layer.classList.contains('wkb-open')) return;
    layer.classList.remove('wkb-open');
    mainVid.disconnect();
    body.querySelectorAll('video').forEach((v) => v.pause());
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    current = null;
    const back = returnTo; returnTo = null;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
    closeTimer = setTimeout(() => { if (!current) body.innerHTML = ''; }, RM.matches ? 250 : 800);
  }

  function open(id, from) {
    returnTo = from || null;
    history.pushState({ wkb: id }, '', `#work/${id}`);
    pushed = true;
    show(id);
  }
  function close() {
    if (!current) return;
    if (pushed && history.state && history.state.wkb) { history.back(); return; }
    history.replaceState(null, '', location.pathname + location.search + '#work');
    hide();
  }
  function sync() {
    const m = location.hash.match(/^#work\/([\w-]+)$/);
    if (m && byId[m[1]]) { if (current !== m[1]) show(m[1]); }
    else { pushed = false; hide(); }
  }

  /* ----- more work blocks ----- */
  const armed = new Set();
  function startVid(b) {
    const v = b.querySelector('video'); if (!v) return;
    if (!v.src) v.src = v.dataset.src;
    b.classList.add('wkb-vplay'); v.play().catch(() => {});
  }
  function stopVid(b) {
    const v = b.querySelector('video'); if (!v) return;
    v.pause(); b.classList.remove('wkb-vplay');
  }
  function frames(b) {
    if (!b._f) {
      b._f = b.dataset.frames ? JSON.parse(b.dataset.frames) : [];
      b._f.forEach((u) => { const im = new Image(); im.decoding = 'async'; im.src = u; });
    }
    return b._f;
  }
  function showFrame(b, n) {
    const f = frames(b); if (f.length < 2) return;
    n = ((n % f.length) + f.length) % f.length;
    if (b._n === n) return; b._n = n;
    b.querySelector('.wkb-face img').src = f[n];
    b.querySelectorAll('.wkb-ticks i').forEach((t, k) => t.classList.toggle('on', k === n));
  }
  function arm(b) {
    disarmAll();
    b.classList.add('wkb-armed'); armed.add(b);
    if (b.querySelector('.wkb-ff')) { b.classList.add('wkb-flip'); return; }
    startVid(b);
    if (frames(b).length > 1 && !RM.matches) {
      b._t = setInterval(() => showFrame(b, (b._n || 0) + 1), 650);
    }
  }
  function disarm(b) {
    b.classList.remove('wkb-armed', 'wkb-flip'); armed.delete(b);
    clearInterval(b._t); stopVid(b); showFrame(b, 0);
  }
  function disarmAll() { [...armed].forEach(disarm); }
  function go(id) {
    disarmAll();
    history.replaceState({ wkb: id }, '', `#work/${id}`);
    fill(id);
    const inner = body.querySelector('.wkb-in');
    if (inner && !RM.matches) inner.classList.add('wkb-swap');
    body.querySelector('h2')?.focus({ preventScroll: true });
  }
  function bindBlock(b) {
    let touch = false;
    b.addEventListener('pointerdown', (e) => { touch = e.pointerType !== 'mouse'; });
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      b.classList.add('wkb-hov'); startVid(b); frames(b);
    });
    b.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = b.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      if (!RM.matches) {
        b.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`);
        b.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
        b.style.setProperty('--px', `${((0.5 - x) * 4).toFixed(2)}%`);
        b.style.setProperty('--py', `${((0.5 - y) * 4).toFixed(2)}%`);
      }
      const f = frames(b); if (f.length > 1) showFrame(b, Math.min(f.length - 1, Math.floor(x * f.length)));
    });
    b.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      b.classList.remove('wkb-hov');
      ['--rx', '--ry', '--px', '--py'].forEach((k) => b.style.removeProperty(k));
      stopVid(b); showFrame(b, 0);
    });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.dataset.go;
      if (touch && !armed.has(b)) { arm(b); return; }
      go(id);
    });
  }

  layer.querySelector('.wkb-rail').addEventListener('click', close);
  layer.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { close(); return; }
    if (!e.target.closest('.wkb-blk')) disarmAll();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) { e.preventDefault(); close(); } });
  addEventListener('popstate', sync);
  addEventListener('hashchange', sync);
  sync();
})();
