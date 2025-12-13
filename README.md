# Wuandr Portfolio

Framework-free, single-page portfolio with TypeScript for light behavior, static HTML posts generated from markdown text files, and JSON-backed project entries. Built to be minimal and ultralight—no UI framework or runtime dependencies, just TypeScript compilation and static assets. Build targets `dist/wuandr.github.io` for GitHub Pages.

## Project layout
- `src/index.html` – main page content (about, experience, projects, blog)
- `src/styles.css` – typography, layout, and component styling
- `src/main.ts` – scroll spy, smooth nav scrolling, and JSON-backed rendering for projects/posts
- `src/posts/` – individual blog pages plus the archive table (`src/posts/posts-archive.html`)
- `src/projects/` – project archive table assets (`src/projects/projects-archive.html`, `src/projects/projects-archive.ts`) plus the data source (`projects.json`)
- `src/assets/Andrew_Wu_resume_20251126.pdf` – résumé served directly from `assets/`, no duplicate root copy
- `scripts/build.js` – copies HTML/CSS/assets, builds `posts.json` from Markdown, and `projects.json` from the data file
- `scripts/serve.js` – lightweight static server for the built site
- `.github/workflows/static.yml` – Pages workflow that uploads `dist/wuandr.github.io`

## Prerequisites
- Node.js 18+ (uses `fs.cp` and ES2020 output)
- Only dev dependency is TypeScript; no runtime packages or frameworks are pulled into the build.

## Install & build
```bash
npm ci
npm run build
```
`npm run build` compiles `src/main.ts` to `dist/wuandr.github.io/main.js`, copies HTML/CSS/assets and posts, and generates `posts/projects.json` via `scripts/build.js`.

## Local preview
- `npm start` – rebuild then serve `dist/wuandr.github.io` at http://localhost:4173 (override with `PORT=xxxx`)
- `npm run serve` – serve the existing `dist` output without rebuilding

Use the server for local testing so JSON fetches (`posts/posts.json`, `projects/projects.json`) work without file:// CORS issues.

## Editing content
- Update hero/about/experience copy in `src/index.html`.
- Posts: add Markdown files in `src/posts/content/` with optional frontmatter (`title`, `description`, `createdAt`, `updatedAt`, `readTime`, `slug`). The build script renders each post to HTML and populates the archive JSON automatically.
- Projects: edit `src/projects/projects.json` and add an object per project (`slug`, `title`, `description`, `createdAt`, optional `updatedAt`, `status`, `repo`/`href`, `tags`). The archive table and homepage cards pull directly from this data file; standalone HTML detail pages are no longer copied during the build.
- Replace the résumé by updating `src/assets/Andrew_Wu_resume_20251126.pdf` (or adjust the filename in `src/index.html` and `scripts/build.js` if renamed).
- Tweak styles in `src/styles.css`; adjust client behavior in `src/main.ts` and rebuild.

## Deploying
Run `npm run build` and publish `dist/wuandr.github.io`. The included GitHub Pages workflow already uploads this folder.

## See Also
This design was based on and inspired by https://brittanychiang.com/