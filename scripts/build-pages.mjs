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
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Charset Switcher Extension — 문서</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(160deg, #f4fbff, #e9f4f7);
        color: #14313b;
      }
      main {
        max-width: 820px;
        margin: 56px auto;
        padding: 28px;
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 12px 34px rgba(20, 49, 59, 0.14);
      }
      h1 { margin-top: 0; }
      a.button {
        display: inline-block;
        margin-right: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        text-decoration: none;
        border: 1px solid #2b7d99;
        color: #11495e;
      }
      a.button:hover { background: #e9f7ff; }
      pre {
        background: #f2f6f8;
        padding: 12px;
        border-radius: 8px;
        overflow: auto;
      }
      code.inline { background: #f2f6f8; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Charset Switcher</h1>
      <p>웹페이지 문자셋을 강제 변경하는 Chrome 확장입니다. 이 페이지는 프로젝트의 간단한 설명과 빌드·배포 가이드를 제공합니다.</p>

      <h2>빠른 시작</h2>
      <p>로컬에서 빌드하고 문서와 배포 준비 파일을 생성하려면:</p>
      <pre><code>npm ci || npm install
npm run build</code></pre>
      <p><strong>참고:</strong> CI에서는 <code>npm ci</code>를 사용하려면 리포지터리에 <code>package-lock.json</code>이 필요합니다.</p>

      <h2>로컬 설치(개발용)</h2>
      <p>확장 프로그램을 로컬에 설치하려면 Chrome 확장 관리 페이지(chrome://extensions/)에서 "개발자 모드"를 켜고, <code>dist/chrome-store/extension</code> 폴더를 압축 해제한 상태로 로드하세요.</p>

      <h2>릴리스 및 다운로드</h2>
      <p>공식 빌드(zip)는 GitHub Releases에서 제공합니다. 최신 릴리스 페이지에서 설치 파일을 다운로드하세요.</p>
      <p><a class="button" href="${releasesUrl}" target="_blank" rel="noopener">GitHub Releases 열기</a></p>

      <h2>GitHub Pages</h2>
      <p>이 저장소는 빌드 시 <code>docs/</code> 폴더를 생성하며, GitHub Actions가 자동으로 Pages에 배포하도록 구성되어 있습니다.</p>
      <p>빌드 산출물은 <code>docs/extension</code>에 복사되지만 ZIP 파일은 포함하지 않습니다(다운로드는 Releases에서).</p>

      <p><a href="./README.md">프로젝트 README 보기</a></p>
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