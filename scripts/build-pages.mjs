import { cpSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync, rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const docsDir = resolve('docs');
const readmeSrc = resolve('README.md');
const readmeDst = resolve('docs', 'README.md');

mkdirSync(docsDir, { recursive: true });

if (existsSync(readmeSrc)) {
  cpSync(readmeSrc, readmeDst, { force: true });
}

function getRepoBaseUrl() {
  try {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    if (pkg && pkg.repository && pkg.repository.url) {
      return pkg.repository.url;
    }
  } catch (e) {
    // ignore
  }
  try {
    const out = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (e) {
    // ignore
  }
  return '';
}

function toReleasesUrl(rawUrl) {
  if (!rawUrl) return 'https://github.com/';
  let url = rawUrl.trim();
  if (url.startsWith('git@')) {
    url = url.replace(/^git@/, 'https://').replace(':', '/');
  }
  if (url.endsWith('.git')) url = url.slice(0, -4);
  if (!url.startsWith('http')) url = 'https://' + url;
  return `${url.replace(/\/+$/, '')}/releases`;
}

const releasesUrl = toReleasesUrl(getRepoBaseUrl());

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Charset Switcher Extension</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(160deg, #f4fbff, #e9f4f7);
        color: #14313b;
      }
      main {
        max-width: 760px;
        margin: 56px auto;
        padding: 28px;
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 12px 34px rgba(20, 49, 59, 0.14);
      }
      h1 { margin-top: 0; }
      a {
        display: inline-block;
        margin-right: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        text-decoration: none;
        border: 1px solid #2b7d99;
        color: #11495e;
      }
      a:hover { background: #e9f7ff; }
      code { background: #f2f6f8; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Charset Switcher</h1>
      <p>Chrome extension release assets and docs.</p>
      <p>Build output is generated under <code>dist/</code>.</p>
      <p><a href="./README.md">Project README</a></p>
      <p><a href="${releasesUrl}" target="_blank" rel="noopener">Download releases (GitHub Releases)</a></p>
    </main>
  </body>
</html>
`;

writeFileSync(resolve(docsDir, 'index.html'), html, 'utf8');
console.log('Built GitHub Pages files in docs/');

// If extension build output exists (created by package:chrome), copy it into docs/extension
// but exclude ZIP archives. This ensures downloads are served via GitHub Releases instead.
const extensionSrc = resolve('dist', 'chrome-store');
const extensionDst = resolve(docsDir, 'extension');
try {
  if (existsSync(extensionSrc)) {
    mkdirSync(extensionDst, { recursive: true });
    const entries = readdirSync(extensionSrc);
    for (const name of entries) {
      const srcPath = resolve(extensionSrc, name);
      const dstPath = resolve(extensionDst, name);
      const st = statSync(srcPath);
      if (st.isDirectory()) {
        cpSync(srcPath, dstPath, { recursive: true, force: true });
      } else {
        // skip zip files
        if (name.toLowerCase().endsWith('.zip')) {
          // ensure any existing zip in destination is removed
          if (existsSync(dstPath)) {
            try { rmSync(dstPath); } catch (e) { /* ignore */ }
          }
          continue;
        }
        // copy regular file
        cpSync(srcPath, dstPath, { force: true });
      }
    }
    // additionally remove any zip files that might already exist in destination
    try {
      const dstEntries = readdirSync(extensionDst);
      for (const f of dstEntries) {
        if (f.toLowerCase().endsWith('.zip')) {
          try { rmSync(resolve(extensionDst, f)); } catch (e) { /* ignore */ }
        }
      }
    } catch (e) {
      // ignore
    }
    console.log('Copied extension build to docs/extension (zip files excluded)');
  } else {
    console.log('No extension build found at', extensionSrc);
  }
} catch (err) {
  console.error('Failed to copy extension build to docs:', err);
}