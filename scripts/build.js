const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist', 'wuandr.github.io');
const postsContentDir = path.join(srcDir, 'posts', 'content');
const postsOutputDir = path.join(distDir, 'posts');
const projectsDataPath = path.join(srcDir, 'projects', 'projects.json');

fs.mkdirSync(distDir, { recursive: true });

const copyFile = (from, to) => {
  if (!fs.existsSync(from)) return;

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;

  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

const removeIfExists = (target) => {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

const removeFilesByExtension = (dir, extensions) => {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeFilesByExtension(fullPath, extensions);
      return;
    }

    if (extensions.has(path.extname(entry.name))) {
      fs.rmSync(fullPath);
    }
  });
};

const writeJson = (to, data) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, JSON.stringify(data, null, 2), 'utf-8');
};

const readJsonArray = (from) => {
  if (!fs.existsSync(from)) return [];
  try {
    const raw = fs.readFileSync(from, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Failed to read JSON from ${from}`, err);
    return [];
  }
};

const escapeAttribute = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDateInput = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateParts = (isoDate) => {
  if (typeof isoDate !== 'string') return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  const monthName = monthNames[month - 1];
  return `${monthName} ${day}, ${year}`;
};

const formatDisplayDate = (value) => {
  if (!value) return 'TBD';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const friendly = formatDateParts(value.trim());
    if (friendly) return friendly;
  }
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const coerceIsoDate = (value, fallback) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const parsed = parseDateInput(value) || parseDateInput(fallback);
  if (parsed) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
};

const parseFrontmatter = (raw) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }

  const metaLines = match[1].split('\n');
  const meta = metaLines.reduce((acc, line) => {
    const [key, ...rest] = line.split(':');
    if (!key) return acc;
    const cleanKey = key.trim();
    const value = rest.join(':').trim();
    if (cleanKey) acc[cleanKey] = value;
    return acc;
  }, {});

  const body = raw.slice(match[0].length).trim();
  return { meta, body };
};

const formatInline = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

const markdownToHtml = (markdown) => {
  const lines = markdown.split('\n');
  const html = [];
  let listBuffer = [];
  let paragraph = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    html.push(`<ul>${listBuffer.map((item) => `<li>${item}</li>`).join('')}</ul>`);
    listBuffer = [];
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${formatInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      flushParagraph();
      return;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList();
      flushParagraph();
      const level = trimmed.match(/^#{1,6}/)?.[0].length || 1;
      const text = trimmed.replace(/^#{1,6}\s+/, '');
      html.push(`<h${level}>${formatInline(text)}</h${level}>`);
      return;
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(formatInline(trimmed.slice(2)));
      return;
    }

    paragraph.push(trimmed);
  });

  flushList();
  flushParagraph();

  return html.join('\n');
};

const extractExcerpt = (markdown) => {
  const lines = markdown.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstParagraph = lines.find((line) => !line.startsWith('#'));
  if (!firstParagraph) return '';
  return firstParagraph.replace(/\s+/g, ' ').slice(0, 180);
};

const stripLeadingTitle = (markdown) => markdown.replace(/^#\s+[^\n]+\n+/, '').trim();

const renderPostTemplate = ({ title, description, createdAt, updatedAt, readTime, contentHtml }) => {
  const createdDisplay = formatDisplayDate(createdAt);
  const updatedDisplay = formatDisplayDate(updatedAt);
  const metaPieces = [createdDisplay];
  if (updatedDisplay && updatedDisplay !== createdDisplay) metaPieces.push(`Updated ${updatedDisplay}`);
  if (readTime) metaPieces.push(readTime);
  const metaLine = metaPieces.filter(Boolean).join(' · ') || 'TBD';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeAttribute(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <title>${title} · Andrew Wu</title>
</head>
<body class="post-page">
  <a class="skip-link" href="#content">Skip to content</a>

  <main class="post-shell">
    <header class="post-header">
      <div class="post-links">
        <a class="inline-link" href="./posts-archive.html">Blog archive</a>
        <span aria-hidden="true">·</span>
        <a class="inline-link" href="../index.html">Portfolio home</a>
      </div>
      <p class="eyebrow">Blog · Post</p>
      <p class="post-meta">${metaLine}</p>
      <h1>${title}</h1>
    </header>

    <article id="content" class="post-body">
${contentHtml}
    </article>
  </main>
</body>
</html>`;
};

const buildPostPages = () => {
  if (!fs.existsSync(postsContentDir)) return [];

  const postFiles = fs
    .readdirSync(postsContentDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  const entries = postFiles.map((file) => {
    const fullPath = path.join(postsContentDir, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const stats = fs.statSync(fullPath);
    const { meta, body } = parseFrontmatter(raw);
    const contentBody = stripLeadingTitle(body);

    const slug = meta.slug || file.replace(/\.md$/, '');
    const title = meta.title || slug;
    const description = meta.description || extractExcerpt(contentBody);
    const createdAt = coerceIsoDate(meta.createdAt || meta.date, stats.birthtime);
    const updatedAt = coerceIsoDate(meta.updatedAt || meta.modifiedAt, stats.mtime);
    const readTime = meta.readTime || '';
    const href = `${slug}.html`;
    const sourcePath = path.posix.join('posts', 'content', file);

    const contentHtml = markdownToHtml(contentBody);
    const pageHtml = renderPostTemplate({
      title,
      description,
      createdAt,
      updatedAt,
      readTime,
      contentHtml,
    });

    const outputPath = path.join(distDir, 'posts', href);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pageHtml, 'utf-8');

    return {
      slug,
      title,
      description,
      href,
      sourcePath,
      createdAt,
      updatedAt,
      createdDisplay: formatDisplayDate(createdAt),
      updatedDisplay: formatDisplayDate(updatedAt),
      readTime,
    };
  });

  return entries.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

const buildProjectRows = () => {
  const projects = readJsonArray(projectsDataPath);

  const toSlug = (entry) => {
    if (entry.slug) return entry.slug;
    if (entry.title) {
      return entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    return '';
  };

  return projects
    .map((project) => {
      const slug = toSlug(project);
      const createdAt = coerceIsoDate(project.createdAt || project.date, '');
      const updatedAt = coerceIsoDate(project.updatedAt, project.createdAt || project.date);
      const createdDisplay = formatDisplayDate(createdAt);
      const updatedDisplay = formatDisplayDate(updatedAt);

      return {
        slug,
        title: project.title || slug || 'Untitled',
        description: project.description || '',
        createdAt,
        updatedAt,
        createdDisplay,
        updatedDisplay,
        date: project.date || createdDisplay,
        href: project.href || project.link || project.repo || '',
        repo: project.repo || '',
        status: project.status || '',
        tags: Array.isArray(project.tags) ? project.tags : [],
      };
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
};

['index.html', 'styles.css'].forEach((file) => {
  copyFile(path.join(srcDir, file), path.join(distDir, file));
});

copyFile(path.join(srcDir, 'posts', 'posts-archive.html'), path.join(distDir, 'posts', 'posts-archive.html'));
copyFile(
  path.join(srcDir, 'projects', 'projects-archive.html'),
  path.join(distDir, 'projects', 'projects-archive.html')
);
copyDir(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));

const cleanPostOutput = () => {
  if (!fs.existsSync(postsOutputDir)) return;
  fs.readdirSync(postsOutputDir).forEach((file) => {
    if (file.endsWith('.html') && file !== 'posts-archive.html') {
      fs.unlinkSync(path.join(postsOutputDir, file));
    }
  });
};

const pruneDistArtifacts = () => {
  removeIfExists(path.join(distDir, 'posts', 'content'));
  removeIfExists(path.join(distDir, 'resume.pdf'));
  removeIfExists(path.join(distDir, 'posts', 'index.html'));
  removeIfExists(path.join(distDir, 'posts', 'index.js'));
  removeIfExists(path.join(distDir, 'posts', 'archive.html'));
  removeIfExists(path.join(distDir, 'posts', 'archive.js'));
  removeIfExists(path.join(distDir, 'projects', 'index.html'));
  removeIfExists(path.join(distDir, 'projects', 'index.js'));
  removeIfExists(path.join(distDir, 'projects', 'archive.html'));
  removeIfExists(path.join(distDir, 'projects', 'archive.js'));
  removeFilesByExtension(distDir, new Set(['.ts', '.md']));
};

pruneDistArtifacts();
cleanPostOutput();
const postManifest = buildPostPages();
const projectManifest = buildProjectRows();
writeJson(path.join(distDir, 'posts', 'posts.json'), postManifest);
writeJson(path.join(distDir, 'projects', 'projects.json'), projectManifest);
