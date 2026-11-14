/* Work, version A. One project per tall row on a flat off-white ground, then a quiet project page.
   Fills <section id="work">. Every class and id starts with wka-. Project pages live at #work/<id>. */

const ROOT = document.getElementById('work');
const BASE = (window.KP && window.KP.content) || '../content/';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const HIDE = new Set(['gujarat-titans']);
const TEXT_ONLY = new Set(['clapper', 'fitkit', 'fourside-studios', 'palladium', 'dvc']);
const WINGS = [
  { key: 'media', id: 'wka-set', title: 'Films on set.', short: 'On set' },
  { key: 'software', id: 'wka-screen', title: 'Software on screen.', short: 'On screen' },
];
const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
/* text-only panels: flat fields from the locked palette */
const PANELS = [
  { bg: '#7d9bf0', fg: '#0c0d0f' },
  { bg: '#f1f2f0', fg: '#0c0d0f' },
  { bg: '#f2a7b6', fg: '#0c0d0f' },
  { bg: '#0f2545', fg: '#f1f2f0' },
  { bg: '#0c0d0f', fg: '#f1f2f0' },
];

const CSS = `
#work{background:#c9d8f7;color:#0c0d0f;position:relative;z-index:1}
.wka{--g:clamp(18px,1.7vw,28px);--accent:#1c3bb0;padding:0 var(--g);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;overflow:hidden}
.wka *{box-sizing:border-box}
.wka a{color:inherit}
.wka-head{padding:clamp(96px,16vh,170px) 0 clamp(40px,8vh,90px)}
.wka-title{font:400 clamp(72px,15.5vw,250px)/.86 "Bowlby One",sans-serif;letter-spacing:-.02em;margin:0}
.wka-jump{display:flex;flex-wrap:wrap;gap:6px 36px;margin-top:clamp(22px,3vw,40px);font-size:clamp(18px,1.5vw,22px)}
.wka-jump a{text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:5px}
.wka-jump a:hover{color:var(--accent)}

.wka-wing{display:grid;grid-template-columns:repeat(12,1fr);gap:0 var(--g);align-items:end;padding:clamp(70px,14vh,150px) 0 clamp(10px,2vh,30px);border-top:2px solid #0c0d0f}
.wka-wing:first-of-type{border-top:0;padding-top:clamp(20px,4vh,40px)}
.wka-wing h2{grid-column:1/9;margin:0;font:400 clamp(44px,7.4vw,120px)/.9 "Bowlby One",sans-serif;letter-spacing:-.015em;color:var(--accent)}
.wka-wing p{grid-column:10/13;margin:0 0 .3em;font-size:clamp(17px,1.4vw,21px);line-height:1.35;justify-self:end;text-align:right}

.wka-row{display:grid;grid-template-columns:repeat(12,1fr);gap:0 var(--g);min-height:92vh;padding:clamp(56px,10vh,120px) 0;align-content:center;text-decoration:none;color:inherit;cursor:pointer;position:relative}
.wka-row:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.wka-media{position:relative;display:block;overflow:hidden;background:#b7c8ee;aspect-ratio:16/10}
.wka-media img,.wka-media video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wka-media video{opacity:0;transition:opacity .4s linear}
.wka-media video.wka-live{opacity:1}
.wka-v .wka-media{aspect-ratio:9/16}
.wka-tm .wka-panel{position:absolute;inset:0;aspect-ratio:auto}
.wka-text{display:block}
.wka-hl{display:block;margin:0;font:400 clamp(30px,3.7vw,62px)/1 "Bowlby One",sans-serif;letter-spacing:-.01em;text-wrap:balance}
.wka-hl b{font-weight:400;color:var(--accent)}
.wka-sub{display:block;text-wrap:pretty;max-width:30em;margin-top:clamp(14px,1.6vw,24px);font-size:clamp(17px,1.35vw,21px);line-height:1.4}
.wka-more{display:inline-block;margin-top:clamp(16px,1.6vw,26px);font-weight:800;font-size:clamp(16px,1.2vw,19px);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.wka-row:hover .wka-more{color:var(--accent)}

/* layouts, horizontal media */
.wka-l0 .wka-media{grid-column:6/13;grid-row:1}
.wka-l0 .wka-text{grid-column:1/10;grid-row:2;margin-top:clamp(40px,9vh,110px)}
.wka-l1 .wka-media{grid-column:1/8;grid-row:1}
.wka-l1 .wka-text{grid-column:8/13;grid-row:1;align-self:end}
.wka-l1 .wka-hl{font-size:clamp(28px,3vw,50px)}
.wka-l2 .wka-text{grid-column:2/11;grid-row:1;margin-bottom:clamp(36px,7vh,80px)}
.wka-l2 .wka-media{grid-column:5/13;grid-row:2}
/* layouts, vertical media */
.wka-v.wka-l0 .wka-media,.wka-v.wka-l2 .wka-media{grid-column:9/12;grid-row:1/3;align-self:center}
.wka-v.wka-l0 .wka-text,.wka-v.wka-l2 .wka-text{grid-column:1/8;grid-row:1;align-self:end;margin:0}
.wka-v.wka-l1 .wka-media{grid-column:2/5;grid-row:1}
.wka-v.wka-l1 .wka-text{grid-column:6/13;align-self:center}

/* text-only panel */
.wka-panel{container-type:inline-size;position:relative;display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:16/10;padding:clamp(18px,4cqw,44px);background:var(--pb);color:var(--pf)}
.wka-panel-name{font:400 13cqw/.88 "Bowlby One",sans-serif;letter-spacing:-.02em;text-wrap:balance}
.wka-panel-fact{display:flex;flex-direction:column;gap:.35em;max-width:80%}
.wka-panel-fact strong{font-weight:800;font-size:clamp(20px,4.6cqw,48px);line-height:1.02}
.wka-panel-fact span{font-size:clamp(14px,2cqw,20px);line-height:1.3}

/* reveal: a short rise, no fades on the media */
.wka-js .wka-text{transform:translateY(26px);opacity:0;transition:transform .7s cubic-bezier(.2,.7,.1,1),opacity .5s linear}
.wka-js .wka-in .wka-text{transform:none;opacity:1}

.wka-end{padding:clamp(60px,12vh,130px) 0 clamp(80px,14vh,140px);border-top:2px solid #0c0d0f;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:clamp(17px,1.4vw,21px)}
.wka-end a{font-weight:800;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}

/* project page */
.wka-page{position:fixed;inset:0;z-index:9;background:#c9d8f7;color:#0c0d0f;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .18s linear;--g:clamp(18px,1.7vw,28px);--accent:#1c3bb0}
.wka-page[hidden]{display:none}
.wka-page.wka-shown{opacity:1}
.wka-page *{box-sizing:border-box}
.wka-page a{color:inherit}
.wka-bar{display:flex;align-items:center;gap:10px 28px;min-height:78px;padding:18px calc(var(--g) + 170px) 14px var(--g);flex-wrap:wrap;font-size:16px;line-height:1.3}
.wka-back{font:800 16px/1 "Bricolage Grotesque",system-ui,sans-serif;color:#0c0d0f;background:none;border:0;padding:10px 0;cursor:pointer;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.wka-back:hover{color:var(--accent)}
.wka-back:focus-visible,.wka-page a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wka-line{display:flex;flex-wrap:wrap;gap:4px 22px}
.wka-line b{font-weight:800}
.wka-stage{padding:0 var(--g)}
.wka-stage .wka-big{width:100%;display:block;background:#0c0d0f}
.wka-big img,.wka-big video{display:block;width:100%;max-height:calc(100vh - 110px);object-fit:contain;margin:0 auto}
.wka-big.wka-bigv{background:#0c0d0f}
.wka-big.wka-bigv video,.wka-big.wka-bigv img{height:calc(100vh - 110px);width:auto;max-width:100%}
.wka-stage .wka-panel{aspect-ratio:16/7;max-height:calc(100vh - 110px)}
.wka-stage .wka-panel-name{font-size:10cqw}
.wka-body{display:grid;grid-template-columns:repeat(12,1fr);gap:0 var(--g);padding:clamp(48px,9vh,110px) var(--g) 0}
.wka-body h1{grid-column:1/13;grid-row:1;margin:0 0 clamp(28px,5vh,56px);font:400 clamp(44px,7vw,112px)/.9 "Bowlby One",sans-serif;letter-spacing:-.015em;color:var(--accent)}
.wka-facts{grid-column:1/5;grid-row:2;align-self:start;margin:0;display:flex;flex-direction:column;gap:18px;font-size:16px;line-height:1.35}
.wka-facts div{border-top:1.5px solid #0c0d0f;padding-top:10px}
.wka-facts dt{font-weight:500;opacity:.72}
.wka-facts dd{margin:2px 0 0;font-weight:800;font-size:19px}
.wka-copy{grid-column:6/13;grid-row:2;max-width:36em}
.wka-copy p{text-wrap:pretty;margin:0 0 1em;font-size:clamp(19px,1.55vw,24px);line-height:1.45}
.wka-copy .wka-lede{font-weight:800}
.wka-link{display:inline-block;margin-top:.4em;font-weight:800;font-size:clamp(19px,1.55vw,24px);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}
.wka-link:hover{color:var(--accent)}
.wka-gal{padding:clamp(60px,11vh,130px) var(--g) 0;columns:2;column-gap:var(--g)}
.wka-gal.wka-galv{columns:4}
.wka-gal img{display:block;width:100%;height:auto;margin:0 0 var(--g);break-inside:avoid;background:#b7c8ee}
.wka-next{display:block;margin:clamp(60px,11vh,130px) var(--g) 0;padding:clamp(28px,5vh,56px) 0 0;border-top:2px solid #0c0d0f;text-decoration:none}
.wka-next span{display:block;font-size:16px;margin-bottom:10px}
.wka-next strong{display:block;font:400 clamp(40px,6vw,96px)/.92 "Bowlby One",sans-serif;letter-spacing:-.015em}
.wka-next:hover strong{color:var(--accent)}

/* more work: a mixed-size grid of the other projects */
.wka-mw{margin:clamp(60px,10vh,110px) var(--g) 0;padding:clamp(28px,5vh,56px) 0 clamp(70px,14vh,140px);border-top:2px solid #0c0d0f}
.wka-mw h2{margin:0 0 clamp(22px,4vh,40px);font:400 clamp(40px,6vw,96px)/.92 "Bowlby One",sans-serif;letter-spacing:-.015em}
.wka-mwg{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:clamp(140px,13vw,230px);grid-auto-flow:dense;gap:var(--g)}
.wka-b{position:relative;display:block;text-decoration:none;color:#0c0d0f;perspective:1000px;grid-column:span var(--w,3);grid-row:span var(--h,1);outline:none;-webkit-tap-highlight-color:transparent}
.wka-b-in{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ly,0px));transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.wka-b.wka-hot .wka-b-in{--ly:-8px;transition:transform .12s linear}
.wka-b-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#b7c8ee}
.wka-b-face img,.wka-b-face video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.001);transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.wka-b-face video{opacity:0}
.wka-b-face video.wka-live{opacity:1}
.wka-b.wka-hot .wka-b-face img,.wka-b.wka-hot .wka-b-face video,.wka-b.wka-armed .wka-b-face img{transform:scale(1.06)}
.wka-b .wka-panel{position:absolute;inset:0;aspect-ratio:auto;padding:clamp(14px,6cqw,26px)}
.wka-b .wka-panel-name{font-size:clamp(22px,11cqw,60px)}
.wka-b .wka-panel-fact{max-width:90%}
.wka-b .wka-panel-fact strong{font-size:clamp(15px,4.4cqw,30px)}
.wka-b .wka-panel-fact span{font-size:13px}
.wka-b-back{transform:rotateY(180deg);background:var(--pb);color:var(--pf);display:flex;flex-direction:column;justify-content:space-between;padding:clamp(14px,1.4vw,24px);container-type:inline-size}
.wka-b-back strong{font:400 clamp(17px,7.5cqw,34px)/1.02 "Bowlby One",sans-serif;text-wrap:balance}
.wka-b-back span{font-weight:800;font-size:15px}
.wka-b.wka-flip .wka-b-in{transform:rotateY(180deg);transition:transform .55s cubic-bezier(.7,0,.2,1)}
.wka-b-clip{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ly,0px));transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.wka-b.wka-hot .wka-b-clip{--ly:-8px;transition:transform .12s linear}
.wka-b.wka-flip .wka-b-clip{opacity:0}
.wka-b-t{position:absolute;left:0;bottom:0;max-width:calc(100% - 20px);display:flex;flex-direction:column;gap:2px;padding:10px 14px 11px;background:#f1f2f0;color:#0c0d0f;transform:translateY(102%);transition:transform .32s cubic-bezier(.7,0,.2,1);z-index:2}
.wka-b-t b{font-weight:800;font-size:clamp(15px,1.15vw,18px);line-height:1.15}
.wka-b-t i{font-style:normal;font-size:13px;line-height:1.2}
.wka-b.wka-hot .wka-b-t,.wka-b.wka-armed .wka-b-t,.wka-b:focus-visible .wka-b-t{transform:none;transition-timing-function:cubic-bezier(.2,.8,.2,1)}
.wka-b:focus-visible .wka-b-in{outline:2px solid var(--accent);outline-offset:3px}
.wka-b-tick{position:absolute;left:0;right:0;top:0;height:3px;display:flex;gap:3px;padding:8px 8px 0;z-index:2;opacity:0;transition:opacity .2s linear}
.wka-b-tick i{flex:1;height:3px;background:rgba(241,242,240,.45)}
.wka-b-tick i.on{background:#f1f2f0}
.wka-b.wka-hot .wka-b-tick,.wka-b.wka-armed .wka-b-tick{opacity:1}
@media (max-width:820px){
  .wka-mwg{grid-template-columns:repeat(2,1fr);grid-auto-rows:44vw;gap:12px}
  .wka-b{grid-column:span var(--pw,1);grid-row:span var(--ph,1)}
}
@media (prefers-reduced-motion:reduce){
  .wka-b-in,.wka-b.wka-hot .wka-b-in,.wka-b.wka-flip .wka-b-in{transition:none}
  .wka-b-t,.wka-b-face img,.wka-b-face video{transition:none}
  .wka-b.wka-hot .wka-b-face img,.wka-b.wka-hot .wka-b-face video,.wka-b.wka-armed .wka-b-face img{transform:none}
}

/* contact button stays readable over the off-white */
html.wka-ink #cbtn{background:#0c0d0f;color:#f1f2f0;box-shadow:0 0 0 1.5px #f1f2f0;transition:background-color .25s,color .25s}
html.wka-ink #cmsg{background:#0c0d0f;color:#f1f2f0}
html.wka-lock,html.wka-lock body{overflow:hidden!important}

@media (max-width:820px){
  .wka-wing{padding-top:72px}
  .wka-wing h2{grid-column:1/13}
  .wka-wing p{grid-column:1/13;justify-self:start;text-align:left;margin-top:14px}
  .wka-row{min-height:0;padding:44px 0 52px;display:flex;flex-direction:column}
  .wka-row .wka-media{width:100%;order:1}
  .wka-row .wka-tm{aspect-ratio:4/3}
  .wka-row .wka-text{order:2;margin:24px 0 0!important}
  .wka-row.wka-l1 .wka-media{width:86%}
  .wka-row.wka-l2 .wka-media{width:86%;align-self:flex-end}
  .wka-v .wka-media{width:62%!important;align-self:flex-start}
  .wka-v.wka-l1 .wka-media{align-self:flex-end}
  .wka-hl{font-size:clamp(27px,7.6vw,40px);line-height:1.02}
  .wka-tm .wka-panel-name{font-size:14cqw}
  .wka-bar{padding:16px 150px 12px var(--g);min-height:0}
  .wka-line{flex-basis:100%;padding-right:0;margin-right:-130px;font-size:15px}
  .wka-big img,.wka-big video{max-height:none}
  .wka-big.wka-bigv video,.wka-big.wka-bigv img{height:auto;width:100%;max-height:78vh;object-fit:contain}
  .wka-stage .wka-panel{aspect-ratio:4/5}
  .wka-stage .wka-panel-name{font-size:16cqw}
  .wka-body{display:block}
  .wka-copy{margin-bottom:36px}
  .wka-gal{columns:1}
  .wka-gal.wka-galv{columns:2}
}
@media (prefers-reduced-motion:reduce){
  .wka-js .wka-text{transform:none;opacity:1;transition:none}
  .wka-page{transition:none}
  .wka-media video{transition:none}
}
`;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = p => BASE + p;
/* first sentence is the headline, the rest sits under it */
function split(line) {
  const parts = String(line).split(/(?<=[.!?]["”]?)\s+(?=[A-Z0-9"“])/);
  return { first: parts[0], rest: parts.slice(1).join(' ') };
}
const fact = (p, label) => (p.facts || []).find(f => f.label.toLowerCase() === label);
function panelFact(p) {
  const skip = new Set(['kind', 'status', 'role', 'year', 'work', 'format']);
  return (p.facts || []).find(f => !skip.has(f.label.toLowerCase())) || (p.facts || [])[0];
}
function host(link) {
  try { const u = new URL(link); return (u.host.replace(/^www\./, '') + u.pathname).replace(/\/$/, ''); } catch { return link; }
}
const vertical = p => p.orientation === 'vertical';

