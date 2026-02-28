#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

function getRepoInfo() {
  try {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    const repo = pkg.repository && pkg.repository.url ? pkg.repository.url : '';
    if (repo) return repo;
  } catch (e) {
    // ignore
  }
  try {
    const out = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    return out;
  } catch (e) {
    return '';
  }
}

function normalizeRepo(raw) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith('git@')) {
    url = url.replace(/^git@/, 'https://').replace(':', '/');
  }
  if (url.endsWith('.git')) url = url.slice(0, -4);
  if (!url.startsWith('http')) url = 'https://' + url;
  const m = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

async function triggerWithToken(owner, repo, token) {
  const api = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/pages.yml/dispatches`;
  try {
    const res = await fetch(api, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'charset-switcher-build-script'
      },
      body: JSON.stringify({ ref: 'main' })
    });
    if (res.status === 204 || res.status === 201) {
      console.log('워크플로우 디스패치 요청 성공.');
      return true;
    }
    const text = await res.text();
    console.error('워크플로우 디스패치 실패:', res.status, text);
    return false;
  } catch (e) {
    console.error('API 호출 중 오류:', e);
    return false;
  }
}

function triggerWithGhCli() {
  try {
    execSync('gh workflow run pages.yml --ref main', { stdio: 'inherit' });
    console.log('gh CLI로 워크플로우 실행 명령 전송 완료.');
    return true;
  } catch (e) {
    console.error('gh CLI 실행 실패:', e.message || e);
    return false;
  }
}

async function main() {
  const raw = getRepoInfo();
  const info = normalizeRepo(raw);
  if (!info) {
    console.log('원격 repo 정보를 찾을 수 없습니다. 수동으로 GitHub에서 워크플로우를 트리거하세요.');
    return;
  }
  const { owner, repo } = info;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    const ok = await triggerWithToken(owner, repo, token);
    if (ok) return;
  }
  // fallback to gh CLI
  const okCli = triggerWithGhCli();
  if (okCli) return;

  console.log('');
  console.log('워크플로우 트리거에 실패했습니다. 수동 실행 방법:');
  console.log(`  1) GitHub Actions 탭에서 'Deploy GitHub Pages' 워크플로우를 찾아 수동 실행`);
  console.log(`  2) 또는 gh CLI 사용: gh workflow run pages.yml --ref main (gh auth login 필요)`);
  console.log('환경변수 GITHUB_TOKEN 또는 GH_TOKEN을 설정하면 API 방식으로 자동 트리거됩니다.');
}

// allow top-level await usage
main().catch((e) => {
  console.error('trigger-pages 스크립트 오류:', e);
});

