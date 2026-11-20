# rohannuthi.com

[![CI](https://github.com/rohannuthi7/Personal-Portfolio-Website/actions/workflows/ci.yml/badge.svg)](https://github.com/rohannuthi7/Personal-Portfolio-Website/actions/workflows/ci.yml)

Static portfolio built with Astro, hand-written CSS and a few kilobytes of JavaScript (the Projects deck, the nav scroll-spy). The design spec is `DESIGN_UPGRADE.md`; `DESIGN.md` is the earlier version it supersedes.

## Commands

```
npm install      # once
npm run dev      # local dev server with live reload
npm run build    # generates OG images, then builds to dist/
npm run preview  # serves dist/ locally
npm run validate # resume.json against the JSON Resume schema, then dist/ HTML
```

CI (`.github/workflows/ci.yml`) builds, validates `resume.json` and the HTML, and link-checks `dist/` on every push; a weekly run checks external links. `scripts/csp.mjs` runs after the build and writes a Content-Security-Policy with hashes of the inline scripts into `dist/_headers`. `functions/api/health.js` is a Cloudflare Pages Function at `/api/health` that reports the live commit.

Deploy on Cloudflare Pages with framework preset Astro, build command `npm run build`, output directory `dist`.

## Where content lives

Everything you will ever edit is under `src/content/` and `src/data/`. Components and styles never need to change for a content update.

| What | Where | How |
| --- | --- | --- |
| Add a project | `src/content/projects/<slug>/index.md` | Copy an existing folder. The folder name becomes the URL `/projects/<slug>`. Put `cover.*` (square), four collage photos and a `motif.svg` beside it. Set `order` to position it in the deck. `draft: true` hides it. |
| Remove a project | delete its folder | The deck, case pages, sitemap and OG images follow automatically. |
| Add or remove a role | `src/content/experience/<name>.yaml` | One file per role, photo in `src/content/experience/img/`. Entries sort newest start date first on their own. `photoShape: circle` for a round logo. |
| Name, bio, contact links, headshot | `src/data/site.ts` | |
| Courses | `src/data/coursework.ts` | Number and title only; the level column is read from the catalogue number. |
| Skill chips | `src/data/skills.ts` | |
| Resume | `public/rohan-nuthi-resume.pdf` and `public/resume.json` | Replace the PDF (the path never changes; `/resume.pdf` redirects to it) and keep the JSON Resume in step with it. |
| Guestbook tree (home page) | `src/data/word-tree.ts` | How many notes the tree holds, the longest note, the season, and the starter notes. |
| Colours, spacing, radius | `src/styles/tokens.css` | |
| Everything visual | `src/styles/site.css` | The only stylesheet. |

Dates are `YYYY-MM` strings; `end` may be `present` (roles) or `ongoing` (projects). The site formats them ("Sep 2025 – present", "Jan – May 2026").

### Project card fields

Besides the case-study fields, each project's front matter drives its card in the Projects deck:

- `number: { value, caption }` is the big figure on the card and its one-line caption. Omit it to hide the figure.
- `motif.svg` next to `index.md` is the line drawing along the bottom of the card: strokes only, at most six `<path>` elements, each with `pathLength="1"` so it draws in. The back-face icon shown on waiting cards is chosen by slug in `src/components/ProjectCard.astro`.
- `variant` is accepted (`A`–`D`) for future layouts; every card currently renders as variant A.

## Images

Drop in JPG, PNG or WebP at 2x the display size (cover 880x880, collage roughly 680x480, 560x560, 640x440, 640x600, experience photos 192x192, headshot 320x320). Astro converts them to WebP, sets width and height, and lazy-loads everything below the fold.

When replacing an image, save it under a new filename and update the reference. Overwriting a file in place keeps the same dev URL, and browsers will go on showing the old picture.

## Placeholders still to replace

Search the repo for `[` inside `src/content/` and `src/data/` to find bracketed text that needs real content. Also still placeholders: the collage photos and most covers, `public/rohan-nuthi-resume.pdf`, and the `[n]` card numbers for the three projects other than PickleIQ.