let projects = [];
let byId = new Map();
let page, listObserver, videoObserver, lastFocus = null, openId = null;

function panelHTML(p, i) {
  const c = PANELS[i % PANELS.length];
  const f = panelFact(p);
  return `<span class="wka-panel" style="--pb:${c.bg};--pf:${c.fg}">
    <span class="wka-panel-name">${esc(p.name)}</span>
    ${f ? `<span class="wka-panel-fact"><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></span>` : ''}
  </span>`;
}

function mediaHTML(p) {
  const poster = p.hero ? url(p.hero) : '';
  const img = poster ? `<img src="${poster}" alt="" loading="lazy" decoding="async">` : '';
  const vid = p.video ? `<video muted loop playsinline preload="none" data-src="${url(p.video)}" aria-hidden="true"></video>` : '';
  return `<span class="wka-media">${img}${vid}</span>`;
}

function rowHTML(p, i, panelIndex) {
  const { first, rest } = split(p.one_line);
  const textOnly = TEXT_ONLY.has(p.id) || !p.hero;
  const cls = ['wka-row', `wka-l${i % 3}`, !textOnly && vertical(p) ? 'wka-v' : ''].join(' ');
  return `<a class="${cls}" href="#work/${esc(p.id)}" data-id="${esc(p.id)}">
    ${textOnly ? `<span class="wka-media wka-tm">${panelHTML(p, panelIndex)}</span>` : mediaHTML(p)}
    <span class="wka-text">
      <span class="wka-hl" role="heading" aria-level="3"><b>${esc(p.name)}.</b> ${esc(first)}</span>
      ${rest ? `<span class="wka-sub">${esc(rest)}</span>` : ''}
      <span class="wka-more">Open ${esc(p.name)}</span>
    </span>
  </a>`;
}

