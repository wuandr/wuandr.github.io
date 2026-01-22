# Wuandr Portfolio

Framework-free, single-page portfolio with TypeScript for light behavior, static HTML posts generated from markdown text files, and JSON-backed project entries. Built to be minimal and ultralight—no UI framework or runtime dependencies, just TypeScript compilation and static assets. Build targets `dist/wuandr.github.io` for GitHub Pages.

## Project layout
- `src/index.html` – main page content (about, experience, projects, blog)
- `src/styles.css` – typography, layout, and component styling
- `src/main.ts` – scroll spy, smooth nav scrolling, and JSON-backed rendering for projects/posts
- `src/posts/` – individual blog pages plus the archive table (`src/posts/posts-archive.html`)
- `src/projects/` – project archive table assets (`src/projects/projects-archive.html`, `src/projects/projects-archive.ts`) plus the manual data override (`projects.json`)
- `src/assets/Andrew_Wu_resume_20251126.pdf` – résumé served directly from `assets/`, no duplicate root copy
- `scripts/build.js` – copies HTML/CSS/assets, builds `posts.json` from Markdown, fetches GitHub repos, and merges with manual `projects.json`
- `scripts/fetch-github-repos.js` – fetches and filters GitHub repositories for project population
- `scripts/serve.js` – lightweight static server for the built site
- `github-projects.config.js` – configuration for GitHub project fetching (topics, filters, etc.)
- `.github/workflows/static.yml` – Pages workflow that builds and uploads `dist/wuandr.github.io`

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
- Posts: start from the template in `CONTENT_GUIDE.md` and add Markdown files to `src/posts/content/` (the directory ships empty by default). The build script renders each post to HTML and populates the archive JSON automatically.
- Projects: **Automatically populated from GitHub** (see below) or manually added via `src/projects/projects.json`.
- Replace the résumé by updating `src/assets/Andrew_Wu_resume_20251126.pdf` (or adjust the filename in `src/index.html` and `scripts/build.js` if renamed).
- Tweak styles in `src/styles.css`; adjust client behavior in `src/main.ts` and rebuild.

### Managing Projects

Projects are now dynamically populated from your GitHub repositories during the build process.

#### How it Works
1. The build script fetches your public repositories from GitHub
2. Only repos tagged with specific topics (e.g., `portfolio`, `showcase`) are included
3. Repository metadata is automatically mapped to project fields
4. Manual entries in `src/projects/projects.json` can override or supplement GitHub data

#### Adding a Project from GitHub
1. **Tag your repository**: Add `portfolio` or `showcase` topic to the GitHub repo you want to feature
   - Go to your repository's main page on GitHub
   - Find the **"About"** section on the right sidebar (below the repo description)
   - Click the **gear icon** (⚙️) next to "About"
   - In the popup dialog, find the **"Topics"** field
   - Type `portfolio` or `showcase` and press Enter
   - Click **"Save changes"**
2. **Push to main**: The next deployment will automatically include the project
3. **Status is automatic**:
   - "Active" if pushed within last 6 months
   - "Archived" if marked as archived on GitHub
   - "Maintenance" otherwise

#### Configuration
Edit `github-projects.config.js` to customize:
- `includeTopics`: Which GitHub topics to include (default: `['portfolio', 'showcase']`)
- `excludeRepos`: Specific repos to exclude
- `includeArchived`: Whether to show archived repos (default: `true`)
- See the config file for all available options

#### Manual Projects (Non-GitHub)
To add projects not on GitHub or override GitHub data:
1. Add entries to `src/projects/projects.json` using the template in `CONTENT_GUIDE.md`
2. Manual entries override GitHub data for projects with matching slugs
3. This is useful for client work, external projects, or custom descriptions

#### Local Development with GitHub Token
For local builds, you can optionally provide a GitHub token to avoid rate limits:
1. Create a `.env` file in the project root (already in `.gitignore`)
2. Add: `GITHUB_TOKEN=your_github_personal_access_token`
3. Run `npm run build` as usual

**Note**: The GitHub Actions workflow automatically uses `GITHUB_TOKEN` during deployment, so no additional setup is needed for production builds.

## Deploying
Run `npm run build` and publish `dist/wuandr.github.io`. The included GitHub Pages workflow already uploads this folder.

## See Also
This design was based on and inspired by https://brittanychiang.com/
