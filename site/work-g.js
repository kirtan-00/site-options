/* Work, version G6: Gallery, rebuilt for smooth motion after lusion.co (measured, see ref/pages/lusion/motion/NOTES.md).
   1. Listing: a big grotesk heading (Software or Media) with a short line on the right, the category filters, then an
      aligned two column grid of large rounded cards; under each card the kind, small, then the title, big.
      On a desktop pointer one three.js canvas (fixed to the viewport, DPR at most 1.5, no MSAA) paints every card as a
      plane over its slot. Slot positions are measured on layout changes only, never per frame. The planes bow a little
      with scroll speed, and the one under the pointer eases into a slow zoom, drifts with the pointer and lenses softly
      toward it. Nothing else on the page dims or blurs. Phones, reduced motion and no WebGL get the same layout as
      plain images.
   2. Entrance: heading lines rise out of masks, then cards reveal from their bottom edge while the picture settles from
      a slight zoom (GSAP, expo out). A card never reveals before its picture is decoded and uploaded.
   3. Open: the card's picture zooms to fill the screen (one DOM flyer: clip-path inset plus a transform on the image,
      nothing that lays out), the rest of the list fades, and the project page appears under it.
   4. Project page: one horizontal run. Wheel and trackpad move it with a smoothed follow, touch swipes natively, a
      progress line runs along the bottom. Hero, intro (info, stats, links), channels, about, facts, every image and
      loop, credits, then Next project, which zooms in the same way. Back reverses the zoom into the card.
   5. Inside the page (G7, after Lusion's project pages, see ref/pages/lusion/motion/NOTES.md): the title rises line by
      line, then the info; every panel's lines, labels, rules and numbers build in as they come within 88% of the view;
      pictures wipe up out of their frames, settle from 1.14 and drift against the run; frames shear up to 2.5 deg and
      compress up to 2% with speed; the ground blends between panels (two stacked layers, opacity only); the next
      project's picture grows as the end arrives; Back takes the content out in 0.4 s, cuts to the hero picture and
      zooms into the card. Website captures sit framed on the ground; photos and films stay full bleed.
      ?inside=v runs the same page vertically. Phones: reveals, no parallax or shear. Reduced motion: all shown.
   Data: ../content/<wing>/media-notes.json (curated pictures, captions, crop, focus) and bts.json (Behind the scenes),
   both optional.
   Libraries: three 0.160.0, gsap 3.12.5 with ScrollTrigger, Lenis 1.1.13 (set up site-wide in index.html, read from KP).
   Fonts: Schibsted Grotesk for everything here (the landing already uses it), large titles at 500 to 600 with tight
   tracking, text at 400 and 500.

   OPTIONAL DATA FIELDS (read when present, never guessed):
     stats: software { visitors }, media { views, shares, likes }; missing shows 000 and "number to come".
       Media views fall back to a facts entry labelled Views.
     links: [{ label, url }] after `link`.   brands: media brands line from ../content/media/brands.json.
     credits: [{ role, name }] shown before the role facts.   year / client: else from facts.
   Thumbnails: <name>.w640.webp and <name>.w1280.webp next to each original; a missing one falls back.
   Software filters: All, Web dev, Automation, Web apps, Mac app, from each project's `category`; ?cat= keeps it.
   parts: [{ name, link, one_line, gallery }] (Deepdive) open as channel panels after the intro.
   Fills <section id="work">. Every class and id starts with wkg-. Project pages live at #work/<id>. */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const ROOT = document.getElementById('work');
const KP = (window.KP ||= {});
const BASE = KP.content || '../content/';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
/* ?inside=v: the project page as one vertical run instead of the horizontal one (same entry, back and content) */
/* ?draft=1 shows the placeholders (000, number to come); the public site never does */
const DRAFT = new URLSearchParams(location.search).get('draft') === '1';
const VMODE = new URLSearchParams(location.search).get('inside') === 'v';
const SPRING = 'cubic-bezier(.2,.8,.2,1)';
const HOVER = matchMedia('(hover: hover) and (pointer: fine)');
/* a phone, upright or on its side: a landscape phone is wider than 760 but short and coarse, and gets the phone layout and
   the vertical-drive run too (PHONE-AUDIT #5) */
const PHQ = '(max-width:760px),(pointer:coarse) and (max-height:500px)';
const PHONEQ = matchMedia(PHQ);
const isPhone = () => PHONEQ.matches;
const HIDE = new Set(['gujarat-titans']);
const TEXT_ONLY = new Set(['fourside-studios', 'palladium', 'dvc']);

const INK = '#0c0d0f', PAPER = '#f1f2f0', BLUE = '#c9d8f7', PINK = '#f2a7b6', SKY = '#7d9bf0', COBALT = '#1c3bb0', NAVY = '#0f2545';
/* the line beside the Software heading (swap freely) */
const SOFTWARE_LINE = 'Every one of these started as a problem on a set or in an inbox.';
const WING = {
  software: { title: 'Software', sub: SOFTWARE_LINE, ground: BLUE, slot: SKY },
  media: { title: 'Media', sub: '', ground: PINK, slot: PAPER },
};
const CAT = { webdev: 'Web dev', automation: 'Automation', webapp: 'Web app', macapp: 'Mac app' };
const FILTERS = [['all', 'All'], ['webdev', 'Web dev'], ['automation', 'Automation'], ['webapp', 'Web apps'], ['macapp', 'Mac app']];
const ALIAS = { 'deepdive-blog': 'deepdive' };
const FONTS = 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..700&display=swap';
const FF = '"Schibsted Grotesk",system-ui,sans-serif';
const ARRIVE = 'cubic-bezier(.16,1,.3,1)', MOVE = 'cubic-bezier(.76,0,.24,1)';
/* motion tokens, from the Lusion measurements: long expo and quart outs, no bounce */
/* the wheel follow, per 60 Hz frame, measured on lusion.co (listing and project pages alike): frame-rate independent */
const FOLLOW = 0.18;
const T = { reveal: 1.25, rise: 1.1, zoom: 1.0, fade: 0.45, hoverIn: 0.16, hoverOut: 0.2 };

