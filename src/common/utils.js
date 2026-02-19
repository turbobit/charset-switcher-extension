// URL에서 도메인 추출
export function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// 메타 태그 또는 HTTP 헤더에서 현재 인코딩 조회
export function getCurrentCharset() {
  const metaCharset = document.querySelector('meta[charset]');
  if (metaCharset) {
    return metaCharset.getAttribute('charset');
  }

  const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');
  if (metaContentType) {
    const content = metaContentType.getAttribute('content');
    const match = content.match(/charset=([^\s;]+)/i);
    if (match) {
      return match[1];
    }
  }

  return 'unknown';
}

// 인코딩 메타 태그 설정
export function setCharset(charset) {
  // 기존 charset 메타 태그 제거
  const existingCharset = document.querySelector('meta[charset]');
  if (existingCharset) {
    existingCharset.remove();
  }

  // 새로운 charset 메타 태그 추가
  const metaCharset = document.createElement('meta');
  metaCharset.setAttribute('charset', charset);
  document.head.insertBefore(metaCharset, document.head.firstChild);
}
