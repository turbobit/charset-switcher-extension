import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve('_locales');
const baseLocale = 'en';
const basePath = resolve(localesDir, baseLocale, 'messages.json');

if (!existsSync(basePath)) {
  throw new Error('Missing _locales/en/messages.json');
}

const baseMessages = JSON.parse(readFileSync(basePath, 'utf8'));
const requiredKeys = Object.keys(baseMessages);

const localeDirs = readdirSync(localesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name);

let hasError = false;

for (const locale of localeDirs) {
  const localePath = resolve(localesDir, locale, 'messages.json');
  if (!existsSync(localePath)) {
    console.error(`[i18n] Missing file: _locales/${locale}/messages.json`);
    hasError = true;
    continue;
  }

  const messages = JSON.parse(readFileSync(localePath, 'utf8'));
  for (const key of requiredKeys) {
    if (!messages[key] || typeof messages[key].message !== 'string') {
      console.error(`[i18n] Missing key in ${locale}: ${key}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`[i18n] OK. Checked locales: ${localeDirs.join(', ')}`);