const CSS = `
.wkg-h2i{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .16s linear}.wkg-card:hover .wkg-h2i,.wkg-card:focus-visible .wkg-h2i{opacity:1}
html.kp-nodisc #ka.lab b{opacity:0!important}html.kp-nodisc #ka.lab svg{opacity:1!important}

#work{position:relative;background:var(--wkg-ground,${BLUE});color:${INK};transition:background-color .8s ${MOVE}}
.wkg,.wkg-page{--gut:clamp(18px,4vw,64px);--cg:clamp(16px,2.2vw,40px)}
.wkg{position:relative;font-family:${FF};font-weight:400;-webkit-font-smoothing:antialiased;padding-bottom:clamp(72px,12vh,140px)}
.wkg *,.wkg-page *,.wkg-fly *{box-sizing:border-box}
:where(.wkg,.wkg-page) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.wkg :focus-visible,.wkg-page :focus-visible{outline:2px solid ${COBALT};outline-offset:4px}

/* the switch: the wing's name is the two words. The one you are on is solid ink, the other waits faint and fills on hover */
/* the Software/Media switch; :not(.wkg-page) because a software project page carries .wkg-sw too, and inherited this
   44-184px size and -.055em spacing (as px) into every paragraph that sets no spacing of its own: words ran together */
/* Software sits at the left margin and Media at the right one: two separate things to tap, not one heading */
.wkg-sw:not(.wkg-page){display:flex;align-items:flex-start;justify-content:space-between;align-self:stretch;width:100%;flex-wrap:nowrap;gap:clamp(18px,3.4vw,60px);margin:0;font:600 clamp(40px,11.2vw,184px)/.92 ${FF};letter-spacing:-.055em}
.wkg-sw.wkg-swin:not(.wkg-page){overflow:hidden;padding:0 0 .22em;margin-bottom:-.22em}
.wkg-w{position:relative;display:flex!important;align-items:flex-start;font:inherit!important;letter-spacing:inherit!important;padding:0 .02em .14em 0!important;white-space:nowrap;min-height:44px;-webkit-tap-highlight-color:transparent}
.wkg-w .wkg-wg{display:block;color:rgba(12,13,15,.16);transition:color .5s ${ARRIVE}}
.wkg-w .wkg-wf{position:absolute;left:0;top:-.1em;padding:.1em .12em .14em 0;color:${INK};clip-path:inset(0 100% 0 0);transition:clip-path .7s ${ARRIVE};pointer-events:none}
.wkg-w[aria-selected="true"] .wkg-wf{clip-path:inset(0 0 0 0)}
@media (hover:hover){.wkg-w[aria-selected="false"]:hover .wkg-wf{clip-path:inset(0 0 0 0)}}
.wkg-w[aria-selected="false"]:active{transform:translateY(2px)}
.wkg-w sup{display:block;margin:.5em 0 0 .12em;font:500 clamp(12px,1.1vw,17px)/1 ${FF};letter-spacing:0;color:${COBALT};font-variant-numeric:tabular-nums}
.wkg-w sup,.wkg-title sup{display:none!important}   /* no counts beside Software / Media */
/* the cut between wings: the new ground wipes across the visible part of the listing from the side of the word picked */
.wkg-cut{position:fixed;left:0;right:0;z-index:8;pointer-events:none;background:var(--to);clip-path:inset(0 100% 0 0)}
.wkg-cut.wkg-r{clip-path:inset(0 0 0 100%)}
.wkg-cut.wkg-run{clip-path:inset(0 0 0 0);transition:clip-path .62s cubic-bezier(.7,0,.2,1)}

/* the heading: Lusion's "Featured Work" set as the wing's name, the line on the right */
.wkg-head{position:relative;z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:clamp(14px,1.6vw,22px);padding:clamp(72px,8vh,110px) var(--gut) clamp(32px,5vh,64px)}   /* 72 at least: Media ends on the Contact pill's margin, so the row starts under the pill in a short window */
.wkg-title{margin:0;font:500 clamp(68px,11.6vw,212px)/.9 ${FF};letter-spacing:-.058em;display:flex;align-items:flex-start;gap:.06em}
.wkg-title sup{font:500 clamp(16px,1.4vw,22px)/1 ${FF};letter-spacing:0;color:${COBALT};margin-top:.55em;font-variant-numeric:tabular-nums}
.wkg-head p{margin:0;max-width:44ch;font:400 clamp(18px,1.45vw,24px)/1.32 ${FF};letter-spacing:-.012em;text-wrap:balance}
/* a line mask: 0.22em of room under the baseline so g, p and y never clip */
.wkg-mk{display:block;overflow:hidden;padding-bottom:.22em;margin-bottom:-.22em}
.wkg-title .wkg-mk{padding:0 .14em .22em 0;margin:0 -.14em -.22em 0}
.wkg-page .wkg-mk{padding-right:.1em;margin-right:-.1em}.wkg-page .wkg-mk>span{white-space:nowrap}
/* the hero's line can never be cut: if its column changes after the split, the masked line wraps inside its mask */
.wkg-page .wkg-hlede .wkg-mk>span{white-space:normal}
.wkg-mk>span{display:block}

.wkg-filt{position:relative;z-index:2;display:flex;flex-wrap:wrap;column-gap:clamp(20px,2.2vw,34px);row-gap:6px;margin:0 var(--gut) clamp(32px,5vh,60px)}
.wkg-filt[hidden]{display:none}
.wkg-fb{position:relative;display:inline-flex;align-items:baseline;gap:7px;font:500 18px/1.2 ${FF}!important;letter-spacing:-.01em;padding:6px 0!important;color:rgba(12,13,15,.76)!important;transition:color .3s;white-space:nowrap}
.wkg-fb small{font:500 14px/1 ${FF};color:${COBALT};font-variant-numeric:tabular-nums}
.wkg-fb.wkg-on{color:${INK}!important}
@media (hover:hover){.wkg-fb:hover{color:${INK}!important}}
/* a finger needs 44px chips with real air between the rows (PHONE-AUDIT #7) */
@media (pointer:coarse){.wkg-fb{min-height:44px;padding:11px 0!important}.wkg-filt{row-gap:8px!important}}
.wkg-fbar{position:absolute;left:0;top:0;width:1px;height:2px;background:${INK};transform-origin:0 0;pointer-events:none}
.wkg-fbar.wkg-mv{transition:transform .6s ${ARRIVE}}
/* touch: tabs and filters keep their look, their hit box grows to 44px tall (an invisible ::before; ::after is the underline) */
@media (pointer:coarse){.wkg-fb::before{content:"";position:absolute;left:-6px;right:-6px;top:50%;height:44px;transform:translateY(-50%)}}
.wkg-brands{position:relative;z-index:2;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--cg);margin:0 var(--gut) clamp(40px,6vh,72px);padding-top:20px;border-top:1px solid rgba(12,13,15,.18);align-items:baseline;row-gap:12px}
.wkg-brands[hidden]{display:none}
.wkg-bh{grid-column:1/span 4;margin:0;font:500 clamp(46px,5.2vw,92px)/1 ${FF};letter-spacing:-.04em;white-space:nowrap}
.wkg-bl{grid-column:5/-1;list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;column-gap:clamp(16px,2vw,34px);row-gap:clamp(6px,.7vw,12px);font:500 clamp(18px,1.55vw,26px)/1.15 ${FF};letter-spacing:-.025em}
.wkg-brands[hidden]{display:none!important}
.wkg-brands{display:block!important;margin-left:0;margin-right:0;padding-left:0;padding-right:0}
.wkg-brands .wkg-bh{margin:0 var(--gut) clamp(16px,2vw,28px);font-size:clamp(26px,2.6vw,44px)}
/* the brands cylinder: a section of its own height. Two rings of tiles that turn slowly by themselves, spin under a drag
   and lift under the pointer; a tile with a client folder opens it */
.wkg-lgv{--h:clamp(55px,5.28vw,77px);position:relative;overflow:hidden;padding:10px 0;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.wkg-lgb{display:flex;width:max-content;animation:wkgBelt var(--dur,40s) linear infinite;animation-direction:reverse;animation-play-state:paused}
.wkg-lgon .wkg-lgb{animation-play-state:running}
.wkg-lgr{display:flex;gap:clamp(18px,2.4vw,40px);padding-right:clamp(18px,2.4vw,40px)}
@keyframes wkgBelt{to{transform:translate3d(-50%,0,0)}}
.wkg-brands .wkg-lgt{flex:none;display:flex;align-items:center;justify-content:center;height:var(--h);font-size:var(--h);box-sizing:border-box;background:none;text-decoration:none;color:${INK};transition:transform .35s ${ARRIVE};-webkit-tap-highlight-color:transparent}
.wkg-lgt.wkg-go{cursor:pointer}
.wkg-lgt.wkg-go:focus-visible{outline:2px solid ${INK};outline-offset:3px}
@media (hover:hover) and (pointer:fine){.wkg-lgt.wkg-go:hover{transform:translate3d(0,-5px,0)}}
.wkg-lgm{display:block;flex:none}img.wkg-lgm{object-fit:contain;mix-blend-mode:multiply}
i.wkg-lgm{background:${INK};-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
@media (prefers-reduced-motion:reduce){.wkg-lgv{overflow-x:auto;-webkit-mask:none;mask:none}.wkg-lgb{animation:none}.wkg-lgr+.wkg-lgr{display:none}}
.wkg-bl li{white-space:nowrap}.wkg-bl .wkg-tbc{color:${COBALT};font-weight:400}

/* the grid: two equal columns, one gutter, every box one ratio, so rows share image top, bottom and title line */
.wkg{--lg:clamp(16px,2.2vw,44px);--rg:clamp(56px,6vw,120px);--rad:clamp(12px,1.05vw,20px)}
.wkg-wrap{position:relative}
#work,#work *{overflow-anchor:none}
.wkg-gl{position:fixed;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;visibility:hidden}
.wkg-gl.wkg-on{visibility:visible}
.wkg-list{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:2560px;margin:0 auto;padding:0 var(--gut);
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--lg);row-gap:var(--rg);align-items:start;align-content:start}
.wkg-card{display:block;width:100%;min-width:0;cursor:pointer}
/* a card is a real link now (it was a button): these are the button's own defaults, so nothing on screen moves */
a.wkg-card{color:inherit;text-decoration:none;text-align:left;letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0;text-shadow:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none}
/* text for screen readers and search only: a client's name beside its logo, a heading over the two lists */
.wkg-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.wkg-m{position:relative;display:block;width:100%;aspect-ratio:16/10;border-radius:var(--rad);overflow:hidden;container-type:inline-size;isolation:isolate}
.wkg-mi{position:absolute;inset:0;display:block;background:var(--wkg-slot,${SKY});will-change:transform}
.wkg-mi>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block;transition:transform 1s ${ARRIVE}}
.wkg.wkg-glon .wkg-mi{visibility:hidden}
.wkg .wkg-ghost .wkg-mi{visibility:visible}
.wkg-cap{display:block;margin-top:clamp(14px,1.2vw,22px)}
.wkg-k{display:block;font:500 15px/1.3 ${FF};letter-spacing:-.005em;color:rgba(12,13,15,.76)}
.wkg-cap h3{margin:6px 0 0;font:500 clamp(28px,2.7vw,52px)/1.02 ${FF};letter-spacing:-.045em;text-wrap:balance}
@media (hover:hover) and (pointer:fine){.wkg:not(.wkg-glon) .wkg-card:hover .wkg-mi>img{transform:scale(1.05)}}

/* the plate: text-only work. The logo (or the name set as a wordmark) is the hero; one real number bottom right */
.wkg-pl{position:absolute;inset:0;overflow:hidden;background:var(--pc);color:var(--pf);container-type:inline-size}
.wkg-plg{position:absolute;left:20cqw;right:20cqw;top:12cqw;height:32cqw;display:flex;align-items:center;justify-content:center}
.wkg-pl.wkg-nf .wkg-plg{top:15.25cqw}
.wkg-plg img{display:block;max-width:100%;max-height:100%;width:auto;height:auto}
.wkg-plg.wkg-pw{left:8cqw;right:8cqw}
.wkg-plg.wkg-pw span{font:500 8cqw/.95 ${FF};letter-spacing:-.05em;color:var(--pa);text-align:center;text-wrap:balance}
.wkg-pf{position:absolute;right:5.5cqw;bottom:5.5cqw;max-width:40cqw;text-align:right}
.wkg-pf b{display:block;font:500 7cqw/.85 ${FF};letter-spacing:-.05em;color:var(--pa);font-variant-numeric:tabular-nums}
.wkg-pf small{display:block;margin-top:1.2cqw;font:500 max(10px,1.7cqw)/1.25 ${FF};color:var(--pk)}

/* ---------- the flight: a full-screen layer clipped to the card, its picture scaled to match ---------- */
.wkg-fly{position:fixed;left:0;top:0;width:100%;height:100%;z-index:9;overflow:hidden;pointer-events:none;contain:strict}
.wkg-fli{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:50% 50%;will-change:transform}
.wkg-fli>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.wkg-fly .wkg-pl{container-type:inline-size}

/* ---------- the project page: one horizontal run ---------- */
html.wkg-lock,html.wkg-lock body{overflow:hidden!important}
.wkg-page{position:fixed;inset:0;z-index:9;overflow:hidden;visibility:hidden;background:var(--wkg-pg,${BLUE});color:${INK};font-family:${FF};font-weight:400;
  -webkit-font-smoothing:antialiased;--top:clamp(88px,12vh,120px);--bot:clamp(72px,10vh,104px);--pgap:clamp(48px,5.5vw,112px);--lab:0px}
.wkg-page.wkg-show{visibility:visible}
.wkg-page a{color:inherit}
.wkg-sc{position:absolute;inset:0;overflow:hidden;touch-action:pan-x pan-y}
.wkg-sc.wkg-native{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain;scroll-snap-type:x proximity}
.wkg-sc.wkg-native::-webkit-scrollbar{display:none}
/* phones (25 Nov, Kirtan): the run stays sideways, but the finger scrolls up and down. The scroller is vertical only, the
   track sits sticky at its top and is moved sideways by that scroll (one transform per frame); a spacer gives the length.
   A panel taller than the screen is a stop: the run holds while the same scroll carries its text up (wkg-gt8) */
.wkg-sc.wkg-pin{overflow-x:hidden;overflow-y:auto;touch-action:pan-y;overscroll-behavior:contain;scroll-snap-type:none;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.wkg-sc.wkg-pin::-webkit-scrollbar{display:none}
.wkg-pin>.wkg-track{position:sticky;top:0;left:0}
.wkg-track>.wkg-pn:last-child:not(.wkg-next){margin-right:var(--gut,18px)}   /* with no Next panel, the run ends on the page margin */
.wkg-pin .wkg-track>.wkg-pn{transition:opacity .3s}.wkg-pin .wkg-track>.wkg-pn.wkg-hid{opacity:0}
.wkg-pinsp{display:block;width:1px;pointer-events:none;visibility:hidden}
.wkg-pin .wkg-gt8{overflow-y:hidden!important}
/* nothing inside the run may stop the finger's scroll from reaching the scroller (a contain on a clipped panel did, over the GT route) */
.wkg-pin .wkg-track :is(.wkg-pn,.wkg-pi,.wkg-gt8,.mr-vsc){overscroll-behavior:auto!important}
/* a stop's text carried up fades out before it reaches Back and Contact at the top (and, until its end, at the line) */
.wkg-pin .wkg-track>.wkg-gt8{-webkit-mask-image:linear-gradient(transparent calc(var(--top) - 18px),#000 calc(var(--top) - 2px));mask-image:linear-gradient(transparent calc(var(--top) - 18px),#000 calc(var(--top) - 2px))}
.wkg-page:not(.wkg-vm) .wkg-pin .wkg-track>.wkg-gt8.wkg-ovf:not(.wkg-end){-webkit-mask-image:linear-gradient(transparent calc(var(--top) - 18px),#000 calc(var(--top) - 2px),#000 calc(100% - 22px),transparent);mask-image:linear-gradient(transparent calc(var(--top) - 18px),#000 calc(var(--top) - 2px),#000 calc(100% - 22px),transparent)}
.wkg-sc.wkg-drag{cursor:grabbing}
.wkg-track{position:relative;display:flex;height:100%;width:max-content;will-change:transform}
.wkg-bg{position:absolute;inset:0;pointer-events:none}.wkg-bg i{position:absolute;inset:0;background:var(--wkg-pg,${BLUE})}.wkg-bg i+i{opacity:0;will-change:opacity}
.wkg-pn{flex:0 0 auto;position:relative;height:100%;padding:var(--top) 0 var(--bot) var(--pgap);display:flex;flex-direction:column;scroll-snap-align:start}
.wkg-pi{margin-top:0}
.wkg-stk{flex:0 0 auto;height:100%;display:flex;flex-direction:column;gap:64px;padding:var(--top) 0 var(--bot)}.wkg-stk>.wkg-pn{height:auto;padding-top:0;padding-bottom:0}
.wkg-bstk{display:flex;flex-direction:column;gap:44px}
/* Back: a pill (navy on light grounds, paper on dark), Lusion's arrow swap on hover; hovering it (or Projects on touch)
   opens a sheet of every project, its name read out as each is hovered; a click goes straight there */
.wkg-page{--bkc:${NAVY};--bki:${PAPER};--bkh:${PINK};--bkhi:${NAVY}}
.wkg-page.wkg-dark{--bkc:${PAPER};--bki:${NAVY}}
.wkg-bk{position:absolute;left:var(--gut);top:16px;z-index:4;display:flex;align-items:flex-start;gap:8px}
.wkg-back,.wkg-allb{position:relative;opacity:0;padding:0!important;border-radius:999px;-webkit-tap-highlight-color:transparent}
.wkg-bm{position:relative;display:flex;align-items:center;gap:10px;height:46px;padding:0 22px 0 18px;border-radius:999px;background:var(--bkc);color:var(--bki);overflow:hidden;transition:background-color .35s ${SPRING},color .35s ${SPRING}}
.wkg-bi{flex:0 0 auto;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .45s ${SPRING},opacity .3s}
.wkg-bi2{position:absolute;right:18px;top:50%;margin-top:-8px;opacity:0;transform:translateX(-10px) rotate(180deg)}
.wkg-bt{display:block;overflow:hidden;padding:0 .1em .22em 0;margin-bottom:-.22em;font:500 16px/1.2 ${FF};letter-spacing:-.005em;transition:transform .45s ${SPRING}}
.wkg-bt>span{display:block}
.wkg-allb .wkg-bm{background:${SKY};color:${NAVY};padding:0 18px}
@media (hover:hover) and (pointer:fine){
  .wkg-back:hover .wkg-bm,.wkg-bk.wkg-sho .wkg-back .wkg-bm{background:var(--bkh);color:var(--bkhi)}
  .wkg-back:hover .wkg-bi1{transform:translateX(-26px);opacity:0}.wkg-back:hover .wkg-bt{transform:translateX(-26px)}
  .wkg-back:hover .wkg-bi2{opacity:1;transform:rotate(180deg)}
}
.wkg-back:active .wkg-bm{transform:scale(.95);transition-duration:.12s}
.wkg-page .wkg-back:focus-visible,.wkg-page .wkg-allb:focus-visible{outline:none}.wkg-back:focus-visible .wkg-bm,.wkg-allb:focus-visible .wkg-bm{outline:2px solid ${PINK};outline-offset:3px}
.wkg-sh{position:absolute;left:0;top:calc(100% + 10px);width:max-content;max-width:calc(100vw - 2 * var(--gut));padding:14px 14px 16px;border-radius:22px;background:${PAPER};color:${NAVY};
  box-shadow:0 18px 50px rgba(15,37,69,.22);transform-origin:30px 0;opacity:0;visibility:hidden;transform:translate3d(0,-8px,0) scale(.97);
  transition:opacity .25s ${ARRIVE},transform .45s ${ARRIVE},visibility 0s .45s}
.wkg-sh::before{content:"";position:absolute;left:0;right:0;top:-12px;height:12px}
.wkg-bk.wkg-sho .wkg-sh{opacity:1;visibility:visible;transform:none;transition:opacity .35s ${ARRIVE},transform .55s ${ARRIVE},visibility 0s}
.wkg-shn{display:flex;justify-content:space-between;align-items:baseline;gap:24px;margin:2px 4px 12px}
.wkg-shn small{font:500 14px/1.2 ${FF};color:rgba(15,37,69,.7);white-space:nowrap}
.wkg-shr{display:block;overflow:hidden;padding:0 .1em .22em 0;margin-bottom:-.22em;font:500 22px/1.15 ${FF};letter-spacing:-.025em;white-space:nowrap}
.wkg-shr>span{display:block}
.wkg-shg{display:grid;grid-template-columns:repeat(var(--cols,8),104px);gap:8px}
.wkg-th{position:relative;display:block;width:104px;min-width:0;opacity:0;transform:translate3d(0,8px,0);transition:opacity .3s,transform .5s ${ARRIVE}}
.wkg-bk.wkg-sho .wkg-th{opacity:1;transform:none;transition:opacity .45s ${ARRIVE} calc(var(--i) * 18ms + 60ms),transform .6s ${ARRIVE} calc(var(--i) * 18ms + 60ms)}
.wkg-thm{position:relative;display:block;width:100%;aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:${SKY};container-type:inline-size;isolation:isolate}
.wkg-thm>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block;transition:transform .7s ${ARRIVE}}
.wkg-th.wkg-cur .wkg-thm{box-shadow:0 0 0 2px ${PAPER},0 0 0 4px ${NAVY}}
.wkg-thn{display:none;margin-top:6px;font:500 14px/1.25 ${FF};letter-spacing:-.005em;text-align:left;text-wrap:balance}
@media (hover:hover) and (pointer:fine){.wkg-th:hover .wkg-thm>img,.wkg-th:focus-visible .wkg-thm>img{transform:scale(1.08)}.wkg-th:hover{transform:translate3d(0,-3px,0)!important}}
.wkg-th:focus-visible{outline:none}.wkg-th:focus-visible .wkg-thm{outline:2px solid ${COBALT};outline-offset:2px}
@media (hover:none),(pointer:coarse),(max-width:760px){
  .wkg-sh{position:fixed;left:10px;right:10px;top:auto;bottom:10px;width:auto;max-width:none;max-height:72vh;overflow-y:auto;overscroll-behavior:contain;transform-origin:50% 100%;transform:translate3d(0,24px,0)}
  .wkg-shg{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 10px}
  .wkg-th{width:auto}.wkg-thn{display:block}
  .wkg-shr{font-size:19px}
}
.wkg-prog{position:absolute;left:var(--gut);right:var(--gut);bottom:clamp(26px,4vh,40px);z-index:3;height:2px;background:rgba(12,13,15,.16);pointer-events:none;opacity:0;transition:background-color .5s}
.wkg-prog i{position:absolute;inset:0;background:${INK};transform:scaleX(0);transform-origin:0 50%;transition:background-color .5s}
.wkg-page.wkg-dark .wkg-prog{background:rgba(241,242,240,.3)}.wkg-page.wkg-dark .wkg-prog i{background:${PAPER}}

/* hero: the full screen the card zoomed into */
.wkg-hero{width:100vw;padding:0;overflow:hidden;background:${NAVY};color:${PAPER}}
.wkg-hm{position:absolute;inset:0;will-change:transform}
.wkg-hmi{position:absolute;inset:0;will-change:transform}
.wkg-hero:not(.wkg-txt):not(.wkg-hfr)::before{content:"";position:absolute;left:0;right:0;top:0;height:170px;z-index:1;background:linear-gradient(rgba(12,13,15,.42),rgba(12,13,15,0));pointer-events:none}
.wkg-hero.wkg-hfr{background:transparent;color:${INK};display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.6fr);align-items:center;column-gap:clamp(28px,4vw,80px);padding:var(--top) var(--gut) var(--bot)}
.wkg-hfr::after{display:none}
.wkg-hfr .wkg-hm{position:relative;inset:auto;justify-self:end;width:min(100%,calc((100vh - var(--top) - var(--bot)) * var(--ar,1.6)));width:min(100%,calc((100dvh - var(--top) - var(--bot)) * var(--ar,1.6)));aspect-ratio:var(--ar,1.6);border-radius:20px;overflow:hidden;background:var(--wkg-slot,${SKY});isolation:isolate}
.wkg-hfr .wkg-hcap{position:static;display:block}
.wkg-hfr .wkg-hcap>span{display:block;text-align:left;margin-bottom:clamp(18px,3vh,32px);opacity:1;color:rgba(12,13,15,.76)}
.wkg-hfr .wkg-hcap h1{font-size:clamp(48px,5.4vw,104px);line-height:.92}
.wkg-hlede{margin:clamp(20px,3.4vh,36px) 0 0;max-width:24ch;font:400 clamp(19px,1.5vw,25px)/1.3 ${FF};letter-spacing:-.015em;text-wrap:pretty}
.wkg-hm img,.wkg-hm video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.wkg-hm .wkg-hi2{opacity:0;transition:opacity .6s}.wkg-hm .wkg-hi2.wkg-ld{opacity:1}
.wkg-tri{display:grid;grid-template-columns:repeat(3,1fr)}
.wkg-tri>div{position:relative;overflow:hidden}
.wkg-hero .wkg-hcap{z-index:2}
.wkg-hero:not(.wkg-txt)::after{content:"";position:absolute;inset:auto 0 0 0;height:60%;background:linear-gradient(to top,rgba(12,13,15,.66),rgba(12,13,15,0));pointer-events:none}
.wkg-hcap{position:absolute;left:var(--gut);right:var(--gut);bottom:calc(var(--bot) - 8px);z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:24px}
.wkg-hcap h1{margin:0;font:500 clamp(58px,9vw,176px)/1.02 ${FF};letter-spacing:-.058em;text-wrap:balance}
.wkg-hcap>span{font:500 16px/1.35 ${FF};text-align:right;font-variant-numeric:tabular-nums;opacity:.92}
/* framed, after Lusion's Devin AI page (horizontal run, wider than a phone): the big title with the line and the info
   in two columns under it on the left, the work from 46% of the width at the run's full height, bleeding off the
   right edge until the run moves */
.wkg-hcols{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(20px,2.4vw,44px);margin-top:clamp(22px,4vh,44px);align-items:start}
.wkg-hcols .wkg-hlede{margin:0;max-width:none}
.wkg-hcols dl{margin:0;display:grid;gap:14px}.wkg-hcols dl>div{min-width:0}
.wkg-hcols dt{font:500 14px/1.3 ${FF};color:${COBALT};margin:0 0 3px}.wkg-hcols dd{margin:0;font:500 clamp(15px,1.1vw,18px)/1.35 ${FF}}
@media (min-width:761px){
  .wkg-page:not(.wkg-vm) .wkg-hero.wkg-hfr{display:block;padding:0;width:calc(46vw + (100vh - var(--top) - var(--bot)) * var(--ar,1.6) + var(--gut));width:calc(46vw + (100dvh - var(--top) - var(--bot)) * var(--ar,1.6) + var(--gut))}
  .wkg-page:not(.wkg-vm) .wkg-hfr .wkg-hm{position:absolute;left:46vw;top:var(--top);height:calc(100vh - var(--top) - var(--bot));height:calc(100dvh - var(--top) - var(--bot));width:calc((100vh - var(--top) - var(--bot)) * var(--ar,1.6));width:calc((100dvh - var(--top) - var(--bot)) * var(--ar,1.6));max-height:none;aspect-ratio:auto}
  .wkg-page:not(.wkg-vm) .wkg-hfr .wkg-hcap{position:absolute;left:var(--gut);top:var(--top);bottom:var(--bot);width:calc(46vw - var(--gut) - clamp(28px,3vw,60px));display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
  .wkg-page:not(.wkg-vm) .wkg-hfr .wkg-hcols{align-self:stretch}
  .wkg-page:not(.wkg-vm) .wkg-hfr .wkg-hcap h1{font-size:clamp(60px,6.8vw,136px);line-height:.9}
  .wkg-page:not(.wkg-vm) .wkg-hfr .wkg-hlede{font-size:clamp(17px,1.3vw,22px);line-height:1.38;letter-spacing:-.01em}
  .wkg-page:not(.wkg-vm).wkg-hfrp .wkg-info-i{display:none}
  .wkg-page:not(.wkg-vm).wkg-hfrp .wkg-intro.wkg-ionly{display:none}
}
@media ${PHQ}{.wkg-hcols dl{display:none}.wkg-hcols{display:block}}
.wkg-vm .wkg-hcols dl{display:none}.wkg-vm .wkg-hcols{display:block}
/* text-only: a typographic opener on the plate's ground */
.wkg-hero.wkg-txt{display:flex;flex-direction:column;justify-content:space-between;gap:40px;padding:var(--top) var(--gut) var(--bot);background:var(--pc);color:var(--pf)}
.wkg-tm{display:flex;justify-content:space-between;gap:24px;font:500 16px/1.3 ${FF};color:var(--pk);font-variant-numeric:tabular-nums}
.wkg-tlogo{display:block;width:auto;height:auto;max-height:clamp(84px,10vw,170px);max-width:60%;margin:0 0 clamp(24px,4vh,48px)}
.wkg-tlogo.wkg-tlw{max-height:none;max-width:min(34%,440px)}
.wkg-txt h1{margin:0;font:500 clamp(62px,10.6vw,200px)/1.02 ${FF};letter-spacing:-.058em;color:var(--pa);text-wrap:balance}
.wkg-tg{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-top:clamp(24px,5vh,56px)}
.wkg-tq{margin:0;max-width:30ch;font:400 clamp(22px,2.1vw,36px)/1.2 ${FF};letter-spacing:-.025em;text-wrap:pretty}
.wkg-tf{text-align:right;flex:0 0 auto}
.wkg-tf b{display:block;font:500 clamp(80px,9vw,168px)/.86 ${FF};letter-spacing:-.03em;color:var(--pa);font-variant-numeric:tabular-nums}
.wkg-tf small{display:block;margin-top:12px;font:500 16px/1.3 ${FF};color:var(--pk)}
.wkg-ln{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .12em .22em 0;margin:0 -.12em -.22em 0}
.wkg-ln>span{display:inline-block}

/* text panels */
.wkg-intro{width:clamp(560px,52vw,980px)}
.wkg-lede{margin:0;max-width:22ch;font:500 clamp(30px,3.1vw,56px)/1.06 ${FF};letter-spacing:-.04em;text-wrap:pretty}
.wkg-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px var(--cg);margin:clamp(28px,5vh,56px) 0 0;padding-top:20px;border-top:1px solid rgba(12,13,15,.2)}
.wkg-info>div{min-width:0}
.wkg-pi>.wkg-info:first-child{margin-top:0}
.wkg-lab{display:block;font:500 14px/1.3 ${FF};color:rgba(12,13,15,.76);margin:0 0 6px}
.wkg-info dd{margin:0;font:500 clamp(17px,1.35vw,21px)/1.3 ${FF};letter-spacing:-.01em}
.wkg-stats{display:flex;flex-wrap:wrap;gap:20px clamp(28px,4vw,72px);margin-top:clamp(26px,4.5vh,48px)}
.wkg-stat b{display:block;font:500 clamp(52px,5.6vw,104px)/.9 ${FF};letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.wkg-stat.wkg-tbc b{font-size:clamp(30px,2.6vw,44px);letter-spacing:-.04em;color:rgba(12,13,15,.76)}
.wkg-stat.wkg-tbc small{color:rgba(12,13,15,.76)}
.wkg-stat small{display:block;margin-top:8px;font:500 15px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-links{display:flex;flex-wrap:wrap;column-gap:28px;row-gap:8px;margin-top:clamp(24px,4vh,40px)}
.wkg-links a{position:relative;display:inline-block;padding:6px 0;font:500 clamp(18px,1.4vw,22px)/1.2 ${FF};letter-spacing:-.015em;text-decoration:none;color:${INK}}
.wkg-links a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:1.5px;background:currentColor;transform-origin:left;transition:transform .5s ${ARRIVE}}
@media (hover:hover){.wkg-links a:hover{color:${COBALT}}.wkg-links a:hover::after{transform:scaleX(.35)}}
.wkg-h2{margin:0 0 clamp(18px,3vh,32px);font:500 clamp(28px,2.4vw,44px)/1 ${FF};letter-spacing:-.045em;padding-right:.1em}
.wkg-cols{column-width:24em;column-gap:clamp(28px,3vw,56px);column-fill:auto}
.wkg-cols p{margin:0 0 .9em;font:400 clamp(17px,1.25vw,20px)/1.55 ${FF};text-wrap:pretty;break-inside:avoid-column}
.wkg-cols p:last-child{margin-bottom:0}
.wkg-tx .wkg-cols{column-width:20em}.wkg-tx .wkg-cols p{font:400 clamp(22px,1.8vw,30px)/1.28 ${FF};letter-spacing:-.02em}
.wkg-facts{display:grid;grid-template-rows:repeat(var(--fr,2),auto);grid-auto-flow:column;grid-auto-columns:clamp(220px,16.5vw,320px);gap:0 var(--cg)}
.wkg-fact{position:relative;padding:18px 0 26px;border-top:1px solid rgba(12,13,15,.2);min-width:0}
.wkg-fx .wkg-fact,.wkg-fx .wkg-credits dl>div,.wkg-fx .wkg-info{border-top-color:transparent!important}
.wkg-fx .wkg-fact::before,.wkg-fx .wkg-credits dl>div::before,.wkg-fx .wkg-info::before{content:"";position:absolute;left:0;right:0;top:-1px;height:1px;background:rgba(12,13,15,.2);transform:scaleX(0);transform-origin:0 50%;transition:transform 1.2s ${ARRIVE} var(--rd,0s)}
.wkg-fx .wkg-in .wkg-fact::before,.wkg-fx .wkg-in .wkg-credits dl>div::before,.wkg-fx .wkg-in.wkg-credits dl>div::before,.wkg-fx .wkg-in .wkg-info::before{transform:none}
.wkg-info,.wkg-credits dl>div{position:relative}
.wkg-fact b{display:block;font:500 clamp(26px,2.2vw,40px)/1.05 ${FF};letter-spacing:-.04em;text-wrap:balance;overflow-wrap:anywhere}
.wkg-fact.wkg-num b{font-size:clamp(52px,5vw,96px);line-height:.95;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap}
.wkg-stat b,.wkg-tf b{white-space:nowrap}
.wkg-stat b,.wkg-fact b,.wkg-tf b,.wkg-pf b{font-variant-numeric:normal!important}
.wkg-u{font-size:.4em;letter-spacing:-.01em;font-weight:500}
.wkg-bts>.wkg-pi{display:flex;align-items:flex-start;gap:clamp(40px,4.5vw,96px)}
.wkg-cls>.wkg-pi{display:flex;align-items:flex-start;gap:clamp(48px,5.5vw,120px);height:100%}
.wkg-clt{width:clamp(320px,27vw,480px);flex:0 0 auto}
.wkg-cls-steps{list-style:none;margin:0;padding:0;counter-reset:st}
.wkg-cls-steps li{counter-increment:st;display:grid;grid-template-columns:34px minmax(0,1fr);padding:0 0 clamp(14px,2.2vh,22px);font:400 clamp(18px,1.3vw,22px)/1.42 ${FF};letter-spacing:-.008em;text-wrap:pretty}
.wkg-cls-steps li::before{content:counter(st);font:500 14px/1.9 ${FF};color:var(--pa,${COBALT});font-variant-numeric:tabular-nums}
.wkg-file{margin:0;flex:0 0 auto;display:flex;flex-direction:column;gap:18px;height:min(100%,calc(100vh - var(--top) - var(--bot)));height:min(100%,calc(100dvh - var(--top) - var(--bot)))}
.wkg-doc{position:relative;flex:1 1 auto;min-height:0;aspect-ratio:3/4;max-height:min(66vh,640px);padding:clamp(28px,3.4vw,52px);border-radius:6px;background:color-mix(in srgb,var(--pf,${INK}) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pf,${INK}) 12%,transparent);display:flex;flex-direction:column;gap:14px;overflow:hidden}
.wkg-doc>i{display:block;height:14px;border-radius:2px;background:color-mix(in srgb,var(--pf,${INK}) 20%,transparent)}
.wkg-doc>i.wkg-hd{height:24px;margin-bottom:8px;background:color-mix(in srgb,var(--pf,${INK}) 34%,transparent)}
.wkg-doc>i.wkg-gap{height:10px;background:none}
.wkg-seal{--wkg-sealbg:var(--pc,${PAPER});position:absolute;left:50%;top:54%;width:72%;max-width:340px;aspect-ratio:1;color:var(--pa,#c0392b);transform:translate(-50%,-50%) rotate(-14deg);opacity:.94;mix-blend-mode:normal}
.wkg-seal svg{display:block;width:100%;height:100%;overflow:visible}
.wkg-seal text{font-family:${FF}}
.wkg-fx .wkg-seal{opacity:0;transform:translate(-50%,-50%) rotate(-4deg) scale(1.35);transition:opacity .25s linear .35s,transform .5s cubic-bezier(.2,1.6,.4,1) .35s}
.wkg-fx .wkg-in .wkg-seal,.wkg-fx .wkg-in.wkg-cls .wkg-seal{opacity:.94;transform:translate(-50%,-50%) rotate(-14deg) scale(1)}
.wkg-file .wkg-mcap{width:auto;max-width:34ch}
.wkg-railp>.wkg-pi{display:flex;flex-direction:column;height:100%}
.wkg-stops{--sup:300px;--lc:rgba(12,13,15,.28);position:relative;list-style:none;margin:0;padding:0 clamp(40px,4vw,80px) 0 0;display:flex;align-items:flex-start;gap:clamp(36px,3.4vw,64px)}
.wkg-stops::before{content:"";position:absolute;left:0;right:0;top:calc(var(--sup) + 28px);height:2px;background:var(--lc);transform-origin:0 50%}
.wkg-stop{position:relative;flex:0 0 auto;width:clamp(230px,15vw,280px);min-width:0}
.wkg-sup{height:var(--sup);display:flex;align-items:flex-end}
.wkg-sup>.wkg-fr{border-radius:12px}.wkg-sup .wkg-fm{left:0!important;top:0!important;width:100%!important;height:100%!important;transform:none!important}
.wkg-dot{position:absolute;left:0;top:calc(var(--sup) + 22px);width:14px;height:14px;border-radius:50%;background:${COBALT};box-shadow:0 0 0 4px var(--wkg-pg,${BLUE})}
.wkg-spic .wkg-dot{background:${PINK}}
.wkg-slo{padding-top:62px}
.wkg-sab .wkg-sup{flex-direction:column;justify-content:flex-end;align-items:flex-start}.wkg-sab .wkg-slo{padding:0 0 34px}
.wkg-stop.wkg-stuck{margin-left:calc(clamp(230px,15vw,280px) * -.42)}
.wkg-sdate{display:flex;align-items:baseline;gap:8px;margin:0 0 10px;white-space:nowrap}
.wkg-sdate b{font:500 clamp(34px,2.6vw,48px)/1 ${FF};letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.wkg-sdate span{font:500 15px/1.2 ${FF};color:rgba(12,13,15,.62)}
.wkg-sdate span:only-child{font-size:clamp(20px,1.5vw,26px);color:inherit;letter-spacing:-.02em}
.wkg-stxt{margin:0;max-width:30ch;font:400 clamp(17px,1.2vw,20px)/1.42 ${FF};letter-spacing:-.006em;text-wrap:pretty}
.wkg-fx .wkg-stops::before{transform:scaleX(0);transition:transform 2.4s cubic-bezier(.22,.8,.24,1)}
.wkg-fx .wkg-in .wkg-stops::before,.wkg-fx .wkg-in.wkg-railp .wkg-stops::before{transform:none}
.wkg-fx .wkg-dot{transform:scale(0);transition:transform .5s cubic-bezier(.2,1.7,.4,1) calc(.15s + var(--i) * .12s)}
.wkg-fx .wkg-in .wkg-dot{transform:none}
.wkg-gd .wkg-stops{--lc:rgba(241,242,240,.3)}.wkg-gd .wkg-sdate b,.wkg-gd .wkg-stxt{color:${PAPER}}.wkg-gd .wkg-sdate span{color:${BLUE}}.wkg-gd .wkg-dot{background:${BLUE}}.wkg-gd .wkg-spic .wkg-dot{background:${PINK}}
.wkg-fact .wkg-fgo{margin-top:16px}
.wkg-cmp>.wkg-pi{display:flex;align-items:flex-start;gap:clamp(40px,4.5vw,96px);height:100%}
.wkg-cmph{flex:0 0 auto;width:clamp(220px,15vw,300px)}
.wkg-cmpq{margin:0;font:400 17px/1.4 ${FF};color:rgba(12,13,15,.66);text-wrap:pretty}
.wkg-bas{display:flex;align-items:flex-start;gap:clamp(28px,2.6vw,48px)}
.wkg-ba{margin:0;flex:0 0 auto}
.wkg-bav{--p:50%;position:relative;overflow:hidden;border-radius:14px;background:var(--wkg-slot,${SKY});cursor:ew-resize;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.wkg-bav img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.wkg-bv1{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--p)) 0 0);background:var(--wkg-slot,${SKY})}
.wkg-bah::before{content:"";position:absolute;top:0;bottom:0;left:-21px;right:-21px}   /* a finger-wide grip around the 2px line */
.wkg-bah{position:absolute;top:0;bottom:0;left:var(--p);width:2px;margin-left:-1px;background:${PAPER};box-shadow:0 0 0 1px rgba(12,13,15,.12)}
.wkg-bah span{position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:${PAPER};color:${INK};display:grid;place-items:center;box-shadow:0 6px 20px rgba(12,13,15,.22);transition:transform .25s cubic-bezier(.2,1.6,.4,1)}
.wkg-bah svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.wkg-bav:hover .wkg-bah span,.wkg-bdr .wkg-bah span{transform:scale(1.1)}
.wkg-bah:focus-visible{outline:none}.wkg-bah:focus-visible span{outline:2px solid ${COBALT};outline-offset:3px}
.wkg-btag{position:absolute;top:12px;padding:5px 11px;border-radius:999px;font:500 14px/1.2 ${FF};background:rgba(12,13,15,.72);color:${PAPER};pointer-events:none}
.wkg-btl{left:12px}.wkg-btr{right:12px;background:${PAPER};color:${INK}}
/* phones: the tags sit small at the foot of the picture, clear of the app's own title bar at the top */
@media ${PHQ}{.wkg-btag{top:auto;bottom:8px;padding:3px 9px;font-size:12px}.wkg-btl{left:8px}.wkg-btr{right:8px}}
.wkg-ba figcaption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 16px;margin-top:12px}
.wkg-bs{font:500 17px/1.3 ${FF};letter-spacing:-.01em}
.wkg-bd{font:400 15px/1.3 ${FF};color:rgba(12,13,15,.62);white-space:pre}
.wkg-gd .wkg-cmpq,.wkg-gd .wkg-bd{color:${BLUE}}.wkg-gd .wkg-bs{color:${PAPER}}
.wkg-bcs{width:clamp(300px,24vw,440px)}.wkg-bcs>.wkg-lab{margin:0 0 18px}
.wkg-sg{padding:0 0 clamp(18px,2.6vh,28px)}
.wkg-sgl{display:block;font:500 14px/1.3 ${FF};letter-spacing:.01em;color:rgba(12,13,15,.6);margin:0 0 10px}
.wkg-chips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.wkg-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px 8px 12px;border-radius:999px;background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(12,13,15,.1);font:500 15px/1.2 ${FF};letter-spacing:-.01em;color:${INK};white-space:nowrap}
.wkg-chip i{flex:none;width:16px;height:16px;background:currentColor;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.wkg-gd .wkg-chip{background:rgba(241,242,240,.1);box-shadow:inset 0 0 0 1px rgba(241,242,240,.18);color:${PAPER}}
.wkg-gd .wkg-sgl{color:rgba(241,242,240,.6)}
.wkg-bcol{flex:0 0 auto;min-width:0}.wkg-bca{width:clamp(320px,26vw,460px)}
.wkg-bts .wkg-lesson{font-size:clamp(22px,1.9vw,32px)}
.wkg-bts .wkg-stats{display:grid;grid-template-rows:repeat(3,auto);grid-auto-flow:column;grid-auto-columns:clamp(200px,14.5vw,270px);gap:26px var(--cg);margin:0}
.wkg-bts .wkg-stat b{font-size:clamp(36px,3vw,56px)}.wkg-bts .wkg-stat small{font-size:16px;line-height:1.35;max-width:22ch;text-wrap:pretty}
.wkg-bts .wkg-fact b{font-size:clamp(19px,1.45vw,25px);line-height:1.2;overflow-wrap:break-word}
.wkg-its{display:grid;grid-template-rows:repeat(2,auto);grid-auto-flow:column;gap:22px var(--cg);margin:0}
.wkg-it{min-width:0}
.wkg-lesson{margin-top:clamp(20px,3vh,32px)}
.wkg-tl{list-style:none;margin:0;padding:0;display:grid;grid-template-rows:repeat(var(--tr,6),auto);grid-auto-flow:column;grid-auto-columns:clamp(280px,20vw,360px);gap:16px var(--cg)}
.wkg-tl li{border-top:1px solid rgba(12,13,15,.2);padding-top:10px}
.wkg-tl li{display:grid;grid-template-columns:6.4em minmax(0,1fr);gap:14px;font:500 clamp(15px,1.1vw,18px)/1.35 ${FF}}
.wkg-tl .wkg-lab{margin:0}
.wkg-it{margin:0}
.wkg-media.wkg-cp{align-items:flex-start;gap:clamp(24px,2.6vw,48px)}
.wkg-mcap{flex:0 0 auto;width:clamp(230px,19vw,340px);margin:0;font:400 clamp(17px,1.2vw,20px)/1.5 ${FF};letter-spacing:-.005em;text-wrap:pretty}
.wkg-vm .wkg-media.wkg-cp{flex-wrap:nowrap;align-items:flex-end;padding-top:clamp(56px,9vh,110px)}
.wkg-vm .wkg-media.wkg-cpr{flex-direction:row-reverse;justify-content:flex-end}
.wkg-cap2{display:flex;flex-direction:column;gap:4px;margin-top:10px;font:400 15px/1.45 ${FF};text-wrap:pretty}
.wkg-cap2 .wkg-lab{margin:0;font-size:14px;white-space:nowrap}
@media ${PHQ}{.wkg-cap2{font-size:14px}}
.wkg-credits dl{margin:0;display:grid;grid-auto-flow:column;grid-template-rows:repeat(var(--cr,4),auto);grid-auto-columns:minmax(220px,320px);gap:0 var(--cg)}
.wkg-credits dl>div{padding:16px 0 18px;border-top:1px solid rgba(12,13,15,.2)}
.wkg-credits dt{margin:0 0 6px;font:500 14px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-credits dd{margin:0;font:500 clamp(17px,1.35vw,21px)/1.35 ${FF}}

/* media: every frame takes the run's height; the picture inside drifts against the run */
.wkg-media{flex-direction:row;align-items:flex-start;gap:var(--cg)}
.wkg-media .wkg-shoot{position:absolute;left:var(--pgap);top:calc(var(--top) - 30px);margin:0;font:500 15px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-fr{position:relative;flex:0 0 auto;overflow:hidden;border-radius:14px;background:var(--wkg-slot,${SKY})}
.wkg-fr{will-change:transform}
.wkg-fm{position:absolute;top:0;left:-5%;width:110%;height:100%;will-change:transform}
.wkg-sw .wkg-fm{left:0;width:100%}.wkg-vm.wkg-sw .wkg-fm{top:0;height:100%}
.wkg-vm .wkg-fm{left:0;top:-5%;width:100%;height:110%}
.wkg-fm>img,.wkg-fm>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.wkg-blr{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;pointer-events:none;will-change:opacity}
.wkg-fm>video{opacity:0;transition:opacity .8s ${ARRIVE}}.wkg-fm>video.wkg-ld{opacity:1}
.wkg-ch{flex-direction:row;align-items:flex-start;gap:var(--cg)}
.wkg-chl{flex:0 0 auto;width:clamp(260px,22vw,380px)}
.wkg-chn{display:block;font:500 15px/1.2 ${FF};color:${COBALT};font-variant-numeric:tabular-nums;margin-bottom:12px}
.wkg-chl h3{margin:0;font:500 clamp(40px,4vw,76px)/1.04 ${FF};letter-spacing:-.055em}
.wkg-chl p{margin:16px 0 0;font:400 clamp(17px,1.3vw,20px)/1.45 ${FF};text-wrap:pretty}
.wkg-chl .wkg-links{margin-top:20px}
.wkg-soon{display:block;margin-top:20px;font:500 16px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-chq{flex:0 0 auto;margin:0;max-width:18ch;font:500 clamp(28px,3vw,52px)/1.08 ${FF};letter-spacing:-.04em}

/* the end: the run holds on the next project's name, its picture peeking in from the right edge; once the scroll has
   come to rest, "Scroll to continue" fades in, and a further deliberate scroll (or a click) carries on into it */
/* the last panel fills the view and ends on the page margin, like the first panel starts on it: nothing before it is left
   half-cut at the left edge and its picture is not cut by the right one */
.wkg-next{width:calc(100vw - var(--pgap));margin-left:var(--pgap);padding:var(--top) var(--gut) var(--bot) 0;background:transparent;color:inherit;cursor:pointer;flex-direction:row;align-items:flex-end;gap:clamp(28px,3.2vw,64px);overflow:hidden}
.wkg-nx{flex:0 0 auto;width:clamp(260px,24vw,440px)}
.wkg-nl{display:block;font:500 16px/1.3 ${FF};color:${COBALT};margin-bottom:16px}
.wkg-nt{display:block;font:500 clamp(52px,6vw,120px)/1.04 ${FF};letter-spacing:-.058em;text-wrap:balance;padding-bottom:.1em}
.wkg-nk{display:block;margin-top:20px;font:500 17px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-ncue{display:flex;align-items:center;gap:14px;margin-top:clamp(28px,5vh,52px);font:500 17px/1.2 ${FF};letter-spacing:-.01em;opacity:0;transform:translate3d(0,12px,0);transition:opacity .7s ${ARRIVE},transform .9s ${ARRIVE}}
.wkg-ncue i{position:relative;flex:0 0 auto;width:56px;height:2px;overflow:hidden;background:rgba(12,13,15,.16)}
.wkg-ncue b{position:absolute;inset:0;background:currentColor;transform:scaleX(var(--acc,0));transform-origin:0 50%;transition:transform .25s ${ARRIVE}}
.wkg-page.wkg-nxon .wkg-ncue{opacity:1;transform:none}
.wkg-gd .wkg-nl{color:${PINK}}.wkg-gd .wkg-nk{color:${BLUE}}.wkg-gd .wkg-ncue i{background:rgba(241,242,240,.3)}
.wkg-nm{position:relative;flex:0 1 auto;min-width:0;margin-left:auto;height:min(64vh,46vw);aspect-ratio:16/10;border-radius:16px;overflow:hidden;background:var(--wkg-slot,${SKY});container-type:inline-size;transform-origin:0 100%;will-change:transform}
.wkg-nm.wkg-v{aspect-ratio:4/5}
.wkg-nm>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;transition:transform 1.1s ${ARRIVE}}
@media (hover:hover){.wkg-next:hover .wkg-nm>img{transform:scale(1.05)}}

@media ${PHQ}{
  .wkg,.wkg-page{--gut:18px;--cg:14px}
  .wkg-head{flex-direction:column;align-items:flex-start;gap:14px;padding-top:76px;padding-bottom:30px}   /* the words clear the fixed Contact button */
  .wkg-sw:not(.wkg-page){font-size:clamp(36px,11.4vw,92px);gap:clamp(14px,4vw,28px)}
  .wkg-bh,.wkg-bl{grid-column:1/-1}
  .wkg-filt{column-gap:20px;row-gap:2px;margin-bottom:28px}
  .wkg-fb{font-size:17px!important}
  .wkg-list{grid-template-columns:minmax(0,1fr);row-gap:52px}
  .wkg-cap h3{font-size:30px}
  .wkg-page{--top:76px;--bot:64px;--pgap:max(18px,env(safe-area-inset-left))}   /* a landscape notch takes its inset (PHONE-AUDIT #17b) */
  /* Back, Projects and Contact float over the moving run: a scrim of the ground under them, once the run is past the
     hero, so text travelling up never shows through the pills (PHONE-AUDIT #2) */
  .wkg-page:not(.wkg-vm)::after{content:"";position:absolute;left:0;right:0;top:0;height:calc(var(--top) - 2px);z-index:2;pointer-events:none;background:linear-gradient(var(--wkg-gnow,transparent) 64%,transparent);opacity:0;transition:opacity .35s}
  .wkg-page.wkg-scr:not(.wkg-vm)::after{opacity:1}
  .wkg-prog{left:max(var(--gut),env(safe-area-inset-left));right:max(var(--gut),env(safe-area-inset-right))}
  .wkg-pn{max-width:calc(100vw - 36px)}
  .wkg-pn:not(.wkg-media):not(.wkg-hero):not(.wkg-next){overflow-y:auto;overscroll-behavior:contain;width:calc(100vw - 36px)}
  /* overflow-y:auto turns overflow-x to auto too: the word masks' 2-3px right padding then made each text panel a sideways
     scroller whose contain stopped the swipe dead (the run stalled at the first text panel). Sideways belongs to the run only */
  .wkg-pn:not(.wkg-media):not(.wkg-hero):not(.wkg-next),.wkg-ch{overflow-x:hidden;overscroll-behavior-x:auto}
  /* a scroll panel's box stops where the bottom band starts (the progress line and Next live there): at rest nothing
     runs under the line, the rest is a scroll inside the panel; one that overflows fades out over its last 22px until
     it is scrolled to its end (wkg-end), so the cut reads as more to come and the last line still lands clear */
  .wkg-page:not(.wkg-vm) .wkg-pn:not(.wkg-media):not(.wkg-hero):not(.wkg-next):not(.mr-gp):not(.mr-tlp):not(.mr-vxp):not(.mr-vox){height:calc(100% - var(--bot));padding-bottom:0}
  .wkg-page:not(.wkg-vm) .wkg-pn.wkg-ovf:not(.wkg-end){-webkit-mask-image:linear-gradient(#000 calc(100% - 22px),transparent);mask-image:linear-gradient(#000 calc(100% - 22px),transparent)}
  .wkg-hero,.wkg-next{max-width:none}
  .wkg-intro{width:calc(100vw - 36px)}
  .wkg-info{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .wkg-lede{font-size:30px}
  .wkg-cols{column-width:auto;columns:1}
  .wkg-facts{grid-template-rows:none;grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:repeat(2,minmax(0,1fr))}
  .wkg-bts{width:calc(100vw - 36px)}
  .wkg-bts>.wkg-pi{flex-direction:column;gap:36px}.wkg-bca,.wkg-bcs{width:100%}
  .wkg-cmp{width:calc(100vw - 36px)}.wkg-cmp>.wkg-pi,.wkg-bas{flex-direction:column;height:auto}.wkg-cmph,.wkg-ba{width:100%}.wkg-bav{width:100%}
  .wkg-fx .wkg-stops::before{transform:scaleY(0)}.wkg-fx .wkg-in .wkg-stops::before{transform:none}.wkg-railp{width:calc(100vw - 36px)}.wkg-stops{flex-direction:column;gap:30px;padding:0 0 0 30px}.wkg-stops::before{left:6px;right:auto;top:6px;bottom:0;width:2px;height:auto;transform-origin:50% 0}.wkg-stop,.wkg-stop.wkg-stuck{width:100%!important;margin:0}.wkg-sup{height:auto;display:block}.wkg-sab .wkg-sup{display:block}.wkg-dot{left:-30px;top:6px}.wkg-slo,.wkg-sab .wkg-slo{padding:0}.wkg-spic .wkg-slo{padding-top:12px}.wkg-sup>.wkg-fr{width:100%!important;height:auto!important}
  .wkg-cls{width:calc(100vw - 36px)}.wkg-cls>.wkg-pi{flex-direction:column;gap:40px;height:auto}.wkg-clt,.wkg-file{width:100%;height:auto}.wkg-doc{width:100%;max-height:none}
  .wkg-bts .wkg-stats{grid-template-rows:none;grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr))}
  .wkg-its,.wkg-tl{grid-template-rows:none;grid-auto-flow:row;grid-auto-columns:auto}
  .wkg-media.wkg-cp,.wkg-vm .wkg-media.wkg-cp,.wkg-vm .wkg-media.wkg-cpr{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:16px}
  .wkg-mcap{width:100%;font-size:17px}
  .wkg-media .wkg-shoot{top:calc(var(--top) + 2px)}
  .wkg-fact.wkg-num b{font-size:44px}
  .wkg-credits dl{grid-auto-flow:row;grid-template-rows:none;grid-auto-columns:auto}
  .wkg-tri{grid-template-columns:1fr}.wkg-tri>div:not(.wkg-hp){display:none}
  .wkg-hcap{grid-template-columns:1fr;gap:10px}
  .wkg-hcap h1{font-size:clamp(46px,14vw,72px)}
  .wkg-hcap>span{text-align:left;order:-1}
  .wkg-hero.wkg-txt{gap:28px}
  .wkg-txt h1{font-size:clamp(52px,16vw,84px)}
  .wkg-tg{flex-direction:column;align-items:flex-start;gap:24px}.wkg-tf{text-align:left}
  .wkg-tq{font-size:22px}.wkg-tf b{font-size:88px}
  .wkg-ch{flex-direction:column;align-items:flex-start;overflow-y:auto}
  .wkg-chl{width:100%}
  .wkg-next{flex-direction:column;align-items:flex-start;justify-content:flex-end;width:calc(100vw - 18px);gap:24px}
  .wkg-nx{width:100%}.wkg-ncue{margin-top:20px}
  .wkg-nm{height:auto;width:100%;margin-left:0}.wkg-nm.wkg-v{width:62%}
  .wkg-bk{top:12px;left:max(12px,env(safe-area-inset-left))}
  .wkg-bm{height:44px}
  .wkg-hero.wkg-hfr{grid-template-columns:minmax(0,1fr);align-content:center;row-gap:24px;padding:var(--top) 18px var(--bot)}
  .wkg-hfr .wkg-hm{justify-self:stretch;width:100%;max-height:46vh}
  .wkg-hfr .wkg-hcap h1{font-size:clamp(44px,13vw,64px)}
  .wkg-hlede{font-size:19px;margin-top:16px}
  .wkg-stat.wkg-tbc b{font-size:30px}
}
/* ---------- ?inside=v: the same page as one vertical run ---------- */
.wkg-vm .wkg-sc.wkg-native{overflow-x:hidden;overflow-y:auto;scroll-snap-type:none;overscroll-behavior:contain}
.wkg-vm .wkg-track{flex-direction:column;width:100%;height:auto}
.wkg-vm .wkg-pn{width:100%!important;max-width:none!important;height:auto;overflow:visible!important;display:block;padding:clamp(96px,15vh,190px) var(--gut) 0}
.wkg-vm .wkg-hero{height:100vh;height:100dvh;padding:0}
.wkg-vm .wkg-hero.wkg-hfr{display:grid;padding:var(--top) var(--gut) var(--bot)}
.wkg-vm .wkg-hero.wkg-txt{display:flex;padding:var(--top) var(--gut) var(--bot)}
.wkg-vm .wkg-intro .wkg-pi,.wkg-vm .wkg-about .wkg-pi,.wkg-vm .wkg-factp .wkg-pi,.wkg-vm .wkg-credits .wkg-pi{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--cg);align-items:start}
.wkg-vm .wkg-intro .wkg-lede{grid-column:1/span 7;max-width:none;font-size:clamp(34px,3.4vw,64px)}
.wkg-vm .wkg-intro .wkg-info{grid-column:9/-1;grid-row:1/span 3;grid-template-columns:minmax(0,1fr);margin:0}
.wkg-vm .wkg-intro .wkg-stats,.wkg-vm .wkg-intro .wkg-links{grid-column:1/span 7}
.wkg-vm .wkg-pi>.wkg-h2{grid-column:1/span 3}
.wkg-vm .wkg-about .wkg-cols{grid-column:5/-1;columns:2;column-fill:balance;width:auto!important;height:auto!important}
.wkg-vm .wkg-facts{grid-column:5/-1;grid-template-rows:none;grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.wkg-vm .wkg-credits dl{grid-column:5/-1;grid-auto-flow:row;grid-template-rows:none;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.wkg-vm .wkg-media,.wkg-vm .wkg-ch{display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-start;gap:var(--cg);padding-top:var(--cg)}
.wkg-vm .wkg-pn:not(.wkg-media)+.wkg-media{padding-top:clamp(96px,15vh,190px)}
.wkg-vm .wkg-media.wkg-hs{padding-top:clamp(72px,10vh,110px)}
.wkg-vm .wkg-media .wkg-shoot,.wkg-page.wkg-vm .wkg-media .wkg-shoot{position:static;flex:1 1 100%;margin:0}
.wkg-vm .wkg-chl{width:100%;max-width:640px}
.wkg-vm .wkg-cmp>.wkg-pi{flex-wrap:wrap;height:auto}.wkg-vm .wkg-bas{flex-wrap:wrap}.wkg-vm .wkg-ba{flex:1 1 300px}.wkg-vm .wkg-cmph{width:100%}
.wkg-vm .wkg-cls>.wkg-pi{flex-wrap:wrap;height:auto}.wkg-vm .wkg-clt{flex:1 1 380px}.wkg-vm .wkg-file{height:auto;flex:1 1 380px}.wkg-vm .wkg-doc{max-height:none}
.wkg-vm .wkg-stops{flex-direction:column;gap:30px;padding:0 0 0 30px}.wkg-vm .wkg-stops::before{left:6px;right:auto;top:6px;bottom:0;width:2px;height:auto;transform-origin:50% 0}.wkg-vm .wkg-stop,.wkg-vm .wkg-stop.wkg-stuck{width:100%!important;margin:0}.wkg-vm .wkg-sup{height:auto;display:block}.wkg-vm .wkg-sab .wkg-sup{display:block}.wkg-vm .wkg-dot{left:-30px;top:6px}.wkg-vm .wkg-slo,.wkg-vm .wkg-sab .wkg-slo{padding:0}.wkg-vm .wkg-spic .wkg-slo{padding-top:12px}.wkg-vm .wkg-sup>.wkg-fr{width:100%!important;height:auto!important}
.wkg-fx.wkg-vm .wkg-stops::before{transform:scaleY(0)}.wkg-fx.wkg-vm .wkg-in .wkg-stops::before{transform:none}
.wkg-vm .wkg-bts>.wkg-pi{flex-wrap:wrap}.wkg-vm .wkg-bcb,.wkg-vm .wkg-bcc,.wkg-vm .wkg-bcs{flex:1 1 40%}
.wkg-vm .wkg-bts .wkg-stats,.wkg-vm .wkg-bts .wkg-facts{grid-template-rows:none;grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.wkg-vm .wkg-bcd,.wkg-vm .wkg-bce{flex:1 1 100%}.wkg-vm .wkg-tl{grid-template-rows:none;grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}.wkg-vm .wkg-its{grid-template-rows:none;grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(260px,max-content))}
.wkg-vm .wkg-next{width:100%;min-height:100vh;min-height:100dvh;margin:clamp(96px,15vh,190px) 0 0;display:flex;padding:var(--top) var(--gut) var(--bot)}
.wkg-vm .wkg-nm{transform-origin:50% 100%}
@media ${PHQ}{
  .wkg-vm .wkg-pn{padding-top:72px}
  .wkg-vm .wkg-intro .wkg-pi,.wkg-vm .wkg-about .wkg-pi,.wkg-vm .wkg-factp .wkg-pi,.wkg-vm .wkg-credits .wkg-pi{grid-template-columns:minmax(0,1fr)}
  .wkg-vm .wkg-intro .wkg-lede,.wkg-vm .wkg-intro .wkg-info,.wkg-vm .wkg-intro .wkg-stats,.wkg-vm .wkg-intro .wkg-links,.wkg-vm .wkg-pi>.wkg-h2,.wkg-vm .wkg-about .wkg-cols,.wkg-vm .wkg-facts,.wkg-vm .wkg-credits dl{grid-column:1/-1;grid-row:auto}
  .wkg-vm .wkg-intro .wkg-lede{font-size:30px}.wkg-vm .wkg-intro .wkg-info{margin-top:28px}
  .wkg-vm .wkg-about .wkg-cols{columns:1}
  .wkg-vm .wkg-next{flex-direction:column;align-items:flex-start;justify-content:flex-end}
  .wkg-vm .wkg-pn:not(.wkg-media)+.wkg-media{padding-top:72px}
}
/* dark grounds (navy, cobalt, ink plates): paper text, light blue labels, light pink accents, light rules */
.wkg-page.wkg-gd{color:${PAPER}}
.wkg-gd :is(.wkg-lab,.wkg-stat small,.wkg-credits dt,.wkg-shoot,.wkg-soon,.wkg-tl .wkg-lab,.wkg-cap2 .wkg-lab,.wkg-bf small,.wkg-bf h3){color:${BLUE}!important}
.wkg-gd :is(.wkg-links a,.wkg-info dd,.wkg-credits dd,.wkg-fact b,.wkg-stat b,.wkg-tl li,.wkg-mcap,.wkg-lede,.wkg-cols p,.wkg-h2,.wkg-bf){color:${PAPER}}
.wkg-gd .wkg-chn{color:${PINK}}
.wkg-gd .wkg-stat.wkg-tbc b{color:${BLUE}}.wkg-gd .wkg-stat.wkg-tbc small{color:${BLUE}}
.wkg-gd :is(.wkg-info,.wkg-fact,.wkg-credits dl>div,.wkg-tl li,.wkg-bf li){border-top-color:rgba(241,242,240,.28)}
.wkg-gd.wkg-fx :is(.wkg-fact,.wkg-credits dl>div,.wkg-info)::before{background:rgba(241,242,240,.28)}
@media (hover:hover){.wkg-gd .wkg-links a:hover{color:${PINK}}}
/* Project brief */
.wkg-bf{width:clamp(560px,50vw,980px)}
.wkg-bf small{display:block;font:500 15px/1.3 ${FF};color:rgba(12,13,15,.76);margin-bottom:14px}
.wkg-bf .wkg-lede{max-width:28ch}
.wkg-bfl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--cg);margin-top:clamp(24px,4vh,44px)}
.wkg-bf h3{margin:0 0 8px;font:500 14px/1.3 ${FF};color:rgba(12,13,15,.76)}
.wkg-bf ul{list-style:none;margin:0;padding:0}
.wkg-bf li{padding:10px 0;border-top:1px solid rgba(12,13,15,.2);font:500 clamp(16px,1.2vw,19px)/1.35 ${FF}}
@media ${PHQ}{.wkg-bf{width:calc(100vw - 36px)}.wkg-bfl{grid-template-columns:minmax(0,1fr)}}
.wkg-vm .wkg-bf{width:100%!important}
/* no decorative rules anywhere: groups are separated by space; only the progress line is a line */
.wkg-brands,.wkg-info,.wkg-fact,.wkg-credits dl>div,.wkg-tl li,.wkg-bf li{border-top:0!important}
.wkg-fx :is(.wkg-fact,.wkg-credits dl>div,.wkg-info)::before{display:none}
/* the logo strip sits close under the two words. Its tiles took the live button's top margin (.wkg-go is also the strip's
   'has a folder' class), an empty band above the logos nobody asked for */
.wkg-brands{padding-top:0;margin-bottom:clamp(26px,4vh,48px)}.wkg-brands .wkg-lgt.wkg-go{margin-top:0}.wkg-info{padding-top:0}
.wkg-fact{padding:0 0 clamp(26px,4vh,44px)}.wkg-credits dl>div{padding:0 0 clamp(20px,3vh,32px)}
.wkg-tl li{padding-top:0}.wkg-bf li{padding:6px 0}
/* listing: on hover a drawn arrow slides in before the title and the title makes room (after Lusion) */
.wkg-cap h3{position:relative;transition:transform .6s ${ARRIVE}}
.wkg-cap h3::before{display:none;content:"";position:absolute;left:-.78em;top:.3em;width:.56em;height:.44em;background:currentColor;opacity:0;transform:translateX(-.35em);transition:opacity .4s ${ARRIVE},transform .6s ${ARRIVE};
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 17'%3E%3Cpath d='M1 8.5h19M13 1.5l7 7-7 7' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;
  mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 17'%3E%3Cpath d='M1 8.5h19M13 1.5l7 7-7 7' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}
@media (hover:hover) and (pointer:fine){.wkg-card:hover .wkg-cap h3{transform:none}.wkg-card:hover .wkg-cap h3::before{opacity:1;transform:none}}
/* the live button */
.wkg-go{display:inline-block;margin-top:clamp(22px,3.6vh,36px);text-decoration:none;color:${INK}!important;-webkit-tap-highlight-color:transparent}
.wkg-gm{position:relative;display:inline-flex;align-items:center;gap:12px;height:56px;padding:0 24px 0 20px;border-radius:999px;background:${PAPER};overflow:hidden;isolation:isolate;transition:transform .45s ${SPRING}}
.wkg-gm i{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:${INK};transition:background-color .3s}
.wkg-gf{position:absolute;left:24px;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:${INK};transform:scale(0);transition:transform .6s ${SPRING};z-index:-1}
.wkg-gt{display:flex;flex-direction:column;gap:4px;font:500 16px/1 ${FF};letter-spacing:-.005em;white-space:nowrap;transition:color .3s}
.wkg-gt small{font:500 14px/1 ${FF};letter-spacing:0;opacity:.62}
.wkg-lbs{column-gap:12px;row-gap:12px}.wkg-lbs .wkg-go{margin-top:0}.wkg-lbs a.wkg-go::after{display:none}.wkg-links a.wkg-go{padding:0}
.wkg-gm svg{width:16px;height:16px;margin-left:-28px;opacity:0;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;transform:translateX(-8px);transition:margin .5s ${SPRING},opacity .3s,transform .5s ${SPRING}}
@media (hover:hover) and (pointer:fine){
  .wkg-go:hover .wkg-gf{transform:scale(60)}.wkg-go:hover .wkg-gt{color:${PAPER}}.wkg-go:hover .wkg-gm i{background:${PAPER}}
  .wkg-go:hover .wkg-gm svg{margin-left:0;opacity:1;transform:none;stroke:${PAPER}}
}
.wkg-go:active .wkg-gm{transform:scale(.96)}
.wkg-go:focus-visible{outline:none}.wkg-go:focus-visible .wkg-gm{outline:2px solid ${COBALT};outline-offset:3px}
.wkg-gd .wkg-go:focus-visible .wkg-gm{outline-color:${PINK}}
.wkg-hero:not(.wkg-txt):not(.wkg-hfr) .wkg-gol{grid-column:1/-1}
@media ${PHQ}{.wkg-gm{height:50px}.wkg-go,.wkg-links a.wkg-go{display:block}.wkg-gm{width:100%;justify-content:center}.wkg-gf{left:50%}.wkg-lbs{flex-direction:column;align-items:stretch}}
@media (prefers-reduced-motion:reduce){.wkg-mi>img,.wkg-nm>img{transition:none}.wkg-cap h3,.wkg-cap h3::before{transition:none}}
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const src = (p) => BASE + p;
const clean = (s) => String(s == null ? '' : s).replace(/\s*[—–]\s*/g, ', ').replace(/--/g, ',').replace(/[←-⇿·]/g, '')
  .replace(/(\d) (?=(sq|ft|m|km|kg|min|sec|hrs?|days?|K|M|B)\b)/g, '$1\u00a0').replace(/\bsq ft\b/g, 'sq\u00a0ft');
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

/* per view (All and each filter): images keep the manifest order and the text-only cards take the slots that
   never put two of them in one row of the two columns, nor back to back on a phone, nor (when it can be helped)
   one above another or first. Every way of placing them is scored; n is small. */
function arrange(list) {
  const txt = list.filter(isText), img = list.filter(p => !isText(p)), n = list.length, k = txt.length;
  if (!k || !img.length || n > 16) return n > 16 ? spread(list) : list;
  let best = null, bs = Infinity;
  const pick = [];
  const score = (S) => {
    let v = 0; const has = new Set(S);
    S.forEach((a, j) => {
      if (has.has(a + 1)) v += a % 2 === 0 ? 100 : 30;   // same row on desktop / back to back on a phone
      if (has.has(a + 2)) v += 6;                         // one above the other in a column
      v += Math.abs(a - ((j + .5) * n / k - .5)) * .5;      // spread through the list
    });
    if (has.has(0)) v += 8;                               // open on an image
    return v;
  };
  (function rec(from) {
    if (pick.length === k) { const v = score(pick); if (v < bs) { bs = v; best = pick.slice(); } return; }
    for (let i = from; i <= n - (k - pick.length); i++) { pick.push(i); rec(i + 1); pick.pop(); }
  })(0);
  const at = new Set(best), out = []; let a = 0, b = 0;
  for (let i = 0; i < n; i++) out.push(at.has(i) ? txt[a++] : img[b++]);
  return out;
}
const cardKind = (p) => (p.wing === 'software' && CAT[p.category]) || kindOf(p);
/* alt text for a project's or client's own picture: its name and what it is, both from the manifest ("sorted, Mac app") */
const altOf = (p) => (p.heroAlt ? clean(p.heroAlt) : [clean(p.name), clean(kindOf(p))].filter(Boolean).join(', '));   // a client page opens on one of its films: media-reels.js names it
const partsOf = (p) => (Array.isArray(p.parts) ? p.parts : []).filter(x => x && x.name);

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
  if (p._run) return p._run.stats;           // reels (or DVCs) and views, never likes
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

/* every brand logo file. Spectra's mark is the file named saladific.svg (spectra.png is white and vanishes on a white
   tile), Zepto is its ink file, Kaavyaratna's mark is eve-for-her.svg; Saladific and Eve For Her have no file and are set
   in type. flat: a one-colour file filled with ink. sc: a lift for files with wide padding */
const BRAND_LOGOS = [
  { name: 'Gujarat Titans', file: 'media/logos/gujarat-titans.png', ar: 1.341 },
  { name: 'Zepto', file: 'media/logos/zepto-ink.png', ar: 2.847 },
  { name: 'Palladium', file: 'media/logos/palladium-ahmedabad.svg', ar: 1.787 },
  { name: 'Shivalik', file: 'media/logos/shivalik.svg', ar: 2.857 },
  { name: 'Crav Social', file: 'media/logos/crav-social.png', ar: 0.996 },
  { name: 'Spectra Museum', file: 'media/logos/saladific.svg', ar: 1.756 },
  { name: 'Fourside Studios', file: 'media/logos/fourside-studios.png', ar: 3.173, flat: 1 },
  { name: 'ABH Developers', file: 'media/logos/abh-developers.svg', ar: 4.11 },
  { name: 'Lofy', file: 'media/logos/lofy-clean.png', ar: 1.887 },
  { name: 'Kaavyaratna', file: 'media/logos/eve-for-her.svg', ar: 6.0 },
  { name: 'Oliver Brown', file: 'media/logos/oliver-brown.svg', ar: 1.813 },
  { name: 'Landmark Volkswagen', file: 'media/logos/landmark-volkswagen-trim.svg', ar: 2.564 },
  { name: 'Stellar Skoda', file: 'media/logos/stellar-skoda.svg', ar: 3.191 },
  { name: 'United Farmers Creamery', file: 'media/logos/united-farmers-creamery-trim.svg', ar: 1.508 },
  { name: 'Puffizza', file: 'media/logos/puffizza.svg', ar: 1.0 },
  { name: 'MMV', file: 'media/logos/mmv.svg', ar: 2.703 },
  { name: 'Qutone Ceramics', file: 'media/logos/qutone-ceramics-trim.svg', ar: 4.63 },
  { name: 'SJ Sangath', file: 'media/logos/sj-sangath-clean.svg', ar: 1.0, sc: 1.6 },
  { name: 'Space Arcade', file: 'media/logos/space-arcade.svg', ar: 3.409 },
  { name: 'Vishwanath Builders', file: 'media/logos/vishwanath-builders.png', ar: 3.659 },
  { name: 'Eklingji Skylights', file: 'media/logos/eklingji-skylights-trim.png', ar: 1.214, sc: 1.3 },
  { name: 'Pawfect', file: 'media/logos/pawfect.svg', ar: 2.885 },
  { name: 'UltraPop', file: 'media/logos/ultrapop-trim.png', ar: 4.195 },
  { name: 'CREDAI Shelter', file: 'media/logos/credai-shelter.png', ar: 3.399 },
  { name: 'Vibe Raas', file: 'media/logos/vibe-raas.png', ar: 1.0 },
];
let DATA = { software: [], media: [] }, ALL = [], byId = new Map(), BRANDS = [], tab = 'software', SW = [], cat = 'all';
let ui = {}, gl = null, openId = null, curPage = null, busy = false;
const holds = [];                        // running flight animations, so a test can hold them still


/* ---------- the listing ---------- */
/* a logo trimmed to its ink (some files carry wide transparent margins), cached per project. The ink box is found on
   a copy at most 256 px across, so the pixel scan stays well under a millisecond whatever the file size. */
const LOGOS = new Map();
/* resolves when #work is within two screens, when a page opens, or at once on a deep link: what the first screen does not
   need (logo trims, the card canvas and its WebGL context) waits for it */
let wakeWork = () => {};
const nearWork = new Promise((res) => {
  wakeWork = res;
  if (/^#(work|media)(\/|$)/.test(location.hash) || !('IntersectionObserver' in window) || !ROOT) { res(); return; }
  const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); res(); } }, { rootMargin: '200% 0px' });
  io.observe(ROOT);
});
function logoOf(p) {
  if (!p.logo) return null;
  if (LOGOS.has(p.id)) return LOGOS.get(p.id);
  const pr = new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 256 / Math.max(w, h));
        const sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k));
        const c = document.createElement('canvas'); c.width = sw; c.height = sh;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, sw, sh);
        const a = g.getImageData(0, 0, sw, sh).data; let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (a[(y * sw + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return res(null);
        const X0 = Math.max(0, Math.floor((x0 - 1) / k)), Y0 = Math.max(0, Math.floor((y0 - 1) / k));
        const X1 = Math.min(w, Math.ceil((x1 + 2) / k)), Y1 = Math.min(h, Math.ceil((y1 + 2) / k));
        const t = document.createElement('canvas'); t.width = X1 - X0; t.height = Y1 - Y0;
        t.getContext('2d').drawImage(im, -X0, -Y0);
        t.toBlob((b) => res({ canvas: t, url: b ? URL.createObjectURL(b) : t.toDataURL() }));
      } catch (e) { res({ canvas: im, url: im.src }); }
    };
    im.onerror = () => res(null);
    nearWork.then(() => { im.src = src(p.logo); });   // not at load: the trim is canvas work the first screen does not need
  });
  LOGOS.set(p.id, pr); return pr;
}
function plateEl(p) {
  const d = paint(el('div', 'wkg-pl'), p);
  const lp = logoOf(p);
  if (lp) { const g = el('span', 'wkg-plg'), im = el('img'); im.alt = ''; im.draggable = false; g.appendChild(im); d.appendChild(g); lp.then(l => { if (l) { im.src = l.url; im.alt = clean(p.name) + ' logo'; } else { g.className = 'wkg-plg wkg-pw'; g.textContent = ''; g.appendChild(el('span', '', clean(p.name))); } }); }
  else { const g = el('span', 'wkg-plg wkg-pw'); g.appendChild(el('span', '', clean(p.name))); d.appendChild(g); }
  const f = plateFact(p);
  if (f) { const x = el('span', 'wkg-pf'); x.append(el('b', '', clean(f.value)), el('small', '', clean(f.label))); d.appendChild(x); }
  else d.classList.add('wkg-nf');
  return d;
}
function cardEl(p) {
  const c = el('a', 'wkg-card'); c.href = p.hash || '#work/' + p.id; c.draggable = false; c.tabIndex = 0; c.dataset.id = p.id;   // a real link: crawlers and keyboards follow an href
  c.setAttribute('aria-label', `${clean(p.name)}. Open the project`);
  const m = el('span', 'wkg-m'), mi = el('span', 'wkg-mi');
  if (isText(p)) mi.appendChild(plateEl(p));
  else { const im = el('img'); im.alt = altOf(p); im.decoding = 'async'; im.draggable = false; im.loading = 'lazy'; setImg(im, p.hero, '(max-width:760px) 92vw, 46vw'); mi.appendChild(im); }
  m.appendChild(mi);
  const cap = el('span', 'wkg-cap');
  cap.append(el('h3', '', clean(p.name)));   // no kind line: the filters above already sort the work
  c.append(m, cap);
  // a plain click opens the page the way the button did; a modified click (new tab, new window) is the browser's
  c.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); go(p.id, m); });
  c.addEventListener('keydown', (e) => { if (e.key === ' ' && !e.repeat) { e.preventDefault(); go(p.id, m); } });   // Space opened the button too
  c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') prefetch(p); });
  c.addEventListener('focus', () => prefetch(p));
  // without the card canvas (reduced motion, no WebGL): the same second picture as a 160 ms crossfade, on a fine pointer
  if (HOVER_PAIRS[p.id] && HOVER.matches) {
    const two = () => { if (mi.querySelector('.wkg-h2i') || ui.w.classList.contains('wkg-glon')) return; const im = el('img', 'wkg-h2i'); im.alt = ''; im.decoding = 'async'; setImg(im, HOVER_PAIRS[p.id], '(max-width:760px) 92vw, 46vw'); mi.appendChild(im); };
    c.addEventListener('pointerenter', two, { passive: true }); c.addEventListener('focus', two);
  }
  return c;
}
const CARDS = new Map();
function cardOf(p) { let c = CARDS.get(p.id); if (!c) { c = cardEl(p); CARDS.set(p.id, c); } return c; }
function viewOf(t) {
  if (t !== 'software' || cat === 'all') return DATA[t];
  return arrange(SW.filter(p => p.category === cat));
}
let fanims = [], ftok = 0;
function stopFilterAnims() { fanims.forEach(a => a.cancel()); fanims = []; }
function place(list) {
  const cards = list.map(cardOf);
  ui.list.replaceChildren(...cards);
  ui.cards = cards; ui.shown = list;
  if (gl) gl.setCards(list, cards);
  return cards;
}

/* ---------- entrance: the heading rises out of its masks, cards reveal as they arrive ---------- */
const REVEALED = new Set();                 // card ids already shown, so a filter or tab never replays them
let batchST = [];
function watchCards(cards) {
  batchST.forEach(s => s.kill()); batchST = [];
  const todo = cards.filter(c => !REVEALED.has(c.dataset.id));
  if (RM.matches) { todo.forEach(c => { REVEALED.add(c.dataset.id); showCardNow(c); }); return; }
  todo.forEach(hideCard);
  if (!todo.length) return;
  batchST = ScrollTrigger.batch(todo, {
    start: 'top 92%', once: true, interval: 0.08, batchMax: 4,
    onEnter: (batch) => batch.forEach((c, i) => revealCard(c, i * 0.09)),
  });
}
function hideCard(c) {
  const cap = c.querySelector('.wkg-cap');
  gsap.set(cap, { autoAlpha: 0, y: 28 });
  if (!gl) { gsap.set(c.querySelector('.wkg-mi'), { yPercent: 101 }); const im = c.querySelector('.wkg-mi>img'); if (im) gsap.set(im, { yPercent: -40, scale: 1.16 }); }
}
function showCardNow(c) {
  gsap.set(c.querySelector('.wkg-cap'), { clearProps: 'all' });
  gsap.set(c.querySelector('.wkg-mi'), { clearProps: 'transform' });
  const im = c.querySelector('.wkg-mi>img'); if (im) gsap.set(im, { clearProps: 'transform' });
  if (gl) gl.reveal(c.dataset.id, 0, 0);
}
async function revealCard(c, delay) {
  const id = c.dataset.id; if (REVEALED.has(id)) return;
  REVEALED.add(id);
  // the picture is decoded (and on the canvas, uploaded) before anything moves, so nothing pops in half drawn
  const ready = gl ? gl.ready(id) : decodeIn(c);
  await Promise.race([ready, new Promise(r => setTimeout(r, 1400))]);
  const cap = c.querySelector('.wkg-cap');
  gsap.to(cap, { autoAlpha: 1, y: 0, duration: T.rise, ease: 'expo.out', delay: delay + 0.12, clearProps: 'transform,visibility,opacity' });
  if (gl) { gl.reveal(id, T.reveal, delay); return; }
  const mi = c.querySelector('.wkg-mi'), im = mi.querySelector('img');
  gsap.to(mi, { yPercent: 0, duration: T.reveal, ease: 'expo.out', delay, clearProps: 'transform' });
  if (im) gsap.to(im, { yPercent: 0, scale: 1, duration: T.reveal + 0.2, ease: 'expo.out', delay, clearProps: 'transform' });
}
function decodeIn(c) {
  const im = c.querySelector('.wkg-mi>img');
  if (!im) return Promise.resolve();
  im.loading = 'eager';
  return (im.complete && im.naturalWidth ? Promise.resolve() : new Promise(r => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }))
    .then(() => im.decode ? im.decode().catch(() => {}) : null);
}
function headIn() {
  const lines = [ui.sw, ui.subIn].filter(Boolean);
  if (RM.matches) return;
  // the two words rise inside a mask (on only for the rise, so it never clips a focus ring later)
  ui.sw.classList.add('wkg-swin');
  gsap.set(ui.words, { yPercent: 110 });
  gsap.set([ui.sub, ui.brands], { autoAlpha: 0, y: 18 });
  gsap.set(ui.filt, { opacity: 0, y: 18 });   // opacity only: hidden with visibility they dropped out of the Tab order
  ScrollTrigger.create({
    trigger: ui.head, start: 'top 88%', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(ui.words, { yPercent: 0, duration: T.rise + 0.2, ease: 'expo.out', stagger: 0.07, clearProps: 'transform', onComplete: () => ui.sw.classList.remove('wkg-swin') })
        .to(ui.sub, { autoAlpha: 1, opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }, 0.12)
        .to([ui.filt, ui.brands], { autoAlpha: 1, opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }, 0.22);
    },
  });
  return lines;
}

/* the Media tab's folders and player live in media-reels.js, fetched the first time Media opens. If it can't load, the
   original Media cards come back */
let reels = null, reelsP = null, reelsFailed = false;
/* Media client pages are this file's project page: media-reels.js hands over a project object with a _run (its reels,
   timeline, next client), and the same build, layout, engine, entry and next-project code runs them */
const RUN_API = {
  add(list) { list.forEach(p => byId.set(p.id, p)); },
  go: (id, fromEl) => go(id, fromEl),
  get dragged() { return PG.dragged; },
  get open() { return !!curPage; },
  pause() { if (curPage) { curPage._io && curPage._io.disconnect(); curPage.querySelectorAll('video').forEach(v => v.pause()); } },
  resume() { if (curPage) watchMedia(curPage); },
  reveal(n) { if (curPage && curPage.contains(n)) revealIn(curPage, n); },
  jump(n) { if (curPage && n && curPage.contains(n)) jumpTo(curPage, n); },
};
function showReels() {
  if (!ui.mr) ui.mr = el('div', 'mr');
  ui.list.appendChild(ui.mr);
  if (reels) { reels.route(); return; }
  reelsP ||= import('./media-reels.js').then(async (m) => {
    await m.mount(ui.mr, { base: BASE, project: (id) => byId.get(id), openProject: (id) => go(id), refresh: () => ScrollTrigger.refresh(), runs: RUN_API });
    reels = m;
    route();                                  // a cold #media/<client> link: the run can open now that it is registered
  }).catch((e) => {
    console.warn('work-g: reels layer did not load, plain Media cards instead', e);
    reelsFailed = true; ui.mr.remove();
    if (tab === 'media') watchCards(place(viewOf('media')));
  });
}
function setTab(t, first) {
  tab = t;
  const mark = () => {
    ROOT.style.setProperty('--wkg-ground', WING[t].ground);
    document.documentElement.style.setProperty('--kp-work', WING[t].ground);   // Contact's plate takes the listing's ground
    ROOT.style.setProperty('--wkg-slot', WING[t].slot);
    ui.words.forEach(b => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    ui.sub.textContent = WING[t].sub; ui.sub.style.display = WING[t].sub ? '' : 'none';   // no line, no empty box or gap
  };
  const build = () => {
    stopFilterAnims(); ftok++;
    ui.brands.hidden = t !== 'media';
    ui.filt.hidden = t !== 'software';
    const useReels = t === 'media' && !reelsFailed;
    const cards = place(useReels ? [] : viewOf(t));
    if (useReels) showReels();
    if (CYL) CYL.active(t === 'media');
    if (t === 'software') requestAnimationFrame(() => placeBar(false));
    watchCards(cards);
    ScrollTrigger.refresh();
  };
  if (cutEl) { cutEl.remove(); cutEl = null; }
  if (first) { mark(); build(); return; }
  // a switch never scrolls the page: the grid keeps its height while the cards change, then eases to the new one
  holdHeight();
  if (RM.matches) { mark(); build(); easeHeight(); return; }
  // the cut: the new ground wipes across the listing's visible part from the side of the word picked, everything
  // changes under it, then it lifts. It covers only #work on screen, so the menu and the landing are never hidden
  const old = ui.cards || [];
  if (gl) gl.fadeAll(0.32);
  gsap.to([...old.map(c => c.querySelector('.wkg-cap')), ...(gl ? [] : old.map(c => c.querySelector('.wkg-m')))], { autoAlpha: 0, y: 16, duration: 0.32, ease: 'power2.in' });
  const r = ROOT.getBoundingClientRect(), top = Math.max(0, r.top), bot = Math.min(innerHeight, r.bottom);
  const swap = () => {
    old.forEach(c => { REVEALED.delete(c.dataset.id); gsap.set([c.querySelector('.wkg-cap'), c.querySelector('.wkg-m')], { clearProps: 'all' }); });
    ROOT.style.transition = 'none'; mark(); void ROOT.offsetWidth; ROOT.style.transition = '';   // the ground is already there under the cut: no second fade
    build(); easeHeight();
  };
  if (bot - top < 2) { swap(); return; }
  const w = cutEl = el('div', 'wkg-cut' + (t === 'software' ? '' : ' wkg-r'));
  w.style.setProperty('--to', WING[t].ground); w.style.top = top + 'px'; w.style.height = (bot - top) + 'px';
  document.body.appendChild(w);
  let done = false;
  const lift = () => {
    if (done || cutEl !== w) return; done = true; swap();
    w.style.transition = 'opacity .25s'; w.style.opacity = '0';
    setTimeout(() => { w.remove(); if (cutEl === w) cutEl = null; }, 280);
  };
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('wkg-run')));
  w.addEventListener('transitionend', lift, { once: true });
  setTimeout(lift, 900);   // a hidden tab can skip transitionend
}
let cutEl = null;
/* the grid's height is held through a tab or filter swap (no collapse, so the page never jumps), then eased */
function holdHeight() { const l = ui.list; gsap.killTweensOf(l); l.style.minHeight = Math.max(l.offsetHeight, parseFloat(l.style.minHeight) || 0) + 'px'; }
function easeHeight() {
  // the new height is read from the cards, never by letting the grid collapse (that would clamp the scroll at once)
  const l = ui.list, old = parseFloat(l.style.minHeight) || 0;
  const nh = [...l.children].reduce((m, c) => Math.max(m, c.offsetTop + c.offsetHeight), 0);
  const done = () => { l.style.minHeight = ''; ScrollTrigger.refresh(); };
  if (nh >= old - 1) { done(); return; }
  // if the shorter grid can't hold the current position, the page eases up to its new end first (no clamp, no jump)
  const end = document.documentElement.scrollHeight - innerHeight - (old - nh);
  if (scrollY > end + 1) {
    const o = { y: scrollY };
    gsap.to(o, { y: end, duration: 0.9, ease: 'power2.inOut', delay: 0.35,
      onUpdate: () => { if (KP.lenis) KP.lenis.scrollTo(o.y, { immediate: true, force: true }); else scrollTo(0, o.y); },
      onComplete: () => gsap.to(l, { minHeight: nh, duration: 0.2, onComplete: done }) });
  } else gsap.to(l, { minHeight: nh, duration: 0.8, ease: 'power2.inOut', delay: 0.6, onComplete: done });
}
/* ---------- the software filters ---------- */
const readCat = () => { const v = new URLSearchParams(location.search).get('cat'); return FILTERS.some(([k]) => k === v) ? v : 'all'; };
function writeCat() {
  const q = new URLSearchParams(location.search);
  if (cat === 'all') q.delete('cat'); else q.set('cat', cat);
  const qs = q.toString();
  history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
}
function placeBar(move) {
  const b = ui.fbtn && ui.fbtn.find(x => x.dataset.cat === cat); if (!b || ui.filt.hidden) return;
  ui.fbar.classList.toggle('wkg-mv', !!move && !RM.matches);
  const padB = (parseFloat(getComputedStyle(b).paddingBottom) || 6) - 6;   // the taller touch chips keep the line under the word
  ui.fbar.style.transform = `translate3d(${b.offsetLeft}px,${b.offsetTop + b.offsetHeight - 2 - padB}px,0) scaleX(${b.offsetWidth})`;
}
function markFilters() {
  ui.fbtn.forEach(b => { const on = b.dataset.cat === cat; b.classList.toggle('wkg-on', on); b.setAttribute('aria-pressed', on); });
}
async function setCat(c, fromUrl) {
  if (c === cat) return;
  cat = c; markFilters(); placeBar(true);
  if (!fromUrl) writeCat();
  if (tab !== 'software') return;
  ++ftok;
  const prev = ui.cards || [];
  stopFilterAnims();
  // the reveal triggers of the cards being swapped out go too: left alive, the next refresh measures cards that are no
  // longer laid out where they were, and on a phone that moved the page by 2,000 px (every new card is shown below)
  batchST.forEach(t => t.kill()); batchST = [];
  ui.wrap.querySelectorAll('.wkg-ghost').forEach(g => g.remove());
  const list = viewOf('software');
  if (RM.matches) { const cards = place(list); cards.forEach(c => { REVEALED.add(c.dataset.id); showCardNow(c); }); return; }
  // one continuous move: the old cards fade where they stood (as copies) while the new grid rises in its own slots.
  // A card that stays in the same slot does not move at all; nothing travels across another card.
  const wr = ui.wrap.getBoundingClientRect();
  const was = new Map(prev.map(c => [c, c.getBoundingClientRect()]));
  holdHeight();
  const cards = place(list);
  const now = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
  const same = (a, b) => a && b && Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1;
  prev.forEach(c => {
    if (same(was.get(c), now.get(c))) return;
    const r = was.get(c); if (!r || r.bottom < -200 || r.top > innerHeight + 200) return;
    const g = c.cloneNode(true); g.classList.add('wkg-ghost'); g.setAttribute('aria-hidden', 'true'); g.tabIndex = -1;
    Object.assign(g.style, { position: 'absolute', left: (r.left - wr.left) + 'px', top: (r.top - wr.top) + 'px', width: r.width + 'px', margin: '0', pointerEvents: 'none', zIndex: '2' });
    ui.wrap.appendChild(g);
    const a = g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,-10px,0) scale(.985)' }], { duration: 240, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    a.finished.then(() => g.remove(), () => g.remove()); fanims.push(a);
  });
  let j = 0;
  cards.forEach((c) => {
    if (!REVEALED.has(c.dataset.id)) REVEALED.add(c.dataset.id);
    showCardNow(c);
    if (same(was.get(c), now.get(c))) return;
    const dl = 0.2 + Math.min(j++, 6) * 0.06;
    // on the canvas the picture grows up from its slot's bottom edge (the list's own reveal); the caption rises with it
    if (gl) { gl.reveal(c.dataset.id, 0.9, dl, 0); fanims.push(c.querySelector('.wkg-cap').animate([{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'none' }], { duration: 850, delay: dl * 1000 + 80, easing: ARRIVE, fill: 'backwards' })); }
    else fanims.push(c.animate([{ opacity: 0, transform: 'translate3d(0,36px,0)' }, { opacity: 1, transform: 'none' }], { duration: 850, delay: dl * 1000, easing: ARRIVE, fill: 'backwards' }));
  });
  if (gl) gl.sync(1600);
  easeHeight();
}
/* ---------- the clients strip (Media) ----------
   Every client with a logo file in one small, fast belt of logos: brands.json, every logo file and every client in the
   reels data, one entry per name, most viewed first. It never stops; a tile with a client folder opens it.
   Reduced motion: the belt stands still and scrolls sideways by hand. */
let CYL = null;
const CY_SKIP = new Set(['unidentified', 'craywingz', 'redbull', 'redbulluniversityspecfilm',
  'nearhood', 'eklingjiskylights', 'pawfect', 'eveforher', 'swastik42', 'vishwanathbuilders', 'cautio', 'indusuniversity', 'glsinstituteofdesign', 'spacearcade']);   // + his client cut of 25 Nov 2026   // no client, his own handle, a spec film
const CY_SAME = { fitandflexminibites: 'fitflex' };   // one client under two names
const STRIP_PX_S = 110;
/* his 29 kept clients (25 Nov 2026), by key; only these run in the strip */
const STRIP_KEEP = new Set(['gujarattitans', 'palladium', 'shivalik', 'zepto', 'sahajgroup', 'pycnavratri', 'abhdevelopers', 'lofy', 'cravsocial',
  'gcrankz', 'nagarsheth', 'oliverbrown', 'landmarkvolkswagen', 'kaavyaratna', 'mmv', 'qutoneceramics', 'puffizza', 'saladific', 'credaishelter',
  'sjsangath', 'onnirico', 'unitedfarmerscreamery', 'gallonspremiumwater', 'ragodental', 'fitflex', 'fitandflexminibites', 'stellarskoda', 'gallanttmt', 'ultrapop', 'formularc']);
const STRIP_BAD_LOGO = new Set(['saladific']);   // its file is Spectra's mark, not Saladific's   // belt speed, px per second
function brandCylinder(host) {
  const key = (n) => { const k = String(n).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, ''); return CY_SAME[k] || k; };
  const slugOf = (n) => String(n).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const SLUG = { fitflex: 'fit-and-flex-mini-bites' };
  const logoOf = new Map(BRAND_LOGOS.map(l => [key(l.name), l]));
  const vp = el('div', 'wkg-lgv'), belt = el('div', 'wkg-lgb');
  vp.appendChild(belt); host.appendChild(vp);
  let items = [], tiles = [], ready = null;
  // equal ink area per logo, in tile heights (em): wide marks get wide tiles, tall marks stay short
  function mark(it) {
    const l = it.logo;
    let w = Math.sqrt(0.36 * l.ar) * (l.sc || 1), h = w / l.ar;
    if (h > 0.56) { h = 0.56; w = h * l.ar; } if (w > 2.6) { w = 2.6; h = w / l.ar; }
    let m;
    if (l.flat) { m = el('i'); m.style.webkitMaskImage = m.style.maskImage = `url("${src(l.file)}")`; }
    else { m = el('img'); m.src = src(l.file); m.alt = ''; m.decoding = 'async'; m.loading = 'lazy'; m.draggable = false; }
    m.className = 'wkg-lgm'; m.style.width = w.toFixed(3) + 'em'; m.style.height = h.toFixed(3) + 'em';
    return [m, Math.max(1.5, w + 0.5)];
  }
  function gather(reelsData) {
    const by = new Map();
    const add = (n) => { n = String(n || '').replace(/\s*\(.*?\)\s*/g, ' ').trim(); const k = key(n); if (!n || CY_SKIP.has(k) || by.has(k)) return; by.set(k, { name: n, k, logo: logoOf.get(k) || null, views: 0, slug: SLUG[k] || slugOf(n) }); };
    BRANDS.forEach(add); BRAND_LOGOS.forEach(l => add(l.name));
    const list = Array.isArray(reelsData) ? reelsData : [], ids = new Set(list.map(x => x.id));
    list.forEach(x => add(x.client));
    list.forEach(x => { if (x.hidden || (x.same_as && ids.has(x.same_as))) return; const it = by.get(key(x.client)); if (it) it.views += Number(x.views) || 0; });
    return [...by.values()].filter(it => STRIP_KEEP.has(it.k) && it.logo && !STRIP_BAD_LOGO.has(it.k)).map((it, i) => ({ ...it, i })).sort((a, b) => (b.views - a.views) || (a.i - b.i));
  }
  function tile(it, copy) {
    const t = el('a', 'wkg-lgt'); const [m, w] = mark(it);
    t.style.width = w.toFixed(3) + 'em';
    t.appendChild(m);
    if (copy) { t.setAttribute('aria-hidden', 'true'); t.tabIndex = -1; }
    else if (m.tagName === 'IMG') m.alt = it.name;   // the client's name as real text: alt on a picture logo, a hidden span on a masked one
    else t.appendChild(el('span', 'wkg-sr', it.name));
    return t;
  }
  function build() {
    belt.replaceChildren(); tiles = [];
    // two copies of the run back to back: the belt slides one copy's width and starts over without a seam
    [0, 1].forEach(copy => { const run = el('div', 'wkg-lgr'); items.forEach(it => { const t = tile(it, copy); tiles.push({ t, it, copy }); run.appendChild(t); }); belt.appendChild(run); });
    vp.setAttribute('aria-label', 'Clients: ' + items.map(x => x.name).join(', '));
    links(); requestAnimationFrame(speed);
  }
  function speed() { const run = belt.firstChild; if (run && run.offsetWidth) belt.style.setProperty('--dur', (run.offsetWidth / STRIP_PX_S).toFixed(1) + 's'); }
  // a client with a folder becomes a link; the folder list lives in media-reels.js once it has loaded
  function links() {
    const have = (s) => !!(reels && reels.runOf('#media/' + s));
    tiles.forEach(o => {
      const go = have(o.it.slug); o.t.classList.toggle('wkg-go', go);
      if (go) { o.t.href = '#media/' + o.it.slug; if (!o.copy) { o.t.removeAttribute('tabindex'); o.t.setAttribute('aria-label', 'Open ' + o.it.name); } }
      else { o.t.removeAttribute('href'); if (!o.copy) o.t.removeAttribute('aria-label'); }
    });
  }
  addEventListener('resize', speed);
  ready = nearWork.then(() => fetch(BASE + 'media/reels.json')).then(x => (x.ok ? x.json() : [])).catch(() => []).then(d => { items = gather(d).filter(it => it.logo); build(); });   // logos only: a client without a logo file is left out, never written as text
  return {
    active(v) {
      host.classList.toggle('wkg-lgon', v); if (!v) return;
      ready.then(() => { links(); requestAnimationFrame(speed); });
      if (reelsP) reelsP.then(() => links()).catch(() => {});
    },
  };
}
function buildListing() {
  ROOT.textContent = '';
  const w = el('div', 'wkg'); ui.w = w;
  const head = el('div', 'wkg-head'); ui.head = head;
  // the title is the switch: two tabs, the wing you are on solid, the other faint; a cobalt count on each
  const sw = ui.sw = el('div', 'wkg-sw'); sw.setAttribute('role', 'tablist'); sw.setAttribute('aria-label', 'Work');
  const pick = (t) => {
    if (tab === t) return;
    if (t === 'software' && /^#media(\/|$)/.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search + '#work');
    else if (t === 'media' && /^(#work)?$/.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search + '#media');   // a reload lands back on Media
    syncTitle();
    setTab(t);
  };
  ui.counts = {};
  ui.words = ['software', 'media'].map(t => {
    const b = el('button', 'wkg-w'); b.type = 'button'; b.dataset.tab = t; b.id = 'wkg-w-' + t;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false'); b.setAttribute('aria-controls', 'wkg-panel'); b.tabIndex = -1;
    const n = ui.counts[t] = el('sup'); n.setAttribute('aria-hidden', 'true');
    const f = el('span', 'wkg-wf', WING[t].title); f.setAttribute('aria-hidden', 'true');
    b.append(el('span', 'wkg-wg', WING[t].title), f, n);
    b.addEventListener('click', () => pick(t));
    sw.appendChild(b); return b;
  });
  // arrows, Home and End move between the two and switch (automatic activation)
  sw.addEventListener('keydown', (e) => {
    const i = ui.words.indexOf(document.activeElement); if (i < 0 || e.repeat) return;
    let j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % 2;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + 1) % 2;
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = 1;
    if (j === null) return;
    e.preventDefault(); ui.words[j].focus(); pick(ui.words[j].dataset.tab);
  });
  setCount('software', SW.length);
  nearWork.then(mediaFilms).then(n => setCount('media', n));
  ui.sub = el('p');
  head.append(el('h2', 'wkg-sr', 'Work'), sw, ui.sub);   // a heading over the two lists, so the project and client h3s have a parent (not shown)
  ui.filt = el('div', 'wkg-filt'); ui.filt.setAttribute('aria-label', 'Filter the software');
  ui.fbtn = FILTERS.map(([k, label]) => {
    const n = k === 'all' ? SW.length : SW.filter(p => p.category === k).length;
    const b = el('button', 'wkg-fb'); b.type = 'button'; b.dataset.cat = k;
    b.append(document.createTextNode(label + ' '), el('small', '', String(n)));   // the space is for the read-out; the flex gap sets the look
    b.setAttribute('aria-label', `${label}, ${n}`);
    b.addEventListener('click', () => setCat(k));
    if (k !== 'all' && !n) b.hidden = true;
    ui.filt.appendChild(b); return b;
  });
  ui.fbar = el('span', 'wkg-fbar'); ui.fbar.setAttribute('aria-hidden', 'true'); ui.filt.appendChild(ui.fbar);
  markFilters();
  if (window.ResizeObserver) new ResizeObserver(() => placeBar(false)).observe(ui.filt);
  ui.brands = el('div', 'wkg-brands');
  CYL = brandCylinder(ui.brands);
  ui.wrap = el('div', 'wkg-wrap'); ui.wrap.id = 'wkg-panel'; ui.wrap.setAttribute('role', 'tabpanel');
  ui.list = el('div', 'wkg-list');
  ui.wrap.appendChild(ui.list);
  w.append(head, ui.filt, ui.brands, ui.wrap);
  ROOT.appendChild(w);
}
/* a wing's count: the cobalt number on its word, and in its name for a screen reader */
function setCount(t, n) {
  const ok = Number.isFinite(n) && n > 0, b = ui.words && ui.words.find(x => x.dataset.tab === t);
  ui.counts[t].textContent = ok ? String(n) : '';
  if (b) b.setAttribute('aria-label', ok ? `${WING[t].title}, ${n}` : WING[t].title);
}
/* the films on the Media index, counted the way media-reels.js counts a folder: shown reels only (no hidden, no
   count-only, never the dropped one), a film posted on two channels once, a single image no film, and only films the
   index reaches (a category, or a client folder still in his cut, the same clients the logo strip keeps) */
function mediaFilms() {
  const k = (n) => { const x = String(n || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, ''); return CY_SAME[x] || x; };
  return fetch(BASE + 'media/reels.json').then(r => (r.ok ? r.json() : [])).catch(() => []).then(d => {
    const R = (Array.isArray(d) ? d : []).filter(r => r && typeof r.id === 'string' && r.id !== 'DGC1_GpMidX' && !r.count_only && r.hidden !== true);
    const ids = new Set(R.map(r => r.id));
    return R.filter(r => r.type !== 'Image' && !(r.same_as && ids.has(r.same_as))
      && (r.in_fav || r.in_viral || r.in_dvc || r.in_doc || (r.in_client && STRIP_KEEP.has(k(r.client))))).length;
  });
}

/* ---------- the WebGL gallery: one canvas, fixed to the viewport, drawn only when something moved ---------- */
const VERT = `
uniform float uVel;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  wp.y += sin(uv.x * 3.14159265) * uVel;                     // a slight bow with the scroll speed, flat at rest
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
/* the second picture each Software card dissolves into, picked by hand (landscape on both sides, same framing) */
const HOVER_PAIRS = {
  spectra: 'software/spectra/live-02.jpg', shivasva: 'software/shivasva/live-02.jpg', 'credai-nashik': 'software/credai-nashik/desk-02.jpg',
  cravache: 'software/cravache/live-03.jpg', 'vibe-raas-led': 'software/vibe-raas-led/led-13.jpg', sorted: 'software/sorted/client-pick.jpg',
  deepdive: 'software/deepdive/intro-hover.jpg',
};
/* switches for the open calls: ?map=cloud swaps the strips for a soft cloud map; ?disc=off hides the cursor's Play/View disc */
const QS = new URLSearchParams(location.search);
const CLOUD = QS.get('map') === 'cloud' ? 1 : 0;
const DISC_OFF = QS.get('disc') === 'off';
const FRAG = `
uniform sampler2D uTex; uniform vec2 uSize; uniform vec2 uImg; uniform float uHover; uniform vec2 uMouse; uniform vec2 uPar;
uniform float uReveal; uniform float uLoad; uniform vec3 uBase; uniform float uAlpha; uniform float uRad; uniform float uVel;
uniform sampler2D uTex2; uniform vec2 uImg2; uniform float uMix; uniform float uPair; uniform float uEnter; uniform float uBands; uniform float uAmp; uniform float uCloud;
varying vec2 vUv;
// the hover dissolve (after Codrops' distortion hover, with the landing wall's vertical strips as the map): each band
// carries a fixed random push in -1..1 and blends into the next over 35% of its width, so the picture warps, not shutters
float hash(float n){ return fract(sin(n * 91.3458) * 47453.5453); }
float bandOf(float x){ float b = x * uBands, i = floor(b), f = fract(b); return mix(hash(i) * 2.0 - 1.0, hash(i + 1.0) * 2.0 - 1.0, smoothstep(0.65, 1.0, f)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = hash(i.x + i.y * 57.0), b = hash(i.x + 1.0 + i.y * 57.0), c = hash(i.x + (i.y + 1.0) * 57.0), d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0); return mix(mix(a, b, f.x), mix(c, d, f.x), f.y) * 2.0 - 1.0; }
float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  // the reveal: the rounded box grows up from the card's bottom edge
  float hv = uSize.y * uReveal;
  vec2 px = vec2((vUv.x - 0.5) * uSize.x, vUv.y * uSize.y - hv * 0.5);
  float d = box(px, vec2(uSize.x * 0.5, hv * 0.5), min(uRad, hv * 0.5));
  float a = (1.0 - smoothstep(-0.7, 0.7, d)) * uAlpha;
  if (a <= 0.001 || uReveal <= 0.0) discard;
  float pa = uSize.x / uSize.y, ia = uImg.x / uImg.y;
  vec2 s = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
  vec2 c = (vUv - 0.5) * s;
  float hz = uHover * (1.0 - uPair);                           // a card with a second picture drops the zoom, drift and lens
  c /= 1.0 + 0.16 * (1.0 - uReveal) + 0.07 * hz;               // settles from a slight zoom; hover zooms in slowly
  c.y += 0.07 * (1.0 - uReveal) * s.y;                         // and rises a little as it settles
  c -= uPar * s * 0.035 * hz;                                  // drifts with the pointer
  vec2 dd = (vUv - uMouse) * vec2(pa, 1.0);
  c -= (vUv - uMouse) * s * exp(-dot(dd, dd) * 5.0) * 0.055 * hz;   // a soft lens toward the pointer
  c.y *= 1.0 - min(abs(uVel) * 0.0014, 0.035);
  vec3 col = texture2D(uTex, c + 0.5).rgb;
  if (uMix > 0.0) {
    // bands start in order of distance from where the pointer came in; the spread is 30% of the progress
    float bc = (floor(vUv.x * uBands) + 0.5) / uBands, far = max(uEnter, 1.0 - uEnter);
    float pb = clamp((uMix - 0.3 * abs(bc - uEnter) / max(far, 0.001)) / 0.7, 0.0, 1.0); pb = pb * pb * (3.0 - 2.0 * pb);
    float disp = mix(bandOf(vUv.x), noise(vUv * vec2(4.0, 6.0)), uCloud) * uAmp;
    float ia2 = uImg2.x / uImg2.y; vec2 s2 = pa > ia2 ? vec2(1.0, ia2 / pa) : vec2(pa / ia2, 1.0);
    vec2 c2 = (vUv - 0.5) * s2;
    vec3 a1 = texture2D(uTex, c + 0.5 + vec2(0.0, disp * pb * s.y)).rgb;
    vec3 a2 = texture2D(uTex2, c2 + 0.5 - vec2(0.0, disp * (1.0 - pb) * s2.y)).rgb;
    col = mix(a1, a2, pb);
  }
  col = mix(uBase, col, uLoad);
  gl_FragColor = vec4(col * a, a);
}`;

