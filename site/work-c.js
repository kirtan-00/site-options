/* Work, version C. A port of two pieces Kirtan already approved:
   1. the work grid from the pop build (rows of three, the hovered card grows and its row-mates give way,
      Software / Media pill tabs with a sliding indicator), made of frosted glass, with the carousel build's
      hover blur: the cards you are not pointing at go soft, the one you point at pulls into focus;
   2. the project page from the flight build: one horizontal run of viewport-high panels. The wheel moves it
      sideways on desktop, phones swipe it natively with snap, a progress bar runs along the bottom, Back
      closes it. The last panel is More work, made of the same frosted tiles.
   Fills <section id="work">. Every class and id starts with wkc-. Project pages live at #work/<id>.

   OPTIONAL DATA FIELDS (all optional; add them to the manifests when the real numbers exist, never guess):
     Software project (../content/software/manifest.json):
       "stats": { "visitors": 12400 }                 total visitors, a plain number
       "links": [ { "label": "Live site", "url": "https://..." }, ... ]   extra buttons; http(s) only
     Media project (../content/media/manifest.json):
       "stats": { "views": 1200000, "shares": 34000, "likes": 98000 }
       "brands": [ "Brand A", "Brand B" ]             shown in the project's facts as Brands
       "links": [ { "label": "Watch", "url": "https://..." } ]
     Media tab top line (../content/media/brands.json):
       { "brands": [ "Brand A", "Brand B", ... ] }    the "Brands impacted" credits line; 4 to 12 reads best
   Numbers print short: 1200000 reads 1.2M, 340000 reads 340K. 0 is a real value and prints as 0.
   On grid cards a missing stat shows nothing. On the project page a missing stat shows 000 with
   "number to come", so the spot is visible until the number arrives. The existing "link" field still
   drives the first button; "links" entries with the same url are not repeated.

   SPEED: grid, More work, reel cards and the hover backdrop use WebP thumbnails made next to each
   original as <name>.w640.webp and <name>.w1280.webp (made with Pillow, never upscaled). A missing
   thumbnail falls back to the original, so a new project still shows before its thumbs are made.
   The hero panel and the lightbox keep the full-size original. */

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
/* project pages only (the grid keeps the site's Bowlby One and Bricolage): FD for titles, FT for text */
const FONTS = 'https://fonts.googleapis.com/css2?family=Gloock&family=Hanken+Grotesk:wght@400;500;600&display=swap';
const FD = '"Gloock",Georgia,serif', FD_W = 400, FT = '"Hanken Grotesk",system-ui,sans-serif';
const FD_TITLE = `${FD_W} 1em/1 ${FD}`;
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
/* speed: the big tiles and boxes only ever sit on a ground that is flat or already blurred 38px, so a second
   backdrop blur on them is invisible but costs a full blur pass per tile per frame. They keep the tint, not the blur. */
.wkc-card.wkc-glass,.wkc-mt.wkc-glass,.wkc-box.wkc-glass{-webkit-backdrop-filter:saturate(1.5) brightness(1.04);backdrop-filter:saturate(1.5) brightness(1.04)}
/* hover chips frost only while they show */
.wkc-chip.wkc-glass{-webkit-backdrop-filter:none;backdrop-filter:none}

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

/* Media: Brands impacted, set like a credits line */
.wkc-brands{position:relative;z-index:1;margin:0 var(--gut) clamp(26px,3.2vw,50px);padding-top:clamp(18px,2vw,28px);border-top:1px solid rgba(12,13,15,.16);
  display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:clamp(28px,4.4vw,80px);row-gap:14px;align-items:baseline;opacity:0;transform:translateY(20px)}
.wkc-brands[hidden]{display:none}
.wkc-brands.wkc-in{opacity:1;transform:none;transition:opacity .76s ${ARRIVE},transform .76s ${ARRIVE}}
.wkc-bh{margin:0;font:400 clamp(30px,3.3vw,56px)/1 ${FD};letter-spacing:-.02em;white-space:nowrap;color:${INK}}
.wkc-bl{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;column-gap:clamp(26px,3vw,54px);row-gap:clamp(6px,.7vw,12px);font:500 clamp(22px,2.2vw,36px)/1.15 ${FT};letter-spacing:-.012em;color:${INK}}
.wkc-bl li{white-space:nowrap}
.wkc-bl li.wkc-bl-tbc{color:${COBALT};font-weight:400}

/* stats on grid cards: only what exists */
.wkc-st{display:flex;flex-wrap:wrap;gap:4px 18px;margin:12px 10px 0;font-size:clamp(14px,1.05vw,16px);line-height:1.3;color:${COBALT};font-weight:500}
.wkc-st b{font-weight:800;color:${INK}}

.wkc-grid{position:relative;z-index:1;padding:0 var(--gut);display:flex;flex-direction:column;gap:clamp(14px,1.6vw,26px)}
.wkc-row{display:flex;gap:clamp(14px,1.6vw,26px)}
.wkc-card{flex:1 1 0;min-width:0;display:block;padding:10px 10px 20px;border-radius:30px;transition:flex-grow .24s ${ARRIVE},transform .24s ${ARRIVE};opacity:0;transform:translateY(28px)}
.wkc-card.wkc-in{opacity:1;transform:none;transition:flex-grow .24s ${ARRIVE},opacity .76s ${ARRIVE} var(--d,0ms),transform .76s ${ARRIVE} var(--d,0ms)}
.wkc-card.wkc-ghost{visibility:hidden}
.wkc-m{position:relative;height:clamp(220px,25vw,400px);}
.wkc-grid .wkc-m{height:clamp(240px,calc(50vh - 170px),520px);height:clamp(240px,calc(50svh - 170px),520px)}
.wkc-m{border-radius:22px;overflow:hidden;background:${NAVY};transform:translateZ(0)}
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
  .wkc-card:hover .wkc-what,.wkc-mt:hover .wkc-what{-webkit-backdrop-filter:blur(14px) saturate(1.5) brightness(1.04);backdrop-filter:blur(14px) saturate(1.5) brightness(1.04)}
  /* layers are promoted only while the pointer is in the grid */
  .wkc-grid:has(.wkc-card:hover) .wkc-m>img,.wkc-grid:has(.wkc-card:hover) .wkc-m>.wkc-ph{will-change:transform,filter}
  /* the blur: everything you are not pointing at goes soft, the card you point at pulls into focus */
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>img,.wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>.wkc-ph{filter:blur(8px) saturate(.9)}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) :is(h3,p){opacity:.55;transition:opacity .24s ${ARRIVE}}
  .wkc-card:hover .wkc-m>img,.wkc-card:hover .wkc-m>.wkc-ph{animation:wkc-pull .6s ${ARRIVE}}
}
@keyframes wkc-pull{from{filter:blur(10px)}to{filter:blur(0)}}

/* ---------- the project page: one horizontal run of panels ---------- */
html.wkc-lock,html.wkc-lock body{overflow:hidden!important}
.wkc-page{position:fixed;inset:0;z-index:9;overflow:hidden;background:var(--wkc-ground,${BLUE});color:${INK};font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;
  visibility:hidden;transform:translateY(100%);--gv:0;--gs:1;overscroll-behavior:none;user-select:none;-webkit-user-select:none}
