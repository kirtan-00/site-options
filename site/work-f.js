/* Work, version F: Film Strip. The grid is version C's, untouched (frosted cards, blur on hover, Software / Media
   tabs, #work/<id> routing). Only the project page is new: one horizontal run that reads like a film's credits.
   1. Credit: the title in the project's own face, then its facts beside the writeup.
   2. Player: the film on navy in a palette player (scrubber, play, sound, full screen). Phone-ratio films sit
      two or three side by side. Software shows its screen recording, else the hero screen in a plain frame.
   3. Stills: every gallery image, in columns of one, two or three, labelled Stills or Screens.
   4. Credits roll: facts as role and value, plus links.  5. Next: heavy, ink, with the next film looping.
   Text-only work (screens withheld, or no media) opens on a navy title card and sets real writeup sentences as notes.
   Progress is a film edge: every frame of the run carries sprocket holes, its number and its name along the bottom,
   and the frame you are on gets a notch. Each project sets its titles in its own display face (TYPE, below).

   Optional manifest fields, read when present (nothing here invents a value; every one falls back):
     client: "Name"                         else a facts entry labelled Client or Clients, else left out
     year: "2026"                           else a facts entry labelled Year
     links:  [{ label, url }]               added after `link`
     videos: [{ src, poster, orientation, caption }]
                                            else `video` (media: one <shoot>-loop.mp4 per shoot in the gallery)
                                            orientation "vertical" or "portrait" makes it a phone-ratio player
     stills: [{ section, src, caption }]    else `gallery`, all of it; section defaults to Stills or Screens
     credits:[{ role, name }]               shown above the facts in the credits roll
     stats:  software { visitors }          media { views, shares, likes }; numbers are set as 1.2M / 340K,
                                            strings are shown as written. Missing: 000 and "number to come".
                                            Media views fall back to a facts entry labelled Views.
     brands: ["Name", ...]                  media only; else a facts entry labelled Clients, else "List to come"
   Paths are relative to the content folder, like the rest of the manifest.
   Fills <section id="work">. The grid keeps its wkc- names; everything on the project page starts with wkf-. */

const ROOT = document.getElementById('work');
const BASE = (window.KP && window.KP.content) || '../content/';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const HOVER = matchMedia('(hover: hover) and (pointer: fine)');
const HIDE = new Set(['gujarat-titans']);
const TEXT_ONLY = new Set(['clapper', 'fitkit', 'fourside-studios', 'palladium', 'dvc']);

const INK = '#0c0d0f', PAPER = '#f1f2f0', BLUE = '#c9d8f7', PINK = '#f2a7b6', SKY = '#7d9bf0', COBALT = '#1c3bb0', NAVY = '#0f2545';
const WING = {
  // fields stay in the ground's own family: blue and pink never blur into each other (that reads violet)
  software: { title: 'Software', sub: 'Things I designed and built.', ground: BLUE, field: [SKY, PAPER], plates: [[BLUE, SKY, PAPER], [SKY, BLUE, PAPER]] },
  media: { title: 'Media', sub: 'Films and reels I produced, shot and cut.', ground: PINK, field: [PAPER, PAPER], plates: [[PINK, PAPER, PAPER], [PAPER, PINK, PINK]] },
};
/* ---------- type for the project pages (the grid keeps the site's Bowlby One and Bricolage) ----------
   One calm text face for every page, and a display face per project, picked for what the project is.
   q: Google Fonts css2 family query   f: CSS family   w: weight   s: size factor against Gloock
   t: tracking   x: font-stretch   long: false when the face is too loud to set a whole sentence in
   Only the face the open project needs (and the one its Next panel names) is fetched. */
const FT = '"Hanken Grotesk",system-ui,sans-serif';
const FONT_TEXT = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=swap';
const TYPE = {
  spectra:            { q: 'Marcellus', f: '"Marcellus",Georgia,serif', w: 400, s: .9, t: '-.01em' },
  sorted:             { q: 'Funnel+Display:wght@700', f: '"Funnel Display",system-ui,sans-serif', w: 700, s: .92, t: '-.04em' },
  cravache:           { q: 'Silkscreen', f: '"Silkscreen",monospace', w: 400, s: .62, t: '0em', long: false },
  deepdive:           { q: 'Rozha+One', f: '"Rozha One",Georgia,serif', w: 400, s: .95, t: '-.02em' },
  'deepdive-blog':    { q: 'Newsreader:opsz,wght@72,500', f: '"Newsreader",Georgia,serif', w: 500, s: 1, t: '-.025em' },
  sportified:         { q: 'Big+Shoulders+Display:wght@800', f: '"Big Shoulders Display",system-ui,sans-serif', w: 800, s: 1.12, t: '-.01em' },
  'vibe-raas-led':    { q: 'Doto:wght@900', f: '"Doto",system-ui,sans-serif', w: 900, s: .8, t: '-.02em', long: false },
  'vibe-raas-tickets':{ q: 'Alfa+Slab+One', f: '"Alfa Slab One",Georgia,serif', w: 400, s: .78, t: '-.01em' },
  clapper:            { q: 'Sofia+Sans+Extra+Condensed:wght@800', f: '"Sofia Sans Extra Condensed",system-ui,sans-serif', w: 800, s: 1.22, t: '-.005em' },
  fitkit:             { q: 'Archivo:wdth,wght@125,800', f: '"Archivo",system-ui,sans-serif', w: 800, s: .74, t: '-.03em', x: '125%' },
  'fourside-studios': { q: 'Young+Serif', f: '"Young Serif",Georgia,serif', w: 400, s: .86, t: '-.02em' },
  zepto:              { q: 'Dela+Gothic+One', f: '"Dela Gothic One",system-ui,sans-serif', w: 400, s: .76, t: '-.02em' },
  palladium:          { q: 'Bodoni+Moda:opsz,wght@96,600', f: '"Bodoni Moda",Georgia,serif', w: 600, s: .96, t: '-.03em' },
  'crav-social':      { q: 'Shrikhand', f: '"Shrikhand",Georgia,serif', w: 400, s: .84, t: '-.01em' },
  dvc:                { q: 'Gloock', f: '"Gloock",Georgia,serif', w: 400, s: 1, t: '-.03em' },
};
const TYPE_FALLBACK = { q: 'Gloock', f: '"Gloock",Georgia,serif', w: 400, s: 1, t: '-.03em' };
const typeOf = (id) => TYPE[id] || TYPE_FALLBACK;
function needFace(t) {                                  // one <link> per family, so a bad query can never take the others down
  const id = 'wkf-face-' + t.q.replace(/[^a-z0-9]/gi, '');
  if (!document.getElementById(id)) { const lk = el('link'); lk.id = id; lk.rel = 'stylesheet'; lk.href = `https://fonts.googleapis.com/css2?family=${t.q}&display=swap`; document.head.appendChild(lk); }
  return document.fonts && document.fonts.load ? document.fonts.load(`${t.w} 80px ${t.f}`).catch(() => {}) : Promise.resolve();
}
function faceVars(node, t) {
  node.style.setProperty('--fd', t.f); node.style.setProperty('--fdw', t.w); node.style.setProperty('--fds', t.s);
  node.style.setProperty('--fdt', t.t); node.style.setProperty('--fdx', t.x || '100%');
  node.style.setProperty('--fl', t.long === false ? FT : t.f); node.style.setProperty('--fls', t.long === false ? 1 : t.s);
}
const ARRIVE = 'cubic-bezier(.2,.8,.2,1)', MOVE = 'cubic-bezier(.7,0,.2,1)', LEAVE = 'cubic-bezier(.6,0,.85,.3)';

