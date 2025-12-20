# Content Guide

Quick reference for adding posts and projects without digging through code.

## Posts (blog)
- Location: add Markdown files to `src/posts/content/`.
- Frontmatter keys: `title`, `description`, `createdAt` (ISO `YYYY-MM-DD`), optional `updatedAt`, optional `readTime` (e.g., `6 min`), optional `slug` (defaults to filename).
- The first `# Heading` is removed from the rendered page; keep one H1 that matches the title, then write the post body.
- The build outputs HTML pages plus `posts/posts.json` for the homepage and archive.

Template to copy:

```md
---
title: "Post title"
description: "One- to two-sentence summary used on the homepage and archive."
createdAt: 2025-01-10
updatedAt: 2025-01-12
readTime: 6 min
slug: "post-title"
---

# Post title

Kick things off with a short intro paragraph that explains the problem or story.

- Key takeaway or bullet
- Another bullet

Wrap up with links or a call to action.
```

Workflow to add a post:
1) Copy the template into a new file in `src/posts/content/` (e.g., `new-post.md`).
2) Fill in frontmatter dates with ISO `YYYY-MM-DD` strings; keep `slug` lowercase-with-dashes.
3) Run `npm run build` to regenerate the HTML pages and `posts/posts.json`.

## Projects
- Location: edit `src/projects/projects.json`.
- Keep it a valid JSON array. Each object represents one project entry.
- `slug` is optional (derived from `title` when omitted). `repo` or `href` populates the homepage card link and archive.
- Dates should use ISO `YYYY-MM-DD`. `status` is a short badge like `In progress`, `Live`, `Paused`.

Template entry:

```json
[
  {
    "slug": "project-slug",
    "title": "Project Name",
    "description": "One- to two-sentence summary of what the project does.",
    "createdAt": "2025-01-10",
    "updatedAt": "2025-01-20",
    "status": "In progress",
    "repo": "https://github.com/you/project",
    "href": "https://demo.example.com",
    "tags": ["TypeScript", "AWS", "PostgreSQL"]
  }
]
```

Workflow to add a project:
1) Duplicate the template object (keep the outer array), fill in fields, and save.
2) Run `npm run build` so the homepage cards and archive table pick up the changes.
