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

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/');
  const decodedPath = decodeURIComponent(parsed.pathname || '/');
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');

  let filePath = path.join(distDir, safePath);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath)) {
    const nestedIndex = path.join(distDir, safePath, 'index.html');
    if (fs.existsSync(nestedIndex)) {
      filePath = nestedIndex;
    }
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
