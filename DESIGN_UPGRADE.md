# DESIGN.md — rohannuthi.com

Design specification for Rohan Nuthi's personal portfolio. Current as of Oct 16, 2026 (evening): includes the pinned project stack, accent card backs, landscape cards, level-ruler coursework and the section-surface rhythm. The hand-drawn layer discussed separately is NOT yet included.
Mockups: https://claude.ai/artifact/K32P6FutYq6KDN6aFEia7L (artboards A, C, D, E are the build targets; B is an unused alternative).
Full rules document with reasoning: https://claude.ai/code/artifact/de3beb74-a8e2-4ee0-b6c3-1cfc36fcef04

## Instructions for the implementer

Build this site exactly as specified here. Where this document and your defaults differ, this document wins. Do not add components, colours, fonts, animations, libraries or sections that are not in it. Do not use Tailwind, a CSS framework, a UI kit, webfonts, an icon font, or client-side React. Where something is genuinely unspecified, ask before deviating. Build the home page first and stop for review before the project pages.

Placeholders in square brackets (for example `[Design decisions text]`) are content Rohan supplies; render them as visible bracketed text until replaced, never invent them.

## 1. Final decisions at a glance

| Area | Decision |
| --- | --- |
| Fonts | `system-ui` sans stack for headings, nav, labels, buttons; Georgia for body; `ui-monospace` stack for code. No webfonts. |
| Theme | Auto via `prefers-color-scheme`, no toggle. Home: grey-white `#ECECEA` / `#141414`; dark: grey-black `#1C1C1C` / `#E6E6E3`. |
| Blue family | Navy `#3B4A66` and fog blue `#C9D6E3`. Light mode: navy is the home accent and the project-page background. Dark mode: fog blue is both. |
| Accent use on home | Inside the project cards (big number, arrow, motif, back-face icon), the five About contact links, Experience timeline dots, body-copy links. Nothing else. |
| Radius | 4px everywhere. |
| Stack | Astro, static output, one hand-written CSS file, no Tailwind, Cloudflare Pages, personal domain. |
| Pages | `/` home, `/projects/<slug>` one per project, `/resume.pdf`, `/404`. |
| Nav | Transparent, not sticky: name left; About, Coursework, Projects, Experience, Skills, Contact, Resume right; wraps under 720px; never a hamburger; identical on every page. |
| Home order | About → Coursework → Projects → Experience → Skills → Contact. |
| Section separation | Fixed rhythm: every section has 96px padding top and bottom, h2, 32px, content. Surfaces alternate: About (page) → Coursework (tint `--surface`) → Projects (accent band) → Experience (page) → Skills (tint) → Contact (page). Tinted and accent bands are full-bleed and borderless; the surface edge is the boundary, so no hairlines between sections. |
| About | Kicker (degree · school · May 2028), name at 64px, then 160px headshot · description + two buttons + one small line "GPA 3.83 · Dean's List · Alpha Kappa Psi" with the official 20px AKPsi mark · 200px contact column: Madison WI, Resume, GitHub, LinkedIn, email, phone, each with a generic 16px stroke icon. |
| Coursework | Level ruler: columns 200/300/400/500-level with one rule under the header, rows per department, number + title per course, empty cells left empty; nine courses; term on in-progress courses; no grades, no cell borders. |
| Projects | Pinned stack: four landscape (≈1.85:1, ~1120×600) white (light) / black (dark) project cards on the page surface in a sticky stage, vertically centred; the current card flat at the front, the waiting cards behind it offset 40px right each and showing accent-coloured backs (navy / fog blue) with the project icon; the section pins, each card holds for one viewport of scroll (mandatory snap inside the runway only), and the next card cuts in with one 200ms transition at the boundary. No rotation, no controls. Whole card links to its page with a 44px arrow bottom-right; interiors are per-project canvases. First card = PickleIQ. |
| Experience | Single-hairline vertical timeline with accent dots; 140px dates · line · 96px photo · role at org + 2–3 resume bullets; newest start first; not clickable. |
| Skills | Five rows from the resume with outlined chips in a fixed order (section 5.6). |
| Contact | Short text block: the same five contact items as About, no form. |
| Case-study page | Four-photo vertical collage (±1.5°, 4px mat, no shadows) left; right: h1, tagline, Role/Team/Dates/Status, Code on GitHub link, then Overview, Technical details, Design decisions, Future upgrades; Next link; footer. |
| Motion | Hover colour/underline (120ms) everywhere; in Projects only: the 200ms card cut at each segment boundary and the motif draw-in once per card; home↔project view transition (image morph ≤ 320ms); collage photos straighten on hover on case pages. Reduced motion respected; nothing else animates. See the Upgrades doc for the complete allowed/refused lists. |
| Not on the site | Gradients, glows, shadows, cards for text, logo walls, skill bars, emoji, decorative serifs, Inter/Geist defaults, blog, testimonials, contact form, dark/light toggle, chatbot, analytics (unless added later). |

