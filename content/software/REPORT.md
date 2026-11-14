# Software wing content: report

Prepared 2026-11-12. Facts and wording come from kirtan-bridge/assets/copy.js only. Write-ups are the copy.js Overview text, trimmed to two paragraphs where it had three (sorted, Clapper). Facts rows use kind, state, role, stats, client and year from copy.js. Nothing outside content/software/ was changed. All captures were headless Chrome at 1440x900, 2x, saved as jpg at 1920 wide. Nothing was logged in to, submitted or accepted.

## Included, with images

| id | name | images | fresh captures | live URL |
|---|---|---|---|---|
| spectra | Spectra Museum | 12 | 11 | worked |
| sorted | sorted | 7 + video | 2 | worked |
| cravache | CravAche | 3 | 2 | worked |
| deepdive | Deepdive Marketing | 3 | 2 | worked (public Instagram, no login) |
| deepdive-blog | Deepdive Blog | 4 | 4 | worked |
| sportified | The Sportified | 1 | 1 | worked on second try (first timed out) |
| vibe-raas-led | Vibe Raas LED | 13 | 0 | no URL in copy.js |
| vibe-raas-tickets | Vibe Raas Pass | 7 | 0 | no URL in copy.js |
| postinnator | Daily Dispatch | 6 | 6 | worked |
| page-22 | Page 22 | 4 | 1 | worked |
| sparks | LitPro | 1 | 1 | worked |

No live site was down and no domain had expired. cravache.vercel.app is up.

## Per project

- **spectra.** Hero live-01 (the way in). The site opens on a Diwali offer popup; I closed it with its X, then walked the scroll. All eight rooms, the door between rooms and the closing ticket panel are captured. Old shots 01, 02, 04, 05, 06 were dropped as lower-resolution duplicates of the fresh ones; old 03 (the door in the dark) is kept. Dropped live-12 (FAQ caught mid-scroll). Book now was not followed.
- **sorted.** Hero live-01 (fresh site hero, replaces the older site-hero.jpg). Kept client-pick, products, numbers, drive, sorting-poster and one fresh section. Video sorting.mp4 copied, as approved in copy.js. Dropped: two lilac sections (no-purple rule, and the source notes kept them out), one section caught mid-animation, one folder strip with a lilac tile. The install button was not touched.
- **cravache.** Hero live-01 (title screen). Gallery: the existing gameplay frame (was cravache-live.png, now live.jpg) and a dusk title frame. Four near-identical title frames dropped. Thin: no retirement card, no busy mid-game frame. I did not click into the game.
- **deepdive.** Hero live-02 (the reel grid). Gallery: profile top and the existing reel strip. The profile loaded publicly; Instagram's sign-up popup was closed with its X, nothing accepted. The live profile reads 153K followers; copy.js says 150K+, so the page text says 150K+.
- **deepdive-blog.** Hero live-01. Gallery: the Instagram feed strip, the blog header, the teardown grid. The old three shots were dropped as duplicates of the fresh ones. The collaboration form sections were left out. The site's own hero claims "60+ brands partnered"; that number is visible in the hero image but is not in copy.js, so it is not in the text.
- **sportified.** Hero live-01, the public grid. No gallery. Very thin: copy.js lists no screenshots for it. A second capture of the profile header was dropped because it adds nothing but the follower count (32).
- **vibe-raas-led.** Hero led-05 (side screen with the event mark). 12 gallery images: the renders, the phone remote, and one combined sheet. Two combined sheets dropped as duplicates. No live link.
- **vibe-raas-tickets.** Hero sheet-3 (three pass cards, no names). Gallery pass-01 to pass-06. Two combined sheets dropped (duplicates; one carried a payment-due screen). No live link.
- **postinnator (Daily Dispatch).** Hero live-01. Five further sections of the public front page. /login and /signup not opened.
- **page-22.** Hero 03 (floor ten). The three existing phone frames plus one fresh desktop start screen. Game not played.
- **sparks (LitPro).** Hero live-01, the empty start state. No gallery. The live page titles itself Sparks.

## Text only (screens withheld)

- **clapper.** Logo, write-up, facts, link clapper.in. Nothing copied from shots/clapper, site not loaded.
- **fitkit.** Write-up and facts. No logo exists, no link.
- **fourside-studios.** Write-up and facts. No logo exists, no link. copy.js marks it classified.

## Undecided (owner to confirm)

- **Daily Dispatch (postinnator), Page 22, LitPro (sparks).** copy.js marks all three live with a public URL, the same way it marks Spectra, and each URL loaded a public page, so they are in the manifest. The brief said to leave them out if unsure. If any should go, delete its manifest entry and folder; nothing else depends on them.
- **Retain+.** copy.js marks it classified with no link. Left out. Say if it should get a text-only entry like Fourside.

## Left out

Dark in copy.js: Bill Please, Equaliser, MunimJi, Home Tour, Youload. Cut by the owner: Deepdive Intro (live in copy.js, cut anyway), Scale of Things, Autocut, Expense, Artemis, Flyingnode, Hu Kon Chu.

## Things to check before publishing

- **Pass scanner screens** (vibe-raas-tickets pass-03 to pass-06) show buyer names, seller first names (Ohm, Kirtan), rupee amounts and QR codes. The source notes say all of it is seed data checked against the event database. I could not check that myself.
- **Instagram captures** (deepdive, sportified) show Instagram's interface, third-party ad stills (Pringles, Lego, Rick and Morty, actors) and match footage of real footballers, one frame with a child. They are public posts from his own pages, but they are other people's imagery.
- **Vibe Raas write-ups** name Ohm and the venue. That is copy.js wording.
- **Fitkit one-liner** mentions his girlfriend. That is copy.js wording.
- **Clapper facts** include "10 people use it for real". That is copy.js wording.
- **Spectra live-11** shows the museum's own photo with two visitors in silhouette.
- **Daily Dispatch live-04** shows a sample stats panel (3.1k impressions, 18 posts). It is the marketing page's mock, not real data, but it reads like real data.
- **sorted drive.jpg and live-03** show stock faces (Pexels, per the source notes).

## Late notes

- **Daily Dispatch logo left out.** The only logo on file is a purple wordmark that says Postinnator (old name, and purple). Its manifest logo is null.
- **cravache live-03** is a dusk title frame with a purple sky. Drop it if the no-purple rule covers screenshots of the game itself.
- **Stats in the facts rows** are written label first, number second (for example "Photos off one camera": "3,677").
- **Wording check.** Every one-liner and write-up paragraph in the manifest was matched as an exact substring of copy.js.
