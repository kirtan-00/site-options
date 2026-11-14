/* Work, version G: Gallery. Led by how lusion.co shows its work, set in Kirtan's palette and voice.
   1. Listing: a two column, staggered gallery. The DOM is the source of truth (index, title, kind, the image slot);
      on desktop a three.js canvas paints each project as a plane over its slot: the planes curve gently with
      the scroll, bend with its speed and settle with inertia, and the one under the pointer lifts and lenses
      softly toward it. Titles trail the scroll a little. Phones, reduced motion and no WebGL get the same
      layout as plain images with a clip reveal.
   2. Transition: the clicked image leaves its slot and grows into the full-bleed hero of the project page,
      then the title rises and the page fades in under it. Next project does the same from its preview.
   3. Project page: its own vertical scroller (lerped wheel on a fine pointer, native touch). Full-bleed hero
      (the loop when there is one; phone-ratio films sit three across), huge title, an info row, stats,
      links, the writeup on a comfortable measure, the facts set large, every hero, gallery image and
      loop in a sequence of full, two-up, offset and three-up rows, credits, then Next project.
      Text-only work opens on a navy title plate, never a fake image.
   Fonts: Gloock for display, Hanken Grotesk for text (already used by the C and F project pages).

   OPTIONAL DATA FIELDS, same as version C and F (read when present, never guessed):
     stats: software { visitors }, media { views, shares, likes }; missing shows 000 and "number to come".
       Media views fall back to a facts entry labelled Views.
     links: [{ label, url }] after `link`.   brands: media brands line from ../content/media/brands.json.
     credits: [{ role, name }] shown before the role facts.   year / client: else from facts.
   Thumbnails: <name>.w640.webp and <name>.w1280.webp next to each original; a missing one falls back.
   Fills <section id="work">. Every class and id starts with wkg-. Project pages live at #work/<id>. */

const ROOT = document.getElementById('work');
const BASE = (window.KP && window.KP.content) || '../content/';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const HOVER = matchMedia('(hover: hover) and (pointer: fine)');
const HIDE = new Set(['gujarat-titans']);
const TEXT_ONLY = new Set(['clapper', 'fitkit', 'fourside-studios', 'palladium', 'dvc']);

const INK = '#0c0d0f', PAPER = '#f1f2f0', BLUE = '#c9d8f7', PINK = '#f2a7b6', SKY = '#7d9bf0', COBALT = '#1c3bb0', NAVY = '#0f2545';
const WING = {
  software: { title: 'Software', sub: 'Things I designed and built.', ground: BLUE, slot: SKY },
  media: { title: 'Media', sub: 'Films and reels I produced, shot and cut.', ground: PINK, slot: PAPER },
};
const FONTS = 'https://fonts.googleapis.com/css2?family=Gloock&family=Hanken+Grotesk:wght@400;500;600&display=swap';
const FD = '"Gloock",Georgia,serif', FT = '"Hanken Grotesk",system-ui,sans-serif';
const ARRIVE = 'cubic-bezier(.2,.8,.2,1)', MOVE = 'cubic-bezier(.76,0,.18,1)';
const FLY_MS = 1050;