## 2. Tokens

One CSS file, `src/styles/tokens.css`, imported once. Custom properties only, no `!important`, no utility classes.

```css
:root {
  --bg: #ECECEA; --fg: #141414; --muted: #5C5C5C; --line: #CFCFCB;
  --surface: #E3E3E0; --surface-line: #C4C4C0;   /* tinted section bands and the hairlines inside them */
  --card-bg: #FFFFFF; --card-fg: #141414;          /* project cards */
  --accent: #3B4A66; --accent-hover: #2C3850;
  --radius: 4px;
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: Georgia, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --space-1: 8px; --space-2: 16px; --space-3: 24px; --space-4: 32px;
  --space-6: 48px; --space-8: 64px; --space-12: 96px; --space-16: 128px;
  --container: 1040px; --measure: 62ch;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #1C1C1C; --fg: #E6E6E3; --muted: #9C9C98; --line: #333331;
          --surface: #232323; --surface-line: #3A3A38;
          --card-bg: #000000; --card-fg: #E6E6E3;
          --accent: #C9D6E3; --accent-hover: #DCE5EE; }
}
/* Case-study pages carry html[data-page="case"]. The Projects band on home uses the same set. */
[data-page="case"], .band-case {
  --bg: #3B4A66; --fg: #ECEEF2; --muted: #C3CAD6; --line: #56637E;
  --accent: #ECEEF2; --accent-hover: #FFFFFF; --code-bg: #2F3B53; --img-mat: #3B4A66; --img-border: transparent;
}
@media (prefers-color-scheme: dark) {
  [data-page="case"], .band-case {
    --bg: #C9D6E3; --fg: #141414; --muted: #3C4756; --line: #AEBCCB;
    --accent: #141414; --accent-hover: #000000; --code-bg: #B8C6D6; --img-mat: #C9D6E3; --img-border: #AEBCCB;
  }
}
```

Palette rules: flat colour only (no gradients, glows, blurs, noise, radial washes). Body text ≥ 7:1 contrast, everything else ≥ 4.5:1, measured against the actual background. Images and screenshots are the only place colour is loud.

## 3. Type

| Element | Font | Size desktop / ≤480px | Weight | Line-height | Tracking | Colour |
| --- | --- | --- | --- | --- | --- | --- |
| Nav name | sans | 16 / 16 | 600 | 1 | 0 | fg |
| Nav links, footer links | sans | 15 / 15 | 400 | 1 | 0 | fg |
| Kicker, meta rows, captions, tags, dates | sans | 13 / 13 | 400 | 1.4 | 0 | muted |
| Hero name h1 | sans | 64 / 40 | 650 (600 if no variable weight) | 1.02 | −0.02em | fg |
| About description, case-study tagline | serif | 19 / 17 | 400 | 1.55 | 0 | fg |
| Section h2 (home) | sans | 31 / 25 | 600 | 1.15 | −0.015em | fg |
| Project card title | sans | 39 / 32 | 650 | 1.1 | −0.02em | fg |
| Project card big number | serif | 72 / 48 | 400 | 1 | 0 | fg |
| Body paragraphs (home) | serif | 17 / 16 | 400 | 1.6 | 0 | fg |
| Case-study h1 | sans | 39 / 32 | 650 | 1.1 | −0.02em | fg |
| Case-study h2 | sans | 25 / 22 | 600 | 1.2 | −0.01em | fg |
| Case-study body | serif | 18 / 17 | 400 | 1.65 | 0 | fg |
| Experience role, course number | sans | 16 / 16 | 600 | 1.4 | 0 | fg |
| Experience org/bullets, course title, skills row | serif | 16 / 16 | 400 | 1.5 | 0 | fg |
| Button label | sans | 15 / 15 | 500 | 1 | 0 | see button |
| Code | mono | 14 / 13 | 400 | 1.5 | 0 | fg on code-bg |
| Footer text | sans | 14 / 14 | 400 | 1.4 | 0 | muted |

