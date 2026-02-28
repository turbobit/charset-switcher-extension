import {
  mkdirSync,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync
} from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const version = pkg.version || '0.0.0';
const releaseRoot = resolve('dist', 'chrome-store');
const extensionDir = resolve(releaseRoot, 'extension');
const zipName = `charset-switcher-extension-v${version}.zip`;
const zipPath = resolve(releaseRoot, zipName);

console.log('🔨 Building extension package...\n');

mkdirSync(extensionDir, { recursive: true });

// 필수 파일 검증
const requiredFiles = [
  'manifest.json',
  'assets/icon-16.png',
  'assets/icon-48.png',
  'assets/icon-128.png',
  'src/background/background.js',
  'src/popup/popup.html',
  'src/settings/settings.html'
];

console.log('📋 Validating required files:');
let missingFiles = [];
for (const file of requiredFiles) {
  const fullPath = resolve(file);
  if (existsSync(fullPath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} (MISSING)`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error(`\n❌ Build failed: Missing ${missingFiles.length} required file(s):\n  ${missingFiles.join('\n  ')}`);
  process.exit(1);
}

console.log('\n📦 Copying files to extension directory:');
const includePaths = ['manifest.json', 'src', 'assets'];
const copiedFiles = [];

for (const rel of includePaths) {
  const srcPath = resolve(rel);
  if (!existsSync(srcPath)) {
    console.log(`  ⊘ ${rel} (not found)`);
    continue;
  }
  const dstPath = resolve(extensionDir, rel);
  if (lstatSync(srcPath).isDirectory()) {
    cpSync(srcPath, dstPath, { recursive: true, force: true });
    console.log(`  ✓ ${rel}/ (directory)`);
  } else {
    mkdirSync(resolve(dstPath, '..'), { recursive: true });
    copyFileSync(srcPath, dstPath);
    console.log(`  ✓ ${rel} (file)`);
  }
  copiedFiles.push(rel);
}

// 다국어 파일 복사
const localesRoot = resolve('_locales');
let localeCount = 0;
if (existsSync(localesRoot) && lstatSync(localesRoot).isDirectory()) {
  const localeDirs = readdirSync(localesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^[a-z]{2}(?:_[A-Z]{2})?$/.test(name));

  if (localeDirs.length > 0) {
    console.log(`  ✓ _locales/ (${localeDirs.length} locales: ${localeDirs.join(', ')})`);
    for (const locale of localeDirs) {
      const srcPath = resolve('_locales', locale);
      const dstPath = resolve(extensionDir, '_locales', locale);
      cpSync(srcPath, dstPath, { recursive: true, force: true });
      localeCount++;
    }
  }
}

// 최종 파일 목록 출력
console.log('\n📂 Final extension structure:');
const walkDir = (dir, prefix = '') => {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return b.isDirectory() ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const currentPrefix = isLast ? '└── ' : '├── ';
    const nextPrefix = isLast ? '    ' : '│   ';

    if (entry.isDirectory()) {
      console.log(`  ${prefix}${currentPrefix}${entry.name}/`);
      walkDir(resolve(dir, entry.name), prefix + nextPrefix);
    } else {
      const stats = statSync(resolve(dir, entry.name));
      const sizeKb = (stats.size / 1024).toFixed(1);
      console.log(`  ${prefix}${currentPrefix}${entry.name} (${sizeKb}KB)`);
    }
  });
};
walkDir(extensionDir);

// Zip 파일 생성
console.log(`\n📦 Creating zip archive...`);
const isWindows = process.platform === 'win32';

if (isWindows) {
  const psScript = `Compress-Archive -Path '${join(extensionDir, '*')}' -DestinationPath '${zipPath}' -Force`;
  execSync(`powershell -NoProfile -Command "${psScript}"`, { stdio: 'inherit' });
} else {
  execSync(`(cd "${extensionDir}" && zip -r "${zipPath}" .)`, { stdio: 'inherit' });
}

const zipStats = statSync(zipPath);
const zipSizeKb = (zipStats.size / 1024).toFixed(1);
console.log(`\n✅ Build completed successfully!`);
console.log(`\n📤 Output:`);
console.log(`  📁 Extension directory: ${extensionDir}`);
console.log(`  📦 Zip archive: ${zipPath} (${zipSizeKb}KB)`);