async function initGL() {
  if (RM.matches || !HOVER.matches || isPhone() || !KP.lenis) return null;
  let THREE;
  try { THREE = await import('three'); } catch (e) { console.warn('work-g: three did not load, plain images instead'); return null; }
  const canvas = el('canvas', 'wkg-gl'); canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  const DPR = () => Math.min(1.5, devicePixelRatio || 1);
  renderer.setPixelRatio(DPR());
  renderer.setClearColor(0x000000, 0);
  ui.wrap.insertBefore(canvas, ui.list);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;
  const meshes = new Map();          // id -> rec
  let items = [];                    // [{ p, card, slot, m, r: cached doc rect }]
  let W = 1, H = 1, visible = false, paused = false, dirty = 3, lastY = scrollY, vel = 0;
  let mx = -1, my = -1, syncUntil = 0, rad = 18;
  const readRad = () => { const s0 = ui.list.querySelector('.wkg-m'); if (s0) rad = parseFloat(getComputedStyle(s0).borderTopLeftRadius) || rad; for (const m of meshes.values()) m.u.uRad.value = rad; };

  /* textures: fetched and decoded ahead of the reveal (well before the card is on screen), then uploaded one per frame */
  const uploads = [];
  function texFor(p, rec) {
    if (rec.texP) return rec.texP;
    rec.texP = new Promise((resolve) => {
      const done = (img, w, h) => {
        const t = img instanceof HTMLCanvasElement ? new THREE.CanvasTexture(img) : new THREE.Texture(img);
        t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
        uploads.push(() => { renderer.initTexture(t); rec.u.uTex.value = t; rec.u.uImg.value.set(w, h); rec.u.uLoad.value = 1; dirty = 2; resolve(); });
      };
      if (isText(p)) {
        const waits = [logoOf(p) || Promise.resolve(null)];
        if (document.fonts) waits.push(document.fonts.load(`500 120px ${FF}`), document.fonts.load(`500 30px ${FF}`));
        Promise.all(waits).then(([l]) => done(plateCanvas(p, l), 1280, 800), () => done(plateCanvas(p, null), 1280, 800));
        return;
      }
      const im = new Image(); im.decoding = 'async';
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => done(im, im.naturalWidth, im.naturalHeight));
      im.onerror = () => { if (!im._fb) { im._fb = 1; im.src = src(p.hero); } else resolve(); };
      im.src = big(p.hero);
    });
    return rec.texP;
  }
  /* the second picture: fetched the first time the pointer meets the card (and its neighbours), at most 8 kept */
  const held = [];
  function tex2For(p, m) {
    const path = HOVER_PAIRS[p.id]; if (!path || m.tex2P) return;
    m.tex2P = new Promise((res) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => {
        const t = new THREE.Texture(im); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
        uploads.push(() => { renderer.initTexture(t); m.tex2 = t; m.u.uTex2.value = t; m.u.uImg2.value.set(im.naturalWidth, im.naturalHeight); held.push(m); res();
          while (held.length > 8) { const o = held.find(x => x.mix === 0 && x.hov === 0); if (!o) break; held.splice(held.indexOf(o), 1); o.tex2.dispose(); o.tex2 = null; o.tex2P = null; o.u.uTex2.value = blank; } });
      });
      im.onerror = () => res();
      im.src = big(path);
    });
  }
  const tio = new IntersectionObserver((es) => es.forEach(e => { if (!e.isIntersecting) return; const it = items.find(x => x.card === e.target); if (it) texFor(it.p, it.m); }), { rootMargin: '160% 0px' });

  function rec(p) {
    let m = meshes.get(p.id);
    if (m) return m;
    const u = { uTex: { value: blank }, uSize: { value: new THREE.Vector2(1, 1) }, uImg: { value: new THREE.Vector2(16, 10) }, uHover: { value: 0 }, uMouse: { value: new THREE.Vector2(.5, .5) },
      uPar: { value: new THREE.Vector2(0, 0) }, uReveal: { value: 0 }, uLoad: { value: 0 }, uBase: { value: new THREE.Color(WING[p.wing].slot) }, uAlpha: { value: 1 }, uRad: { value: rad }, uVel: { value: 0 },
      uTex2: { value: blank }, uImg2: { value: new THREE.Vector2(16, 10) }, uMix: { value: 0 }, uPair: { value: HOVER_PAIRS[p.id] ? 1 : 0 }, uEnter: { value: 0.5 }, uBands: { value: 24 }, uAmp: { value: 0.14 }, uCloud: { value: CLOUD } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
    m = { mesh, u, hov: 0, mu: 0.5, mv: 0.5, alpha: 1, alphaT: 1, alphaK: 0.2, st: { reveal: 0 }, texP: null, mix: 0, tex2: null, tex2P: null, used: 0 };
    meshes.set(p.id, m);
    return m;
  }
  /* slot rects in document coordinates, measured only when the layout can have changed */
  function measure() {
    const sy = scrollY;
    for (const it of items) { const r = it.slot.getBoundingClientRect(); it.r = { x: r.left, y: r.top + sy, w: r.width, h: r.height }; }
    dirty = 2;
  }
  function setCards(list, cards) {
    tio.disconnect();
    for (const r of meshes.values()) r.mesh.visible = false;
    readRad();
    items = list.map((p, i) => {
      const m = rec(p); m.alphaT = 1; m.alpha = 1; m.u.uRad.value = rad;
      tio.observe(cards[i]);
      return { p, card: cards[i], slot: cards[i].querySelector('.wkg-m'), m, r: null };
    });
    ui.w.classList.add('wkg-glon');
    measure();
  }
  function resize() {
    W = document.documentElement.clientWidth; H = innerHeight;
    renderer.setPixelRatio(DPR()); renderer.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
    readRad(); measure();
  }
  const damp = (a, b, tau, dt) => (tau > 0 ? b + (a - b) * Math.exp(-dt / tau) : b);
  function tick(time, dtMs) {
    if (uploads.length) { uploads.shift()(); }
    if (!visible || paused) return;
    const dt = Math.min(0.05, (dtMs || 16.7) / 1000);
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = damp(vel, clamp(dy * 0.5, -36, 36), 0.1, dt);
    if (Math.abs(vel) < 0.03) vel = 0;
    let moving = dy !== 0 || vel !== 0 || dirty > 0;
    const syncing = performance.now() < syncUntil;
    let over = null;
    const rects = items.map((it, i) => {
      let r;
      if (syncing) { const b = it.slot.getBoundingClientRect(); r = { x: b.left, y: b.top, w: b.width, h: b.height }; }
      else r = it.r ? { x: it.r.x, y: it.r.y - y, w: it.r.w, h: it.r.h } : { x: 0, y: -9999, w: 0, h: 0 };
      if (over == null && !busy && mx >= 0 && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) over = i;
      return r;
    });
    const ops = syncing ? items.map(it => +getComputedStyle(it.card).opacity) : null;
    if (syncing) moving = true;
    items.forEach((it, i) => {
      const r = rects[i], m = it.m, u = m.u;
      const vis = r.y + r.h > -60 && r.y < H + 60 && r.w > 0 && m.st.reveal > 0;
      m.mesh.visible = vis;
      const ht = i === over ? 1 : 0;
      const nh = damp(m.hov, ht, ht ? T.hoverIn : T.hoverOut, dt);
      m.hov = Math.abs(nh - ht) < 0.002 ? ht : nh; if (m.hov !== ht) moving = true;
      const entered = ht && !m.was; m.was = !!ht;
      if (entered) { m.u.uEnter.value = clamp((mx - r.x) / r.w, 0, 1); tex2For(it.p, m); if (items[i - 1]) tex2For(items[i - 1].p, items[i - 1].m); if (items[i + 1]) tex2For(items[i + 1].p, items[i + 1].m); }
      // the dissolve runs only once the second picture is on the card: 0.18 s in, 0.12 s out (damped, reversible)
      if (m.tex2 || m.mix) { const tm = ht && m.tex2 ? 1 : 0, nm = damp(m.mix, tm, tm ? 0.18 : 0.12, dt); m.mix = Math.abs(nm - tm) < 0.002 ? tm : nm; if (m.force != null) m.mix = m.force; else if (m.mix !== tm) moving = true; u.uMix.value = m.mix; u.uBands.value = clamp(Math.round(r.w / 28), 6, 24); }
      if (i === over) {
        const tu = clamp((mx - r.x) / r.w, 0, 1), tv = clamp(1 - (my - r.y) / r.h, 0, 1);
        const nu = damp(m.mu, tu, 0.12, dt), nv = damp(m.mv, tv, 0.12, dt);
        if (Math.abs(nu - tu) + Math.abs(nv - tv) > 0.001) moving = true;
        m.mu = nu; m.mv = nv;
      }
      const na = damp(m.alpha, m.alphaT, m.alphaK, dt);
      m.alpha = Math.abs(na - m.alphaT) < 0.002 ? m.alphaT : na; if (m.alpha !== m.alphaT) moving = true;
      if (!vis) return;
      m.mesh.position.set(r.x + r.w / 2 - W / 2, H / 2 - (r.y + r.h / 2), 0);
      m.mesh.scale.set(r.w, r.h, 1);
      u.uSize.value.set(r.w, r.h); u.uVel.value = clamp(vel * 0.55, -20, 20);
      u.uHover.value = m.hov; u.uReveal.value = m.st.reveal;
      u.uMouse.value.set(m.mu, m.mv); u.uPar.value.set(m.mu - 0.5, m.mv - 0.5);
      u.uAlpha.value = m.alpha * (ops ? ops[i] : 1);
    });
    if (moving) { renderer.render(scene, cam); if (dirty > 0) dirty--; }
    if (!syncing && syncWas) { syncWas = false; measure(); }
    if (syncing) syncWas = true;
  }
  let syncWas = false;
  gsap.ticker.add(tick);
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(() => measure()).observe(ui.list);
  ScrollTrigger.addEventListener('refresh', measure);
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mx = my = -1; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; canvas.classList.toggle('wkg-on', visible && !paused); if (visible) { lastY = scrollY; dirty = 2; } }, { rootMargin: '10% 0px' }).observe(ui.wrap);
  if (document.fonts) document.fonts.ready.then(measure);
  resize();
  // compile the one program now, not on the first reveal frame
  try { const tmp = rec({ id: '__warm', wing: 'software' }); tmp.mesh.visible = true; await renderer.compileAsync(scene, cam); tmp.mesh.visible = false; } catch (e) {}
  return {
    setCards, measure,
    ready(id) { const it = items.find(x => x.p.id === id); return it ? texFor(it.p, it.m) : Promise.resolve(); },
    reveal(id, dur, delay, from) {
      const m = meshes.get(id); if (!m) return;
      gsap.killTweensOf(m.st);
      if (from != null) { m.st.reveal = from; dirty = 2; }
      if (!dur) { m.st.reveal = 1; dirty = 2; return; }
      gsap.to(m.st, { reveal: 1, duration: dur, delay, ease: 'expo.out', onUpdate: () => { dirty = 1; } });
    },
    hover(id) { const m = meshes.get(id); return m ? m.hov : 0; },
    hold(id, v) { const m = meshes.get(id); if (m) { m.force = v; dirty = 2; } },   // test hook: hold a dissolve at a given progress
    mix(id) { const m = meshes.get(id); return m ? { mix: m.mix, ready: !!m.tex2 } : null; },
    alpha(id, a, k) { const m = meshes.get(id); if (!m) return; m.alphaT = a; m.alphaK = k || 0.0001; if (!k) m.alpha = a; dirty = 2; },
    others(id, a, k) { for (const [i, m] of meshes) if (i !== id) { m.alphaT = a; m.alphaK = k || 0.0001; if (!k) m.alpha = a; } dirty = 2; },
    fadeAll(d) { for (const m of meshes.values()) { m.alphaT = 0; m.alphaK = d / 3; } dirty = 2; },
    pause(v) { paused = v; canvas.classList.toggle('wkg-on', visible && !paused); if (!v) { lastY = scrollY; measure(); } },
    sync(ms) { syncUntil = Math.max(syncUntil, performance.now() + ms); dirty = 2; },
    point(x, y) { mx = x; my = y; },
    get canvas() { return canvas; },
  };
}
function plateCanvas(p, logo) {
  // the same composition as the DOM plate (.wkg-pl), in cqw of a 1280 wide card
  const Wd = 1280, Hd = 800, u = Wd / 100, c = document.createElement('canvas'); c.width = Wd; c.height = Hd;
  const g = c.getContext('2d'), sc = schemeOf(p), f = plateFact(p);
  g.fillStyle = sc.pc; g.fillRect(0, 0, Wd, Hd);
  const wrap = (text, maxW) => { const ls = []; let ln = ''; for (const w of text.split(/\s+/)) { const t = ln ? ln + ' ' + w : w; if (g.measureText(t).width > maxW && ln) { ls.push(ln); ln = w; } else ln = t; } ls.push(ln); return ls; };
  const bx = { y: (f ? 12 : 15.25) * u, h: 32 * u };
  if (logo && logo.canvas) {
    const lw = logo.canvas.width, lh = logo.canvas.height, k = Math.min(60 * u / lw, bx.h / lh), dw = lw * k, dh = lh * k;
    g.imageSmoothingQuality = 'high';
    g.drawImage(logo.canvas, (Wd - dw) / 2, bx.y + (bx.h - dh) / 2, dw, dh);
  } else {
    g.fillStyle = sc.pa; g.font = `500 ${8 * u}px ${FF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = `${-0.05 * 8 * u}px`;
    const ls = wrap(clean(p.name), 84 * u), lh = 8 * u * .95;
    let y = bx.y + bx.h / 2 - (ls.length - 1) * lh / 2;
    for (const l of ls) { g.fillText(l, Wd / 2, y); y += lh; }
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  if (f) {
    g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    const bottom = Hd - 5.5 * u, fs = 1.7 * u, lh = fs * 1.25;
    g.fillStyle = sc.pk; g.font = `500 ${fs}px ${FF}`;
    const ll = wrap(clean(f.label), 40 * u);
    let y = bottom - (ll.length - 1) * lh - 0.32 * fs;
    for (const l of ll) { g.fillText(l, Wd - 5.5 * u, y); y += lh; }
    g.fillStyle = sc.pa; g.font = `500 ${7 * u}px ${FF}`;
    if ('letterSpacing' in g) g.letterSpacing = `${-0.05 * 7 * u}px`;
    g.fillText(clean(f.value), Wd - 5.5 * u, bottom - ll.length * lh - 1.2 * u - 0.12 * 7 * u);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  return c;
}

/* ---------- the project page: one horizontal run ---------- */
function rise(node, text) {
  // a title split into words, each in a mask with room for descenders, so it can rise without clipping a g or a y
  node.textContent = '';
  const words = text.split(/\s+/);
  words.forEach((w, i) => { const l = el('span', 'wkg-ln'); l.appendChild(el('span', '', w)); node.appendChild(l); if (i < words.length - 1) node.appendChild(document.createTextNode(' ')); });
  node.setAttribute('aria-label', text);
}
function heroOf(p) {
  const hero = el('section', 'wkg-pn wkg-hero');
  const hm = el('div', 'wkg-hm');
  if (p._run && p._run.heroDeco) p._run.heroDeco(hm);
  if (isText(p)) {
    hero.classList.add('wkg-txt'); paint(hero, p);
    const tm = el('div', 'wkg-tm'); tm.append(el('span', '', clean(kindOf(p))));
    const bd = el('div');
    const lp = logoOf(p);
    if (lp) { const lg = el('img', 'wkg-tlogo'); lg.alt = ''; lg.hidden = true; bd.appendChild(lg); lp.then(l => { if (l) { if (l.canvas.width / l.canvas.height > 1.6) lg.classList.add('wkg-tlw'); lg.src = l.url; lg.alt = clean(p.name) + ' logo'; lg.hidden = false; } }); }
    const h1 = el('h1'); rise(h1, clean(p.name));
    const tg = el('div', 'wkg-tg'), q = el('p', 'wkg-tq'), f = keyFact(p);
    q.textContent = clean(p.one_line);
    tg.appendChild(q);
    if (f) { const x = el('div', 'wkg-tf'); x.append(el('b', '', clean(f.value)), el('small', '', clean(f.label))); tg.appendChild(x); }
    const go = launchEl(p); if (go) tg.firstChild.after(go);
    bd.append(h1, tg); hero.append(bd);   // no kind line over the title: no kickers
    hero._title = h1;
    return hero;
  }
  const framed = isFramed(p), hmi = el('div', 'wkg-hmi');
  if (framed) hero.classList.add('wkg-hfr');
  if (isVert(p)) {
    hm.classList.add('wkg-tri');
    const vids = videosOf(p);
    const heroV = vids.find(v => v.poster === p.hero) || vids[0];
    const rest = vids.filter(v => v !== heroV);
    const stills = (p.gallery || []).filter(g => g !== p.hero && !vids.some(v => v.poster === g));
    const fill = (x) => x || (stills.length ? { still: stills.shift() } : null);
    const left = fill(rest[0]), right = fill(rest[1]);
    const panes = [];
    [left, { ...(heroV || { still: p.hero }), main: true }, right].forEach(v => {
      if (!v) return;
      const d = el('div'); if (v.main) d.classList.add('wkg-hp');
      if (v.still || v.poster) { const im = el('img'); im.alt = v.main ? altOf(p) : ''; im.decoding = 'async'; im.src = big(v.still || v.poster); d.appendChild(im); }
      if (v.video) { const vd = el('video'); vd.muted = true; vd.loop = true; vd.playsInline = true; vd.autoplay = false; vd.preload = 'auto'; vd.poster = big(v.poster); vd.src = src(v.video); vd.setAttribute('aria-hidden', 'true'); d.appendChild(vd); panes.push(v.video); }
      hm.appendChild(d);
    });
    hero._used = new Set([...panes, ...[left, right].filter(x => x && x.still).map(x => x.still)]);
  } else {
    const lo = el('img'); lo.alt = altOf(p); lo.decoding = 'async'; lo.src = big(p.hero); hmi.appendChild(lo); hm.appendChild(hmi);
    const hn = framed && noteFor(p, p.hero), hc = hn && parseFloat(hn.crop);
    if (hn && hn.focus) lo.style.objectPosition = hn.focus;
    if (hc > 0.3 && hc < 4) hm.style.setProperty('--ar', hc.toFixed(4));
    else if (framed) lo.addEventListener('load', () => {
      // the frame takes the capture's own shape, so nothing of the screenshot is cropped
      const ar = clamp(lo.naturalWidth / lo.naturalHeight || 1.6, 0.56, 2.4);
      hm.style.setProperty('--ar', ar.toFixed(4));
      const pg = hero.closest('.wkg-page'); if (pg && pg._hx) { layoutPage(pg); pg._dirty = true; }
    }, { once: true });
    const vids = videosOf(p);
    if (vids.length && !RM.matches) {
      const vd = el('video'); vd.muted = true; vd.loop = true; vd.playsInline = true; vd.autoplay = false; vd.preload = p._run ? 'none' : 'auto'; vd.className = 'wkg-hi2'; vd.src = src(vids[0].video); vd.setAttribute('aria-hidden', 'true');
      vd.addEventListener('playing', () => vd.classList.add('wkg-ld'), { once: true }); hmi.appendChild(vd);
      hero._used = new Set([vids[0].video]);
    } else if (THUMBABLE.test(p.hero)) {
      // the full size picture, once it is decoded, over the 1280 one the card zoomed in with
      const hi = el('img', 'wkg-hi2'); hi.alt = ''; hi.decoding = 'async'; hi.loading = 'eager';
      hero._hi = () => { hi.src = src(p.hero); (hi.decode ? hi.decode() : Promise.resolve()).then(() => hi.classList.add('wkg-ld'), () => {}); };
      hmi.appendChild(hi);
    }
  }
  const cap = el('div', 'wkg-hcap');
  const h1 = el('h1'); rise(h1, clean(p.name));
  const meta = el('span', '', clean(kindOf(p)));
  if (framed) {
    // Lusion's opener: the title and a short line on the left, the work framed on the right
    cap.append(h1);   // no kind line over the title: no kickers
    const cols = el('div', 'wkg-hcols');
    if (p.one_line) cols.appendChild(el('p', 'wkg-hlede', clean(p.one_line)));
    const dl = infoEl(p); if (dl) cols.appendChild(dl);
    if (cols.children.length) cap.appendChild(cols);
    hero._cols = cols;
    const go = launchEl(p); if (go) cap.appendChild(go);
    hero.append(cap, hm);
  } else { cap.append(h1); const go = launchEl(p); if (go) { go.classList.add('wkg-gol'); cap.appendChild(go); } hero.append(hm, cap); }
  hero._title = h1; hero._meta = null;
  hero._t = hm; hero._s = hm.classList.contains('wkg-tri') ? hm : hmi;
  return hero;
}
const NUM_RE = /^(\d[\d,.]*\s?[KMB]?\+?|\d+\/\d+|\d+\s?(min|sec|hrs?|days?))$/i;
/* website captures sit framed on the ground (no UI of theirs under our controls); photos and films stay full bleed */
const isFramed = (p) => (p.wing === 'software' && !isText(p)) || !!p._run;
/* a number with its unit kept on one line, the unit smaller */
function numEl(v) {
  const b = el('b'), m = v.match(/^(.*?\d)(\s?)(min|sec|hrs?|days?)$/i);
  if (m) { b.append(document.createTextNode(m[1])); b.appendChild(el('small', 'wkg-u', '\u00a0' + m[3])); } else b.textContent = v;
  return b;
}
const INFO = [[KIND_RE], [/^clients?$/i], [/^year$/i], [/^status$/i]];
const CREDIT_RE = /^(role|team|hands on|concepts|covered|in frame)$/i;
const panel = (cls) => { const s = el('section', 'wkg-pn ' + cls); const i = el('div', 'wkg-pi'); s.appendChild(i); s._in = i; return s; };
/* the live link as a real button (Lusion's "Launch project"): the dot grows into a fill that wipes the pill, a drawn
   arrow slides in, it leans toward the pointer and presses in */
function launchEl(p) { const l = linksOf(p)[0]; if (!l) return null; const a = liveBtn(l.url); a.setAttribute('aria-label', `${clean(p.name)}: ${a.getAttribute('aria-label')}`); return a; }   // the read-out names the project; the words on screen stay
/* every external link is this button, never a raw address: "Live project" (or "Open on Instagram") with a small
   "Click to open" ("Tap to open" on touch) under it; new tab, noopener */
function liveBtn(url, own) {
  const a = el('a', 'wkg-go'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
  const label = own ? String(own).replace(/[<>&"]/g, '') : /instagram\.com/i.test(url) ? 'Open on Instagram' : 'Live project';
  a.setAttribute('aria-label', `${label}, ${HOVER.matches ? 'Click' : 'Tap'} to open: ${domain(url)}, opens in a new tab`);
  a.innerHTML = `<span class="wkg-gm"><span class="wkg-gf"></span><i></i><span class="wkg-gt"><span>${label}</span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg></span>`;
  const gm = a.firstChild, qx = gsap.quickTo(gm, 'x', { duration: 0.5, ease: 'power3.out' }), qy = gsap.quickTo(gm, 'y', { duration: 0.5, ease: 'power3.out' });
  a.addEventListener('pointermove', (e) => { if (!HOVER.matches || RM.matches) return; const r = a.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.18); qy((e.clientY - r.top - r.height / 2) * 0.3); });
  a.addEventListener('pointerleave', () => { qx(0); qy(0); });
  a.addEventListener('pointerdown', (e) => e.stopPropagation());
  return a;
}
function linksEl(ls) { const l = el('div', 'wkg-links wkg-lbs'); ls.forEach(x => l.appendChild(liveBtn(x.url))); return l; }
/* Project brief, from ../content/<wing>/briefs.json: { client, brief, asked_for: [], delivered: [] }, all optional */
let BRIEFS = {};
function briefOf(p) {
  const b = BRIEFS[p.id]; if (!b || typeof b !== 'object') return null;
  const text = (Array.isArray(b.brief) ? b.brief : typeof b.brief === 'string' ? b.brief.split(/\n\s*\n/) : []).map(clean).map(t => t.trim()).filter(Boolean);
  const list = (x) => (Array.isArray(x) ? x : []).map(clean).map(t => t.trim()).filter(Boolean);
  const asked = list(b.asked_for), done = list(b.delivered), client = typeof b.client === 'string' ? clean(b.client).trim() : '';
  if (!text.length && !asked.length && !done.length) return null;
  const s = panel('wkg-bf'), i = s._in;
  i.appendChild(el('h2', 'wkg-h2', 'Project brief'));
  if (client) i.appendChild(el('small', '', client));
  text.forEach(t => i.appendChild(el('p', 'wkg-lede', t)));
  if (asked.length || done.length) {
    const g = el('div', 'wkg-bfl');
    [['What they asked for', asked], ['What I delivered', done]].forEach(([h, xs]) => { if (!xs.length) return; const d = el('div'); d.appendChild(el('h3', '', h)); const ul = el('ul'); xs.forEach(x => ul.appendChild(el('li', '', x))); d.appendChild(ul); g.appendChild(d); });
    i.appendChild(g);
  }
  return s;
}
function infoEl(p) {
  const dl = el('dl');
  // the kind is a plain row now (no kicker over the title); "Status: Live" goes when the Live project button says it
  const live = linksOf(p).length > 0;
  for (const [re] of INFO) { const f = factOf(p, re); if (!f || (live && /^status$/i.test(f.label) && /^live$/i.test(String(f.value).trim()))) continue; const d = el('div'); d.append(el('dt', '', clean(f.label)), el('dd', '', clean(f.value))); dl.appendChild(d); }
  if (p.year && !factOf(p, /^year$/i)) { const d = el('div'); d.append(el('dt', '', 'Year'), el('dd', '', clean(p.year))); dl.appendChild(d); }
  return dl.children.length ? dl : null;
}
function introOf(p) {
  const s = panel('wkg-intro'), b = s._in;
  if (!isText(p) && !isFramed(p) && (p.one_line || !p._run)) b.appendChild(el('p', 'wkg-lede', clean(p.one_line)));   // text-only and framed heroes already set it
  if (p._run && p.one_line) b.appendChild(el('p', 'wkg-lede mr-phl', clean(p.one_line)));   // phones: the film fills the opener, so its line comes here
  const dl = el('dl', 'wkg-info' + (isFramed(p) ? ' wkg-info-i' : ''));
  for (const [re] of INFO) { const f = factOf(p, re); if (!f) continue; const d = el('div'); d.append(el('dt', 'wkg-lab', clean(f.label)), el('dd', '', clean(f.value))); dl.appendChild(d); }
  if (p.year && !factOf(p, /^year$/i)) { const d = el('div'); d.append(el('dt', 'wkg-lab', 'Year'), el('dd', '', clean(p.year))); dl.appendChild(d); }
  if (dl.children.length) b.appendChild(dl);
  const st = el('div', 'wkg-stats');
  for (const x of statsOf(p)) { if (x.v == null && !DRAFT) continue; const d = el('div', 'wkg-stat'); if (x.v == null) { d.classList.add('wkg-tbc'); d.append(el('b', '', '000'), el('small', '', `${x.label}, number to come`)); } else d.append(el('b', '', x.v), el('small', '', x.label)); st.appendChild(d); }
  if (st.children.length) b.appendChild(st);
  const ls = linksOf(p);
  if (ls.length && !partsOf(p).length) b.appendChild(linksEl(ls));
  // framed on a wide screen: the info and the button are in the hero (and the button again at the end), so a panel with
  // nothing else in it is left out there; phones keep it
  if (isFramed(p) && ![...b.children].some(c => !c.classList.contains('wkg-info-i') && !c.classList.contains('wkg-lbs'))) s.classList.add('wkg-ionly');
  return s;
}
/* one project, several channels: a panel each, with its name, its line, its link (or a quiet note) and its own images */
function channelsOf(p) {
  const parts = partsOf(p); if (!parts.length) return [];
  return parts.map((x, i) => {
    const s = el('section', 'wkg-pn wkg-ch');
    const l = el('div', 'wkg-chl');
    const gal = (Array.isArray(x.gallery) ? x.gallery : []).filter(Boolean);
    if (i === 0) l.appendChild(el('h2', 'wkg-h2', `${WORDS[parts.length] || parts.length} channel${parts.length === 1 ? '' : 's'}`));
    l.append(el('h3', '', clean(x.name)));   // heading only, no 01/02
    if (gal.length && x.one_line) l.appendChild(el('p', '', clean(x.one_line)));
    if (typeof x.link === 'string' && /^https?:\/\//i.test(x.link)) {
      const w = linksEl([{ url: x.link }]); w.firstChild.setAttribute('aria-label', `${clean(x.name)}: ${domain(x.link)}, opens in a new tab`); l.appendChild(w);
    } else l.appendChild(el('span', 'wkg-soon', 'Link to come'));
    s.appendChild(l);
    const ns = notesOf(p);
    // curated: only the channel pictures the notes keep, cut and captioned as they say
    const keep = ns ? gal.filter(g => ns.some(n => n.src === g)) : gal;
    if (keep.length) s._items = keep.map(g => { const n = noteFor(p, g); return n ? noteItem(n) : { still: g }; });
    else if (x.one_line) s.appendChild(el('p', 'wkg-chq', clean(x.one_line)));
    return s;
  });
}
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
function aboutOf(p) {
  const w = (p.writeup || []).map(clean).filter(Boolean); if (!w.length) return null;
  const s = panel('wkg-about'), b = s._in;
  b.appendChild(el('h2', 'wkg-h2', 'About'));
  const d = el('div', 'wkg-cols'); w.forEach(t => d.appendChild(el('p', '', t))); b.appendChild(d);
  return s;
}
function factsOf(p) {
  const used = new Set(statsOf(p).map(x => x.from).filter(Boolean));
  if (isText(p)) { const k = keyFact(p); if (k) used.add(k); }
  const rest = (p.facts || []).filter(f => !used.has(f) && !INFO.some(([re]) => re.test(f.label)) && !CREDIT_RE.test(f.label));
  if (!rest.length) return null;
  const s = panel('wkg-factp'), g = el('div', 'wkg-facts'); g.style.setProperty('--fr', Math.min(3, Math.ceil(rest.length / 2)));
  rest.forEach(f => { const v = clean(f.value), num = NUM_RE.test(v.replace(/\u00a0/g, ' ')); const d = el('div', 'wkg-fact' + (num ? ' wkg-num' : '')); d.append(el('span', 'wkg-lab', clean(f.label)), num ? numEl(v) : el('b', '', v)); g.appendChild(d); });
  s._in.append(el('h2', 'wkg-h2', 'Facts'), g); return s;
}
function creditsOf(p) {
  const rows = [];
  for (const c of Array.isArray(p.credits) ? p.credits : []) if (c && c.role && c.name) rows.push([clean(c.role), clean(c.name)]);
  for (const f of p.facts || []) if (CREDIT_RE.test(f.label)) rows.push([clean(f.label), clean(f.value)]);
  if (!rows.length) return null;
  const s = panel('wkg-credits');
  const dl = el('dl'); dl.style.setProperty('--cr', Math.min(4, rows.length)); rows.forEach(([a, b]) => { const d = el('div'); d.append(el('dt', '', a), el('dd', '', b)); dl.appendChild(d); });
  s._in.append(el('h2', 'wkg-h2', 'Credits'), dl);
  return s;
}
/* Behind the scenes, from ../content/<wing>/bts.json when it exists: confirmed stats, facts, a dated timeline, the
   lesson, and the iterations as a strip of pictures with captions and dates. No entry, no panel. */
let BTS = {};
function btsOf(p) {
  const b = BTS[p.id]; if (!b || typeof b !== 'object') return null;
  const stats = (Array.isArray(b.stats) ? b.stats : []).filter(x => x && x.confirmed === true && x.value != null && x.label);
  const stack = (Array.isArray(b.stack) ? b.stack : []).filter(x => x && x.group && Array.isArray(x.items) && x.items.length);
  const facts = (Array.isArray(b.facts) ? b.facts : []).filter(x => x && x.label && x.value != null && !(stack.length && /^stack$/i.test(x.label)));
  const tl = (Array.isArray(b.timeline) ? b.timeline : []).filter(x => x && x.title);
  const its = (Array.isArray(b.iterations) ? b.iterations : []).filter(x => x && typeof x.src === 'string' && x.src);
  const lesson = typeof b.lesson === 'string' ? clean(b.lesson).trim() : '';
  if (!stats.length && !facts.length && !tl.length && !its.length && !lesson && !stack.length) return null;
  const s = panel('wkg-bts'), i = s._in;
  // columns side by side on the run: the story (title, lesson, timeline), the numbers, the facts, the iterations
  const col = (cls) => { const c = el('div', 'wkg-bcol ' + cls); i.appendChild(c); return c; };
  const a = col('wkg-bca');
  a.appendChild(el('h2', 'wkg-h2', 'Behind the scenes'));
  if (lesson) a.appendChild(el('p', 'wkg-lede wkg-lesson', lesson));
  if (stats.length) { const st = el('div', 'wkg-stats'); stats.forEach(x => { const d = el('div', 'wkg-stat'); d.append(el('b', '', clean(fmt(x.value) || x.value)), el('small', '', clean(x.label))); st.appendChild(d); }); col('wkg-bcb').appendChild(st); }
  if (facts.length) { const g = el('div', 'wkg-facts'); g.style.setProperty('--fr', Math.min(3, Math.ceil(facts.length / 2))); facts.forEach(f => { const v = clean(f.value).replace(/\s*\(https?:\/\/[^)\s]+\)/g, ''), d = el('div', 'wkg-fact'); d.append(el('span', 'wkg-lab', clean(f.label)), el('b', '', v)); if (typeof f.url === 'string' && /^https:\/\//.test(f.url)) { const go = liveBtn(f.url, f.link_label || 'Visit'); go.classList.add('wkg-fgo'); d.appendChild(go); } g.appendChild(d); }); col('wkg-bcc').appendChild(g); }
  // the stack as chips, grouped by job, each tool with its mark (simple-icons, saved under content/stack-icons)
  if (stack.length) {
    const c = col('wkg-bcs'); c.appendChild(el('span', 'wkg-lab', 'Built with'));
    stack.forEach(g => {
      const gr = el('div', 'wkg-sg'); gr.appendChild(el('span', 'wkg-sgl', clean(g.group)));
      const ul = el('ul', 'wkg-chips');
      g.items.forEach(t => {
        if (!t || !t.name) return;
        const li = el('li', 'wkg-chip');
        if (t.icon && /^[a-z0-9]+$/.test(t.icon)) { const ic = el('i'); ic.setAttribute('aria-hidden', 'true'); const u = `url("${src('stack-icons/' + t.icon + '.svg')}")`; ic.style.webkitMaskImage = u; ic.style.maskImage = u; li.appendChild(ic); }
        li.appendChild(el('span', '', clean(t.name))); ul.appendChild(li);
      });
      gr.appendChild(ul); c.appendChild(gr);
    });
  }
  s._rail = (tl.length || its.length) ? railOf(tl, its) : null;
  return s;
}
/* the build as one rail you travel along: a line that draws itself, a stop per dated moment, and the versions hung off
   the line at the day they were made. Dates read as "13 Jun", never 2026-06-13. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function railDate(s) {
  s = clean(String(s || '')).replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const r = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+to\s+(\d{4})-(\d{2})-(\d{2})$/);
  if (r) return { d: `${+r[3]} to ${+r[6]}`, m: `${MON[+r[5] - 1]} ${r[4]}`, k: `${r[1]}-${r[2]}-${r[3]}` };
  const a = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (a) return { d: a[3] ? String(+a[3]) : '', m: `${MON[+a[2] - 1]} ${a[1]}`, k: a[3] ? `${a[1]}-${a[2]}-${a[3]}` : `${a[1]}-${a[2]}` };
  return { d: '', m: s, k: '' };
}
function railOf(tl, its) {
  const stops = tl.map(x => ({ t: clean(x.title), dt: railDate(x.date) }));
  for (const x of its) {
    const dt = railDate(x.date), it = { pic: { still: x.src, caption: x.caption ? clean(x.caption) : '', bts: true }, t: x.caption ? clean(x.caption) : '', dt };
    let at = stops.length;
    if (dt.k) { at = 0; stops.forEach((q, n) => { if (q.dt.k && q.dt.k <= dt.k) at = n + 1; }); }
    stops.splice(at, 0, it);
  }
  const s = panel('wkg-railp'), i = s._in;
  i.appendChild(el('h2', 'wkg-h2', 'How it got built'));
  const ol = el('ol', 'wkg-stops'); let lastM = '', tn = 0, prevTxt = false;
  stops.forEach((q, n) => {
    const li = el('li', 'wkg-stop' + (q.pic ? ' wkg-spic' : '')); li.style.setProperty('--i', n);
    const top = el('div', 'wkg-sup'); li.appendChild(top);
    if (q.pic) li._pic = q.pic;
    li.appendChild(el('i', 'wkg-dot'));
    const lo = el('div', 'wkg-slo'), dd = el('div', 'wkg-sdate');
    if (q.dt.d) dd.appendChild(el('b', '', q.dt.d));
    const mo = q.dt.m && q.dt.m !== lastM ? q.dt.m : (q.dt.d ? q.dt.m.split(' ')[0] : '');
    if (mo) dd.appendChild(el('span', '', mo));
    if (q.dt.m) lastM = q.dt.m;
    if (dd.childNodes.length) lo.appendChild(dd);
    if (q.t) lo.appendChild(el('p', 'wkg-stxt', q.t));
    // text stops zigzag above and below the line; two in a row tuck into each other
    if (!q.pic) { if (tn++ % 2) { li.classList.add('wkg-sab'); top.appendChild(lo); } else li.appendChild(lo); if (prevTxt) li.classList.add('wkg-stuck'); prevTxt = true; }
    else { li.appendChild(lo); prevTxt = false; }
    ol.appendChild(li);
  });
  i.appendChild(ol);
  s._stops = ol;
  return s;
}
/* every image and loop the project has, minus what the hero already shows */
/* the curated pictures: ../content/<wing>/media-notes.json, { "<id>": [{ src, caption, focus, crop }] }. crop is an
   aspect ratio to cut the picture to (website captures with empty margins), focus its object-position. An entry for
   the hero's own src only sets how the hero is cut. No entry: the first four gallery pictures, no captions. */
let NOTES = {};
const notesOf = (p) => (Array.isArray(NOTES[p.id]) ? NOTES[p.id].filter(n => n && typeof n.src === 'string' && n.src) : null);
const noteFor = (p, srcp) => { const ns = notesOf(p); return (ns && ns.find(n => n.src === srcp)) || null; };
const noteItem = (n) => {
  const it = /\.(mp4|webm|mov)$/i.test(n.src) ? { video: n.src, poster: n.poster || '' } : { still: n.src };
  if (n.caption) it.caption = clean(n.caption);
  if (typeof n.focus === 'string') it.focus = n.focus;
  const c = parseFloat(n.crop); if (c > 0.3 && c < 4) { it.crop = c; it.ar = c; }
  return it;
};
function mediaItems(p, used) {
  if (isText(p)) return [];
  const vids = videosOf(p), items = [], ns = notesOf(p);
  const inParts = new Set(partsOf(p).flatMap(x => Array.isArray(x.gallery) ? x.gallery : []));
  const shootOf = (g) => (g.match(/\/([a-z0-9-]+?)-\d+\.jpg$/i) || [])[1];
  if (ns) {
    for (const n of ns) { if (n.src === p.hero || inParts.has(n.src) || (used && used.has(n.src))) continue; const it = noteItem(n); it.shoot = it.still ? shootOf(it.still) : undefined; items.push(it); }
  } else {
    const all = [...(isVert(p) || vids.length ? [p.hero] : []), ...(p.gallery || [])].filter((g, i, a) => g && a.indexOf(g) === i && !inParts.has(g));
    for (const g of all) {
      if (items.length >= 4) break;
      if (used && used.has(g)) continue;
      if (/-poster\.(jpe?g|png)$/i.test(g)) continue;
      items.push({ still: g, shoot: shootOf(g) });
    }
  }
  if (ns && ns.some(n => /\.(mp4|webm|mov)$/i.test(n.src))) return items;
  for (const v of vids) if (!(used && used.has(v.video))) {
    const at = items.findIndex(x => x.shoot && x.shoot === v.shoot);
    const it = { video: v.video, poster: v.poster, shoot: v.shoot };
    if (at >= 0) items.splice(at + 1, 0, it); else items.push(it);
  }
  return items;
}
/* aspect ratios from the small thumbs, so frames can be sized before the full pictures arrive */
function ratios(items, vert) {
  return Promise.all(items.map(it => new Promise(res => {
    if (it.ar) return res();
    if (it.video) { it.ar = vert ? 9 / 16 : 16 / 10; return res(); }
    const im = new Image(); const t = setTimeout(() => { it.ar = vert ? 9 / 16 : 16 / 10; res(); }, 2500);
    im.onload = () => { clearTimeout(t); it.ar = im.naturalWidth / im.naturalHeight || 1.6; res(); };
    im.onerror = () => { if (!im._fb) { im._fb = 1; im.src = src(it.still); } else { clearTimeout(t); it.ar = 16 / 10; res(); } };
    im.src = THUMBABLE.test(it.still) ? src(thumb(it.still, 640)) : src(it.still);
  })));
}
function frameEl(it) {
  const f = el('div', 'wkg-fr'), m = el('div', 'wkg-fm'); f._ar = it.ar || 1.6; f.appendChild(m);
  f._src = it.video ? it.poster : it.still;
  if (it.video) {
    // the poster sits under the loop, and the loop fades in over it once it plays
    if (it.poster) { const pi = el('img'); pi.alt = ''; pi.decoding = 'async'; pi.loading = 'lazy'; setImg(pi, it.poster, '(max-width:760px) 92vw, 70vw'); m.appendChild(pi); }
    const v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.dataset.src = src(it.video); v.setAttribute('aria-hidden', 'true');
    v.addEventListener('playing', () => v.classList.add('wkg-ld'), { once: true }); m.appendChild(v);
  } else { const im = el('img'); im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; setImg(im, it.still, '(max-width:760px) 92vw, 70vw'); m.appendChild(im); }
  if (it.focus) m.querySelectorAll('img,video').forEach(x => { x.style.objectPosition = it.focus; });
  if (it.deco) it.deco(f);
  if (it.bts && (it.caption || it.date)) { const c = el('div', 'wkg-cap2'); if (it.date) c.appendChild(el('span', 'wkg-lab', clean(it.date))); if (it.caption) c.appendChild(el('span', '', clean(it.caption))); f._cap = c; f._capLen = (it.caption || '').length; }
  return f;
}
/* media panels: a landscape frame alone; portraits two or three together (one shoot at a time on vertical work) */
function mediaPanels(p, items) {
  const out = [], q = items.slice(), vert = isVert(p), phone = isPhone();
  const portrait = (x) => x.ar < 0.86;
  let shoot = null;
  let side = 0, pic = 0;
  while (q.length) {
    const a = q[0];
    if (a.caption) {
      const s = el('section', 'wkg-pn wkg-media wkg-cp' + (side++ % 2 ? ' wkg-cpr' : ''));
      s.append(frameEl(q.shift()), el('p', 'wkg-mcap', a.caption));
      out.push(s); continue;
    }
    let n = 1;
    if (portrait(a) && !phone) { while (n < q.length && n < 3 && portrait(q[n]) && (!vert || q[n].shoot === a.shoot)) n++; }
    const group = q.splice(0, n);
    const s = el('section', 'wkg-pn wkg-media');
    if (vert && a.shoot && a.shoot !== shoot) { shoot = a.shoot; s.appendChild(el('p', 'wkg-shoot', pretty(a.shoot))); }
    group.forEach(x => { const fr = frameEl(x), im = fr.querySelector('img'); if (im) im.alt = `${altOf(p)}, picture ${++pic}`; s.appendChild(fr); });   // a captioned picture keeps alt="": its caption is beside it
    out.push(s);
  }
  return out;
}
/* screens withheld (client data): where the pictures would be, a redacted file with a stamped seal, and the project
   explained in plain steps instead. Data: bts.json "<id>".classified = { title, steps[], note }. */
const SEAL_SVG = `<svg viewBox="0 0 240 240" aria-hidden="true"><defs><filter id="wkg-ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter><path id="wkg-ring" d="M120 120 m-86 0 a86 86 0 1 1 172 0 a86 86 0 1 1 -172 0"/></defs><g filter="url(#wkg-ink)" fill="none" stroke="currentColor"><circle cx="120" cy="120" r="112" stroke-width="7"/><circle cx="120" cy="120" r="100" stroke-width="2"/><circle cx="120" cy="120" r="68" stroke-width="2"/><g fill="currentColor" stroke="none"><text font-size="17" font-weight="700" letter-spacing="3.2"><textPath href="#wkg-ring" startOffset="0">CLIENT DATA ★ NOT FOR PUBLIC VIEW ★ CLIENT DATA ★</textPath></text><rect x="18" y="100" width="204" height="42" rx="3"/></g><text x="120" y="130" text-anchor="middle" font-size="27" font-weight="800" letter-spacing="2.5" fill="var(--wkg-sealbg)" stroke="none">CLASSIFIED</text><g fill="currentColor" stroke="none" font-weight="700" text-anchor="middle"><text x="120" y="88" font-size="15" letter-spacing="3">TOP</text><text x="120" y="168" font-size="15" letter-spacing="3">SECRET</text></g></g></svg>`;
function classifiedOf(p) {
  if (!p.screens_withheld) return null;
  const c = (BTS[p.id] && BTS[p.id].classified) || {};
  const steps = (Array.isArray(c.steps) ? c.steps : []).filter(x => typeof x === 'string' && x.trim());
  const s = panel('wkg-cls'), i = s._in;
  if (steps.length) {
    const a = el('div', 'wkg-clt'); a.appendChild(el('h2', 'wkg-h2', clean(c.title || 'How it works')));
    const ol = el('ol', 'wkg-cls-steps'); steps.forEach(t => ol.appendChild(el('li', '', clean(t)))); a.appendChild(ol); i.appendChild(a);
  }
  const fig = el('figure', 'wkg-file'), doc = el('div', 'wkg-doc');
  doc.setAttribute('aria-hidden', 'true');
  [[38, 1], [0, 0], [92, 0], [84, 0], [96, 0], [61, 0], [0, 0], [88, 0], [72, 0], [94, 0], [45, 0]].forEach(([w, h]) => { const r = el('i'); if (!w) r.className = 'wkg-gap'; else { r.style.width = w + '%'; if (h) r.className = 'wkg-hd'; } doc.appendChild(r); });
  const seal = el('div', 'wkg-seal'); seal.innerHTML = SEAL_SVG; seal.setAttribute('role', 'img'); seal.setAttribute('aria-label', 'Classified: screens withheld');
  doc.appendChild(seal); fig.appendChild(doc);
  if (c.note) fig.appendChild(el('figcaption', 'wkg-mcap', clean(c.note)));
  i.appendChild(fig);
  return s;
}
/* v1 against the final, one wipe per screen: both pictures in one frame, a handle between them that follows the
   pointer (drag on touch, arrows on the keyboard). Data: bts.json "<id>".compare = [{ screen, v1:{src,date}, final:{src,date} }] */
function compareOf(p) {
  const b = BTS[p.id]; const cs = (b && Array.isArray(b.compare) ? b.compare : []).filter(c => c && c.v1 && c.final && c.v1.src && c.final.src);
  if (!cs.length) return null;
  const s = panel('wkg-cmp'), i = s._in;
  const hd = el('div', 'wkg-cmph'); hd.append(el('h2', 'wkg-h2', 'Before and after'), el('p', 'wkg-cmpq', HOVER.matches ? 'Move across a picture to compare' : 'Drag the handle to compare'));
  i.appendChild(hd);
  const row = el('div', 'wkg-bas'); i.appendChild(row);
  s._ba = cs.map(c => {
    const [la, lb] = Array.isArray(c.labels) && c.labels.length === 2 ? c.labels.map(clean) : ['v1', 'Final'];
    const fig = el('figure', 'wkg-ba'), fr = el('div', 'wkg-bav');
    const a = el('img'), v = el('img'); a.alt = `${clean(c.screen || '')}, ${lb.toLowerCase()}`; v.alt = `${clean(c.screen || '')}, ${la.toLowerCase()}`;
    a.decoding = v.decoding = 'async'; a.loading = v.loading = 'lazy'; a.draggable = v.draggable = false;
    a.src = src(c.final.src); v.src = src(c.v1.src);
    const top = el('div', 'wkg-bv1'); top.appendChild(v);
    const h = el('div', 'wkg-bah'); h.setAttribute('role', 'slider'); h.tabIndex = 0; h.setAttribute('aria-label', `Compare ${la.toLowerCase()} and ${lb.toLowerCase()}: ${clean(c.screen || '')}`); h.setAttribute('aria-valuemin', '0'); h.setAttribute('aria-valuemax', '100');
    h.innerHTML = '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 3 12l6 6M15 6l6 6-6 6"/></svg></span>';
    fr.append(a, top, h, el('b', 'wkg-btag wkg-btl', la), el('b', 'wkg-btag wkg-btr', lb));
    const cap = el('figcaption'); cap.append(el('span', 'wkg-bs', clean(c.screen || '')), el('span', 'wkg-bd', `${clean(c.v1.date || 'v1')} to ${clean(c.final.date || 'final')}`));
    fig.append(fr, cap); row.appendChild(fig);
    let pct = 50; const set = (x) => { pct = clamp(x, 0, 100); fr.style.setProperty('--p', pct + '%'); h.setAttribute('aria-valuenow', String(Math.round(pct))); };
    set(50);
    const at = (e) => { const r = fr.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    // a finger: an up-and-down drag is the page's scroll (it drives the run), so the split only follows once the drag is
    // clearly sideways; a tap still moves it there (PHONE-AUDIT #11). A mouse grabs at once, as before
    let drag = false, tdown = false, tch = false, sx = 0, sy = 0;
    fr.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); tch = e.pointerType !== 'mouse'; sx = e.clientX; sy = e.clientY;
      if (tch) { tdown = true; return; }
      drag = true; fr.setPointerCapture(e.pointerId); at(e); fr.classList.add('wkg-bdr');
    });
    fr.addEventListener('pointermove', (e) => {
      if (tch && tdown && !drag) {
        const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
        if (dx > 8 && dx > dy) { drag = true; try { fr.setPointerCapture(e.pointerId); } catch (_) {} fr.classList.add('wkg-bdr'); }
        else if (dy > 8) tdown = false;
      }
      if (drag || (HOVER.matches && e.pointerType === 'mouse')) at(e);
    });
    fr.addEventListener('pointerup', (e) => { if (tch && tdown && !drag) at(e); });
    const up = () => { drag = false; tdown = false; fr.classList.remove('wkg-bdr'); };
    fr.addEventListener('pointerup', up); fr.addEventListener('pointercancel', up);
    h.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); set(pct + (e.key === 'ArrowLeft' ? -5 : 5)); } });
    fig._fr = fr; fig._set = set; fig._ar = 1.6; fig._src = c.final.src;
    return fig;
  });
  // the first time the row comes into view, each wipe sweeps once so it reads as something to play with
  if (!RM.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => { en.forEach(x => { if (!x.isIntersecting) return; io.unobserve(x.target); const f = x.target, o = { v: 88 }; gsap.to(o, { v: 50, duration: 1.5, ease: 'power3.inOut', delay: 0.25 + (s._ba.indexOf(f) * 0.15), onStart: () => f._set(88), onUpdate: () => f._set(o.v) }); }); }, { threshold: 0.5 });
    s._ba.forEach(f => io.observe(f));
  }
  return s;
}
function nextOf(p) {
  // software runs through the software list only; after the last one, Next hands over to the Media tab
  const SWL = DATA.software, si = p.wing === 'software' ? SWL.indexOf(p) : -1;
  if (si === SWL.length - 1 && !p._run) return toMediaOf();
  const i = ALL.indexOf(p); const nx = p._run ? p._run.next() : si >= 0 ? SWL[si + 1] : ALL[(i + 1) % ALL.length];
  const nxWord = p._run ? p._run.nextWord : 'Next project';
  const a = el('div', 'wkg-pn wkg-next'); a.setAttribute('role', 'link'); a.tabIndex = 0;   // a div: role=link is not allowed on a section
  a.setAttribute('aria-label', `${nxWord}: ${clean(nx.name)}`);
  const t = el('div', 'wkg-nx'); t.append(el('span', 'wkg-nl', nxWord), el('span', 'wkg-nt', clean(nx.name)), el('span', 'wkg-nk', clean(nx._run ? nx._run.line : cardKind(nx))));
  const cue = el('span', 'wkg-ncue'); cue.setAttribute('aria-hidden', 'true');
  cue.append(el('span', '', 'Scroll to continue'), el('i')); cue.lastChild.appendChild(el('b'));
  t.appendChild(cue);
  const m = el('div', 'wkg-nm');
  if (nx._run && nx._run.mark) m.appendChild(nx._run.mark());   // a Media client hands over with its mark, never a video still
  else if (isText(nx)) m.appendChild(plateEl(nx));
  else { const im = el('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; setImg(im, nx.hero, '(max-width:760px) 92vw, 46vw'); m.appendChild(im); }
  a.append(t, m);
  const open = () => { if (PG.dragged) return; go(nx.id, m, true); };
  a._open = open; a._cue = cue;
  a.addEventListener('click', open);
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  a.addEventListener('pointerenter', () => prefetch(nx));
  return a;
}
/* the last software page: Next is the Media tab itself, set in type on the media ground */
function toMediaOf() {
  const a = el('div', 'wkg-pn wkg-next'); a.setAttribute('role', 'link'); a.tabIndex = 0;
  a.setAttribute('aria-label', 'Next: Media');
  const t = el('div', 'wkg-nx'); t.append(el('span', 'wkg-nl', 'Next'), el('span', 'wkg-nt', 'Media')); if (WING.media.sub) t.appendChild(el('span', 'wkg-nk', WING.media.sub));
  const cue = el('span', 'wkg-ncue'); cue.setAttribute('aria-hidden', 'true');
  cue.append(el('span', '', 'Scroll to continue'), el('i')); cue.lastChild.appendChild(el('b'));
  t.appendChild(cue);
  const m = el('div', 'wkg-nm'); m.style.background = WING.media.ground; m.style.display = 'grid'; m.style.placeItems = 'center';
  const w = el('span', '', 'Media'); w.style.cssText = `font:500 clamp(64px,11vw,200px)/1 ${FF};letter-spacing:-.045em;color:${INK}`; m.appendChild(w);
  a.append(t, m);
  const open = () => {
    if (PG.dragged) return;
    close();
    // once the page has gone, the listing switches to Media and the window comes to the top of the work
    const after = () => { if (openId || busy) return requestAnimationFrame(after);
      setTab('media'); const y = (document.getElementById('work')?.getBoundingClientRect().top || 0) + scrollY;
      if (KP.lenis) KP.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
    requestAnimationFrame(after);
  };
  a._open = open; a._cue = cue;
  a.addEventListener('click', open);
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  return a;
}
/* keyboard inside a page: a control that takes focus off screen is brought into view (the run moves by transform, so the
   browser cannot do it), and the browser's own focus scroll of the clipped track is undone */
function wirePage(page) {
  page.addEventListener('focusin', (e) => {
    const n = e.target, sc = page._sc, hx = page._hx;
    if (!page._live || !page._track.contains(n)) return;
    if (!hx.native) { if (sc.scrollLeft) sc.scrollLeft = 0; if (sc.scrollTop && !page._v) sc.scrollTop = 0; }
    else if (hx.pin && sc.scrollLeft) sc.scrollLeft = 0;
    // a column still waiting for its reveal is on screen but not yet drawn: bring it in, so the ring has something to sit on
    if (n.matches(':focus-visible') && !page._v) { const col = n.closest('.mr-col'); revealIn(page, n, !!(col && page.classList.contains('wkg-fx') && !col.classList.contains('mr-rv'))); }
  });
}
/* a closed page lets go of everything that could keep it (and its hundreds of listeners) alive */
function dropPage(page) {
  if (!page || page._dropped) return; page._dropped = true; page._live = false;
  page._io && page._io.disconnect(); page._io = null;
  page._ro && page._ro.disconnect(); page._ro = null;
  page._back && page._back._off && page._back._off();
  page.querySelectorAll('video').forEach(v => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} });
  // every tween on the page or inside it, paused ones too (a quickTo waits paused on the global timeline and held the whole page)
  try { const inside = (x) => x && x.nodeType === 1 && (x === page || page.contains(x)); gsap.globalTimeline.getChildren(true, true, true).forEach(t => { if (t.targets && t.targets().some(inside)) t.kill(); }); } catch (e) {}
  if (reels && reels.forget) reels.forget(page);
  page.remove();
}
/* while a page is open, what is behind it cannot take focus or be read out; Contact stays, it sits above the page */
function behind(on) {
  for (const n of [document.getElementById('hero'), document.getElementById('numbers'), document.getElementById('signwall'), ui.w]) if (n) n.inert = on;
}
function buildPage(p) {
  const page = el('div', 'wkg-page');
  page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', clean(p.name));
  page.setAttribute('data-lenis-prevent', '');
  page.style.setProperty('--wkg-pg', WING[p.wing].ground); page.style.setProperty('--wkg-slot', WING[p.wing].slot);
  if (isFramed(p)) page.classList.add('wkg-hfrp');
  if (p.wing === 'software') page.classList.add('wkg-sw');   // screenshots: show every edge (logos sit in the corners)
  if (isText(p)) { page.classList.add('wkg-tx'); paint(page, p); if (isDark(schemeOf(p).pc)) page.classList.add('wkg-gd'); }
  if (VMODE) { page.classList.add('wkg-vm'); page._v = true; }
  if (!RM.matches) page.classList.add('wkg-fx');
  const bg = el('div', 'wkg-bg'); bg.append(el('i'), el('i'));
  const sc = el('div', 'wkg-sc'), track = el('div', 'wkg-track');
  const hero = heroOf(p);
  track.appendChild(hero);
  // the hero's line breaks follow its column: split again whenever the lede's width changes (fonts, the picture's ratio)
  const ld = hero.querySelector('.wkg-hlede');
  if (ld && window.ResizeObserver) { page._ro = new ResizeObserver(([e]) => { const w = e.contentRect.width; if (w && ld._lines && Math.abs(w - (ld._sw || 0)) > 1) splitLines([ld], !ld._shown && page.classList.contains('wkg-fx')); }); page._ro.observe(ld); }
  track.appendChild(introOf(p));
  if (p._run) return finishRun(p, page, bg, sc, track, hero);
  const bf = briefOf(p); if (bf) track.appendChild(bf);
  const chs = channelsOf(p); chs.forEach(s => track.appendChild(s));
  const ab = aboutOf(p); if (ab) track.appendChild(ab);
  const cl = classifiedOf(p); if (cl) track.appendChild(cl);
  const fa = factsOf(p); if (fa) track.appendChild(fa);
  const cmp = compareOf(p); if (cmp) track.appendChild(cmp);
  const bts = btsOf(p); if (bts) { track.appendChild(bts); if (bts._rail) track.appendChild(bts._rail); }
  const cr = creditsOf(p);
  const nx = nextOf(p);   // back at the end of every run (Kirtan, 26 Nov: 'scroll to next project is not working')
  if (cr) track.appendChild(cr);
  { const end = cr || bts || fa || ab; const go = end && launchEl(p); if (go) end._in.appendChild(go); }
  track.appendChild(nx);
  sc.appendChild(track);
  const back = backEl(p);
  const prog = el('div', 'wkg-prog'); prog.appendChild(el('i')); prog.setAttribute('aria-hidden', 'true');
  page.append(bg, back._wrap, sc, prog);   // Back first: it is the first thing on the page, so it is the first Tab stop
  wirePage(page);
  Object.assign(page, { _p: p, _hero: hero, _sc: sc, _track: track, _back: back, _bg: [...bg.children], _prog: prog.firstChild, _progW: prog,
    _hx: { t: 0, x: 0, max: 0, vel: 0, native: false, light: false, frames: [], rvq: [], stops: [], heroZ: 1 } });
  if (cmp) { const its = cmp._ba.map(f => ({ still: f._src })); ratios(its, false).then(() => { cmp._ba.forEach((f, n) => { f._ar = its[n].ar || 1.6; f._fr.style.aspectRatio = String(f._ar); }); if (page.isConnected) layoutPage(page); }); }
  if (bts && bts._rail) { const lis = [...bts._rail._stops.children].filter(li => li._pic), pics = lis.map(li => li._pic); if (pics.length) ratios(pics, false).then(() => { lis.forEach(li => { const f = frameEl({ ...li._pic, caption: '', bts: false }); li.firstChild.appendChild(f); }); if (page.isConnected) layoutPage(page); }); }
  // media and channel images: sized once their ratios are known, then put in before the credits
  const items = mediaItems(p, hero._used);
  const chItems = chs.flatMap(s => s._items || []);
  page._media = ratios([...items, ...chItems], isVert(p)).then(() => {
    for (const s of chs) if (s._items) s._items.forEach(it => s.appendChild(frameEl(it)));
    const ps = mediaPanels(p, items);
    unstack(track);   // the credits may sit inside a stacked pair by now; layoutPage pairs them again
    ps.forEach(s => track.insertBefore(s, bts || cr || nx));   // the work first, then behind the scenes
    if (page.isConnected) layoutPage(page);
  });
  return page;
}
/* a Media client's run: the same panels in the same order as the old Zepto page (about, facts, the work, credits, next),
   with the reels as the work, then the dated rail. The vox pops grid, where a client has one, is the last stop. */
function finishRun(p, page, bg, sc, track, hero) {
  const R = p._run;
  page.classList.add('mr-run');
  if (R.heroLab) hero.appendChild(R.heroLab());
  // films first: the title, the sized grid, then the words. Junior Titans and the vox pops close the run
  const intro = track.querySelector('.wkg-intro'); if (intro) intro.remove();
  const mark = (n, b) => { if (b.ch) n.dataset.ch = b.ch; return n; };
  const put = (b) => {
    if (b.title) {
      const s = el('section', 'wkg-pn wkg-ch mr-chd'), l = el('div', 'wkg-chl');
      if (b.count) l.appendChild(el('span', 'wkg-chn', b.count));
      l.appendChild(el('h3', '', clean(b.title)));
      if (b.note) l.appendChild(el('p', '', clean(b.note)));
      if (b.note && b.note.length > 60) s.classList.add('mr-long');
      s.appendChild(l); track.appendChild(mark(s, b));
    }
    if (b.panel) track.appendChild(mark(b.panel(), b));
  };
  R.blocks.filter(b => !b.ch).forEach(put);
  if (R.timeline) track.appendChild(R.timeline());
  if (intro) track.appendChild(intro);
  const ab = aboutOf(p); if (ab) track.appendChild(ab);
  const fa = factsOf(p); if (fa) track.appendChild(fa);
  const cr = creditsOf(p); if (cr) track.appendChild(cr);
  R.blocks.filter(b => b.ch).forEach(put);
  if (R.grid) track.appendChild(R.grid());
  track.appendChild(nextOf(p));
  sc.appendChild(track);
  const back = backEl(p);
  const prog = el('div', 'wkg-prog'); prog.appendChild(el('i')); prog.setAttribute('aria-hidden', 'true');
  page.append(bg, back._wrap, sc, prog);   // Back first: it is the first thing on the page, so it is the first Tab stop
  wirePage(page);
  Object.assign(page, { _p: p, _hero: hero, _sc: sc, _track: track, _back: back, _bg: [...bg.children], _prog: prog.firstChild, _progW: prog,
    _hx: { t: 0, x: 0, max: 0, vel: 0, native: false, light: false, frames: [], rvq: [], stops: [], heroZ: 1 } });
  page._media = Promise.resolve();
  // the readout's count is kept (readout() writes it each frame) but nothing is pinned: the Next link at the bottom is gone (Kirtan, 25 Nov)
  page._rd = el('span', 'mr-rdn');
  if (R.crew) { const c = el('p', 'mr-crew', R.crew); page.appendChild(c); page._crew = c; page.classList.add('mr-crewp'); }
  return page;
}
/* the back control: a pill after Lusion's (arrow swap on hover) that also opens a sheet of every project. On a fine
   pointer the sheet opens on hover (after a short intent delay) and the hovered project's name is read out; on touch a
   Projects pill beside it opens the same sheet from the bottom, names under the pictures. */
function backEl(p) {
  const wrap = el('div', 'wkg-bk');
  const back = el('button', 'wkg-back'); back.type = 'button'; back.setAttribute('aria-label', 'Back to the work');
  const icon = (c) => `<svg class="wkg-bi ${c}" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12.243 3.757 8m0 0L8 3.757M3.757 8h8.486"/></svg>`;
  back.innerHTML = `<span class="wkg-bm">${icon('wkg-bi1')}<span class="wkg-bt"><span>Back</span></span>${icon('wkg-bi2')}</span>`;
  back.addEventListener('click', () => { shut(true); close(); });
  wrap.appendChild(back);
  const LIST = p._run ? p._run.sib : ALL, WORD = p._run ? 'folders' : 'projects';
  let allb = null;
  if (!HOVER.matches) {
    allb = el('button', 'wkg-allb'); allb.type = 'button'; allb.setAttribute('aria-expanded', 'false'); allb.setAttribute('aria-label', p._run ? 'Categories' : 'All projects');
    allb.innerHTML = `<span class="wkg-bm"><span class="wkg-bt"><span>${p._run ? 'Categories' : 'Projects'}</span></span></span>`;
    allb.addEventListener('click', () => (wrap.classList.contains('wkg-sho') ? shut(true) : openSheet()));
    wrap.appendChild(allb);
  }
  const sh = el('nav', 'wkg-sh'); sh.setAttribute('aria-label', p._run ? 'All folders' : 'All projects');
  wrap.appendChild(sh);
  let built = false, tOpen = 0, tShut = 0, rd = null;
  const say = (text) => {
    if (!rd || rd.textContent === text) return;
    rd.textContent = text;
    if (!RM.matches) gsap.fromTo(rd, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', overwrite: true });
  };
  function build() {
    if (built) return; built = true;
    if (p._run && p._run.sheet) { sh.setAttribute('aria-label', 'Categories'); sh.appendChild(p._run.sheet(() => shut(true))); return; }
    const head = el('div', 'wkg-shn'), r = el('span', 'wkg-shr'); rd = el('span', '', clean(p.name)); r.appendChild(rd);
    head.append(r);   // no count here: it disagreed with the Software filter, and counts are gone from the site (PHONE-AUDIT #18)
    void WORD;
    const g = el('div', 'wkg-shg'); g.style.setProperty('--cols', Math.min(8, Math.ceil(LIST.length / 2)));
    LIST.forEach((q, i) => {
      const b = el('button', 'wkg-th' + (q === p ? ' wkg-cur' : '')); b.type = 'button'; b.style.setProperty('--i', i);
      b.setAttribute('aria-label', clean(q.name) + (q === p ? ', you are here' : ''));
      if (q === p) b.setAttribute('aria-current', 'page');
      const m = el('span', 'wkg-thm');
      if (isText(q)) m.appendChild(plateEl(q));
      else { const im = el('img'); im.alt = ''; im.decoding = 'async'; setImg(im, q.hero, '160px'); m.appendChild(im); }
      b.append(m, el('span', 'wkg-thn', clean(q.name)));
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { say(clean(q.name)); prefetch(q); } });
      b.addEventListener('focus', () => say(clean(q.name)));
      b.addEventListener('click', () => {
        if (q === p) { shut(true); return; }
        shut(false); go(q.id, m, true);
      });
      g.appendChild(b);
    });
    g.addEventListener('pointerleave', () => say(clean(p.name)));
    sh.append(head, g);
  }
  function openSheet() {
    clearTimeout(tShut); if (busy) return;
    build(); wrap.classList.add('wkg-sho'); if (allb) allb.setAttribute('aria-expanded', 'true');
  }
  function shut(now) {
    clearTimeout(tOpen); clearTimeout(tShut);
    const go2 = () => { wrap.classList.remove('wkg-sho'); if (allb) allb.setAttribute('aria-expanded', 'false'); say(clean(p.name)); };
    if (now) go2(); else tShut = setTimeout(go2, 60);
  }
  if (HOVER.matches) {
    wrap.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(tShut); tOpen = setTimeout(openSheet, 140); });
    wrap.addEventListener('pointerleave', () => { clearTimeout(tOpen); tShut = setTimeout(() => shut(true), 240); });
    wrap.addEventListener('focusin', (e) => { if (e.target !== back || back.matches(':focus-visible')) openSheet(); });
    wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) shut(true); });
  } else { const away = (e) => { if (wrap.classList.contains('wkg-sho') && !wrap.contains(e.target)) shut(true); }; addEventListener('pointerdown', away, { passive: true }); back._off = () => removeEventListener('pointerdown', away); }
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wrap.classList.contains('wkg-sho')) { e.stopPropagation(); shut(true); back.focus(); } });
  const bm = back.firstChild;
  const qx = gsap.quickTo(bm, 'x', { duration: 0.6, ease: 'power3.out' }), qy = gsap.quickTo(bm, 'y', { duration: 0.6, ease: 'power3.out' });
  back.addEventListener('pointermove', (e) => { if (!HOVER.matches || RM.matches) return; const r = back.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.12); qy((e.clientY - r.top - r.height / 2) * 0.22); });
  back.addEventListener('pointerleave', () => { qx(0); qy(0); });
  if (!RM.matches) gsap.set(allb ? [bm, allb.firstChild] : bm, { autoAlpha: 0 });
  back._wrap = wrap; back._allb = allb; back._shut = shut;
  return back;
}
/* prebuild on hover: the page and its pictures are ready before the click, so the click only starts tweens */
/* the prebuilt page waits in the DOM, hidden and already laid out; its hero picture is decoded in an element the
   flyer then uses, so the click costs no build, no layout and no decode */
