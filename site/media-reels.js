/* The Media tab: client boxes, Viral Reels, DVCs, and a calm player around Instagram's own embed.
   A client page is the Software project page: this file describes its run (a project object with _run) and work-g.js
   builds and drives it, so entry, scroll, reveals and next project are one system.
   A self-contained DOM layer (classes prefixed mr-), loaded by work-g.js the first time Media opens, so the Software
   tab never pays for it. No video is hosted here. The embed iframe is created only on click and removed on close.

   Views live in the hash, so the back button and shared links work:
     #media                 the folders
     #media/<slug>          one client, or #media/viral, #media/dvc
     #media/<slug>/<id>     that view with the player open

   Data: ../content/media/reels.json. Every value from it goes in through textContent or a validated attribute. */

const INK = '#0c0d0f', PAPER = '#f1f2f0', BLUE = '#c9d8f7', PINK = '#f2a7b6', SKY = '#7d9bf0', COBALT = '#1c3bb0', NAVY = '#0f2545';
const FF = '"Schibsted Grotesk",system-ui,sans-serif';
const ARRIVE = 'cubic-bezier(.16,1,.3,1)';
const RM = matchMedia('(prefers-reduced-motion: reduce)');
/* a phone the way work-g.js sees one (its PHQ): narrow, or a phone on its side (short and coarse). LQ is only the second */
const PHQ = '(max-width:760px),(pointer:coarse) and (max-height:500px)';
const LQ = '(pointer:coarse) and (max-height:500px)';
const PHONEQ = matchMedia(PHQ);

/* his order. Each name maps to the existing project page where one is live */
/* the clients he picked; the index and the Next order sort them by total views at load */
const CLIENTS = [
  ['gujarat-titans', 'Gujarat Titans'], ['palladium', 'Palladium'], ['shivalik', 'Shivalik'], ['zepto', 'Zepto'],
  ['sahaj-group', 'Sahaj Group'], ['pyc-navratri', 'PYC Navratri'], ['abh-developers', 'ABH Developers'],
  ['lofy', 'Lofy'], ['crav-social', 'Crav Social'], ['gcrankz', 'GCrankz'], ['nagar-sheth', 'Nagar Sheth'],
  ['oliver-brown', 'Oliver Brown'], ['landmark-volkswagen', 'Landmark Volkswagen'], ['kaavyaratna', 'Kaavyaratna'],
  ['mmv', 'MMV'], ['qutone-ceramics', 'Qutone Ceramics'], ['puffizza', 'Puffizza'], ['saladific', 'Saladific'],
  ['credai-shelter', 'CREDAI Shelter'], ['sj-sangath', 'SJ Sangath'], ['onnirico', 'Onnirico'],
  ['united-farmers-creamery', 'United Farmers Creamery'], ['gallons-premium-water', 'Gallons Premium Water'],
  ['rago-dental', 'RAGO Dental'], ['fit-and-flex-mini-bites', 'Fit and Flex Mini Bites'],
  ['stellar-skoda', 'Stellar Skoda'], ['eklingji-skylights', 'Eklingji Skylights'],
  ['pawfect', 'Pawfect'], ['eve-for-her', 'Eve For Her'], ['swastik-42', 'Swastik 42'],
  ['gallant-tmt', 'Gallant TMT'], ['craywingz', 'CrayWingz'], ['ultrapop', 'UltraPop'],
  ['vishwanath-builders', 'Vishwanath Builders'], ['cautio', 'Cautio'], ['formula-rc', 'Formula RC'],
  ['gls-institute-of-design', 'GLS Institute of Design'], ['space-arcade', 'Space Arcade'],
];
/* his cut of 25 Nov 2026: these clients leave Media (no folder, no client page, out of "Next client"). Their films can
   still sit in Favourites, Viral, DVCs or Documentaries when he picked them there */
const CLIENT_CUT = new Set(['nearhood', 'eklingji-skylights', 'pawfect', 'eve-for-her', 'swastik-42', 'vishwanath-builders', 'cautio',
  'indus-university', 'gls-institute-of-design', 'space-arcade', 'craywingz', 'redbull', 'red-bull']);
for (let i = CLIENTS.length - 1; i >= 0; i--) if (CLIENT_CUT.has(CLIENTS[i][0])) CLIENTS.splice(i, 1);

/* logos by rule come from data only. The manifest lists four; a new file goes in content/media/logos/ and is named here,
   e.g. shivalik: 'media/logos/shivalik.svg'. No entry: the box sets the client's name */
/* logos by rule come from data only: [file, width/height of the ink, one-colour file (takes the box's ink)]. Full-colour
   marks are shown as they are, on paper or blue. Kaavyaratna's mark arrived named eve-for-her.svg */
const LOGO_FILES = {
  'gujarat-titans': ['media/logos/gujarat-titans.png', 1.341], zepto: ['media/logos/zepto-ink.png', 2.847, 1], 'crav-social': ['media/logos/crav-social.png', 0.996],
  'shivalik': ['media/logos/shivalik.svg', 2.857],
  'palladium': ['media/logos/palladium-ahmedabad.svg', 1.787],
  'lofy': ['media/logos/lofy-clean.png', 1.887],
  'kaavyaratna': ['media/logos/eve-for-her.svg', 6.0],
  'abh-developers': ['media/logos/abh-developers.svg', 4.11],
  'space-arcade': ['media/logos/space-arcade.svg', 3.409],
  'stellar-skoda': ['media/logos/stellar-skoda.svg', 3.191],
  'qutone-ceramics': ['media/logos/qutone-ceramics-trim.svg', 4.63],
  'oliver-brown': ['media/logos/oliver-brown.svg', 1.813],
  'sj-sangath': ['media/logos/sj-sangath-clean.svg', 1.0],
  'landmark-volkswagen': ['media/logos/landmark-volkswagen-trim.svg', 2.564],
  'united-farmers-creamery': ['media/logos/united-farmers-creamery-trim.svg', 1.508],
  'mmv': ['media/logos/mmv.svg', 2.703],
  'vishwanath-builders': ['media/logos/vishwanath-builders.png', 3.659],
  'eklingji-skylights': ['media/logos/eklingji-skylights-trim.png', 1.214],
  'pawfect': ['media/logos/pawfect.svg', 2.885],
  'puffizza': ['media/logos/puffizza.svg', 1.0],
  'ultrapop': ['media/logos/ultrapop-trim.png', 4.195],
  'credai-shelter': ['media/logos/credai-shelter.png', 3.399],
};
/* the clients that get a folder on the Media index, his 32: [logo file in media/logos/ or null, stills in media/].
   The logo is shown in its own colours on white; null sets the name in type (saladific.svg is Spectra's mark and
   Kaavyaratna's file is Eve For Her's, so both are set in type). The stills are three different films where a client
   has them, never two frames of one film */
const FOLDERS = {
  'gujarat-titans': ['gujarat-titans.png', ['clips/DXy4K0rN6La-a.w720.webp', 'clips/DYwNxIVtufV-a.w720.webp', 'clips/DPOR0FcDXSc-a.w720.webp']],
  'palladium': ['palladium-ahmedabad.svg', ['clips/DEZQubay0VJ-a.w720.webp', 'clips/DZ7ptixqF7G-a.w720.webp', 'clips/DD1AZmYTxOT-a.w720.webp']],
  'shivalik': ['shivalik.svg', ['clips/Cxff4XhMhZb-a.w720.webp', 'clips/DBsuJicvdai-a.w720.webp', 'clips/DFUWbvTIh1I-a.w720.webp']],
  'zepto': ['zepto-ink.png', ['clips/DMIBZh7Poq8-a.w720.webp', 'clips/DKtfZCcuxfE-a.w720.webp', 'reels/DMND5BgPdrp.w720.webp']],
  'sahaj-group': [null, ['clips/DPEY4WZjPl4-a.w720.webp', 'clips/DP8FI4VkSEi-a.w720.webp', 'clips/DPeDj99EUgL-a.w720.webp']],
  'pyc-navratri': [null, ['clips/Cx8HJmtPneV-a.w720.webp', 'clips/DOgSEg8iTbE-a.w720.webp', 'clips/DATRDLtuAJG-a.w720.webp']],
  'abh-developers': ['abh-developers.svg', ['reels/C969v-AM7dM.w720.webp', 'clips/C52iiZpt6Yl-a.w720.webp', 'reels/DCWiH6XIFzo.w720.webp']],
  'lofy': ['lofy-clean.png', ['clips/DGBB5CVyTsr-a.w720.webp', 'clips/DC1k1Ctvzh5-a.w720.webp', 'clips/DFijocvzCmY-a.w720.webp']],
  'crav-social': ['crav-social.png', ['clips/DABIAU2MOqE-a.w720.webp', 'clips/DE1oY6eMCFk-a.w720.webp', 'reels/DJa7mLhRlk6.w720.webp']],
  'gcrankz': [null, ['clips/DDZW5d6zAt8-a.w720.webp', 'clips/DDL5FN7TmxG-a.w720.webp', 'clips/DDw92OCSsPx-a.w720.webp']],
  'nagar-sheth': [null, ['clips/DP4B1ijkkXV-a.w720.webp']],
  'oliver-brown': ['oliver-brown.svg', ['clips/DEAJngOSyg--a.w720.webp', 'clips/DEFTlkFseNO-a.w720.webp', 'clips/DD-KJknMQZy-a.w720.webp']],
  'kaavyaratna': [null, ['reels/DNF_sEUppj7.w720.webp', 'reels/DAaRQPwvm6c.w720.webp', 'reels/DG6Dt0UMiHc.w720.webp']],
  'mmv': ['mmv.svg', ['clips/DFC86iovl1n-a.w720.webp', 'clips/DFp12QIsxdk-a.w720.webp', 'reels/DBRDyQOvG5e.w720.webp']],
  'qutone-ceramics': ['qutone-ceramics-trim.svg', ['clips/DBgd2QDyfYp-a.w720.webp', 'clips/C8PdS6Fyafn-a.w720.webp', 'clips/DA3eYhWSWz0-a.w720.webp']],
  'puffizza': ['puffizza.svg', ['clips/DEwRizhPpMq-a.w720.webp', 'clips/CwhLyonsecf-a.w720.webp', 'clips/C1h5ERWMXy_-a.w720.webp']],
  'saladific': [null, ['clips/C8Qxg6LPZTa-a.w720.webp', 'clips/C71RiopM8t9-a.w720.webp', 'clips/C8CMStlPC7f-a.w720.webp']],
  'credai-shelter': ['credai-shelter.png', ['clips/DCRlAPaIb9w-a.w720.webp', 'clips/DCO-rz8qydd-a.w720.webp', 'clips/DCrUAaioqAX-a.w720.webp']],
  'sj-sangath': ['sj-sangath-clean.svg', ['reels/DKgjoY-RYib.w720.webp', 'clips/DBWG62eCk7E-a.w720.webp', 'clips/DBOgYjsgubj-a.w720.webp']],
  'onnirico': [null, ['reels/DMIYV8ZB859.w720.webp', 'reels/DMNu7AHN7yt.w720.webp', 'reels/DNVholeBkMe.w720.webp']],
  'united-farmers-creamery': ['united-farmers-creamery-trim.svg', ['clips/CwjefmBIlQc-a.w720.webp', 'clips/CyQnB7PyDs6-a.w720.webp', 'clips/C8BwbB3P7i_-a.w720.webp']],
  'gallons-premium-water': [null, ['reels/DO-V1GnDG0V.w720.webp', 'reels/DOu9g_dgX3E.w720.webp', 'reels/DOyOnM8gfku.w720.webp']],
  'rago-dental': [null, ['reels/DVNHZFYEk2Y.w720.webp', 'clips/DGXuwKLNrUn-a.w720.webp']],
  'fit-and-flex-mini-bites': [null, ['clips/CxiUrg0MHKX-a.w720.webp', 'clips/Cv156g0ggYf-a.w720.webp', 'clips/Cvj9qb7gKFb-a.w720.webp']],
  'stellar-skoda': ['stellar-skoda.svg', ['clips/C44Zr8pImlR-a.w720.webp', 'clips/DGhd3Yytl-5-a.w720.webp']],
  'eklingji-skylights': ['eklingji-skylights-trim.png', ['clips/DGyAXLdsjHc-a.w720.webp']],
  'eve-for-her': [null, ['clips/DCt7U00zw4x-a.w720.webp', 'reels/DBToZsdp5Gn.w720.webp']],
  'gallant-tmt': [null, ['clips/DGFx7p6PeG0-h20.jpg']],
  'craywingz': [null, ['clips/C5K7zMAN--e-a.w720.webp']],
  'ultrapop': ['ultrapop-trim.png', ['clips/DGnzvHzSxdu-a.w720.webp', 'reels/DFvIiBLyjdn.w720.webp', 'reels/DF5b_BiKV8E.w720.webp']],
  'vishwanath-builders': ['vishwanath-builders.png', ['reels/DJgHqwuSGUn.w720.webp']],
  'landmark-volkswagen': ['landmark-volkswagen-trim.svg', ['reels/C7ElzfwsP-x.w720.webp']],
  'formula-rc': [null, ['clips/DfUW2zAPhQD-a.w720.webp', 'clips/DfFEA5wSUAE-a.w720.webp', 'clips/DfPQVS1yuwK-a.w720.webp']]
};
/* the only local loop that can be matched to a posted reel by its caption. The other loops play with no view count */
const REEL_LOOPS = { DafD9ScPKs1: 'media/zepto/chocolate-day-loop.mp4' };
const NEVER = new Set(['DGC1_GpMidX']);
/* the film each client opens on, his picks. Anyone else opens on their most-viewed video */
const HEROES = { zepto: 'DMIBZh7Poq8', shivalik: 'C76oh4MsHAT', 'gujarat-titans': 'DTuCVJTiFmv' };
const JT_CREW = 'Five cities, two days each. One drone, one iPhone, three videographers. I was the iPhone.';
const TONES = [[PAPER, INK], [NAVY, PAPER], [BLUE, NAVY], [INK, PAPER], [PAPER, NAVY], [COBALT, PAPER], [INK, BLUE], [BLUE, INK], [SKY, INK], [NAVY, BLUE], [PAPER, COBALT], [INK, PINK]];

