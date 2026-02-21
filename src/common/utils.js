export function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getCurrentCharset() {
  const metaCharset = document.querySelector('meta[charset]');
  if (metaCharset) {
    return metaCharset.getAttribute('charset');
  }

  const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');
  if (metaContentType) {
    const content = metaContentType.getAttribute('content') || '';
    const match = content.match(/charset=([^\s;]+)/i);
    if (match) {
      return match[1];
    }
  }

  return 'unknown';
}

export function setCharset(charset) {
  const existingCharset = document.querySelector('meta[charset]');
  if (existingCharset) {
    existingCharset.remove();
  }

  const metaCharset = document.createElement('meta');
  metaCharset.setAttribute('charset', charset);
  if (document.head) {
    document.head.insertBefore(metaCharset, document.head.firstChild);
  }
}