const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist', 'wuandr.github.io');

fs.mkdirSync(distDir, { recursive: true });

const staticFiles = ['index.html', 'styles.css'];

staticFiles.forEach((file) => {
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
});