Scale is 13 / 16 / 20 / 25 / 31 / 39 / 49 (+64 for the name); serif body sizes 17, 18, 19 are the only exceptions because Georgia's x-height runs small. Sentence case everywhere; no all-caps, no tracked-out eyebrow labels, no italic or coloured accent words in headings. Body text is `--fg`, never `--muted`.

## 4. Layout

- Container `max-width: 1040px`, side padding 20px (mobile) / 20px within the 1280 canvas (desktop); running text `max-width: 62ch`. Everything left-aligned.
- Spacing scale 8/16/24/32/48/64/96/128 only.
- Section rhythm (every section after About): 96px padding top and bottom (64px under 720px), then the h2, then 32px to the first content block. Sections on the page surface sit directly against the band before and after them; there is no extra margin between sections and no hairline between them.
- Surfaces: Coursework and Skills are full-bleed bands on `--surface`; About, Projects (the section itself; its cards carry the case tokens), Experience and Contact are on `--bg`. Inside a tinted band, hairlines (tag borders, image borders) use `--surface-line`. Bands have no top or bottom border.
- Radius 4px on every element that has one: buttons, tags, images, code blocks, headshot.
- No cards for text. No shadows anywhere. Borders are 1px `--line` hairlines only, never coloured, never one-sided.
- Left-label grid: Coursework, Skills and (with extra columns) Experience use `220px 1fr` with 24px column gap; under 720px it becomes one column with the label above.
- Breakpoints 480, 720, 960 (case-study collage), 1040. Mobile-first. Test at 375 and 1440.
- Images: WebP, 2× source at max 1600px wide, ≤ 200 KB, `width`/`height` attributes, `loading="lazy"` except covers, `decoding="async"`, descriptive `alt`. No device frames, no tilted 3D mockups.

## 5. Home page

### 5.0 Nav (every page)
Container width, 24px top/bottom padding, `background: transparent` (never a fill, tint or blur), 1px `--line` below, not sticky. Name left (plain text, links to `/`). Right, 24px gaps: About, Coursework, Projects, Experience, Skills, Contact (anchors to `/#about` … `/#contact`) and Resume (`/resume.pdf`, `target="_blank" rel="noopener"`). Under 720px the link row wraps to two left-aligned rows; under 480px the name takes its own row first. Never a hamburger. Identical markup on case-study pages, in that page's text colour.

### 5.1 About (`#about`)
Hero: `--space-12` top padding, kicker in kicker style ("B.S. Computer Engineering & Computer Science · University of Wisconsin–Madison · May 2028"), then the name as h1 at 64px, 16px apart. No headline sentence, no image on the right.

About row, 48px below the name, `--space-12` bottom padding, three-column grid `160px minmax(0,1fr) 200px`, 32px gaps, `align-items: start`:
1. Headshot 160 × 160, radius 4px, 1px `--line` border, colour photo on a plain background, `alt="Rohan Nuthi"`.
2. Description paragraph (serif 19, ≤ 50 words) → one kicker-style line "GPA 3.83 · Dean's List · [AKPsi mark 20×20] Alpha Kappa Psi" (the official Alpha Kappa Psi image file at 20px, radius 4px, never a redrawn version) → two buttons with 12px gap: primary "View resume" (opens `/resume.pdf`), secondary "Selected projects" (anchor `#projects`).
3. Contact column, 6px between rows, each row 28px min-height, 16px single-weight stroke icon + label, 10px gap:
   - "Madison, WI" with a pin icon, muted text, not a link
   - Resume (document icon) → `/resume.pdf`
   - "github.com/rohannuthi7" (branch icon) → https://github.com/rohannuthi7
   - "linkedin.com/in/rohan-nuthi" (link icon) → https://linkedin.com/in/rohan-nuthi
   - "rohannuthi.rn@gmail.com" (envelope icon) → `mailto:`
   - "262-444-2159" (handset icon) → `tel:+12624442159`
   Links are `--accent`, underline on hover. Icons are inline SVG, `stroke="currentColor"`, `stroke-width="1.5"`, `aria-hidden="true"`; generic line icons, never brand logos or emoji.
Under 720px the grid stacks: headshot, text, contact column.

### 5.2 Coursework (`#coursework`) — level ruler
Full-bleed band on `--surface`, inner container 1040px, 96px padding top and bottom. h2 "Coursework", 32px, then the ruler.