let pre = null;
function prefetch(p) {
  if (!p || !EXTRAS_OK || openId === p.id || (pre && pre.p === p)) return;
  if (pre && pre.page && pre.page !== curPage) dropPage(pre.page);
  const page = buildPage(p);
  const it = pre = { p, page, img: null };
  if (!isText(p)) { const im = new Image(); im.decoding = 'async'; im.src = big(p.hero); (im.decode ? im.decode() : Promise.resolve()).then(() => { it.img = im; }, () => {}); }
  const lay = () => { if (pre !== it || page === curPage) return; ROOT.appendChild(page); layoutPage(page); page._laid = innerWidth + 'x' + innerHeight; };
  if (window.requestIdleCallback) requestIdleCallback(lay, { timeout: 300 }); else setTimeout(lay, 60);
}
function takePage(p) {
  if (pre && pre.p === p && pre.page) { const pg = pre.page; return pg; }
  if (pre && pre.page && pre.page !== curPage) dropPage(pre.page);
  pre = null;
  return buildPage(p);
}
function takeImg(p) { const im = pre && pre.p === p && pre.img; return im || null; }

/* the run's layout. Horizontal: every frame takes the height left between the top and the bottom lines.
   Vertical (?inside=v): rows across the width. Then text is split into line masks and every reveal, frame, ground
   stop and the next project's preview is measured once (offsets only), so the engine never reads layout per frame. */