const STYLES = `
/* client folders: a white card with the logo in its own colours; on hover three of the client's films break in as strips */
.mr-fg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:var(--lg,24px);row-gap:clamp(32px,3.4vw,56px)}
@media (max-width:1100px){.mr-fg{grid-template-columns:repeat(2,minmax(0,1fr))}}
.mr-fc{display:block;min-width:0}
.mr .mr-fm{position:relative;display:block;aspect-ratio:16/10;border-radius:var(--rad,16px);overflow:hidden;background:#fff;color:${INK};box-shadow:inset 0 0 0 1px rgba(12,13,15,.08);isolation:isolate;cursor:pointer}
.mr-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.mr-fk{position:absolute;inset:0;z-index:2;display:grid;place-items:center;transition:opacity .25s,transform .6s cubic-bezier(.2,.8,.2,1)}
.mr-fk img{display:block;object-fit:contain}
.mr-fk b{font:500 clamp(24px,2.3vw,42px)/1.06 ${FF};letter-spacing:-.03em;text-align:center;padding:0 18px .22em;color:${INK};text-wrap:balance}
.mr-fm.mr-on .mr-fk{opacity:0;transform:scale(.96)}
.mr-ff{position:absolute;inset:0;z-index:1;display:flex;gap:3px}
.mr-fm.mr-on .mr-ff{background:${INK}}
.mr-fp{position:relative;flex:1 1 0;overflow:hidden}
.mr-fp i{position:absolute;top:0;bottom:0;background-repeat:no-repeat;opacity:0;transform:translate3d(0,var(--o),0);transition:transform .5s cubic-bezier(.2,.9,.25,1) var(--d),opacity .16s linear var(--d)}
.mr-fm.mr-on .mr-fp i{opacity:1;transform:none}
.mr-fm.mr-off .mr-fp i{transition-duration:.26s,.14s;transition-delay:0s}
.mr-fs{position:absolute;inset:0;z-index:2;background:linear-gradient(180deg,rgba(12,13,15,0) 35%,rgba(12,13,15,.78));opacity:0;transition:opacity .4s .15s;pointer-events:none}
.mr-fm.mr-on .mr-fs{opacity:1}
.mr-fl{position:absolute;left:clamp(18px,2vw,30px);right:clamp(18px,2vw,30px);bottom:clamp(16px,1.8vw,28px);z-index:3;margin:0;color:#fff;font:500 clamp(24px,2.4vw,44px)/1 ${FF};letter-spacing:-.025em;text-wrap:balance;padding-bottom:.22em;margin-bottom:-.22em;pointer-events:none}
.mr-fl .mr-fsm{font-size:.5em;opacity:.8;margin-left:.3em;letter-spacing:0}
.mr-fl span{display:inline-block;opacity:0;transform:translate3d(0,.4em,0);clip-path:inset(0 0 100% 0)}
.mr-fm.mr-on .mr-fl span{animation:mr-fin .55s cubic-bezier(.2,.9,.25,1) forwards;animation-delay:calc(.22s + var(--w) * 40ms)}
@keyframes mr-fin{0%{opacity:1;clip-path:inset(0 0 100% 0);transform:translate3d(-.08em,.4em,0)}35%{transform:translate3d(.06em,0,0);text-shadow:-2px 0 rgba(255,60,90,.8),2px 0 rgba(60,140,255,.8)}100%{opacity:1;clip-path:inset(0 0 -30% 0);transform:none;text-shadow:none}}
.mr-fmeta{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:14px;cursor:pointer}
.mr-fnm{font:500 clamp(17px,1.3vw,21px)/1.2 ${FF};letter-spacing:-.02em;padding-bottom:.22em;margin-bottom:-.22em}
.mr-fv{display:none;font:500 14px/1.3 ${FF};color:rgba(12,13,15,.76);white-space:nowrap}
@media (hover:none){.mr-fv{display:block}}
@media (hover:hover){.mr-fmeta{display:none}.mr-fg{row-gap:var(--lg,24px)}}
@media (max-width:1100px) and (min-width:761px){.mr-fk b{font-size:clamp(26px,3.4vw,40px)}.mr-fl{font-size:clamp(28px,3.6vw,44px)}}
/* phones: two cards to a row (PHONE-AUDIT #1), logo only, the views under each; a name set in type gets a size that fits */
@media (max-width:760px){
  .mr-fg{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;row-gap:20px}
  .mr .mr-fm{aspect-ratio:4/3;border-radius:12px}
  .mr-fk img{transform:scale(1.2)}
  .mr-fk b{font-size:clamp(17px,5.2vw,22px);line-height:1.1;letter-spacing:-.025em;padding:0 10px .22em}
  .mr-fmeta{margin-top:8px}.mr-fv{font-size:13px}.mr-fvf{display:none}
}
/* the index before its data lands: the same rows and the same number of cards, so nothing below moves when it does (#3) */
.mr-skel .mr-fm{cursor:default}
.mr-skel .mr-rth i{display:block;flex:none;width:36px;height:64px;border-radius:6px;background:rgba(12,13,15,.08)}
@media (prefers-reduced-motion:no-preference){.mr-skel .mr-fm,.mr-skel .mr-rth i{animation:mr-wait 1.4s ease-in-out infinite alternate}}
@keyframes mr-wait{from{opacity:1}to{opacity:.55}}
.mr-fm:focus-visible{outline:3px solid ${COBALT};outline-offset:3px}
@media (prefers-reduced-motion:reduce){
  .mr-fk,.mr-fp i,.mr-fs{transition:opacity .2s linear!important;transform:none!important}
  .mr-fm.mr-on .mr-fl span{animation:none;opacity:1;transform:none;clip-path:none}
}
/* a landscape film keeps its shape in a run: two to a column, each at its own ratio */
.mr-col.mr-cW{--rows:2;--mh:calc((var(--gh,600px) - var(--g)) / 2 - 30px);width:min(calc(var(--mh) * var(--ar)),calc(100vw - 36px));grid-template-columns:minmax(0,1fr);grid-template-rows:repeat(2,minmax(0,1fr))}
.mr-col.mr-cW1{--rows:1;--mh:calc(var(--gh,600px) - 30px);grid-template-rows:minmax(0,1fr);width:min(calc(var(--mh) * var(--ar)),70vw,calc(100vw - 36px))}
.mr-cW1 .mr-gt.mr-hit{width:min(calc(var(--mh) * var(--tar)),70vw,calc(100vw - 36px))!important}
.mr-cW .mr-gt.mr-hit{width:min(calc(var(--mh) * var(--tar)),calc(100vw - 36px))}
.mr-cW .mr-gt .mr-tm{flex:none;width:100%;aspect-ratio:var(--tar);max-height:var(--mh)}
.mr-cW .mr-tlb{width:100%}
/* the GT vox pops: just the thumbnails, no backing */
.mr-vxg .mr-tm{background:transparent}
/* a landscape opening film */
.wkg-page.mr-run .wkg-hero.wkg-hfr:has(.mr-hland){width:calc(46vw + 44vw)}
.wkg-page.mr-run .wkg-hfr .wkg-hm.mr-hland{width:min(calc(var(--hh) * var(--har)),44vw);height:min(var(--hh),calc(44vw / var(--har)))}
.mr-hlab.mr-hlw{width:min(calc(var(--hh) * var(--har)),44vw);top:calc(var(--top) + min(var(--hh),calc(44vw / var(--har))) + 8px)}
.mr-tnote{position:absolute;left:8px;bottom:8px;z-index:3;max-width:calc(100% - 16px);padding:6px 9px;border-radius:7px;background:${INK};color:${PAPER};font-size:12px;line-height:1.25;font-weight:500;pointer-events:none}
.mr-note{display:block;margin-top:4px;font-size:13px;line-height:1.3;font-weight:500;letter-spacing:-.005em}
/* clients, tier one: even cards, a fixed mark zone over a fixed two-line caption */
.mr-boxes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:clamp(6px,.6vw,10px)}
.mr-box{position:relative;display:grid;grid-template-rows:minmax(0,1fr) 44px;row-gap:10px;min-width:0;aspect-ratio:5/4;padding:14px;border-radius:var(--rad);background:var(--bx);color:var(--fx);box-shadow:inset 0 0 0 1px rgba(12,13,15,.1);overflow:hidden;container-type:inline-size;transition:transform .5s ${ARRIVE}}
.mr .mr-box,.mr .mr-cat{color:var(--fx)}
.mr-bmark{display:flex;align-items:center;justify-content:center;min-height:0}
.mr-blogo{display:block;flex:none;background:currentColor;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.mr-blogoi{display:block;flex:none;height:auto;object-fit:contain}
.mr-bmark>.mr-blogo,.mr-bmark>.mr-blogoi{max-width:56%;max-height:38%}
.mr-bmono{font:500 clamp(30px,24cqw,72px)/1 ${FF};letter-spacing:-.06em;padding-bottom:.22em;margin-bottom:-.22em}
.mr-bcap{display:flex;flex-direction:column;justify-content:flex-end;min-width:0}
.mr-bnm{display:block;font:500 15px/20px ${FF};letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:4px;margin-bottom:-4px}
.mr-bct{display:block;font:400 14px/20px ${FF};opacity:.74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* tier two: compact logo chips */
.mr-more{margin-top:clamp(28px,3vw,44px)}
.mr-morel{display:block;margin:0 0 12px;font:500 15px/1.3 ${FF};color:rgba(12,13,15,.72)}
.mr-chips{display:flex;flex-wrap:wrap;gap:8px}
.mr-chip{position:relative;display:inline-flex;align-items:center;justify-content:center;height:60px;min-width:104px;padding:0 22px;border-radius:30px;background:var(--bx,${PAPER});color:var(--fx,${INK});box-shadow:inset 0 0 0 1px rgba(12,13,15,.1);transition:transform .4s ${ARRIVE}}
.mr-chip img{display:block;object-fit:contain}
.mr-chipn{font:600 15px/1.2 ${FF};letter-spacing:-.015em;white-space:nowrap;padding-bottom:.22em;margin-bottom:-.22em}
.mr-chip::after{content:attr(data-tip);position:absolute;left:50%;bottom:calc(100% + 8px);transform:translate(-50%,4px);padding:6px 10px;border-radius:8px;background:${INK};color:${PAPER};font:500 14px/1.3 ${FF};white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s,transform .3s ${ARRIVE};z-index:2}
.mr-chip:hover::after,.mr-chip:focus-visible::after{opacity:1;transform:translate(-50%,0)}
/* categories: the count leads, set in the numbers chapter's face */
.mr-cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(6px,.6vw,10px)}
.mr-cat{display:grid;grid-template-rows:minmax(0,1fr) 44px;row-gap:10px;aspect-ratio:5/4;padding:14px 16px;border-radius:var(--rad);background:var(--bx);box-shadow:inset 0 0 0 1px rgba(12,13,15,.1);container-type:inline-size;transition:transform .45s ${ARRIVE}}
.mr-cnum{align-self:start;font:400 clamp(48px,30cqw,128px)/1 "Bowlby One",system-ui,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums;padding:.04em 0 .22em;margin-left:-.04em}
.mr-csh{display:flex;flex-direction:column;gap:10px}
.mr-csl{font:500 14px/1.3 ${FF};color:rgba(15,37,69,.7);margin:2px 4px 0}
.mr-csg{display:grid;grid-template-columns:repeat(4,minmax(0,112px));gap:8px}
.mr-csb{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:10px;min-height:96px;padding:10px 12px!important;border-radius:12px;background:var(--bx)!important;color:var(--fx)!important;border:0;cursor:pointer;font:500 14px/1.25 ${FF};text-align:left;transition:transform .35s ${ARRIVE}}
.mr-csb b{font:400 34px/1 "Bowlby One",system-ui,sans-serif;padding-bottom:.22em;margin-bottom:-.22em}
.mr-csb.mr-cur{box-shadow:0 0 0 2px ${PAPER},0 0 0 4px ${NAVY}}
.mr-csb:focus-visible{outline:2px solid ${COBALT};outline-offset:3px}
.mr-nmk .mr-cnum{font-size:clamp(80px,34cqw,260px)}
.mr-nmk.mr-nmc{flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:7%}
.mr-nmc .mr-cnm{font:500 clamp(18px,4cqw,34px)/1.2 ${FF};letter-spacing:-.02em}
.mr-nmn{max-width:84%;text-align:center;font:500 clamp(26px,9cqw,84px)/1.06 ${FF};letter-spacing:-.045em;padding-bottom:.22em;text-wrap:balance}
@media (hover:hover) and (pointer:fine){.mr-box:hover,.mr-cat:hover,.mr-chip:hover,.mr-csb:hover{transform:translate3d(0,-4px,0)}}
@media (max-width:1100px){.mr-boxes{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:900px){.mr-boxes{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:760px){
  .mr-boxes{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mr-box{padding:12px}.mr-bcw{display:none}
  .mr-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.mr-chip{min-width:0;padding:0 14px}
  .mr-cats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mr-cat{padding:12px 14px}
  .mr-csg{grid-template-columns:repeat(4,minmax(0,1fr))}.mr-csb b{font-size:26px}.mr-csb{min-height:84px;padding:8px 9px!important;font-size:14px}
}
.mr-nmk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bx);color:var(--fx);container-type:inline-size}
.wkg-page.mr-run .wkg-back .wkg-bi1{animation:mr-nudge 5s ${ARRIVE} 2.5s infinite}
.wkg-page.mr-run.wkg-nxon .wkg-back .wkg-bi1{animation-delay:0s}
.wkg-page.mr-run .wkg-back:hover .wkg-bi1,.wkg-page.mr-run .wkg-back:focus-visible .wkg-bi1{animation:none}
@keyframes mr-nudge{0%,82%,100%{translate:0}87%{translate:-5px}92%{translate:0}96%{translate:-3px}}
.wkg-tri:not(:has(>:nth-child(3))){grid-template-columns:repeat(2,1fr)}
.mr-hit{position:absolute;inset:0;z-index:3;display:block;cursor:pointer;border-radius:inherit;-webkit-tap-highlight-color:transparent}
.mr-hit:focus-visible{outline:3px solid ${COBALT};outline-offset:-3px;box-shadow:inset 0 0 0 6px ${PAPER}}
.mr-phl{display:none}
.wkg-page.mr-run{--top:clamp(76px,9.4vh,90px);--bot:clamp(48px,7vh,64px);--hh:calc(100vh - var(--top) - var(--bot) - 30px)}

.wkg-page.mr-run .wkg-hero.wkg-hfr{--ar:.5625;width:calc(46vw + var(--hh) * .5625)}
.wkg-page.mr-run .wkg-hfr .wkg-hm{top:var(--top);height:var(--hh);width:calc(var(--hh) * .5625);border-radius:10px}
.mr-hlab{position:absolute;left:46vw;top:calc(var(--top) + var(--hh) + 8px);width:calc(var(--hh) * .5625);color:${INK}}
.mr-tlb{flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0;height:30px;padding-top:8px;color:${INK};font:500 14px/22px ${FF};white-space:nowrap;overflow:hidden}
.mr-tlb b{font:500 15px/1.2 ${FF};letter-spacing:-.01em}.mr-tlb b small{font:500 14px/1 ${FF};margin-left:0;color:rgba(12,13,15,.76)}
.wkg-page.mr-run .wkg-next{width:calc(100vw - var(--pgap))}   /* at the end hold the next client fills the view, nothing before it is left half-cut */
.wkg-page .mr-chd .wkg-chl{width:auto;min-width:clamp(260px,22vw,380px)}.mr-chd .wkg-chl h3{white-space:nowrap}.mr-chd .wkg-chl p{margin-top:30px;width:clamp(260px,30vw,460px);max-width:calc(100vw - 48px);white-space:normal}
.mr-tags{display:flex;gap:4px;min-width:0;overflow:hidden}.mr-hlab{height:30px}
.mr-tag{display:inline-block;flex:none;padding:1px 6px 2px;border-radius:5px;background:${INK};color:${PAPER};font:600 14px/1.2 ${FF};font-style:normal;letter-spacing:0;vertical-align:2px}.mr-sL .mr-tlb b,.mr-hlab b{font-size:20px;letter-spacing:-.025em}
.wkg-page .mr-gp{width:auto!important;max-width:none!important;overflow:visible!important;padding-left:8px;scroll-snap-align:none}
.mr-g{--g:8px;display:flex;gap:var(--g);height:var(--gh,600px);margin-left:calc(var(--lead,0) * 40px)}
.mr-col{position:relative;flex:none;height:100%;display:grid;gap:var(--g);grid-template-rows:repeat(var(--rows,3),minmax(0,1fr));content-visibility:auto;contain-intrinsic-size:auto 360px auto var(--gh,600px)}
.mr-cL{width:calc(var(--w) * var(--u,3) + var(--g) * (var(--u,3) - 1));grid-template-columns:minmax(0,1fr);scroll-snap-align:start;scroll-margin-left:var(--gut)}
.mr-cM{width:calc(var(--w) * 2 + var(--g));grid-template-columns:repeat(2,minmax(0,1fr))}
.mr-cS{width:var(--w);grid-template-columns:minmax(0,1fr)}
.mr-cL .mr-gt{grid-row:1/-1}
.mr-cM .mr-sM{grid-column:1/-1;grid-row:span 2}
.mr-gt.mr-hit{position:relative;inset:auto;z-index:auto;display:flex;flex-direction:column;min-width:0;min-height:0}
.mr-tm{position:relative;display:block;flex:1 1 0;min-height:0;overflow:hidden;border-radius:10px;background:${SKY};contain:paint}
.mr-tm img,.mr-tm video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mr-post .mr-tm,.wkg-hm.mr-post{background:${PAPER}!important}.mr-post .mr-tm img,.wkg-hm.mr-post img{object-fit:contain!important;object-position:50% 50%!important}
.mr-gt.mr-hit:focus-visible{outline:none;box-shadow:none}.mr-gt:focus-visible .mr-tm,.mr-hl .mr-tm{box-shadow:inset 0 0 0 3px ${COBALT};outline:3px solid ${COBALT};outline-offset:-3px}
.mr-gt:focus-visible .mr-tm::after{content:"";position:absolute;inset:0;z-index:5;border-radius:inherit;box-shadow:inset 0 0 0 3px ${COBALT},inset 0 0 0 6px ${PAPER};pointer-events:none}
.wkg-fx .mr-col:not(.mr-rv) .mr-tm{clip-path:inset(100% 0 0 0 round 10px)}
.wkg-fx .mr-col .mr-tm{transition:clip-path 1.1s ${ARRIVE}}
.wkg-fx .mr-col.mr-rv .mr-tm{clip-path:inset(0 0 0 0 round 10px)}
.wkg-fx .mr-col:not(.mr-rv) .mr-tlb{opacity:0}.wkg-fx .mr-col .mr-tlb{transition:opacity .8s ${ARRIVE} .2s}
.mr-rd{position:absolute;left:var(--gut);right:var(--gut);bottom:0;z-index:4;height:44px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:${INK};font:500 15px/1.2 ${FF}}
.mr-rdx{min-height:44px;padding:0 0 0 12px!important;background:none;border:0;color:inherit;font:inherit;cursor:pointer;white-space:nowrap;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:4px}
.mr-rdx:focus-visible{outline:2px solid ${COBALT};outline-offset:-2px}
.wkg-page .mr-tlp{padding-right:clamp(24px,3vw,48px);width:auto!important;max-width:none!important;overflow:visible!important}
.mr-tread{min-height:2.7em;margin:0 0 8px;max-width:38ch;font:500 15px/1.35 ${FF};letter-spacing:-.01em;padding-bottom:.22em}
.mr-tread b{font-weight:500;color:${COBALT};margin-right:6px}
.mr-bars{position:relative;display:flex;align-items:stretch;height:clamp(90px,15vh,130px);border-bottom:1.5px solid rgba(12,13,15,.32)}
.mr-mo{display:flex;flex:none}.mr-mo+.mr-mo{margin-left:6px}
.mr-bar{position:relative;flex:none;width:var(--bw,14px);height:100%;padding:0!important;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mr-bar i{position:absolute;left:50%;bottom:0;width:6px;margin-left:-3px;height:max(var(--h),3px);border-radius:2px 2px 0 0;background:rgba(15,37,69,.34);transform-origin:50% 100%;transition:background-color .2s}
.mr-bar.mr-big i{background:${COBALT}}
.wkg-fx .mr-bar i{transform:scaleY(0);transition:transform .8s ${ARRIVE} calc(var(--i) * 16ms),background-color .2s}
.wkg-fx .wkg-in .mr-bar i{transform:none}
.mr-bar.mr-now i,.mr-bar:focus-visible i{background:${PINK};box-shadow:0 0 0 1px ${NAVY}}
.mr-bar:focus-visible{outline:2px solid ${COBALT};outline-offset:1px}
.mr-ticks{position:relative;height:22px;margin-top:5px;font:500 14px/1.3 ${FF};color:rgba(12,13,15,.76)}
.mr-ticks span{position:absolute;top:0;white-space:nowrap}
@media (min-width:701px){.wkg-page .mr-tlp,.wkg-page .mr-tlp~.wkg-intro{justify-content:center!important;padding-top:0!important;padding-bottom:0!important}.mr-tlp .mr-bars{height:clamp(190px,34vh,320px)}}
/* phones: the views chart sits in the middle of the screen with taller bars, not at the top over an empty half */
@media (max-width:700px){.wkg-page .mr-tlp{justify-content:center!important}.mr-tlp .mr-bars{height:clamp(170px,30vh,260px)}}
.mr-route .wkg-stops{--sup:0px!important}
.mr-route .wkg-sup{height:0}
.mr-route .wkg-slo{padding-top:58px}
.mr-rc{margin:0 0 6px;font:500 clamp(28px,2.4vw,42px)/1.15 ${FF};letter-spacing:-.04em;padding-bottom:.08em}
.mr-rp{display:block;margin:0 0 14px;font:500 15px/1.3 ${FF};color:rgba(12,13,15,.76)}
.mr-rf{display:flex;justify-content:space-between;gap:14px;width:100%;min-height:44px;align-items:center;padding:0!important;border:0;border-top:1px solid rgba(12,13,15,.2);background:none;font:500 16px/1.25 ${FF};color:inherit;text-align:left;cursor:pointer}
.mr-rf:focus-visible{outline:2px solid ${COBALT};outline-offset:2px}
.mr-rxl{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;contain:strict}
.mr-rx{position:absolute;left:0;top:0;width:34px;height:34px;opacity:0;will-change:transform,opacity}
.mr-rx svg{display:block;width:100%;height:100%}
.mr-rxbw{width:auto;height:auto}
.mr-rxb{display:flex;gap:2px;padding:5px 8px;border-radius:14px 14px 14px 4px;background:${PAPER};box-shadow:0 0 0 1.5px ${INK}}
.mr-rxb svg{width:18px;height:18px}
.wkg-page .mr-vox{width:100vw;max-width:none;overflow:hidden!important;padding:var(--top) var(--gut) var(--bot);scroll-snap-align:start}
.mr-vsc{height:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;scrollbar-width:none;padding:0 2px 8px}
.mr-vsc::-webkit-scrollbar{display:none}
.mr-vsc a{text-decoration:none}
.mr-vhd{display:flex;align-items:baseline;margin:0 0 12px;height:22px}
.wkg-page .mr-vxp{justify-content:center;padding-right:var(--pgap);max-width:none!important;width:auto!important;overflow:visible!important}
.mr-pull{margin:clamp(28px,5vh,56px) 0 0;max-width:24ch;font:500 clamp(24px,2.2vw,36px)/1.18 ${FF};letter-spacing:-.03em;text-wrap:balance;padding-bottom:.22em}
.mr-vxh{margin:0;width:max-content;max-width:min(11ch,86vw);font:500 clamp(52px,8.4vw,150px)/1 ${FF};letter-spacing:-.055em;padding-bottom:.22em;text-wrap:balance}
.mr-vhd span{font:500 16px/1.3 ${FF};color:rgba(12,13,15,.76)}
.mr-vox .mr-grid{column-gap:var(--cg)}
.mr-vox :focus-visible{outline:2px solid ${COBALT};outline-offset:3px}
@media (hover:hover) and (pointer:fine){
  .mr-bar:hover i{background:${PINK};box-shadow:0 0 0 1px ${NAVY}}
  .mr-rf:hover{color:${COBALT}}
}
.mr-box:active{transform:scale(.985)}
/* a film with no loop to play still answers the pointer: its poster eases in a little, like the cards do */
.mr-tm>img{transition:transform .6s ${ARRIVE}}
@media (hover:hover) and (pointer:fine){.mr-gt:hover .mr-tm>img{transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){.mr-tm>img{transition:none}.mr-gt:hover .mr-tm>img{transform:none}}
.mr :focus-visible.mr-box{outline-offset:3px}
@media (max-width:760px){
          .mr-phl{display:block;margin-bottom:8px}
  .wkg-page.mr-run{--top:76px;--bot:62px;--hh:calc(100dvh - var(--top) - var(--bot) - 150px)}
  .wkg-page .mr-vxp{width:100vw!important;padding:var(--top) var(--gut) var(--bot)}.mr-vxh{width:auto;max-width:100%;font-size:15vw}.mr-pull{font-size:22px}
  .wkg-page.mr-run .wkg-hero.wkg-hfr{display:block;padding:0;width:100vw;background:transparent;color:${INK}}
  .wkg-page.mr-run .wkg-hfr .wkg-hm{position:absolute;left:var(--gut);right:auto;top:var(--top);width:calc(100vw - 2 * var(--gut));height:var(--hh);aspect-ratio:auto;max-height:none}
  .wkg-page.mr-run .wkg-hfr .wkg-hcap{position:absolute;left:var(--gut);right:var(--gut);top:auto;bottom:calc(var(--bot) + 38px);z-index:2;display:block;pointer-events:none}
  .wkg-page.mr-run .wkg-hfr .wkg-hcap>span{margin:0 0 8px;font-size:14px}
  .wkg-page.mr-run .wkg-hfr .wkg-hcap h1{font-size:min(40px,9.4vw);line-height:1.04}
  .wkg-page.mr-run .wkg-hfr .wkg-hcols{display:none}
  .mr-hlab{left:var(--gut);top:auto;bottom:var(--bot);width:calc(100vw - 2 * var(--gut))}
  .wkg-page.mr-run .wkg-hero.wkg-hfr:has(.mr-hland){width:100vw}
  .wkg-page.mr-run .wkg-hfr .wkg-hm.mr-hland{width:calc(100vw - 2 * var(--gut));height:calc((100vw - 2 * var(--gut)) / var(--har))}
  .mr-hlab.mr-hlw{width:calc(100vw - 2 * var(--gut));top:calc(var(--top) + (100vw - 2 * var(--gut)) / var(--har) + 8px);bottom:auto}
  .mr-g{--rows:2}
  .mr-col{--rows:2}
  .mr-cL{--u:2}
  .wkg-page .mr-route{max-width:none!important}
  .wkg-page .mr-route{width:calc(100vw - 36px)!important;overflow-y:auto!important}
  .mr-route .wkg-slo{padding-top:0}
  .mr-bar{--bw:24px}.mr-bar i{width:10px;margin-left:-5px}
  .wkg-page .mr-route{overflow:hidden!important}
  .mr-route>.wkg-pi{display:block;height:calc(100vh - var(--top) - var(--bot));height:calc(100dvh - var(--top) - var(--bot));overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain}   /* contain only up and down: a both-ways contain stopped the sideways swipe here */
  .mr-tread{position:sticky;left:18px;width:calc(100vw - 36px);max-width:calc(100vw - 36px)}
  .wkg-page .mr-vox{width:100vw!important;max-width:none!important}
  .wkg-page .mr-chd:not(.mr-long){width:auto!important;max-width:84vw!important}.mr-chd .wkg-chl{width:auto}.mr-chd .wkg-chl h3{font-size:clamp(30px,9.4vw,40px)}
}
/* a phone on its side runs the phone drive too (work-g PHQ), but it is short: one row of films, every tile one size,
   so a label has the room to say its views */
@media ${LQ}{
  .mr-g,.mr-col{--rows:1}
  .mr-col{--w:calc((var(--gh,252px) - 30px) * .5625)}
  .mr-cL{--u:1}
  .mr-cS{width:calc(var(--w) * 2 + var(--g));grid-template-columns:repeat(2,minmax(0,1fr))}
  .mr-bar{--bw:24px}.mr-bar i{width:10px;margin-left:-5px}
  .mr-tlp .mr-bars{height:150px}
  .mr-gt .mr-tags{position:absolute;left:6px;bottom:36px;z-index:2;max-width:calc(100% - 12px)}   /* a tile this narrow cannot hold views and a tag on one line: the tag sits on the picture */
}
/* phones, the views chart (PHONE-AUDIT #10): a tap on a bar only picks it. The bar under the chart says which one is
   picked, steps to its neighbours and opens it, each a full-size target. It rides in the page's own scroller, so a
   finger that starts on it still drives the run */
.mr-tch{display:none}
@media ${PHQ}{
  .wkg-pin>.mr-tch{display:block;position:sticky;top:0;left:0;height:0;z-index:4;pointer-events:none}
  .mr-tctl{position:absolute;left:18px;top:var(--ty,70vh);width:calc(100vw - 36px);display:flex;flex-wrap:wrap;align-items:center;gap:8px;opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s linear .25s}
  .mr-tch.mr-on .mr-tctl{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .25s,visibility 0s}
  .mr-tcr{flex:1 1 100%;min-width:0;margin:0;font:500 15px/1.35 ${FF};letter-spacing:-.01em;color:${INK};padding-bottom:.22em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mr-tcr b{font-weight:500;color:${COBALT};margin-right:6px}
  .mr-tcb{flex:1 1 0;min-width:0;min-height:46px;padding:0 10px!important;border:0;border-radius:23px;background:rgba(12,13,15,.1)!important;color:${INK}!important;font:500 16px/1 ${FF};letter-spacing:-.01em;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .3s ${ARRIVE}}
  .mr-tcb.mr-tcg{flex:1.5 1 0;background:${INK}!important;color:${PAPER}!important}
  .mr-tcb:active{transform:scale(.96)}
  .mr-tcb:focus-visible{outline:2px solid ${COBALT};outline-offset:2px}
  .wkg-pin .mr-tlp .mr-tread{display:none}
  .wkg-pin .mr-tlp .mr-bar.mr-now i{background:${COBALT};box-shadow:none}   /* the picked bar, plain to see on a pink ground */
  .wkg-pin .mr-tlp .wkg-pi{margin-bottom:96px}
}
@media ${LQ}{
  .mr-tctl{flex-wrap:nowrap}.mr-tcr{flex:1 1 0}.mr-tcb,.mr-tcb.mr-tcg{flex:none;padding:0 20px!important}
  .wkg-pin .mr-tlp .wkg-pi{margin-bottom:56px}
}
/* phones: a landscape opening film (Favourites, DVCs) sat at the top over an empty half (PHONE-AUDIT #12). The film, its
   views and the title now sit together, a little above the middle */
@media (max-width:760px){
  .wkg-page.mr-run .wkg-hero.wkg-hfr:has(.mr-hland){--lh:calc((100vw - 2 * var(--gut)) / var(--har,1.778));--ld:clamp(0px,calc((100dvh - var(--top) - var(--bot) - var(--lh) - 150px) * .42),140px)}
  .wkg-page.mr-run .wkg-hfr .wkg-hm.mr-hland{top:calc(var(--top) + var(--ld))}
  .wkg-page.mr-run .wkg-hfr .mr-hlab.mr-hlw{top:calc(var(--top) + var(--ld) + var(--lh) + 8px)}
  .wkg-page.mr-run .wkg-hero.wkg-hfr:has(.mr-hland) .wkg-hcap{top:calc(var(--top) + var(--ld) + var(--lh) + 58px);bottom:auto}
}
/* phones: Contact steps out while the player is up, so Close is the one control in its top bar (PHONE-AUDIT #14) */
@media ${PHQ}{html.mr-lock #contact,html.mr-lock #contact *{visibility:hidden!important;pointer-events:none!important}}
@media (prefers-reduced-motion:reduce){.wkg-page.mr-run .wkg-back .wkg-bi1{animation:none!important}.mr-box,.mr-cat,.mr-chip,.mr-csb{transition:none!important}.mr-box:hover,.mr-cat:hover,.mr-chip:hover,.mr-csb:hover{transform:none!important}}
.mr{grid-column:1/-1;min-width:0;min-height:50vh;scroll-margin-top:16px}
.mr a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
.mr-sh{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin:0 0 clamp(20px,2.4vw,32px);padding-top:20px;border-top:1px solid rgba(12,13,15,.18)}
.mr-sh h3{margin:0;font:500 clamp(26px,2.6vw,44px)/1.1 ${FF};letter-spacing:-.04em}
.mr-sh span{font:500 16px/1.3 ${FF};color:rgba(12,13,15,.76)}
.mr-sec+.mr-sec{margin-top:clamp(64px,7vw,120px)}
/* the categories as full-bleed rows: space and scale separate them, no rules. Hover fills the row with ink and a frame
   follows the pointer, flicking through that folder's stills */
.mr-cr{margin-left:calc(-1 * var(--gut,18px));margin-right:calc(-1 * var(--gut,18px))}
.mr-crm{margin:0;padding:0;list-style:none}
.mr .mr-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,26ch);align-items:end;gap:24px;padding:clamp(8px,1vw,16px) var(--gut,18px) clamp(10px,1.2vw,18px);isolation:isolate;color:${INK}}
.mr-row::before{content:"";position:absolute;inset:0;z-index:-1;background:${INK};clip-path:inset(100% 0 0 0);transition:clip-path .55s ${ARRIVE}}
.mr-rnm{display:inline-block;font:600 clamp(46px,8.4vw,136px)/.98 ${FF};letter-spacing:-.05em;padding-bottom:.1em;transition:color .35s,transform .7s ${ARRIVE}}
.mr-rnm sup{font:500 clamp(13px,1.1vw,17px)/1 ${FF};letter-spacing:0;color:${COBALT};vertical-align:top;position:relative;top:1.1em;margin-left:.5em;font-variant-numeric:tabular-nums;transition:color .35s}
.mr-rln{justify-self:end;text-align:right;font:500 clamp(17px,1.5vw,22px)/1.3 ${FF};letter-spacing:-.01em;color:${PINK};padding-bottom:clamp(14px,1.6vw,26px);opacity:0;transform:translate3d(0,.6em,0);transition:opacity .35s,transform .6s ${ARRIVE}}
.mr-rth{display:none}
.mr-row.mr-hot::before{clip-path:inset(0 0 0 0)}
.mr-row.mr-hot .mr-rnm{color:${PINK};transform:translateX(.12em)}
.mr-row.mr-hot .mr-rnm sup{color:${PINK}}
.mr-row.mr-hot .mr-rln{opacity:1;transform:none}
.mr-row:focus-visible{outline:2px solid ${INK};outline-offset:-4px}
.mr-row.mr-hot:focus-visible{outline-color:${PINK}}
.mr-gate{position:fixed;left:0;top:0;z-index:60;width:var(--gw,230px);aspect-ratio:var(--ga,9/16);background:${INK};border-radius:10px;overflow:hidden;pointer-events:none;opacity:0;translate:var(--x,0) var(--y,0);scale:.86;transition:opacity .25s,scale .45s ${ARRIVE};box-shadow:0 0 0 1px rgba(241,242,240,.14)}
.mr-gate.mr-on{opacity:1;scale:1}
.mr-gate img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
@media (hover:none),(max-width:760px){
  .mr .mr-row{grid-template-columns:minmax(0,1fr);gap:4px;padding-top:14px;padding-bottom:16px}
  .mr-rln{justify-self:start;text-align:left;opacity:1;transform:none;color:rgba(12,13,15,.76);padding-bottom:0}
  .mr-rth{display:flex;gap:6px;margin-top:10px}
  .mr-rth img{flex:0 1 auto;min-width:0;height:64px;width:auto;object-fit:cover;border-radius:6px;background:rgba(12,13,15,.08)}
  .mr-row::before{display:none}
  .mr-row.mr-hot .mr-rnm{color:inherit;transform:none}.mr-row.mr-hot .mr-rnm sup{color:${COBALT}}
  .mr-row:active .mr-rnm{transform:translateX(.06em)}
  .mr-gate{display:none}
}
@media (prefers-reduced-motion:reduce){.mr-row::before,.mr-rnm,.mr-rnm sup,.mr-rln,.mr-gate{transition-duration:.01ms!important}}
.mr-catl{display:flex;flex-wrap:wrap;column-gap:clamp(20px,2.2vw,34px);row-gap:6px}
.mr-catl+.mr-sec{margin-top:clamp(40px,4.5vw,72px)}
.mr-view[data-view=index] .mr-sh{border-top:0;padding-top:0}
.mr-cli{position:relative;display:inline-flex;align-items:baseline;gap:7px;font:500 18px/1.2 ${FF};letter-spacing:-.01em;padding:6px 0;color:rgba(12,13,15,.76);text-decoration:none;white-space:nowrap;transition:color .3s}
.mr-cli small{font:500 14px/1 ${FF};color:${COBALT};font-variant-numeric:tabular-nums}
.mr-cli::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:${INK};transform:scaleX(0);transform-origin:0 50%;transition:transform .6s ${ARRIVE}}
@media (hover:hover){.mr-cli:hover{color:${INK}}.mr-cli:hover::after{transform:none}}
@media (max-width:560px){.mr-catl{column-gap:20px;row-gap:2px}.mr-cli{font-size:17px}}
.mr-cli:focus-visible{outline:2px solid ${INK};outline-offset:4px}
.mr-nums{display:flex;flex-wrap:wrap;column-gap:14px;row-gap:2px;margin-top:6px;font:500 15px/1.35 ${FF};color:rgba(12,13,15,.76)}
.mr-nums strong{font-weight:600;color:${INK}}

.mr-vbar{margin:0 0 clamp(20px,3vh,36px)}
.mr-back{display:inline-flex;align-items:center;gap:10px;min-height:44px;font:500 18px/1.2 ${FF};letter-spacing:-.01em;border-bottom:2px solid transparent;transition:border-color .3s}
.mr-back svg{width:20px;height:15px;flex:none;transition:transform .5s ${ARRIVE}}
.mr-dh{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,auto);align-items:end;column-gap:40px;row-gap:14px;padding-bottom:clamp(24px,3vw,40px)}
.mr-dh h3{margin:0;font:500 clamp(46px,7vw,128px)/1 ${FF};letter-spacing:-.05em;padding-bottom:.08em;overflow-wrap:anywhere}
.mr-dstat{display:flex;gap:clamp(22px,2.6vw,40px);padding-bottom:.6em}
.mr-dstat div{display:flex;flex-direction:column;gap:2px}
.mr-dstat b{font:500 clamp(26px,2.3vw,38px)/1.05 ${FF};letter-spacing:-.03em}
.mr-dstat small{font:500 15px/1.3 ${FF};color:rgba(12,13,15,.76)}
.mr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:var(--lg);row-gap:clamp(30px,3vw,52px)}
.mr-card{display:block;min-width:0}
.mr-po{position:relative;display:block;aspect-ratio:9/16;border-radius:var(--rad);overflow:hidden;background:${SKY};isolation:isolate;transition:transform .45s ${ARRIVE}}
.mr-cl{display:block;margin-top:10px;font:500 17px/1.25 ${FF};letter-spacing:-.015em}
.mr-card>.mr-nums{margin-top:10px}
.mr-card>.mr-cl+.mr-nums{margin-top:2px}
.mr :focus-visible{outline:2px solid ${COBALT};outline-offset:4px}
@media (hover:hover) and (pointer:fine){
  .mr-card:hover .mr-po img{transform:scale(1.05)}
  .mr-back:hover{border-bottom-color:${INK}}.mr-back:hover svg{transform:translateX(-4px)}
}
.mr-card:active .mr-po{transform:scale(.98)}
@media (max-width:1100px){.mr-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:760px){
  .mr-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;row-gap:26px}
  .mr-dh{grid-template-columns:minmax(0,1fr)}.mr-dstat{padding-bottom:0}
  .mr-nums{column-gap:10px}
}

/* the player. Sits under the Contact button (z-index 10) and over the page */
html.mr-lock{overflow:hidden!important}
html.lenis.lenis-smooth .mr-pl iframe,.mr-pl iframe{pointer-events:auto}
.mr-pl{position:fixed;inset:0;z-index:9;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);column-gap:clamp(24px,3vw,56px);align-items:center;padding:20px clamp(20px,3vw,48px);background:${NAVY};color:${PAPER};font-family:${FF};overscroll-behavior:contain}
.mr-pl[hidden]{display:none}
.mr-pl *{box-sizing:border-box}
.mr-pl button,.mr-pl a{font:500 17px/1 ${FF};letter-spacing:-.01em;color:inherit;text-decoration:none;background:none;border:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mr-pl :focus-visible{outline:2px solid ${PINK};outline-offset:3px}
.mr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:24px;background:rgba(241,242,240,.12)!important;transition:background-color .25s,color .25s,transform .3s ${ARRIVE};white-space:nowrap}
.mr-btn:active{transform:scale(.96)}
.mr-ig{background:${PINK}!important;color:${INK}!important}
@media (hover:hover) and (pointer:fine){.mr-btn:hover{background:${PAPER}!important;color:${INK}!important}}
.mr-close{position:absolute;left:clamp(20px,3vw,48px);top:14px;z-index:2}
.mr-info{justify-self:end;width:min(100%,340px);display:flex;flex-direction:column;align-items:flex-start;gap:16px}
.mr-info h2{margin:0;font:500 clamp(32px,3.2vw,52px)/1.04 ${FF};letter-spacing:-.04em;overflow-wrap:anywhere}
.mr-pn{display:flex;gap:22px;font:500 17px/1.3 ${FF}}
.mr-pn b{display:block;font:500 28px/1.1 ${FF};letter-spacing:-.025em}
.mr-pn span{color:${BLUE}}
.mr-meta{margin:0;font:400 16px/1.4 ${FF};color:${BLUE}}
.mr-fr{position:relative;width:min(400px,calc((100vh - 40px) * .54));width:min(400px,calc((100dvh - 40px) * .54));aspect-ratio:400/740;border-radius:14px;overflow:hidden;background:${PAPER}}
.mr-fr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .35s}
.mr-fr iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;opacity:0;transition:opacity .35s}
.mr-fr.mr-on iframe{opacity:1}.mr-fr.mr-on img{opacity:0}
.mr-pl .mr-off{position:absolute;inset:0;display:block}
.mr-nav{justify-self:start;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.mr-count{margin:0 0 4px;font:500 16px/1.3 ${FF};color:${BLUE}}
@media (max-width:900px),(max-height:520px){
  .mr-pl{display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom));column-gap:0}
  .mr-close{position:static;align-self:flex-start;flex:none}
  .mr-fr{order:1;flex:1 1 auto;width:100%;max-width:440px;height:auto;aspect-ratio:auto;min-height:0;max-height:none;align-self:center}
  .mr-info{order:2;width:100%;flex:none;flex-direction:row;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 14px;justify-self:auto}
  .mr-info h2{font-size:22px;letter-spacing:-.025em}
  .mr-pn{gap:12px;font-size:15px}.mr-pn b{display:inline;font:600 15px/1.3 ${FF};letter-spacing:0;margin-right:4px}
  .mr-meta,.mr-info .mr-ig{display:none}
  .mr-nav{order:3;flex:none;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;justify-self:auto}
  .mr-count{display:none}
  .mr-nav .mr-btn{flex:1 1 0;padding:0 8px;font-size:16px}
  .mr-nav .mr-ig2{display:inline-flex;flex:1.7 1 0}
}
@media (min-width:901px) and (min-height:521px){.mr-ig2{display:none!important}}
@media (prefers-reduced-motion:reduce){
  .mr *,.mr-pl,.mr-pl *{transition:none!important}
  .mr-card:hover .mr-po img{transform:none}
}
`;

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/* 7367973 is 7.4M, 82057 is 82.1K. Nothing to show gives null, so a missing value is left out and never reads as 0 */
export function abbr(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  const one = (x) => { const r = Math.round(x * 10) / 10; return (r >= 100 || Number.isInteger(r)) ? String(Math.round(r)) : r.toFixed(1); };
  if (n >= 999950) return one(n / 1e6) + 'M';
  if (n >= 999.5) return one(n / 1e3) + 'K';
  return String(Math.round(n));
}
const nounsOf = (list) => { const d = list.filter(r => r.in_dvc).length; return !d ? ['reel', 'reels'] : d === list.length ? ['DVC', 'DVCs'] : ['video', 'videos']; };
const plural = (n, w = ['reel', 'reels']) => `${n} ${n === 1 ? w[0] : w[1]}`;
const isPost = (r) => r.format === 'photo' && (r.type === 'Sidecar' || r.type === 'Image');
const kindOfReel = (r) => (isPost(r) ? 'post' : r.in_dvc ? 'film' : 'reel');
/* an honest count: videos and posts named apart when a client has both */
function countText(list) {
  const posts = list.filter(isPost).length, vids = list.length - posts, out = [];
  if (vids) out.push(plural(vids, nounsOf(list.filter(r => !isPost(r)))));
  if (posts) out.push(plural(posts, ['post', 'posts']));
  return out.join(', ');
}
/* a post's caption cut to its first real line: no tags, handles or the search words in brackets */
function shortCap(r) {
  let t = String(r.caption || '').replace(/[#@][^\s]+/g, ' ').split(/\n|\s[(\[]/)[0].replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim().replace(/[,:;]$/, '');
  if (r.in_dvc) t = t.replace(/\breels?\b/gi, '').replace(/\s+/g, ' ').trim();
  if (t.length <= 62) return t;
  t = t.slice(0, 62); return t.slice(0, t.lastIndexOf(' ')).replace(/[,:;]$/, '') + '...';
}
const sum = (list, k) => list.reduce((a, r) => a + (Number(r[k]) > 0 ? Number(r[k]) : 0), 0);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/* alt text for a film's still: whose it is, what it is and when, from the data (never the brand's own caption) */
const altOfReel = (r) => { const c = String(r.client || '').replace(/\s*\(.*?\)\s*/g, ' ').trim(), k = kindOfReel(r), w = when(r.date); return [/^unidentified$/i.test(c) || !c ? k.charAt(0).toUpperCase() + k.slice(1) : `${c} ${k}`, w].filter(Boolean).join(', '); };
const when = (d) => { const m = /^(\d{4})-(\d{2})/.exec(d || ''); return m && MONTHS[+m[2] - 1] ? `${MONTHS[+m[2] - 1]} ${m[1]}` : null; };
const clock = (s) => (Number(s) > 0 ? `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}` : null);

/* only Instagram's own reel or post addresses become an embed or a link */
function igOf(url) {
  const m = /^https:\/\/www\.instagram\.com\/(reel|p)\/([\w-]+)\/?/.exec(url || '');
  return m ? { page: `https://www.instagram.com/${m[1]}/${m[2]}/`, embed: `https://www.instagram.com/${m[1]}/${m[2]}/embed/` } : null;
}

let NOTES = {}, api, host, REELS = [], VIEWS = new Map(), RUNS = new Map(), MAN = new Map(), BASE = '../content/';
let curView = null, indexY = null, mounted = false;
const posterOf = (r) => BASE + (typeof r.poster === 'string' && /^media\/clips\/[\w-]+$/.test(r.poster) ? `${r.poster}.w720.webp` : `media/reels/${encodeURIComponent(r.id)}.w720.webp`);
/* a poster with its two WebP sizes; the JPG is the fallback if a WebP is missing */
function setPoster(im, r, sizes) {
  const own = typeof r.poster === 'string' && /^media\/clips\/[\w-]+$/.test(r.poster);   // a sharp still from his own file, when there is one
  const b = own ? BASE + r.poster : `${BASE}media/reels/${encodeURIComponent(r.id)}`;
  im.width = 360; im.height = 640; im.decoding = 'async'; im.alt = altOfReel(r);
  im.sizes = sizes; im.srcset = `${b}.w360.webp 360w, ${b}.w720.webp 720w` + (own ? `, ${b}.w1080.webp 1080w` : ''); im.src = `${b}.w360.webp`;
  im.addEventListener('error', function fb() { im.removeEventListener('error', fb); im.removeAttribute('srcset'); im.src = `${BASE}media/reels/${encodeURIComponent(r.id)}.jpg`; });
  return im;
}

function poster(r, eager) {
  const im = el('img');
  im.loading = eager ? 'eager' : 'lazy';
  return setPoster(im, r, '(max-width:760px) 45vw, 22vw');
}
function numsOf(views) {
  const row = el('span', 'mr-nums');
  for (const [v, label] of [[views, 'views']]) {
    const t = abbr(v); if (!t) continue;
    const s = el('span'); s.append(el('strong', '', t), document.createTextNode(' ' + label)); row.appendChild(s);
  }
  return row;
}

/* box colours by one rule: logos on paper (the few with a solid dark ground on ink), a one-colour logo on navy, the
   monogram of a client without a logo on navy. Text is the ground's opposite. */
const INK_GROUND = new Set(['landmark-volkswagen', 'puffizza', 'crav-social']);
function toneOf(slug) { const lg = LOGO_FILES[slug]; return !lg ? [NAVY, PAPER] : lg[2] ? [NAVY, PAPER] : INK_GROUND.has(slug) ? [INK, PAPER] : [PAPER, INK]; }
const countLine = (list) => { const n = list.length, v = abbr(sum(list, 'views')), dvc = n && list.every(r => r.in_dvc); return [dvc ? plural(n, ['DVC', 'DVCs']) : plural(n, ['video', 'videos']), v && `${v} views`].filter(Boolean).join(' \u00b7 '); };
const monogram = (name) => name.split(/\s+/).filter(w => !/^(and|of|for|the)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function logoEl(slug, wFn) {
  const [file, ar, flat] = LOGO_FILES[slug], m = flat ? el('i', 'mr-blogo') : el('img', 'mr-blogoi');
  if (flat) { const u = `url("${BASE}${file}")`; m.setAttribute('aria-hidden', 'true'); m.style.webkitMaskImage = u; m.style.maskImage = u; }
  else { m.alt = ''; m.decoding = 'async'; m.src = BASE + file; }
  m.style.aspectRatio = String(ar); wFn(m, ar);
  return m;
}
function openRun(a, slug) {
  a.addEventListener('click', (e) => {
    const run = RUNS.get(slug); if (!run || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); api.runs.go(run.id, a);
  });
}
/* tier one: one card per big client. Equal ink area for every logo, inside 56% of the width and 38% of the mark zone */
function box(view) {
  const a = el('a', 'mr-box'); a.href = '#media/' + view.slug; a.dataset.view = view.slug;
  const [bg, fg] = toneOf(view.slug); a.style.setProperty('--bx', bg); a.style.setProperty('--fx', fg);
  const all = view.all || view.list, line = countLine(all);
  a.setAttribute('aria-label', `${view.name}, ${line.replace(' · ', ', ')}`);
  const mark = el('span', 'mr-bmark');
  if (LOGO_FILES[view.slug]) mark.appendChild(logoEl(view.slug, (m, ar) => { m.style.width = Math.min(56, 17 * Math.sqrt(ar), 19 * ar).toFixed(1) + 'cqw'; }));
  else { const mo = el('span', 'mr-bmono', monogram(view.name)); mo.setAttribute('aria-hidden', 'true'); mark.appendChild(mo); }
  const ct = el('span', 'mr-bct'), [left, right] = line.split(' \u00b7 ');
  ct.append(document.createTextNode(left));
  if (right) ct.append(document.createTextNode(' \u00b7 ' + right.replace(/ views$/, '')), el('span', 'mr-bcw', ' views'));
  const cap = el('span', 'mr-bcap'); cap.append(el('span', 'mr-bnm', view.name), ' ', ct);   // the space is for the accessible name; flex drops it on screen
  a.append(mark, cap);
  openRun(a, view.slug);
  return a;
}
/* tier two: a compact chip with the logo at one optical height (wide marks a little lower), or the name in type */
function chip(view) {
  const a = el('a', 'mr-chip'); a.href = '#media/' + view.slug; a.dataset.view = view.slug;
  const line = countLine(view.all || view.list);
  a.dataset.tip = `${view.name} · ${line}`; a.setAttribute('aria-label', `${view.name}, ${line.replace(' · ', ', ')}`);
  if (INK_GROUND.has(view.slug) && view.slug === 'landmark-volkswagen') { a.style.setProperty('--bx', INK); a.style.setProperty('--fx', PAPER); }
  if (LOGO_FILES[view.slug]) a.appendChild(logoEl(view.slug, (m, ar) => { const h = Math.max(20, Math.min(34, 38 / Math.pow(ar, 0.35))); m.style.height = h.toFixed(1) + 'px'; m.style.width = Math.min(150, h * ar).toFixed(1) + 'px'; }));
  else a.appendChild(el('span', 'mr-chipn', view.name));
  openRun(a, view.slug);
  return a;
}
/* a category, type-led: its count in the numbers chapter's face, then its name and one unit word */
const CATS = ['favourites', 'viral', 'dvc', 'documentaries'];   // his favourites lead. The GT vox pops live only inside the Gujarat Titans run
const CAT_TONES = { favourites: [PAPER, INK], viral: [PINK, INK], dvc: [NAVY, PAPER], documentaries: [BLUE, NAVY] };
const CAT_UNIT = { favourites: ['film', 'films'], viral: ['video', 'videos'], dvc: ['DVC', 'DVCs'], documentaries: ['film', 'films'] };
function markOf(slug) {
  const cat = CATS.includes(slug), [bg, fg] = cat ? CAT_TONES[slug] : toneOf(slug);
  const box = el('span', 'mr-nmk' + (cat ? ' mr-nmc' : '')); box.style.setProperty('--bx', bg); box.style.setProperty('--fx', fg);
  if (cat) { const v = VIEWS.get(slug); box.append(el('span', 'mr-cnum', String(v.list.length)), el('span', 'mr-cnm', v.name)); }
  else if (LOGO_FILES[slug]) box.appendChild(logoEl(slug, (m, ar) => { m.style.width = Math.min(56, 17 * Math.sqrt(ar), 19 * ar).toFixed(1) + 'cqw'; }));
  else box.appendChild(el('span', 'mr-nmn', VIEWS.get(slug) ? VIEWS.get(slug).name : slug));
  return box;
}
function catBox(view) {
  const a = el('a', 'mr-cat'); a.href = '#media/' + view.slug; a.dataset.view = view.slug;
  const [bg, fg] = CAT_TONES[view.slug], n = view.list.length; a.style.setProperty('--bx', bg); a.style.setProperty('--fx', fg);
  const num = el('span', 'mr-cnum', String(n));   // read out with the caption: "15 Viral Reels videos"
  const cap = el('span', 'mr-bcap'); cap.append(el('span', 'mr-bnm', view.name), ' ', el('span', 'mr-bct', n === 1 ? CAT_UNIT[view.slug][0] : CAT_UNIT[view.slug][1]));
  a.append(num, ' ', cap); openRun(a, view.slug);
  return a;
}
/* the Back panel on a Media page: the four categories, nothing else */
function catSheet(cur, done) {
  const wrap = el('div', 'mr-csh'), g = el('div', 'mr-csg');
  wrap.appendChild(el('span', 'mr-csl', 'Categories'));
  CATS.forEach(slug => {
    const v = VIEWS.get(slug), b = el('button', 'mr-csb'); b.type = 'button';
    if (slug === cur) { b.setAttribute('aria-current', 'page'); b.classList.add('mr-cur'); }
    const [bg, fg] = CAT_TONES[slug]; b.style.setProperty('--bx', bg); b.style.setProperty('--fx', fg);
    b.append(el('b', '', String(v.list.length)), el('span', '', v.name));
    b.setAttribute('aria-label', v.name + (slug === cur ? ', you are here' : ''));
    b.addEventListener('click', () => { done(); if (slug === cur) return; const run = RUNS.get(slug); if (run) api.runs.go(run.id, null); else location.hash = '#media/' + slug; });
    g.appendChild(b);
  });
  wrap.appendChild(g);
  return wrap;
}
/* ---------- the category rows and their gate ---------- */
const CAT_LINE = { favourites: 'My favourite videos I loved making', viral: 'Engaging content', dvc: 'Cinematic digital video commercials', documentaries: '' };
const rowHover = matchMedia('(hover:hover) and (min-width:761px)');
const G = { el: null, img: null, on: false, x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, frames: [], i: 0, t: 0, raf: 0, row: null };
const stillOf = (r, w) => BASE + (typeof r.poster === 'string' && /^media\/clips\/[\w-]+$/.test(r.poster) ? `${r.poster}.w${w}.webp` : `media/reels/${encodeURIComponent(r.id)}.w${w}.webp`);
function gateEl() {
  if (G.el && G.el.isConnected) return G.el;
  G.el = el('div', 'mr-gate'); G.el.setAttribute('aria-hidden', 'true'); G.img = el('img'); G.img.alt = ''; G.img.decoding = 'async';
  G.el.appendChild(G.img); document.body.appendChild(G.el);   // on body: a transformed ancestor would break position fixed
  return G.el;
}
function gatePlace() {
  const g = G.el, w = g.offsetWidth, h = g.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = G.px + 36; if (x + w > vw - 16) x = G.px - w - 36;
  const y = Math.max(12, Math.min(vh - h - 12, G.py - h / 2));
  G.tx = x; G.ty = y;
}
function gateTick(now) {
  if (G.on && G.row && (!G.row.isConnected || !G.row.offsetParent)) gateOff();   // the tab or page changed under the pointer
  if (RM.matches) { G.x = G.tx; G.y = G.ty; } else { G.x += (G.tx - G.x) * 0.18; G.y += (G.ty - G.y) * 0.18; }
  G.el.style.setProperty('--x', G.x.toFixed(1) + 'px'); G.el.style.setProperty('--y', G.y.toFixed(1) + 'px');
  // about eight stills a second, skipping any that have not loaded yet. Reduced motion: the first still only
  if (!RM.matches && G.frames.length > 1 && now - G.t > 125) {
    G.t = now;
    for (let n = 1; n <= G.frames.length; n++) { const j = (G.i + n) % G.frames.length, f = G.frames[j]; if (f.img.complete && f.img.naturalWidth) { if (j !== G.i) { G.i = j; G.img.src = f.src; } break; } }
  }
  if (G.on || Math.abs(G.tx - G.x) > .5 || Math.abs(G.ty - G.y) > .5) G.raf = requestAnimationFrame(gateTick); else G.raf = 0;
}
function gateOn(row, frames, ga, gw, px, py) {
  if (!rowHover.matches || !frames.length) return;
  gateEl();
  G.frames = frames.map(f => { if (!f.img) { f.img = new Image(); f.img.decoding = 'async'; f.img.src = f.src; } return f; });
  G.el.style.setProperty('--ga', ga); G.el.style.setProperty('--gw', gw);
  G.i = 0; G.img.src = G.frames[0].src; G.px = px; G.py = py; G.row = row;
  const fresh = !G.on; G.on = true; gatePlace();
  if (fresh) { G.x = G.tx; G.y = G.ty + 30; }
  G.el.classList.add('mr-on'); G.t = performance.now();
  if (!G.raf) G.raf = requestAnimationFrame(gateTick);
}
function gateOff() { G.on = false; if (G.row) G.row.classList.remove('mr-hot'); G.row = null; if (G.el) G.el.classList.remove('mr-on'); }
addEventListener('pointermove', (e) => { if (G.on) { G.px = e.clientX; G.py = e.clientY; gatePlace(); } }, { passive: true });
addEventListener('scroll', () => { if (G.on && G.row && !G.row.matches(':hover')) gateOff(); }, { passive: true });
addEventListener('hashchange', gateOff);
function catRow(view, menu) {
  const slug = view.slug, line = CAT_LINE[slug] || '', wide = slug === 'dvc', n = view.list.length;
  const li = el('li'), a = el('a', 'mr-row'); a.href = '#media/' + slug; a.dataset.view = slug;
  const nm = el('span', 'mr-rnm', view.name);   // no count beside the name (Kirtan, 25 Nov)
  const ln = el('span', 'mr-rln', line); if (!line) ln.setAttribute('aria-hidden', 'true');
  a.append(nm, ln);
  const th = el('span', 'mr-rth'); th.setAttribute('aria-hidden', 'true');
  view.list.slice(0, 4).forEach(r => { const im = el('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = stillOf(r, 360); th.appendChild(im); });
  a.appendChild(th);
  const frames = view.list.map(r => ({ src: stillOf(r, 720) }));
  const ga = wide ? '16/9' : '9/16', gw = wide ? 'clamp(300px,28vw,420px)' : 'clamp(190px,16vw,250px)';
  const on = (px, py) => {
    if (!rowHover.matches) return;
    menu.querySelectorAll('.mr-row.mr-hot').forEach(r => r !== a && r.classList.remove('mr-hot'));
    a.classList.add('mr-hot'); gateOn(a, frames, ga, gw, px, py);
  };
  a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(e.clientX, e.clientY); });
  a.addEventListener('pointerleave', () => { a.classList.remove('mr-hot'); if (G.row === a) gateOff(); });
  a.addEventListener('focus', () => { if (!a.matches(':focus-visible')) return; const r = a.getBoundingClientRect(); on(r.right - 380, r.top + r.height / 2); });
  a.addEventListener('blur', () => { a.classList.remove('mr-hot'); if (G.row === a) gateOff(); });
  a.addEventListener('click', gateOff);   // the run covers the page; the gate must not ride along
  openRun(a, slug);
  li.appendChild(a);
  return li;
}
/* the index as empty boxes: the four rows with their real names and lines, and one blank card per client. It goes up
   the moment this file runs, before any data, at the size the real index will have (PHONE-AUDIT #3) */
function renderSkeleton() {
  const wrap = el('div', 'mr-view mr-skel'); wrap.dataset.view = 'index'; wrap.setAttribute('aria-busy', 'true');
  const across = el('div', 'mr-sec mr-cr'), menu = el('ul', 'mr-crm'); across.appendChild(menu);
  [['favourites', 'Favourites'], ['viral', 'Viral Reels'], ['dvc', 'DVCs'], ['documentaries', 'Documentaries']].forEach(([slug, name]) => {
    const li = el('li'), a = el('span', 'mr-row'), th = el('span', 'mr-rth'); th.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) th.appendChild(el('i'));
    a.append(el('span', 'mr-rnm', name), el('span', 'mr-rln', CAT_LINE[slug] || ''), th); li.appendChild(a); menu.appendChild(li);
  });
  const folders = el('div', 'mr-sec'), sh = el('div', 'mr-sh'), g = el('div', 'mr-fg'); sh.appendChild(el('h3', '', 'Clients'));
  CLIENTS.filter(([slug]) => FOLDERS[slug]).forEach(() => {
    const c = el('div', 'mr-fc'), meta = el('div', 'mr-fmeta'); meta.setAttribute('aria-hidden', 'true'); meta.appendChild(el('span', 'mr-fv', '\u00a0'));
    c.append(el('span', 'mr-fm'), meta); g.appendChild(c);
  });
  folders.append(sh, g); wrap.append(across, folders);
  return wrap;
}
/* a change of height above the fold must not carry the reader with it: Chrome's scroll anchoring would hold on to the
   footer and throw the page to the bottom when the index lands above it. Off for the swap, back two frames later */
function steady(fn) {
  const st = document.documentElement.style, was = st.overflowAnchor;
  st.overflowAnchor = 'none';
  try { fn(); } finally { requestAnimationFrame(() => requestAnimationFrame(() => { st.overflowAnchor = was; })); }
}
function renderIndex() {
  const wrap = el('div', 'mr-view'); wrap.dataset.view = 'index';
  const clients = el('section', 'mr-sec');
  const sh = el('div', 'mr-sh'); sh.append(el('h3', '', 'Clients'), el('span', '', `${CLIENTS.length} clients`));
  const big = CLIENTS.filter(([slug]) => { const v = VIEWS.get(slug); return sum(v.all || v.list, 'views') >= 1e6; });
  const grid = el('div', 'mr-boxes'); big.forEach(([slug]) => grid.appendChild(box(VIEWS.get(slug))));
  const more = el('div', 'mr-more'), chips = el('div', 'mr-chips');
  more.append(el('span', 'mr-morel', 'And more'), chips);
  CLIENTS.filter(c => !big.includes(c)).forEach(([slug]) => chips.appendChild(chip(VIEWS.get(slug))));
  clients.append(sh, grid, more);
  // the four categories as full-bleed rows; hover flicks through the folder in a frame that follows the pointer
  const across = el('nav', 'mr-sec mr-cr'); across.setAttribute('aria-label', 'Categories');
  const menu = el('ul', 'mr-crm'); across.appendChild(menu);
  CATS.forEach(slug => menu.appendChild(catRow(VIEWS.get(slug), menu)));
  // his 32 clients as folders, most viewed first
  const folders = el('section', 'mr-sec');
  const sh3 = el('div', 'mr-sh'); sh3.appendChild(el('h3', '', 'Clients'));
  const g3 = el('div', 'mr-fg');
  CLIENTS.filter(([slug]) => FOLDERS[slug] && VIEWS.get(slug)).map(([slug]) => ({ slug, ...folderStats(VIEWS.get(slug)) }))
    .sort((a, b) => b.v - a.v).forEach((c, k) => g3.appendChild(folderCard(VIEWS.get(c.slug), c, k)));
  folders.append(sh3, g3);
  wrap.append(across, folders);
  watchFolders(g3);
  return wrap;
}
/* a folder's numbers: every view counts, a film posted on two channels (same_as) is one film, a single image is no film */
function folderStats(view) {
  const all = view.all || view.list, ids = new Set(all.map(r => r.id));
  return { v: sum(all, 'views'), f: all.filter(r => r.type !== 'Image' && !(r.same_as && ids.has(r.same_as))).length };
}
/* a file whose artwork sits inside empty margin: [ink width share, ink height share, ink width/height] */
const INK_BOX = { 'sj-sangath': [0.83, 0.49, 1.71] };
const fRnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
/* a panel of N strips that together cut one still like object-fit: cover. The still loads only when the card nears view */
function fPanel(src, N, seed) {
  const p = el('div', 'mr-fp');
  for (let i = 0; i < N; i++) {
    const s = el('i'); s.style.left = (i * 100 / N) + '%'; s.style.width = `calc(${100 / N}% + 1px)`;
    s.style.setProperty('--o', ((fRnd(i + seed) - 0.5) * 120).toFixed(1) + '%'); p.appendChild(s);
  }
  p._src = BASE + 'media/' + src;
  p._load = () => {
    if (p._im) return; const im = p._im = new Image(); im.decoding = 'async';
    im.onload = () => { [...p.children].forEach(st => { st.style.backgroundImage = `url("${p._src}")`; }); if (p.isConnected) p._fit(); };
    im.src = p._src;
  };
  p._fit = () => {
    const im = p._im; if (!im || !im.naturalWidth) return;
    const w = p.clientWidth, h = p.clientHeight; if (!w || !h) return;
    const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), bw = im.naturalWidth * k, bh = im.naturalHeight * k;
    [...p.children].forEach((st, i) => { st.style.backgroundSize = `${bw}px ${bh}px`; st.style.backgroundPosition = `${-(i * w / N + (bw - w) / 2)}px ${-(bh - h) / 2}px`; });
  };
  return p;
}
const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
let fIO = null;
function watchFolders(grid) {
  if (!finePointer.matches) return;   // touch has no hover: no strips, no stills to fetch
  if (!fIO) fIO = new IntersectionObserver((es) => es.forEach(e => { if (!e.isIntersecting) return; fIO.unobserve(e.target); e.target.querySelectorAll('.mr-fp').forEach(p => p._load()); }), { rootMargin: '400px 0px' });
  grid.querySelectorAll('.mr-fm').forEach(m => fIO.observe(m));
}
function folderCard(view, c, k) {
  const [logo, frames] = FOLDERS[view.slug];
  const wrap = el('div', 'mr-fc');
  const a = el('a', 'mr-fm'); a.href = '#media/' + view.slug; a.dataset.view = view.slug;
  const views = abbr(c.v), films = plural(c.f, ['film', 'films']);
  a.setAttribute('aria-label', [view.name, views && `${views} views`, films].filter(Boolean).join(', '));
  const fr = el('div', 'mr-ff'); fr.setAttribute('aria-hidden', 'true');
  const fine = finePointer.matches;
  if (fine) frames.forEach((s, j) => fr.appendChild(fPanel(s, frames.length === 1 ? 22 : frames.length === 2 ? 11 : 7, k * 7 + j * 3)));
  const mark = el('div', 'mr-fk');
  if (logo) {
    // one optical size for every mark: taller for a square, wider for a long wordmark, never past half the card
    const im = el('img'); im.src = `${BASE}media/logos/${logo}`; im.alt = view.name; im.decoding = 'async'; im.loading = 'lazy';   // the card shows the logo alone; the name is its alt and a hidden span
    const [fw, fh, inkAr] = INK_BOX[view.slug] || [1, 1, (LOGO_FILES[view.slug] || [0, 2])[1]];
    let h = Math.min(44, Math.max(18, 52 / Math.sqrt(inkAr))), w = inkAr * h * 0.625;
    if (w > 50) { w = 50; h = w / (inkAr * 0.625); }
    im.style.width = (w / fw).toFixed(2) + '%'; im.style.height = (h / fh).toFixed(2) + '%';
    mark.appendChild(im);
  }
  else mark.appendChild(el('b', '', view.name));
  const shade = el('div', 'mr-fs'), line = el('p', 'mr-fl'); line.setAttribute('aria-hidden', 'true');
  [views && `${views} views`, films].filter(Boolean).forEach((w, i) => { const s = el('span', i ? 'mr-fsm' : '', w); s.style.setProperty('--w', i * 3); line.append(s, ' '); });
  a.append(fr, shade, mark, line);
  if (logo) a.appendChild(el('span', 'mr-sr', view.name));   // the client's name as real text for search; not shown, the look stays logo only
  const meta = el('div', 'mr-fmeta'); meta.setAttribute('aria-hidden', 'true');
  const fv = el('span', 'mr-fv', views ? `${views} views` : films);
  if (views) fv.appendChild(el('span', 'mr-fvf', ` · ${films}`));   // phones show the views alone: two cards to a row
  meta.append(fv);
  meta.addEventListener('click', () => a.click());
  wrap.append(a, meta);
  const on = (x) => {
    if (!fine) return;
    fr.querySelectorAll('.mr-fp').forEach(p => { p._load(); p._fit(); });
    const r = a.getBoundingClientRect();
    fr.querySelectorAll('.mr-fp i').forEach(s => { const sr = s.getBoundingClientRect(), cx = (sr.left + sr.width / 2 - r.left) / r.width; s.style.setProperty('--d', RM.matches ? '0s' : (Math.abs(cx - x) * 0.3).toFixed(3) + 's'); });
    a.classList.remove('mr-off'); a.classList.add('mr-on');
  };
  const off = () => { if (a.classList.contains('mr-on')) { a.classList.remove('mr-on'); a.classList.add('mr-off'); } };
  a.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; const r = a.getBoundingClientRect(); on((e.clientX - r.left) / r.width); });
  a.addEventListener('pointerleave', off);
  a.addEventListener('focus', () => { if (a.matches(':focus-visible')) on(0.5); });
  a.addEventListener('blur', off);
  a.addEventListener('click', () => { a.classList.remove('mr-on', 'mr-off'); });   // the run covers the card; it comes back at rest
  openRun(a, view.slug);
  return wrap;
}
addEventListener('resize', () => { if (host) host.querySelectorAll('.mr-fp').forEach(p => p._fit()); charts.forEach(c => { if (c.hold.classList.contains('mr-on')) requestAnimationFrame(() => requestAnimationFrame(c.place)); }); }, { passive: true });
function card(r, view, sec, tag) {
  const a = el('a', 'mr-card'); a.href = sec ? `#media/${view.slug}/${r.id}/${sec.key}` : `#media/${view.slug}/${r.id}`; a.dataset.id = r.id;
  if (sec) a.dataset.sec = sec.key;
  const label = [tag, r.client, abbr(r.views) && `${abbr(r.views)} views`].filter(Boolean).join(', ');
  a.setAttribute('aria-label', `Play ${kindOfReel(r)}: ${label}`);
  const po = el('span', 'mr-po'); po.appendChild(poster(r));
  a.appendChild(po);
  if (tag) a.appendChild(el('span', 'mr-cl', tag));
  else if (!view.client) a.appendChild(el('span', 'mr-cl', r.client));
  a.appendChild(numsOf(r.views));
  if (typeof r.note === 'string' && r.note) a.appendChild(el('span', 'mr-note', r.note));   // his own line on one film
  a.addEventListener('click', () => { P.pushed = true; });
  return a;
}

