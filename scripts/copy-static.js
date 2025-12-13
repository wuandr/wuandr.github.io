const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist', 'wuandr.github.io');

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

const stripTags = (html) => html.replace(/<[^>]*>/g, '').trim();

const replaceTableBody = (template, rows) => {
  const bodyContent = rows.length
    ? rows.join('\n')
    : '            <tr><td colspan="3">No entries yet.</td></tr>';

  return template.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>\n${bodyContent}\n          </tbody>`);
};

const buildPostRows = () => {
  const postsDir = path.join(srcDir, 'posts');
  const postFiles = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .sort();

  return postFiles.map((file) => {
    const html = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const metaMatch = html.match(/<p[^>]*class=["']post-meta["'][^>]*>([\s\S]*?)<\/p>/i);

    const title = titleMatch ? stripTags(titleMatch[1]) : file.replace(/\.html$/, '');
    const metaText = metaMatch ? stripTags(metaMatch[1]) : 'TBD';
    const creationDate = metaText.split('·')[0].split('—')[0].trim() || 'TBD';

    return `            <tr>
              <td>${creationDate}</td>
              <td>${title}</td>
              <td><a class="inline-link" href="${file}">Open post</a></td>
            </tr>`;
  });
};

const buildProjectRows = () => {
  const projectsDir = path.join(srcDir, 'projects');
  const projectFiles = fs
    .readdirSync(projectsDir)
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .sort();

  return projectFiles.map((file) => {
    const html = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const metaMatch = html.match(/<p[^>]*class=["']post-meta["'][^>]*>([\s\S]*?)<\/p>/i);
    const repoMatch = html.match(/href=["'](https?:\/\/github\.com[^"']*)["']/i);

    const title = titleMatch ? stripTags(titleMatch[1]) : file.replace(/\.html$/, '');
    const metaText = metaMatch ? stripTags(metaMatch[1]) : 'TBD';
    const yearMatch = metaText.match(/\b\d{4}\b/);
    const creationDate = yearMatch ? yearMatch[0] : 'TBD';
    const repoUrl = repoMatch ? repoMatch[1] : '#';

    return `            <tr>
              <td>${creationDate}</td>
              <td>${title}</td>
              <td><a class="inline-link" href="${repoUrl}" target="_blank" rel="noreferrer">View repo</a></td>
            </tr>`;
  });
};

const generateArchive = (archiveName, rowBuilder) => {
  const templatePath = path.join(srcDir, archiveName, 'index.html');
  if (!fs.existsSync(templatePath)) return;

  const template = fs.readFileSync(templatePath, 'utf-8');
  const rows = rowBuilder();
  const compiled = replaceTableBody(template, rows);

  const outputPath = path.join(distDir, archiveName, 'index.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, compiled, 'utf-8');
};

['index.html', 'styles.css'].forEach((file) => {
  copyFile(path.join(srcDir, file), path.join(distDir, file));
});

copyDir(path.join(srcDir, 'posts'), path.join(distDir, 'posts'));
copyDir(path.join(srcDir, 'projects'), path.join(distDir, 'projects'));
copyDir(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));

const resumeSrc = path.join(srcDir, 'assets', 'Andrew_Wu_resume_20251126.pdf');
copyFile(resumeSrc, path.join(distDir, 'resume.pdf'));

generateArchive('posts', buildPostRows);
generateArchive('projects', buildProjectRows);