const posIn = (n, track, v) => { let a = 0; while (n && n !== track) { a += v ? n.offsetTop : n.offsetLeft; n = n.offsetParent; } return a; };
function sizeRow(frames, avail, maxH, gap) {
  const sum = frames.reduce((a, f) => a + f._ar, 0) || 1;
  const h = Math.min(maxH, (avail - gap * (frames.length - 1)) / sum);
  frames.forEach(f => { f.style.height = Math.floor(h) + 'px'; f.style.width = Math.floor(h * f._ar) + 'px'; });
}
const LINES_SEL = '.wkg-lede,.wkg-cols p,.wkg-chl p,.wkg-chq,.wkg-mcap';
const WORDS_SEL = '.wkg-h2,.wkg-chl h3,.wkg-nt';
const FADE_SEL = '.wkg-cap2>span,.wkg-bf small,.wkg-bf h3,.wkg-bf li,.wkg-lab,.wkg-info dd,.wkg-stat small,.wkg-chn,.wkg-shoot,.wkg-links a,.wkg-fact:not(.wkg-num) b,.wkg-credits dd,.wkg-tl li>span:last-child,.wkg-nl,.wkg-nk,.wkg-soon';
const NUMS_SEL = '.wkg-stat b,.wkg-fact.wkg-num b';
const CLIP0 = 'inset(100% 0% 0% 0% round 14px)', CLIP1 = 'inset(0% 0% 0% 0% round 14px)';
function layoutPage(page) {
  // a page laid out before the web fonts land measures the fallback font, so stacked panels can overflow once the real font arrives: lay it out again then
  if (document.fonts && document.fonts.status !== 'loaded' && !page._fontWait) { page._fontWait = true; document.fonts.ready.then(() => { page._fontWait = false; if (page.isConnected) { layoutPage(page); page._dirty = true; } }); }
  const hx = page._hx, track = page._track, sc = page._sc, V = !!page._v;
  const phone = isPhone(), fx = page.classList.contains('wkg-fx');
  unstack(track);
  hx.native = !HOVER.matches || phone;
  hx.pin = phone && !V;                     // phones: vertical finger scroll drives the sideways run (see .wkg-pin)
  sc.classList.toggle('wkg-pin', hx.pin);
  if (!hx.pin && page._pinsp) { page._pinsp.remove(); page._pinsp = null; sc.scrollTop = 0; for (const n of track.querySelectorAll('.wkg-gt8')) n.classList.remove('wkg-gt8'); hx.gates = []; }
  hx.light = hx.native;                     // touch and phones: reveals yes, no heavy parallax, no skew
  sc.classList.toggle('wkg-native', hx.native);
  const media = track.querySelector('.wkg-media,.wkg-ch') || track.querySelector('.wkg-pn:not(.wkg-hero)');
  const first = track.querySelector('.wkg-pn:not(.wkg-hero)');
  const pcs = getComputedStyle(media || track.firstChild);
  const nxp = track.querySelector('.wkg-next');   // phone scroll panels drop their bottom padding (their box ends above the line): the Next panel keeps it
  const top = parseFloat(pcs.paddingTop) || 100, bot = parseFloat(getComputedStyle(nxp || media || track.firstChild).paddingBottom) || 90;
  const gap = parseFloat(pcs.columnGap) || 24, gut = parseFloat(pcs.paddingLeft) || 18;
  // phones: a panel is 100vw - 36 with an 18px gap on its left, so a picture is 100vw - 54: it fits its panel, and two
  // pictures in a row keep the gap between them instead of touching
  const room = innerHeight - top - bot, maxW = innerWidth - 36 - (phone && !V ? 18 : 0);
  if (V) {
    const avail = innerWidth - 2 * gut, maxH = innerHeight * (phone ? 0.72 : 0.86);
    for (const s of track.querySelectorAll('.wkg-media,.wkg-ch')) { const fr = [...s.querySelectorAll(':scope>.wkg-fr')]; if (fr.length) sizeRow(fr, s.classList.contains('wkg-cp') && !phone ? avail * 0.6 : avail, s.classList.contains('wkg-cp') ? maxH * 0.8 : maxH, gap); }
  } else {
    for (const s of track.querySelectorAll('.wkg-media.wkg-cp')) {
      // a medium picture with its note beside it (under it on a phone)
      const f = s.querySelector('.wkg-fr');
      if (phone) { const hh = Math.min(room * 0.58, maxW / f._ar); f.style.height = Math.floor(hh) + 'px'; f.style.width = Math.floor(maxW) + 'px'; continue; }
      const hh = Math.min(room * 0.74, innerWidth * 0.56 / f._ar); f.style.height = Math.floor(hh) + 'px'; f.style.width = Math.floor(hh * f._ar) + 'px';
    }
    for (const s of track.querySelectorAll('.wkg-media:not(.wkg-cp)')) {
      const fr = [...s.querySelectorAll('.wkg-fr')], lab = s.querySelector('.wkg-shoot') || (isVert(page._p) ? 1 : 0);
      let h = room - (lab ? 34 : 0);
      // phones: the frame fills the panel's height, cropped to cover, never a thin strip
      if (phone) { const f = fr[0]; f.style.height = Math.floor(h) + 'px'; f.style.width = Math.floor(Math.min(maxW, h * f._ar)) + 'px'; continue; }
      const sum = fr.reduce((a, f) => a + f._ar, 0); h = Math.min(h, (innerWidth * 0.86 - gap * (fr.length - 1)) / sum);
      fr.forEach(f => { f.style.height = Math.floor(h) + 'px'; f.style.width = Math.floor(h * f._ar) + 'px'; });
    }
    for (const s of track.querySelectorAll('.wkg-ch')) {
      const fr = [...s.querySelectorAll(':scope>.wkg-fr')];
      fr.forEach(f => { const hh = phone ? room * 0.5 : Math.min(room * 0.72, innerWidth * 0.6 / f._ar); f.style.height = Math.floor(hh) + 'px'; f.style.width = Math.floor(phone ? maxW : hh * f._ar) + 'px'; });
    }
  }
  // the wipes: one height for the row, wide shots capped so three still fit the run
  for (const r of track.querySelectorAll('.wkg-bas')) {
    const hh = phone || V ? 0 : clamp(room - 150, 220, 640);
    r.querySelectorAll('.wkg-ba').forEach(f => { if (phone || V) { f.style.width = ''; f.firstChild.style.height = ''; return; } const w = Math.min(innerWidth * 0.62, hh * (f._ar || 1.6)); f.style.width = Math.floor(w) + 'px'; f.firstChild.style.height = Math.floor(w / (f._ar || 1.6)) + 'px'; });
  }
  // the rail: pictures above the line share one height (room minus the line and the text below it)
  for (const s of track.querySelectorAll('.wkg-stops')) {
    const fr = [...s.querySelectorAll('.wkg-sup>.wkg-fr')];
    const hh = phone || V ? 0 : clamp(room - 260, 150, 380);
    s.style.setProperty('--sup', (phone || V ? 0 : fr.length || s.querySelector('.wkg-spic') ? hh : Math.min(hh, 220)) + 'px');
    fr.forEach(f => {
      if (phone || V) { f.style.width = '100%'; f.style.height = ''; f.style.aspectRatio = String(f._ar); return; }
      const w = Math.min(innerWidth * 0.42, hh * f._ar); f.style.height = Math.floor(w / f._ar) + 'px'; f.style.width = Math.floor(w) + 'px';
      f.closest('.wkg-stop').style.width = Math.max(300, Math.floor(w)) + 'px';
    });
  }
  for (const s of track.querySelectorAll('.wkg-its')) {
    // two rows of picture plus caption fit the run's height; a caption keeps a readable measure (it may be wider than a
    // narrow picture) and at most about four lines, growing sideways instead of down
    const fr = [...s.querySelectorAll('.wkg-fr')], capH = 128;
    const hh = phone ? 220 : clamp((room - 2 * capH - 26) / 2, 110, 260);
    fr.forEach(f => {
      const w = Math.min(phone ? maxW : innerWidth * 0.5, hh * f._ar);
      f.style.height = Math.floor(w / f._ar) + 'px'; f.style.width = Math.floor(w) + 'px';
      const fig = f.parentNode, need = Math.min(520, Math.max(300, (f._capLen || 0) * 7.6 / 3.6));
      fig.style.width = phone ? '' : Math.floor(Math.max(w, need)) + 'px';
    });
  }
  // the writeup grows sideways a column at a time, never down (horizontal run only)
  for (const c of track.querySelectorAll('.wkg-cols')) {
    c.style.height = ''; c.style.width = '';
    if (phone || V) continue;
    // the room left is what sits under everything above the text in its panel (heading, and on client pages the stats too)
    const box = c.closest('.wkg-pi') || c.parentElement, h = room - Math.max(0, c.getBoundingClientRect().top - box.getBoundingClientRect().top);
    const cw = parseFloat(getComputedStyle(c).columnWidth) || 380;
    c.style.width = cw + 'px'; c.style.height = Math.max(200, h) + 'px';
    // more than one column: the height stays, or column-fill:auto pours every line back into the first column (under the line)
    if (c.scrollWidth > cw + 2) c.style.width = c.scrollWidth + 'px';
    else if (c.scrollHeight <= h) { c.style.height = ''; }
  }
  // facts grow sideways too: drop a row at a time until the grid fits under whatever sits above it
  if (!phone && !V) for (const g of track.querySelectorAll('.wkg-facts')) {
    if (g._fr == null) g._fr = parseInt(g.style.getPropertyValue('--fr')) || 2;
    g.style.setProperty('--fr', g._fr);
    const box = g.closest('.wkg-pi') || g.parentElement, avail = room - Math.max(0, g.getBoundingClientRect().top - box.getBoundingClientRect().top);
    for (let fr = g._fr; fr > 1 && g.offsetHeight > avail; ) g.style.setProperty('--fr', --fr);
  }
  if (!phone && !V) stack(track, room);
  if (page._p._run) sizeGrids(page, phone);
  prepText(page, fx);
  fitNums(track);
  hx.max = hx.pin ? Math.max(0, track.scrollWidth - innerWidth) : hx.native ? Math.max(0, V ? sc.scrollHeight - sc.clientHeight : sc.scrollWidth - sc.clientWidth)
    : Math.max(0, V ? track.offsetHeight - innerHeight : track.scrollWidth - innerWidth);
  const hero = page._hero;
  hx.heroW = V ? hero.offsetHeight : hero.offsetWidth;
  hx.framed = hero.classList.contains('wkg-hfr');
  hx.sw = page.classList.contains('wkg-sw');
  hx.heroZ = RM.matches || hx.light || !hero._s || (hx.framed && hx.sw) ? 1 : 1.08;
  hx.heroDark = (!hx.framed && (!hero.classList.contains('wkg-txt') || isDark(schemeOf(page._p).pc)));
  if (hx.framed) { const hm = hero._t; hx.hf = { x: hero.offsetLeft + hm.offsetLeft, y: hero.offsetTop + hm.offsetTop, w: hm.offsetWidth, h: hm.offsetHeight }; }
  hx.heroEnd = false;
  // frames: centre on the run, place in their row (for depth), settle scale
  hx.frames = [...track.querySelectorAll('.wkg-fr')].map(f => {
    const o = f._fr || (f._fr = { f, m: f.firstChild, s: fx && !f._shown ? 1.14 : 1 });
    const sib = [...f.parentNode.children].filter(x => x.classList.contains('wkg-fr'));
    o.k = sib.length > 1 ? sib.indexOf(f) : 0;
    o.c = posIn(f, track, V) + (V ? f.offsetHeight : f.offsetWidth) / 2;
    o.strip = !!f.parentNode.closest('.wkg-media,.wkg-ch'); o.tf = null; o.bo = -1;
    if (fx && !f._shown) f.style.clipPath = CLIP0;
    return o;
  });
  // the reveals, in run order
  const items = [];
  const add = (n, type, extra) => { if (n && !n._shown) items.push({ n, type, pos: posIn(n, track, V), ...extra }); };
  for (const pn of track.querySelectorAll('.wkg-pn:not(.wkg-hero)')) {
    pn.querySelectorAll(LINES_SEL).forEach(n => add(n, 'lines'));
    pn.querySelectorAll(WORDS_SEL).forEach(n => add(n, 'words'));
    pn.querySelectorAll(FADE_SEL).forEach(n => add(n, 'fade'));
    pn.querySelectorAll(NUMS_SEL).forEach(n => add(n, 'num'));
    const r = pn.querySelector('.wkg-info,.wkg-facts,.wkg-credits dl,.wkg-doc,.wkg-stops,.mr-bars'); if (r && !pn._ruled) add(r, 'rule', { pn });
    pn.querySelectorAll('.wkg-fr').forEach(n => add(n, 'frame'));
    pn.querySelectorAll('.mr-col').forEach(n => add(n, 'col'));
  }
  items.sort((a, b) => a.pos - b.pos);
  hx.rvq = items;
  // ground colours: text on the wing's ground, the pictures on paper; blended as the run moves, never cut
  const G = page.classList.contains('wkg-tx') ? schemeOf(page._p).pc : WING[page._p.wing].ground;
  const stops = [];
  for (const pn of track.children) {
    if (pn.classList.contains('wkg-next')) break;
    const col = (pn.classList.contains('wkg-media') || pn.classList.contains('mr-gp')) && !page.classList.contains('wkg-tx') ? PAPER : G;
    if (!stops.length || stops[stops.length - 1].col !== col) stops.push({ pos: posIn(pn, track, V), col });
  }
  hx.stops = stops; hx.gj = -1;
  hx.tp = V ? [] : [...track.children].filter(pn => !pn.matches('.wkg-hero,.wkg-media,.wkg-next,.wkg-ch:not(.mr-chd)') && !pn.querySelector('.wkg-fr,img')).map(pn => ({ el: pn, pos: posIn(pn, track, false), w: pn.offsetWidth, hw: textW(pn.querySelector('h2,h3,.mr-vxh')), pl: parseFloat(getComputedStyle(pn).paddingLeft) || 0, o: -1 }));
  hx.pgap = parseFloat(getComputedStyle(first || track.firstChild).paddingLeft) || 48;
  const nx = track.querySelector('.wkg-next');
  hx.nx = nx ? { pos: posIn(nx, track, V), m: nx.querySelector('.wkg-nm'), q: -1 } : null;
  hx.t = Math.min(hx.t, hx.max); hx.x = Math.min(hx.x, hx.max);
  // the one vertical stop on a run: sideways travel pauses here while the grid scrolls down, then carries on
  const vx = track.querySelector('.mr-vox');
  if (vx) {
    const box = vx.querySelector('.mr-vsc'), was = hx.gate, gm = Math.max(0, box.scrollHeight - box.clientHeight);
    hx.gate = hx.native ? null : { pos: Math.min(posIn(vx, track, false), hx.max), el: box, max: gm, t: was ? Math.min(was.t, gm) : 0, x: was ? Math.min(was.x, gm) : 0 };
    if (hx.gate && !box._gs) { box._gs = true; box.addEventListener('scroll', () => { const g = page._hx.gate; if (g && Math.abs(box.scrollTop - g.x) > 2) g.t = g.x = box.scrollTop; }, { passive: true }); }
  } else hx.gate = null;
  if (page._p._run) measureGrids(page);
  // a chapter's strip (Junior Titans crew) shows while the run is inside that chapter
  const chp = page._crew ? [...track.querySelectorAll('[data-ch]')] : [];
  if (chp.length) { const l = chp[chp.length - 1]; hx.band = { a: posIn(chp[0], track, false) - innerWidth * 0.5, b: posIn(l, track, false) + l.offsetWidth - innerWidth * 0.5, on: null }; } else hx.band = null;
  // a panel that scrolls on its own (phones) can be reached and scrolled from the keyboard
  for (const n of track.querySelectorAll(':scope>.wkg-pn')) {
    const ov = phone && !V && (n.classList.contains('wkg-gt8') || /auto|scroll/.test(getComputedStyle(n).overflowY)) && n.scrollHeight > n.clientHeight + 2;
    n.classList.toggle('wkg-ovf', ov);
    if (ov && !n._ovs) { n._ovs = () => n.classList.toggle('wkg-end', n.scrollTop >= n.scrollHeight - n.clientHeight - 2); n.addEventListener('scroll', n._ovs, { passive: true }); }
    if (n._ovs) n._ovs();
  }
  for (const n of track.querySelectorAll('.wkg-bts,.wkg-railp,.mr-route>.wkg-pi,.mr-vsc')) { const sc2 = n.scrollHeight > n.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(n).overflowY); if (sc2) { n.tabIndex = 0; n.setAttribute('role', 'group'); if (!n.hasAttribute('aria-label')) n.setAttribute('aria-label', 'Scrollable panel'); } else if (n.getAttribute('role') === 'group') { n.removeAttribute('tabindex'); n.removeAttribute('role'); } }
  if (hx.pin) pinLayout(page);
  page._dirty = true;
  watchMedia(page);
}
/* option A: short text panels share a column. After layout, two neighbouring text panels (or two columns inside the
   behind-the-scenes panel) go one above the other when both fit the screen's height, so the bottom half is used and
   the run gets shorter. Undone and redone on every layout, so a resize re-packs from scratch. */
