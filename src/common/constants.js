export const DEFAULT_CHARSETS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'EUC-KR', label: 'EUC-KR (Korean)' },
  { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin)' },
  { value: 'GB2312', label: 'GB2312 (Simplified Chinese)' },
  { value: 'BIG5', label: 'BIG5 (Traditional Chinese)' },
  { value: 'Shift_JIS', label: 'Shift_JIS (Japanese)' },
  { value: 'Windows-1252', label: 'Windows-1252' }
];

export const STORAGE_KEYS = {
  SITE_SETTINGS: 'siteCharsetSettings',
  DEFAULT_CHARSET: 'defaultCharset',
  CUSTOM_CHARSETS: 'customCharsets',
  ENABLED_DOMAINS: 'enabledDomains'
};