const CSS = `
#work{position:relative;background:var(--wkc-ground,${BLUE});color:${INK};transition:background-color .76s ${MOVE}}
.wkc{--arrive:${ARRIVE};--move:${MOVE};--leave:${LEAVE};--gut:clamp(18px,4vw,64px);position:relative;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;padding-bottom:clamp(70px,12vh,140px)}
.wkc *,.wkc-page *{box-sizing:border-box}
:where(.wkc,.wkc-page) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.wkc :focus-visible,.wkc-page :focus-visible{outline:2px solid ${COBALT};outline-offset:3px}

/* frosted glass, from the flight build, tinted for the light blue and pink grounds */
.wkc-glass{position:relative;isolation:isolate;background:linear-gradient(135deg,rgba(255,255,255,.58),rgba(241,242,240,.30));
  -webkit-backdrop-filter:blur(14px) saturate(1.5) brightness(1.04);backdrop-filter:blur(14px) saturate(1.5) brightness(1.04);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -10px 16px -10px rgba(15,37,69,.22),inset 0 0 0 1px rgba(255,255,255,.42),0 10px 28px -14px rgba(15,37,69,.42)}
.wkc-glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;opacity:.7;mix-blend-mode:screen;
  background:linear-gradient(105deg,transparent 18%,rgba(255,255,255,.55) calc(42% + var(--gv,0) * 38%),transparent calc(64% + var(--gv,0) * 38%))}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.wkc-glass{background:rgba(241,242,240,.9)}}

/* the ground behind the grid: flat, plus the hovered project blurred, so the glass has something to frost */
.wkc-bg{position:absolute;inset:0;overflow:clip;pointer-events:none;z-index:0}
.wkc-bgs{position:relative;height:100vh;height:100svh;will-change:transform}
/* project imagery goes in as tone only (grey, multiplied into the ground), so a photo never drags a foreign colour onto the page */
.wkc-bgi{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(38px) grayscale(1) contrast(1.1);mix-blend-mode:multiply;transform:scale(1.1);opacity:0;transition:opacity .48s ${ARRIVE}}
.wkc-bgi.wkc-on{opacity:.5}

.wkc-top{position:relative;top:0;z-index:5;will-change:transform;display:flex;align-items:center;gap:16px;padding:18px var(--gut);
  background:color-mix(in srgb,var(--wkc-ground,${BLUE}) 72%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.wkc-tabs{position:relative;display:flex;border-radius:28px;padding:5px}
.wkc-tabs button{position:relative;z-index:1;height:44px;padding:0 24px;border-radius:22px;font:400 19px/1 "Bowlby One",sans-serif;transition:color .24s ${ARRIVE}}
.wkc-tabs button.wkc-on{color:${PAPER}}
.wkc-ind{position:absolute;z-index:0;top:5px;left:5px;height:44px;border-radius:22px;background:${COBALT};transition:transform .48s ${MOVE},width .48s ${MOVE}}

.wkc-head{position:relative;z-index:1;padding:clamp(26px,5vw,70px) var(--gut) clamp(18px,3vw,40px);display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.wkc-title{margin:0;font:400 clamp(44px,10.6vw,190px)/.86 "Bowlby One",sans-serif;letter-spacing:-.01em;white-space:nowrap}
.wkc-title .wkc-l{display:inline-block;transition:transform .48s ${ARRIVE},color .24s}
.wkc-title .wkc-l.wkc-pop{transform:translateY(-.06em) rotate(var(--r,0deg)) scale(1.05);transition:transform .12s ${ARRIVE},color .05s}
.wkc-head p{margin:0 0 8px;max-width:30ch;font-size:clamp(17px,1.4vw,20px);line-height:1.45}

.wkc-grid{position:relative;z-index:1;padding:0 var(--gut);display:flex;flex-direction:column;gap:clamp(14px,1.6vw,26px)}
.wkc-row{display:flex;gap:clamp(14px,1.6vw,26px)}
.wkc-card{flex:1 1 0;min-width:0;display:block;padding:10px 10px 20px;border-radius:30px;transition:flex-grow .24s ${ARRIVE},transform .24s ${ARRIVE};opacity:0;transform:translateY(28px)}
.wkc-card.wkc-in{opacity:1;transform:none;transition:flex-grow .24s ${ARRIVE},opacity .76s ${ARRIVE} var(--d,0ms),transform .76s ${ARRIVE} var(--d,0ms)}
.wkc-card.wkc-ghost{visibility:hidden}
.wkc-m{position:relative;height:clamp(220px,25vw,400px);border-radius:22px;overflow:hidden;background:${NAVY};transform:translateZ(0)}
.wkc-m>img,.wkc-m>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wkc-m>img,.wkc-m>.wkc-ph{transition:transform .76s ${ARRIVE},filter .24s ${ARRIVE}}
.wkc-card h3{margin:16px 10px 6px;font:400 clamp(24px,2.3vw,40px)/1 "Bowlby One",sans-serif;letter-spacing:-.005em;text-wrap:balance;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wkc-card p{margin:0 10px;line-height:1.45;font-size:clamp(15px,1.1vw,17px);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:52ch}

/* text-only work: a frosted plate over two fields of colour, never a broken image */
.wkc-ph{position:absolute;inset:0;overflow:hidden;background:var(--wkc-p0,${BLUE})}
.wkc-ph i{position:absolute;border-radius:50%}
.wkc-ph i:nth-child(1){width:70%;aspect-ratio:1;left:-14%;top:-22%;background:var(--wkc-p1,${PINK})}
.wkc-ph i:nth-child(2){width:58%;aspect-ratio:1;right:-12%;bottom:-30%;background:var(--wkc-p2,${SKY})}
.wkc-ph .wkc-plate{position:absolute;inset:14px;border-radius:16px;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(14px,1.6vw,22px)}
.wkc-ph strong{display:block;font:400 clamp(28px,3.2vw,52px)/.92 "Bowlby One",sans-serif;color:${INK};letter-spacing:-.01em;overflow-wrap:anywhere}
.wkc-ph small{display:block;margin-top:8px;font-size:clamp(14px,1.05vw,16px);color:${COBALT};font-weight:800}

/* hover chips: Open, top left; what it is, bottom left */
.wkc-chip{position:absolute;z-index:2;font-size:14px;line-height:1.2;color:${INK};padding:8px 13px;border-radius:99px;opacity:0;transition:opacity .24s ${ARRIVE},transform .24s ${ARRIVE};pointer-events:none}
.wkc-open{left:14px;top:14px;transform:scale(.6);transform-origin:left top;background:${COBALT};color:${PAPER};font-weight:800;box-shadow:none}
.wkc-what{left:14px;bottom:14px;max-width:calc(100% - 28px);transform:translateY(8px)}

@media (hover:hover) and (pointer:fine){
  .wkc-row:hover .wkc-card{flex-grow:.82}
  .wkc-row .wkc-card:hover{flex-grow:1.5}
  .wkc-card:hover .wkc-m>img,.wkc-card:hover .wkc-m>.wkc-ph{transform:scale(1.05)}
  .wkc-card:hover .wkc-open{opacity:1;transform:none}
  .wkc-card:hover .wkc-what{opacity:1;transform:none}
  /* the blur: everything you are not pointing at goes soft, the card you point at pulls into focus */
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>img,.wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>.wkc-ph{filter:blur(8px) saturate(.9)}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) :is(h3,p){opacity:.55;transition:opacity .24s ${ARRIVE}}
  .wkc-card:hover .wkc-m>img,.wkc-card:hover .wkc-m>.wkc-ph{animation:wkc-pull .6s ${ARRIVE}}
}
@keyframes wkc-pull{from{filter:blur(10px)}to{filter:blur(0)}}
@media (max-width:820px){
  .wkc-top{padding:12px 16px}
  .wkc-tabs button{height:40px;padding:0 18px;font-size:17px}.wkc-ind{height:40px}
  .wkc-head{display:block;padding:26px 16px 18px}.wkc-head p{margin-top:14px}
  .wkc-grid{padding:0 16px;gap:22px}.wkc-row{flex-direction:column;gap:22px}
  .wkc-card.wkc-ghost{display:none}
  .wkc-m{height:62vw}
  }
@media (prefers-reduced-motion:reduce){
  .wkc-card,.wkc-card.wkc-in{opacity:1;transform:none;transition:none}
  .wkc *,.wkc-page *{animation:none!important;transition-duration:.01ms!important}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>*,.wkc-mw .wkc-m>*{filter:none!important}
}

/* ---------- the project page, version F: Film Strip. One horizontal run: credit, player, numbers, stills, credits, next ---------- */
html.wkf-lock,html.wkf-lock body{overflow:hidden!important}
.wkf-page{position:fixed;inset:0;z-index:9;overflow:hidden;background:var(--wkf-ground,${BLUE});color:${INK};font-family:${FT};font-weight:400;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  visibility:hidden;transform:translateY(100%);overscroll-behavior:none;user-select:none;-webkit-user-select:none;
  --fd:"Gloock",Georgia,serif;--fdw:400;--fds:1;--fdt:-.03em;--fdx:100%;--fl:var(--fd);--acc:${COBALT};
  --gut:clamp(20px,3.4vw,56px);--top:clamp(78px,10.5vh,100px);--bot:clamp(72px,10vh,90px);--lab:0px;--gap:clamp(8px,.8vw,12px);
  --t-s:15px;--t-m:17px}
.wkf-page *{box-sizing:border-box}
:where(.wkf-page) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.wkf-page a{color:inherit}
.wkf-page :focus-visible{outline:2px solid currentColor;outline-offset:3px}
.wkf-page.wkf-on{visibility:visible;transform:none;transition:transform .76s ${MOVE}}
.wkf-page.wkf-out{visibility:visible;transform:translateY(100%);transition:transform .42s ${LEAVE}}
.wkf-sc{position:absolute;inset:0;overflow:hidden;touch-action:pan-x}
.wkf-sc.wkf-native{overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.wkf-sc.wkf-native::-webkit-scrollbar{display:none}
.wkf-sc.wkf-drag{cursor:grabbing}
.wkf-track{display:flex;height:100%;width:max-content;will-change:transform;transition:opacity .24s ${ARRIVE}}
.wkf-track.wkf-swap{opacity:0;transition:opacity .24s ${LEAVE}}
.wkf-pn{flex:0 0 auto;position:relative;height:100%;padding:var(--top) var(--gut) var(--bot);display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;scroll-snap-align:start}

/* the display face is the project's own; set by TYPE at the top of the file */
.wkf-d{font-family:var(--fd);font-weight:var(--fdw);font-stretch:var(--fdx);letter-spacing:var(--fdt);font-synthesis:none}

/* the credit: title, one rule, then a two-column block: the facts on the left, the writeup on a 33em measure */
.wkf-hd,.wkf-tc{min-width:min(100vw,max(62vw,640px))}
.wkf-h1{margin:0 0 .1em -.04em;font-size:calc(min(11.5vw,19vh,184px) * var(--fds));line-height:.9;max-width:11ch;text-wrap:balance}
.wkf-hb{display:grid;grid-template-columns:minmax(9em,13em) auto;column-gap:clamp(28px,3.6vw,64px);align-items:start;margin-top:min(2.8vh,24px);padding-top:min(2.4vh,20px);border-top:1px solid currentColor}
.wkf-meta{margin:0;display:grid;align-content:start;row-gap:14px;font-size:var(--t-s);line-height:1.35}
.wkf-meta div{display:grid;gap:3px;align-content:start}
.wkf-meta dt{font-weight:600;color:var(--acc)}
.wkf-meta dd{margin:0;font-weight:500;text-wrap:pretty}
.wkf-cols{font-size:var(--t-m);line-height:1.55;column-width:var(--cw);column-gap:var(--cg);column-fill:auto;--cw:min(33em,calc(100vw - 2 * var(--gut)));--cg:clamp(28px,3vw,48px)}
.wkf-cols p{margin:0 0 .85em;text-wrap:pretty;break-inside:avoid-column}
.wkf-cols p:last-child{margin-bottom:0}
.wkf-links{display:flex;flex-wrap:wrap;column-gap:26px;margin-top:10px}
.wkf-lk{display:inline-flex;align-items:center;min-height:44px;font-size:var(--t-m);font-weight:500;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.26em;text-decoration-skip-ink:auto;transition:color .18s ${ARRIVE}}
.wkf-lk:hover{color:var(--acc)}

/* the title card, for work with no pictures to show: same grid, the one-liner takes the writeup's place */
.wkf-tc{background:${NAVY};color:${PAPER};--acc:${PINK}}
.wkf-tc .wkf-h1{font-size:calc(min(12.5vw,21vh,200px) * var(--fds))}
.wkf-ol{margin:0;max-width:26ch;font-size:clamp(22px,min(2.2vw,3.7vh),32px);line-height:1.24;letter-spacing:-.012em;color:${BLUE};text-wrap:pretty}

/* the player panels: navy, the film first */
.wkf-pp{background:${NAVY};color:${PAPER};--acc:${PINK};flex-direction:row;align-items:center;justify-content:center;gap:clamp(14px,1.6vw,26px)}
.wkf-pl{margin:0;display:flex;flex-direction:column;flex:none}
.wkf-cap{height:28px;font-size:var(--t-s);line-height:1;font-weight:500;color:${PINK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wkf-scr{position:relative;overflow:hidden;background:#000;border-radius:3px}
.wkf-scr video,.wkf-scr>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wkf-scr>img{cursor:zoom-in}
.wkf-hit{position:absolute;inset:0;z-index:1;cursor:pointer}
.wkf-ctl{display:flex;align-items:center;gap:10px;height:52px;padding-top:12px}
.wkf-b{flex:none;height:36px;padding:0 14px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(241,242,240,.38);font-size:14px;line-height:1;font-weight:500;white-space:nowrap;transition:background-color .18s ${ARRIVE},color .18s ${ARRIVE},transform .18s ${ARRIVE}}
.wkf-b:hover{background:${PAPER};color:${NAVY}}
.wkf-b:active{transform:scale(.96)}
.wkf-b[disabled]{opacity:.42;cursor:default;background:none!important;color:inherit!important;transform:none!important}
.wkf-b.wkf-pp-b{min-width:70px;text-align:center;justify-content:center;display:inline-flex;align-items:center;background:${PINK};color:${INK};box-shadow:none}
.wkf-b.wkf-pp-b:hover{background:${BLUE};color:${INK}}
.wkf-scrub{flex:1 1 auto;min-width:40px;height:36px;position:relative;cursor:pointer;touch-action:none}
.wkf-scrub i,.wkf-scrub b{position:absolute;left:0;top:17px;height:2px}
.wkf-scrub i{right:0;background:rgba(241,242,240,.24)}
.wkf-scrub b{width:0;background:${PINK}}
.wkf-scrub s{position:absolute;top:11px;left:0;width:3px;height:14px;margin-left:-1.5px;background:${PINK};transition:transform .18s ${ARRIVE}}
.wkf-scrub:hover s,.wkf-scrub.wkf-held s{transform:scaleY(1.4)}
.wkf-tm{flex:none;font-size:14px;line-height:1;font-variant-numeric:tabular-nums;color:${BLUE};min-width:3.2em}
.wkf-pl.wkf-narrow .wkf-tm{display:none}
.wkf-pl.wkf-narrow .wkf-ctl{gap:6px}
.wkf-pl.wkf-narrow .wkf-b{padding:0 10px}
.wkf-pl.wkf-narrow .wkf-b.wkf-pp-b{min-width:62px}
.wkf-pl:fullscreen{background:#000;justify-content:center;padding:2vh 3vw;width:100vw;height:100vh}
.wkf-pl:fullscreen .wkf-cap{display:none}
.wkf-pl:fullscreen .wkf-scr{width:100%!important;height:auto!important;flex:1 1 auto}
.wkf-pl:fullscreen .wkf-scr video{object-fit:contain}
.wkf-plain .wkf-ctl{justify-content:flex-start}

/* stills: columns in a 1-up, 2-up, 3-up rhythm, each its own stop on the run; the section name lives on the film edge */
.wkf-sg{flex:0 0 auto;position:relative;height:100%;padding:var(--top) 0 var(--bot);margin-right:var(--gap);display:flex;flex-direction:column;scroll-snap-align:start}
.wkf-sg.wkf-first{padding-left:var(--gut)}
.wkf-sg.wkf-last{margin-right:0;padding-right:var(--gut)}
.wkf-gi{flex:1 1 0;min-height:0;display:flex;gap:var(--gap)}
.wkf-gi.wkf-col{flex-direction:column;justify-content:center}
.wkf-gi.wkf-row{align-items:flex-end}
.wkf-st{all:unset;box-sizing:border-box;position:relative;display:block;flex:none;overflow:hidden;border-radius:2px;background:${NAVY};cursor:zoom-in}
.wkf-st img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;transition:transform .76s ${ARRIVE}}
.wkf-st .wkf-sc-cap{position:absolute;left:10px;bottom:10px;font-size:13px;line-height:1.2;color:${PAPER};background:${INK};padding:6px 9px;border-radius:2px;max-width:calc(100% - 20px)}

/* notes, for text-only work: real sentences from the writeup, one or two to a frame, set on the measure, bottom-aligned */
.wkf-nt{min-width:min(100vw,560px);background:var(--c,${PINK});color:${INK}}
.wkf-ntc{column-width:var(--ncw);column-gap:clamp(32px,3.6vw,64px);column-fill:auto;--ncw:min(13em,calc(100vw - 2 * var(--gut)));font-family:var(--fl);font-size:calc(clamp(24px,min(2.2vw,3.8vh),36px) * var(--fls,1));line-height:1.12;letter-spacing:-.012em}
.wkf-ntc p{margin:0 0 .8em;break-inside:avoid-column;text-wrap:pretty}
.wkf-ntc p:last-child{margin-bottom:0}

/* the numbers: a ledger on sky, the number on the left edge, what it counts beside it */
.wkf-sx{background:${SKY};color:${INK};--acc:${NAVY};min-width:min(100vw,560px)}
.wkf-sxh,.wkf-cr h2{margin:0 0 min(3vh,26px) -.03em;font-size:calc(clamp(36px,min(3.8vw,6.4vh),64px) * var(--fds));line-height:.95}
.wkf-led{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:max-content minmax(9em,15em)}
.wkf-led .wkf-sv{padding-right:clamp(20px,2.2vw,36px)}
.wkf-led li{display:contents}
.wkf-led li>*{display:flex;flex-direction:column;justify-content:flex-end;padding:min(1.8vh,16px) 0 min(1.4vh,12px);border-top:1px solid currentColor}
.wkf-led li:last-child>*{border-bottom:1px solid currentColor}
.wkf-sv{font-size:calc(var(--sv,min(6.4vw,10.5vh,110px)) * var(--fds));line-height:.86;white-space:nowrap;font-variant-numeric:lining-nums}
.wkf-sl{font-size:var(--t-m);line-height:1.3;font-weight:600;text-wrap:pretty}
.wkf-sl small{display:block;margin-top:2px;font-size:var(--t-s);font-weight:500;color:${NAVY}}
.wkf-tbc .wkf-sv{font-family:${FT};font-weight:500;font-stretch:100%;letter-spacing:-.04em;opacity:.45}
.wkf-brands{margin-top:min(3.4vh,30px);font-size:var(--t-m);line-height:1.4}
.wkf-brands span{display:block;font-size:var(--t-s);font-weight:600;margin-bottom:4px}
.wkf-brands p{margin:0;font-weight:500;max-width:34ch;text-wrap:pretty}

/* the credits roll, left-aligned on the same edge as everything else */
.wkf-cr{background:${PAPER};color:${INK};width:min(100vw,max(40vw,600px))}
.wkf-roll{margin:0;display:grid;grid-template-columns:minmax(7.5em,max-content) minmax(0,1fr);column-gap:clamp(20px,2.2vw,36px)}
.wkf-roll div{display:contents}
.wkf-roll dt,.wkf-roll dd{padding:11px 0 10px;border-top:1px solid rgba(12,13,15,.2)}
.wkf-roll dt{padding-top:13px;font-size:var(--t-s);line-height:1.35;font-weight:600;color:${COBALT}}
.wkf-roll dd{margin:0;font-size:var(--t-m);line-height:1.4;font-weight:500;max-width:36ch;text-wrap:pretty}
.wkf-note{margin:min(2.6vh,22px) 0 0;max-width:40ch;font-size:var(--t-s);line-height:1.45;font-weight:500;color:${COBALT}}

/* next: heavy, ink, with the next film already running */
.wkf-nx{background:${INK};color:${PAPER};--acc:${PINK};width:100vw;flex-direction:row;align-items:flex-end;gap:clamp(24px,4vw,72px)}
.wkf-nxt{flex:1 1 0;min-width:0;display:flex;flex-direction:column}
.wkf-nxw{margin:0 0 .1em -.04em;font-size:calc(min(14vw,25vh,230px) * var(--fds));line-height:.84;color:${PINK}}
.wkf-nxn{align-self:flex-start;font-family:var(--fd)!important;font-weight:var(--fdw)!important;font-size:calc(clamp(30px,min(3.6vw,6.4vh),60px) * var(--fds))!important;line-height:1;color:${PAPER};text-wrap:balance;transition:color .18s ${ARRIVE}}
.wkf-nxn:hover{color:${PINK}}
.wkf-nxk{margin:.55em 0 0;font-size:var(--t-m);font-weight:500;color:${SKY}}
.wkf-nxb{display:flex;flex-wrap:wrap;column-gap:26px;margin-top:min(2.6vh,22px)}
.wkf-nxb .wkf-lk:hover{color:${PINK}}
.wkf-more{margin-top:min(3.6vh,32px);padding-top:14px;border-top:1px solid rgba(241,242,240,.3);font-size:var(--t-s);line-height:1.9;color:${BLUE};max-width:46em}
.wkf-more span{font-weight:600;color:${PAPER};margin-right:1.2em}
.wkf-more button{margin-right:1.1em;color:${BLUE};font-weight:500;transition:color .18s ${ARRIVE}}
.wkf-more button:hover{color:${PINK}}
.wkf-nth{all:unset;cursor:pointer;flex:none;position:relative;overflow:hidden;border-radius:3px;background:${NAVY};height:min(62vh,600px)}
.wkf-nth video,.wkf-nth img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.wkf-nth img{opacity:0;transition:opacity .9s ${MOVE}}
.wkf-nth img.wkf-on{opacity:1}
.wkf-nth .wkf-ntp{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(18px,2vw,30px);background:${NAVY}}
.wkf-nth .wkf-ntp strong{font-size:calc(clamp(34px,4vw,64px) * var(--fds));line-height:.95;color:${PAPER}}
.wkf-nth .wkf-ntp small{margin-top:.6em;font-size:var(--t-s);font-weight:500;color:${PINK}}

/* the film edge: every panel carries its own strip of sprocket holes along the bottom, in its own ink, with its
   frame number and name set like an edge code. The frame you are on gets a notch in the accent colour. */
.wkf-edge{position:absolute;left:0;right:0;bottom:clamp(14px,2.4vh,22px);height:34px;padding:0 var(--gut);pointer-events:none;display:flex;align-items:flex-end;gap:18px;font-size:14px;line-height:1;font-weight:500;white-space:nowrap}
.wkf-sg .wkf-edge{padding:0;right:calc(-1 * var(--gap))}
.wkf-sg.wkf-first .wkf-edge{padding-left:var(--gut)}
.wkf-sg.wkf-last .wkf-edge{right:0}
.wkf-edge::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;background:currentColor;opacity:.26;
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='6'%3E%3Crect x='2.5' width='9' height='6' rx='1.5'/%3E%3C/svg%3E") repeat-x 0 0/14px 6px;
  mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='6'%3E%3Crect x='2.5' width='9' height='6' rx='1.5'/%3E%3C/svg%3E") repeat-x 0 0/14px 6px}
.wkf-edge::after{content:"";position:absolute;top:-2px;left:var(--nl,var(--gut));width:44px;height:10px;background:var(--acc);transform:scaleX(0);transform-origin:left center;transition:transform .42s ${ARRIVE}}
.wkf-sg .wkf-edge::after{--nl:0px}
.wkf-sg.wkf-first .wkf-edge::after{--nl:var(--gut)}
.wkf-edge.wkf-cur::after{transform:none}
.wkf-ec{display:inline-flex;align-items:baseline;gap:.4em;font-variant-numeric:lining-nums tabular-nums;opacity:.72}
.wkf-ec b{font-variant-numeric:lining-nums tabular-nums;font-family:var(--fd);font-weight:var(--fdw);font-stretch:var(--fdx);font-size:calc(19px * var(--fds));letter-spacing:0;opacity:1}
.wkf-edge.wkf-cur .wkf-ec{opacity:1}
.wkf-en{opacity:.72}
.wkf-edge.wkf-cur .wkf-en{opacity:1}

/* chrome: Back */
.wkf-back{position:absolute;z-index:4;left:18px;top:18px;height:42px;padding:0 20px;border-radius:21px;display:inline-flex;align-items:center;font-weight:500;font-size:16px;background:${INK};color:${PAPER}!important;box-shadow:0 0 0 1.5px ${PAPER};transition:transform .18s ${ARRIVE}}
.wkf-back:active{transform:scale(.96)}

.wkf-lb{position:absolute;inset:0;z-index:6;display:none;place-items:center;padding:4vmin;background:rgba(12,13,15,.92);cursor:zoom-out}
.wkf-lb.wkf-on{display:grid}
.wkf-lb img{max-width:100%;max-height:88vh;max-height:88svh;border-radius:2px;display:block}

@media (max-width:760px){
  .wkf-page{--gut:20px;--top:76px;--bot:70px;--gap:8px;--t-m:16px}
  .wkf-hd,.wkf-tc,.wkf-nx,.wkf-pp,.wkf-cr,.wkf-sx,.wkf-nt{min-width:100vw;width:100vw}
  .wkf-h1{font-size:calc(min(17vw,10vh) * var(--fds))}
  .wkf-tc .wkf-h1{font-size:calc(min(19vw,11vh) * var(--fds))}
  .wkf-hb{grid-template-columns:minmax(0,1fr);row-gap:18px}
  .wkf-meta{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:12px}
  .wkf-ol{font-size:22px}
  .wkf-ntc{font-size:calc(26px * var(--fls,1));--ncw:calc(100vw - 40px)}
  .wkf-led{grid-template-columns:max-content minmax(0,1fr)}
  .wkf-sv{font-size:calc(var(--sv,min(15vw,8vh)) * var(--fds))}
  .wkf-roll{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
  .wkf-nx{flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:20px}
  .wkf-nxt{flex:none}
  .wkf-nxw{font-size:calc(min(26vw,12vh) * var(--fds))}
  .wkf-nth{height:min(26vh,230px)}
  .wkf-more{display:none}
  .wkf-back{left:16px;top:16px}
  .wkf-edge{gap:14px}
}
@media (prefers-reduced-motion:reduce){
  .wkf-page *,.wkf-page *::after{animation:none!important;transition-duration:.01ms!important}
  .wkf-page,.wkf-page.wkf-on,.wkf-page.wkf-out{transform:none}
  .wkf-page{opacity:0}.wkf-page.wkf-on{opacity:1;transition:opacity .2s linear}.wkf-page.wkf-out{opacity:0;transition:opacity .2s linear}
}
@media (hover:hover) and (pointer:fine){
  .wkf-st:hover img{transform:scale(1.035)}
}
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const src = (p) => BASE + p;
const isText = (p) => TEXT_ONLY.has(p.id) || !p.hero;
const kindOf = (p) => ((p.facts || []).find(f => /^(kind|what it is|output|role)$/i.test(f.label)) || {}).value || WING[p.wing].title;
const domain = (u) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
const clean = (s) => String(s == null ? '' : s).replace(/\s*[—–]\s*/g, ', ').replace(/--/g, ',').replace(/[←-⇿·]/g, '');

let DATA = { software: [], media: [] }, ALL = [], byId = new Map(), tab = 'software', openId = null;
let ui = {};

/* ---------- frosted text-only plate ---------- */
function plate(p, i) {
  const d = el('div', 'wkc-ph');
  const sets = WING[p.wing].plates, s = sets[i % sets.length];
  d.style.setProperty('--wkc-p0', s[0]); d.style.setProperty('--wkc-p1', s[1]); d.style.setProperty('--wkc-p2', s[2]);
  d.append(el('i'), el('i'));
  const g = el('div', 'wkc-plate wkc-glass');
  g.append(el('strong', '', clean(p.name)), el('small', '', clean(kindOf(p))));
  d.appendChild(g);
  return d;
}
function media(p, i) {
  const m = el('div', 'wkc-m');
  if (isText(p)) m.appendChild(plate(p, i));
  else { const im = el('img'); im.src = src(p.hero); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.draggable = false; m.appendChild(im); }
  m.appendChild(el('span', 'wkc-chip wkc-open', 'Open'));
  if (!isText(p)) m.appendChild(el('span', 'wkc-chip wkc-what wkc-glass', clean(kindOf(p))));
  return m;
}

/* ---------- the work grid ---------- */
function letters(node, text) {
  node.textContent = ''; node.setAttribute('aria-label', text);
  const cols = [COBALT, NAVY, INK];
  for (const ch of text) {
    const s = el('span', 'wkc-l', ch); s.setAttribute('aria-hidden', 'true');
    s.addEventListener('pointerenter', () => {
      if (RM.matches) return;
      s.style.color = cols[Math.floor(Math.random() * cols.length)];
      s.style.setProperty('--r', (Math.random() * 6 - 3).toFixed(1) + 'deg');
      s.classList.add('wkc-pop'); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove('wkc-pop'), 140);
    });
    node.appendChild(s);
  }
}
function setGround(w, target) {
  const W = WING[w];
  for (const t of target) { t.style.setProperty('--wkc-ground', W.ground); t.style.setProperty('--wkc-f1', W.field[0]); t.style.setProperty('--wkc-f2', W.field[1]); }
}
function setTab(t, instant) {
  tab = t; const W = WING[t];
  setGround(t, [ROOT]);
  ui.tabs.querySelectorAll('button').forEach(b => {
    const on = b.dataset.tab === t; b.classList.toggle('wkc-on', on); b.setAttribute('aria-selected', on);
    if (on) { ui.ind.style.width = b.offsetWidth + 'px'; ui.ind.style.transform = `translateX(${b.offsetLeft - 5}px)`; }
  });
  letters(ui.title, W.title);
  ui.sub.textContent = W.sub + (HOVER.matches ? ' Hover a card, click to open it.' : ' Tap a card to open it.');
  const g = ui.grid; g.textContent = '';
  const list = DATA[t], per = list.length === 4 ? 2 : 3;
  let row;
  list.forEach((p, i) => {
    if (i % per === 0) { row = el('div', 'wkc-row'); g.appendChild(row); }
    const c = el('button', 'wkc-card wkc-glass'); c.type = 'button'; c.dataset.id = p.id;
    c.style.setProperty('--d', (i % per) * 70 + 'ms');
    c.setAttribute('aria-label', `${p.name}. Open the project`);
    c.append(media(p, i), el('h3', '', clean(p.name)), el('p', '', clean(p.one_line)));
    c.addEventListener('click', () => go(p.id));
    c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') backdrop(p); });
    c.addEventListener('pointerleave', () => backdrop(null));
    row.appendChild(c);
  });
  if (row) { const miss = (per - row.children.length) % per; for (let k = 0; k < miss; k++) { const s = el('div', 'wkc-card wkc-ghost'); s.setAttribute('aria-hidden', 'true'); row.appendChild(s); } }
  reveal(instant);
}
function backdrop(p) {
  const b = ui.bgi;
  if (p && p.hero && !isText(p)) { b.style.backgroundImage = `url("${src(p.hero)}")`; b.classList.add('wkc-on'); }
  else b.classList.remove('wkc-on');
}
let io = null;
function reveal(instant) {
  const cards = ui.grid.querySelectorAll('.wkc-card:not(.wkc-ghost)');
  if (RM.matches || instant) { cards.forEach(c => c.classList.add('wkc-in')); return; }
  if (!io) io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('wkc-in'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px' });
  cards.forEach(c => io.observe(c));
}
function buildGrid() {
  const wrap = el('div', 'wkc');
  const bg = el('div', 'wkc-bg'); const bgs = el('div', 'wkc-bgs');
  const bgi = el('div', 'wkc-bgi');
  bgs.append(bgi); bg.appendChild(bgs);
  const top = el('div', 'wkc-top');
  const tabs = el('div', 'wkc-tabs wkc-glass'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Work');
  const ind = el('span', 'wkc-ind'); tabs.appendChild(ind);
  for (const k of ['software', 'media']) {
    const b = el('button', '', WING[k].title); b.type = 'button'; b.dataset.tab = k; b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { if (tab === k) return; setTab(k, false); const y = wrap.getBoundingClientRect().top + scrollY; if (scrollY > y + 4) scrollTo({ top: y, behavior: RM.matches ? 'auto' : 'smooth' }); });
    tabs.appendChild(b);
  }
  top.appendChild(tabs);
  const head = el('div', 'wkc-head'); const title = el('h2', 'wkc-title'); const sub = el('p'); head.append(title, sub);
  const grid = el('div', 'wkc-grid');
  wrap.append(bg, top, head, grid);
  ROOT.textContent = ''; ROOT.appendChild(wrap);
  ui = { wrap, tabs, ind, title, sub, grid, bgi };
  // body.final sets overflow on both html and body, which makes body the sticky container and stops sticky dead.
  // So the tab bar and the backdrop are held at the top of the viewport by hand while the section is on screen.
  const hold = () => {
    const r = wrap.getBoundingClientRect(), th = top.offsetHeight;
    const y = Math.max(0, Math.min(-r.top, r.height - th));
    top.style.transform = y ? `translate3d(0,${y}px,0)` : '';
    const by = Math.max(0, Math.min(-r.top, r.height - innerHeight));
    bgs.style.transform = by ? `translate3d(0,${by}px,0)` : '';
  };
  addEventListener('scroll', hold, { passive: true }); addEventListener('resize', hold); hold();
  addEventListener('resize', () => { const b = tabs.querySelector('.wkc-on'); if (b) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 5}px)`; } });
}