const STACK_PN = '.wkg-about,.wkg-factp,.wkg-credits,.wkg-brief,.wkg-intro:not(.wkg-ionly)';
function unstack(track) {
  for (const w of [...track.querySelectorAll('.wkg-stk,.wkg-bstk')]) { while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove(); }
}
function stack(track, room) {
  const GAP = 64, hOf = (n) => (n.querySelector(':scope>.wkg-pi') || n).offsetHeight;
  const pair = (a, b, cls) => { const w = el('div', cls); a.parentNode.insertBefore(w, a); w.append(a, b); };
  // panels: walk the run, skipping empty ones, pairing neighbours that fit
  const kids = [...track.children].filter(n => n.offsetWidth > 0);
  for (let i = 0; i + 1 < kids.length; i++) {
    const a = kids[i], b = kids[i + 1];
    if (!a.matches(STACK_PN) || !b.matches(STACK_PN)) continue;
    if (hOf(a) + hOf(b) + GAP > room - 24) continue;   // 24: the line masks (.22em under each line) are added after this
    pair(a, b, 'wkg-stk'); i++;
  }
  // a pair whose content still spills past the room (text wrapped longer than measured) goes back to two panels
  for (const w of [...track.querySelectorAll(':scope>.wkg-stk')]) if (w.scrollHeight > w.clientHeight + 1) { while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove(); }
  // behind the scenes: its columns pair the same way, with a tighter gap
  for (const pi of track.querySelectorAll('.wkg-bts>.wkg-pi')) {
    const cols = [...pi.children].filter(n => n.classList.contains('wkg-bcol') && n.offsetWidth > 0);
    for (let i = 0; i + 1 < cols.length; i++) {
      const a = cols[i], b = cols[i + 1];
      if (a.offsetHeight + b.offsetHeight + 44 > room) continue;
      pair(a, b, 'wkg-bstk'); i++;
    }
  }
}
/* a heading's inked width (its box can span the whole panel) */
function textW(h) { if (!h) return 0; const r = document.createRange(); r.selectNodeContents(h); return r.getBoundingClientRect().width; }
const isDark = (c) => c === NAVY || c === INK || c === COBALT;
/* text into line masks: words in (one write), their lines read (one read), lines out (one write) */
function splitLines(nodes, fx) {
  nodes.forEach(n => {
    if (n._src == null) n._src = n.textContent;
    n.textContent = '';
    const ws = n._src.split(/\s+/).filter(Boolean);
    // a word never breaks while it is measured (a hyphen inside one, multi-sensory, would put it on two rows at once)
    n._ws = ws.map((w, i) => { const sp = el('span', '', w); sp.style.whiteSpace = 'nowrap'; n.appendChild(sp); if (i < ws.length - 1) n.appendChild(document.createTextNode(' ')); return sp; });
  });
  const tops = nodes.map(n => n._ws.map(w => w.offsetTop));
  nodes.forEach(n => { n._sw = n.clientWidth; });
  nodes.forEach((n, k) => {
    const rows = []; let last = null;
    n._ws.forEach((w, i) => { const t = tops[k][i]; if (last === null || Math.abs(t - last) > 3) { rows.push([]); last = t; } rows[rows.length - 1].push(w.textContent); });
    n.textContent = '';
    n._lines = rows.map(r => { const m = el('span', 'wkg-mk'), i = el('span', '', r.join(' ')); m.appendChild(i); n.appendChild(m); return i; });
    n._ws = null;
    if (fx && !n._shown) gsap.set(n._lines, { yPercent: 115 });
  });
}
function prepText(page, fx) {
  const tr = page._track;
  const nodes = [...tr.querySelectorAll('.wkg-pn:not(.wkg-hero) :is(' + LINES_SEL + ')'), ...page._hero.querySelectorAll('.wkg-hlede')];
  splitLines(nodes, fx);
  for (const pn of tr.querySelectorAll('.wkg-pn:not(.wkg-hero)')) {
    pn.querySelectorAll(WORDS_SEL).forEach(n => { if (!n._risen) { n._risen = true; rise(n, n.textContent); if (fx && !n._shown) gsap.set(n.querySelectorAll('.wkg-ln>span'), { yPercent: 115 }); } });
    pn.querySelectorAll(FADE_SEL + ',' + NUMS_SEL).forEach(n => { if (!n._prep) { n._prep = true; if (fx && !n._shown) gsap.set(n, { autoAlpha: 0, y: 18 }); } });
    pn.querySelectorAll('.wkg-fact,.wkg-credits dl>div').forEach((d, i) => d.style.setProperty('--rd', (i * 0.07).toFixed(2) + 's'));
  }
}
/* big numbers never wrap: each is shrunk to fit its column if it would overflow */
function fitNums(track) {
  const ns = [...track.querySelectorAll('.wkg-fact.wkg-num b,.wkg-stat b,.wkg-tf b')];
  ns.forEach(b => { b.style.fontSize = ''; });
  const m = ns.map(b => [b.scrollWidth, b.clientWidth, parseFloat(getComputedStyle(b).fontSize)]);
  ns.forEach((b, i) => { const [sw, cw, fs] = m[i]; if (cw > 0 && sw > cw + 1) b.style.fontSize = Math.floor(fs * cw / sw) + 'px'; });
}
const NUMV = /^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([KMB]?\+?)$/;
function countUp(n, delay) {
  const tn = n.firstChild; if (!tn || tn.nodeType !== 3) return;
  const t = tn.nodeValue, m = t.match(NUMV); if (!m || t === '000') return;
  const comma = m[1].includes(','), dp = m[2] ? m[2].length - 1 : 0, target = parseFloat(m[1].replace(/,/g, '') + (m[2] || ''));
  const o = { v: 0 }, put = (v) => { tn.nodeValue = (comma ? v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) : v.toFixed(dp)) + m[3]; };
  put(0);
  gsap.to(o, { v: target, duration: 1.5, ease: 'power3.out', delay, onUpdate: () => put(o.v), onComplete: () => { tn.nodeValue = t; } });
}
function fire(page, it, delay) {
  const n = it.n;
  // a paragraph whose lines no longer fit its box (they were measured before something changed) is split again first,
  // so a line is never cut at the mask's edge
  if (it.type === 'lines' && n._lines && n._lines.some(l => l.scrollWidth > n.clientWidth + 1)) splitLines([n], page.classList.contains('wkg-fx'));
  n._shown = true;
  if (it.type === 'col') { n.classList.add('mr-rv'); return; }
  if (!page.classList.contains('wkg-fx')) { if (it.type === 'rule') it.pn.classList.add('wkg-in'); return; }
  const E = 'expo.out';
  if (it.type === 'lines') gsap.to(n._lines, { yPercent: 0, duration: 1.1, ease: E, stagger: 0.08, delay });
  else if (it.type === 'words') gsap.to(n.querySelectorAll('.wkg-ln>span'), { yPercent: 0, duration: 1.1, ease: E, stagger: 0.05, delay });
  else if (it.type === 'fade') gsap.to(n, { autoAlpha: 1, y: 0, duration: 0.9, ease: E, delay, clearProps: 'transform' });
  else if (it.type === 'num') { gsap.to(n, { autoAlpha: 1, y: 0, duration: 0.9, ease: E, delay, clearProps: 'transform' }); countUp(n, delay); }
  else if (it.type === 'rule') { it.pn._ruled = true; it.pn.classList.add('wkg-in'); }
  else if (it.type === 'frame') {
    gsap.fromTo(n, { clipPath: CLIP0 }, { clipPath: CLIP1, duration: 1.2, ease: E, delay, onComplete: () => { n.style.clipPath = ''; } });
    if (n._fr) gsap.to(n._fr, { s: 1, duration: 1.7, ease: E, delay });
    page._fxUntil = Math.max(page._fxUntil || 0, performance.now() + (delay + 1.8) * 1000);
  }
}
function watchMedia(page) {
  if (page._io) page._io.disconnect();
  const io = new IntersectionObserver((es) => es.forEach(e => {
    (page._p._run ? [...e.target.querySelectorAll('video')] : [e.target.querySelector('video')]).forEach(v => { if (!v) return;
    if (e.isIntersecting) { const go = () => { if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.preload = 'auto'; } if (!RM.matches && page === curPage && v.isConnected && !document.documentElement.classList.contains('mr-lock')) v.play().catch(() => {}); }; if (!v.src && window.requestIdleCallback) requestIdleCallback(go, { timeout: 400 }); else go(); }
    else v.pause();
    });
  }), { rootMargin: page._p._run ? '0px' : '25% 25% 25% 25%' });   // client runs hold 20+ reels: only what is on screen plays
  page._track.querySelectorAll('.wkg-fr, .wkg-hm').forEach(f => io.observe(f));
  page._io = io;
}

