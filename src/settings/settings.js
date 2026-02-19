import { DEFAULT_CHARSETS } from '../common/constants.js';
import {
  getAllCharsets,
  getCustomCharsets,
  addCustomCharset,
  removeCustomCharset,
  getSiteCharsetSettings,
  removeSiteCharset,
  getDefaultCharset,
  setDefaultCharset
} from '../common/storage.js';

const charsetValueInput = document.getElementById('charsetValue');
const charsetLabelInput = document.getElementById('charsetLabel');
const addBtn = document.getElementById('addBtn');
const defaultCharsetSelect = document.getElementById('defaultCharset');
const defaultCharsetList = document.getElementById('defaultCharsetList');
const customCharsetList = document.getElementById('customCharsetList');
const siteList = document.getElementById('siteList');
const messageEl = document.getElementById('message');

// 메시지 표시
function showMessage(message, type = 'success') {
  messageEl.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    messageEl.innerHTML = '';
  }, 3000);
}

// 기본 인코딩 목록 표시
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

// 사용자 정의 인코딩 목록 표시
async function displayCustomCharsets() {
  customCharsetList.innerHTML = '';
  const customCharsets = await getCustomCharsets();

  if (customCharsets.length === 0) {
    customCharsetList.innerHTML = '<li style="color: #999; padding: 10px; text-align: center;">추가된 사용자 정의 인코딩이 없습니다.</li>';
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
      <button class="btn btn-danger" data-value="${charset.value}">삭제</button>
    `;
    customCharsetList.appendChild(li);

    li.querySelector('button').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await removeCustomCharset(charset.value);
        showMessage(`${charset.value}가 삭제되었습니다`);
        await displayCustomCharsets();
      } catch (error) {
        showMessage(`오류: ${error.message}`, 'error');
      }
    });
  });
}

// 사이트별 설정 표시
async function displaySiteSettings() {
  siteList.innerHTML = '';
  const siteSettings = await getSiteCharsetSettings();
  const entries = Object.entries(siteSettings);

  if (entries.length === 0) {
    siteList.innerHTML = '<li style="color: #999; padding: 10px; text-align: center;">설정된 도메인이 없습니다.</li>';
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
      <button class="btn btn-danger" data-domain="${domain}">제거</button>
    `;
    siteList.appendChild(li);

    li.querySelector('button').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await removeSiteCharset(domain);
        showMessage(`${domain} 설정이 제거되었습니다`);
        await displaySiteSettings();
      } catch (error) {
        showMessage(`오류: ${error.message}`, 'error');
      }
    });
  });
}

// 사용자 정의 인코딩 추가
addBtn.addEventListener('click', async () => {
  const value = charsetValueInput.value.trim().toUpperCase();
  const label = charsetLabelInput.value.trim();

  if (!value) {
    showMessage('인코딩 값을 입력하세요', 'error');
    return;
  }

  if (!label) {
    showMessage('표시 이름을 입력하세요', 'error');
    return;
  }

  try {
    // 기본 인코딩과 중복 확인
    if (DEFAULT_CHARSETS.some(c => c.value === value)) {
      showMessage('이미 존재하는 기본 인코딩입니다', 'error');
      return;
    }

    await addCustomCharset({ value, label });
    charsetValueInput.value = '';
    charsetLabelInput.value = '';
    showMessage(`${value}가 추가되었습니다`);
    await displayCustomCharsets();
  } catch (error) {
    showMessage(`오류: ${error.message}`, 'error');
  }
});

// 엔터 키로도 추가 가능
charsetLabelInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addBtn.click();
  }
});

// 기본 인코딩 선택 변경
defaultCharsetSelect.addEventListener('change', async (e) => {
  try {
    await setDefaultCharset(e.target.value);
    showMessage('기본 인코딩이 변경되었습니다');
  } catch (error) {
    showMessage(`오류: ${error.message}`, 'error');
  }
});

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 기본 인코딩 선택 초기화
  const defaultCharset = await getDefaultCharset();
  defaultCharsetSelect.value = defaultCharset;

  // 목록 표시
  displayDefaultCharsets();
  await displayCustomCharsets();
  await displaySiteSettings();

  // 저장소 변경 감시
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.customCharsets) {
      displayCustomCharsets();
    }
    if (changes.siteCharsetSettings) {
      displaySiteSettings();
    }
  });
});
