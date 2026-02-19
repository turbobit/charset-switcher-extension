import { getDomainFromUrl } from '../common/utils.js';
import {
  getSiteCharset,
  saveSiteCharset,
  removeSiteCharset,
  getAllCharsets
} from '../common/storage.js';

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
  charsetSelectEl.innerHTML = '<option value="">?좏깮?섏꽭??/option>';
  charsets.forEach((charset) => {
    const option = document.createElement('option');
    option.value = charset.value;
    option.textContent = charset.label;
    charsetSelectEl.appendChild(option);
  });
}

async function getDetectedCharsetFromTab(tabId) {
  if (!tabId) return '?뺤씤 遺덇?';
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'get_current_charset' });
    return response?.charset || 'unknown';
  } catch {
    return '?뺤씤 遺덇?';
  }
}

async function loadCurrentDomainInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  currentTabId = tab.id;
  currentDomain = getDomainFromUrl(tab.url);

  if (!currentDomain) {
    domainNameEl.textContent = '吏?먮릺吏 ?딅뒗 ?섏씠吏';
    savedCharsetEl.textContent = '?놁쓬';
    detectedCharsetEl.textContent = '?뺤씤 遺덇?';
    return;
  }

  domainNameEl.textContent = currentDomain;

  const savedCharset = await getSiteCharset(currentDomain);
  savedCharsetEl.textContent = savedCharset || '?놁쓬';
  charsetSelectEl.value = savedCharset || '';

  const detectedCharset = await getDetectedCharsetFromTab(currentTabId);
  detectedCharsetEl.textContent = detectedCharset;
}

applyBtn.addEventListener('click', async () => {
  const selectedCharset = charsetSelectEl.value;

  if (!selectedCharset) {
    showMessage('?몄퐫?⑹쓣 ?좏깮?섏꽭??', 'error');
    return;
  }

  if (!currentDomain) {
    showMessage('?꾩옱 ?꾨찓?몄쓣 ?뺤씤?????놁뒿?덈떎.', 'error');
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
    showMessage(`${selectedCharset}濡???ν븯怨??곸슜?덉뒿?덈떎.`);
  } catch (error) {
    showMessage(`?ㅻ쪟: ${error.message}`, 'error');
  }
});

removeBtn.addEventListener('click', async () => {
  if (!currentDomain) {
    showMessage('?꾩옱 ?꾨찓?몄쓣 ?뺤씤?????놁뒿?덈떎.', 'error');
    return;
  }

  try {
    await removeSiteCharset(currentDomain);
    if (currentTabId) {
      await chrome.tabs.reload(currentTabId);
    }
    savedCharsetEl.textContent = '?놁쓬';
    charsetSelectEl.value = '';
    showMessage('??λ맂 ?몄퐫???ㅼ젙???쒓굅?덉뒿?덈떎.');
  } catch (error) {
    showMessage(`?ㅻ쪟: ${error.message}`, 'error');
  }
});

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadCharsets();
  await loadCurrentDomainInfo();
});