/* the run's engine, on the one GSAP ticker Lenis also runs on: a smoothed follow on the wheel (the Lusion constant),
   native on touch. Per frame it only writes transforms and opacities from numbers measured at layout. */
/* phones: the stops of the vertical scroll. Every panel (or box inside one) that is taller than its room becomes a stop at
   the run position where its panel sits in view: the run holds there while the scroll carries its own content up. */
function pinLayout(page) {
  const hx = page._hx, track = page._track, sc = page._sc;
  const cand = new Set([...track.querySelectorAll(':scope>.wkg-pn:not(.wkg-media):not(.wkg-hero):not(.wkg-next),.wkg-bts,.wkg-railp,.mr-route>.wkg-pi,.mr-vsc')]);
  const gates = [];
  for (const n of cand) {
    if (!n.classList.contains('wkg-gt8') && !/auto|scroll/.test(getComputedStyle(n).overflowY)) continue;
    n.classList.add('wkg-gt8');
    const len = Math.max(0, n.scrollHeight - n.clientHeight);
    if (len < 3) { n.scrollTop = 0; continue; }
    let pn = n; while (pn.parentNode !== track) pn = pn.parentNode;
    gates.push({ el: n, pn, pos: clamp(posIn(pn, track, false), 0, hx.max), len, y: -1, d: n === pn ? 0 : 1 });
  }
  gates.sort((a, b) => a.pos - b.pos || a.d - b.d);
  hx.gates = gates;
  hx.total = hx.max + gates.reduce((a, g) => a + g.len, 0);
  if (!page._pinsp) { page._pinsp = el('div', 'wkg-pinsp'); page._pinsp.setAttribute('aria-hidden', 'true'); }
  if (page._pinsp.parentNode !== sc) sc.appendChild(page._pinsp);
  page._pinsp.style.height = hx.total + 'px';
  hx.s = -1;   // the next frame maps the scroll again
}
/* scroll position to run position, scrolling each stop's own content on the way */
function pinX(hx, s) {
  let acc = 0, x = null, nx = null;
  for (const g of hx.gates || []) {
    const a = g.pos + acc; let y;
    if (x !== null || s < a) y = 0;
    else if (s <= a + g.len) { y = s - a; x = g.pos; if (y > 2 && y < g.len - 2) nx = g.pn.nextElementSibling; }
    else { y = g.len; acc += g.len; }
    y = Math.round(y);
    if (y !== g.y) { g.y = y; g.el.scrollTop = y; }
  }
  // while a long stop is being read, the sliver of the next panel at the right edge steps out (PHONE-AUDIT #19); it is
  // back as soon as the run moves on, as the hint of what comes next
  if (nx !== hx.snx) { if (hx.snx) hx.snx.classList.remove('wkg-hid'); if (nx) nx.classList.add('wkg-hid'); hx.snx = nx; }
  return clamp(x !== null ? x : s - acc, 0, hx.max);
}
/* run position (and, at a stop, how far into its content) to scroll position */
function pinS(hx, x, el, y) {
  let s = x;
  for (const g of hx.gates || []) { if (g.pos < x - 0.5) s += g.len; else if (el && g.el === el && Math.abs(g.pos - x) < 1) s += clamp(y || 0, 0, g.len); }
  return s;
}
const PG = { dragged: false };
const ease3 = (q) => 1 - Math.pow(1 - q, 3);
function ground(page, x, VIEW) {
  const hx = page._hx, st = hx.stops; if (!st.length) return null;
  let j = 0, t = 0;
  for (let i = 1; i < st.length; i++) { const ti = clamp((x + VIEW * 0.8 - st[i].pos) / (VIEW * 0.5), 0, 1); if (ti > 0) { j = i; t = ti; } else break; }
  const a = t < 1 && j ? st[j - 1].col : st[j].col, b = st[j].col, op = t < 1 && j ? t : 0;
  const [la, lb] = page._bg;
  if (hx.ga !== a) { hx.ga = a; la.style.background = a; }
  if (hx.gb !== b) { hx.gb = b; lb.style.background = b; }
  const o = op.toFixed(3); if (hx.go !== o) { hx.go = o; lb.style.opacity = o; }
  return op > 0.5 ? b : a;
}
function pageTick(time, dtMs) {
  const page = curPage; if (!page || !page._live) return;
  const hx = page._hx, V = !!page._v, dt = Math.min(0.05, (dtMs || 16.7) / 1000), VIEW = V ? innerHeight : innerWidth;
  const prevX = hx.x;
  if (hx.pin) {
    const s = page._sc.scrollTop;
    if (s !== hx.s || page._dirty) {
      hx.s = s; hx.x = pinX(hx, s); hx.lastIn = performance.now();
      page._prog.style.transform = `scaleX(${hx.total ? clamp(s / hx.total, 0, 1).toFixed(4) : 0})`;
    }
    if (hx.x !== prevX || page._dirty) page._track.style.transform = `translate3d(${(-hx.x).toFixed(2)}px,0,0)`;
  } else if (hx.native) hx.x = V ? page._sc.scrollTop : page._sc.scrollLeft;
  else {
    // Lusion's follow, measured: 0.18 of the gap per 60 Hz frame (19% at one frame, 70% at 100 ms, 99% at 400 ms)
    hx.x = RM.matches ? hx.t : hx.t + (hx.x - hx.t) * Math.pow(1 - FOLLOW, dt * 60);
    if (Math.abs(hx.t - hx.x) < 0.1) hx.x = hx.t;
    if (hx.x !== prevX || page._dirty) page._track.style.transform = V ? `translate3d(0,${(-hx.x).toFixed(2)}px,0)` : `translate3d(${(-hx.x).toFixed(2)}px,0,0)`;
  }
  if (hx.gate && hx.gate.x !== hx.gate.t) {
    const g = hx.gate; g.x = RM.matches ? g.t : g.t + (g.x - g.t) * Math.pow(1 - FOLLOW, dt * 60);
    if (Math.abs(g.t - g.x) < 0.5) g.x = g.t;
    g.el.scrollTop = g.x;
  }
  hx.vel += ((hx.x - prevX) / dt - hx.vel) * (1 - Math.exp(-dt * 10));
  if (Math.abs(hx.vel) < 4 && hx.x === prevX) hx.vel = 0;
  if (page._p._run && page._p._run.onTick && hx.vel) page._p._run.onTick(page, hx.vel, dt);
  const now = performance.now();
  if (hx.native && hx.x !== prevX) hx.lastIn = now;
  endHold(page, hx, now, dt);
  if (hx.x === prevX && !page._dirty && hx.vel === 0 && !hx.skOn && now > (page._fxUntil || 0) && (hx.settled || hx.native || V)) return;   // keep ticking until the rest-settle has had its say
  page._dirty = false;
  const x = hx.x;
  if (hx.rd) readout(page, hx, x, VIEW);
  if (hx.scr && !RM.matches) scrubGrids(hx, x, VIEW);
  if (hx.band) { const on = x >= hx.band.a && x <= hx.band.b; if (on !== hx.band.on) { hx.band.on = on; page._crew.classList.toggle('mr-on', on); } }
  if (!hx.pin) page._prog.style.transform = `scaleX(${hx.max ? (x / hx.max).toFixed(4) : 0})`;
  const col = ground(page, x, VIEW);
  const onHero = x < hx.heroW * 0.55;
  if (hx.pin) {   // the phone scrim under Back and Contact takes the ground the run is on, and shows once past the hero
    const gn = col || (page.classList.contains('wkg-tx') ? schemeOf(page._p).pc : WING[page._p.wing].ground);
    if (gn !== page._gn) { page._gn = gn; page.style.setProperty('--wkg-gnow', gn); }
    if (!onHero !== page._scr) { page._scr = !onHero; page.classList.toggle('wkg-scr', !onHero); }
  } else if (page._scr) { page._scr = false; page.classList.remove('wkg-scr'); }
  const dark = onHero ? hx.heroDark : isDark(col || (page.classList.contains('wkg-tx') ? schemeOf(page._p).pc : WING[page._p.wing].ground));
  if (dark !== page._dark) { page._dark = dark; page.classList.toggle('wkg-dark', dark); document.documentElement.dataset.ground = dark ? 'dark' : 'light'; }
  { const gc = onHero && !hx.framed ? (dark ? INK : PAPER) : (col || (page.classList.contains('wkg-tx') ? schemeOf(page._p).pc : WING[page._p.wing].ground));   // the colour under Contact, for its plate
    if (gc !== page._gc) { page._gc = gc; document.documentElement.style.setProperty('--kp-ground', gc); } }
  // the reveals: everything that has come within 88% of the view, in run order, slightly staggered
  if (hx.rvq.length) {
    const edge = x >= hx.max - 1 ? Infinity : x + VIEW * 0.88; let k = 0;   // at the end everything left comes in
    while (hx.rvq.length && hx.rvq[0].pos < edge) fire(page, hx.rvq.shift(), Math.min(k++ * 0.06, 0.42));
  }
  // settle: after the wheel stops, a text panel cut by the left edge slides fully in (or fully out, if mostly gone)
  if (!hx.native && !V && hx.tp.length && now - (hx.lastIn || 0) > 260 && !hx.settled && Math.abs(hx.t - hx.x) < 1.5 && hx.t < hx.max - 1) {   // never off the end: the end holds
    hx.settled = true;
    if (!page._p._run) { for (const t of hx.tp) { const l = t.pos + hx.pgap - x; if (l < -2 && l > -(t.w - hx.pgap) * 0.35) { hx.t = clamp(t.pos, 0, hx.max); break; } } }
    else {
      // a Media run never rests on a half-cut heading: of the nearby positions that leave every heading fully in or fully
      // out, it takes the closest
      const hs = hx.tp.filter(t => t.hw).map(t => [t.pos + t.pl, t.pos + t.pl + t.hw]);
      const ok = (p) => hs.every(([a, b]) => b <= p + 1 || a >= p + VIEW - 1 || (a >= p - 1 && b <= p + VIEW + 1));
      if (!ok(x)) {
        const c = []; hs.forEach(([a, b]) => c.push(a - 24, b + 8, a - VIEW, b - VIEW + 24));
        let best = null; for (const p0 of c) { const p = clamp(p0, 0, hx.max); if (ok(p) && (best == null || Math.abs(p - x) < Math.abs(best - x))) best = p; }
        if (best != null && Math.abs(best - x) < VIEW * 0.6) hx.t = best;
      }
    }
  }
  if (RM.matches) return;
  const light = hx.light, h = page._hero;
  // text leaving on the left fades with its position, as on Lusion's pages
  if (!light) for (const t of hx.tp) { const l = t.pos + hx.pgap - x; const o = l >= 0 ? 1 : clamp(1 + l / (t.w * 0.75), 0, 1); const r = o.toFixed(3); if (r !== t.o) { t.o = r; t.el.style.opacity = r; } }
  // the hero: the picture settles from 1.08 to 1 over the first screen and trails the page
  if (!light && h._t && !hx.heroEnd) {
    const q = clamp(x / hx.heroW, 0, 1), sc = (1.08 - 0.08 * q).toFixed(4), tr = (x * 0.3).toFixed(2);
    const tv = V ? `translate3d(0,${tr}px,0)` : `translate3d(${tr}px,0,0)`;
    if (h._s === h._t) h._t.style.transform = `${tv} scale(${sc})`;
    else {
      // framed: the frame rides with the page, the picture drifts inside it (never past its edge) and settles
      const d = hx.sw ? 0 : (q * 1.5).toFixed(3), s2 = hx.sw ? 1 : (1.08 - 0.05 * q).toFixed(4);
      h._s.style.transform = (V ? `translate3d(0,${d}%,0)` : `translate3d(${d}%,0,0)`) + ` scale(${s2})`;
    }
    hx.heroEnd = q >= 1;
  } else if (hx.heroEnd && x < hx.heroW) hx.heroEnd = false;
  // speed: frames shear and compress a touch while the run moves fast, and settle flat when it stops
  const sk = light ? 0 : clamp(hx.vel * 0.0006, -2.5, 2.5), cm = light ? 0 : Math.min(0.02, Math.abs(hx.vel) * 0.000005);
  const skW = sk !== 0 || hx.skOn; hx.skOn = sk !== 0;
  // the strip's focus: the frame nearest the middle of the view is sharp; every other one sits softer and smaller
  let foc = null, fd = Infinity;
  if (!light) for (const fr of hx.frames) { if (!fr.strip) continue; const a = Math.abs(fr.c - x - VIEW / 2); if (a < fd) { fd = a; foc = fr; } }
  const kf = 1 - Math.exp(-dt / 0.16);
  for (const fr of hx.frames) {
    const d = (fr.c - x - VIEW / 2) / VIEW;
    if (d < -1.4 || d > 1.4) continue;
    const par = light || hx.sw ? 0 : (-d * 4).toFixed(3);
    fr.m.style.transform = V ? `translate3d(0,${par}%,0) scale(${fr.s.toFixed(4)})` : `translate3d(${par}%,0,0) scale(${fr.s.toFixed(4)})`;
    // the strip, after Lusion's Synthetic Human page: the frame in focus is sharp and full size, its neighbours sit a
    // little smaller under a pre-blurred copy of themselves (opacity only, no live blur filter while scrolling)
    let fs = 1;
    if (!light && fr.strip) {
      const tgt = fr === foc ? 0 : clamp(0.6 + Math.abs(d) * 0.8, 0.6, 1);
      fr.ov = fr.ov == null ? tgt : fr.ov + (tgt - fr.ov) * kf;
      if (Math.abs(fr.ov - tgt) < 0.004) fr.ov = tgt; else page._dirty = true;
      const off = fr.ov;
      fs = 1 - 0.06 * off;
      if (!fr.blr && off > 0) blurOf(fr);
      if (fr.blr) { const bo = (off * 0.92).toFixed(2); if (bo !== fr.bo) { fr.bo = bo; fr.blr.style.opacity = bo; } }
    }
    if (!light && (skW || fr.k || fr.strip)) {
      const dep = fr.k ? (d * (fr.k % 2 ? 24 : -16)).toFixed(2) : 0;
      const tf = V ? `translate3d(0,${dep}px,0) skewY(${(-sk).toFixed(3)}deg) scale(${fs.toFixed(4)},${(fs * (1 - cm)).toFixed(4)})`
        : `translate3d(0,${dep}px,0) skewX(${(-sk).toFixed(3)}deg) scale(${(fs * (1 - cm)).toFixed(4)},${fs.toFixed(4)})`;
      if (tf !== fr.tf) { fr.tf = tf; fr.f.style.transform = tf; }
    }
  }
  // the next project grows as the end comes in
  if (hx.nx && hx.nx.m) {
    const q = clamp((x + VIEW - hx.nx.pos) / VIEW, 0, 1);
    if (q !== hx.nx.q) { hx.nx.q = q; hx.nx.m.style.transform = `scale(${(0.78 + 0.22 * ease3(q)).toFixed(4)})`; }
  }
}
gsap.ticker.add(pageTick);
/* a pre-blurred copy of a frame's picture: the 640 thumb drawn to 24 px across, then up to 120 px with smoothing (and a
   2 px canvas blur where supported), shown stretched over the picture inside its drifting layer. Made once per frame. */
function blurOf(fr) {
  if (fr.blrP || !fr.f._src) return; fr.blrP = true;
  const path = fr.f._src, im = new Image(); im.decoding = 'async';
  im.onload = () => {
    const box = fr.m, bw = box.offsetWidth || 1, bh = box.offsetHeight || 1, ar = bw / bh;
    const W = 120, H = Math.max(2, Math.round(W / ar)), w0 = 24, h0 = Math.max(2, Math.round(w0 / ar));
    const t = document.createElement('canvas'); t.width = w0; t.height = h0;
    const g0 = t.getContext('2d'), iar = im.naturalWidth / im.naturalHeight || ar;
    let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
    if (iar > ar) { sw = sh * ar; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / ar; sy = (im.naturalHeight - sh) * 0.4; }
    g0.imageSmoothingQuality = 'high'; g0.drawImage(im, sx, sy, sw, sh, 0, 0, w0, h0);
    const c = el('canvas', 'wkg-blr'); c.width = W; c.height = H; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; if ('filter' in g) g.filter = 'blur(2px)';
    g.drawImage(t, -2, -2, W + 4, H + 4);
    box.appendChild(c); fr.blr = c; fr.bo = -1;
    if (curPage) curPage._dirty = true;
  };
  im.onerror = () => {};
  im.src = THUMBABLE.test(path) ? src(thumb(path, 640)) : src(path);
}
/* the end hold: nothing advances on the momentum that reached the end. Only once the run has rested there does the
   cue fade in; then a further push (wheel, swipe or key) past NEXT_PUSH, or a click, goes on into the next project */