/* ---------- the project page, version F: Film Strip ---------- */
const factOf = (p, re) => { const f = (p.facts || []).find(x => re.test(x.label)); return f ? f.value : null; };
const isVert = (o) => /^(vertical|portrait)$/i.test(o || '');
const pretty = (s) => { const t = String(s).replace(/[-_]+/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

/* optional manifest fields, each with a fallback to what the manifests already hold */
function credit(p) {
  const kind = p.kind || factOf(p, /^(kind|output|format|work)$/i);
  const client = p.client || factOf(p, /^clients?$/i);
  const year = p.year || factOf(p, /^year$/i);
  return { kind: kind ? clean(kind) : null, client: client ? clean(client) : null, year: year ? clean(year) : null };
}
function linksOf(p) {
  const out = [], seen = new Set();
  const add = (label, url) => { if (!url || seen.has(url)) return; seen.add(url); out.push({ label: clean(label || domain(url)), url }); };
  if (p.link) add(domain(p.link), p.link);
  for (const l of Array.isArray(p.links) ? p.links : []) if (l) add(l.label, l.url);
  return out;
}
function videosOf(p) {
  const out = [], seen = new Set();
  const add = (v) => { if (!v || !v.src || seen.has(v.src)) return; seen.add(v.src); out.push(v); };
  if (Array.isArray(p.videos) && p.videos.length) {
    for (const v of p.videos) if (v) add({ src: v.src, poster: v.poster || null, vert: v.orientation ? isVert(v.orientation) : isVert(p.orientation), caption: clean(v.caption || '') });
    return out;
  }
  if (TEXT_ONLY.has(p.id)) return out;
  const vert = isVert(p.orientation);
  const lm = p.video && p.video.match(/^(.*\/)([a-z0-9-]+?)-loop\.mp4$/i);
  if (lm) {                                     // media shoots follow <shoot>-NN.jpg and <shoot>-loop.mp4: one film per shoot
    const shoots = [];
    for (const g of p.gallery || []) { const m = g.match(/^(.*\/)([a-z0-9-]+?)-\d+\.jpg$/i); if (m && m[1] === lm[1] && !shoots.some(s => s.k === m[2])) shoots.push({ k: m[2], poster: g }); }
    const multi = shoots.length > 1;
    if (!shoots.some(s => s.k === lm[2])) shoots.unshift({ k: lm[2], poster: p.hero });
    for (const s of shoots) add({ src: `${lm[1]}${s.k}-loop.mp4`, poster: s.poster, vert, caption: multi ? pretty(s.k) : '' });
  } else if (p.video) {
    const stem = p.video.replace(/\.[a-z0-9]+$/i, '');
    const poster = (p.gallery || []).find(g => g.startsWith(stem + '-poster.')) || p.hero || null;
    add({ src: p.video, poster, vert, caption: '' });
  }
  return out;
}
function stillsOf(p) {
  if (Array.isArray(p.stills) && p.stills.length) return p.stills.filter(s => s && s.src).map(s => ({ src: s.src, section: clean(s.section || (p.wing === 'software' ? 'Screens' : 'Stills')), caption: clean(s.caption || '') }));
  if (TEXT_ONLY.has(p.id)) return [];
  const g = (p.gallery || []).filter(Boolean);
  if (p.wing === 'software') return g.map(src => ({ src, section: 'Screens', caption: '' }));
  const shoots = new Set(g.map(s => (s.match(/([a-z0-9-]+?)-\d+\.jpg$/i) || [])[1]).filter(Boolean));
  return g.map(src => { const k = (src.match(/([a-z0-9-]+?)-\d+\.jpg$/i) || [])[1]; return { src, section: shoots.size > 1 && k ? `${pretty(k)} stills` : 'Stills', caption: '' }; });
}
function creditsOf(p) {
  const rows = [];
  for (const c of Array.isArray(p.credits) ? p.credits : []) if (c && c.role && c.name) rows.push({ role: clean(c.role), name: clean(c.name) });
  for (const f of p.facts || []) rows.push({ role: clean(f.label), name: clean(f.value) });
  return rows;
}
const hx = { x: 0, t: 0, max: 0, v: 0, native: false, stops: [], spans: null, cur: -1, dragged: false, lastWheel: 0, snapped: true, dir: 1 };
let page, sc, track, lb, back, raf = 0, last = 0, gen = 0, vio = null;
const players = new Set();

function buildShell() {
  page = el('article', 'wkf-page'); page.id = 'wkf-page'; page.setAttribute('aria-hidden', 'true'); page.setAttribute('aria-label', 'Project');
  sc = el('div', 'wkf-sc');
  back = el('button', 'wkf-back', 'Back'); back.type = 'button'; back.addEventListener('click', close);
  lb = el('div', 'wkf-lb'); lb.addEventListener('click', closeLb);
  page.append(sc, back, lb);
  document.body.appendChild(page);

  sc.addEventListener('wheel', (e) => {
    if (lb.classList.contains('wkf-on')) { e.preventDefault(); return; }
    if (hx.native) return;
    e.preventDefault();
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerWidth : 1;
    const d = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * k;
    if (d) hx.dir = Math.sign(d);
    hx.t = Math.max(0, Math.min(hx.max, hx.t + d)); hx.lastWheel = performance.now(); hx.snapped = false;
  }, { passive: false });
  let down = false, sx = 0, st = 0;
  sc.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || hx.native || e.button !== 0 || e.target.closest('.wkf-ctl')) return; down = true; sx = e.clientX; st = hx.t; hx.dragged = false; });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (dx) hx.dir = -Math.sign(e.movementX || dx); if (Math.abs(dx) > 6) { hx.dragged = true; sc.classList.add('wkf-drag'); } if (hx.dragged) { hx.t = Math.max(0, Math.min(hx.max, st - dx)); hx.snapped = true; } });
  addEventListener('pointerup', () => { if (!down) return; down = false; sc.classList.remove('wkf-drag'); if (hx.dragged) { hx.lastWheel = performance.now(); hx.snapped = false; } setTimeout(() => { hx.dragged = false; }, 0); });
  sc.addEventListener('click', (e) => { if (hx.dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  addEventListener('keydown', (e) => {
    if (!openId) return;
    if (e.key === 'Escape') { e.preventDefault(); if (document.fullscreenElement) return; if (!closeLb()) close(); return; }
    if (hx.native || lb.classList.contains('wkf-on')) return;
    const fwd = e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && e.target === document.body), bk = e.key === 'ArrowLeft' || e.key === 'PageUp';
    if (!fwd && !bk && e.key !== 'Home' && e.key !== 'End') return; e.preventDefault();
    if (e.key === 'Home') hx.t = 0; else if (e.key === 'End') hx.t = hx.max;
    else if (fwd) { const n = hx.stops.find(v => v > hx.t + 8); hx.t = n == null ? hx.max : n; }
    else { const pr = hx.stops.filter(v => v < hx.t - 8); hx.t = pr.length ? pr[pr.length - 1] : 0; }
    hx.snapped = true;
  });
  addEventListener('resize', () => { if (openId) { hx.native = isNative(); sc.classList.toggle('wkf-native', hx.native); layout(); } });
}
const isNative = () => matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const phone = () => innerWidth < 760;

/* ---------- the player ---------- */
function player(v, opts = {}) {
  const fig = el('figure', 'wkf-pl'); fig._ar = v.vert ? 9 / 16 : 16 / 10; fig._vert = !!v.vert;
  fig.appendChild(el('figcaption', 'wkf-cap', v.caption || opts.label || ''));
  const scr = el('div', 'wkf-scr');
  const vid = el('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'metadata'; vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
  if (v.poster) vid.poster = src(v.poster); vid.src = src(v.src);
  const hit = el('button', 'wkf-hit'); hit.type = 'button'; hit.setAttribute('aria-label', 'Play or pause');
  scr.append(vid, hit); fig.appendChild(scr);
  const ctl = el('div', 'wkf-ctl');
  const pp = el('button', 'wkf-b wkf-pp-b', 'Play'); pp.type = 'button';
  const scrub = el('div', 'wkf-scrub'); scrub.setAttribute('role', 'slider'); scrub.setAttribute('aria-label', 'Seek'); scrub.tabIndex = 0;
  const bi = el('i'), bb = el('b'), bs = el('s'); scrub.append(bi, bb, bs);
  const tm = el('span', 'wkf-tm', '0:00');
  const snd = el('button', 'wkf-b', 'Sound'); snd.type = 'button'; snd.setAttribute('aria-pressed', 'false');
  const fs = el('button', 'wkf-b', 'Full screen'); fs.type = 'button';
  ctl.append(pp, scrub, tm, snd, fs); fig.appendChild(ctl);

  const toggle = () => { if (vid.paused) { vid._user = false; vid.play().catch(() => {}); } else { vid._user = true; vid.pause(); } };
  pp.addEventListener('click', toggle); hit.addEventListener('click', () => { if (!hx.dragged) toggle(); });
  vid.addEventListener('play', () => { pp.textContent = 'Pause'; });
  vid.addEventListener('pause', () => { pp.textContent = 'Play'; });
  const paint = () => { const d = vid.duration || 0, f = d ? vid.currentTime / d : 0; bb.style.width = f * 100 + '%'; bs.style.left = f * 100 + '%'; tm.textContent = fmt(vid.currentTime); scrub.setAttribute('aria-valuenow', Math.round(f * 100)); };
  vid.addEventListener('timeupdate', paint); vid.addEventListener('loadedmetadata', () => { fig._ar = vid.videoWidth && vid.videoHeight ? vid.videoWidth / vid.videoHeight : fig._ar; paint(); layout(); });
  const seek = (e) => { const r = scrub.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); if (vid.duration) { vid.currentTime = f * vid.duration; paint(); } };
  scrub.addEventListener('pointerdown', (e) => { e.stopPropagation(); scrub.setPointerCapture(e.pointerId); scrub.classList.add('wkf-held'); seek(e); });
  scrub.addEventListener('pointermove', (e) => { if (scrub.hasPointerCapture(e.pointerId)) seek(e); });
  scrub.addEventListener('pointerup', (e) => { scrub.classList.remove('wkf-held'); if (scrub.hasPointerCapture(e.pointerId)) scrub.releasePointerCapture(e.pointerId); });
  scrub.addEventListener('keydown', (e) => { if (!vid.duration) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + (e.key === 'ArrowRight' ? 1 : -1))); paint(); } });
  snd.addEventListener('click', () => { vid.muted = !vid.muted; snd.textContent = vid.muted ? 'Sound' : 'Mute'; snd.setAttribute('aria-pressed', String(!vid.muted)); if (!vid.muted && vid.paused) { vid._user = false; vid.play().catch(() => {}); } });
  // an honest no-sound state: these clips are silent, so the button says so once the browser knows
  const probe = () => {
    let none = false;
    if ('mozHasAudio' in vid) none = !vid.mozHasAudio;
    else if (vid.audioTracks) none = vid.audioTracks.length === 0;
    else if ('webkitAudioDecodedByteCount' in vid) none = vid.currentTime > 0.4 && vid.webkitAudioDecodedByteCount === 0;
    else return;
    if (none) { snd.textContent = 'No sound'; snd.disabled = true; vid.muted = true; }
  };
  vid.addEventListener('timeupdate', function once() { if (vid.currentTime > 0.5) { probe(); vid.removeEventListener('timeupdate', once); } });
  fs.addEventListener('click', () => {
    const go = fig.requestFullscreen || fig.webkitRequestFullscreen;
    if (go) { try { const r = go.call(fig); if (r && r.catch) r.catch(() => { if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen(); }); } catch (_) { if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen(); } }
    else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();
  });
  fig._vid = vid; players.add(vid);
  return fig;
}
function plainFrame(p, label) {
  const fig = el('figure', 'wkf-pl wkf-plain'); fig._ar = 16 / 10; fig._vert = false;
  fig.appendChild(el('figcaption', 'wkf-cap', label || ''));
  const scr = el('div', 'wkf-scr'); const im = el('img'); im.alt = clean(p.name); im.draggable = false; im.decoding = 'async'; im.src = src(p.hero);
  im.addEventListener('load', () => { fig._ar = im.naturalWidth / im.naturalHeight; layout(); });
  im.addEventListener('click', () => { if (!hx.dragged) openLb(p.hero); });
  scr.appendChild(im); fig.appendChild(scr);
  const ctl = el('div', 'wkf-ctl');
  for (const l of linksOf(p)) { const a = el('a', 'wkf-b', 'Open ' + l.label); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; a.style.display = 'inline-flex'; a.style.alignItems = 'center'; a.style.textDecoration = 'none'; ctl.appendChild(a); }
  fig.appendChild(ctl);
  return fig;
}