/* the Gujarat Titans folder is one scroll of sections. A reel can sit in two of them, so each section is its own
   playlist and the section key rides in the hash: #media/gujarat-titans/<id>/<section> */
const JT_CITIES = [['Surendranagar', 'Tangaliya weaving'], ['Morbi', 'Tile factories'], ['Amreli', 'Lok gayak'], ['Ahmedabad'], ['Anand', 'Amul']];
const JT_TYPES = [['documentary', 'Documentary'], ['city_video', 'City video'], ['vox_pop', 'Vox pop']];
const JT_INTRO = 'Junior Titans went to 5 cities in 1 month, 2 days in each: Surendranagar, Morbi, Amreli, Ahmedabad and Anand. Every city got a vox pop and a city video to hype the event, and four got a documentary. I was the producer and the iPhone shooter, ran production with Ohm, and gave the concepts for the city videos. With us: 1 drone operator and 3 videographers.';
function gtSections(byViews) {
  const gt = REELS.filter(r => r.client === 'Gujarat Titans');
  const jt = [];
  JT_CITIES.forEach(([city]) => JT_TYPES.forEach(([type]) => { const r = gt.find(x => x.gt_section === 'junior_titans' && x.jt_city === city && x.jt_type === type); if (r) jt.push(r); }));
  return [
    // every GT video once: Junior Titans first claims its films, the vox pops theirs, the sized grid takes the rest
    { key: 'selected', name: 'Selected', list: gt.filter(r => r.gt_section !== 'junior_titans' && !r.in_vox).sort(byViews) },
    { key: 'junior-titans', name: 'Junior Titans', list: jt },
    { key: 'vox-pops', name: 'Vox Pops', list: gt.filter(r => r.in_vox && r.gt_section !== 'junior_titans').sort(byViews) },
  ].filter(s => s.list.length).map(s => ({ ...s, slug: 'gujarat-titans', client: true }));
}
function renderView(view) {
  const wrap = el('div', 'mr-view'); wrap.dataset.view = view.slug;
  const bar = el('div', 'mr-vbar');
  const back = el('a', 'mr-back'); back.href = '#media';
  back.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 22 17" aria-hidden="true"><path d="M21 8.5H2M9 1.5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  back.appendChild(document.createTextNode('All of Media'));
  bar.appendChild(back);
  const dh = el('div', 'mr-dh');
  dh.appendChild(el('h3', '', view.name));
  const stat = el('div', 'mr-dstat');
  const add = (b, s) => { if (!b) return; const d = el('div'); d.append(el('b', '', b), el('small', '', s)); stat.appendChild(d); };
  const all = view.all || view.list;
  add(String(all.length), all.length === 1 ? 'reel' : 'reels');
  if (view.client) add(abbr(sum(all, 'views')), 'views');
  dh.appendChild(stat);
  wrap.append(bar, dh);
  const grid = el('div', 'mr-grid');
  view.list.forEach(r => grid.appendChild(card(r, view)));
  wrap.appendChild(grid);
  return wrap;
}

