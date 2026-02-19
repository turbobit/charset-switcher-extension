import { STORAGE_KEYS, DEFAULT_CHARSETS } from './constants.js';

// 사이트별 인코딩 설정 저장
export async function saveSiteCharset(domain, charset) {
  const settings = await getSiteCharsetSettings();
  settings[domain] = charset;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
}

// 사이트별 인코딩 설정 조회
export async function getSiteCharset(domain) {
  const settings = await getSiteCharsetSettings();
  return settings[domain];
}

// 모든 사이트 설정 조회
export async function getSiteCharsetSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITE_SETTINGS);
  return result[STORAGE_KEYS.SITE_SETTINGS] || {};
}

// 사이트 설정 제거
export async function removeSiteCharset(domain) {
  const settings = await getSiteCharsetSettings();
  delete settings[domain];
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
}

// 기본 인코딩 설정 저장
export async function setDefaultCharset(charset) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.DEFAULT_CHARSET]: charset });
}

// 기본 인코딩 조회
export async function getDefaultCharset() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.DEFAULT_CHARSET);
  return result[STORAGE_KEYS.DEFAULT_CHARSET] || 'UTF-8';
}

// 활성화된 도메인 목록 조회
export async function getEnabledDomains() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.ENABLED_DOMAINS);
  return result[STORAGE_KEYS.ENABLED_DOMAINS] || [];
}

// 도메인 활성화/비활성화
export async function setEnabledDomains(domains) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.ENABLED_DOMAINS]: domains });
}

// 사용자 정의 인코딩 목록 조회
export async function getCustomCharsets() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_CHARSETS);
  return result[STORAGE_KEYS.CUSTOM_CHARSETS] || [];
}

// 사용자 정의 인코딩 목록 저장
export async function setCustomCharsets(charsets) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_CHARSETS]: charsets });
}

// 모든 인코딩 목록 조회 (기본 + 사용자 정의)
export async function getAllCharsets() {
  const customCharsets = await getCustomCharsets();
  return [...DEFAULT_CHARSETS, ...customCharsets];
}

// 사용자 정의 인코딩 추가
export async function addCustomCharset(charset) {
  const customCharsets = await getCustomCharsets();
  // 중복 확인
  if (customCharsets.some(c => c.value === charset.value)) {
    throw new Error('이미 존재하는 인코딩입니다.');
  }
  customCharsets.push(charset);
  await setCustomCharsets(customCharsets);
}

// 사용자 정의 인코딩 제거
export async function removeCustomCharset(value) {
  const customCharsets = await getCustomCharsets();
  const filtered = customCharsets.filter(c => c.value !== value);
  await setCustomCharsets(filtered);
}