function buildList() {
  let html = `<div class="wka">
    <header class="wka-head">
      <h2 class="wka-title">The work</h2>
      <nav class="wka-jump" aria-label="Work by wing">
        ${WINGS.map(w => `<a href="#${w.id}">${w.title.replace('.', '')}</a>`).join('')}
      </nav>
    </header>`;
  let i = 0, panelIndex = 0;
  for (const w of WINGS) {
    const list = projects.filter(p => p.wing === w.key);
    if (!list.length) continue;
    html += `<div class="wka-wing" id="${w.id}"><h2>${w.title}</h2><p>${NUM[list.length] || list.length} ${list.length === 1 ? 'project' : 'projects'}</p></div>`;
    for (const p of list) {
      const textOnly = TEXT_ONLY.has(p.id) || !p.hero;
      html += rowHTML(p, i++, panelIndex);
      if (textOnly) panelIndex++;
    }
  }
  html += `<footer class="wka-end"><span>${projects.length} projects in all.</span><a href="#work">Back to the top of the work</a></footer></div>`;
  ROOT.innerHTML = html;
  ROOT.querySelector('.wka').classList.toggle('wka-js', !RM.matches);
  ROOT.querySelector('.wka-end a').addEventListener('click', e => { e.preventDefault(); ROOT.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth' }); });
  ROOT.querySelectorAll('.wka-jump a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth' });
  }));
  ROOT.querySelectorAll('.wka-row').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    lastFocus = a;
    history.pushState({ wka: 1 }, '', `#work/${a.dataset.id}`);
    route();
  }));
  // reveal headlines as rows arrive
  listObserver = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('wka-in'); listObserver.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  ROOT.querySelectorAll('.wka-row').forEach(r => listObserver.observe(r));
  // list videos: load and play only while in view, never under reduced motion
  videoObserver = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !RM.matches && !openId) playVideo(v);
    else v.pause();
  }), { threshold: 0.35 });
  ROOT.querySelectorAll('.wka-media video').forEach(v => videoObserver.observe(v));
}

