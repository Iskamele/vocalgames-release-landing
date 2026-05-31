# VOCAL GAMES — landing site

Static one-page site. No build step. Three files: `index.html`, `styles.css`, `main.js`.

## Run locally

Easiest:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. (Opening `index.html` directly via `file://` also works, but a local server is closer to production behaviour — and required for some browsers to lazy-load images without quirks.)

## Going live — fill these in

All editable fields are listed below. Search for `TODO` in the source if you want to find them in context.

### 1. `main.js` — `GAMES` array (top of file)

For each game:

- `downloadUrl` — link for **Завантажити** button
- `instructionsUrl` — link for **Інструкції** button
- `detailsUrl` — for **Подробніше** (hidden by default; see flag below)
- `image` — path to the full-bleed background art
- `watchUrl` — Warhammer only: where "Дивитись зараз" goes (currently `TODO_WARHAMMER_WATCH_URL`)

Status / date fields:

- `status: "date"` → uses `releaseDate` (e.g. `"30 червня"`, `"11.11.2026"`)
- `status: "available"` → renders "Дивитись зараз" linked to `watchUrl`
- `status: "tba"` → renders free-form `releaseText`

To toggle the **Подробніше** button site-wide, flip:

```js
const DETAILS_ENABLED = false;
```

to `true` near the top of `main.js`.

### 2. `index.html`

- `TODO_TELEGRAM_URL` — used in two places (hero top-meta + contacts section)
- `TODO_YOUTUBE_URL` — used in two places (hero top-meta + contacts section)
- `.hero-subtitle` — the one-sentence intro `Українська озвучка ваших улюблених ігор.` (placeholder; replace when final copy is ready)

### 3. Art

Game cover art lives in `assets/games/`. Files are named to match the `GAMES[].image` paths:

- `01-bioshock-cover.jpg`
- `02-subnautica-cover.jpg`
- `03-warhammer-cover.jpg`
- `04-skyrim-cover.jpg`
- `05-slay-the-princess-cover.jpg`

Replace any of these to swap the art — keep the filename or update the `image` field in `GAMES`.

## Deploy

Anywhere that serves static files: GitHub Pages, Netlify, Vercel, Cloudflare Pages, plain S3, nginx. Upload the whole `vocal-games/` directory as the site root.

## File layout

```
vocal-games/
├── index.html
├── styles.css
├── main.js
├── README.md
└── assets/
    ├── games/                # full-bleed section backgrounds
    │   ├── 01-bioshock-cover.jpg
    │   ├── 02-subnautica-cover.jpg
    │   ├── 03-warhammer-cover.jpg
    │   ├── 04-skyrim-cover.jpg
    │   └── 05-slay-the-princess-cover.jpg
    └── vendor/
        └── three.min.js      # for the hero WebGL aura
```

## Browser support

Modern evergreen browsers. The hero shader requires WebGL — if unavailable (or user prefers reduced motion), the hero falls back to a static CSS radial gradient and the rest of the site works unchanged.