/* ---------- panels ---------- */
/* the facts that belong next to the title: what it is, for whom, when, and what I did */
function metaList(p, max) {
  const c = credit(p), role = factOf(p, /^role$/i);
  const rows = [['Kind', c.kind], ['Client', c.client], ['Year', c.year], ['Role', role ? clean(role) : null]].filter(r => r[1]);
  if (!rows.length) return null;
  const dl = el('dl', 'wkf-meta');
  for (const [k, v] of rows.slice(0, max || 4)) { const d = el('div'); d.append(el('dt', '', k), el('dd', '', v)); dl.appendChild(d); }
  return dl;
}
function linkRow(p) {
  const ls = linksOf(p); if (!ls.length) return null;
  const r = el('div', 'wkf-links');
  for (const l of ls) { const a = el('a', 'wkf-lk', l.label); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; r.appendChild(a); }
  return r;
}
function header(p) {
  const s = el('section', 'wkf-pn wkf-hd'); s.setAttribute('aria-label', clean(p.name));
  s.appendChild(el('h1', 'wkf-h1 wkf-d', clean(p.name)));
  const hb = el('div', 'wkf-hb');
  hb.appendChild(metaList(p, phone() ? 2 : 4) || el('div'));
  const right = el('div');
  if ((p.writeup || []).length) { const c = el('div', 'wkf-cols'); for (const w of p.writeup) c.appendChild(el('p', '', clean(w))); right.appendChild(c); }
  else if (p.one_line) right.appendChild(el('p', 'wkf-ol', clean(p.one_line)));
  const lr = linkRow(p); if (lr) right.appendChild(lr);
  hb.appendChild(right); s.appendChild(hb);
  return s;
}
function titleCard(p) {
  const s = el('section', 'wkf-pn wkf-tc'); s.setAttribute('aria-label', clean(p.name));
  s.appendChild(el('h1', 'wkf-h1 wkf-d', clean(p.name)));
  const hb = el('div', 'wkf-hb');
  hb.appendChild(metaList(p) || el('div'));
  const right = el('div');
  if (p.one_line) right.appendChild(el('p', 'wkf-ol', clean(p.one_line)));
  const lr = linkRow(p); if (lr) right.appendChild(lr);
  hb.appendChild(right); s.appendChild(hb);
  return s;
}
function playerPanels(p) {
  const vs = videosOf(p), out = [];
  const pn = (label) => { const s = el('section', 'wkf-pn wkf-pp'); s.setAttribute('aria-label', label); out.push(s); return s; };
  if (vs.length) {
    const vert = vs.filter(v => v.vert), flat = vs.filter(v => !v.vert);
    for (const v of flat) pn(p.wing === 'software' ? 'Screen recording' : (v.caption || 'Film')).appendChild(player(v, { label: p.wing === 'software' ? 'Screen recording' : '' }));
    if (vert.length) {                                          // phone-ratio films sit side by side, two or three to a panel, never padded
      const per = phone() ? 1 : 3, n = Math.ceil(vert.length / per), size = Math.ceil(vert.length / n);
      for (let i = 0; i < vert.length; i += size) { const grp = vert.slice(i, i + size); const s = pn(grp.length === 1 && grp[0].caption ? grp[0].caption : 'Films'); for (const v of vert.slice(i, i + size)) s.appendChild(player(v)); }
    }
  } else if (p.hero && !TEXT_ONLY.has(p.id)) pn('Screen').appendChild(plainFrame(p, p.wing === 'software' ? 'Screen' : ''));
  return out;
}
/* stills: grouped by aspect, then set in columns of one, two or three */
const RHYTHM = { land: [1, 2, 3, 2], wide: [3, 4, 3, 2], port: [1, 2, 3, 2] };
function stillGroups(list, dims) {
  const groups = []; let sec = null, run = [], cls = null, ri = 0;
  const flush = () => {
    if (!run.length) return;
    const pat = RHYTHM[cls];
    while (run.length) {
      let k = pat[ri++ % pat.length];
      if (phone() && cls === 'land') k = Math.max(2, Math.min(k, 3));
      if (phone() && cls === 'port') k = 1;
      if (run.length - k === 1 && k > 1) k = Math.min(run.length, k + 1) <= (cls === 'wide' ? 4 : 3) ? k + 1 : k - 1;   // no lonely leftover
      groups.push({ cls, items: run.splice(0, Math.max(1, Math.min(k, run.length))), section: null });
    }
  };
  list.forEach((s, i) => {
    const d = dims[i]; if (!d) return;
    const a = d.w / d.h, c = a > 2.1 ? 'wide' : a < 0.9 ? 'port' : 'land';
    if (s.section !== sec) { flush(); ri = 0; sec = s.section; cls = c; groups.push({ label: sec }); }
    else if (c !== cls) { flush(); cls = c; }
    run.push({ ...s, a });
  });
  flush();
  // fold each label into the group that follows it
  const out = []; let pending = null;
  for (const g of groups) { if (g.label != null && !g.items) { pending = g.label; continue; } g.section = pending; pending = null; out.push(g); }
  return out;
}
function buildStills(groups, first, last) {
  const out = [];
  groups.forEach((g, gi) => {
    const s = el('section', 'wkf-sg'); s.setAttribute('aria-label', g.section || 'Stills');
    if (gi === 0 && first) s.classList.add('wkf-first');
    if (gi === groups.length - 1 && last) s.classList.add('wkf-last');
    const k = g.items.length, row = g.cls === 'port';
    const box = el('div', `wkf-gi ${row ? 'wkf-row' : 'wkf-col'} wkf-k${k}`);
    for (const it of g.items) {
      const b = el('button', 'wkf-st'); b.type = 'button'; b._a = it.a; b.setAttribute('aria-label', 'Open this image');
      const im = el('img'); im.alt = it.caption || ''; im.draggable = false; im.decoding = 'async'; im.src = src(it.src);
      b.appendChild(im); if (it.caption) b.appendChild(el('span', 'wkf-sc-cap', it.caption));
      b.addEventListener('click', () => { if (!hx.dragged) openLb(it.src); });
      box.appendChild(b);
    }
    s._g = g; s.appendChild(box); out.push(s);
  });
  return out;
}
/* notes, for text-only work: the writeup cut into sentences, one or two to a frame */
function sentencesOf(p) {
  const out = [];
  for (const w of p.writeup || []) for (const t of clean(w).split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)) if (t.trim()) out.push(t.trim());
  if (!out.length && p.one_line) out.push(clean(p.one_line));
  return out;
}
function buildNotes(p) {
  const ss = sentencesOf(p); if (!ss.length) return [];
  const s = el('section', 'wkf-pn wkf-nt'); s.setAttribute('aria-label', 'Notes');
  s.style.setProperty('--c', p.wing === 'media' ? BLUE : PINK);
  const c = el('div', 'wkf-ntc'); for (const t of ss) c.appendChild(el('p', '', t));
  s.appendChild(c);
  return [s];
}
/* the numbers: every fact in the manifest that is a number, plus the reach figures; missing ones stay 000 */
const short = (n) => { const a = Math.abs(n); const f = (v, u) => (Math.round(v * 10) / 10).toString().replace(/\.0$/, '') + u; return a >= 1e9 ? f(n / 1e9, 'B') : a >= 1e6 ? f(n / 1e6, 'M') : a >= 1e3 ? f(n / 1e3, 'K') : String(n); };
function statVal(v) { if (v == null || v === '') return null; if (typeof v === 'number' && isFinite(v)) return short(v); const t = clean(v).trim(); return t || null; }
const numFacts = (p) => (p.facts || []).filter(f => /\d/.test(f.value) && !/^(year|views)$/i.test(f.label) && String(f.value).length <= 12).map(f => [clean(f.label), clean(f.value), null]);
function statsPanel(p) {
  const st = (p.stats && typeof p.stats === 'object') ? p.stats : {};
  const s = el('section', 'wkf-pn wkf-sx'); s.setAttribute('aria-label', 'The numbers');
  s.appendChild(el('h2', 'wkf-sxh wkf-d', 'The numbers'));
  let rows;
  if (p.wing === 'software') rows = [...numFacts(p), ['Total visitors', statVal(st.visitors), null]];
  else {
    let views = statVal(st.views), note = null;
    if (!views) { const f = factOf(p, /^views$/i); const m = f && String(f).match(/^\s*([\d.,]+\s*[KMB]?\+?)\s*(.*)$/i); if (m) { views = m[1].replace(/\s+/g, ''); note = m[2] ? clean(m[2]) : null; } }
    rows = [...numFacts(p), ['Views', views, note], ['Shares', statVal(st.shares), null], ['Likes', statVal(st.likes), null]];
  }
  const ol = el('ol', 'wkf-led');
  for (const [label, v, note] of rows) {
    const li = el('li', v ? '' : 'wkf-tbc');
    const l = el('div', 'wkf-sl', label);
    if (!v) l.appendChild(el('small', '', 'number to come')); else if (note) l.appendChild(el('small', '', note));
    li.append(el('div', 'wkf-sv wkf-d', v || '000'), l); ol.appendChild(li);
  }
  s.appendChild(ol); s._rows = rows.length;
  if (p.wing === 'media') {
    let brands = Array.isArray(p.brands) ? p.brands.map(clean).filter(Boolean) : [];
    if (!brands.length) { const c = factOf(p, /^clients?$/i); if (c) brands = clean(c).split(/\s*,\s*|\s+and\s+/).filter(Boolean); }
    const b = el('div', 'wkf-brands'); b.appendChild(el('span', '', 'Brands'));
    b.appendChild(el('p', '', brands.length ? brands.join(', ') : 'List to come'));
    s.appendChild(b);
  }
  return s;
}
function creditsPanel(p) {
  const rows = creditsOf(p); const lr = linkRow(p);
  if (!rows.length && !lr && !p.screens_withheld) return null;
  const s = el('section', 'wkf-pn wkf-cr'); s.setAttribute('aria-label', 'Credits');
  s.appendChild(el('h2', 'wkf-d', 'Credits'));
  if (rows.length) { const dl = el('dl', 'wkf-roll'); for (const r of rows) { const d = el('div'); d.append(el('dt', '', r.role), el('dd', '', r.name)); dl.appendChild(d); } s.appendChild(dl); }
  if (p.screens_withheld || (TEXT_ONLY.has(p.id) && /^(clapper|fitkit|fourside-studios)$/.test(p.id))) s.appendChild(el('p', 'wkf-note', 'This one runs on real data, so there are no screenshots here.'));
  if (lr) s.appendChild(lr);
  return s;
}
function nextPanel(p) {
  const i = ALL.indexOf(p), nx = ALL[(i + 1) % ALL.length];
  const s = el('section', 'wkf-pn wkf-nx'); s.setAttribute('aria-label', 'Next');
  const t = el('div', 'wkf-nxt');
  t.appendChild(el('div', 'wkf-nxw wkf-d', 'Next'));
  const nm = el('button', 'wkf-nxn', clean(nx.name)); nm.type = 'button'; faceVars(nm, typeOf(nx.id)); nm.addEventListener('click', () => { if (!hx.dragged) go(nx.id, true); });
  t.appendChild(nm);
  const c = credit(nx); const k = c.kind || clean(kindOf(nx));
  t.appendChild(el('p', 'wkf-nxk', k));
  const bs = el('div', 'wkf-nxb');
  const o = el('button', 'wkf-lk', 'Open the next one'); o.type = 'button'; o.addEventListener('click', () => { if (!hx.dragged) go(nx.id, true); });
  const a = el('button', 'wkf-lk', 'Back to all work'); a.type = 'button'; a.addEventListener('click', () => { if (!hx.dragged) close(); });
  bs.append(o, a); t.appendChild(bs);
  const more = el('div', 'wkf-more'); more.appendChild(el('span', '', 'More work'));
  for (let k2 = 2; k2 < Math.min(ALL.length, 8); k2++) { const q = ALL[(i + k2) % ALL.length]; if (q === p) continue; const b = el('button', '', clean(q.name)); b.type = 'button'; b.addEventListener('click', () => { if (!hx.dragged) go(q.id, true); }); more.appendChild(b); }
  t.appendChild(more);
  // the thumbnail loops: the next film if there is one, else its pictures in turn, else a plate
  const th = el('button', 'wkf-nth'); th.type = 'button'; th.setAttribute('aria-label', `Open ${nx.name}`); th.addEventListener('click', () => { if (!hx.dragged) go(nx.id, true); });
  const v = videosOf(nx)[0];
  if (v) { const vid = el('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'metadata'; vid.setAttribute('playsinline', ''); if (v.poster) vid.poster = src(v.poster); vid.src = src(v.src); vid._auto = true; th._ar = v.vert ? 9 / 16 : 16 / 10; th.appendChild(vid); players.add(vid); }
  else if (nx.hero && !TEXT_ONLY.has(nx.id)) {
    const pics = [nx.hero, ...(nx.gallery || [])].filter((x, j, a2) => x && a2.indexOf(x) === j).slice(0, 5);
    pics.forEach((g, j) => { const im = el('img'); im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; im.src = src(g); if (!j) im.classList.add('wkf-on'); th.appendChild(im); });
    th._ar = 16 / 10; th._cycle = pics.length > 1;
  } else { const pl = el('div', 'wkf-ntp'); faceVars(pl, typeOf(nx.id)); pl.append(el('strong', 'wkf-d', clean(nx.name)), el('small', '', k)); th.appendChild(pl); th._ar = 4 / 5; }
  s.append(t, th); s._th = th;
  return s;
}

/* ---------- build ---------- */
function probeAll(list) {
  return Promise.all(list.map(s => new Promise(res => {
    const im = new Image(); let done = false;
    const fin = (v) => { if (!done) { done = true; res(v); } };
    im.onload = () => fin({ w: im.naturalWidth || 16, h: im.naturalHeight || 10 }); im.onerror = () => fin(null);
    setTimeout(() => fin({ w: 16, h: 10 }), 5000); im.src = src(s.src);
  })));
}
function buildPage(p) {
  const my = ++gen;
  hx.native = isNative(); sc.classList.toggle('wkf-native', hx.native);
  page.style.setProperty('--wkf-ground', WING[p.wing].ground);
  const face = typeOf(p.id); faceVars(page, face);
  const i = ALL.indexOf(p), nxp = ALL[(i + 1) % ALL.length];
  Promise.all([needFace(face), needFace(typeOf(nxp.id))]).then(() => { if (my === gen) layout(); });
  for (const v of players) v.pause(); players.clear();
  track = el('div', 'wkf-track');
  const text = TEXT_ONLY.has(p.id) || (!p.hero && !videosOf(p).length);
  if (text) { track.appendChild(titleCard(p)); track.appendChild(statsPanel(p)); for (const g of buildNotes(p)) track.appendChild(g); }
  else { track.appendChild(header(p)); for (const s of playerPanels(p)) track.appendChild(s); track.appendChild(statsPanel(p)); }
  const cr = creditsPanel(p); if (cr) track.appendChild(cr);
  const nx = nextPanel(p); track.appendChild(nx);
  sc.textContent = ''; sc.appendChild(track);
  Object.assign(hx, { x: 0, t: 0, v: 0, snapped: true, cur: -1 });
  sc.scrollLeft = 0; track.style.transform = '';
  watch();
  layout(); requestAnimationFrame(layout); setTimeout(layout, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (my === gen) layout(); });
  if (!text) {
    const list = stillsOf(p);
    if (list.length) probeAll(list).then(dims => {
      if (my !== gen || !track.isConnected) return;
      const groups = stillGroups(list, dims);
      const nodes = buildStills(groups, true, true);
      for (const n of nodes) track.insertBefore(n, cr || nx);
      layout();
    });
  }
}
/* videos play muted, inline, only while they are on screen; a film you paused stays paused */
function watch() {
  if (vio) vio.disconnect();
  vio = new IntersectionObserver((es) => {
    for (const e of es) {
      const v = e.target;
      if (e.isIntersecting && e.intersectionRatio >= 0.55) { if (!RM.matches && !v._user && openId) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }
  }, { threshold: [0, 0.55, 1] });
  for (const v of players) vio.observe(v);
}
/* the film edge: one per frame of the run, numbered, named after what the frame holds */
function edges() {
  const fr = [...track.children]; let lastLab = '';
  fr.forEach((n, i) => {
    let e = n.querySelector(':scope > .wkf-edge');
    if (!e) { e = el('div', 'wkf-edge'); e.setAttribute('aria-hidden', 'true'); n.appendChild(e); }
    let lab = n.getAttribute('aria-label') || '';
    if (n.classList.contains('wkf-sg')) { if (n._g && n._g.section) lastLab = n._g.section; lab = lastLab || lab; }
    const key = `${i + 1}/${fr.length}/${lab}`;
    if (e._k !== key) {
      e._k = key; e.textContent = '';
      const ec = el('span', 'wkf-ec'); ec.append(el('b', '', String(i + 1)), document.createTextNode('of ' + fr.length));
      e.append(ec, el('span', 'wkf-en', lab));
    }
  });
  hx.cur = -1;
}

function layout() {
  if (!track || !track.isConnected) return;
  const cs = getComputedStyle(page);
  const top = parseFloat(cs.getPropertyValue('--top')) || 90, bot = parseFloat(cs.getPropertyValue('--bot')) || 84;
  const lab = parseFloat(cs.getPropertyValue('--lab')) || 0, gap = parseFloat(cs.getPropertyValue('--gap')) || 10, gut = parseFloat(cs.getPropertyValue('--gut')) || 20;
  const H = innerHeight - top - bot, maxW = innerWidth - 2 * gut;
  // players: fit the frame to the room left after the caption and controls
  for (const s of track.querySelectorAll('.wkf-pp')) {
    const figs = [...s.querySelectorAll('.wkf-pl')]; if (!figs.length) continue;
    const ph = H - 28 - 52 - 10, n = figs.length, gp = parseFloat(getComputedStyle(s).columnGap) || 20;
    const sumA = figs.reduce((a, f) => a + f._ar, 0);
    let h = Math.min(ph, (maxW - gp * (n - 1)) / sumA);
    for (const f of figs) { const w = Math.floor(h * f._ar); const scr = f.querySelector('.wkf-scr'); scr.style.width = w + 'px'; scr.style.height = Math.floor(h) + 'px'; f.style.width = w + 'px'; f.classList.toggle('wkf-narrow', w < 420); }
  }
  // stills: sizes come from the column height, so a still never crops and never runs off the panel
  const SH = H - lab;
  for (const s of track.querySelectorAll('.wkf-sg')) {
    const box = s.querySelector('.wkf-gi'), items = [...box.children], k = items.length;
    if (s._g && s._g.cls === 'port') {
      const f = k === 1 ? 1 : k === 2 ? 0.86 : 0.74;
      let h = SH * f; const sumA = items.reduce((a, b) => a + b._a, 0);
      h = Math.min(h, (maxW - gap * (k - 1)) / sumA);
      for (const b of items) { b.style.height = Math.floor(h) + 'px'; b.style.width = Math.floor(h * b._a) + 'px'; }
    } else if (s._g) {
      const inv = items.reduce((a, b) => a + 1 / b._a, 0);
      const w = Math.min(maxW, (SH - gap * (k - 1)) / inv);
      for (const b of items) { b.style.width = Math.floor(w) + 'px'; b.style.height = Math.floor(w / b._a) + 'px'; }
    }
  }
  // the numbers ledger: the figure size comes from how many rows share the height
  for (const s of track.querySelectorAll('.wkf-sx')) {
    const n = s._rows || 1, room = H - 90 - (s.querySelector('.wkf-brands') ? 90 : 0);
    const px = Math.max(34, Math.min(phone() ? innerWidth * 0.16 : 120, room / n - 30));
    s.style.setProperty('--sv', px + 'px');
  }
  // header writeup grows sideways in columns, never down
  for (const c of track.querySelectorAll('.wkf-cols')) {
    c.style.maxHeight = 'none'; c.style.width = '';
    const pn = c.closest('.wkf-pn'), h1 = pn.querySelector('.wkf-h1'), lk = pn.querySelector('.wkf-links'), mt = pn.querySelector('.wkf-meta');
    const room = H - (h1 ? h1.offsetHeight : 0) - 56 - (lk ? lk.offsetHeight + 10 : 0) - (phone() && mt ? mt.offsetHeight + 18 : 0);
    const cw = parseFloat(getComputedStyle(c).columnWidth) || 380;
    c.style.width = cw + 'px';
    if (c.scrollHeight > room) { c.style.maxHeight = Math.max(200, room) + 'px'; c.style.width = Math.max(c.scrollWidth, cw) + 'px'; }
  }
  // notes: the sentences fill the height, then grow sideways a column at a time
  for (const c of track.querySelectorAll('.wkf-ntc')) {
    c.style.height = Math.max(200, H - 10) + 'px'; c.style.width = '';
    const cw = parseFloat(getComputedStyle(c).columnWidth) || 300;
    c.style.width = cw + 'px'; c.style.width = Math.max(c.scrollWidth, cw) + 'px';
    c.style.height = 'auto'; c.style.maxHeight = Math.max(200, H - 10) + 'px';
  }
  // next: the thumbnail keeps its film's ratio
  const th = track.querySelector('.wkf-nth');
  if (th) { const h = th.getBoundingClientRect().height || 400; th.style.width = Math.min(phone() ? maxW : innerWidth * 0.5, h * (th._ar || 1.6)) + 'px'; }
  edges();
  hx.max = Math.max(0, track.scrollWidth - innerWidth);
  hx.stops = [...track.children].filter(n => n.offsetWidth).map(n => Math.min(n.offsetLeft, hx.max));
  hx.spans = [...track.children].map(n => [n.offsetLeft, n.offsetLeft + n.offsetWidth]);
  hx.t = Math.min(hx.t, hx.max);
}
let cycleT = 0;
function frame(now) {
  raf = openId ? requestAnimationFrame(frame) : 0;
  if (!track) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
  if (hx.native) hx.x = sc.scrollLeft;
  else {
    if (!hx.snapped && now - hx.lastWheel > 180) {
      hx.snapped = true;
      let best = null, bd = 1e9;
      for (const s of hx.stops) { if ((s - hx.t) * (hx.dir || 1) < 0) continue; const d = Math.abs(s - hx.t); if (d < bd) { bd = d; best = s; } }
      if (best != null && bd < innerWidth * 0.2) hx.t = best;
    }
    hx.x += (hx.t - hx.x) * (RM.matches ? 1 : 1 - Math.exp(-dt * 8.5));
    if (Math.abs(hx.t - hx.x) < 0.05) hx.x = hx.t;
    track.style.transform = `translate3d(${-hx.x}px,0,0)`;
  }
  // the frame you are on: the one under a point a third of the way in, or the last one at the end of the run
  if (hx.spans) {
    const probe = hx.x >= hx.max - 2 ? hx.x + innerWidth - 2 : hx.x + innerWidth * 0.34;
    let cur = hx.spans.findIndex(([a, b]) => probe >= a && probe < b + 12);
    if (cur < 0) cur = hx.spans.length - 1;
    if (cur !== hx.cur) {
      hx.cur = cur;
      [...track.children].forEach((n, i) => { const e = n.querySelector(':scope > .wkf-edge'); if (e) e.classList.toggle('wkf-cur', i === cur); });
    }
  }
  // the Next thumbnail turns its pictures over, held, not slid
  const th = track.querySelector('.wkf-nth');
  if (th && th._cycle && !RM.matches && now - cycleT > 2400) {
    cycleT = now; const ims = th.querySelectorAll('img'); const on = [...ims].findIndex(i => i.classList.contains('wkf-on'));
    ims[on].classList.remove('wkf-on'); ims[(on + 1) % ims.length].classList.add('wkf-on');
  }
}

function openLb(path) {
  lb.textContent = ''; const i = el('img'); i.src = src(path); i.alt = ''; lb.appendChild(i);
  lb.classList.add('wkf-on');
  if (!RM.matches && lb.animate) lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: ARRIVE });
}
function closeLb() {
  if (!lb || !lb.classList.contains('wkf-on')) return false;
  lb.classList.remove('wkf-on'); lb.textContent = ''; return true;
}