function moveTo(y) {
  const top = Math.max(0, y);
  if (window.KP && KP.lenis) { KP.lenis.resize?.(); KP.lenis.scrollTo(top, { immediate: true, force: true }); }   // a new view changes the page height, and a stale limit clamps the jump
  else scrollTo(0, top);
}
const topOfLayer = () => host.getBoundingClientRect().top + scrollY - 16;
function setView(slug, fromUser) {
  const key = slug && VIEWS.has(slug) ? slug : 'index';
  if (curView === key) return;
  const wasIndex = curView === 'index';
  if (wasIndex && key !== 'index') indexY = scrollY;
  const first = curView == null;
  curView = key;
  const node = key === 'index' ? renderIndex() : renderView(VIEWS.get(key));
  steady(() => host.replaceChildren(node));
  api.refresh();
  if (!first || key !== 'index') {
    const place = () => {
      if (key === 'index') { if (indexY != null) moveTo(indexY); indexY = null; } else moveTo(topOfLayer());
    };
    if (first && !(window.KP && KP.final)) addEventListener('kp:final', () => requestAnimationFrame(place), { once: true });
    else place();
    requestAnimationFrame(place);          // the browser's own restore on back can land a frame later
    if (first && key !== 'index') {        // a cold deep link: the page above is still settling. Any real input ends this at once
      let live = true;
      const stop = () => { live = false; };
      for (const t of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(t, stop, { once: true, passive: true });
      const again = () => { if (live && curView === key) place(); };
      if (window.KP && KP.final) { setTimeout(again, 250); setTimeout(again, 700); }
      else addEventListener('kp:final', () => { setTimeout(again, 250); setTimeout(again, 700); }, { once: true });
    }
  }
  if (fromUser !== false && !first && !RM.matches) node.animate([{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: ARRIVE });
}

/* ---------- a client's run, handed to work-g.js ---------- */
const reelPath = (r) => (typeof r.poster === 'string' && /^media\/clips\/[\w-]+$/.test(r.poster) ? `${r.poster}.w1080.webp` : `media/reels/${encodeURIComponent(r.id)}.w720.webp`);
const hrefOf = (view, r, sec) => (sec ? `#media/${view.slug}/${r.id}/${sec.key}` : `#media/${view.slug}/${r.id}`);
/* ---------- playback policy ----------
   Laptops (fine pointer, no reduced motion, no data saver): a big tile with a local file plays while half in view, any
   tile with one plays on hover after 120 ms. Phones never autoplay; tapping opens the player. At most two video elements
   exist, reused across tiles; a released one drops its src and calls load() so its memory goes. A missing file falls
   back to the poster without a word. */
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const canPlay = () => FINE.matches && !RM.matches && !(navigator.connection && navigator.connection.saveData);
const srcOf = (r) => [r.clip, r.file, REEL_LOOPS[r.id]].find(x => typeof x === 'string' && /^media\/[\w/.-]+\.mp4$/.test(x)) || null;
const POOL = [];
function release(v) { if (!v) return; v.onerror = null; v.pause(); v.removeAttribute('src'); v.load(); v.remove(); v._tile = null; }   // onerror closes over the tile: cleared, or a pooled video keeps a closed page alive
function playIn(tile, src) {
  if (!canPlay() || document.documentElement.classList.contains('mr-lock') || !tile.isConnected) return;
  if (POOL.some(v => v._tile === tile)) return;
  let v = POOL.find(x => !x._tile || !x._tile.isConnected);
  if (!v && POOL.length < 2) { v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('aria-hidden', 'true'); POOL.push(v); }
  if (!v) { v = POOL.find(x => !x._tile._auto) || POOL[0]; }
  release(v);
  v._tile = tile; v.onerror = () => release(v); v.src = BASE + src;
  tile.querySelector('.mr-tm').appendChild(v); v.play().catch(() => {});
}
function stopIn(tile) { POOL.forEach(v => { if (v._tile === tile) release(v); }); }
function stopAll() { POOL.forEach(release); }
let hoverT = 0, autoIO = null;
const autos = new Set();
function watchAuto(tile, src) {
  if (!('IntersectionObserver' in window)) return;
  autoIO ||= new IntersectionObserver((es) => es.forEach(e => { const t = e.target; if (e.isIntersecting && e.intersectionRatio >= 0.5) playIn(t, t._src); else if (!t.matches(':hover')) stopIn(t); }), { threshold: [0, 0.5] });
  tile._auto = true; tile._src = src; autos.add(tile); autoIO.observe(tile);
}
export function forget(page) {
  autos.forEach(t => { if (!t.isConnected || page.contains(t)) { autos.delete(t); if (autoIO) autoIO.unobserve(t); } });
  POOL.forEach(v => { if (v._tile && (!v._tile.isConnected || page.contains(v._tile))) release(v); });
  clearTimeout(hoverT);
  charts.forEach(c => { if (page.contains(c.s)) { c.io.disconnect(); c.hold.remove(); charts.delete(c); } });
}
function rewatch() { if (autoIO) autos.forEach(t => { if (!t.isConnected) { autos.delete(t); autoIO.unobserve(t); return; } autoIO.unobserve(t); autoIO.observe(t); }); }
document.addEventListener('visibilitychange', () => { if (document.hidden) POOL.forEach(v => v.pause()); else POOL.forEach(v => { if (v._tile && v._tile.isConnected) v.play().catch(() => {}); }); });
/* the quiet words a video may carry, in one style: its type (Documentary, Vox pop, City video, CGI, Post) and his role */
const ROLE = { acting: 'I act in this one' };
function tagsOf(r, type) {
  const t = [];
  if (type) t.push(type);
  if (r.format === 'cgi') t.push('CGI');
  if (isPost(r) && abbr(r.views)) t.push('Post');
  if (typeof r.me === 'string' && r.me.trim()) t.push(ROLE[r.me.trim()] || r.me.trim());
  return t;
}
function viewsEl(r) { const v = abbr(r.views), b = el('b', '', v || (isPost(r) ? 'Post' : '')); if (v) b.append(' ', el('small', '', 'views')); return b; }   // a real space, so it is read "1.4M views"
/* one line under every video: its views, and on the same line any tag it carries (on category pages, whose film it is) */
function labelOf(view, r, size, tag) {
  const lab = el('span', 'mr-tlb');
  lab.appendChild(viewsEl(r));
  const tags = tagsOf(r, tag);
  if (!view.client && size !== 'S') tags.unshift(r.client);
  if (tags.length) { const t = el('span', 'mr-tags'); tags.forEach(x => t.append(el('i', 'mr-tag', x), ' ')); lab.append(' ', t); }   // spaces for the read-out only; the flex rows drop them
  return lab;
}
function gridTile(view, r, sec, size, tag) {
  const t = el('div', `mr-gt mr-hit mr-s${size}` + (isPost(r) ? ' mr-post' : '')); t.tabIndex = 0; t.setAttribute('role', 'link'); t.dataset.id = r.id; if (sec) t.dataset.sec = sec.key;
  const m = el('span', 'mr-tm'), im = el('img'); im.loading = 'lazy'; im.draggable = false;
  setPoster(im, r, size === 'W' ? '(max-width:760px) 92vw, 640px' : size === 'S' ? '(max-width:760px) 45vw, 120px' : size === 'M' ? '(max-width:760px) 45vw, 240px' : '(max-width:760px) 92vw, 380px');
  const lab = labelOf(view, r, size, tag);
  m.appendChild(im); t.append(m, lab);
  if (typeof r.note === 'string' && r.note) m.appendChild(el('span', 'mr-tnote', r.note));   // his own line on one film, set on the picture so the grid keeps its sizes
  // the name starts with what the tile shows (views, tags), then says what it is
  t.setAttribute('aria-label', `${lab.textContent.replace(/\s+/g, ' ').trim()}. Play ${kindOfReel(r)}: ${[r.client, when(r.date)].filter(Boolean).join(', ')}`);
  const play = () => { if (api.runs.dragged) return; stopAll(); P.pushed = true; location.hash = hrefOf(view, r, sec); };
  t.addEventListener('click', play);
  t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); play(); } });
  const src = srcOf(r);
  if (src) {
    t.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(hoverT); hoverT = setTimeout(() => playIn(t, src), 120); }, { passive: true });
    t.addEventListener('pointerleave', () => { clearTimeout(hoverT); if (!t._auto) stopIn(t); }, { passive: true });
    if (size === 'L' && canPlay()) watchAuto(t, src);
  }
  return t;
}
/* the columns. L = 3 + (N mod 3) desktop, 3 + ((N - 3) mod 2) phone, M the next 20%, S the rest: the counts always fill */
const byViewsDesc = (a, b) => (Number(b.r.views) || 0) - (Number(a.r.views) || 0);
const byNewest = (a, b) => String(b.r.date || '').localeCompare(String(a.r.date || ''));
function planGrid(rows, phone, heroN) {
  const N = rows.length + heroN, ranked = [...rows].sort(byViewsDesc);
  if (N <= 6) return ranked.map(x => ({ t: 'L', items: [x] }));
  const Ltot = phone ? 3 + ((N - 3) % 2) : 3 + (N % 3), L = Math.max(0, Ltot - heroN), rest = N - Ltot;
  const M = phone ? 0 : Math.min(Math.round(N * 0.2), Math.floor(rest / 3));
  const ls = ranked.slice(0, L), ms = ranked.slice(L, L + M), ss = ranked.slice(L + M).sort(byNewest);
  const lead = Math.max(0, 3 - heroN), cols = ls.slice(0, lead).map(x => ({ t: 'L', items: [x] })), packed = [];
  const nCols = phone ? ss.length / 2 : ms.length + (ss.length - 2 * ms.length) / 3;
  let mi = 0, si = 0, top = true;
  for (let i = 0; i < nCols; i++) {
    const wantM = !phone && ms.length && Math.floor((i + 1) * ms.length / nCols) > Math.floor(i * ms.length / nCols) && mi < ms.length;
    if (wantM) { packed.push({ t: 'M', top, items: [ms[mi++], ss[si++], ss[si++]] }); top = !top; }
    else { const n = phone ? 2 : 3; packed.push({ t: 'S', items: ss.slice(si, si + n) }); si += n; }
  }
  const extra = ls.slice(lead);
  extra.forEach((x, k) => packed.splice(Math.floor(packed.length * (k + 1) / (extra.length + 1)) + k, 0, { t: 'L', items: [x] }));
  return cols.concat(packed);
}
/* a landscape film (a DVC whose still is wider than tall) goes two to a column at its own ratio; the rest plan as before */
const AR = new Map();
const arOf = (r) => AR.get(r.id) || 0.5625;
const isWide = (r) => arOf(r) > 1.05;
function widePlan(rows, phone, heroN, flat) {
  const wide = rows.filter(x => isWide(x.r)).sort(byViewsDesc), tall = rows.filter(x => !isWide(x.r));
  const n = phone ? 2 : 3;
  const plan = !tall.length ? [] : flat ? Array.from({ length: Math.ceil(tall.length / n) }, (_, i) => ({ t: 'S', items: tall.slice(i * n, i * n + n) })) : planGrid(tall, phone, heroN);
  const ws = []; for (let i = 0; i < wide.length; i += 2) ws.push({ t: 'W', items: wide.slice(i, i + 2) });
  if (!plan.length) return ws;
  let lead = 0; while (lead < plan.length && plan[lead].t === 'L') lead++;
  lead = Math.max(1, Math.min(lead, plan.length));
  ws.forEach((c, k) => { const at = lead + Math.floor((plan.length - lead) * (k + 1) / (ws.length + 1)) + k; plan.splice(at, 0, c); });
  return plan;
}
function sizedGrid(view, rows, sec, heroN, onPlan, flat) {
  const s = el('section', 'wkg-pn mr-gp' + (flat ? ' mr-vxg' : '')), g = el('div', 'mr-g');
  g._fill = (phone) => {
    const plan = widePlan(rows, phone, heroN, flat);
    if (onPlan) onPlan(plan);
    g.replaceChildren(...plan.map(c => {
      const col = el('div', `mr-col mr-c${c.t}`);
      const tile = (x, size) => gridTile(view, x.r, sec, size, x.tag);
      if (c.t === 'W') { if (c.items.length === 1) col.classList.add('mr-cW1'); col.style.setProperty('--ar', Math.max(...c.items.map(x => arOf(x.r))).toFixed(3)); c.items.forEach(x => { const t = tile(x, 'W'); t.style.setProperty('--tar', arOf(x.r).toFixed(3)); col.appendChild(t); }); }
      else if (c.t === 'L') col.appendChild(tile(c.items[0], 'L'));
      else if (c.t === 'S') c.items.forEach(x => col.appendChild(tile(x, 'S')));
      else { const m = tile(c.items[0], 'M'), a = tile(c.items[1], 'S'), b = tile(c.items[2], 'S'); if (c.top) col.append(m, a, b); else col.append(a, b, m); }
      return col;
    }));
    let lead = 0; for (const c of plan) { if (c.t !== 'L') break; lead++; }
    g.style.setProperty('--lead', !phone && plan.some(c => c.t !== 'L' && c.t !== 'W') ? lead : 0);
  };
  s.appendChild(g);
  return s;
}
const charts = new Set();   // each chart panel's observer, dropped with its page
const dayOf = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
const hitFor = (id, sec) => { const pg = document.querySelector('.wkg-page.wkg-show'); if (!pg) return null; const q = `.mr-hit[data-id="${CSS.escape(id)}"]`; return (sec && pg.querySelector(`${q}[data-sec="${CSS.escape(sec)}"]`)) || pg.querySelector(q); };
/* the slim graph, for clients with 20+ dated videos: months with posts only, log-scale height, big films in colour */
function graphPanel(rows, bigIds) {
  const s = el('section', 'wkg-pn mr-tlp'), box = el('div', 'wkg-pi');
  const vs = rows.map(x => Number(x.r.views) || 1), lo = Math.log10(Math.min(...vs) * 0.7), hi = Math.log10(Math.max(...vs));
  const read = el('p', 'mr-tread'); read.setAttribute('aria-live', 'polite');
  const cread = el('p', 'mr-tcr'); cread.setAttribute('aria-live', 'polite');
  const say = ({ r }) => { for (const n of [read, cread]) n.replaceChildren(el('b', '', `${abbr(r.views) || 0} views`), document.createTextNode(dayOf(r.date))); };
  // phones: the bar under the chart (see .mr-tctl). It is in play only while it sits in a pinned run's scroller
  const hold = el('div', 'mr-tch'), ctl = el('div', 'mr-tctl'); ctl.setAttribute('role', 'group'); ctl.setAttribute('aria-label', 'Views chart');
  const picking = () => hold.isConnected && hold.parentNode.classList.contains('wkg-pin') && PHONEQ.matches;
  const marks = [], barEls = []; let cur = 0;
  const bars = el('div', 'mr-bars'), ticks = el('div', 'mr-ticks'); ticks.setAttribute('aria-hidden', 'true');
  const peak = rows.reduce((a, x) => ((Number(x.r.views) || 0) > (Number(a.r.views) || 0) ? x : a));
  const bw = PHONEQ.matches ? 24 : 14;
  let mo = null, moKey = '', x = 0, lastTick = -1e9, lit = null, i = 0;
  rows.forEach((row) => {
    const { r, sec } = row, key = r.date.slice(0, 7);
    if (key !== moKey) {
      if (mo) x += 6;
      mo = el('div', 'mr-mo'); bars.appendChild(mo); moKey = key;
      if (x - lastTick >= 76) { const t = el('span', '', when(r.date)); t.style.left = x + 'px'; ticks.appendChild(t); lastTick = x; }
    }
    const b = el('button', 'mr-bar' + (bigIds.has(r.id) ? ' mr-big' : '')); b.type = 'button'; b.style.setProperty('--i', i++);
    const bar = el('i'); bar.style.setProperty('--h', `${((Math.log10(Number(r.views) || 1) - lo) / (hi - lo || 1)) * 100}%`); b.appendChild(bar);
    b.setAttribute('aria-label', `Go to ${kindOfReel(r)}: ${[dayOf(r.date), abbr(r.views) && `${abbr(r.views)} views`, shortCap(r)].filter(Boolean).join(', ')}`);
    const mark = () => { bars.querySelector('.mr-now')?.classList.remove('mr-now'); b.classList.add('mr-now'); say(row); if (lit) lit.classList.remove('mr-hl'); lit = hitFor(r.id, sec && sec.key); if (lit) lit.classList.add('mr-hl'); };
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mark(); });
    b.addEventListener('focus', mark);
    b.addEventListener('pointerleave', () => { if (lit) { lit.classList.remove('mr-hl'); lit = null; } });
    b.addEventListener('blur', () => { if (lit) { lit.classList.remove('mr-hl'); lit = null; } });
    const at = marks.length; marks.push(mark); barEls.push(b);
    b.addEventListener('click', () => { if (api.runs.dragged) return; mark(); if (picking()) { cur = at; return; } const n = hitFor(r.id, sec && sec.key); if (lit) { lit.classList.remove('mr-hl'); lit = null; } api.runs.jump(n); });
    mo.appendChild(b); x += bw;
  });
  say(peak); cur = rows.indexOf(peak);
  const step = (d) => { cur = (cur + d + rows.length) % rows.length; marks[cur](); api.runs.reveal(barEls[cur]); };
  const btn = (text, label, fn) => { const b = el('button', 'mr-tcb', text); b.type = 'button'; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; };
  const go = btn('Show video', 'Go to the picked video', () => { const row = rows[cur], n = hitFor(row.r.id, row.sec && row.sec.key); if (lit) { lit.classList.remove('mr-hl'); lit = null; } if (n) api.runs.jump(n); });
  go.classList.add('mr-tcg');
  ctl.append(cread, btn('Previous', 'Previous video in the chart', () => step(-1)), go, btn('Next', 'Next video in the chart', () => step(1)));
  hold.appendChild(ctl);
  if ('IntersectionObserver' in window) {
    // shown while the chart crosses the middle of the screen; placed under the month labels, wherever the screen puts them
    const io = new IntersectionObserver((es) => {
      const e = es[es.length - 1], sc = s.closest('.wkg-sc'); if (!sc) return;
      if (hold.parentNode !== sc) sc.insertBefore(hold, sc.firstChild);
      const on = e.isIntersecting && picking();
      if (on) { if (!bars.querySelector('.mr-now')) barEls[cur].classList.add('mr-now'); requestAnimationFrame(place); }
      hold.classList.toggle('mr-on', on);
    }, { rootMargin: '0px -49% 0px -49%' });
    const place = () => { const sc = hold.parentNode; if (sc) hold.style.setProperty('--ty', Math.round(ticks.getBoundingClientRect().bottom - sc.getBoundingClientRect().top + 10) + 'px'); };
    io.observe(s); charts.add({ s, io, hold, place });
  }
  box.style.width = Math.max(x, innerWidth <= 760 ? innerWidth - 36 : 320) + 'px';
  box.append(read, bars, ticks); s.appendChild(box);
  return s;
}
/* Junior Titans as a road trip: the stops in the order their films were posted, each holding its films */
function routePanel(cities) {
  const s = el('section', 'wkg-pn wkg-railp mr-route'), i = el('div', 'wkg-pi'), ol = el('ol', 'wkg-stops');
  cities.forEach(({ city, subject, rows, sec }, n) => {
    const li = el('li', 'wkg-stop'); li.style.setProperty('--i', n);
    const lo = el('div', 'wkg-slo'); lo.appendChild(el('h3', 'mr-rc', city));
    lo.appendChild(el('span', 'mr-rp', [subject, `first post ${dayOf(rows[0].date)}`].filter(Boolean).join(', ')));
    rows.forEach(r => {
      const label = (JT_TYPES.find(t => t[0] === r.jt_type) || [])[1] || 'Film', b = el('button', 'mr-rf'); b.type = 'button';
      b.append(el('span', '', label), el('span', '', abbr(r.views) ? `${abbr(r.views)} views` : ''));
      b.setAttribute('aria-label', `Go to ${city} ${label}${abbr(r.views) ? `, ${abbr(r.views)} views` : ''}`);
      b.addEventListener('click', () => { if (!api.runs.dragged) api.runs.jump(hitFor(r.id, sec.key)); });
      lo.appendChild(b);
    });
    li.append(el('div', 'wkg-sup'), el('i', 'wkg-dot'), lo);
    ol.appendChild(li);
  });
  i.append(el('h2', 'wkg-h2', 'The route'), ol, el('p', 'mr-pull', JT_CREW)); s.appendChild(i);
  return s;
}
/* ---------- Viral Reels only: reactions that float up while the run moves ----------
   Hearts mostly, a lit flame now and then, and once in a while a small bubble made of marks only (never words). One pool
   of 14 nodes, animated with the Web Animations API (transform and opacity, so the compositor runs them), nothing at
   rest, nothing under reduced motion. */
