function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function setCharset(charset) {
  const existingCharset = document.querySelector('meta[charset]');
  if (existingCharset) {
    existingCharset.remove();
  }

  if (!charset) {
    return;
  }

  const metaCharset = document.createElement('meta');
  metaCharset.setAttribute('charset', charset);

  const head = document.head || document.documentElement;
  if (!head) return;

  const firstChild = head.firstChild || null;
  if (firstChild) {
    head.insertBefore(metaCharset, firstChild);
  } else {
    head.appendChild(metaCharset);
  }
}

async function syncCurrentSiteCharset() {
  const domain = getDomainFromUrl(window.location.href);
  if (!domain) {
    return;
  }

  const charset = await getSiteCharset(domain);
  setCharset(charset);
}

async function getSiteCharset(domain) {
  const result = await chrome.storage.sync.get('siteCharsetSettings');
  const settings = result.siteCharsetSettings || {};
  return settings[domain];
}

async function applyCharsetForCurrentSite() {
  const domain = getDomainFromUrl(window.location.href);
  if (!domain) return;

  const charset = await getSiteCharset(domain);
  setCharset(charset);

  chrome.runtime
    .sendMessage({
      type: 'charset_applied',
      domain,
      charset
    })
    .catch(() => {});
}

applyCharsetForCurrentSite();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  if (changes.siteCharsetSettings) {
    syncCurrentSiteCharset();
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'apply_charset') {
    setCharset(request.charset);
    sendResponse({ success: true });
    return;
  }

  if (request.type === 'get_current_charset') {
    const currentCharset =
      document.querySelector('meta[charset]')?.getAttribute('charset') || 'unknown';
    sendResponse({ charset: currentCharset });
  }
});