/* ---------- open, close, route ---------- */
let leaveT = 0;
function show(id) {
  const p = byId.get(id); if (!p) return;
  if (openId === id && page.classList.contains('wkf-on')) return;
  clearTimeout(leaveT);
  const wasOpen = !!openId && page.classList.contains('wkf-on');
  openId = id;
  if (wasOpen) {
    closeLb();
    if (RM.matches) buildPage(p);
    else { track.classList.add('wkf-swap'); setTimeout(() => { buildPage(p); track.classList.add('wkf-swap'); requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('wkf-swap'))); }, 240); }
    return;
  }
  buildPage(p);
  document.documentElement.classList.add('wkf-lock');
  page.classList.remove('wkf-out'); page.setAttribute('aria-hidden', 'false');
  page.getBoundingClientRect();
  page.classList.add('wkf-on');
  back.focus({ preventScroll: true });
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
}
function hide() {
  if (!openId) return;
  const id = openId; openId = null; closeLb();
  page.classList.remove('wkf-on'); page.classList.add('wkf-out'); page.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('wkf-lock');
  for (const v of players) v.pause();
  if (vio) vio.disconnect();
  leaveT = setTimeout(() => { page.classList.remove('wkf-out'); if (!openId) { sc.textContent = ''; players.clear(); } }, RM.matches ? 220 : 440);
  const c = ui.grid && ui.grid.querySelector(`[data-id="${id}"]`); if (c) c.focus({ preventScroll: true });
}
function go(id, inPlace) {
  const h = '#work/' + id;
  if (location.hash !== h) {
    const st = history.state || {};
    if (inPlace && openId) history.replaceState({ wkf: id, pushed: !!st.pushed }, '', h);
    else history.pushState({ wkf: id, pushed: true }, '', h);
  }
  show(id);
}
function close() {
  if (history.state && history.state.pushed) history.back();
  else { history.replaceState(null, '', location.pathname + location.search + '#work'); hide(); }
}
function route() {
  const m = location.hash.match(/^#work\/([\w-]+)$/);
  if (m && byId.has(m[1])) show(m[1]); else hide();
}

async function load(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`work-f: ${path} ${r.status}`);
  return r.json();
}
async function init() {
  if (!ROOT) return;
  const style = el('style'); style.id = 'wkc-style'; style.textContent = CSS; document.head.appendChild(style);
  // the project-page faces: once the stylesheet is in, warm them, so the first page you open is measured with real metrics
  const warm = () => { if (document.fonts && document.fonts.load) for (const f of [`400 18px ${FT}`, `500 18px ${FT}`, `600 18px ${FT}`]) document.fonts.load(f).then(() => { if (openId) layout(); }).catch(() => {}); };
  if (!document.getElementById('wkc-fonts')) { const lk = el('link'); lk.id = 'wkc-fonts'; lk.rel = 'stylesheet'; lk.href = FONT_TEXT; lk.addEventListener('load', warm); document.head.appendChild(lk); } else warm();
  try {
    const [sw, md] = await Promise.all([load('software/manifest.json'), load('media/manifest.json')]);
    DATA.software = sw.filter(p => !HIDE.has(p.id));
    DATA.media = md.filter(p => !HIDE.has(p.id));
  } catch (err) {
    console.warn(err);
    ROOT.innerHTML = '<div class="wkc"><div class="wkc-head"><h2 class="wkc-title">Work</h2></div></div>';
    return;
  }
  ALL = [...DATA.software, ...DATA.media];
  byId = new Map(ALL.map(p => [p.id, p]));
  buildGrid();
  buildShell();
  const start = () => setTab(tab, false);
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]);
  start();
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  route();
  window.__wkf = { hx, go, close, show, hide, layout, get openId() { return openId; } };
}

init();
