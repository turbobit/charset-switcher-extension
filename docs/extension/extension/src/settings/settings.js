import { DEFAULT_CHARSETS } from '../common/constants.js';
import {
  getCustomCharsets,
  addCustomCharset,
  removeCustomCharset,
  getSiteCharsetSettings,
  removeSiteCharset,
  getDefaultCharset,
  setDefaultCharset
} from '../common/storage.js';
import { applyI18n, t } from '../common/i18n.js';

const charsetValueInput = document.getElementById('charsetValue');
const charsetLabelInput = document.getElementById('charsetLabel');
const addBtn = document.getElementById('addBtn');
const defaultCharsetSelect = document.getElementById('defaultCharset');
const defaultCharsetList = document.getElementById('defaultCharsetList');
const customCharsetList = document.getElementById('customCharsetList');
const siteList = document.getElementById('siteList');
const messageEl = document.getElementById('message');

function showMessage(message, type = 'success') {
  messageEl.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    messageEl.innerHTML = '';
  }, 3000);
}

function displayDefaultCharsets() {
  defaultCharsetList.innerHTML = '';
  DEFAULT_CHARSETS.forEach((charset) => {
    const li = document.createElement('li');
    li.className = 'charset-item';
    li.innerHTML = `
      <div class="charset-item-info">
        <div class="charset-item-value">${charset.value}</div>
        <div class="charset-item-label">${charset.label}</div>
      </div>
    `;
    defaultCharsetList.appendChild(li);
  });
}

async function displayCustomCharsets() {
  customCharsetList.innerHTML = '';
  const customCharsets = await getCustomCharsets();

  if (customCharsets.length === 0) {
    customCharsetList.innerHTML = `<li style="color:#999;padding:10px;text-align:center;">${t('settingsNoCustomCharsets')}</li>`;
    return;
  }

  customCharsets.forEach((charset) => {
    const li = document.createElement('li');
    li.className = 'charset-item custom';
    li.innerHTML = `
      <div class="charset-item-info">
        <div class="charset-item-value">${charset.value}</div>
        <div class="charset-item-label">${charset.label}</div>
      </div>
      <button class="btn btn-danger" data-value="${charset.value}">${t('btnRemove')}</button>
    `;

    li.querySelector('button').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await removeCustomCharset(charset.value);
        showMessage(t('settingsCustomRemoved', [charset.value]));
        await displayCustomCharsets();
      } catch (error) {
        showMessage(t('popupError', [error.message]), 'error');
      }
    });

    customCharsetList.appendChild(li);
  });
}

async function displaySiteSettings() {
  siteList.innerHTML = '';
  const siteSettings = await getSiteCharsetSettings();
  const entries = Object.entries(siteSettings);

  if (entries.length === 0) {
    siteList.innerHTML = `<li style="color:#999;padding:10px;text-align:center;">${t('settingsNoSiteSettings')}</li>`;
    return;
  }

  entries.forEach(([domain, charset]) => {
    const li = document.createElement('li');
    li.className = 'charset-item';
    li.innerHTML = `
      <div class="charset-item-info">
        <div class="charset-item-value">${domain}</div>
        <div class="charset-item-label">${charset}</div>
      </div>
      <button class="btn btn-danger" data-domain="${domain}">${t('btnRemove')}</button>
    `;

    li.querySelector('button').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await removeSiteCharset(domain);
        showMessage(t('settingsSiteRemoved', [domain]));
        await displaySiteSettings();
      } catch (error) {
        showMessage(t('popupError', [error.message]), 'error');
      }
    });

    siteList.appendChild(li);
  });
}

addBtn.addEventListener('click', async () => {
  const value = charsetValueInput.value.trim().toUpperCase();
  const label = charsetLabelInput.value.trim();

  if (!value) {
    showMessage(t('settingsValueRequired'), 'error');
    return;
  }

  if (!label) {
    showMessage(t('settingsLabelRequired'), 'error');
    return;
  }

  if (DEFAULT_CHARSETS.some((c) => c.value === value)) {
    showMessage(t('settingsDuplicateBuiltIn'), 'error');
    return;
  }

  try {
    await addCustomCharset({ value, label });
    charsetValueInput.value = '';
    charsetLabelInput.value = '';
    showMessage(t('settingsCustomAdded', [value]));
    await displayCustomCharsets();
  } catch (error) {
    showMessage(t('popupError', [error.message]), 'error');
  }
});

charsetLabelInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addBtn.click();
  }
});

defaultCharsetSelect.addEventListener('change', async (e) => {
  try {
    await setDefaultCharset(e.target.value);
    showMessage(t('settingsDefaultUpdated'));
  } catch (error) {
    showMessage(t('popupError', [error.message]), 'error');
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();
  document.title = t('settingsTitle');

  const defaultCharset = await getDefaultCharset();
  defaultCharsetSelect.value = defaultCharset;

  displayDefaultCharsets();
  await displayCustomCharsets();
  await displaySiteSettings();

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.customCharsets) {
      displayCustomCharsets();
    }
    if (changes.siteCharsetSettings) {
      displaySiteSettings();
    }
  });
});