The ruler is a grid `220px repeat(4, minmax(0, 1fr))` with 24px column gaps. Row 1 is the header: an empty label cell, then "200-level", "300-level", "400-level", "500-level" in kicker style; the whole header row has one 1px `--surface-line` rule beneath it (on the row wrapper, so the line is continuous) and 12px padding above the rule. Then one row per department, 24px below the rule and 32px apart: the department name in the label column (kicker style), and in each level column the courses of that level stacked with 16px gaps. A course is two lines: the catalogue number in sans 16/600 ("COMP SCI 400"; cross-listings "E C E / COMP SCI 352") and the official title in serif 16/400 on the next line, with the term in kicker style after the title for courses in progress. Courses within a cell are ordered by number. Empty cells stay empty: the gaps are the point (they show where the sequence is heading). No cell borders, no boxes, no grades, badges, descriptions or instructors. Under 720px: the header row is hidden, the department label spans the full width, and the courses flow in two columns in the same level order.

| Department | 200-level | 300-level | 400-level | 500-level |
| --- | --- | --- | --- | --- |
| Computer Science | COMP SCI 200 Programming I | COMP SCI 300 Programming II; COMP SCI / E C E 354 Machine Organization and Programming (Fall 2026) | COMP SCI 400 Programming III | COMP SCI 577 Introduction to Algorithms |
| Electrical & Computer Engineering | E C E 222 Electrodynamics I (Fall 2026); E C E 270 Circuits Laboratory I (Fall 2026) | E C E 340 Electronic Circuits I; E C E / COMP SCI 352 Digital System Fundamentals | — | — |

### 5.3 Projects (`#projects`) — card deck (decided Oct 16, 2026; replaces the carousel)
Full spec with reasoning: Portfolio Design Upgrades doc, "Decided: the card deck". Summary for implementation:

