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

['index.html', 'styles.css'].forEach((file) => {
  copyFile(path.join(srcDir, file), path.join(distDir, file));
});

copyDir(path.join(srcDir, 'posts'), path.join(distDir, 'posts'));
copyDir(path.join(srcDir, 'projects'), path.join(distDir, 'projects'));
copyDir(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));

const resumeSrc = path.join(srcDir, 'assets', 'Andrew_Wu_resume_20251126.pdf');
copyFile(resumeSrc, path.join(distDir, 'resume.pdf'));
