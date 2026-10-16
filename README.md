# rohannuthi.com

Static portfolio built with Astro, hand-written CSS and about 1 KB of JavaScript (the Projects carousel). The design spec is in `DESIGN.md`.

## Commands

```
npm install      # once
npm run dev      # local dev server with live reload
npm run build    # generates OG images, then builds to dist/
npm run preview  # serves dist/ locally
```

Deploy on Cloudflare Pages with framework preset Astro, build command `npm run build`, output directory `dist`.

## Where content lives

Everything you will ever edit is under `src/content/` and `src/data/`. Components and styles never need to change for a content update.

| What | Where | How |
| --- | --- | --- |
| Add a project | `src/content/projects/<slug>/index.md` | Copy an existing folder. The folder name becomes the URL `/projects/<slug>`. Put `cover.*` (square) and four collage photos beside it. Set `order` to position it in the carousel. `draft: true` hides it. |
| Remove a project | delete its folder | The carousel, case pages, sitemap and OG images follow automatically. |
| Add or remove a role | `src/content/experience/<name>.yaml` | One file per role, photo in `src/content/experience/img/`. Entries sort newest start date first on their own. |
| Name, bio, contact links, headshot | `src/data/site.ts` | |
| Courses | `src/data/coursework.ts` | |
| Skill chips | `src/data/skills.ts` | |
| Resume | `public/resume.pdf` | Replace the file; the path never changes. |
| Colours, spacing, radius | `src/styles/tokens.css` | |
| Everything visual | `src/styles/site.css` | The only stylesheet. |

Dates are `YYYY-MM` strings; `end` may be `present` (roles) or `ongoing` (projects). The site formats them ("Sep 2025 – present", "Jan – May 2026").

## Images

Drop in JPG, PNG or WebP at 2x the display size (cover 880x880, collage roughly 680x480, 560x560, 640x440, 640x600, experience photos 192x192, headshot 320x320). Astro converts them to WebP, sets width and height, and lazy-loads everything below the fold. The current images are labelled grey placeholders.

## Placeholders still to replace

Search the repo for `[` inside `src/content/` and `src/data/` to find bracketed text that needs real content. Also still placeholders: every image, `public/resume.pdf`, and `src/assets/akpsi-mark.svg` (use the official Alpha Kappa Psi mark file).