function playVideo(v) {
  if (!v.src) { v.src = v.dataset.src; v.addEventListener('playing', () => v.classList.add('wka-live'), { once: true }); }
  const pr = v.play(); if (pr) pr.catch(() => {});
}

/* the Contact button is off-white on the landing; over this off-white section it turns black */
function watchInk() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    ROOT.dataset.wkaTop = e.isIntersecting ? '1' : '';
    syncInk();
  }), { rootMargin: '0px 0px -94% 0px' });
  io.observe(ROOT);
}
function syncInk() {
  document.documentElement.classList.toggle('wka-ink', !!openId || ROOT.dataset.wkaTop === '1');
}

function pageHTML(p) {
  const w = WINGS.find(x => x.key === p.wing);
  const textOnly = TEXT_ONLY.has(p.id) || !p.hero;
  const role = fact(p, 'role');
  const who = fact(p, 'client') || (role && role.value.length <= 28 ? role : null) || fact(p, 'kind') || fact(p, 'work') || fact(p, 'format');
  let big;
  if (textOnly) {
    big = panelHTML(p, projects.filter(x => TEXT_ONLY.has(x.id) || !x.hero).indexOf(p));
  } else if (p.video) {
    big = `<div class="wka-big ${vertical(p) ? 'wka-bigv' : ''}"><video src="${url(p.video)}" poster="${url(p.hero)}" muted loop playsinline controls ${RM.matches ? 'preload="metadata"' : 'autoplay'}></video></div>`;
  } else {
    big = `<div class="wka-big ${vertical(p) ? 'wka-bigv' : ''}"><img src="${url(p.hero)}" alt="${esc(p.name)}"></div>`;
  }
  const gallery = textOnly ? [] : (p.gallery || []).filter(g => g !== p.hero);
  const facts = (p.facts || []).map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
  const copy = (p.writeup || []).map(t => `<p>${esc(t)}</p>`).join('');
  const link = p.link ? `<a class="wka-link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(host(p.link))}</a>` : '';
  const idx = projects.indexOf(p), next = projects[(idx + 1) % projects.length];
  return `
    <div class="wka-bar">
      <button class="wka-back" type="button">Back to the work</button>
      <span class="wka-line"><b>${esc(p.name)}</b><span>${w ? w.short : ''}</span>${who ? `<span>${esc(who.value)}</span>` : ''}</span>
    </div>
    <div class="wka-stage">${big}</div>
    <div class="wka-body">
      <h1>${esc(p.name)}</h1>
      <div class="wka-copy"><p class="wka-lede">${esc(p.one_line)}</p>${copy}${link}</div>
      <dl class="wka-facts">${facts}</dl>
    </div>
    ${gallery.length ? `<div class="wka-gal ${vertical(p) ? 'wka-galv' : ''}">${gallery.map(g => `<img src="${url(g)}" alt="" loading="lazy" decoding="async">`).join('')}</div>` : ''}
    <a class="wka-next" href="#work/${esc(next.id)}" data-id="${esc(next.id)}"><span>Next project</span><strong>${esc(next.name)}</strong></a>
    ${moreHTML(p)}`;
}


