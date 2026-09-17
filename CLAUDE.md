# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The marketing site for NHC Squash — a six-court squash club at 201 Windsor Road, Northmead NSW, owned and coached by James Ethan. One page, deployed on Netlify at push to `main`.

## Architecture

Two source files, and that is the whole application:

- **[index.html](index.html)** (~2,000 lines) — self-contained: markup, a `<style>` block (lines 10–1361), and a `<script>` block (lines 1854–2002). No framework, no module system, no separate CSS or JS file, no `package.json`.
- **[netlify/functions/vimeo-videos.js](netlify/functions/vimeo-videos.js)** — the only backend. Proxies the Vimeo API so the access token never reaches the browser.

There is **no `netlify.toml`**. The function is discovered by Netlify's default `netlify/functions` convention, so the directory path is load-bearing — moving or renaming it breaks the video section silently.

The function reads `VIMEO_TOKEN` from the environment (set in the Netlify dashboard, never in the repo) and fetches showcase/album `12314886` requesting only `uri,name,duration,pictures`. Missing token → 500 with an explanatory JSON body. Responses carry `Cache-Control: public, max-age=300`.

Page sections are anchor-navigated in this order: `#home`, `#courts`, `#pricing`, `#competitions`, `#videos`, `#gallery`, `#about`, `#contact` (the footer).

## No build system

`node`, `npx`, and the Netlify CLI are **not installed** on this machine. There is no test runner, linter, or bundler, and no build/lint/test command to run — do not invent one. Verification is manual: open the page and click through it.

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

**The video carousel cannot be tested this way.** `/.netlify/functions/vimeo-videos` 404s without the Netlify dev server, so the player sits on "Videos unavailable — visit us on Vimeo." Everything else — including the hero iframe, which is a hardcoded Vimeo ID — renders correctly locally.

## Deploying

Netlify builds on every push to `main`. There is no CI, no staging, and no review step. **A push is a production release.**

```bash
git add index.html
git commit -m "your message"
git push origin main
```

## The two carousels

They are separate implementations that share variable names (`current`, `autoTimer`, `goTo`). The video carousel is wrapped in an IIFE **specifically to keep its state off the global scope** where the court carousel lives. Keep it that way — hoisting anything out of that closure collides with the court slider.

**Court carousel** (`#carousel`, lines 1855–1881) — six static `.carousel-slide` divs, auto-advancing every 3.5s. The dots are hand-written markup: adding or removing a court photo means editing the slide, its matching `.carousel-dot` with a sequential `data-index`, and the "6 Courts Available" badge text.

**Video carousel** (`#vc-*`, lines 1892–1999) — fetched from the function at load, thumbnails built by string concatenation into `innerHTML`. Notes:

- Thumbnails pick the first `pictures.sizes` entry ≥640px wide, falling back to the largest.
- Auto-advance is a `setTimeout` of `duration + 2s` (min 10s). It is a **timer, not a player event** — pausing or scrubbing the Vimeo player does not stop the queue.
- Video titles come from Vimeo showcase names and are injected unescaped into `innerHTML`. Rename videos in the Vimeo showcase, not here.
- Showcase `12314886` is hardcoded in **two places**: the function's URL and the "View all on Vimeo" link ([index.html:1715](index.html#L1715)). Change both together.

## Editing gotchas

**The promo banner is time-limited — swap its copy, and recover it rather than rebuild it.** `#promo-banner` currently runs a 10 Visit Pack offer ($350, choose an 11th visit free or a free lesson), with no stated end date. Its CSS starts at [index.html:36](index.html#L36) and its markup at [index.html:1386](index.html#L1386). History: an August first-anniversary offer ran first, the block was deleted in `ce3079a`, and restored with new copy afterwards. Nothing else depends on it — `#site-header` is a sticky wrapper that simply gets shorter without it.

If the block is ever deleted again, pull it back out of commit `45b6606` rather than writing a new one; the styling is already tuned to the accent palette and carries its own mobile breakpoint:

```bash
git show 45b6606:index.html | sed -n '36,137p'      # CSS    → paste above the /* ── STICKY HEADER WRAPPER ── */ comment
git show 45b6606:index.html | sed -n '1385,1404p'   # markup → paste inside #site-header, directly after </nav>
```

Placement is load-bearing: the banner belongs **inside** `#site-header`, below `<nav>`, so the two travel together as one sticky unit. Put it outside and it scrolls away.

Its shape, for authoring new copy — an accent-coloured flex bar holding `.promo-left` (a black `.promo-badge` pill, a `.promo-divider`, then `.promo-body` wrapping `.promo-choose` / `.promo-offers` with alternating `.promo-offer` and `.promo-or` spans / `.promo-sub`) with a `.promo-cta` phone link pushed right. **Change the copy in `.promo-badge`, the `.promo-offer` spans and `.promo-sub`; leave the styles alone.** To pull a live banner without deleting it, add `display:none` to `#promo-banner`.

Two things to check whenever a banner goes back in:

- `.promo-cta` uses `tel:0419688262` — a sixth copy of the phone number (see below).
- The mobile nav dropdown is opened by inline `cssText` with a hardcoded `top:68px` measured against the nav bar alone ([index.html:1890](index.html#L1890)). It is `position:sticky` inside the header so the banner does not offset it, but click the hamburger at ≤900px and confirm.

**The phone number is duplicated.** `0419688262` appears in five `tel:` links plus display text in the CTA band and footer — six links whenever a promo banner is live. Changing it means all of them.

**Images are unoptimised.** [images/](images/) is ~32MB — six 2.7–4MB court JPEGs and an 11.8MB `james-ethan.png`. The page is heavy by design decision, not oversight; do not swap in new images without keeping this in mind, and do not "fix" it unasked.

**External dependencies are all embeds**, no libraries with build steps: Google Fonts, the Vimeo player SDK, the Flickr embedder (`embedr.flickr.com` — the gallery pulls album `72177720334126256`), and a Google Maps iframe.

## Conventions

- **Keep this a single self-contained HTML file.** Do not introduce a build step, split out CSS/JS, or add a framework or npm dependency unless explicitly asked.
- **Use the existing CSS custom properties** (`--black #0a0a0a`, `--white #f8f6f1`, `--accent #C8F000`, `--mid`, `--muted`, `--border`) and the Barlow Condensed / Barlow pairing. Do not introduce new colours or fonts.
- Responsive breakpoints are `max-width: 900px` and `max-width: 600px`. Match them.
- **Do not restructure layouts** without being asked — this is a finished, deployed site.
- Prose is Australian/British-spelled. Times are AEST/AEDT.

## Facts to get right

Club copy states these; keep them consistent if you touch the hero, stats strip, About section, or footer.

- 6 courts, newly renovated, at 201 Windsor Road, Northmead NSW 2152 (entry via Windermere Ave).
- 15 competitions per week — something every night; kids training Thursday 4pm; Ladies Novice fortnightly Sunday.
- James Ethan: peak PSA world ranking **#251**, 30+ years managing squash clubs, 17 years at Baulkham Hills, #1 international best-selling author. He started at 17 with no natural talent — that framing is deliberate, do not upgrade it.
- First 30 minutes free for first-time visitors. Casual hire $38/hour, $25 for 30 min, $45 for the 90-min package.
- Contact: 041 968 8262, James@nhsf.com.au.
