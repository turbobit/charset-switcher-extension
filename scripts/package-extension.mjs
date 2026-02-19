import {
  mkdirSync,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const version = pkg.version || '0.0.0';
const releaseRoot = resolve('dist', 'chrome-store');
const extensionDir = resolve(releaseRoot, 'extension');
const zipName = `charset-switcher-extension-v${version}.zip`;
const zipPath = resolve(releaseRoot, zipName);

mkdirSync(extensionDir, { recursive: true });

const includePaths = ['manifest.json', 'src', 'assets'];
for (const rel of includePaths) {
  const srcPath = resolve(rel);
  if (!existsSync(srcPath)) continue;
  const dstPath = resolve(extensionDir, rel);
  if (lstatSync(srcPath).isDirectory()) {
    cpSync(srcPath, dstPath, { recursive: true, force: true });
  } else {
    mkdirSync(resolve(dstPath, '..'), { recursive: true });
    copyFileSync(srcPath, dstPath);
  }
}

const localesRoot = resolve('_locales');
if (existsSync(localesRoot) && lstatSync(localesRoot).isDirectory()) {
  const localeDirs = readdirSync(localesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^[a-z]{2}(?:_[A-Z]{2})?$/.test(name));

  for (const locale of localeDirs) {
    const srcPath = resolve('_locales', locale);
    const dstPath = resolve(extensionDir, '_locales', locale);
    cpSync(srcPath, dstPath, { recursive: true, force: true });
  }
}

const psScript = `Compress-Archive -Path '${join(extensionDir, '*')}' -DestinationPath '${zipPath}' -Force`;
execSync(`powershell -NoProfile -Command "${psScript}"`, { stdio: 'inherit' });

console.log(`Created: ${zipPath}`);
