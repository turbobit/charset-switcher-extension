import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log('Removed dist/');
} else {
  console.log('dist/ does not exist; nothing to clean.');
}