/* more work grid: desktop spans [cols, rows], phone spans [cols, rows] */
const SPANS = [[6, 2], [3, 1], [3, 1], [3, 1], [3, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 1], [3, 2], [3, 1], [6, 1], [3, 1]];
function frames(p) {
  if (TEXT_ONLY.has(p.id) || !p.hero) return [];
  return [p.hero, ...(p.gallery || []).filter(g => g !== p.hero)].slice(0, 6);
}
function blockHTML(p, i) {
  const [w, h] = SPANS[i % SPANS.length];
  const ph = i % 5 === 0 ? 2 : 1, pw = i % 5 === 0 ? 2 : 1;
  const wing = WINGS.find(x => x.key === p.wing);
  const textOnly = TEXT_ONLY.has(p.id) || !p.hero;
  const c = PANELS[i % PANELS.length];
  const fr = frames(p);
  let front;
  if (textOnly) front = `<span class="wka-b-face" style="container-type:inline-size">${panelHTML(p, i)}</span>`;
  else front = `<span class="wka-b-face"><img src="${url(p.hero)}" alt="" loading="lazy" decoding="async">${p.video ? `<video muted loop playsinline preload="none" data-src="${url(p.video)}"></video>` : ''}</span>`;
  const ticks = !textOnly && !p.video && fr.length > 1 ? `<span class="wka-b-tick" aria-hidden="true">${fr.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</span>` : '';
  const back = `<span class="wka-b-face wka-b-back" style="--pb:${c.bg};--pf:${c.fg}"><strong>${esc(split(p.one_line).first)}</strong><span>Tap again to open</span></span>`;
  return `<a class="wka-b" href="#work/${esc(p.id)}" data-id="${esc(p.id)}" data-frames="${esc(JSON.stringify(fr))}" style="--w:${w};--h:${h};--pw:${pw};--ph:${ph}">
    <span class="wka-b-in">${front}${textOnly ? back : ''}</span>${ticks}
    <span class="wka-b-clip"><span class="wka-b-t"><b>${esc(p.name)}</b><i>${wing ? wing.short : ''}</i></span></span>
  </a>`;
}
function moreHTML(p) {
  const others = projects.filter(x => x !== p);
  return `<section class="wka-mw" aria-label="More work"><h2>More work</h2><div class="wka-mwg">${others.map(blockHTML).join('')}</div></section>`;
}