const CSS = `
#work{position:relative;background:var(--wkg-ground,${BLUE});color:${INK};transition:background-color .8s ${MOVE}}
/* one grid for the listing and the pages: the same gutter, 12 columns (4 on a phone), the same column gap */
.wkg,.wkg-page{--gut:clamp(18px,4vw,64px);--cg:clamp(16px,2.2vw,32px);--cols:12}
.wkg{position:relative;font-family:${FT};font-weight:400;-webkit-font-smoothing:antialiased;padding-bottom:clamp(60px,10vh,120px)}
.wkg *,.wkg-page *,.wkg-fly *{box-sizing:border-box}
:where(.wkg,.wkg-page) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.wkg :focus-visible,.wkg-page :focus-visible{outline:2px solid ${COBALT};outline-offset:4px}
.wkg-g{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));column-gap:var(--cg)}
.wkg-sub{grid-column:1/-1;display:grid;grid-template-columns:subgrid;column-gap:var(--cg)}

.wkg-top{display:flex;gap:28px;padding:22px var(--gut) 0;position:relative;z-index:2}
.wkg-tab{position:relative;font:500 20px/1.2 ${FT}!important;padding:6px 0!important;color:rgba(12,13,15,.62)!important;transition:color .3s}
.wkg-tab::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:${INK};transform:scaleX(0);transform-origin:left;transition:transform .5s ${MOVE}}
.wkg-tab.wkg-on{color:${INK}!important}.wkg-tab.wkg-on::after{transform:none}
@media (hover:hover){.wkg-tab:hover{color:${INK}!important}}

.wkg-head{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:clamp(30px,6vh,72px) var(--gut) clamp(34px,6vh,80px)}
.wkg-title{margin:0;font:400 clamp(70px,13.4vw,232px)/.86 ${FD};letter-spacing:-.035em;display:flex;align-items:flex-start;gap:.08em}
.wkg-title sup{font:500 clamp(16px,1.5vw,24px)/1 ${FT};letter-spacing:0;color:${COBALT};margin-top:.5em;font-variant-numeric:tabular-nums}
.wkg-head p{margin:0 0 .6em;max-width:24ch;font-size:clamp(17px,1.35vw,21px);line-height:1.4}

.wkg-brands{position:relative;z-index:2;margin:0 var(--gut) clamp(40px,6vh,72px);padding-top:20px;border-top:1px solid rgba(12,13,15,.18);align-items:baseline;row-gap:12px}
.wkg-brands[hidden]{display:none}
.wkg-bh{grid-column:1/span 4;margin:0;font:400 clamp(28px,3vw,50px)/1 ${FD};letter-spacing:-.02em;white-space:nowrap}
.wkg-bl{grid-column:5/-1;list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;column-gap:clamp(24px,3vw,50px);row-gap:8px;font:500 clamp(20px,2vw,32px)/1.15 ${FT};letter-spacing:-.01em}
.wkg-bl li{white-space:nowrap}.wkg-bl .wkg-tbc{color:${COBALT};font-weight:400}

/* the canvas rides inside the list (absolute, re-pinned each frame), so when the browser scrolls the page
   on its own thread the planes move with their slots instead of a frame behind them */
.wkg-wrap{position:relative;overflow:clip}
.wkg-gl{position:absolute;left:0;top:0;display:block;width:100%;pointer-events:none;z-index:0;visibility:hidden;will-change:transform}
.wkg-gl.wkg-on{visibility:visible}
.wkg-list{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:2560px;margin:0 auto;padding:0 var(--gut);
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--lg);row-gap:var(--rg);align-items:start;transition:opacity .35s ${ARRIVE}}
.wkg-list.wkg-fade{opacity:0}
/* Lusion's listing: two equal columns, one box ratio for every card, one caption block under every box,
   so every row shares its image top, image bottom, title baseline and caption top */
.wkg{--lg:clamp(16px,2.2vw,44px);--rg:clamp(56px,6.4vw,128px);--rad:clamp(12px,1vw,18px)}
.wkg-card{display:block;width:100%;min-width:0}
.wkg-m{position:relative;display:block;width:100%;aspect-ratio:16/10;border-radius:var(--rad);overflow:hidden;background:var(--wkg-slot,${SKY});container-type:inline-size}
.wkg-m>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block;transition:transform .9s ${ARRIVE},opacity .5s}
.wkg.wkg-glon .wkg-m{background:transparent}
.wkg.wkg-glon .wkg-m>img,.wkg.wkg-glon .wkg-m>.wkg-pl{opacity:0}
.wkg-cap{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:20px;align-items:baseline;margin-top:clamp(14px,1.3vw,22px)}
.wkg-cap h3{margin:0;min-width:0;font:400 clamp(26px,2.3vw,44px)/1.08 ${FD};letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wkg-k{display:flex;gap:14px;font:500 15px/1.2 ${FT};color:rgba(12,13,15,.7);white-space:nowrap}
.wkg-n{color:${COBALT};font-variant-numeric:tabular-nums}
.wkg-cap p{grid-column:1/-1;margin:10px 0 0;width:100%;max-width:44ch;font-size:clamp(15px,1.05vw,17px);line-height:1.45;height:2.9em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* the plate: text-only work. Its own ground from the palette, a big index, the one line as a pull line, one real number */
/* everything in cqw of the box, so it is the same picture at every width and can never spill out.
   The logo (or the name set as a wordmark) is the hero; one real number sits bottom right. plateCanvas() draws the same. */
.wkg-pl{position:absolute;inset:0;overflow:hidden;background:var(--pc);color:var(--pf);container-type:inline-size;transition:opacity .5s}
.wkg-plg{position:absolute;left:20cqw;right:20cqw;top:12cqw;height:32cqw;display:flex;align-items:center;justify-content:center}
.wkg-pl.wkg-nf .wkg-plg{top:15.25cqw}
.wkg-plg img{display:block;max-width:100%;max-height:100%;width:auto;height:auto}
.wkg-plg.wkg-pw{left:8cqw;right:8cqw}
.wkg-plg.wkg-pw span{font:400 8cqw/.95 ${FD};letter-spacing:-.025em;color:var(--pa);text-align:center;text-wrap:balance}
.wkg-pf{position:absolute;right:5.5cqw;bottom:5.5cqw;max-width:40cqw;text-align:right}
.wkg-pf b{display:block;font:400 7cqw/.85 ${FD};letter-spacing:-.03em;color:var(--pa);font-variant-numeric:tabular-nums}
.wkg-pf small{display:block;margin-top:1.2cqw;font:500 max(10px,1.7cqw)/1.25 ${FT};color:var(--pk)}

.wkg-cur{position:fixed;left:0;top:0;z-index:8;pointer-events:none;padding:7px 12px;border-radius:99px;background:${INK};color:${PAPER};font:500 13px/1 ${FT};transform:translate3d(-200px,-200px,0) scale(0);transform-origin:0 0;will-change:transform;white-space:nowrap}
html.has-cursor .wkg-cur{display:none}

/* phone and no-WebGL: plain images, revealed with a clip as they arrive */
.wkg-rv .wkg-m{clip-path:inset(14% 0 0 0 round var(--rad));transition:clip-path 1s ${ARRIVE}}
.wkg-rv .wkg-m>img{transform:scale(1.12)}
.wkg-rv.wkg-in .wkg-m{clip-path:inset(0 0 0 0 round var(--rad))}
.wkg-rv.wkg-in .wkg-m>img{transform:none}
@media (hover:hover) and (pointer:fine){.wkg:not(.wkg-glon) .wkg-card:hover .wkg-m>img{transform:scale(1.04)}}

/* ---------- the flight ---------- */
.wkg-fly{position:fixed;z-index:9;overflow:hidden;pointer-events:none;background:${NAVY};will-change:left,top,width,height}
.wkg-fly>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wkg-fly .wkg-pl{transition:none}

/* ---------- the project page ---------- */
html.wkg-lock,html.wkg-lock body{overflow:hidden!important}
.wkg-page{position:fixed;inset:0;z-index:9;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  background:var(--wkg-pg,${BLUE});color:${INK};font-family:${FT};font-weight:400;-webkit-font-smoothing:antialiased}
.wkg-page.wkg-pre .wkg-hm{visibility:hidden}
.wkg-back{position:fixed;left:18px;top:18px;z-index:3;height:44px;padding:0 20px!important;border-radius:22px;background:${PAPER}!important;color:${INK}!important;font:500 16px/44px ${FT}!important;
  opacity:0;transform:translateY(-8px);transition:opacity .5s ${ARRIVE},transform .5s ${ARRIVE}}
.wkg-ready .wkg-back{opacity:1;transform:none}
.wkg-line{display:block;overflow:hidden;padding-bottom:.06em;margin-bottom:-.06em}
.wkg-line>span{display:inline-block;transform:translateY(105%);transition:transform 1s ${ARRIVE} var(--d,0ms)}
.wkg-ready .wkg-line>span{transform:none}

/* film heroes: full bleed, the title over a shade at the bottom */
.wkg-hero{position:relative;height:100vh;height:100svh;min-height:520px;overflow:hidden;background:${NAVY};color:${PAPER}}
.wkg-hm{position:absolute;inset:0}
.wkg-hm img,.wkg-hm video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wkg-hm .wkg-hi2{opacity:0;transition:opacity .6s}.wkg-hm .wkg-hi2.wkg-ld{opacity:1}
.wkg-tri{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.wkg-tri>div{position:relative;overflow:hidden}
.wkg-hero::after{content:"";position:absolute;inset:auto 0 0 0;height:58%;background:linear-gradient(to top,rgba(12,13,15,.62),rgba(12,13,15,0));pointer-events:none}
.wkg-hcap{position:absolute;left:var(--gut);right:var(--gut);bottom:clamp(30px,6vh,64px);z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:24px}
.wkg-hcap h1{margin:0;font:400 clamp(60px,10.4vw,190px)/.9 ${FD};letter-spacing:-.035em;text-wrap:balance}
.wkg-hcap>span{font:500 16px/1.3 ${FT};text-align:right;font-variant-numeric:tabular-nums;opacity:.9}
/* screen heroes: a website screenshot has its own big type, so the title sits on the page ground above it and the screen sits on the grid */
.wkg-hero.wkg-land{height:auto;min-height:0;overflow:visible;background:transparent;color:${INK};padding-top:clamp(104px,15vh,150px)}
.wkg-hero.wkg-land::after{display:none}
.wkg-hero.wkg-land .wkg-hcap{position:relative;left:auto;right:auto;bottom:auto;padding:0 var(--gut);margin-bottom:clamp(26px,4.5vh,48px)}
.wkg-hero.wkg-land .wkg-hcap>span{color:rgba(12,13,15,.7);opacity:1}
.wkg-hero.wkg-land .wkg-hm{position:relative;inset:auto;margin:0 var(--gut);aspect-ratio:16/10;border-radius:14px;overflow:hidden;background:var(--wkg-slot,${SKY})}
/* text-only heroes: a typographic opener on the plate's ground */
.wkg-hero.wkg-txt{height:auto;min-height:100vh;min-height:100svh;display:flex;flex-direction:column;justify-content:space-between;gap:56px;
  padding:clamp(96px,14vh,140px) var(--gut) clamp(40px,7vh,72px);background:var(--pc);color:var(--pf)}
.wkg-hero.wkg-txt::after{display:none}
.wkg-tm{display:flex;justify-content:space-between;gap:24px;font:500 16px/1.3 ${FT};color:var(--pk);font-variant-numeric:tabular-nums}
.wkg-tlogo{display:block;width:auto;height:auto;max-height:clamp(96px,11vw,190px);max-width:64%;margin:0 0 clamp(28px,5vh,56px)}
.wkg-tlogo.wkg-tlw{max-height:none;max-width:min(36%,460px)}
.wkg-txt h1{margin:0;font:400 clamp(64px,11.6vw,210px)/.88 ${FD};letter-spacing:-.035em;color:var(--pa);text-wrap:balance}
.wkg-tg{margin-top:clamp(30px,6vh,64px);align-items:end;row-gap:32px}
.wkg-tq{grid-column:1/span 7;margin:0;font:400 clamp(24px,2.5vw,42px)/1.14 ${FD};letter-spacing:-.012em;text-wrap:pretty}
.wkg-tf{grid-column:9/-1}
.wkg-tf b{display:block;font:400 clamp(88px,10vw,180px)/.84 ${FD};letter-spacing:-.04em;color:var(--pa);font-variant-numeric:tabular-nums}
.wkg-tf small{display:block;margin-top:14px;font:500 16px/1.3 ${FT};color:var(--pk)}

.wkg-body{opacity:0;transform:translateY(40px);transition:opacity .8s ${ARRIVE} .25s,transform 1s ${ARRIVE} .25s}
.wkg-ready .wkg-body{opacity:1;transform:none}
/* every block below sits on the same 12 columns: A is column 1, B is column 5 */
.wkg-sec{padding:clamp(56px,10vh,120px) var(--gut) 0}
.wkg-lede{grid-column:1/span 10;margin:0;font:400 clamp(30px,3.4vw,58px)/1.08 ${FD};letter-spacing:-.02em;text-wrap:pretty}
.wkg-info{margin:clamp(40px,7vh,80px) 0 0;padding-top:22px;border-top:1px solid rgba(12,13,15,.2);row-gap:24px}
.wkg-info>div{grid-column:span 4;min-width:0}
.wkg-lab{display:block;font:500 14px/1.3 ${FT};color:rgba(12,13,15,.66);margin:0 0 8px}
.wkg-info dd{margin:0;font:500 clamp(18px,1.5vw,22px)/1.3 ${FT}}
.wkg-stats{margin-top:clamp(36px,6vh,64px);row-gap:28px}
.wkg-stat{grid-column:span 4}
.wkg-stat b{display:block;font:400 clamp(56px,6.4vw,112px)/.9 ${FD};letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.wkg-stat.wkg-tbc b{color:${COBALT}}
.wkg-stat small{display:block;margin-top:10px;font:500 15px/1.3 ${FT};color:rgba(12,13,15,.7)}
.wkg-links{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:12px;margin-top:clamp(36px,6vh,60px)}
.wkg-links a{display:inline-flex;align-items:center;height:52px;padding:0 24px;border-radius:26px;background:${INK};color:${PAPER};text-decoration:none;font:500 17px/1 ${FT};transition:background-color .3s,color .3s}
.wkg-links a+a{background:transparent;color:${INK};box-shadow:inset 0 0 0 1.5px ${INK}}
@media (hover:hover){.wkg-links a:hover{background:${COBALT};color:${PAPER};box-shadow:none}}

.wkg-about{align-items:baseline;row-gap:20px}
.wkg-h2{grid-column:1/span 4;margin:0;font:400 clamp(28px,2.6vw,44px)/1 ${FD};letter-spacing:-.02em}
.wkg-wr{grid-column:5/-1;min-width:0}
.wkg-wr p{margin:0 0 1.1em;max-width:34em;font:400 clamp(19px,1.45vw,23px)/1.55 ${FT};text-wrap:pretty}
.wkg-wr p:last-child{margin-bottom:0}
.wkg-tx .wkg-wr p{max-width:24em;font:400 clamp(24px,2.1vw,36px)/1.24 ${FD};letter-spacing:-.01em}

.wkg-fact{grid-column:span 4;padding:22px 0 30px;border-top:1px solid rgba(12,13,15,.2);min-width:0}
.wkg-fact b{display:block;font:400 clamp(30px,2.6vw,44px)/1.05 ${FD};letter-spacing:-.02em;text-wrap:balance;overflow-wrap:anywhere}
.wkg-fact.wkg-num b{font-size:clamp(72px,8.4vw,150px);line-height:.9;letter-spacing:-.04em;font-variant-numeric:tabular-nums}

/* media rows: every frame starts and ends on a column line; offsets move by whole columns */
.wkg-seq{grid-column:1/-1;display:grid;grid-template-columns:subgrid;column-gap:var(--cg);row-gap:clamp(20px,3vw,48px)}
.wkg-r{align-items:start;row-gap:clamp(20px,3vw,48px)}
.wkg-r-full>.wkg-f{grid-column:1/-1}
.wkg-r-pair>.wkg-f{grid-column:span 6}
.wkg-r-off>.wkg-f{grid-column:1/span 8}.wkg-r-off.wkg-rt>.wkg-f{grid-column:5/span 8}
.wkg-r-offp>.wkg-f{grid-column:2/span 4}.wkg-r-offp.wkg-rt>.wkg-f{grid-column:8/span 4}
.wkg-r-trio>.wkg-f{grid-column:span 4}
.wkg-r-trio>.wkg-f:nth-child(2){margin-top:clamp(40px,9vh,120px)}
.wkg-r-pst>.wkg-f:nth-child(1){grid-column:3/span 4}.wkg-r-pst>.wkg-f:nth-child(2){grid-column:7/span 4;margin-top:clamp(60px,14vh,180px)}
.wkg-shoot{grid-column:1/-1;margin:clamp(20px,4vh,40px) 0 -4px;font:500 15px/1.3 ${FT};color:rgba(12,13,15,.7)}
.wkg-f{position:relative;overflow:hidden;border-radius:14px;background:var(--wkg-slot,${SKY});clip-path:inset(10% 0 0 0 round 14px);transition:clip-path 1.1s ${ARRIVE};min-width:0}
.wkg-f.wkg-in{clip-path:inset(0 0 0 0 round 14px)}
.wkg-f>img,.wkg-f>video{position:absolute;left:0;top:-6%;width:100%;height:112%;object-fit:cover;display:block;will-change:transform}

.wkg-credits dl{grid-column:5/-1;margin:0}
.wkg-credits dl>div{padding:18px 0 20px;border-top:1px solid rgba(12,13,15,.2)}
.wkg-credits dt{margin:0 0 6px;font:500 14px/1.3 ${FT};color:rgba(12,13,15,.66)}
.wkg-credits dd{margin:0;font:500 clamp(18px,1.5vw,22px)/1.4 ${FT};max-width:34em}

.wkg-next{display:block;margin-top:clamp(80px,14vh,170px);background:${NAVY};color:${PAPER};padding:clamp(40px,8vh,90px) var(--gut) clamp(56px,10vh,110px);cursor:pointer}
.wkg-nx{align-items:end;row-gap:28px}
.wkg-nx>div:first-child{grid-column:1/span 6}
.wkg-nl{display:block;font:500 16px/1.3 ${FT};color:${PINK};margin-bottom:18px}
.wkg-nt{display:block;font:400 clamp(56px,8vw,150px)/.9 ${FD};letter-spacing:-.035em;text-wrap:balance}
.wkg-nk{display:block;margin-top:18px;font:500 17px/1.3 ${FT};color:${BLUE}}
.wkg-nm{grid-column:7/-1;position:relative;aspect-ratio:16/10;border-radius:16px;overflow:hidden;background:${SKY};container-type:inline-size;transition:transform 1s ${ARRIVE}}
.wkg-nm.wkg-v{aspect-ratio:4/5;grid-column:9/-1}
.wkg-nm>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
@media (hover:hover){.wkg-next:hover .wkg-nm{transform:scale(1.025)}}

@media (max-width:760px){
  .wkg,.wkg-page{--gut:18px;--cg:14px;--cols:4}
  .wkg-head{flex-direction:column;align-items:flex-start;gap:14px;padding-top:34px;padding-bottom:36px}
  .wkg-title{font-size:clamp(60px,19vw,92px)}
  .wkg-bh,.wkg-bl{grid-column:1/-1}
  .wkg-list{grid-template-columns:minmax(0,1fr);row-gap:56px}
  .wkg-cap{column-gap:12px;margin-top:14px}.wkg-cap h3{font-size:28px}
  .wkg-tlogo{max-height:110px;max-width:80%}.wkg-tlogo.wkg-tlw{max-width:70%}
  .wkg-k{font-size:14px;gap:10px}
  .wkg-back{left:16px;top:16px}
  .wkg-hero{min-height:0}
  .wkg-tri{grid-template-columns:1fr}.wkg-tri>div:not(.wkg-hp){display:none}
  .wkg-hcap{grid-template-columns:1fr;gap:10px}
  .wkg-hcap h1{font-size:clamp(46px,14.5vw,72px)}
  .wkg-hcap>span{text-align:left;order:-1}
  .wkg-hero.wkg-land{padding-top:84px}
  .wkg-hero.wkg-txt{padding-top:84px;gap:40px}
  .wkg-txt h1{font-size:clamp(54px,17vw,84px)}
  .wkg-tq,.wkg-tf{grid-column:1/-1}
  .wkg-tq{font-size:24px}
  .wkg-tf b{font-size:96px}
  .wkg-lede{grid-column:1/-1;font-size:28px}
  .wkg-info>div,.wkg-stat{grid-column:span 2}
  .wkg-h2,.wkg-wr,.wkg-credits dl{grid-column:1/-1}
  .wkg-wr p{font-size:18px}
  .wkg-tx .wkg-wr p{font-size:24px}
  .wkg-fact{grid-column:1/-1}
  .wkg-r-full>.wkg-f,.wkg-r-pair>.wkg-f,.wkg-r-off>.wkg-f,.wkg-r-off.wkg-rt>.wkg-f{grid-column:1/-1}
  .wkg-r-offp>.wkg-f{grid-column:1/span 3}.wkg-r-offp.wkg-rt>.wkg-f{grid-column:2/span 3}
  .wkg-r-trio>.wkg-f,.wkg-r-pst>.wkg-f:nth-child(1),.wkg-r-pst>.wkg-f:nth-child(2){grid-column:span 2}
  .wkg-r-trio>.wkg-f:nth-child(2){margin-top:48px}
  .wkg-r-trio>.wkg-f:nth-child(3){grid-column:2/span 2;margin-top:0}
  .wkg-r-pst>.wkg-f:nth-child(2){margin-top:64px}
  .wkg-nx>div:first-child,.wkg-nm{grid-column:1/-1}
  .wkg-nm.wkg-v{grid-column:1/span 3}
}
@media (prefers-reduced-motion:reduce){
  .wkg-rv .wkg-m,.wkg-f{clip-path:none!important;transition:none}
  .wkg-rv .wkg-m>img{transform:none}
  .wkg-line>span{transform:none;transition:none}
  .wkg-body{transform:none;transition:opacity .3s}
}
`;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const src = (p) => BASE + p;
const clean = (s) => String(s == null ? '' : s).replace(/\s*[—–]\s*/g, ', ').replace(/--/g, ',').replace(/[←-⇿·]/g, '');
const isText = (p) => TEXT_ONLY.has(p.id) || !p.hero;
const isVert = (p) => /^(vertical|portrait)$/i.test(p.orientation || '');
const KIND_RE = /^(kind|output|work|format|what it is)$/i;
const factOf = (p, re) => (p.facts || []).find(f => re.test(f.label));
const kindOf = (p) => { const f = factOf(p, KIND_RE); return f ? f.value : WING[p.wing].title; };
const domain = (u) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pretty = (k) => { const s = k.replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };

