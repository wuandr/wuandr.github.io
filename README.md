# Wuandr Portfolio

Minimal single-page portfolio for a software engineer. The structure mirrors the v4 layout (hero, about, tabbed experience, featured work, projects, and a contact CTA) while staying framework-free with only HTML, CSS, and TypeScript.

## Project layout
- `src/index.html` – page markup (nav, hero, sections, footer)
- `src/styles.css` – styling for the v4-inspired layout and components
- `src/main.ts` – smooth scrolling, active nav state, tab switching, and dynamic footer year
- `dist/wuandr.github.io/` – build output that gets deployed
- `scripts/copy-static.js` – copies HTML/CSS into `dist` after build
- `.github/workflows/static.yml` – Pages deploy workflow (adjust its `path` to match the dist folder)

## Prerequisites
- Node.js 18+ (for scripts/build)

## Install & build
```bash
npm install
npm run build
```
`npm run build` runs `tsc` to emit `dist/wuandr.github.io/main.js` and copies `src/index.html` and `src/styles.css` into `dist/wuandr.github.io/`.

Open `dist/wuandr.github.io/index.html` in a browser to view the site, or serve that folder via your hosting.

## Customization
- Update profile info, projects, and experience directly in `src/index.html`.
- Tweak colors/spacing in `src/styles.css`.
- Add client-side behavior in `src/main.ts` (remember to rebuild).

## Deploying
Ensure your deploy step uploads `dist/wuandr.github.io`. The provided GitHub Pages workflow currently points to `dist/wuandr.github.io/browser`; change it if you keep the current output path.