let armed = null, lastPointer = 'mouse';
function blockVideo(b) { return b.querySelector('video'); }
function startPreview(b, cycle) {
  const v = blockVideo(b);
  if (v && !RM.matches) {
    if (!v.src) { v.src = v.dataset.src; v.addEventListener('playing', () => v.classList.add('wka-live'), { once: true }); }
    const pr = v.play(); if (pr) pr.catch(() => {});
  }
  const fr = JSON.parse(b.dataset.frames || '[]');
  fr.slice(1).forEach(f => { const im = new Image(); im.src = url(f); });
  if (cycle && !v && fr.length > 1 && !RM.matches) {
    let k = 0;
    b._cyc = setInterval(() => { k = (k + 1) % fr.length; showFrame(b, k); }, 650);
  }
}
function stopPreview(b) {
  const v = blockVideo(b); if (v) v.pause();
  clearInterval(b._cyc); b._cyc = null;
  showFrame(b, 0);
  b.style.removeProperty('--rx'); b.style.removeProperty('--ry');
}
function showFrame(b, k) {
  const fr = JSON.parse(b.dataset.frames || '[]');
  if (!fr.length || b._k === k) return;
  b._k = k;
  const img = b.querySelector('.wka-b-face img'); if (img) img.src = url(fr[k]);
  b.querySelectorAll('.wka-b-tick i').forEach((t, j) => t.classList.toggle('on', j === k));
}
function disarm() {
  if (!armed) return;
  armed.classList.remove('wka-armed', 'wka-flip');
  stopPreview(armed);
  armed = null;
}
function wireMore(el) {
  const grid = el.querySelector('.wka-mwg'); if (!grid) return;
  grid.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; });
  grid.querySelectorAll('.wka-b').forEach(b => {
    b.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      b.classList.add('wka-hot'); startPreview(b, false);
    });
    b.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      if (!RM.matches) {
        b.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
        b.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
      }
      const n = JSON.parse(b.dataset.frames || '[]').length;
      if (n > 1 && !blockVideo(b)) showFrame(b, Math.min(n - 1, Math.floor(x * n)));
    });
    b.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      b.classList.remove('wka-hot'); stopPreview(b);
    });
    b.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const touch = lastPointer === 'touch' || lastPointer === 'pen';
      if (touch && armed !== b) {
        disarm();
        armed = b;
        b.classList.add('wka-armed');
        if (b.querySelector('.wka-b-back')) b.classList.add('wka-flip');
        else startPreview(b, true);
        return;
      }
      disarm();
      history.replaceState(history.state, '', `#work/${b.dataset.id}`);
      route();
    });
  });
}