/* text-only grounds, from the palette, each with the type colours that read on it: pc ground, pf text, pa accent, pk labels */
const SCHEMES = {
  navy: { pc: NAVY, pf: PAPER, pa: PINK, pk: BLUE },
  cobalt: { pc: COBALT, pf: PAPER, pa: BLUE, pk: BLUE },
  sky: { pc: SKY, pf: INK, pa: NAVY, pk: INK },
  ink: { pc: INK, pf: PAPER, pa: PINK, pk: SKY },
};
const PLATE_OF = { clapper: 'sky', fitkit: 'navy', 'fourside-studios': 'ink', palladium: 'cobalt', dvc: 'navy' };
const ORDER_CYCLE = ['navy', 'cobalt', 'sky', 'ink'];
function schemeOf(p) {
  const k = PLATE_OF[p.id] || ORDER_CYCLE[(ALL.filter(isText).indexOf(p) + 4) % 4];
  return SCHEMES[k];
}
function paint(node, p) { const c = schemeOf(p); for (const k in c) node.style.setProperty('--' + k, c[k]); return node; }
/* the one real number a text-only project has (Year only when nothing else is a number) */
const NUM_RE0 = /^(\d[\d,.]*\s?[KMB]?\+?|\d+\/\d+|\d+\s?(min|sec|hrs?|days?))$/i;
function keyFact(p) {
  const fs = (p.facts || []).filter(f => NUM_RE0.test(clean(f.value).trim()));
  return fs.find(f => !/^year$/i.test(f.label)) || fs[0] || null;
}
const plateFact = (p) => { const f = keyFact(p); return f && !/^year$/i.test(f.label) ? f : null; };   // a year is not the number a card leads with
const indexOf = (p) => DATA[p.wing].indexOf(p) + 1;
/* keep the manifest order, but never two text-only cards next to each other */
function spread(list) {
  const txt = list.filter(isText), rest = list.filter(p => !isText(p)), n = list.length, k = txt.length;
  if (!k || !rest.length || !list.some((p, i) => i && isText(p) && isText(list[i - 1]))) return list;
  const at = new Set(txt.map((_, j) => Math.min(n - 1, Math.round((j + 1) * n / (k + 1)))));
  if (at.size < k) return list;
  const out = []; let a = 0, b = 0;
  for (let i = 0; i < n; i++) out.push(at.has(i) ? txt[a++] : rest[b++]);
  return out;
}