- **Section** on the page surface (`--bg`), 96px padding top. Header strip: h2 "Selected projects" and, right-aligned on the same line, the four project names as text links to their cards (24px gaps).
- **Card colours** (decided Oct 16, 2026): light mode card `--card-bg: #FFFFFF`, text `#141414`; dark mode card `--card-bg: #000000`, text `#E6E6E3`. The accent (`--accent`: navy in light, fog blue in dark) is used inside the card for the big number, the arrow, the motif strokes and nothing else. No border, no shadow; the page-to-card surface step is the edge. Images inside the card get a 1px `--line` hairline.
- **Runway and stage.** A runway of four segments, each `height: 100vh`, one per card. Inside the runway, before the segments, a sticky stage: `position: sticky; top: 0; height: 100vh`, `display: flex; align-items: center`, so the card box is vertically centred in the viewport. The Projects section uses a wider container than the rest of the page: `max-width: 1280px`, padding `0 140px 0 20px` (140px on the right reserved for the three strips). The card box inside it is **landscape**: full container width (≈ 1120px at desktop) by `height: 600px`, capped at `calc(100vh - 160px)` so it never crowds the nav or the bottom edge. Aspect lands around 1.85 : 1 on a 1440px screen and the card occupies most of the horizontal viewport. Four cards absolutely positioned to that box (full width, `height: 100%`, radius 4px, no shadow, no rotation ever).
- **The stack (decided Oct 16, 2026).** The current card is flat at the front at `translateX(0)`. Each waiting card behind it is offset a further 40px to the right (`translateX(40px × d)`, d = positions behind) with a lower z-index, so each one shows as a 40px vertical strip along the right edge of the card in front. Waiting cards show their back face. On arrival PickleIQ is at the front with three strips to its right; the strips pack forward as cards are used; cards that have been passed are gone (not returned to the back). Scrolling up reverses everything.
- **Card backs (decided Oct 16, 2026: accent).** Each card has a back face: an overlay (`position: absolute; inset: 0`) filled with the accent (navy in light mode, fog blue in dark mode), no border, with a 22px single-weight stroke icon in the case-page text colour (off-white on navy, near-black on fog blue) at 12px from the top and 9px from the right, so the icon sits at the top of the strip. Waiting cards therefore read as accent-coloured strips beside a white (or black) front card; the accent leaves with the back face as each card comes forward. Icons are generic line drawings that nod to the project, never logos: PickleIQ a pickleball (circle with five holes), Reaxe a house outline, Badger Solar Racing a sun, Wisconsin Humanoid a two-link arm with three joints. `aria-hidden`.
- **Section lock and per-card lock.** The pin is the sticky stage: while the visitor scrolls through the four segments the stage holds still and the page keeps scrolling underneath, so nothing intercepts the wheel. The per-card hold uses the browser's scroll snapping: each segment has `scroll-snap-align: start; scroll-snap-stop: always`, and `html` gets `scroll-snap-type: y mandatory` **only while the runway intersects the viewport** (an IntersectionObserver toggles a class on `html`; outside the runway the page has no snapping). Result: one wheel notch or trackpad flick travels exactly one segment and settles; keyboard arrows and Page Down do the same; no JavaScript ever swallows a scroll event.
- **The cut.** The card index is `floor(runway scroll ÷ viewport height)`, clamped 0–3, recomputed on `scroll` (throttled with `requestAnimationFrame`). Nothing changes within a segment. When the index changes, one 200ms transition plays: the outgoing card fades to 0 while rising 8px; the incoming card slides from its 40px strip position to `translateX(0)` while its back face fades out; the strips behind it move 40px left. Easing `cubic-bezier(.2,.7,.2,1)`. No proportional-to-scroll motion anywhere in the section.
- **Script.** One file, ≤ 3 KB: the IntersectionObserver that toggles the snap class, and the scroll handler that sets `data-index` on the stage. Cards derive their state from `data-index` and their own `--i` in CSS. It writes no other styles. Initialise on `astro:page-load`.
- **Card = link.** Each card is one `<a href="/projects/<slug>">` with an accessible name "<Project> case study". A 44px square outlined arrow (1px border in the card's text colour, radius 4px, 1.5px chevron-right SVG, `aria-hidden`) sits 32px in from the bottom-right corner as the affordance. Hover on the card: title underlined, arrow fills with the text colour and the chevron inverts. No lift, scale, glow or background change on hover.
- **Card interior.** 40px padding (24px under 720px). Two-column grid `minmax(0,1fr) 400px`, 48px gap, `align-items: center`: text column left (kicker, title at 39px/650, blurb serif 19 ≤ 40 words, tags line, then the big number at serif 72px with a kicker-style caption; the column keeps 104px of bottom clearance for the motif), image column right (400 × 400 max, 1px `--line`, capped to the card height). The motif sits along the bottom of the text column (≤ 96px tall) at 60% opacity in the accent; the arrow sits 32px in from the bottom-right corner. Shared across all cards: type scale, spacing, radius, tokens, the arrow. Per card: layout variant, image treatment, motif (see Upgrades doc, Per-project signatures). The motif draws in once, starting when the card becomes the front card.
- **Fallbacks.** Reduced motion: the 200ms transitions are removed (cards cut instantly) and snapping is left to the browser's own reduced-motion handling. No JS: runway `height: auto`, four cards stacked at 80vh each, all visible. Under 720px: stage `height: auto`, cards stack vertically with 24px gaps, no deck behaviour.
- **Order.** PickleIQ, Reaxe, Badger Solar Racing, Wisconsin Humanoid.

### 5.4 Experience (`#experience`)
On the page surface, 96px padding top and bottom (it sits directly under the Projects band). h2 "Experience", 32px, then entries. Entries newest start date first, not clickable, 40px apart. Each entry is a grid `140px 24px 96px minmax(0,1fr)` with 24px column gaps, `align-items: start`:
1. Dates in kicker style ("Apr 2026 – present").
2. Timeline column: one 1px `--line` vertical rule centred in the 24px column, continuous from the first entry's dot to the last entry's dot (not above the first or below the last); an 8px `--accent` dot per entry, aligned to the role line. Nothing else: no icons, year labels, connectors, alternating sides, hollow or coloured "current" dots.
3. Photo 96 × 96, radius 4px, 1px `--line` border.
4. Content: role (sans 16/600) + " at " + organisation (serif 16/400) on one line, then a `<ul>` of 2–3 bullets in serif 16/1.5 (resume wording).
Under 720px: grid becomes `24px 64px 1fr`, the date moves above the role, photo 64px.

Entries (bullets from the resume; Rohan confirms the WTC start date):
- Apr 2026 – present · Co-Founder & Lead Software Engineer at Reaxe LLC
- Feb 2026 – present · Technical Project Manager at Wisconsin Tech Consulting
- Nov 2025 – present · Robotics Hardware Engineer at Wisconsin Humanoid
- Sep 2025 – present · Embedded Systems Engineer at Badger Solar Racing

### 5.5 Skills (`#skills`)
Full-bleed band on `--surface`, inner container 1040px, 96px padding top and bottom, no border. h2 "Skills", 32px, then left-label grid rows, in this order, each right column a wrapping row of chips (sans 13, `--fg` text, 1px `--surface-line` border, radius 4px, 4px × 10px padding, 8px gaps, `white-space: nowrap`):

| Category | Chips, in order |
| --- | --- |
| Languages | Python, C, C++, Java, JavaScript, SQL (PostgreSQL), HTML/CSS, Verilog |
| Frameworks & APIs | React, Node.js, FastAPI, REST APIs, Anthropic API |
| ML & data | PyTorch, TensorFlow, NumPy, Pandas |
| Developer tools | Git, AWS (EC2, S3, Lambda), Linux, Docker, Supabase, JUnit 5, ModelSim, Quartus, Altium |
| Hardware | Digital logic design, Microcontroller programming, PCB design |

No proficiency levels, years, logos, per-chip colours or "proficient / familiar" buckets.

### 5.6 Contact (`#contact`)
On the page surface, 96px padding top and bottom. h2 "Contact", 32px, then One serif 17 paragraph ("The fastest way to reach me is email.") followed by the same five items as the About contact column, as a vertical list with icons, in `--accent`. No form.

### 5.7 Footer (every page)
1px `--line` above, `--space-6` padding, flex space-between: "Rohan Nuthi · 2026" left in footer style; Email, GitHub, LinkedIn as text links right. Two rows under 480px.

## 6. Case-study page (`/projects/<slug>`)

`<html data-page="case">`. Same nav and footer in the page's text colour. Inside the 1040 container: 96px top padding, 128px bottom, two columns with 64px gap, `align-items: flex-start`: a 440px collage column left (`flex: 0 0 440px`), the article right.

Collage: a `position: relative` box 440 × ~980. Exactly four photographs, absolutely positioned, stacked top to bottom with slight overlap, z-index increasing downward, rotations alternating sign within ±1.5° (e.g. −1.5°, +1.2°, −0.8°, +1°), approximate sizes 340×240, 280×280, 320×220, 320×300, each with `border: 4px solid var(--img-mat)` (the page background, so overlaps separate without shadows) and radius 4px. No drop shadows, tape, pins, polaroid frames or on-image captions. The box has `role="img"` and an `aria-label` naming the project. Under 960px: static 2 × 2 grid above the text, 12px gap, no rotation, aspect 4:3.

Article, 48px between blocks:
- Header: h1 (39px), tagline (serif 19, ≤ 15 words), `<dl>` in a `120px 1fr` grid (dt kicker style, dd sans 15) with exactly Role / Team / Dates / Status, then a links row: "Code on GitHub" (or "Private repository — architecture and screenshots below" when private), "Live" if any, "Resume".
- Four h2 sections, same headings on every project, in this order: **Overview** (what it is, who uses it, the result or number), **Technical details** (stack in prose, the two or three mechanisms that matter), **Design decisions** (the hardest trade-off, the options, what was chosen and why, what would be done differently), **Future upgrades** (two or three concrete next steps). Body serif 18/1.65 at `--measure`. 300–700 words total.
- Code blocks (only when the snippet is the point, ≤ 20 lines): `pre` with `--code-bg`, 16px padding, radius 4px, no border, mono 14/1.5, horizontal scroll; no highlighting library: comments in `--muted`, keywords `font-weight: 600`; no line numbers, copy button or filename tab.
- Diagrams: inline SVG, `currentColor` strokes at 1.5px, no fills, sans 13 labels, width ≤ container, height ≤ 480px.
- Ends with a kicker-style "Next: <project>" text link, then the footer. No table of contents, no sticky elements.
- Links on case pages are the page's text colour underlined; the primary button (if any) is `--fg` filled with `--bg` text.

Project order and slugs: `pickleiq`, `reaxe`, `badger-solar-racing`, `wisconsin-humanoid`. Reaxe is a private repository: no code link, show architecture diagram + screenshots.

## 7. Components (the complete set)

| Component | Spec |
| --- | --- |
| Button | Height 40px, padding 0 16px, radius 4px, 1px border, sans 15/500. Primary: bg `--fg`, text `--bg`, border `--fg`; hover bg/border `--accent`. Secondary: transparent, border and text `--fg`; hover border/text `--accent`. Focus: `outline: 2px solid var(--accent); outline-offset: 2px`. Transition 120ms ease-out on colour and border-colour only. Max two per screen. |
| Text link | `color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px`; hover `--accent-hover`. External links `target="_blank" rel="noopener"`. No arrows appended, no animated underlines. |
| Tag / chip | Sans 13, `--fg` text, 1px `--line` border, radius 4px, 4px × 10px padding. One style only. |
| Figure | `<figure>` with `<img>` and optional `<figcaption>` in kicker style 8px below. |
| Nav, Footer, ProjectPanel, ExperienceEntry | As specified in section 5. |

Nothing else exists: no tooltips, toasts, badges, avatars, progress bars, skeletons, modals, accordions, tabs, carousels. Icons are inline stroke SVG only; the five contact icons, the card arrow chevron and the project motifs are the complete set.

## 8. Motion and interaction

- Allowed (complete list): colour and underline transitions on hover/focus (120ms ease-out); the Projects stack's 200ms card cut when the segment boundary is crossed; motif draw-in once per card (≤ 1s, replay on hover); the home ↔ project view transition (root crossfade 240ms, cover image morph 320ms via Astro `<ClientRouter />` and matching `view-transition-name`); collage photos straightening to 0° on hover (200ms); smooth scroll on anchors; native focus rings.
- Not allowed: scroll-reveal fades on sections, staggered entrances outside the motif, typewriter effects, parallax, animated gradients, magnetic buttons, custom cursors, marquees, particles, hover lift / scale / shadow, image zoom, continuous or looping animation, scroll-proportional motion, mandatory scroll-snap anywhere except inside the Projects runway, wheel or touch event interception, any animation on the About section.
- `@media (prefers-reduced-motion: reduce)` removes all transitions and sets `scroll-behavior: auto`.
- The recruiter path (home → resume, GitHub, LinkedIn, email) works with JavaScript disabled.
- Hover/focus styles exist for exactly: nav links, text links, buttons, project cards (title underline + arrow fill), collage photos (straighten), the "Next" link.

## 9. Copy rules

First person, sentence case, plain words, specific nouns, numbers where they exist. Banned words: passionate, seamless, robust, scalable (unless measured), cutting-edge, leverage, innovative, crafting, journey, delve, empower, elevate, unlock, digital experiences, solutions, world-class. Banned devices: emoji, waving hand, exclamation marks, "Hi, I'm", "Welcome", taglines in quotes, spaced em dashes as separators, middle-dot strings longer than three items. Dates: "Sep 2025 – present" (en dash, spaces) for roles still held; "Apr 2026 – ongoing" for projects still being built; "Jan – May 2026" when the year repeats. Status values: Shipped, In use, In progress, Archived. Every project name, title, date and organisation matches the resume PDF exactly.

## 10. Technical, performance, accessibility, metadata

- Astro, static output, minimal template with every starter file and style removed. Semantic HTML: one h1 per page, `nav`, `main`, `footer`, `article`, `time` for dates, real `<a>` for links.
- Budget per page: ≤ 300 KB total, ≤ 5 KB JS (the card-deck script and the motif observer only), LCP < 1.5s, CLS 0. Lighthouse 100/100/100/100 on mobile.
- Accessibility: contrast as in section 2, descriptive `alt` on every image, visible focus everywhere, full keyboard operation, skip-to-content link, `lang="en"`, no text in images, axe DevTools zero issues.
- `<title>`: home "Rohan Nuthi — Software & Embedded Engineer"; case pages "<Project> — Rohan Nuthi". Meta description = About description. Canonical URLs. Open Graph + Twitter tags on every page with a 1200 × 630 PNG in `public/og/`: home on the light home tokens (name 72px sans 650, one line 32px serif, URL 24px muted); each case page on navy with off-white project title and tagline. Favicon: "RN" in the sans at 650 on `--bg`, SVG + 32px PNG. `sitemap.xml` (Astro integration), `robots.txt`.
- `::selection` is `--accent` background with `--bg` text. Native scrollbars. No print stylesheet. No analytics.
- `/resume.pdf` is a stable path; the file is `Rohan_Nuthi_Resume.pdf`.

## 11. Content schema and folder layout

`src/content/projects/<slug>.md`:

```yaml
title: PickleIQ
tagline: Coaching video analysis that turns match footage into per-player feedback   # ≤ 15 words
summary: >-                                                                          # home blurb, ≤ 40 words
  Computer-vision coaching tool that extracts player position, body angles and swing
  metrics from match video and turns them into form feedback a coach can act on.
role: Lead engineer
team: "[number]"
dates: { start: "[Mon YYYY]", end: ongoing }
status: In use                 # Shipped | In use | In progress | Archived
repo: https://github.com/rohannuthi7/...   # omit if private
private: false
demo:                          # optional
stack: [Python, PyTorch, React, FastAPI]   # ≤ 6, shown as the tags line
cover: { src: ./cover.webp, alt: "..." }   # the card's main image; also the view-transition shared element
variant: A                     # A split | B full-bleed photo | C collage pair | D diagram-led
number: { value: "68×", caption: "more ball detections (0.5% → 34% of frames)" }
motif: ./motif.svg             # inline line drawing, ≤ 6 paths, strokes only
collage:                       # exactly four
  - { src: ./01.webp, alt: "..." }
  - { src: ./02.webp, alt: "..." }
  - { src: ./03.webp, alt: "..." }
  - { src: ./04.webp, alt: "..." }
order: 1
draft: false
```

Body of the Markdown file holds the four sections as `## Overview`, `## Technical details`, `## Design decisions`, `## Future upgrades`.

```
src/
  styles/tokens.css   styles/site.css
  layouts/Base.astro  layouts/Home.astro  layouts/Case.astro
  components/Nav.astro Footer.astro Button.astro Tag.astro ProjectDeck.astro ProjectCard.astro ExperienceEntry.astro Figure.astro ContactList.astro
  content/projects/*.md   content/config.ts
  pages/index.astro  pages/projects/[slug].astro  pages/404.astro
public/
  resume.pdf  favicon.svg  favicon-32.png  og/home.png  og/<slug>.png  img/...
```

## 12. Content Rohan supplies before launch

- Headshot (square, plain background), the official Alpha Kappa Psi mark, one photo per experience, four photos per project (see collage sizes), all exported as WebP at 2× with Squoosh.
- `Rohan_Nuthi_Resume.pdf`.
- Per project: Team, Dates, Status, and the Design decisions and Future upgrades text (Overview and Technical details for PickleIQ are drafted from the resume on artboard E).
- Confirmation of the WTC start date (Feb 2026 per the resume) and the three "Fall 2026" course terms.
- The domain (rohannuthi.com or .dev), bought before deploy.

## 13. Red-flag checklist (every item must be false at launch)

Visual: gradients anywhere; glow/blur/aurora behind the hero; neon accent on dark; cream + clay + display serif; cards around text; nested cards or bento grids; coloured left borders; meaningless status dots; multicolour tags or pills; mixed radii; emoji as icons; Inter/Geist with default Tailwind spacing; Playfair/Instrument Serif in the hero; accent word in a headline; ALL-CAPS eyebrow labels; 01/02/03 section numbers; grey body text; device mockup frames; centred hero with a stat strip.

Motion: scroll-reveal fades; typewriter headlines; hover lift or zoom; logo marquee.

Content: "Hi, I'm X 👋"; skill bars; logo walls; "Features" bullet lists; testimonials or newsletter signup; copy with no detail only the author could know.

Code: `create-next-app` leftovers; Lovable/v0/Bolt fingerprints; utility-class soup; client-side React hydrating a static page; one giant initial commit; console errors; missing `alt`, `lang`, favicon or OG image.

## 14. Pre-launch checklist

- [ ] Grayscale pass (`filter: grayscale(1)` on `html`): hierarchy still obvious at 375px and 1440px
- [ ] Squint test: name, resume button and first project are what read from across the room
- [ ] Every red-flag item above is false
- [ ] Resume opens from the nav in a new tab at `/resume.pdf`
- [ ] Every name, title, date and organisation matches the resume and LinkedIn exactly
- [ ] Every link clicked: repos public or marked private, LinkedIn URL customised
- [ ] Keyboard-only pass through every page; focus always visible; each project card is reachable and activatable as one link
- [ ] axe DevTools 0 issues; Lighthouse mobile 100 / 100 / 100 / 100
- [ ] URL pasted into Slack, iMessage and LinkedIn shows the right OG image, title and description
- [ ] View source: no framework boilerplate, no console errors, no unused CSS, no comments
- [ ] JS disabled: the four project cards stack fully visible and the recruiter path still works
- [ ] Reduced motion on: cards stack without tilt or rise; motifs shown fully drawn; view transition off
- [ ] Both colour modes checked on home and on a case page
- [ ] Domain on the resume header, LinkedIn website field and GitHub profile

## 15. Getting it online

1. Buy the domain (Cloudflare Registrar or Porkbun). 
2. Public GitHub repo `rohannuthi7/rohannuthi.com`; `npm create astro@latest` with the empty template; small commits.
3. Build in this order: tokens and `Base.astro` (nav + footer) → `index.astro` sections in the decided order → `projects/[slug].astro` → `404.astro` → metadata and OG images.
4. Cloudflare Pages: connect the repo, framework preset Astro, build `npm run build`, output `dist`, add the custom domain (HTTPS automatic). Every push to `main` redeploys.
5. Run the pre-launch checklist.