function ensurePage() {
  if (page) return page;
  page = document.createElement('div');
  page.className = 'wka-page';
  page.id = 'wka-page';
  page.hidden = true;
  page.setAttribute('role', 'dialog');
  page.setAttribute('aria-modal', 'true');
  document.body.appendChild(page);
  page.addEventListener('click', e => {
    if (e.target.closest('.wka-back')) { e.preventDefault(); close(); return; }
    const nx = e.target.closest('.wka-next');
    if (nx && !(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      history.replaceState(history.state, '', `#work/${nx.dataset.id}`);
      route();
    }
  });
  return page;
}

function open(id) {
  const p = byId.get(id); if (!p) return;
  const el = ensurePage();
  const first = !openId;
  openId = id;
  stopPageMedia();
  armed = null;
  el.innerHTML = pageHTML(p);
  wireMore(el);
  el.setAttribute('aria-label', p.name);
  ROOT.querySelectorAll('.wka-media video').forEach(v => v.pause());
  if (first) {
    el.hidden = false;
    document.documentElement.classList.add('wka-lock');
    requestAnimationFrame(() => el.classList.add('wka-shown'));
  }
  el.scrollTop = 0;
  if (!lastFocus) lastFocus = ROOT.querySelector(`.wka-row[data-id="${CSS_ESC(id)}"]`);
  syncInk();
  el.querySelector('.wka-back').focus({ preventScroll: true });
}
const CSS_ESC = s => (window.CSS && CSS.escape ? CSS.escape(s) : s);

function stopPageMedia() {
  if (!page) return;
  page.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
}

function hide() {
  if (!openId) return;
  const id = openId;
  openId = null;
  stopPageMedia();
  page.classList.remove('wka-shown');
  page.hidden = true;
  page.innerHTML = '';
  document.documentElement.classList.remove('wka-lock');
  syncInk();
  const row = lastFocus || ROOT.querySelector(`.wka-row[data-id="${CSS_ESC(id)}"]`);
  lastFocus = null;
  if (row) {
    const r = row.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) row.scrollIntoView({ block: 'center' });
    row.focus({ preventScroll: true });
  }
  // wake any list video now in view
  ROOT.querySelectorAll('.wka-media video').forEach(v => { videoObserver.unobserve(v); videoObserver.observe(v); });
}