const THUMBABLE = /\.(jpe?g|png)$/i;
const thumb = (p, w) => p.replace(THUMBABLE, `.w${w}.webp`);
const big = (path) => THUMBABLE.test(path) ? src(thumb(path, 1280)) : src(path);
function setImg(im, path, sizes) {
  if (!THUMBABLE.test(path)) { im.src = src(path); return im; }
  im.sizes = sizes;
  im.srcset = `${src(thumb(path, 640))} 640w, ${src(thumb(path, 1280))} 1280w`;
  im.src = src(thumb(path, 1280));
  im.addEventListener('error', function fb() { im.removeEventListener('error', fb); im.removeAttribute('srcset'); im.removeAttribute('sizes'); im.src = src(path); });
  return im;
}

/* numbers: 1.2M, 340K; null means absent, 0 is a value */
function fmt(n) {
  if (n == null || n === '') return null;
  if (typeof n === 'string' && !isFinite(+n)) return clean(n);
  if (!isFinite(+n)) return null;
  n = +n; const a = Math.abs(n);
  for (const [u, s] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (a >= u) { const v = n / u; return String(Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).replace(/\.0$/, '') + s; }
  return String(Math.round(n));
}
const STATS = { software: [['visitors', 'Visitors']], media: [['views', 'Views'], ['shares', 'Shares'], ['likes', 'Likes']] };
function statsOf(p) {
  return (STATS[p.wing] || []).map(([k, label]) => {
    let v = fmt(p.stats && typeof p.stats === 'object' ? p.stats[k] : null), from = null;
    if (v == null) { const f = factOf(p, new RegExp('^' + label + '$', 'i')); if (f) { v = clean(f.value); from = f; } }
    return { label, v, from };
  });
}
function linksOf(p) {
  const out = [], seen = new Set();
  const add = (url, label) => { if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return; const k = url.replace(/\/$/, ''); if (seen.has(k)) return; seen.add(k); out.push({ url, label: clean(label || domain(url)) }); };
  if (p.link) add(p.link, domain(p.link));
  for (const l of Array.isArray(p.links) ? p.links : []) if (l) add(l.url, l.label);
  return out;
}

/* films: media shoots follow <shoot>-NN.jpg and <shoot>-loop.mp4, one loop per shoot (all present on disk) */
function videosOf(p) {
  if (isText(p)) return [];
  const out = [];
  const lm = p.video && p.video.match(/^(.*\/)([a-z0-9-]+?)-loop\.mp4$/i);
  if (lm) {
    const shoots = [];
    for (const g of p.gallery || []) { const m = g.match(/^(.*\/)([a-z0-9-]+?)-\d+\.jpg$/i); if (m && m[1] === lm[1] && !shoots.some(s => s.k === m[2])) shoots.push({ k: m[2], poster: g }); }
    if (!shoots.some(s => s.k === lm[2])) shoots.unshift({ k: lm[2], poster: p.hero });
    for (const s of shoots) out.push({ video: `${lm[1]}${s.k}-loop.mp4`, poster: s.poster, shoot: s.k, vert: isVert(p) });
  } else if (p.video) {
    const stem = p.video.replace(/\.[a-z0-9]+$/i, '');
    const poster = (p.gallery || []).find(g => g.startsWith(stem + '-poster.')) || p.hero;
    out.push({ video: p.video, poster, vert: isVert(p) });
  }
  return out;
}

let DATA = { software: [], media: [] }, ALL = [], byId = new Map(), BRANDS = [], tab = 'software';
let ui = {}, gl = null, openId = null, curPage = null, busy = false;
const holds = [];                        // running flight animations, so a test can hold them still

/* ---------- the listing ---------- */
/* a logo trimmed to its ink (some files carry wide transparent margins), cached per project */
const LOGOS = new Map();
function logoOf(p) {
  if (!p.logo) return null;
  if (LOGOS.has(p.id)) return LOGOS.get(p.id);
  const pr = new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const a = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return res(null);
        const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
        t.getContext('2d').drawImage(c, -x0, -y0);
        t.toBlob((b) => res({ canvas: t, url: b ? URL.createObjectURL(b) : t.toDataURL() }));
      } catch (e) { res({ canvas: im, url: im.src }); }
    };
    im.onerror = () => res(null);
    im.src = src(p.logo);
  });
  LOGOS.set(p.id, pr); return pr;
}
function plateEl(p) {
  const d = paint(el('div', 'wkg-pl'), p);
  const lp = logoOf(p);
  if (lp) { const g = el('span', 'wkg-plg'), im = el('img'); im.alt = ''; im.draggable = false; g.appendChild(im); d.appendChild(g); lp.then(l => { if (l) im.src = l.url; else { g.className = 'wkg-plg wkg-pw'; g.textContent = ''; g.appendChild(el('span', '', clean(p.name))); } }); }
  else { const g = el('span', 'wkg-plg wkg-pw'); g.appendChild(el('span', '', clean(p.name))); d.appendChild(g); }
  const f = plateFact(p);
  if (f) { const x = el('span', 'wkg-pf'); x.append(el('b', '', clean(f.value)), el('small', '', clean(f.label))); d.appendChild(x); }
  else d.classList.add('wkg-nf');
  return d;
}
function cardEl(p, i, n) {
  const c = el('button', 'wkg-card'); c.type = 'button'; c.dataset.id = p.id;
  c.setAttribute('aria-label', `${clean(p.name)}. Open the project`);
  // no Open label: Kirtan removed it
  const m = el('span', 'wkg-m');
  if (isText(p)) m.appendChild(plateEl(p));
  else { const im = el('img'); im.alt = ''; im.decoding = 'async'; im.draggable = false; im.loading = i < 2 ? 'eager' : 'lazy'; setImg(im, p.hero, '(max-width:760px) 92vw, 46vw'); m.appendChild(im); }
  const cap = el('span', 'wkg-cap');
  const k = el('span', 'wkg-k'); k.append(el('span', '', clean(kindOf(p))), el('span', 'wkg-n', pad(i + 1)));
  cap.append(el('h3', '', clean(p.name)), k);
  cap.appendChild(el('p', '', clean(p.one_line)));   // every card, so every caption block is the same height
  c.append(m, cap);
  c.addEventListener('click', () => go(p.id, m));
  return c;
}
function setTab(t, first) {
  tab = t;
  ROOT.style.setProperty('--wkg-ground', WING[t].ground);
  ROOT.style.setProperty('--wkg-slot', WING[t].slot);
  ui.tabs.forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('wkg-on', on); b.setAttribute('aria-selected', on); });
  const build = () => {
    const list = DATA[t];
    ui.title.firstChild.textContent = WING[t].title;
    ui.count.textContent = pad(list.length);
    ui.sub.textContent = WING[t].sub;
    ui.brands.hidden = t !== 'media';
    ui.list.textContent = '';
    const cards = list.map((p, i) => { const c = cardEl(p, i, list.length); ui.list.appendChild(c); return c; });
    ui.cards = cards;
    if (gl) gl.setCards(list, cards); else revealCards(cards);
    ui.list.classList.remove('wkg-fade');
  };
  if (first || RM.matches) build();
  else { ui.list.classList.add('wkg-fade'); if (gl) gl.fadeAll(); setTimeout(build, 330); }
}
let rio = null;
function revealCards(cards) {
  if (RM.matches) return;
  if (!rio) rio = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('wkg-in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  cards.forEach(c => { c.classList.add('wkg-rv'); rio.observe(c); });
}
function buildListing() {
  ROOT.textContent = '';
  const w = el('div', 'wkg'); ui.w = w;
  const top = el('div', 'wkg-top'); top.setAttribute('role', 'tablist');
  ui.tabs = ['software', 'media'].map(t => { const b = el('button', 'wkg-tab', WING[t].title); b.type = 'button'; b.dataset.tab = t; b.setAttribute('role', 'tab'); b.addEventListener('click', () => { if (tab !== t) setTab(t); }); top.appendChild(b); return b; });
  const head = el('div', 'wkg-head');
  ui.title = el('h2', 'wkg-title'); ui.title.append(document.createTextNode(''), (ui.count = el('sup')));
  ui.sub = el('p');
  head.append(ui.title, ui.sub);
  ui.brands = el('div', 'wkg-brands wkg-g');
  const bl = el('ul', 'wkg-bl');
  if (BRANDS.length) BRANDS.forEach(b => bl.appendChild(el('li', '', b))); else bl.appendChild(el('li', 'wkg-tbc', 'Brand names to come'));
  ui.brands.append(el('h3', 'wkg-bh', 'Brands impacted'), bl);
  ui.wrap = el('div', 'wkg-wrap');
  ui.list = el('div', 'wkg-list');
  ui.wrap.appendChild(ui.list);
  w.append(top, head, ui.brands, ui.wrap);
  ROOT.appendChild(w);
}

/* ---------- the WebGL gallery ---------- */
const VERT = `
uniform float uVel; uniform float uViewH; uniform float uHover; uniform vec2 uMouse; uniform vec2 uSize;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float ny = clamp(wp.y / (uViewH * 0.5), -1.4, 1.4);
  wp.y += sin(uv.x * 3.14159265) * uVel;                     // the plane bows with the scroll speed
  wp.z -= ny * ny * abs(uVel) * 2.6;                         // a drum that deepens with speed: at rest the planes sit flat, exactly on their boxes
  vec2 d = (uv - uMouse) * uSize / max(uSize.x, uSize.y);
  wp.z += uHover * 22.0 * exp(-dot(d, d) * 6.0);              // the pointer lifts a soft dome, no rings
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = `
uniform sampler2D uTex; uniform vec2 uSize; uniform vec2 uImg; uniform float uHover; uniform vec2 uMouse;
uniform float uLoad; uniform vec3 uBase; uniform float uAlpha; uniform float uRad; uniform float uVel;
varying vec2 vUv;
void main(){
  float pa = uSize.x / uSize.y, ia = uImg.x / uImg.y;
  vec2 s = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
  vec2 c = (vUv - 0.5) * s;
  c *= 1.0 - 0.05 * uHover;
  c.y *= 1.0 - min(abs(uVel) * 0.0016, 0.05);
  vec2 dd = (vUv - uMouse) * vec2(pa, 1.0);
  float f = exp(-dot(dd, dd) * 5.0);
  c -= (vUv - uMouse) * s * f * 0.07 * uHover;                // a lens toward the pointer
  vec3 col = mix(uBase, texture2D(uTex, c + 0.5).rgb, uLoad);
  vec2 px = (vUv - 0.5) * uSize;
  vec2 q = abs(px) - (uSize * 0.5 - uRad);
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRad;
  float a = (1.0 - smoothstep(-0.8, 0.8, dist)) * uAlpha;
  gl_FragColor = vec4(col * a, a);
}`;

async function initGL() {
  if (RM.matches || !HOVER.matches || innerWidth <= 760) return null;
  let THREE;
  try { THREE = await import('three'); } catch (e) { console.warn('work-g: three did not load, plain images instead'); return null; }
  const canvas = el('canvas', 'wkg-gl'); canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  ui.wrap.insertBefore(canvas, ui.list);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 10000);
  const geo = new THREE.PlaneGeometry(1, 1, 24, 24);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;
  const cur = el('div', 'wkg-cur', ''); cur.style.display = 'none'; cur.setAttribute('aria-hidden', 'true');
  const meshes = new Map();          // id -> { mesh, u, hov, hovT, load, loadT, tex }
  let items = [];                    // [{ p, card, slot, cap, m }]
  const M = 280;                     // the canvas overhangs the viewport by this much above and below
  let W = 1, H = 1, HC = 1, raf = 0, lastY = scrollY, vel = 0, pin = null, visible = false, frames = 2;
  let mx = -1, my = -1, cx = -200, cy = -200, cs = 0, csT = 0, over = null, rad = 18;
  const readRad = () => { const s0 = ui.list.querySelector('.wkg-m'); if (s0) rad = parseFloat(getComputedStyle(s0).borderTopLeftRadius) || rad; for (const m of meshes.values()) m.u.uRad.value = rad; };

  const col3 = (hex) => new THREE.Color(hex);    // the slot colour, raw like the texels
  function texFor(p, rec) {
    if (rec.tex) return;
    rec.tex = 'loading';
    const done = (img, w, h) => {
      const t = img instanceof HTMLCanvasElement ? new THREE.CanvasTexture(img) : new THREE.Texture(img);
      t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
      rec.tex = t; rec.u.uTex.value = t; rec.u.uImg.value.set(w, h); rec.loadT = 1; kick();
    };
    if (isText(p)) {
      const waits = [logoOf(p) || Promise.resolve(null)];
      if (document.fonts) waits.push(document.fonts.load(`400 120px ${FD}`), document.fonts.load(`500 30px ${FT}`));
      Promise.all(waits).then(([l]) => done(plateCanvas(p, l), 1280, 800), () => done(plateCanvas(p, null), 1280, 800));
      return;
    }
    const im = new Image(); im.decoding = 'async';
    im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => done(im, im.naturalWidth, im.naturalHeight));
    im.onerror = () => { if (!im._fb) { im._fb = 1; im.src = src(p.hero); } };
    im.src = big(p.hero);
  }
  const tio = new IntersectionObserver((es) => es.forEach(e => { if (!e.isIntersecting) return; const it = items.find(x => x.card === e.target); if (it) texFor(it.p, it.m); }), { rootMargin: '120% 0px' });
  function setCards(list, cards) {
    tio.disconnect();
    for (const r of meshes.values()) r.mesh.visible = false;
    readRad();
    items = list.map((p, i) => {
      let m = meshes.get(p.id);
      if (!m) {
        const u = { uTex: { value: blank }, uSize: { value: new THREE.Vector2(1, 1) }, uImg: { value: new THREE.Vector2(16, 10) }, uHover: { value: 0 }, uMouse: { value: new THREE.Vector2(.5, .5) },
          uLoad: { value: 0 }, uBase: { value: col3(WING[p.wing].slot) }, uAlpha: { value: 1 }, uRad: { value: rad }, uVel: { value: 0 }, uViewH: { value: 900 } };
        u.uAlpha.value = 0;
        const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
        m = { mesh, u, hov: 0, hovT: 0, load: 0, loadT: 0, tex: null, alphaT: 1 };
        meshes.set(p.id, m);
      }
      m.alphaT = 1; m.u.uRad.value = rad;
      const card = cards[i];
      tio.observe(card);
      return { p, card, slot: card.querySelector('.wkg-m'), cap: card.querySelector('.wkg-cap'), m };
    });
    cards.forEach(c => c.classList.remove('wkg-rv', 'wkg-in'));
    ui.w.classList.add('wkg-glon');
    frames = 3; kick();
  }
  function resize() {
    W = ui.wrap.clientWidth || document.documentElement.clientWidth; H = innerHeight; HC = H + 2 * M; readRad();
    renderer.setSize(W, HC, false); canvas.style.height = HC + 'px';
    cam.aspect = W / HC; cam.position.set(0, 0, (HC / 2) / Math.tan(Math.PI * 15 / 180)); cam.updateProjectionMatrix();
    frames = 2; kick();
  }
  function force() { if (raf) cancelAnimationFrame(raf); raf = 0; if (visible) frame(); }
  function kick() { if (!raf && visible && !openId) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (clamp(dy, -80, 80) * 0.55 - vel) * 0.14;
    if (Math.abs(vel) < 0.02) vel = 0;
    const bend = pin != null ? pin : vel;
    // read everything first (the wrap and every slot, measured this frame), then write
    const wr = ui.wrap.getBoundingClientRect();
    const rects = items.map(it => it.slot.getBoundingClientRect());
    // pin the canvas so it spans the viewport plus M each side; it scrolls with the list between frames
    canvas.style.transform = `translate3d(0,${(-wr.top - M).toFixed(1)}px,0)`;
    const cr = { top: -M, bottom: H + M, left: wr.left };
    over = null;
    if (mx >= 0) for (let i = 0; i < items.length; i++) { const r = rects[i]; if (mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom) { over = i; break; } }
    let moving = Math.abs(vel) > 0.02 || frames > 0;
    items.forEach((it, i) => {
      const r = rects[i], m = it.m, u = m.u;
      const vis = r.bottom > cr.top && r.top < cr.bottom && r.width > 0;
      m.mesh.visible = vis;
      m.hovT = i === over ? 1 : 0;
      m.hov += (m.hovT - m.hov) * 0.1; if (Math.abs(m.hovT - m.hov) < 0.002) m.hov = m.hovT; else moving = true;
      m.load += (m.loadT - m.load) * 0.08; if (Math.abs(m.loadT - m.load) < 0.003) m.load = m.loadT; else moving = true;
      if (Math.abs(u.uAlpha.value - m.alphaT) > 0.002) { u.uAlpha.value += (m.alphaT - u.uAlpha.value) * 0.2; moving = true; } else u.uAlpha.value = m.alphaT;
      if (!vis) return;
      m.mesh.position.set(r.left - cr.left + r.width / 2 - W / 2, HC / 2 - (r.top - cr.top + r.height / 2), 0);
      m.mesh.scale.set(r.width, r.height, 1);
      u.uSize.value.set(r.width, r.height); u.uViewH.value = H; u.uVel.value = clamp(bend * 0.62, -42, 42);
      u.uHover.value = m.hov; u.uLoad.value = m.load;
      if (i === over) u.uMouse.value.set((mx - r.left) / r.width, 1 - (my - r.top) / r.height);
    });
    // the Open pill trails the pointer
    csT = over != null ? 1 : 0;
    if (mx >= 0) { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; }
    cs += (csT - cs) * 0.16;
    if (Math.abs(csT - cs) > 0.003 || Math.abs(mx - cx) > 0.3 || Math.abs(my - cy) > 0.3) moving = true; else cs = csT;
    cur.style.transform = `translate3d(${(cx + 14).toFixed(1)}px,${(cy + 14).toFixed(1)}px,0) scale(${cs.toFixed(3)})`;
    renderer.render(scene, cam);
    if (frames > 0) frames--;
    if (moving && visible && !openId) raf = requestAnimationFrame(frame);
  }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', resize);
  // the wrap can change width without a window resize (the scrollbar arrives when the page unlocks)
  if (window.ResizeObserver) { let lw = 0; new ResizeObserver(() => { const w = ui.wrap.clientWidth; if (w !== lw) { lw = w; resize(); } }).observe(ui.wrap); }
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; if (visible) kick(); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mx = my = -1; kick(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; canvas.classList.toggle('wkg-on', visible); if (visible) { lastY = scrollY; frames = 2; kick(); } }).observe(ui.wrap);
  if (document.fonts) document.fonts.ready.then(() => { frames = 2; kick(); });
  resize();
  return {
    setCards, kick,
    alpha(id, a, instant) { const m = meshes.get(id); if (!m) return; m.alphaT = a; if (instant) m.u.uAlpha.value = a; force(); },
    restore() { for (const m of meshes.values()) { m.alphaT = 1; m.u.uAlpha.value = 1; } force(); },
    fadeAll() { for (const m of meshes.values()) m.alphaT = 0; frames = 2; kick(); },
    pin(v) { pin = v; frames = 2; kick(); }, point(x, y) { mx = x; my = y; frames = 2; kick(); },
    resume() { lastY = scrollY; frames = 2; kick(); },
  };
}
function plateCanvas(p, logo) {
  // the same composition as the DOM plate (.wkg-pl), in cqw of a 1280 wide card
  const Wd = 1280, Hd = 800, u = Wd / 100, c = document.createElement('canvas'); c.width = Wd; c.height = Hd;
  const g = c.getContext("2d"), sc = schemeOf(p), f = plateFact(p);
  g.fillStyle = sc.pc; g.fillRect(0, 0, Wd, Hd);
  const wrap = (text, maxW) => { const ls = []; let ln = ''; for (const w of text.split(/\s+/)) { const t = ln ? ln + ' ' + w : w; if (g.measureText(t).width > maxW && ln) { ls.push(ln); ln = w; } else ln = t; } ls.push(ln); return ls; };
  const bx = { y: (f ? 12 : 15.25) * u, h: 32 * u };
  if (logo && logo.canvas) {
    const lw = logo.canvas.width, lh = logo.canvas.height, k = Math.min(60 * u / lw, bx.h / lh), dw = lw * k, dh = lh * k;
    g.imageSmoothingQuality = 'high';
    g.drawImage(logo.canvas, (Wd - dw) / 2, bx.y + (bx.h - dh) / 2, dw, dh);
  } else {
    g.fillStyle = sc.pa; g.font = `400 ${8 * u}px ${FD}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = wrap(clean(p.name), 84 * u), lh = 8 * u * .95;
    let y = bx.y + bx.h / 2 - (ls.length - 1) * lh / 2;
    for (const l of ls) { g.fillText(l, Wd / 2, y); y += lh; }
  }
  if (f) {
    g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    const bottom = Hd - 5.5 * u, fs = 1.7 * u, lh = fs * 1.25;
    g.fillStyle = sc.pk; g.font = `500 ${fs}px ${FT}`;
    const ll = wrap(clean(f.label), 40 * u);
    let y = bottom - (ll.length - 1) * lh - 0.32 * fs;
    for (const l of ll) { g.fillText(l, Wd - 5.5 * u, y); y += lh; }
    g.fillStyle = sc.pa; g.font = `400 ${7 * u}px ${FD}`;
    g.fillText(clean(f.value), Wd - 5.5 * u, bottom - ll.length * lh - 1.2 * u - 0.12 * 7 * u);
  }
  return c;
}