.wkc-page.wkc-on{visibility:visible;transform:none;transition:transform .76s ${MOVE}}
.wkc-page.wkc-out{visibility:visible;transform:translateY(100%);transition:transform .42s ${LEAVE}}
.wkc-pbg{position:absolute;inset:-60px;pointer-events:none}
.wkc-pbg b{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(38px) grayscale(1) contrast(1.1);mix-blend-mode:multiply;transform:scale(1.1);opacity:.35}
.wkc-sc{position:absolute;inset:0;overflow:hidden;touch-action:pan-x}
.wkc-sc.wkc-native{overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.wkc-sc.wkc-native::-webkit-scrollbar{display:none}
.wkc-sc.wkc-drag{cursor:grabbing}
.wkc-track{display:flex;height:100%;width:max-content;will-change:transform;transition:opacity .24s ${ARRIVE}}
.wkc-track.wkc-swap{opacity:0;transition:opacity .24s ${LEAVE}}
.wkc-pn{flex:0 0 auto;height:100%;padding:clamp(76px,12vh,104px) var(--pg-x) var(--pg-bot);display:flex;flex-direction:column;justify-content:center;overflow:hidden;scroll-snap-align:start}
.wkc-pn.wkc-hero{width:100vw;align-items:center}
.wkc-pn.wkc-hero img{display:block;max-width:84vw;max-height:calc(100vh - 170px);max-height:calc(100svh - 170px);width:auto;height:auto;border-radius:22px;box-shadow:0 1px 0 rgba(15,37,69,.10),0 40px 80px -36px rgba(15,37,69,.5);pointer-events:none}

/* type inside the project pages: one display face for titles, one quiet text face for everything else.
   Four sizes do all the work: title, intro, body, small. Text panels share one top line and one left edge. */
.wkc-page{font-family:${FT};font-weight:400;--pg-x:clamp(20px,3.4vw,56px);--pg-top:clamp(118px,26vh,250px);--pg-bot:clamp(60px,9vh,84px);--pad:clamp(24px,2.6vw,40px);
  --t-title:min(9vw,15.5vh,148px);--t-intro:clamp(19px,min(1.85vw,3.05vh),28px);--t-body:clamp(17px,min(1.4vw,2.35vh),21px);--t-small:clamp(14px,min(1.1vw,1.8vh),16px)}
.wkc-pn.wkc-ttl,.wkc-pn.wkc-fx,.wkc-pn.wkc-tx{justify-content:flex-start;padding-top:var(--pg-top)}
/* the title panel runs to the screen edge less one gutter, so at rest only the facts box's frosted edge peeks in, never cut text */
.wkc-pn.wkc-ttl{width:calc(100vw - var(--pg-x))}
.wkc-page h1{margin:0 0 .3em -.04em;font:${FD_TITLE};font-size:var(--t-title);line-height:.92;letter-spacing:-.025em;text-wrap:balance}
.wkc-blurb{margin:0;max-width:30em;font-size:var(--t-intro);line-height:1.38;letter-spacing:-.008em;text-wrap:pretty}
.wkc-live{align-self:flex-start;display:inline-flex;align-items:center;margin-top:min(4.4vh,40px);font-weight:600;font-size:16px;line-height:1;color:${PAPER};background:${INK};text-decoration:none;padding:15px 22px;border-radius:99px;transition:background-color .24s ${ARRIVE},transform .24s ${ARRIVE}}
.wkc-live:hover{background:${COBALT}}
.wkc-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:min(4.4vh,40px)}
.wkc-links .wkc-live{margin-top:0}
.wkc-live.wkc-live2{background:transparent;color:${INK};box-shadow:inset 0 0 0 1.5px ${INK}}
.wkc-live.wkc-live2:hover{background:${INK};color:${PAPER}}
/* stats on the project page: a missing number keeps its spot as 000, number to come */
.wkc-pst{display:flex;flex-wrap:wrap;gap:16px clamp(30px,3.4vw,60px);margin-top:min(4.4vh,40px)}
.wkc-pst div{display:flex;flex-direction:column;min-width:0}
.wkc-pst b{font:${FD_TITLE};font-size:clamp(38px,min(4.4vw,7vh),72px);line-height:.95;letter-spacing:-.02em;color:${INK}}
.wkc-pst span{margin-top:8px;font-size:var(--t-small);line-height:1.3;font-weight:600;color:${COBALT}}
.wkc-pst .wkc-tbc b{opacity:.32}
.wkc-live:active{transform:scale(.96,.93)}
/* the frosted boxes hang their padding outside the top line, so the first line of text sits level with the title */
.wkc-box{align-self:flex-start;border-radius:clamp(20px,2.4vw,30px);padding:var(--pad);margin:calc(-1 * var(--pad)) 0 0 calc(-1 * var(--pad))}
.wkc-facts{margin:0;display:grid;grid-template-columns:minmax(7em,max-content) minmax(12em,22em);gap:18px clamp(24px,2.6vw,40px);align-items:baseline}
.wkc-facts div{display:contents}
.wkc-facts dt{font-size:var(--t-small);line-height:1.3;color:${COBALT};font-weight:600;max-width:12em}
.wkc-facts dd{margin:0;font-size:var(--t-body);line-height:1.4;font-weight:500;text-wrap:pretty}
.wkc-tx .wkc-box{max-height:100%;display:flex;flex-direction:column;min-height:0}
.wkc-cols{flex:none;font-size:var(--t-body);max-height:calc(100vh - var(--pg-top) - var(--pg-bot));max-height:calc(100svh - var(--pg-top) - var(--pg-bot));column-width:var(--wkc-cw);column-gap:var(--wkc-cg);column-fill:auto;--wkc-cw:min(31em,74vw);--wkc-cg:clamp(32px,3.6vw,56px)}
.wkc-cols p{margin:0 0 1em;font-size:inherit;line-height:1.56;text-wrap:pretty;break-inside:avoid-column}
.wkc-cols p:last-child{margin-bottom:0}
/* a writeup of a sentence or two is set at the intro size, so a text-only page reads as a statement, not a stub */
.wkc-cols.wkc-short{font-size:var(--t-intro);--wkc-cw:min(24em,74vw)}
.wkc-cols.wkc-short p{line-height:1.38;letter-spacing:-.008em}
.wkc-cols p.wkc-note{margin-top:1.4em;font-size:var(--t-small);line-height:1.45;color:${COBALT};font-weight:600}

/* the reel grid, from the flight build: rounded cards, the hovered one grows and pushes its neighbours */
.wkc-pn.wkc-rgp{padding-left:clamp(10px,1.6vw,26px);padding-right:clamp(10px,1.6vw,26px)}
.wkc-rg{flex:1 1 0;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:max-content;gap:clamp(10px,1.4vw,20px);align-content:stretch}
.wkc-rc{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:block;height:100%;border-radius:clamp(12px,1.6vw,22px);overflow:hidden;background:${NAVY};
  transition:transform .48s ${ARRIVE},box-shadow .48s ${ARRIVE},filter .24s ${ARRIVE};box-shadow:0 1px 0 rgba(15,37,69,.08),0 24px 44px -30px rgba(15,37,69,.45)}
.wkc-rc>img,.wkc-rc>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.wkc-rc:active{transform:scale(.97,.95)}
.wkc-rc .wkc-play{position:absolute;left:12px;bottom:12px;height:34px;padding:0 14px;border-radius:17px;display:flex;align-items:center;font-size:14px;font-weight:600}