/* close: step back if we pushed the entry, otherwise just drop the hash */
function close() {
  if (history.state && history.state.wka) history.back();
  else { history.replaceState(null, '', location.pathname + location.search + '#work'); route(); }
}

function route() {
  const m = location.hash.match(/^#work\/([\w-]+)$/);
  if (m && byId.has(m[1])) open(m[1]);
  else hide();
}

async function load(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`work-a: ${path} ${r.status}`);
  return r.json();
}

async function init() {
  if (!ROOT) return;
  const style = document.createElement('style');
  style.id = 'wka-style';
  style.textContent = CSS;
  document.head.appendChild(style);
  try {
    const [sw, media] = await Promise.all([load('software/manifest.json'), load('media/manifest.json')]);
    projects = [...media, ...sw].filter(p => !HIDE.has(p.id));
    // order by wing as the list shows it
    projects = WINGS.flatMap(w => projects.filter(p => p.wing === w.key));
  } catch (err) {
    console.warn(err);
    ROOT.innerHTML = '<div class="wka"><header class="wka-head"><h2 class="wka-title">The work</h2></header></div>';
    return;
  }
  byId = new Map(projects.map(p => [p.id, p]));
  buildList();
  watchInk();
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  addEventListener('keydown', e => { if (e.key === 'Escape' && openId) { e.preventDefault(); close(); } });
  route();
}

init();
