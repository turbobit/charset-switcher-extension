import { STORAGE_KEYS, DEFAULT_CHARSETS } from './constants.js';

export async function saveSiteCharset(domain, charset) {
  const settings = await getSiteCharsetSettings();
  settings[domain] = charset;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
}

export async function getSiteCharset(domain) {
  const settings = await getSiteCharsetSettings();
  return settings[domain];
}

export async function getSiteCharsetSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITE_SETTINGS);
  return result[STORAGE_KEYS.SITE_SETTINGS] || {};
}

export async function removeSiteCharset(domain) {
  const settings = await getSiteCharsetSettings();
  delete settings[domain];
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
}

export async function setDefaultCharset(charset) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.DEFAULT_CHARSET]: charset });
}

export async function getDefaultCharset() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.DEFAULT_CHARSET);
  return result[STORAGE_KEYS.DEFAULT_CHARSET] || 'UTF-8';
}

export async function getEnabledDomains() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.ENABLED_DOMAINS);
  return result[STORAGE_KEYS.ENABLED_DOMAINS] || [];
}

export async function setEnabledDomains(domains) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.ENABLED_DOMAINS]: domains });
}

export async function getCustomCharsets() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_CHARSETS);
  return result[STORAGE_KEYS.CUSTOM_CHARSETS] || [];
}

export async function setCustomCharsets(charsets) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_CHARSETS]: charsets });
}

export async function getAllCharsets() {
  const customCharsets = await getCustomCharsets();
  return [...DEFAULT_CHARSETS, ...customCharsets];
}

export async function addCustomCharset(charset) {
  const customCharsets = await getCustomCharsets();
  if (customCharsets.some((c) => c.value === charset.value)) {
    throw new Error('Charset already exists.');
  }
  customCharsets.push(charset);
  await setCustomCharsets(customCharsets);
}

export async function removeCustomCharset(value) {
  const customCharsets = await getCustomCharsets();
  const filtered = customCharsets.filter((c) => c.value !== value);
  await setCustomCharsets(filtered);
}