/* More work: the same frosted tiles, same blur */
.wkc-pn.wkc-mwp{padding-left:clamp(20px,3.4vw,56px);padding-right:clamp(20px,5vw,90px)}
.wkc-mwp h2.wkc-mwh{flex:none;margin:0 0 min(3.4vh,30px) -.03em;font:${FD_TITLE};font-size:clamp(40px,min(5vw,8vh),72px);line-height:.95;letter-spacing:-.02em;color:${INK}}
.wkc-mw{flex:1 1 0;min-height:0;display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,minmax(0,1fr));grid-auto-columns:clamp(220px,min(21vw,30vh),330px);gap:clamp(12px,1.4vw,20px)}
.wkc-mt{display:flex;flex-direction:column;min-height:0;padding:8px 8px 14px;border-radius:24px;transition:transform .24s ${ARRIVE}}
.wkc-mt .wkc-m{flex:1 1 0;height:auto;min-height:0;border-radius:17px}
.wkc-page .wkc-ph strong{font:${FD_TITLE};font-size:clamp(20px,2.2vw,34px);line-height:.98;letter-spacing:-.015em;overflow-wrap:normal}
.wkc-page .wkc-ph small{font-weight:600}
.wkc-page .wkc-chip{font-weight:600}
.wkc-mt h3{margin:12px 8px 0;font:${FD_TITLE};font-size:clamp(19px,1.5vw,24px);line-height:1.05;letter-spacing:-.01em;text-wrap:balance;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:none}
.wkc-mt .wkc-k{margin:4px 8px 0;font-size:14px;line-height:1.3;color:${COBALT};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}
.wkc-mt .wkc-tap{display:none}
@media (hover:hover) and (pointer:fine){
  .wkc-page:not(.wkc-dragging) .wkc-rg:hover .wkc-rc{transform:scale(.97)}
  .wkc-page:not(.wkc-dragging) .wkc-rg .wkc-rc:hover{transform:scale(1.05);z-index:2;box-shadow:0 1px 0 rgba(15,37,69,.1),0 40px 70px -30px rgba(15,37,69,.6)}
  .wkc-page:not(.wkc-dragging) .wkc-rg .wkc-rc:hover ~ .wkc-rc{transform:translateX(14px) scale(.97)}
  .wkc-page:not(.wkc-dragging) .wkc-rg .wkc-rc:has(~ .wkc-rc:hover){transform:translateX(-14px) scale(.97)}
  .wkc-mt:hover{transform:translateY(-6px)}
  .wkc-mt:hover .wkc-m>img,.wkc-mt:hover .wkc-m>.wkc-ph{transform:scale(1.05)}
  .wkc-mt:hover .wkc-open,.wkc-mt:hover .wkc-what{opacity:1;transform:none}
  .wkc-mw:has(.wkc-mt:hover) .wkc-mt:not(:hover) .wkc-m>img,.wkc-mw:has(.wkc-mt:hover) .wkc-mt:not(:hover) .wkc-m>.wkc-ph{filter:blur(8px) saturate(.9)}
  .wkc-mw:has(.wkc-mt:hover) .wkc-mt:not(:hover) :is(h3,.wkc-k){opacity:.55;transition:opacity .24s ${ARRIVE}}
  .wkc-mt:hover .wkc-m>img,.wkc-mt:hover .wkc-m>.wkc-ph{animation:wkc-pull .6s ${ARRIVE}}
}
/* phones: the first tap previews, the second opens */
.wkc-mw.wkc-has-pre .wkc-mt:not(.wkc-pre) .wkc-m>img,.wkc-mw.wkc-has-pre .wkc-mt:not(.wkc-pre) .wkc-m>.wkc-ph{filter:blur(8px) saturate(.9)}
.wkc-mw.wkc-has-pre .wkc-mt:not(.wkc-pre) :is(h3,.wkc-k){opacity:.55}
.wkc-mt.wkc-pre{transform:translateY(-6px)}
.wkc-mt.wkc-pre .wkc-m>img,.wkc-mt.wkc-pre .wkc-m>.wkc-ph{transform:scale(1.05);animation:wkc-pull .6s ${ARRIVE}}
.wkc-mt.wkc-pre .wkc-open{opacity:1;transform:none}
.wkc-mt .wkc-m>img,.wkc-mt .wkc-m>.wkc-ph{transition:transform .76s ${ARRIVE},filter .24s ${ARRIVE}}

.wkc-back{position:absolute;z-index:4;left:18px;top:18px;height:44px;padding:0 20px;border-radius:22px;display:inline-flex;align-items:center;font-weight:600;font-size:16px;color:${INK};transition:transform .24s ${ARRIVE}}
.wkc-back:active{transform:scale(.95,.9)}
.wkc-pbar{position:absolute;z-index:3;left:clamp(20px,3.4vw,56px);right:clamp(20px,3.4vw,56px);bottom:clamp(20px,3.4vh,30px);height:2px;background:rgba(15,37,69,.18);border-radius:2px;pointer-events:none}
.wkc-pbar i{position:absolute;top:-7px;left:0;width:44px;height:16px;margin-left:-22px;border-radius:99px;will-change:transform}
.wkc-pbar b{position:absolute;left:0;top:0;bottom:0;width:100%;background:${COBALT};border-radius:2px;transform-origin:0 50%;transform:scaleX(0)}

.wkc-lb{position:absolute;inset:0;z-index:6;display:none;place-items:center;padding:4vmin;background:rgba(15,37,69,.78);cursor:zoom-out}
.wkc-lb.wkc-on{display:grid}
.wkc-lb img,.wkc-lb video{max-width:100%;max-height:88vh;max-height:88svh;border-radius:18px;display:block}

@media (max-width:820px){
  .wkc-top{padding:12px 16px}
  .wkc-tabs button{height:40px;padding:0 18px;font-size:17px}.wkc-ind{height:40px}
  .wkc-head{display:block;padding:26px 16px 18px}.wkc-head p{margin-top:14px}
  .wkc-grid{padding:0 16px;gap:22px}.wkc-row{flex-direction:column;gap:22px}
  .wkc-card.wkc-ghost{display:none}
  .wkc-m,.wkc-grid .wkc-m{height:62vw}
  .wkc-brands{margin:0 16px 26px;grid-template-columns:minmax(0,1fr)}
  .wkc-bl{column-gap:22px}
  .wkc-bl li{white-space:normal;overflow-wrap:anywhere}
  }
