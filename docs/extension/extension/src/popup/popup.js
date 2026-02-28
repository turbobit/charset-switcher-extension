import { getDomainFromUrl } from '../common/utils.js';
import { getSiteCharset, saveSiteCharset, removeSiteCharset, getAllCharsets } from '../common/storage.js';
import { applyI18n, t } from '../common/i18n.js';

const domainNameEl = document.getElementById('domainName');
const savedCharsetEl = document.getElementById('savedCharset');
const detectedCharsetEl = document.getElementById('detectedCharset');
const charsetSelectEl = document.getElementById('charsetSelect');
const applyBtn = document.getElementById('applyBtn');
const removeBtn = document.getElementById('removeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const messageEl = document.getElementById('message');

let currentDomain = null;
let currentTabId = null;

function showMessage(message, type = 'success') {
  messageEl.innerHTML = `<div class="${type}">${message}</div>`;
  setTimeout(() => {
    messageEl.innerHTML = '';
  }, 2500);
}

async function loadCharsets() {
  const charsets = await getAllCharsets();
  charsetSelectEl.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = t('popupSelectCharset');
  charsetSelectEl.appendChild(placeholder);

  charsets.forEach((charset) => {
    const option = document.createElement('option');
    option.value = charset.value;
    option.textContent = charset.label;
    charsetSelectEl.appendChild(option);
  });
}

async function getDetectedCharsetFromTab(tabId) {
  if (!tabId) return t('popupUnknown');
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'get_current_charset' });
    return response?.charset || t('popupUnknown');
  } catch {
    return t('popupUnknown');
  }
}

async function loadCurrentDomainInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  currentTabId = tab.id;
  currentDomain = getDomainFromUrl(tab.url);

  if (!currentDomain) {
    domainNameEl.textContent = t('popupUnsupportedPage');
    savedCharsetEl.textContent = t('popupNone');
    detectedCharsetEl.textContent = t('popupUnknown');
    return;
  }

  domainNameEl.textContent = currentDomain;

  const savedCharset = await getSiteCharset(currentDomain);
  savedCharsetEl.textContent = savedCharset || t('popupNone');
  charsetSelectEl.value = savedCharset || '';

  const detectedCharset = await getDetectedCharsetFromTab(currentTabId);
  detectedCharsetEl.textContent = detectedCharset;
}

applyBtn.addEventListener('click', async () => {
  const selectedCharset = charsetSelectEl.value;

  if (!selectedCharset) {
    showMessage(t('popupSelectCharsetError'), 'error');
    return;
  }

  if (!currentDomain) {
    showMessage(t('popupDomainError'), 'error');
    return;
  }

  try {
    await saveSiteCharset(currentDomain, selectedCharset);

    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, {
        type: 'apply_charset',
        charset: selectedCharset
      }).catch(() => {});
      await chrome.tabs.reload(currentTabId);
    }

    savedCharsetEl.textContent = selectedCharset;
    detectedCharsetEl.textContent = selectedCharset;
    showMessage(t('popupApplied', [selectedCharset]));
  } catch (error) {
    showMessage(t('popupError', [error.message]), 'error');
  }
});

removeBtn.addEventListener('click', async () => {
  if (!currentDomain) {
    showMessage(t('popupDomainError'), 'error');
    return;
  }

  try {
    await removeSiteCharset(currentDomain);
    if (currentTabId) {
      await chrome.tabs.reload(currentTabId);
    }
    savedCharsetEl.textContent = t('popupNone');
    charsetSelectEl.value = '';
    showMessage(t('popupRemoved'));
  } catch (error) {
    showMessage(t('popupError', [error.message]), 'error');
  }
});

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();
  document.title = t('popupTitle');
  await loadCharsets();
  await loadCurrentDomainInfo();
});