# ByDeesign start site (start.bydeesign.com)

A small connected static site for ByDeesign's offers. Home page (`index.html`) already exists and is the design reference. Every other page must look and behave like it.

## Hosting
- Plain static HTML and CSS. No frameworks, no build step, no JavaScript unless a page genuinely needs it.
- Published with GitHub Pages at `start.bydeesign.com`. Keep a `CNAME` file in the repo root containing exactly `start.bydeesign.com`.
- Pages live in folders so URLs are clean: `/` (home), `/decode/`, `/debrand/`. Each folder holds an `index.html`.
- Use root-relative links (`/decode/`, `/style.css`, `/images/dee.webp`).

## File structure
```
index.html
decode/index.html
debrand/index.html
style.css          (one shared stylesheet, extracted from index.html)
images/            (dee.webp, any logos)
CNAME
CLAUDE.md
```
First job: extract the CSS from `index.html` into `style.css`, move the embedded photo into `images/dee.webp`, and link both. The page must look identical afterwards.

## Design system (do not change without being asked)
Colours: ink `#0C0C0C`, cream `#F8F3EF` (page background), paper `#FFFFFF`, rule `#E2DBD1`, muted text `#55524A`, lime `#E3E8A9`, periwinkle `#B5C5EE`, orange `#D95E28`. Colour is used sparingly: small dots, one highlight word, the dark closing band.

Fonts (Google Fonts): Instrument Serif for lowercase headlines, League Spartan 700/800 for caps (hero headline, card titles, FAQ questions, buttons, wordmark), Montserrat for body text.

Type scale:
- Hero h1: League Spartan 800, uppercase, `clamp(44px, 6.6vw, 96px)`, line-height .95
- Section h2: Instrument Serif, lowercase, `clamp(48px, 6.4vw, 92px)`, line-height .92, letter-spacing -0.025em
- Closing h2: `clamp(50px, 7vw, 104px)`
- Card and FAQ titles: League Spartan 800 uppercase, `clamp(22px, 2.9vw, 38px)`
- Body paragraphs: Montserrat, about 15 to 17px, line-height 1.7 to 1.75. Keep body text small.
- Never lowercase the word "I" or a proper name. Use the `.keep` class for headings like "I'm Dee."

Header: wordmark left, a few nav links, ghost pill button right, thin rule underneath. Footer: dark strip with wordmark left and "© 2026 ByDeesign" right. Both are identical on every page.

Layout: max width 1200px, side gutter at least 16px, everything must work at 400px wide with no horizontal scroll. Cards are white with a 1px rule border and 20px radius. Buttons are pill-shaped. Keep visible focus states and respect `prefers-reduced-motion`.

## Copy rules
- Use only copy Dee supplies. Do not invent copy, prices, guarantees, testimonials or names.
- Apply copy exactly as given, with no added embellishments or extra labels.
- Where copy is missing, leave a clearly marked `TODO` comment and a visible placeholder, and list it in your summary.
- British English.
- Testimonials currently show "Name, with permission". Leave as is until Dee gives real names.

## Links
- Free workbook buttons: `https://letters.bydeesign.com/`
- "See what's inside" and "Ready now? DeBrand yourself today": `/decode/` for the first, `https://deia.bydeesign.com` for the second until a checkout page exists.
- "See how DeBrand works": `/debrand/`
- Deia and Mira links: `https://deia.bydeesign.com` and `https://mira.bydeesign.com`
- External links open normally. Do not add tracking scripts.

## Working rules
- One page per session. Finish it, show a preview, then stop.
- After each page, check it at 1440px and 400px wide and fix overflow, clipped text and contrast.
- Add alt text to every image and set `<title>` and meta description on every page.
- Keep the home page navigation and the new pages' navigation in sync.