const NEXT_PUSH = 240, REST_MS = 380;
function endHold(page, hx, now, dt) {
  const pr = hx.pr || (hx.pr = { on: false, acc: 0, last: 0, at: 0 });
  const atEnd = hx.max > 0 && hx.x >= hx.max - 1.5 && (hx.native || hx.t >= hx.max - 0.5) && !busy;
  if (!atEnd) { if (pr.on || pr.acc) { pr.on = false; setPush(page, pr, 0); page.classList.remove('wkg-nxon'); } return; }
  if (!pr.on && now - (hx.lastIn || 0) > REST_MS) { pr.on = true; pr.at = now; setPush(page, pr, 0); page.classList.add('wkg-nxon'); }
  if (pr.on && pr.acc > 0 && now - pr.last > 450) setPush(page, pr, Math.max(0, pr.acc - dt * 900));
}
function setPush(page, pr, v) { pr.acc = v; const nx = page._track.querySelector('.wkg-next'); if (nx && nx._cue) nx._cue.style.setProperty('--acc', Math.min(1, v / NEXT_PUSH).toFixed(3)); }
/* a forward push at the end: true when it was taken (the run itself does not move) */
function pushOn(page, d) {
  const hx = page._hx, pr = hx.pr; if (!pr || !pr.on || busy) return false;
  if (d <= 0) { setPush(page, pr, 0); return false; }
  const now = performance.now(); if (now - pr.at < 220) return true;   // the cue has to be seen first
  pr.last = now; setPush(page, pr, pr.acc + d);
  if (pr.acc >= NEXT_PUSH) { pr.on = false; const nx = page._track.querySelector('.wkg-next'); if (nx && nx._open) nx._open(); }
  return true;
}
/* wheel or key travel through the vertical stop. True when the stop took it */
function gateMove(hx, d) {
  const g = hx.gate; if (!g || !g.max || !d) return false;
  if (d > 0) {
    if (hx.t < g.pos) { if (hx.t + d < g.pos) return false; hx.t = g.pos; return true; }
    if (hx.t === g.pos && g.t < g.max) { g.t = Math.min(g.max, g.t + d); return true; }
    return false;
  }
  if (hx.t > g.pos) { if (hx.t + d > g.pos) return false; hx.t = g.pos; return true; }
  if (hx.t === g.pos && g.t > 0) { g.t = Math.max(0, g.t + d); return true; }
  return false;
}
/* back from the player: the reel that was playing is brought into view */
function revealIn(page, n, force) {
  const hx = page._hx, track = page._track, box = n.closest('.mr-vsc'), at = box ? box.closest('.mr-vox') : (n.closest('.mr-col') || n);
  const pos = clamp(posIn(at, track, false) - (box ? 0 : (innerWidth - at.offsetWidth) / 2), 0, hx.max);
  if (box) { const y = clamp(n.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 24, 0, Math.max(0, box.scrollHeight - box.clientHeight)); box.scrollTop = y; if (hx.gate) hx.gate.t = hx.gate.x = y; }
  const r = n.getBoundingClientRect();
  if (!force && !box && r.left >= 0 && r.right <= innerWidth) return;
  hx.lastIn = performance.now(); hx.settled = true;
  if (hx.pin) page._sc.scrollTop = pinS(hx, pos, box, box ? box.scrollTop : 0); else if (hx.native) page._sc.scrollLeft = pos; else { hx.t = pos; hx.x = pos; }
  page._dirty = true;
}
/* ---------- the sized grid of a client's run ----------
   Columns only, so there are no holes. One cell is a 9:16 film plus its reserved label; rows are 3 on a desktop, 2 on a
   phone. Layout is measured here once; the frame loop only writes the short scrub at the start of each grid. */
function sizeGrids(page, phone) {
  const cs = getComputedStyle(page), probe = page._hero, top = parseFloat(getComputedStyle(page._track.querySelector('.mr-gp') || probe).paddingTop) || 72, bot = parseFloat(getComputedStyle(page._track.querySelector('.mr-gp') || probe).paddingBottom) || 78;
  const rows = phone ? 2 : 3, G = 8, LS = 30, H = innerHeight - top - bot;   // LS: the one label line and its gap
  let c = (H - G * (rows - 1)) / rows, w = (c - LS) * 9 / 16;
  if (phone) { const cap = (innerWidth - 36 - G) / 2; if (w > cap) { w = cap; c = w * 16 / 9 + LS; } }
  const gh = c * rows + G * (rows - 1);
  for (const g of page._track.querySelectorAll('.mr-g')) {
    if (g._ph !== phone) { g._ph = phone; g._fill(phone); }
    g.style.setProperty('--w', Math.floor(w) + 'px'); g.style.setProperty('--gh', Math.floor(gh) + 'px');
  }
  void cs;
}
function measureGrids(page) {
  const hx = page._hx, track = page._track, phone = isPhone(), scr = [], rd = [];
  let n = 0;
  for (const g of track.querySelectorAll('.mr-g')) {
    const cols = [...g.children];
    cols.forEach(c => { c.style.transform = ''; n += c.querySelectorAll('.mr-gt').length; rd.push({ pos: posIn(c, track, false), n }); });
    const ls = [], ps = [];
    for (const c of cols) { if (c.classList.contains('mr-cL') && !ps.length) ls.push(c); else if (!c.classList.contains('mr-cL')) ps.push(c); }
    if (!ps.length || !ls.length) continue;
    const last = ls[ls.length - 1], a = posIn(last, track, false) + last.offsetWidth - innerWidth;
    scr.push({ ls: phone ? [] : ls, ps: phone ? [] : ps.slice(0, 6), a, b: a + innerWidth * 0.45, q: -1 });
  }
  hx.scr = scr.length ? scr : null;
  const base = page._p._run.heroCount || 0;
  hx.rd = rd.length ? { cols: rd, base, total: n + base, v: -1 } : null;
  if (!rd.length && page._rd) page._rd.textContent = `${base}/${base}`;   // one film, no grid
}
function readout(page, hx, x, VIEW) {
  const r = hx.rd, edge = x + VIEW * 0.55; let at = r.base;
  for (const c of r.cols) { if (c.pos < edge) at = r.base + c.n; else break; }
  at = clamp(at, 1, r.total);
  if (at !== r.v) { r.v = at; page._rd.textContent = `${at}/${r.total}`; }
}
/* the gap between the big films closes from 48 to 8 while the first small columns rise 16 px, one after the other */
function scrubGrids(hx, x, VIEW) {
  for (const s of hx.scr) {
    if (s.q === 1 && x > s.b) continue;
    const q = clamp((x - s.a) / (s.b - s.a), 0, 1); if (q === s.q) continue; s.q = q;
    s.ls.forEach((c, i) => { const v = -(s.ls.length - i) * 40 * (1 - q); c.style.transform = v ? `translate3d(${v.toFixed(1)}px,0,0)` : ''; });
    s.ps.forEach((c, i) => { const k = clamp(q * 1.8 - i * 0.16, 0, 1), y = 16 * (1 - ease3(k)); c.style.transform = y > 0.05 ? `translate3d(0,${y.toFixed(1)}px,0)` : ''; });
  }
}
/* a bar on the timeline: the run travels to that video on its usual follow, and focus goes with it */
function jumpTo(page, n) {
  const hx = page._hx, box = n.closest('.mr-col') || n.closest('.wkg-fr') || n;
  const t = n.closest('.wkg-hero') ? 0 : clamp(posIn(box, page._track, false) - (innerWidth - box.offsetWidth) / 2, 0, hx.max);
  hx.lastIn = performance.now() + 400; hx.settled = true; hx.t = t;
  if (hx.pin) page._sc.scrollTo({ top: pinS(hx, t), behavior: RM.matches ? 'auto' : 'smooth' });
  else if (hx.native) page._sc.scrollTo({ left: t, behavior: RM.matches ? 'auto' : 'smooth' });
  n.focus({ preventScroll: true });
}
function pageInput() {
  addEventListener('wheel', (e) => {
    const page = curPage; if (!page || !openId || !page.contains(e.target)) return;
    const hx = page._hx, V = !!page._v;
    if (hx.pin) { if (e.deltaY > 0 && pushOn(page, e.deltaY)) e.preventDefault(); return; }   // the vertical scroller moves the run itself
    if (hx.native) {
      if (V) return;
      // a mouse wheel on a narrow window: vertical turns sideways, unless the panel under it scrolls down itself
      const pn = e.target.closest('.wkg-pn');
      if (pn && pn.scrollHeight > pn.clientHeight + 2) return;
      const vs = e.target.closest('.mr-vsc,.mr-route>.wkg-pi');
      if (vs && (e.deltaY > 0 ? vs.scrollTop < vs.scrollHeight - vs.clientHeight - 1 : vs.scrollTop > 0)) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); if (!pushOn(page, e.deltaY)) page._sc.scrollLeft += e.deltaY; }
      return;
    }
    e.preventDefault();
    if (e.ctrlKey) return;
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? (V ? innerHeight : innerWidth) : 1;
    const d = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * k;
    if (gateMove(hx, d)) { hx.lastIn = performance.now(); hx.settled = false; page._dirty = true; return; }
    if (hx.t >= hx.max - 0.5 && pushOn(page, d)) return;
    hx.t = clamp(hx.t + d, 0, hx.max); hx.lastIn = performance.now(); hx.settled = false;
  }, { passive: false });
  let down = false, sx = 0, st = 0;
  addEventListener('pointerdown', (e) => { const page = curPage; if (!page || page._v || e.pointerType !== 'mouse' || e.button !== 0 || page._hx.native || !page.contains(e.target) || e.target.closest('a,button,video')) return; down = true; sx = e.clientX; st = page._hx.t; PG.dragged = false; });
  addEventListener('pointermove', (e) => { if (!down || !curPage) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) { PG.dragged = true; curPage._sc.classList.add('wkg-drag'); } if (PG.dragged) { const hx = curPage._hx, g = hx.gate; let to = clamp(st - dx * 1.4, 0, hx.max); if (g && g.max && ((st <= g.pos && to > g.pos && g.t < g.max) || (st >= g.pos && to < g.pos && g.t > 0))) to = g.pos; hx.t = to; curPage._hx.lastIn = performance.now(); curPage._hx.settled = false; } });
  addEventListener('pointerup', () => { if (!down) return; down = false; if (curPage) curPage._sc.classList.remove('wkg-drag'); setTimeout(() => { PG.dragged = false; }, 0); });
  addEventListener('keydown', (e) => {
    const page = curPage; if (!page || !openId) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      // Tab stays on this page: Back, the page, then Contact (above the page), and round again
      if (document.documentElement.classList.contains('mr-lock') || document.querySelector('#contact.ct-on')) return;
      const seen = (n) => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden';
      const f = [...page.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),video[controls]')].filter(seen);
      const ct = [...document.querySelectorAll('#contact [aria-haspopup="dialog"]')].filter(seen);
      const ring = [...f, ...ct], a = document.activeElement, i = ring.indexOf(a);
      if (!ring.length) return;
      if (i < 0) { e.preventDefault(); ring[0].focus(); }
      else if (!e.shiftKey && (i === ring.length - 1 || i === f.length - 1)) { e.preventDefault(); ring[(i + 1) % ring.length].focus(); }
      else if (e.shiftKey && (i === 0 || i === f.length)) { e.preventDefault(); ring[(i - 1 + ring.length) % ring.length].focus(); }
      return;
    }
    const hx = page._hx, V = !!page._v;
    const fwd = e.key === 'ArrowRight' || e.key === 'PageDown' || (V && e.key === 'ArrowDown') || (e.key === ' ' && !e.target.closest('button,a,[role=link]'));
    const bk = e.key === 'ArrowLeft' || e.key === 'PageUp' || (V && e.key === 'ArrowUp');
    if (!fwd && !bk && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    if (fwd && hx.pr && hx.pr.on) { pushOn(page, NEXT_PUSH); return; }
    const step = (V ? innerHeight : innerWidth) * 0.8;
    if ((fwd || bk) && !hx.native && gateMove(hx, fwd ? step : -step)) { hx.lastIn = performance.now() + 400; hx.settled = false; page._dirty = true; return; }
    let t = e.key === 'Home' ? 0 : e.key === 'End' ? hx.max : clamp(hx.t + (fwd ? step : -step), 0, hx.max);
    hx.lastIn = performance.now() + 400; hx.settled = false;
    if (hx.pin) { hx.t = t; page._sc.scrollTo({ top: pinS(hx, t), behavior: RM.matches ? 'auto' : 'smooth' }); }
    else if (hx.native) { hx.t = t; page._sc.scrollTo({ [V ? 'top' : 'left']: t, behavior: RM.matches ? 'auto' : 'smooth' }); } else hx.t = t;
  });
  addEventListener('resize', () => { if (curPage) { layoutPage(curPage); curPage._dirty = true; } });
  // touch at the end: a fresh swipe onward (left, or up) past the push carries on; it never counts the momentum
  let tx = 0, ty = 0, tl = 0;
  addEventListener('touchstart', (e) => { if (!curPage || !e.touches[0]) return; tx = e.touches[0].clientX; ty = e.touches[0].clientY; tl = 0; }, { passive: true });
  addEventListener('touchmove', (e) => {
    const page = curPage; if (!page || !e.touches[0] || !page._hx.pr || !page._hx.pr.on) return;
    const dy = ty - e.touches[0].clientY, d = (page._hx.pin ? dy : Math.max(tx - e.touches[0].clientX, dy)) * 2.2;   // phones: up only, never sideways
    if (d > tl) { pushOn(page, d - tl); tl = d; }
  }, { passive: true });
}

/* ---------- the flight: a full-screen layer, clipped to the card and growing to the screen (GPU friendly: clip and transform) ---------- */
function flyer(fromEl, p) {
  const f = el('div', 'wkg-fly'), inner = el('div', 'wkg-fli');
  if (isText(p)) { f.style.background = 'transparent'; inner.style.background = schemeOf(p).pc; inner.appendChild(plateEl(p)); }
  else {
    let im = takeImg(p);
    if (!im) { im = el('img'); im.decoding = 'async'; const ci = !p._run && fromEl && fromEl.querySelector('img'); im.src = (ci && ci.currentSrc) || big(p.hero); }
    im.alt = ''; inner.appendChild(im);
  }
  f.appendChild(inner); f._in = inner;
  return f;
}
const lerp = (a, b, t) => a + (b - a) * t;
const rectOf = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const SCREEN = () => ({ x: 0, y: 0, w: innerWidth, h: innerHeight });
/* put the flyer at a rect: the clip shows exactly the rect, the picture inside is scaled to cover it, as the card shows it */
function flyAt(f, r, rad, zoom) {
  const W = innerWidth, H = innerHeight;
  f.style.clipPath = `inset(${r.y.toFixed(2)}px ${(W - r.x - r.w).toFixed(2)}px ${(H - r.y - r.h).toFixed(2)}px ${r.x.toFixed(2)}px round ${rad.toFixed(2)}px)`;
  const s = Math.max(r.w / W, r.h / H) * zoom;
  f._in.style.transform = `translate3d(${(r.x + r.w / 2 - W / 2).toFixed(2)}px,${(r.y + r.h / 2 - H / 2).toFixed(2)}px,0) scale(${s.toFixed(5)})`;
}
function flight(f, a, b, ra, rb, za, zb, dur, ease) {
  const st = { t: 0 };
  flyAt(f, a, ra, za);
  const tw = gsap.to(st, { t: 1, duration: dur, ease, onUpdate: () => {
    const t = st.t;
    flyAt(f, { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) }, lerp(ra, rb, t), lerp(za, zb, t));
  } });
  return track(tw);
}
/* a plate's ground carries the flight; its type fades out leaving the card and fades in arriving back */
function plateType(f, out) {
  const pl = f.querySelector('.wkg-pl'); if (!pl) return;
  pl.style.background = 'transparent';
  if (out) gsap.to(pl.children, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' });
  else gsap.fromTo(pl.children, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, delay: T.zoom * 0.6, ease: 'power2.out' });
}
function track(a) { holds.push(a); const done = () => { const i = holds.indexOf(a); if (i >= 0) holds.splice(i, 1); }; a.eventCallback('onComplete', done); return a; }
const until = (tw) => new Promise(r => { if (!tw) return r(); const prev = tw.eventCallback('onComplete'); tw.eventCallback('onComplete', () => { if (prev) prev(); r(); }); });
const onScreen = (r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0;

function lock(on) {
  document.documentElement.classList.toggle('wkg-lock', on);
  if (KP.lenis) on ? KP.lenis.stop() : KP.lenis.start();
}
function pageIn(page) {
  page._live = true; page._dirty = true; page._dark = null; page._gc = null;
  page._fxUntil = performance.now() + 2500;
  page.classList.add('wkg-show');
  if (!RM.matches && !document.documentElement.classList.contains('mr-lock')) page._hero.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
  const h = page._hero, words = h._title ? [...h._title.querySelectorAll('.wkg-ln>span')] : [];
  const bm = page._back.firstChild, bt = page._back.querySelector('.wkg-bt>span');
  const allb = page._back._allb, am = allb && allb.firstChild;
  gsap.set(allb ? [page._back, allb] : page._back, { opacity: 1 });
  if (RM.matches) { gsap.set(page._progW, { opacity: 1 }); gsap.set(am ? [bm, am] : bm, { autoAlpha: 1 }); if (h._hi) h._hi(); return; }
  // the title rises line by line out of its masks, then the info under it, then the rest
  const tops = words.map(w => w.parentNode.offsetTop), rows = [...new Set(tops)].sort((a, b) => a - b);
  words.forEach((w, i) => gsap.fromTo(w, { yPercent: 115 }, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: 0.05 + rows.indexOf(tops[i]) * 0.08 }));
  const after = 0.12 + rows.length * 0.08;
  const lede = h.querySelector('.wkg-hlede');
  if (lede && lede._src != null) splitLines([lede], true);   // measured again now: the hero's columns are final only once it shows
  if (lede && lede._lines) { lede._shown = true; gsap.fromTo(lede._lines, { yPercent: 115 }, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.08, delay: after + 0.08 }); }
  const rest = [h._meta, h.querySelector('.wkg-hcols dl'), h.querySelector('.wkg-tm'), h.querySelector('.wkg-tlogo'), h.querySelector('.wkg-tq'), h.querySelector('.wkg-tf')].filter(Boolean);
  if (rest.length) gsap.fromTo(rest, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', delay: after, stagger: 0.07 });
  gsap.fromTo(am ? [bm, am] : bm, { autoAlpha: 0, yPercent: -40 }, { autoAlpha: 1, yPercent: 0, duration: 0.9, ease: 'expo.out', delay: 0.3, stagger: 0.06 });
  gsap.fromTo(bt, { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', delay: 0.4 });
  gsap.to(page._progW, { opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.4 });
  if (h._hi) setTimeout(h._hi, 500);
}
/* before the zoom out: the page's content reverses out quickly (0.4 s), the back control first */
function contentOut(page) {
  if (RM.matches) return Promise.resolve();
  const h = page._hero, hx = page._hx;
  page._back._shut(true);
  gsap.to(page._back._allb ? [page._back.firstChild, page._back._allb.firstChild] : page._back.firstChild, { autoAlpha: 0, yPercent: -40, duration: 0.28, ease: 'power2.in' });
  gsap.to(page._progW, { opacity: 0, duration: 0.3, ease: 'power1.out' });
  if (h._title) gsap.to(h._title.querySelectorAll('.wkg-ln>span'), { yPercent: 115, duration: 0.38, ease: 'power3.in', stagger: 0.015 });
  const rest = [h._meta, h.querySelector('.wkg-hcols'), h.querySelector('.wkg-hlede'), h.querySelector('.wkg-tm'), h.querySelector('.wkg-tlogo'), h.querySelector('.wkg-tg')].filter(Boolean);
  gsap.to(rest, { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power2.in' });
  const others = [...page._track.children].filter(x => x !== h);
  gsap.to(others, { autoAlpha: 0, duration: 0.34, ease: 'power2.in' });
  if (hx.x > hx.heroW * 0.5) gsap.to(h, { autoAlpha: 0, duration: 0.34, ease: 'power2.in' });
  return new Promise(r => setTimeout(r, 400));
}
const heroHome = (page) => (page._hx.framed && page._hx.hf ? { ...page._hx.hf } : SCREEN());
async function show(id, fromEl) {
  const p = byId.get(id); if (!p) return;
  if (openId === id && curPage) return;
  if (!EXTRAS_OK) { wakeWork(); await EXTRAS; if (openId === id && curPage) return; }
  const prev = curPage;
  const sy = prev ? prev._sy : scrollY;
  openId = id; busy = true;
  wakeWork();
  const page = takePage(p); curPage = page; page._sy = sy;
  if (!page.isConnected) ROOT.appendChild(page);
  if (pre && pre.page === page) pre = null;
  lock(true); behind(true);
  if (page._laid !== innerWidth + 'x' + innerHeight) layoutPage(page);
  const fr = fromEl && fromEl.isConnected ? fromEl.getBoundingClientRect() : null;
  const flying = !RM.matches && fr && onScreen(fr);
  if (flying) {
    const f = flyer(fromEl, p);
    ROOT.appendChild(f);
    const rad = parseFloat(getComputedStyle(fromEl).borderTopLeftRadius) || 0;
    const z0 = gl && !prev ? 1 + 0.07 * gl.hover(id) : 1;
    flyAt(f, rectOf(fr), rad, z0);
    if (!prev) {
      if (gl) { gl.alpha(id, 0); gl.others(id, 0, 0.12); }
      fromEl.style.visibility = 'hidden';
      gsap.to(ui.w, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' });
    } else fromEl.style.visibility = 'hidden';
    if (isText(p)) plateType(f, true);
    const hx = page._hx;
    await until(flight(f, rectOf(fr), heroHome(page), rad, hx.framed ? 20 : 0, z0, hx.heroZ, T.zoom, 'power3.inOut'));
    if (curPage !== page) { f.remove(); return; }
    // the page is under the flyer now, the same picture at the same place; the flyer dissolves into it
    pageIn(page);
    if (gl) gl.pause(true);
    if (prev) dropPage(prev);
    fromEl.style.visibility = '';
    gsap.to(f, { autoAlpha: 0, duration: T.fade, ease: 'power1.out', onComplete: () => f.remove() });
  } else {
    if (prev) { prev._live = false; }
    if (gl) gl.pause(true);
    page.classList.add('wkg-show');
    if (!RM.matches) await until(track(gsap.fromTo(page, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform' })));
    else await until(gsap.fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }));
    if (prev) dropPage(prev);
    if (ui.w) gsap.set(ui.w, { autoAlpha: 0 });
    pageIn(page);
  }
  page._back.focus({ preventScroll: true, focusVisible: false });
  busy = false; flush();
}
async function hide() {
  if (!openId || !curPage) return;
  const id = openId, page = curPage; busy = true;
  page.querySelectorAll('video').forEach(v => v.pause());
  // the list stays where it was left (a phone can lose the document's scroll while the page is open)
  if (page._sy != null && Math.abs(scrollY - page._sy) > 2) scrollTo(0, page._sy);
  const card = ui.cards && ui.cards.find(c => c.dataset.id === id);
  const p = byId.get(id);
  const slot = p && p._run ? (reels && reels.boxOf(p)) : card && card.querySelector('.wkg-m');
  if (slot) { const r = slot.getBoundingClientRect(); if (!onScreen(r)) scrollTo(0, scrollY + r.top - (innerHeight - r.height) / 2); }
  const sr = slot && slot.getBoundingClientRect();
  const canFly = !RM.matches && sr && onScreen(sr);
  if (gl) gl.pause(false);
  if (canFly) {
    // no rewind: the content goes, the hero picture is cut back in where it was, then it zooms into its card
    await contentOut(page);
    const hx = page._hx, home = heroHome(page), rH = hx.framed ? 20 : 0;
    const f = flyer(slot, p);
    const pl = f.querySelector('.wkg-pl'); if (pl) { pl.style.background = 'transparent'; gsap.set(pl.children, { autoAlpha: 0 }); }
    ROOT.appendChild(f);
    flyAt(f, home, rH, hx.heroZ);
    if (gl) { gl.alpha(id, 0); gl.others(id, 0); }
    await until(gsap.fromTo(f, { autoAlpha: 0 }, { autoAlpha: 1, duration: hx.x > 2 ? 0.26 : 0.18, ease: 'power1.out' }));
    dropPage(page);
    openId = null; curPage = null; delete document.documentElement.dataset.ground; document.documentElement.style.removeProperty('--kp-ground');
    lock(false);
    // back to where the list was left, unless the card coming back is not in view there (after carrying on through Next
    // project it can be elsewhere): then the card comes to the middle of the screen. One target, one native scroll.
    { let y = page._sy != null ? page._sy : scrollY; const r = slot.getBoundingClientRect(), top = r.top + scrollY - y;
      if (top < 0 || top + r.height > innerHeight) y = y + top - (innerHeight - r.height) / 2;
      if (Math.abs(scrollY - y) > 2) scrollTo(0, y); }
    slot.style.visibility = 'hidden';
    const sr2 = slot.getBoundingClientRect();
    const rad = parseFloat(getComputedStyle(slot).borderTopLeftRadius) || 0;
    if (isText(p)) plateType(f, false);
    const tw = flight(f, home, rectOf(sr2), rH, rad, hx.heroZ, 1, T.zoom, 'power3.inOut');
    gsap.to(ui.w, { autoAlpha: 1, duration: 0.6, ease: 'power2.out', delay: T.zoom * 0.45 });
    if (gl) setTimeout(() => gl.others(id, 1, 0.14), T.zoom * 450);
    await until(tw);
    if (gl) gl.alpha(id, 1);
    slot.style.visibility = '';
    requestAnimationFrame(() => requestAnimationFrame(() => f.remove()));
  } else {
    if (!RM.matches) await until(track(gsap.to(page, { yPercent: 100, duration: 0.7, ease: 'power3.inOut' })));
    dropPage(page);
    openId = null; curPage = null; delete document.documentElement.dataset.ground; document.documentElement.style.removeProperty('--kp-ground');
    lock(false);
    if (page._sy != null && Math.abs(scrollY - page._sy) > 2) scrollTo(0, page._sy);
    gsap.set(ui.w, { autoAlpha: 1 });
    if (gl) { gl.others('', 1, 0.0001); }
  }
  if (gl) gl.measure();
  busy = false; behind(false);
  if (card) card.focus({ preventScroll: true });
  else if (p && p._run && slot) slot.focus({ preventScroll: true });
  flush();
}
let queued = null;                       // the last click made during a flight, run when it lands
function flush() { if (!queued) return; const q = queued; queued = null; requestAnimationFrame(q); }
/* the tab's title follows the route: the project or client that is open, Software or Media on the lists, and the page's
   own title (whatever index.html says) at home. Called wherever the hash changes, so Back puts the old one back */
const TITLE0 = document.title, WHO = 'Kirtan Purohit';
function syncTitle() {
  const h = location.hash, m = /^#work\/([\w-]+)$/.exec(h), p = m && byId.get(m[1]);
  let t = '';
  if (p) t = clean(p.name);
  else if (/^#media\/./.test(h)) t = (reels && reels.titleOf && reels.titleOf(h)) || WING.media.title;
  else if (h === '#media') t = WING.media.title;
  else if (h === '#work') t = WING.software.title;
  const next = t ? `${t} | ${WHO}` : TITLE0;
  if (document.title !== next) document.title = next;
}
function go(id, fromEl, inPlace) {
  if (busy) { queued = () => go(id, fromEl && fromEl.isConnected ? fromEl : null, true); return; }
  const h = (byId.get(id) && byId.get(id).hash) || '#work/' + id;
  if (location.hash !== h) {
    const st = history.state || {};
    if (inPlace && openId) history.replaceState({ wkg: id, pushed: !!st.pushed }, '', h);
    else history.pushState({ wkg: id, pushed: true }, '', h);
  }
  syncTitle();
  show(id, fromEl);
}
function close() {
  if (busy) { queued = close; return; }
  if (history.state && history.state.pushed) history.back();
  else { history.replaceState(null, '', location.pathname + location.search + (curPage && curPage._p._run ? '#media' : '#work')); syncTitle(); hide(); }
}
function route() {
  const c = readCat(); if (c !== cat) setCat(c, true);
  if (/^#media(\/|$)/.test(location.hash) && tab !== 'media') setTab('media');
  if (reels && tab === 'media' && ui.mr.isConnected) reels.route();
  const m = location.hash.match(/^#work\/([\w-]+)$/);
  if (m && ALIAS[m[1]]) { history.replaceState(history.state, '', location.pathname + location.search + '#work/' + ALIAS[m[1]]); return route(); }
  if (m && !byId.has(m[1])) history.replaceState(null, '', location.pathname + location.search + '#work');   // hidden or unknown: the list
  const run = reels && reels.runOf(location.hash);
  syncTitle();
  if (m && byId.has(m[1])) show(m[1]); else if (run) show(run); else hide();
}

let EXTRAS = Promise.resolve(), EXTRAS_OK = false;   // the page-only data, see init()
async function load(path) { const r = await fetch(BASE + path); if (!r.ok) throw new Error(`work-g: ${path} ${r.status}`); return r.json(); }
async function init() {
  if (!ROOT) return;
  const style = el('style'); style.id = 'wkg-style'; style.textContent = CSS; document.head.appendChild(style);
  if (DISC_OFF) document.documentElement.classList.add('kp-nodisc');
  if (!document.getElementById('wkg-fonts')) { const lk = el('link'); lk.id = 'wkg-fonts'; lk.rel = 'stylesheet'; lk.href = FONTS; document.head.appendChild(lk); }
  let fontsP = Promise.resolve();
  try {
    const quiet = (path) => fetch(BASE + path).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
    const [sw, md, br] = await Promise.all([load('software/manifest.json'), load('media/manifest.json'), load('media/brands.json').catch(() => ({}))]);
    // what only a project page reads (behind the scenes, curated pictures, briefs) waits until #work is near or a page is
    // linked to: the first screen does not pay for it (PHONE-AUDIT #9a). show() waits for it before it builds a page
    const obj = (o) => (o && typeof o === 'object' ? o : {});
    EXTRAS = nearWork.then(() => Promise.all(['software/bts.json', 'media/bts.json', 'software/media-notes.json', 'media/media-notes.json', 'software/briefs.json', 'media/briefs.json'].map(quiet)))
      .then(([bs, bm, ns, nm, bs2, bm2]) => { BTS = { ...obj(bs), ...obj(bm) }; NOTES = { ...obj(ns), ...obj(nm) }; BRIEFS = { ...obj(bs2), ...obj(bm2) }; EXTRAS_OK = true; });
    SW = sw.filter(p => !HIDE.has(p.id) && !ALIAS[p.id] && p.hidden !== true);
    DATA.software = arrange(SW);
    DATA.media = spread(md.filter(p => !HIDE.has(p.id) && p.hidden !== true));
    BRANDS = (br && Array.isArray(br.brands) ? br.brands : []).map(clean).map(s => s.trim()).filter(Boolean);
  } catch (err) {
    console.warn(err);
    ROOT.innerHTML = '<div class="wkg"><div class="wkg-head"><h2 class="wkg-title">Work</h2></div></div>';
    return;
  }
  ALL = [...DATA.software, ...DATA.media];
  byId = new Map(ALL.map(p => [p.id, p]));
  cat = readCat();
  // the text face at the weights used here, before anything is measured or drawn (no swap mid reveal)
  if (document.fonts) fontsP = Promise.race([Promise.all(['400 20px', '500 20px', '500 120px', '600 20px'].map(s => document.fonts.load(`${s} ${FF}`))), new Promise(r => setTimeout(r, 2500))]);
  // the listing's smooth wheel (Lenis, set up in index.html) gets the same curve, from #work down only: above #work
  // Lenis passes the native wheel through, so the landing and the numbers are untouched. Lenis damps with
  // 1 - exp(-lerp * 60 * dt), so lerp = -ln(1 - FOLLOW) gives FOLLOW per frame.
  if (KP.lenis && KP.lenis.options) KP.lenis.options.lerp = -Math.log(1 - FOLLOW);
  buildListing();
  await fontsP;
  /* the card canvas (a full-screen WebGL context, its shader and textures) is made when #work is within two screens, not at
     load. Until then the cards are their plain pictures, still hidden for their reveal, so the swap is never seen. */
  ui.w.classList.remove('wkg-glon');
  nearWork.then(async () => {
    const g = await initGL(); if (!g) return;
    gl = g;
    const cards = ui.cards || [], list = ui.shown || [];
    if (cards.length && list.length === cards.length) {
      cards.forEach(c => { const mi = c.querySelector('.wkg-mi'), im = mi && mi.querySelector('img'); if (mi) { gsap.killTweensOf(mi); gsap.set(mi, { clearProps: 'transform' }); } if (im) { gsap.killTweensOf(im); gsap.set(im, { clearProps: 'transform' }); } });
      gl.setCards(list, cards);
      cards.forEach(c => { if (REVEALED.has(c.dataset.id)) gl.reveal(c.dataset.id, 0, 0); });
    }
    if (curPage) gl.pause(true);
  });
  if (/^#media(\/|$)/.test(location.hash)) tab = 'media';
  setTab(tab, true);
  headIn();
  pageInput();
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  // anything that changes the page height (the numbers booting, fonts, a tab) moves the triggers
  if (window.ResizeObserver) { let lh = 0, t = 0; new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - lh) > 2) { lh = h; clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 120); } }).observe(document.body); }
  if (/^#(work|media)\//.test(location.hash)) await new Promise(r => setTimeout(r, 0));   // a deep link: the listing and the page are two tasks
  route();
  // #media has no element of its own to land on (#work does, the browser jumps there): land on the work section by
  // hand, and keep it there while the page above it settles (numbers, fonts), until the visitor moves
  if (/^#media(\/|$)/.test(location.hash) && !openId) {
    const toWork = () => { const w = document.getElementById('work'); if (!w || openId) return; const y = Math.round(w.getBoundingClientRect().top + scrollY); if (Math.abs(scrollY - y) < 2) return; if (KP.lenis) KP.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
    let held = true, moved = false; const EV = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const mv = () => { moved = true; stop(); }, stop = () => { held = false; EV.forEach(t => removeEventListener(t, mv, true)); };
    EV.forEach(t => addEventListener(t, mv, { capture: true, passive: true }));
    const t0 = performance.now(), hold = () => { if (!held) return; toWork(); if (performance.now() - t0 < 2500) requestAnimationFrame(hold); else stop(); };
    toWork(); requestAnimationFrame(hold);
    if (document.readyState !== 'complete') addEventListener('load', () => { if (!moved) toWork(); }, { once: true });
  }
  window.__wkg = {
    go, close, show, hide, get openId() { return openId; }, get gl() { return !!gl; }, get glApi() { return gl; }, setCat, get cat() { return cat; },
    point: (x, y) => gl && gl.point(x, y),
    hold(t) { holds.forEach(a => { a.pause(); a.progress(t); }); },
    release() { holds.forEach(a => a.play()); },
    get busy() { return busy; },
    get page() { return curPage && curPage._hx; },
  };
}

init();