@media (max-width:760px){
  .wkc-page{--pg-x:20px;--pg-top:max(112px,25vh);--pg-bot:64px;--pad:22px;--t-title:min(14.4vw,8.4vh);--t-intro:20px;--t-body:17px;--t-small:14px}
  .wkc-pn{padding:72px var(--pg-x) var(--pg-bot)}
  .wkc-pn.wkc-ttl,.wkc-pn.wkc-fx{width:100vw}
  .wkc-pn.wkc-tx{min-width:100vw}
  .wkc-pn.wkc-hero img{max-width:calc(100vw - 40px)}
  /* on a phone the boxes sit inside the gutter: the box edge, not its text, lines up with the title */
  .wkc-box{margin:0;align-self:stretch}
  .wkc-facts{grid-template-columns:minmax(0,1fr);gap:0}
  .wkc-facts dt{max-width:none;margin-top:16px}.wkc-facts div:first-child dt{margin-top:0}
  .wkc-facts dd{margin-top:3px}
  .wkc-cols{--wkc-cw:calc(100vw - 2 * var(--pg-x) - 2 * var(--pad));--wkc-cg:calc(2 * var(--pg-x) + 2 * var(--pad));max-height:calc(100svh - var(--pg-top) - var(--pg-bot) - 2 * var(--pad))}
  .wkc-pn.wkc-rgp{padding-left:10px;padding-right:10px}
  .wkc-mw{grid-auto-columns:min(42vw,200px)}
  .wkc-pst{gap:14px 26px}
  .wkc-back{left:16px;top:16px}
}
/* ---------- the grid without glass (Kirtan, 14 Nov): solid grounds, full-bleed images, solid type ---------- */
.wkc-top{background:var(--wkc-ground,${BLUE});-webkit-backdrop-filter:none;backdrop-filter:none;gap:0;padding-top:20px;padding-bottom:16px}
.wkc-tabs{padding:0;border-radius:0;gap:clamp(22px,2.4vw,36px)}
.wkc-tabs button{height:auto;padding:6px 0 10px;border-radius:0;font:500 clamp(19px,1.5vw,22px)/1.1 ${FT};letter-spacing:-.01em;color:rgba(12,13,15,.5);transition:color .24s ${ARRIVE}}
.wkc-tabs button:hover{color:${INK}}
.wkc-tabs button.wkc-on{color:${INK}}
.wkc-ind{top:auto;bottom:0;left:0;height:2px;border-radius:0;background:${INK}}
.wkc-bg{display:none}
.wkc-grid{gap:clamp(44px,4.4vw,72px)}
.wkc-row{gap:clamp(24px,2.6vw,44px)}
.wkc-card,.wkc-card.wkc-in{padding:0;border-radius:0;background:none;box-shadow:none}
.wkc-card{transition:opacity .76s ${ARRIVE},transform .76s ${ARRIVE}}
.wkc-card.wkc-in{transition:opacity .76s ${ARRIVE} var(--d,0ms),transform .76s ${ARRIVE} var(--d,0ms)}
.wkc .wkc-m{border-radius:3px;background:${NAVY}}
.wkc .wkc-chip{display:none}
.wkc-kd{display:block;margin:18px 0 0;font:600 clamp(14px,1.05vw,16px)/1.3 ${FT};color:${COBALT}}
.wkc-card h3{margin:6px 0 10px;font:400 clamp(34px,3.3vw,56px)/1 ${FD};letter-spacing:-.02em;color:${INK};-webkit-line-clamp:2}
.wkc-card h3 span{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.14em;text-decoration-color:transparent;transition:text-decoration-color .24s ${ARRIVE}}
.wkc-card p{margin:0;font:400 clamp(16px,1.15vw,18px)/1.45 ${FT};color:${INK};max-width:46ch}
.wkc-card .wkc-st{margin:12px 0 0;font-family:${FT};font-weight:500}
.wkc-card .wkc-st b{font-weight:600}
/* text-only work: a solid navy block with the name set in the display face */
.wkc-ph{background:${NAVY}}
.wkc-ph i{display:none}
.wkc-ph .wkc-plate{inset:0;border-radius:0;padding:clamp(18px,2.2vw,32px);background:none;box-shadow:none}
.wkc-ph .wkc-plate::before{display:none}
.wkc .wkc-ph strong,.wkc-page .wkc-ph strong{font:400 clamp(30px,3.4vw,58px)/.95 ${FD};letter-spacing:-.02em;color:${PAPER};overflow-wrap:normal}
.wkc .wkc-ph small,.wkc-page .wkc-ph small{color:${PINK};font:600 clamp(14px,1.05vw,16px)/1.3 ${FT}}
.wkc .wkc-ph small{display:none}
/* More work tiles follow the cards */
.wkc-mt{padding:0;border-radius:0;background:none;box-shadow:none}
.wkc-mt .wkc-m{border-radius:3px}
.wkc-mt h3{margin:10px 0 0}
.wkc-mt .wkc-k{margin:3px 0 0}
.wkc-page .wkc-chip.wkc-what{background:${PAPER};border-radius:3px}
.wkc-page .wkc-open{border-radius:3px}
@media (hover:hover) and (pointer:fine){
  .wkc-row:hover .wkc-card,.wkc-row .wkc-card:hover{flex-grow:1}
  .wkc-card:hover .wkc-m>img,.wkc-card:hover .wkc-m>.wkc-ph{transform:scale(1.03);animation:none}
  .wkc-card:hover h3 span{text-decoration-color:currentColor}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>img,.wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>.wkc-ph{filter:blur(3px) saturate(.85)}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) :is(h3,p,.wkc-kd,.wkc-st){opacity:.5}
  .wkc-mt:hover{transform:none}
  .wkc-mt:hover .wkc-m>img,.wkc-mt:hover .wkc-m>.wkc-ph{transform:scale(1.03);animation:none}
  .wkc-mw:has(.wkc-mt:hover) .wkc-mt:not(:hover) .wkc-m>img,.wkc-mw:has(.wkc-mt:hover) .wkc-mt:not(:hover) .wkc-m>.wkc-ph{filter:blur(3px) saturate(.85)}
}
.wkc-mt.wkc-pre{transform:none}
@media (max-width:820px){
  .wkc-top{padding:14px 16px 12px}
  .wkc-tabs button{height:auto;font-size:18px}.wkc-ind{height:2px}
  .wkc-grid{gap:40px}.wkc-row{gap:40px}
  .wkc-card h3{font-size:clamp(32px,9vw,42px)}
}
@media (prefers-reduced-motion:reduce){
  .wkc-card,.wkc-card.wkc-in,.wkc-brands{opacity:1;transform:none;transition:none}
  .wkc *,.wkc-page *{animation:none!important;transition-duration:.01ms!important}
  .wkc-page.wkc-on,.wkc-page.wkc-out{transition:opacity .2s linear}
  .wkc-page{transform:none;opacity:0}.wkc-page.wkc-on{opacity:1}.wkc-page.wkc-out{opacity:0;transform:none}
  .wkc-grid:has(.wkc-card:hover) .wkc-card:not(:hover) .wkc-m>*,.wkc-mw .wkc-m>*{filter:none!important}
}
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const src = (p) => BASE + p;
const isText = (p) => TEXT_ONLY.has(p.id) || !p.hero;
const kindOf = (p) => ((p.facts || []).find(f => /^(kind|what it is|output|role)$/i.test(f.label)) || {}).value || WING[p.wing].title;
const domain = (u) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
const clean = (s) => String(s == null ? '' : s).replace(/\s*[—–]\s*/g, ', ').replace(/--/g, ',').replace(/[←-⇿·]/g, '');

/* thumbnails: <name>.w640.webp and <name>.w1280.webp sit next to each original */
const THUMBABLE = /\.(jpe?g|png)$/i;
const thumb = (p, w) => p.replace(THUMBABLE, `.w${w}.webp`);
function setImg(im, path, sizes) {
  if (!THUMBABLE.test(path)) { im.src = src(path); return im; }
  im.sizes = sizes;
  im.srcset = `${src(thumb(path, 640))} 640w, ${src(thumb(path, 1280))} 1280w`;
  im.src = src(thumb(path, 640));
  im.addEventListener('error', function fb() { im.removeEventListener('error', fb); im.removeAttribute('srcset'); im.removeAttribute('sizes'); im.src = src(path); });
  return im;
}
const small = (path) => THUMBABLE.test(path) ? src(thumb(path, 640)) : src(path);
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));