/* ---------- the project page ---------- */
function lines(node, text, d0) {
  // split a title into rising lines by word groups the browser would break anyway: one line per word set as spans
  node.textContent = '';
  const words = text.split(/\s+/);
  words.forEach((w, i) => { const l = el('span', 'wkg-line'); l.style.display = 'inline-block'; const s = el('span', '', w); s.style.setProperty('--d', (d0 + i * 70) + 'ms'); l.appendChild(s); node.appendChild(l); if (i < words.length - 1) node.appendChild(document.createTextNode(' ')); });
}
function heroOf(p) {
  const hero = el('header', 'wkg-hero');
  const hm = el('div', 'wkg-hm');
  let primary = hm;
  if (isText(p)) {
    hero.classList.add('wkg-txt'); paint(hero, p);
    const tm = el('div', 'wkg-tm'); tm.append(el('span', '', clean(kindOf(p))), el('span', '', `${pad(indexOf(p))} / ${pad(DATA[p.wing].length)}`));
    const bd = el('div');
    const lp = logoOf(p);
    if (lp) { const lg = el('img', 'wkg-tlogo'); lg.alt = ''; lg.hidden = true; bd.appendChild(lg); lp.then(l => { if (l) { if (l.canvas.width / l.canvas.height > 1.6) lg.classList.add('wkg-tlw'); lg.src = l.url; lg.hidden = false; } }); }
    const h1 = el('h1'); lines(h1, clean(p.name), 0);
    const tg = el('div', 'wkg-tg wkg-g'), q = el('p', 'wkg-tq'), f = keyFact(p);
    q.textContent = clean(p.one_line);
    tg.appendChild(q);
    if (f) { const x = el('div', 'wkg-tf'); x.append(el('b', '', clean(f.value)), el('small', '', clean(f.label))); tg.appendChild(x); }
    bd.append(h1, tg); hero.append(tm, bd);
    hero._primary = hero;
    return hero;
  } else if (isVert(p)) {
    hm.classList.add('wkg-tri');
    const vids = videosOf(p);
    const panes = [];
    const heroV = vids.find(v => v.poster === p.hero) || vids[0];
    const rest = vids.filter(v => v !== heroV);
    const stills = (p.gallery || []).filter(g => g !== p.hero && !vids.some(v => v.poster === g));
    const fill = (x) => x || (stills.length ? { still: stills.shift() } : null);
    const left = fill(rest[0]), right = fill(rest[1]);
    [left, { ...heroV, main: true }, right].forEach(v => {
      if (!v) return;
      const d = el('div'); if (v.main) { d.classList.add('wkg-hp'); primary = d; }
      if (v.still || v.poster) { const im = el('img'); im.alt = ''; im.src = big(v.still || v.poster); d.appendChild(im); }
      if (v.video) { const vd = el('video'); vd.muted = true; vd.loop = true; vd.playsInline = true; vd.autoplay = !RM.matches; vd.preload = 'auto'; vd.poster = big(v.poster); vd.src = src(v.video); vd.setAttribute('aria-hidden', 'true'); d.appendChild(vd); panes.push(v.video); }
      hm.appendChild(d);
    });
    hero._used = new Set([...panes, ...[left, right].filter(x => x && x.still).map(x => x.still)]);
  } else {
    hero.classList.add('wkg-land');
    const lo = el('img'); lo.alt = ''; lo.src = big(p.hero); hm.appendChild(lo);
    const vids = videosOf(p);
    if (vids.length && !RM.matches) {
      const vd = el('video'); vd.muted = true; vd.loop = true; vd.playsInline = true; vd.autoplay = true; vd.preload = 'auto'; vd.className = 'wkg-hi2'; vd.src = src(vids[0].video); vd.setAttribute('aria-hidden', 'true');
      vd.addEventListener('playing', () => vd.classList.add('wkg-ld'), { once: true }); hm.appendChild(vd);
      hero._used = new Set([vids[0].video]);
    } else if (THUMBABLE.test(p.hero)) {
      const hi = el('img', 'wkg-hi2'); hi.alt = ''; hi.decoding = 'async';
      hi.addEventListener('load', () => hi.classList.add('wkg-ld'), { once: true }); hi.src = src(p.hero); hm.appendChild(hi);
    }
  }
  const cap = el('div', 'wkg-hcap');
  const h1 = el('h1'); lines(h1, clean(p.name), 0);
  const list = DATA[p.wing], k = list.indexOf(p);
  const meta = el('span'); meta.append(document.createTextNode(`${pad(k + 1)} / ${pad(list.length)}`));
  if (!isText(p)) meta.append(el('br'), document.createTextNode(clean(kindOf(p))));
  cap.append(h1, meta);
  // a screen hero: the title first, on the ground, then the screen; a film hero: the title over the film
  if (hero.classList.contains('wkg-land')) hero.append(cap, hm); else hero.append(hm, cap);
  hero._primary = primary;
  return hero;
}
const NUM_RE = /^(\d[\d,.]*\s?[KMB]?\+?|\d+\/\d+|\d+\s?(min|sec|hrs?|days?))$/i;
const INFO = [[KIND_RE], [/^clients?$/i], [/^year$/i], [/^status$/i]];
const CREDIT_RE = /^(role|team|hands on|concepts|covered|in frame)$/i;
function introOf(p) {
  const s = el('section', 'wkg-sec wkg-intro wkg-g');
  if (!isText(p)) s.appendChild(el('p', 'wkg-lede', clean(p.one_line)));   // a text-only hero already sets it
  const dl = el('dl', 'wkg-info wkg-sub');
  for (const [re] of INFO) { const f = factOf(p, re); if (!f) continue; const d = el('div'); d.append(el('dt', 'wkg-lab', clean(f.label)), el('dd', '', clean(f.value))); dl.appendChild(d); }
  if (p.year && !factOf(p, /^year$/i)) { const d = el('div'); d.append(el('dt', 'wkg-lab', 'Year'), el('dd', '', clean(p.year))); dl.appendChild(d); }
  if (dl.children.length) s.appendChild(dl);
  const st = el('div', 'wkg-stats wkg-sub');
  for (const x of statsOf(p)) { const d = el('div', 'wkg-stat'); if (x.v == null) { d.classList.add('wkg-tbc'); d.append(el('b', '', '000'), el('small', '', `${x.label}, number to come`)); } else d.append(el('b', '', x.v), el('small', '', x.label)); st.appendChild(d); }
  s.appendChild(st);
  const ls = linksOf(p);
  if (ls.length) { const l = el('div', 'wkg-links'); ls.forEach(x => { const a = el('a', '', x.label); a.href = x.url; a.target = '_blank'; a.rel = 'noopener'; l.appendChild(a); }); s.appendChild(l); }
  return s;
}
function aboutOf(p) {
  const w = (p.writeup || []).map(clean).filter(Boolean); if (!w.length) return null;
  const s = el('section', 'wkg-sec wkg-about wkg-g');
  s.appendChild(el('h2', 'wkg-h2', 'About'));
  const d = el('div', 'wkg-wr'); w.forEach(t => d.appendChild(el('p', '', t))); s.appendChild(d);
  return s;
}
function factsOf(p) {
  const used = new Set(statsOf(p).map(x => x.from).filter(Boolean));
  if (isText(p)) { const k = keyFact(p); if (k) used.add(k); }
  const rest = (p.facts || []).filter(f => !used.has(f) && !INFO.some(([re]) => re.test(f.label)) && !CREDIT_RE.test(f.label));
  if (!rest.length) return null;
  const s = el('section', 'wkg-sec wkg-g'); const g = el('div', 'wkg-facts wkg-sub');
  rest.forEach(f => { const v = clean(f.value); const d = el('div', 'wkg-fact' + (NUM_RE.test(v) ? ' wkg-num' : '')); d.append(el('span', 'wkg-lab', clean(f.label)), el('b', '', v)); g.appendChild(d); });
  s.appendChild(g); return s;
}
function creditsOf(p) {
  const rows = [];
  for (const c of Array.isArray(p.credits) ? p.credits : []) if (c && c.role && c.name) rows.push([clean(c.role), clean(c.name)]);
  for (const f of p.facts || []) if (CREDIT_RE.test(f.label)) rows.push([clean(f.label), clean(f.value)]);
  if (!rows.length) return null;
  const s = el('section', 'wkg-sec wkg-credits wkg-about wkg-g');
  s.appendChild(el('h2', 'wkg-h2', 'Credits'));
  const dl = el('dl'); rows.forEach(([a, b]) => { const d = el('div'); d.append(el('dt', '', a), el('dd', '', b)); dl.appendChild(d); }); s.appendChild(dl);
  return s;
}
/* every image and loop the project has, minus what the hero already shows, laid in rows */
function seqOf(p, used) {
  if (isText(p)) return null;
  const vids = videosOf(p);
  const items = [];
  // a landscape hero image already fills the top; a loop hero (or a film triptych) leaves the still for the sequence
  const all = [...(isVert(p) || vids.length ? [p.hero] : []), ...(p.gallery || [])].filter((g, i, a) => g && a.indexOf(g) === i);
  for (const g of all) {
    if (used && used.has(g)) continue;
    if (/-poster\.(jpe?g|png)$/i.test(g)) continue;
    items.push({ still: g, shoot: (g.match(/\/([a-z0-9-]+?)-\d+\.jpg$/i) || [])[1] });
  }
  for (const v of vids) if (!(used && used.has(v.video))) {
    const at = items.findIndex(x => x.shoot && x.shoot === v.shoot);
    const it = { video: v.video, poster: v.poster, shoot: v.shoot };
    if (at >= 0) items.splice(at + 1, 0, it); else items.push(it);
  }
  if (!items.length) return null;
  const s = el('section', 'wkg-sec wkg-g'); const seq = el('div', 'wkg-seq'); s.appendChild(seq);
  s._items = items;
  return s;
}
function frameEl(it, ar) {
  const f = el('div', 'wkg-f'); f.style.aspectRatio = ar;
  if (it.video) {
    const v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.poster = big(it.poster || ''); v.dataset.src = src(it.video); v.setAttribute('aria-hidden', 'true'); f.appendChild(v);
  } else { const im = el('img'); im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; setImg(im, it.still, '(max-width:760px) 92vw, 62vw'); f.appendChild(im); }
  return f;
}
async function layoutSeq(sec, p, page) {
  const items = sec._items, seq = sec.firstChild;
  // aspect ratios from the small thumbs, so rows can be chosen before the full images arrive
  await Promise.all(items.map(it => new Promise(res => {
    if (it.video && isVert(p)) { it.ar = 9 / 16; return res(); }
    if (it.video) { it.ar = 16 / 10; return res(); }
    const im = new Image(); const t = setTimeout(() => { it.ar = isVert(p) ? 9 / 16 : 16 / 10; res(); }, 2500);
    im.onload = () => { clearTimeout(t); it.ar = im.naturalWidth / im.naturalHeight; res(); };
    im.onerror = () => { if (!im._fb) { im._fb = 1; im.src = src(it.still); } else { clearTimeout(t); it.ar = 16 / 10; res(); } };
    im.src = THUMBABLE.test(it.still) ? src(thumb(it.still, 640)) : src(it.still);
  })));
  if (curPage !== page) return;
  const q = items.slice(); let li = 0, pi = 0, flip = false, shoot = null;
  const portrait = (x) => x.ar < 0.86;
  const row = (cls, list) => { const r = el('div', 'wkg-r wkg-sub ' + cls); list.forEach(x => r.appendChild(frameEl(x, x.ar))); seq.appendChild(r); return r; };
  while (q.length) {
    const a = q[0];
    if (a.shoot && a.shoot !== shoot && isVert(p)) { shoot = a.shoot; seq.appendChild(el('p', 'wkg-shoot', pretty(a.shoot))); }
    if (portrait(a)) {
      let n = 0; while (n < q.length && n < 3 && portrait(q[n]) && (!isVert(p) || q[n].shoot === a.shoot)) n++;
      if (n === 3 && pi % 2 === 0) row('wkg-r-trio', q.splice(0, 3));
      else if (n >= 2) row('wkg-r-pst', q.splice(0, 2));
      else { const r = row('wkg-r-offp', q.splice(0, 1)); if (flip) r.classList.add('wkg-rt'); flip = !flip; }
      pi++;
    } else {
      const kind = ['full', 'pair', 'off'][li % 3];
      if (kind === 'pair' && q[1] && !portrait(q[1])) row('wkg-r-pair', q.splice(0, 2));
      else if (kind === 'off' || kind === 'pair') { const r = row('wkg-r-off', q.splice(0, 1)); if (flip) r.classList.add('wkg-rt'); flip = !flip; }
      else row('wkg-r-full', q.splice(0, 1));
      li++;
    }
  }
  watchFrames(page);
}
function watchFrames(page) {
  const frames = [...page.querySelectorAll('.wkg-f')];
  const vis = page._vis || (page._vis = new Set());
  const io = new IntersectionObserver((es) => es.forEach(e => {
    const f = e.target, v = f.querySelector('video');
    if (e.isIntersecting) { f.classList.add('wkg-in'); vis.add(f); if (v) { if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; } if (!RM.matches) v.play().catch(() => {}); } }
    else { vis.delete(f); if (v) v.pause(); }
  }), { root: page, rootMargin: '0px 0px -6% 0px' });
  frames.forEach(f => io.observe(f));
  page._io = io;
  parallax(page);
}
function parallax(page) {
  if (RM.matches || !page._vis) return;
  const vh = page.clientHeight, list = [...page._vis];
  const ys = list.map(f => { const r = f.getBoundingClientRect(); return (r.top + r.height / 2 - vh / 2) / vh; });
  list.forEach((f, i) => { const m = f.firstChild; if (m) m.style.transform = `translate3d(0,${(-ys[i] * 4.5).toFixed(2)}%,0)`; });
}
function smooth(page) {
  page.addEventListener('scroll', () => { if (!page._run) parallax(page); }, { passive: true });
  if (!HOVER.matches || RM.matches) return;
  let target = 0, cur = 0, last = 0;
  const step = (now) => {
    const dt = Math.min(50, now - last); last = now;
    cur += (target - cur) * (1 - Math.pow(1 - 0.12, dt / 16.67));
    if (Math.abs(target - cur) < 0.4) cur = target;
    page.scrollTop = cur; parallax(page);
    page._run = cur === target ? 0 : requestAnimationFrame(step);
  };
  page.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * page.clientHeight : e.deltaY;
    if (!page._run) { cur = page.scrollTop; target = cur; }
    target = clamp(target + d, 0, page.scrollHeight - page.clientHeight);
    if (!page._run) { last = performance.now(); page._run = requestAnimationFrame(step); }
  }, { passive: false });
}
function nextOf(p) {
  const i = ALL.indexOf(p); const nx = ALL[(i + 1) % ALL.length];
  const a = el('section', 'wkg-next'); a.setAttribute('role', 'link'); a.tabIndex = 0;
  a.setAttribute('aria-label', `Next project: ${clean(nx.name)}`);
  const g = el('div', 'wkg-nx wkg-g');
  const t = el('div'); t.append(el('span', 'wkg-nl', 'Next project'), el('span', 'wkg-nt', clean(nx.name)), el('span', 'wkg-nk', clean(kindOf(nx))));
  const m = el('div', 'wkg-nm');
  if (isText(nx)) m.appendChild(plateEl(nx));
  else { if (isVert(nx)) m.classList.add('wkg-v'); const im = el('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; setImg(im, nx.hero, '(max-width:760px) 92vw, 46vw'); m.appendChild(im); }
  g.append(t, m); a.appendChild(g);
  const open = () => go(nx.id, m, true);
  a.addEventListener('click', open);
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  return a;
}
function buildPage(p) {
  const page = el('div', 'wkg-page wkg-pre');
  page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', clean(p.name));
  page.style.setProperty('--wkg-pg', WING[p.wing].ground); page.style.setProperty('--wkg-slot', WING[p.wing].slot);
  if (isText(p)) page.classList.add('wkg-tx');
  const back = el('button', 'wkg-back', 'Back'); back.type = 'button'; back.addEventListener('click', close);
  const hero = heroOf(p);
  const body = el('div', 'wkg-body');
  const seq = seqOf(p, hero._used);
  for (const s of [introOf(p), aboutOf(p), factsOf(p), seq, creditsOf(p)]) if (s) body.appendChild(s);
  body.appendChild(nextOf(p));
  page.append(back, hero, body);
  page._hero = hero; page._seq = seq; page._p = p;
  return page;
}

/* ---------- the flight: a slot grows into the hero, and back ---------- */
function flyer(fromEl, p) {
  const f = el('div', 'wkg-fly');
  if (isText(p)) { f.appendChild(plateEl(p)); f.style.background = schemeOf(p).pc; }
  else { const im = el('img'); im.alt = ''; const ci = fromEl.querySelector('img'); im.src = (ci && ci.currentSrc) || big(p.hero); f.appendChild(im); }
  return f;
}
/* a plate's ground carries the flight; its type fades out leaving the card and fades in arriving back */
function plateFade(f, a, b) {
  const pl = f.querySelector('.wkg-pl'); if (!pl) return;
  pl.style.background = 'transparent';
  track(pl.animate(a > b ? [{ opacity: 1 }, { opacity: 0, offset: .28 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: .62 }, { opacity: 1 }], { duration: a > b ? FLY_MS : 860, easing: 'linear', fill: 'forwards' }));
}
const box = (r) => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
function track(a) { holds.push(a); a.finished.catch(() => {}).then(() => { const i = holds.indexOf(a); if (i >= 0) holds.splice(i, 1); }); return a; }

/* pages never cross-fade over the list: navy over pink at half opacity reads violet. They wipe with a clip instead. */
const inset = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px)`;
const FULL = 'inset(0px 0px 0px 0px)';
const isFull = (r) => r.left <= 1 && r.top <= 1 && r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1;
async function show(id, fromEl) {
  const p = byId.get(id); if (!p) return;
  if (openId === id && curPage) return;
  const prev = curPage;
  openId = id; busy = true;
  const page = buildPage(p); curPage = page;
  const flying = fromEl && !RM.matches && fromEl.isConnected;
  page.style.visibility = 'hidden';
  ROOT.appendChild(page);
  document.documentElement.classList.add('wkg-lock');
  smooth(page);
  if (flying) {
    const from = fromEl.getBoundingClientRect();
    const target = page._hero._primary.getBoundingClientRect();
    const f = flyer(fromEl, p);
    const rad = getComputedStyle(fromEl).borderRadius;
    Object.assign(f.style, box(from), { borderRadius: rad });
    ROOT.appendChild(f);
    if (gl && !prev) gl.alpha(id, 0, true);
    fromEl.style.visibility = 'hidden';
    const tx = isText(p);
    const trad = getComputedStyle(page._hero._primary).borderRadius || '0px';
    const a1 = track(f.animate([{ ...box(from), borderRadius: rad }, { ...box(target), borderRadius: trad }], { duration: FLY_MS, easing: MOVE, fill: 'forwards' }));
    const img = f.querySelector('img');
    if (img) track(img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: .45 }, { transform: 'scale(1)' }], { duration: FLY_MS, easing: MOVE, fill: 'forwards' }));
    if (tx) plateFade(f, 1, 0);
    await a1.finished.catch(() => {});
    if (curPage !== page) { f.remove(); return; }
    page.style.visibility = '';
    page.classList.remove('wkg-pre');
    requestAnimationFrame(() => { f.remove(); fromEl.style.visibility = ''; });
    if (!isFull(target)) await track(page.animate([{ clipPath: inset(target) }, { clipPath: FULL }], { duration: 760, easing: MOVE })).finished.catch(() => {});
  } else {
    page.style.visibility = '';
    page.classList.remove('wkg-pre');
    if (!RM.matches) await track(page.animate([{ clipPath: 'inset(100% 0px 0px 0px)' }, { clipPath: FULL }], { duration: 820, easing: MOVE })).finished.catch(() => {});
  }
  if (prev) { prev.remove(); prev._io && prev._io.disconnect(); }
  page.classList.add('wkg-ready');
  page.querySelector('.wkg-back').focus({ preventScroll: true });
  if (page._seq) setTimeout(() => layoutSeq(page._seq, p, page), RM.matches ? 0 : 450);
  busy = false; flush();
}
async function hide() {
  if (!openId || !curPage) return;
  const id = openId, page = curPage; openId = null; curPage = null; busy = true;
  page.querySelectorAll('video').forEach(v => v.pause());
  const card = ui.cards && ui.cards.find(c => c.dataset.id === id);
  const slot = card && card.querySelector('.wkg-m');
  document.documentElement.classList.remove('wkg-lock');
  const sr = slot && slot.getBoundingClientRect();
  const canFly = !RM.matches && slot && page.scrollTop < innerHeight * 0.35 && sr.bottom > 0 && sr.top < innerHeight;
  if (canFly) {
    const p = byId.get(id), prim = page._hero._primary;
    const from = prim.getBoundingClientRect();
    if (!isFull(from)) await track(page.animate([{ clipPath: FULL }, { clipPath: inset(from) }], { duration: 320, easing: MOVE, fill: 'forwards' })).finished.catch(() => {});
    const f = flyer(prim, p);
    Object.assign(f.style, box(from));
    ROOT.appendChild(f);
    slot.style.visibility = 'hidden';
    page.style.visibility = 'hidden';
    const rad = getComputedStyle(slot).borderRadius;
    const frad = getComputedStyle(prim).borderRadius || '0px';
    const a1 = track(f.animate([{ ...box(from), borderRadius: frad }, { ...box(sr), borderRadius: rad }], { duration: 860, easing: MOVE, fill: 'forwards' }));
    if (isText(p)) plateFade(f, 0, 1);
    await a1.finished.catch(() => {});
    page.remove();
    if (gl) gl.restore();
    slot.style.visibility = '';
    requestAnimationFrame(() => f.remove());
  } else {
    if (!RM.matches) await track(page.animate([{ clipPath: FULL }, { clipPath: 'inset(0px 0px 100% 0px)' }], { duration: 700, easing: MOVE, fill: 'forwards' })).finished.catch(() => {});
    page.remove();
    if (gl) gl.restore();
  }
  page._io && page._io.disconnect();
  if (gl) gl.resume();
  busy = false;
  if (card) card.focus({ preventScroll: true });
  flush();
}
let queued = null;                       // the last click made during a flight, run when it lands
function flush() { if (!queued) return; const q = queued; queued = null; requestAnimationFrame(q); }
function go(id, fromEl, inPlace) {
  // a click made mid-flight replaces the page it lands on, so Back still returns to the list
  if (busy) { queued = () => go(id, fromEl && fromEl.isConnected ? fromEl : null, true); return; }
  const h = '#work/' + id;
  if (location.hash !== h) {
    const st = history.state || {};
    if (inPlace && openId) history.replaceState({ wkg: id, pushed: !!st.pushed }, '', h);
    else history.pushState({ wkg: id, pushed: true }, '', h);
  }
  show(id, fromEl);
}
function close() {
  if (busy) { queued = close; return; }
  if (history.state && history.state.pushed) history.back();
  else { history.replaceState(null, '', location.pathname + location.search + '#work'); hide(); }
}
function route() {
  const m = location.hash.match(/^#work\/([\w-]+)$/);
  if (m && byId.has(m[1])) show(m[1]); else hide();
}

async function load(path) { const r = await fetch(BASE + path); if (!r.ok) throw new Error(`work-g: ${path} ${r.status}`); return r.json(); }
async function init() {
  if (!ROOT) return;
  const style = el('style'); style.id = 'wkg-style'; style.textContent = CSS; document.head.appendChild(style);
  if (!document.getElementById('wkg-fonts')) { const lk = el('link'); lk.id = 'wkg-fonts'; lk.rel = 'stylesheet'; lk.href = FONTS; document.head.appendChild(lk); }
  try {
    const [sw, md, br] = await Promise.all([load('software/manifest.json'), load('media/manifest.json'), load('media/brands.json').catch(() => ({}))]);
    DATA.software = spread(sw.filter(p => !HIDE.has(p.id)));
    DATA.media = spread(md.filter(p => !HIDE.has(p.id)));
    BRANDS = (br && Array.isArray(br.brands) ? br.brands : []).map(clean).map(s => s.trim()).filter(Boolean);
  } catch (err) {
    console.warn(err);
    ROOT.innerHTML = '<div class="wkg"><div class="wkg-head"><h2 class="wkg-title">Work</h2></div></div>';
    return;
  }
  ALL = [...DATA.software, ...DATA.media];
  byId = new Map(ALL.map(p => [p.id, p]));
  buildListing();
  setTab(tab, true);
  gl = await initGL();
  if (gl) gl.setCards(DATA[tab], ui.cards); else ui.w.classList.remove('wkg-glon');
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && openId) close(); });
  route();
  window.__wkg = {
    go, close, show, hide, get openId() { return openId; }, get gl() { return !!gl; },
    pin: (v) => gl && gl.pin(v), point: (x, y) => gl && gl.point(x, y),
    hold(t) { holds.forEach(a => { a.pause(); a.currentTime = t * FLY_MS; }); },
    release() { holds.forEach(a => a.play()); },
  };
}

init();
