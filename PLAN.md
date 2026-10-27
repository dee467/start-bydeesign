# Page plan: start.bydeesign.com

## Pages
| Page | URL | Status | What it needs |
|---|---|---|---|
| Home | `/` | Built (`index.html`) | Split into `style.css` and `images/`; real testimonial names; real logo files |
| Decode Your Brand | `/decode/` | To build | Dee's copy for the page; checkout or sign-up link |
| DeBrand | `/debrand/` | To build | Dee's copy for the page; sign-up link |
| Free workbook | letters.bydeesign.com | Live, separate | Nothing; buttons link out |

## Build order
1. **Setup session.** Extract `style.css` and `images/`, confirm the home page looks identical, add `CNAME` with `start.bydeesign.com`, wire the home buttons to `/decode/` and `/debrand/`.
2. **Decode Your Brand page.** Start from the home page's card 2 content and expand it. Needs Dee's page copy.
3. **DeBrand page.** Start from the home page's card 3 content and expand it. Needs Dee's page copy.
4. **Final check.** Navigation matches on every page, all links work, mobile and desktop checked, titles and descriptions set.

## Publishing (same route as letters.bydeesign.com)
1. Create a new GitHub repo for the site and upload the folder.
2. In the repo settings, turn on GitHub Pages from the main branch.
3. Set the custom domain to `start.bydeesign.com`.
4. At the DNS provider for bydeesign.com, add a CNAME record for `start` pointing to the GitHub Pages address for the account (GitHub shows it in the Pages settings).
5. Wait for the DNS check to pass, then turn on "Enforce HTTPS".

## Open items for Dee
- Page copy for `/decode/` and `/debrand/`.
- Real names for the two testimonials.
- Logo files (wordmark, and the BD mark if used in the footer).
- Where Decode and DeBrand sign-ups should go (Deia sign-up or a checkout page).
- Whether the Showit site's main navigation should link to start.bydeesign.com.
