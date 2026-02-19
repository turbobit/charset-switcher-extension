// 기본 인코딩 목록
export const DEFAULT_CHARSETS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'EUC-KR', label: 'EUC-KR (한글)' },
  { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin)' },
  { value: 'GB2312', label: 'GB2312 (중국어 간체)' },
  { value: 'BIG5', label: 'BIG5 (중국어 번체)' },
  { value: 'Shift_JIS', label: 'Shift_JIS (일본어)' },
  { value: 'Windows-1252', label: 'Windows-1252' }
];

// 저장소 키
export const STORAGE_KEYS = {
  SITE_SETTINGS: 'siteCharsetSettings',
  DEFAULT_CHARSET: 'defaultCharset',
  CUSTOM_CHARSETS: 'customCharsets',
  ENABLED_DOMAINS: 'enabledDomains'
};
