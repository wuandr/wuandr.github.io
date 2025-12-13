// Simple static file server for the built site. No routing or SSR needed.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist', 'wuandr.github.io');
const port = Number(process.env.PORT) || 4173;

if (!fs.existsSync(distDir)) {
  console.error('Build output not found. Run `npm run build` first.');
  process.exit(1);
}

// Minimal set of mime types for assets in this repo.
const mimeTypes = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
};

const sendNotFound = (res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
};

// Resolve a request path to a safe file inside dist, preferring index.html for directories.
const resolveFilePath = (requestPath) => {
  const decodedPath = decodeURIComponent(requestPath || '/');
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const candidate = path.join(distDir, safePath);

  if (!candidate.startsWith(distDir)) return { forbidden: true }; // block path traversal

  try {
    const stats = fs.statSync(candidate);
    return { filePath: stats.isDirectory() ? path.join(candidate, 'index.html') : candidate };
  } catch {
    const nestedIndex = path.join(distDir, safePath, 'index.html');
    return { filePath: fs.existsSync(nestedIndex) ? nestedIndex : null };
  }
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/');
  const { filePath, forbidden } = resolveFilePath(parsed.pathname || '/');

  if (forbidden) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (!filePath) {
    sendNotFound(res);
    return;
  }

  if (!fs.existsSync(filePath)) {
    sendNotFound(res);
    return;
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving dist/wuandr.github.io at http://localhost:${port}`);
});