/* numbers: 1.2M, 340K; null or a non-number means absent, 0 is a value */
function fmt(n) {
  if (n == null || n === '' || !isFinite(+n)) return null;
  n = +n; const a = Math.abs(n);
  const U = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (let i = 0; i < U.length; i++) {
    const [u, s] = U[i]; if (a < u) continue;
    let v = n / u; v = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
    if (Math.abs(v) >= 1000 && i > 0) { const [u2, s2] = U[i - 1]; v = Math.round((n / u2) * 10) / 10; return String(v).replace(/\.0$/, '') + s2; }
    return String(v).replace(/\.0$/, '') + s;
  }
  return String(Math.round(n));
}
const STATS = { software: [['visitors', 'Visitors', 'visitors']], media: [['views', 'Views', 'views'], ['shares', 'Shares', 'shares'], ['likes', 'Likes', 'likes']] };
const statOf = (p, k) => fmt(p.stats && typeof p.stats === 'object' ? p.stats[k] : null);
function linksOf(p) {
  const out = [], seen = new Set();
  const add = (url, label) => { if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return; const k = url.replace(/\/$/, ''); if (seen.has(k)) return; seen.add(k); out.push({ url, label: clean(label || domain(url)) }); };
  if (p.link) add(p.link, domain(p.link));
  for (const l of Array.isArray(p.links) ? p.links : []) if (l) add(l.url, l.label);
  return out;
}
const brandsOf = (p) => (Array.isArray(p.brands) ? p.brands : []).map(clean).filter(Boolean);
let BRANDS = [];

let DATA = { software: [], media: [] }, ALL = [], byId = new Map(), tab = 'software', openId = null;
let ui = {};