const RX_SVG = {
  heart: '<svg viewBox="0 0 24 24"><path fill="#1c3bb0" stroke="#f1f2f0" stroke-width="1.6" d="M12 20.6s-7.6-4.8-7.6-10.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.6 2.9c0 5.6-7.6 10.4-7.6 10.4Z"/></svg>',
  lit: '<svg viewBox="0 0 24 24"><path fill="#f2a7b6" stroke="#0c0d0f" stroke-width="1.2" d="M12 1.8c1 4 5.6 6 5.6 11.5A5.6 5.6 0 0 1 6.4 13.3c0-2.6 1.2-4 2.4-5.2.2 1.7.9 2.8 2 3.4C10.6 7.8 10.8 4.6 12 1.8Z"/><path fill="#f1f2f0" d="M12 11c.8 2 2.8 3 2.8 5.4a2.8 2.8 0 0 1-5.6 0c0-1.6.9-2.6 1.6-3.3.2.7.5 1.1 1 1.3C11.6 13.3 11.6 12.2 12 11Z"/></svg>',
};
RX_SVG.bubble = (marks) => `<span class="mr-rxb">${marks.map(m => RX_SVG[m]).join('')}</span>`;
function reactions(page) {
  if (page._rx) return page._rx;
  const layer = el('div', 'mr-rxl'); layer.setAttribute('aria-hidden', 'true'); page.appendChild(layer);
  const pool = Array.from({ length: 14 }, () => { const n = el('span', 'mr-rx'); n._busy = false; layer.appendChild(n); return n; });
  let px = innerWidth * 0.6, py = innerHeight * 0.6, acc = 0, n = 0;
  const coarse = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  page.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; } }, { passive: true });
  const emit = (x, y, kind) => {
    const node = pool.find(q => !q._busy); if (!node) return;
    node._busy = true; n++;
    const k = kind || (n % 9 === 0 ? 'bubble' : n % 4 === 0 ? 'lit' : 'heart');
    node.innerHTML = k === 'bubble' ? RX_SVG.bubble(n % 2 ? ['lit', 'lit', 'lit'] : ['heart', 'lit']) : RX_SVG[k];
    node.className = 'mr-rx' + (k === 'bubble' ? ' mr-rxbw' : '');
    const rise = 80 + Math.random() * 60, dx = (Math.random() - 0.5) * 50, rot = (Math.random() - 0.5) * 36;
    node.style.left = (x - 14) + 'px'; node.style.top = (y - 14) + 'px';
    const a = node.animate([
      { transform: 'translate3d(0,0,0) scale(.4) rotate(0deg)', opacity: 0 },
      { transform: `translate3d(${dx * 0.2}px,-${rise * 0.18}px,0) scale(1.15) rotate(${rot * 0.4}deg)`, opacity: 1, offset: 0.16 },
      { transform: `translate3d(${dx}px,-${rise}px,0) scale(.9) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 1200, easing: 'cubic-bezier(.2,.7,.3,1)' });
    a.onfinish = () => { node._busy = false; node.style.opacity = '0'; };
  };
  const at = () => (coarse ? [innerWidth - 40 - Math.random() * 60, innerHeight - 120 - Math.random() * 40] : [px + (Math.random() - 0.5) * 30, py - 10]);
  // a small burst the first time the pointer meets a tile
  const met = new WeakSet();
  page._track.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('.mr-gt'); if (!t || met.has(t) || e.pointerType !== 'mouse') return;
    met.add(t); for (let i = 0; i < 3; i++) setTimeout(() => emit(e.clientX + (i - 1) * 14, e.clientY - 6), i * 90);
  }, { passive: true });
  page._rx = (vel, dt) => {
    acc += Math.min(Math.abs(vel), 4000) / (coarse ? 900 : 320) * dt;   // the faster the run moves, the more come up; touch stays sparse
    while (acc >= 1) { acc -= 1; emit(...at()); }
  };
  return page._rx;
}
function buildRuns() {
  const slugs = [...CLIENTS.map(c => c[0]), 'favourites', 'viral', 'dvc', 'documentaries'];
  const sib = [];
  slugs.forEach((slug, i) => {
    const view = VIEWS.get(slug), m = MAN.get(slug), all = view.all || view.list;
    const noun = view.noun || nounsOf(all), ranked = [...all].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    const heroReel = all.find(r => r.lead) || all.find(r => r.id === HEROES[slug]) || ranked.find(r => !r.demote) || ranked[0];   // lead names his opener, demote keeps one out of it   // a lead flag in the data names his opener
    const blocks = [], bigIds = new Set([heroReel.id]);
    const noteBig = (plan) => plan.forEach(c => { if (c.t === 'L') bigIds.add(c.items[0].r.id); });
    const wrap = (list, tagOf) => list.map(r => ({ r, tag: tagOf ? tagOf(r) : undefined }));
    let grid = null, crew = null, heroCount = 0;
    if (view.sections) {
      for (const sec of view.sections) {
        if (sec.key === 'vox-pops') { const rows = wrap(sec.list); grid = () => { const f = document.createDocumentFragment(), h = el('section', 'wkg-pn mr-vxp'), big = el('p', 'mr-vxh', 'And a lot of vox pops.'); big.setAttribute('role', 'heading'); big.setAttribute('aria-level', '2'); h.appendChild(big); f.append(h, sizedGrid(view, rows, sec, 0, null, true)); return f; }; continue; }   // just the thumbnails, in the run's own columns
        if (sec.key !== 'junior-titans') { const rows = wrap(sec.list.filter(r => r !== heroReel)); if (rows.length) blocks.push({ panel: () => sizedGrid(view, rows, sec, 1, noteBig) }); continue; }
        const cities = JT_CITIES.map(([city, subject]) => ({ city, subject, sec, rows: sec.list.filter(r => r.jt_city === city).sort((a, b) => String(a.date).localeCompare(String(b.date))) })).filter(c => c.rows.length)
          .sort((a, b) => a.rows[0].date.localeCompare(b.rows[0].date));
        blocks.push({ ch: 'jt', title: sec.name, count: plural(sec.list.length, ['film', 'films']), note: JT_INTRO });
        blocks.push({ ch: 'jt', panel: () => routePanel(cities) });
        heroCount = 1;
        cities.forEach(({ city, subject, rows }) => { const w = wrap(rows.filter(r => r !== heroReel), r => (JT_TYPES.find(t => t[0] === r.jt_type) || [])[1]); blocks.push({ ch: 'jt', title: city, note: subject, count: plural(rows.length, ['film', 'films']), panel: () => sizedGrid(view, w, sec, 0, noteBig) }); });
      }
    } else { heroCount = 1; const rows = wrap(view.list.filter(r => r !== heroReel)); if (rows.length) blocks.push({ panel: () => sizedGrid(view, rows, null, 1, noteBig, slug === 'favourites') }); }   // Favourites: every reel the same size, his order   // the opening film is the first big tile
    const seen = new Set(), dated = [];
    (view.sections ? view.sections.filter(x => x.key !== 'vox-pops') : [view]).forEach(x => x.list.forEach(r => { if (seen.has(r.id) || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) return; seen.add(r.id); dated.push({ r, sec: x.key ? x : null }); }));
    dated.sort((a, b) => a.r.date.localeCompare(b.r.date));
    const count = abbr(sum(all, 'views')), heroLoop = canPlay() ? srcOf(heroReel) : null;   // phones: the opening film is its poster
    const isClient = i < CLIENTS.length;
    const p = {
      id: `media-run-${slug}`, hash: `#media/${slug}`, wing: 'media', name: view.name, orientation: null,
      one_line: (m && m.one_line) || (NOTES[slug] && typeof NOTES[slug].intro === 'string' ? NOTES[slug].intro : ''), writeup: (m && m.writeup) || [], facts: (m && m.facts) || [], credits: (m && m.credits) || [],
      hero: reelPath(heroReel), gallery: [reelPath(heroReel)], video: heroLoop, heroAlt: altOfReel(heroReel),
      _run: {
        stats: [...countText(all).split(', ').map(t => { const [n, ...w] = t.split(' '); const x = w.join(' '); return { label: x.charAt(0).toUpperCase() + x.slice(1), v: n }; }), ...(count ? [{ label: 'Views', v: count }] : [])],
        line: [countText(all), count && `${count} views`].filter(Boolean).join(', '),
        mark: () => markOf(slug), sheet: (done) => catSheet(slug, done),
        blocks, grid, crew, sib, heroCount, nextWord: i < CLIENTS.length - 1 ? 'Next client' : 'Next',
        timeline: isClient && dated.length >= 20 ? () => graphPanel(dated, bigIds) : null,
        heroDeco: (hm) => {
          const hit = el('span', 'mr-hit'); hit.tabIndex = 0; hit.setAttribute('role', 'link'); hit.dataset.id = heroReel.id;
          const sec = view.sections && view.sections.find(x => x.key !== 'vox-pops' && x.list.includes(heroReel)); if (sec) hit.dataset.sec = sec.key;
          hit.setAttribute('aria-label', `Play ${kindOfReel(heroReel)}: ${[heroReel.client, abbr(heroReel.views) && `${abbr(heroReel.views)} views`, when(heroReel.date)].filter(Boolean).join(', ')}`);
          const play = () => { if (api.runs.dragged) return; P.pushed = true; location.hash = hrefOf(view, heroReel, sec); };
          hit.addEventListener('click', play);
          hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); play(); } });
          hm.appendChild(hit); if (isPost(heroReel)) hm.classList.add('mr-post');
          if (isWide(heroReel)) {
            hm.classList.add('mr-hland'); hm.style.setProperty('--har', arOf(heroReel).toFixed(3));
            const up = () => { const h = hm.closest('.wkg-hero'); if (h) h.style.setProperty('--har', arOf(heroReel).toFixed(3)); return h; };   // the title places itself under the film on phones
            if (!up()) requestAnimationFrame(up);
          }
        },
        heroLab: () => { const l = labelOf(view, heroReel, 'L'); l.classList.add('mr-hlab'); if (isWide(heroReel)) { l.classList.add('mr-hlw'); l.style.setProperty('--har', arOf(heroReel).toFixed(3)); } return l; },
        tied: new Set(), next: () => sib[(i + 1) % sib.length],
        onTick: slug === 'viral' && !RM.matches ? (page, vel, dt) => reactions(page)(vel, dt) : null,
      },
    };
    sib.push(p); RUNS.set(slug, p);
  });
  api.runs.add(sib);
}
export function runOf(hash) { const m = /^#media\/([\w-]+)/.exec(hash || ''); const p = m && RUNS.get(m[1]); return p ? p.id : null; }
export function titleOf(hash) { const m = /^#media\/([\w-]+)/.exec(hash || ''); const v = m && VIEWS.get(m[1]); return v ? v.name : null; }   // the tab title of a client or category (work-g.js sets it)
export function boxOf(p) { const s = p.hash.split('/')[1]; return host.querySelector(`a[data-view="${CSS.escape(s)}"]`); }

/* ---------- the player ---------- */
const P = { root: null, frame: null, view: null, i: 0, pushed: false, back: null };
function buildPlayer() {
  const root = el('div', 'mr-pl');
  root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Video player'); root.setAttribute('data-lenis-prevent', '');
  const close = el('button', 'mr-btn mr-close', 'Close'); close.type = 'button'; close.addEventListener('click', closePlayer);
  const info = el('div', 'mr-info');
  P.name = el('h2'); P.nums = el('div', 'mr-pn'); P.meta = el('p', 'mr-meta');
  P.ig = el('a', 'mr-btn mr-ig', 'Open on Instagram'); P.ig.target = '_blank'; P.ig.rel = 'noopener noreferrer';
  info.append(P.name, P.nums, P.meta, P.ig);
  P.frame = el('div', 'mr-fr');
  const nav = el('div', 'mr-nav');
  P.count = el('p', 'mr-count');
  const prev = el('button', 'mr-btn', 'Previous'); prev.type = 'button'; prev.addEventListener('click', () => step(-1));
  P.ig2 = el('a', 'mr-btn mr-ig mr-ig2', 'Open on Instagram'); P.ig2.target = '_blank'; P.ig2.rel = 'noopener noreferrer';
  const next = el('button', 'mr-btn', 'Next'); next.type = 'button'; next.addEventListener('click', () => step(1));
  nav.append(P.count, prev, P.ig2, next);
  root.append(close, info, P.frame, nav);
  document.body.appendChild(root);
  P.root = root; P.close = close;
  addEventListener('keydown', onKey, true);
}
function onKey(e) {
  if (!P.root || P.root.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePlayer(); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowLeft' ? -1 : 1); return; }
  if (e.key === 'Tab') {
    const f = [...P.root.querySelectorAll('button,a[href],iframe')].filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const a = document.activeElement, i = f.indexOf(a);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  }
}
function fill() {
  const r = P.view.list[P.i], ig = igOf(r.url);
  P.name.textContent = r.client;
  P.nums.replaceChildren();
  for (const [v, label] of [[r.views, 'views']]) { const t = abbr(v); if (!t) continue; const s = el('div'); s.append(el('b', '', t), el('span', '', label)); P.nums.appendChild(s); }
  P.meta.textContent = [shortCap(r), ...tagsOf(r)].filter(Boolean).join(' \u00b7 ');
  P.count.textContent = `${P.i + 1} of ${P.view.list.length}`;
  for (const a of [P.ig, P.ig2]) { if (ig) { a.href = ig.page; a.hidden = false; } else { a.removeAttribute('href'); a.hidden = true; } }
  P.frame.classList.remove('mr-on');
  P.frame.replaceChildren();
  const im = el('img'); im.alt = altOfReel(r); im.decoding = 'async';
  im.addEventListener('error', () => im.remove(), { once: true });
  im.src = posterOf(r);
  P.frame.appendChild(im);
  if (!ig) return;
  if (r.embed === false) {                   // Instagram refuses to embed this one: the poster itself links out
    const go = el('a', 'mr-off'); go.setAttribute('aria-label', `Watch this ${r.client} ${kindOfReel(r)} on Instagram`); go.href = ig.page; go.target = '_blank'; go.rel = 'noopener noreferrer';
    P.frame.appendChild(go);
    return;
  }
  const f = el('iframe');
  f.title = `${r.client} ${kindOfReel(r)} on Instagram`;
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation');
  f.setAttribute('allow', 'encrypted-media; picture-in-picture; fullscreen');
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.addEventListener('load', () => P.frame.classList.add('mr-on'), { once: true });
  // the page's arrow cannot follow the pointer inside another site's frame, so it steps aside there
  f.addEventListener('mouseenter', () => document.dispatchEvent(new MouseEvent('mouseleave')));
  f.src = ig.embed;
  P.frame.appendChild(f);
}
function lockPage(on) {
  document.documentElement.classList.toggle('mr-lock', on);
  const ds = document.documentElement.dataset;   // Contact reads against the player's navy, then gets the page's ground back
  if (on) { P.ground = ds.ground; ds.ground = 'dark'; } else if (P.ground) ds.ground = P.ground; else delete ds.ground;
  const main = document.getElementById('after'); if (main) main.inert = on;
  if (window.KP && KP.lenis) { if (on) KP.lenis.stop(); else if (!api.runs.open) KP.lenis.start(); }   // an open client page keeps the list still
  if (on) { stopAll(); api.runs.pause(); } else { api.runs.resume(); rewatch(); }
}
/* a sectioned folder plays one section at a time: the one named in the hash, else the first that holds the reel */
function playlistOf(view, id, key) {
  if (!view.sections) return view;
  const has = (s) => s.list.some(r => r.id === id);
  return view.sections.find(s => s.key === key && has(s)) || view.sections.find(has) || view;
}
const hashOf = (list, id) => `#media/${list.slug}/${id}${list.key ? '/' + list.key : ''}`;
function openPlayer(folder, id, key) {
  const view = playlistOf(folder, id, key);
  const i = view.list.findIndex(r => r.id === id);
  if (i < 0) return false;
  if (!P.root) buildPlayer();
  const wasOpen = !P.root.hidden;
  if (wasOpen && P.view === view && P.i === i) return true;
  P.view = view; P.i = i;
  if (!wasOpen) { P.back = id; P.root.hidden = false; lockPage(true); if (!RM.matches) P.root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); }
  fill();
  if (!wasOpen) P.close.focus({ preventScroll: true });
  return true;
}
function shutPlayer() {
  if (!P.root || P.root.hidden) return;
  P.frame.replaceChildren();                 // removes the embed, so nothing keeps playing
  P.root.hidden = true;
  lockPage(false);
  const id = P.view && P.view.list[P.i] && P.view.list[P.i].id;
  const inSec = P.view && P.view.key ? `[data-sec="${CSS.escape(P.view.key)}"]` : '';
  const scope = api.runs.open ? document.querySelector('.wkg-page.wkg-show') || host : host;
  const c = id && scope.querySelector(`:is(.mr-card,.mr-hit)[data-id="${CSS.escape(id)}"]${inSec}`);
  if (c) { c.focus({ preventScroll: true }); api.runs.reveal(c); }
  P.pushed = false;
}
function closePlayer() {
  if (!P.root || P.root.hidden) return;
  if (P.pushed) { history.back(); return; }
  history.replaceState(history.state, '', `${location.pathname}${location.search}#media/${P.view.slug}`);
  shutPlayer();
}
function step(d) {
  const n = P.view.list.length;
  P.i = (P.i + d + n) % n;
  history.replaceState(history.state, '', `${location.pathname}${location.search}${hashOf(P.view, P.view.list[P.i].id)}`);
  fill();
}

/* the hash is the only source of truth for which view is up */
export function route() {
  if (!mounted) return;
  const m = /^#media(?:\/([\w-]+))?(?:\/([\w-]+))?(?:\/([\w-]+))?$/.exec(location.hash);
  const slug = m && m[1] && VIEWS.has(m[1]) ? m[1] : null;
  setView(slug && RUNS.has(slug) ? null : slug);   // a client's run opens over the index, which stays underneath
  if (slug && m[2] && openPlayer(VIEWS.get(slug), m[2], m[3])) return;
  shutPlayer();
}

/* a DVC's real shape, read from its still's natural size; anything not back in time stays 9:16 */
function probeRatios(list) {
  return Promise.race([
    Promise.all(list.map(r => new Promise(done => {
      const own = typeof r.poster === 'string' && /^media\/clips\/[\w-]+$/.test(r.poster), im = new Image();
      im.onload = () => { if (im.naturalWidth && im.naturalHeight) AR.set(r.id, im.naturalWidth / im.naturalHeight); done(); };
      im.onerror = () => done();
      im.src = own ? `${BASE}${r.poster}.w360.webp` : `${BASE}media/reels/${encodeURIComponent(r.id)}.w360.webp`;
    }))),
    new Promise(done => setTimeout(done, 2500)),
  ]);
}
export async function mount(node, a) {
  api = a; host = node; BASE = a.base || BASE;
  if (!document.getElementById('mr-style')) { const s = el('style'); s.id = 'mr-style'; s.textContent = STYLES; document.head.appendChild(s); }
  if (!host.firstChild) { steady(() => host.appendChild(renderSkeleton())); try { api.refresh(); } catch (e) { /* the page above is still being built */ } }
  // the three files load side by side, not one after the other
  const manP = fetch(`${BASE}media/manifest.json`).then(x => (x.ok ? x.json() : []), () => []);
  const notesP = fetch(`${BASE}media/client-notes.json`).then(x => (x.ok ? x.json() : {}), () => ({}));
  const res = await fetch(`${BASE}media/reels.json`);
  if (!res.ok) throw new Error(`media-reels: reels.json ${res.status}`);
  const data = await res.json();
  const man = await manP;
  (Array.isArray(man) ? man : []).forEach(x => { if (x && x.id) MAN.set(x.id, x); });
  NOTES = await notesP || {};
  REELS = (Array.isArray(data) ? data : []).filter(r => r && typeof r.id === 'string' && /^[\w-]+$/.test(r.id) && !NEVER.has(r.id) && !r.count_only && r.hidden !== true);   // hidden: true takes a video off every Media page
  const byViews = (x, y) => (Number(y.views) || 0) - (Number(x.views) || 0);
  CLIENTS.forEach(([slug, name, project]) => VIEWS.set(slug, { slug, name, project, client: true, list: REELS.filter(r => r.in_client && r.client === name).sort(byViews) }));
  const tot = (sl) => { const v = VIEWS.get(sl); return sum(v.all || v.list, 'views'); };
  const gtView = VIEWS.get('gujarat-titans');
  gtView.sections = gtSections(byViews);
  gtView.all = [...new Map(gtView.sections.flatMap(s => s.list).map(r => [r.id, r])).values()];
  CLIENTS.sort((x, y) => tot(y[0]) - tot(x[0]));   // the index and Next follow total views
  VIEWS.set('favourites', { slug: 'favourites', name: 'Favourites', noun: ['film', 'films'], client: false, list: REELS.filter(r => r.in_fav).sort(byViews) });
  VIEWS.set('viral', { slug: 'viral', name: 'Viral Reels', client: false, list: REELS.filter(r => r.in_viral).sort(byViews) });
  VIEWS.set('dvc', { slug: 'dvc', name: 'DVCs', noun: ['DVC', 'DVCs'], client: false, list: REELS.filter(r => r.in_dvc).sort(byViews) });
  VIEWS.set('documentaries', { slug: 'documentaries', name: 'Documentaries', noun: ['film', 'films'], client: false, list: REELS.filter(r => r.in_doc).sort(byViews) });
  await probeRatios(REELS.filter(r => r.in_dvc || r.format === 'dvc'));
  await new Promise(r => setTimeout(r, 0));   // parsing the data and building the runs are two tasks, not one long one
  buildRuns();
  mounted = true;
  await new Promise(r => setTimeout(r, 0));
  route();
}