/* ---------- frosted text-only plate ---------- */
function plate(p, i) {
  const d = el('div', 'wkc-ph');
  const sets = WING[p.wing].plates, s = sets[i % sets.length];
  d.style.setProperty('--wkc-p0', s[0]); d.style.setProperty('--wkc-p1', s[1]); d.style.setProperty('--wkc-p2', s[2]);
  d.append(el('i'), el('i'));
  const g = el('div', 'wkc-plate');
  g.append(el('strong', '', clean(p.name)), el('small', '', clean(kindOf(p))));
  d.appendChild(g);
  return d;
}
function media(p, i, opt = {}) {
  const m = el('div', 'wkc-m');
  if (isText(p)) m.appendChild(plate(p, i));
  else {
    const im = el('img'); im.alt = ''; im.decoding = 'async'; im.draggable = false;
    im.width = 640; im.height = 400;                                  // the box sets the real size; this only stops a reflow
    if (opt.eager) { im.loading = 'eager'; im.fetchPriority = 'high'; } else im.loading = 'lazy';
    setImg(im, p.hero, opt.sizes || '(max-width:820px) 92vw, 45vw');
    m.appendChild(im);
  }
  m.appendChild(el('span', 'wkc-chip wkc-open', 'Open'));
  if (!isText(p)) m.appendChild(el('span', 'wkc-chip wkc-what', clean(kindOf(p))));
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
    if (on) { ui.ind.style.width = b.offsetWidth + 'px'; ui.ind.style.transform = `translateX(${b.offsetLeft}px)`; }
  });
  letters(ui.title, W.title);
  ui.sub.textContent = W.sub + (HOVER.matches ? ' Hover a card, click to open it.' : ' Tap a card to open it.');
  brandLine(t);
  const g = ui.grid; g.textContent = '';
  const list = DATA[t], per = perRow(list);
  let row;
  list.forEach((p, i) => {
    if (i % per === 0) { row = el('div', 'wkc-row'); g.appendChild(row); }
    const c = el('button', 'wkc-card'); c.type = 'button'; c.dataset.id = p.id;
    c.style.setProperty('--d', (i % per) * 70 + 'ms');
    c.setAttribute('aria-label', `${p.name}. Open the project`);
    const h = el('h3'); h.appendChild(el('span', '', clean(p.name)));
    c.append(media(p, i, { eager: i < per, sizes: cardSizes(per) }), el('span', 'wkc-kd', clean(kindOf(p))), h, el('p', '', clean(p.one_line)));
    const st = cardStats(p); if (st) c.appendChild(st);
    c.addEventListener('click', () => go(p.id));
    let dwell = 0;
    c.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(dwell); dwell = setTimeout(() => warmHero(p), 160); });
    c.addEventListener('pointerleave', () => clearTimeout(dwell));
    row.appendChild(c);
  });
  if (row) { const miss = (per - row.children.length) % per; for (let k = 0; k < miss; k++) { const s = el('div', 'wkc-card wkc-ghost'); s.setAttribute('aria-hidden', 'true'); row.appendChild(s); } }
  reveal(instant);
  // the other tab's first row comes down while nothing else is happening, so switching is instant
  idle(() => { const o = t === 'software' ? 'media' : 'software', l = DATA[o], n = perRow(l);
    l.slice(0, n).forEach(p => { if (isText(p)) return; const im = new Image(); setImg(im, p.hero, cardSizes(n)); }); });
}
const perRow = () => 2;                                   // Kirtan: the grid reads as 2 by 2, scrolling for the rest
const cardSizes = (per) => `(max-width:820px) 92vw, ${per === 2 ? 62 : 46}vw`;
function cardStats(p) {
  const row = el('div', 'wkc-st'); let n = 0;
  for (const [k, , unit] of STATS[p.wing] || []) { const v = statOf(p, k); if (v == null) continue; const s = el('span'); s.append(el('b', '', v), document.createTextNode(' ' + unit)); row.appendChild(s); n++; }
  return n ? row : null;
}
const warmed = new Set();
function warmHero(p) {                                   // pointing at a card for a moment fetches and decodes its full hero
  if (isText(p) || warmed.has(p.hero)) return; warmed.add(p.hero);
  const im = new Image(); im.src = src(p.hero); if (im.decode) im.decode().catch(() => {});
}
function brandLine(t) {
  const b = ui.brands; if (!b) return;
  b.hidden = t !== 'media';
  if (b.hidden || b.dataset.built) return;
  b.dataset.built = '1';
  const list = el('ul', 'wkc-bl');
  if (BRANDS.length) for (const n of BRANDS) list.appendChild(el('li', '', n));
  else { const li = el('li', 'wkc-bl-tbc', 'Brand names to come'); list.appendChild(li); }
  b.append(el('h3', 'wkc-bh', 'Brands impacted'), list);
}
function backdrop(p) {
  const b = ui.bgi;
  if (p && p.hero && !isText(p)) { const u = `url("${small(p.hero)}")`; if (b._u !== u) { b._u = u; b.style.backgroundImage = u; } b.classList.add('wkc-on'); }
  else b.classList.remove('wkc-on');
}
let io = null;
function reveal(instant) {
  const cards = [...ui.grid.querySelectorAll('.wkc-card:not(.wkc-ghost)')];
  if (ui.brands && !ui.brands.hidden && !ui.brands.classList.contains('wkc-in')) cards.unshift(ui.brands);
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
  const tabs = el('div', 'wkc-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Work');
  const ind = el('span', 'wkc-ind'); tabs.appendChild(ind);
  for (const k of ['software', 'media']) {
    const b = el('button', '', WING[k].title); b.type = 'button'; b.dataset.tab = k; b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { if (tab === k) return; setTab(k, false); const y = wrap.getBoundingClientRect().top + scrollY; if (scrollY > y + 4) scrollTo({ top: y, behavior: RM.matches ? 'auto' : 'smooth' }); });
    tabs.appendChild(b);
  }
  top.appendChild(tabs);
  const head = el('div', 'wkc-head'); const title = el('h2', 'wkc-title'); const sub = el('p'); head.append(title, sub);
  const grid = el('div', 'wkc-grid');
  const brands = el('div', 'wkc-brands'); brands.hidden = true;
  wrap.append(bg, top, head, brands, grid);
  ROOT.textContent = ''; ROOT.appendChild(wrap);
  ui = { wrap, tabs, ind, title, sub, grid, bgi, brands };
  // body.final sets overflow on both html and body, which makes body the sticky container and stops sticky dead.
  // So the tab bar and the backdrop are held at the top of the viewport by hand while the section is on screen.
  // one read and one write per frame, and nothing written when the value has not moved
  let th = 0, ly = -1, lby = -1, holdQ = 0;
  const hold = () => {
    holdQ = 0;
    const r = wrap.getBoundingClientRect(); if (!th) th = top.offsetHeight;
    const y = Math.round(Math.max(0, Math.min(-r.top, r.height - th)));
    const by = Math.round(Math.max(0, Math.min(-r.top, r.height - innerHeight)));
    if (y !== ly) { ly = y; top.style.transform = y ? `translate3d(0,${y}px,0)` : ''; }
    if (by !== lby) { lby = by; bgs.style.transform = by ? `translate3d(0,${by}px,0)` : ''; }
  };
  addEventListener('scroll', () => { if (!holdQ) holdQ = requestAnimationFrame(hold); }, { passive: true });
  const placeInd = () => { const b = tabs.querySelector('.wkc-on'); if (b) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft}px)`; } };
  addEventListener('resize', () => { th = 0; hold(); placeInd(); }); hold();
  ui.placeInd = placeInd;
}

/* ---------- the project page ---------- */
const hx = { x: 0, t: 0, max: 0, v: 0, native: false, stops: [], dragged: false, lastWheel: 0, snapped: true, dir: 1 };
let page, pbg, sc, track, bar, barFill, lb, back, raf = 0, last = 0, pdown = false;

function buildShell() {
  page = el('article', 'wkc-page'); page.id = 'wkc-page'; page.setAttribute('aria-hidden', 'true'); page.setAttribute('aria-label', 'Project');
  pbg = el('div', 'wkc-pbg'); pbg.append(el('b'));
  sc = el('div', 'wkc-sc');
  back = el('button', 'wkc-back wkc-glass', 'Back'); back.type = 'button'; back.addEventListener('click', close);
  const pb = el('div', 'wkc-pbar'); barFill = el('b'); bar = el('i', 'wkc-glass'); pb.append(barFill, bar);
  lb = el('div', 'wkc-lb'); lb.addEventListener('click', (e) => { if (e.target.tagName !== 'VIDEO') closeLb(); });
  page.append(pbg, sc, back, pb, lb);
  document.body.appendChild(page);

  sc.addEventListener('wheel', (e) => {
    if (lb.classList.contains('wkc-on')) { e.preventDefault(); return; }
    if (hx.native) return;
    e.preventDefault();
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerWidth : 1;
    const d = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * k;
    if (d) hx.dir = Math.sign(d);
    hx.t = Math.max(0, Math.min(hx.max, hx.t + d)); hx.lastWheel = performance.now(); hx.snapped = false; kick();
  }, { passive: false });
  sc.addEventListener('scroll', kick, { passive: true });
  let sx = 0, st = 0;
  sc.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || hx.native || e.button !== 0) return; pdown = true; sx = e.clientX; st = hx.t; hx.dragged = false; kick(); });
  addEventListener('pointermove', (e) => { if (!pdown) return; const dx = e.clientX - sx; if (dx) hx.dir = -Math.sign(e.movementX || dx); if (Math.abs(dx) > 6) { hx.dragged = true; sc.classList.add('wkc-drag'); page.classList.add('wkc-dragging'); } if (hx.dragged) { hx.t = Math.max(0, Math.min(hx.max, st - dx)); hx.snapped = true; kick(); } });
  addEventListener('pointerup', () => { if (!pdown) return; pdown = false; sc.classList.remove('wkc-drag'); page.classList.remove('wkc-dragging'); if (hx.dragged) { hx.lastWheel = performance.now(); hx.snapped = false; kick(); } setTimeout(() => { hx.dragged = false; }, 0); });
  sc.addEventListener('click', (e) => { if (hx.dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  addEventListener('keydown', (e) => {
    if (!openId) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!closeLb()) close(); return; }
    if (hx.native || lb.classList.contains('wkc-on')) return;
    const fwd = e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && e.target === document.body), bk = e.key === 'ArrowLeft' || e.key === 'PageUp';
    if (!fwd && !bk && e.key !== 'Home' && e.key !== 'End') return; e.preventDefault();
    if (e.key === 'Home') hx.t = 0; else if (e.key === 'End') hx.t = hx.max;
    else if (fwd) { const n = hx.stops.find(v => v > hx.t + 8); hx.t = n == null ? hx.max : n; }
    else { const pr = hx.stops.filter(v => v < hx.t - 8); hx.t = pr.length ? pr[pr.length - 1] : 0; }
    hx.snapped = true; kick();
  });
  addEventListener('resize', () => { if (openId) { hx.native = isNative(); sc.classList.toggle('wkc-native', hx.native); layout(); } });
  // outside taps clear a More work preview
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.wkc-mt')) clearPre(); }, true);
}
const isNative = () => matchMedia('(pointer: coarse)').matches || innerWidth < 760;

/* heavy media waits until the page has slid in (or runs at once when the page is already up) */
let laterQ = [], laterT = 0, pageSettled = false;
function later(fn) { if (pageSettled) fn(); else laterQ.push(fn); }
function flushLater() { clearTimeout(laterT); pageSettled = true; const q = laterQ; laterQ = []; for (const f of q) f(); }
/* layout is measured at most once per frame, however many images land in it */
let layoutQ = 0;
function relayout() { if (!layoutQ) layoutQ = requestAnimationFrame(() => { layoutQ = 0; layout(); kick(); }); }

function gallery(p) {
  if (isText(p)) return [];
  const out = [];
  if (p.wing === 'media') {                                     // one reel per shoot: <shoot>-loop.mp4, its first still as poster
    const seen = new Set();
    for (const g of p.gallery || []) { const m = g.match(/^(.*\/)([a-z0-9-]+?)-\d+\.jpg$/i); if (!m || seen.has(m[2])) continue; seen.add(m[2]); out.push({ v: `${m[1]}${m[2]}-loop.mp4`, poster: g }); }
    if (!out.length && p.video) out.push({ v: p.video, poster: p.hero });
    return out;
  }
  if (p.video) out.push({ v: p.video, poster: p.hero });
  const rest = (p.gallery || []).filter(g => g && g !== p.hero);
  for (const g of rest.length ? rest : [p.hero]) out.push({ i: g });
  return out.slice(0, 12);
}
function buildReels(p) {
  const list = gallery(p); if (!list.length) return [];
  const phone = innerWidth < 760;
  const groups = { h: el('section', 'wkc-pn wkc-rgp'), w: el('section', 'wkc-pn wkc-rgp'), v: el('section', 'wkc-pn wkc-rgp') }, grids = {};
  for (const k in groups) { grids[k] = el('div', 'wkc-rg'); groups[k].appendChild(grids[k]); groups[k].setAttribute('aria-label', p.wing === 'media' ? 'Reels' : 'Screens'); }
  const rows = () => {
    for (const k in grids) {
      const n = grids[k].children.length; groups[k].style.display = n ? '' : 'none';
      grids[k].style.gridTemplateRows = `repeat(${k === 'w' ? Math.min(3, n) : k === 'h' ? (n > 2 || phone ? 2 : 1) : 1}, minmax(0, 1fr))`;
    }
    relayout();
  };
  const place = (card, a) => { const k = a < 0.9 ? 'v' : a > 2.1 ? 'w' : 'h'; card.style.aspectRatio = String(a); if (card.parentNode !== grids[k]) grids[k].appendChild(card); rows(); };
  const vertical = p.orientation === 'vertical' || p.orientation === 'portrait';
  for (const r of list) {
    const card = el('button', 'wkc-rc'); card.type = 'button';
    const a0 = vertical ? 9 / 16 : 16 / 10;
    if (r.i) {
      const im = el('img'); im.alt = ''; im.draggable = false; im.decoding = 'async';
      im.addEventListener('load', () => place(card, im.naturalWidth / im.naturalHeight));
      later(() => setImg(im, r.i, phone ? '92vw' : '50vw'));        // media comes down once the page has slid in
      card.appendChild(im); card.setAttribute('aria-label', 'Open this image');
    } else {
      const v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      later(() => { if (r.poster) v.poster = small(r.poster); v.src = src(r.v); });
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !RM.matches) v.play().catch(() => {}); });
      card.addEventListener('pointerleave', () => v.pause());
      card.append(v, el('span', 'wkc-play wkc-glass', 'Play'));
      card.setAttribute('aria-label', 'Play this film');
    }
    card.addEventListener('click', () => { if (!hx.dragged) openLb(r); });
    place(card, a0);
  }
  return [groups.h, groups.w, groups.v];
}
function moreWork(p) {
  const i = ALL.indexOf(p), others = [];
  for (let k = 1; k < ALL.length && others.length < 8; k++) others.push(ALL[(i + k) % ALL.length]);
  const pn = el('section', 'wkc-pn wkc-mwp'); pn.setAttribute('aria-label', 'More work');
  pn.appendChild(el('h2', 'wkc-mwh', 'More work'));
  const g = el('div', 'wkc-mw');
  others.forEach((o, j) => {
    const t = el('button', 'wkc-mt'); t.type = 'button'; t.dataset.id = o.id;
    t.setAttribute('aria-label', `${o.name}. Open the project`);
    const m = media(o, j + 1, { sizes: '(max-width:760px) 42vw, 330px' });
    t.append(m, el('h3', '', clean(o.name)), el('p', 'wkc-k', clean(kindOf(o))));
    t.addEventListener('click', (e) => {
      if (hx.dragged) return;
      if (!HOVER.matches && !t.classList.contains('wkc-pre')) {           // phone: first tap previews
        e.preventDefault(); clearPre(); t.classList.add('wkc-pre'); g.classList.add('wkc-has-pre');
        t.querySelector('.wkc-open').textContent = 'Tap again to open';
        return;
      }
      go(o.id, true);
    });
    g.appendChild(t);
  });
  pn.appendChild(g);
  return pn;
}
function clearPre() {
  if (!page) return;
  page.querySelectorAll('.wkc-mt.wkc-pre').forEach(t => { t.classList.remove('wkc-pre'); t.querySelector('.wkc-open').textContent = 'Open'; });
  page.querySelectorAll('.wkc-mw.wkc-has-pre').forEach(g => g.classList.remove('wkc-has-pre'));
}

function buildPage(p) {
  hx.native = isNative(); sc.classList.toggle('wkc-native', hx.native);
  setGround(p.wing, [page]);
  laterQ = []; pageSettled = !!(openId && page.classList.contains('wkc-on'));
  pbg.querySelector('b').style.backgroundImage = isText(p) ? 'none' : `url("${small(p.hero)}")`;
  track = el('div', 'wkc-track');
  const pn = (cls) => { const s = el('section', 'wkc-pn ' + cls); track.appendChild(s); return s; };
  if (!isText(p)) {
    // the hero opens on the thumbnail the grid already holds, then the full-size frame drops in once decoded
    const h = pn('wkc-hero'); const im = el('img'); im.alt = p.name; im.draggable = false; im.decoding = 'async';
    const full = src(p.hero), quick = THUMBABLE.test(p.hero) ? src(thumb(p.hero, 1280)) : full;
    let first = true;
    im.addEventListener('load', () => { if (first) { first = false; relayout(); } });
    im.addEventListener('error', () => { if (im.src !== full) im.src = full; }, { once: true });
    im.src = quick; h.appendChild(im);
    if (quick !== full) { const f = new Image(); f.src = full; (f.decode ? f.decode() : Promise.resolve()).then(() => { if (im.isConnected) im.src = full; }).catch(() => {}); }
  }
  const t = pn('wkc-ttl'); t.append(el('h1', '', clean(p.name)), el('p', 'wkc-blurb', clean(p.one_line)));
  t.appendChild(pageStats(p));
  const ls = linksOf(p);
  if (ls.length) {
    const row = el('div', 'wkc-links');
    ls.forEach((l, k) => { const a = el('a', 'wkc-live' + (k ? ' wkc-live2' : ''), l.label); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; row.appendChild(a); });
    t.appendChild(row);
  }
  const brs = brandsOf(p);
  if ((p.facts || []).length || brs.length) {
    const box = el('div', 'wkc-box wkc-glass'); const dl = el('dl', 'wkc-facts');
    for (const f of p.facts || []) { const d = el('div'); const v = clean(f.value); d.append(el('dt', '', clean(f.label)), el('dd', '', v)); dl.appendChild(d); }
    if (brs.length) { const d = el('div'); d.append(el('dt', '', 'Brands'), el('dd', '', brs.join(', '))); dl.appendChild(d); }
    box.appendChild(dl); pn('wkc-fx').appendChild(box);
  }
  for (const g of buildReels(p)) track.appendChild(g);
  if ((p.writeup || []).length || p.screens_withheld) {
    const s = pn('wkc-tx'); const box = el('div', 'wkc-box wkc-glass');
    const c = el('div', 'wkc-cols');
    if ((p.writeup || []).join(' ').length < 240) c.classList.add('wkc-short');
    for (const w of p.writeup || []) c.appendChild(el('p', '', clean(w)));
    if (p.screens_withheld) c.appendChild(el('p', 'wkc-note', 'This one runs on real data, so there are no screenshots here.'));
    box.appendChild(c); s.appendChild(box);
  }
  track.appendChild(moreWork(p));
  sc.textContent = ''; sc.appendChild(track);
  Object.assign(hx, { x: 0, t: 0, v: 0, snapped: true });
  sc.scrollLeft = 0; track.style.transform = '';
  layout(); relayout(); setTimeout(relayout, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  kick();
}
function pageStats(p) {
  const row = el('div', 'wkc-pst');
  for (const [k, label] of STATS[p.wing] || []) {
    const v = statOf(p, k), d = el('div', v == null ? 'wkc-tbc' : '');
    d.append(el('b', '', v == null ? '000' : v), el('span', '', v == null ? `${label}, number to come` : label));
    row.appendChild(d);
  }
  return row;
}
function layout() {
  if (!track || !track.isConnected) return;
  for (const c of track.querySelectorAll('.wkc-cols')) {                     // columns grow sideways, never down
    const cs = getComputedStyle(c), cw = parseFloat(cs.columnWidth) || 380;
    c.style.width = cw + 'px'; c.style.width = Math.max(c.scrollWidth, cw) + 'px';
  }
  for (const g of track.querySelectorAll('.wkc-rg, .wkc-mw')) {               // card widths come from their height, so size the grid from its columns
    g.style.width = ''; let r = 0;
    for (const c of g.children) r = Math.max(r, c.offsetLeft + c.offsetWidth);
    if (r) g.style.width = Math.ceil(r - g.offsetLeft + 0) + 'px';
  }
  hx.max = Math.max(0, track.scrollWidth - innerWidth);
  hx.stops = [...track.children].filter(n => n.offsetWidth).map(n => Math.min(n.offsetLeft, hx.max));
  hx.t = Math.min(hx.t, hx.max);
  barW = bar && bar.parentNode ? bar.parentNode.clientWidth : 0;
  fr.pr = -1;
}
/* the loop only runs while something moves: wheel, drag, keys, native scroll, a relayout */
let barW = 0;
const fr = { gv: 0, gs: '', pr: -1, x: NaN };
function kick() { if (!raf && openId) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(now) {
  raf = 0;
  if (!track || !openId) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
  const before = hx.x;
  if (hx.native) hx.x = sc.scrollLeft;
  else {
    // snap: when the wheel goes quiet near a panel edge, settle on it
    if (!hx.snapped && now - hx.lastWheel > 180) {
      hx.snapped = true;
      let best = null, bd = 1e9;                                  // only ever settle forward, in the direction you were moving
      for (const s of hx.stops) { if ((s - hx.t) * (hx.dir || 1) < 0) continue; const d = Math.abs(s - hx.t); if (d < bd) { bd = d; best = s; } }
      if (best != null && bd < innerWidth * 0.2) hx.t = best;
    }
    hx.x += (hx.t - hx.x) * (RM.matches ? 1 : 1 - Math.exp(-dt * 8.5));
    if (Math.abs(hx.t - hx.x) < 0.05) hx.x = hx.t;
    if (hx.x !== fr.x) { fr.x = hx.x; track.style.transform = `translate3d(${-hx.x}px,0,0)`; }
  }
  hx.v += (((hx.x - before) / Math.max(dt, 1e-3)) - hx.v) * (1 - Math.exp(-dt * 10));
  if (Math.abs(hx.v) < 1) hx.v = 0;
  const gv = Math.max(-1, Math.min(1, hx.v / 2600));
  // --gv feeds the sheen on every glass surface, so it is written in small steps and only when it changes:
  // each write restyles the whole page
  const q = Math.round(gv * 25) / 25;
  if (q !== fr.gv) { fr.gv = q; page.style.setProperty('--gv', q.toFixed(2)); }
  const gs = (1 + Math.abs(gv) * 0.1).toFixed(3);
  const pr = hx.max ? Math.min(1, hx.x / hx.max) : 0;
  if (pr !== fr.pr || gs !== fr.gs) {                             // the bar moves on transforms only
    fr.pr = pr; fr.gs = gs;
    bar.style.transform = `translate3d(${(pr * barW).toFixed(1)}px,0,0) scaleX(${gs})`;
    barFill.style.transform = `scaleX(${pr.toFixed(4)})`;
  }
  const moving = hx.native ? Math.abs(hx.x - before) > 0.01 || hx.v !== 0 : hx.x !== hx.t || hx.v !== 0 || !hx.snapped || pdown;
  if (moving) raf = requestAnimationFrame(frame);
}

function openLb(r) {
  lb.textContent = '';
  if (r.v) { const v = el('video'); v.src = src(r.v); if (r.poster) v.poster = src(r.poster); v.controls = true; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; lb.appendChild(v); }
  else { const i = el('img'); i.src = src(r.i); i.alt = ''; lb.appendChild(i); }
  lb.classList.add('wkc-on');
  if (!RM.matches && lb.animate) lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: ARRIVE });
}
function closeLb() {
  if (!lb || !lb.classList.contains('wkc-on')) return false;
  const v = lb.querySelector('video'); if (v) v.pause();
  lb.classList.remove('wkc-on'); lb.textContent = ''; return true;
}

/* ---------- open, close, route ---------- */
let leaveT = 0;
function show(id) {
  const p = byId.get(id); if (!p) return;
  if (openId === id && page.classList.contains('wkc-on')) return;
  clearTimeout(leaveT);
  const wasOpen = !!openId && page.classList.contains('wkc-on');
  openId = id;
  if (wasOpen) {                                                  // More work: swap the run in place
    closeLb();
    if (RM.matches) buildPage(p);
    else { track.classList.add('wkc-swap'); setTimeout(() => { buildPage(p); track.classList.add('wkc-swap'); requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('wkc-swap'))); }, 240); }
    return;
  }
  buildPage(p);
  document.documentElement.classList.add('wkc-lock');
  page.classList.remove('wkc-out'); page.setAttribute('aria-hidden', 'false');
  page.getBoundingClientRect();
  page.classList.add('wkc-on');
  back.focus({ preventScroll: true });
  // the reels and stills come down after the slide, so the slide itself has the main thread to itself
  pageSettled = false; clearTimeout(laterT);
  const settle = (e) => { if (e && e.target !== page) return; page.removeEventListener('transitionend', settle); idle(flushLater); };
  if (RM.matches) flushLater(); else { page.addEventListener('transitionend', settle); laterT = setTimeout(settle, 900); }
  kick();
}
function hide() {
  if (!openId) return;
  const id = openId; openId = null; closeLb(); laterQ = []; clearTimeout(laterT);
  page.classList.remove('wkc-on'); page.classList.add('wkc-out'); page.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('wkc-lock');
  page.querySelectorAll('video').forEach(v => v.pause());
  leaveT = setTimeout(() => { page.classList.remove('wkc-out'); if (!openId) sc.textContent = ''; }, RM.matches ? 220 : 440);
  const c = ui.grid && ui.grid.querySelector(`[data-id="${id}"]`); if (c) c.focus({ preventScroll: true });
}
function go(id, inPlace) {
  const h = '#work/' + id;
  if (location.hash !== h) {
    const st = history.state || {};
    if (inPlace && openId) history.replaceState({ wkc: id, pushed: !!st.pushed }, '', h);   // More work swaps in place: one Back still closes
    else history.pushState({ wkc: id, pushed: true }, '', h);
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
  if (!r.ok) throw new Error(`work-c: ${path} ${r.status}`);
  return r.json();
}
async function init() {
  if (!ROOT) return;
  const style = el('style'); style.id = 'wkc-style'; style.textContent = CSS; document.head.appendChild(style);
  // the project-page faces: once the stylesheet is in, warm them, so the first page you open is measured with real metrics
  const warm = () => { if (document.fonts && document.fonts.load) for (const f of [`${FD_W} 40px ${FD}`, `400 18px ${FT}`, `500 18px ${FT}`, `600 18px ${FT}`]) document.fonts.load(f).then(() => { if (openId) layout(); }).catch(() => {}); };
  if (!document.getElementById('wkc-fonts')) { const lk = el('link'); lk.id = 'wkc-fonts'; lk.rel = 'stylesheet'; lk.href = FONTS; lk.addEventListener('load', warm); document.head.appendChild(lk); } else warm();
  try {
    const [sw, md, br] = await Promise.all([load('software/manifest.json'), load('media/manifest.json'), load('media/brands.json').catch(() => ({}))]);
    DATA.software = sw.filter(p => !HIDE.has(p.id));
    DATA.media = md.filter(p => !HIDE.has(p.id));
    BRANDS = (br && Array.isArray(br.brands) ? br.brands : []).map(clean).map(s => s.trim()).filter(Boolean);
  } catch (err) {
    console.warn(err);
    ROOT.innerHTML = '<div class="wkc"><div class="wkc-head"><h2 class="wkc-title">Work</h2></div></div>';
    return;
  }
  ALL = [...DATA.software, ...DATA.media];
  byId = new Map(ALL.map(p => [p.id, p]));
  buildGrid();
  buildShell();
  // build at once; the tab indicator is measured again when the faces land
  setTab(tab, false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ui.placeInd && ui.placeInd());
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  route();
  window.__wkc = { hx, go, close, show, hide, layout, kick, get openId() { return openId; } };
}

init();
