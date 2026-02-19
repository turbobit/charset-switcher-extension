import { getDomainFromUrl } from '../common/utils.js';
import {
  getSiteCharset,
  saveSiteCharset,
  getAllCharsets,
  getSiteCharsetSettings
} from '../common/storage.js';

const ROOT_MENU_ID = 'charset-switcher-main';
const STATUS_MENU_ID = 'charset-current-status';
const CURRENT_MENU_ID = 'charset-current-page-status';
const DNR_RULE_ID_START = 1000;

function msg(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function charsetMenuId(value) {
  return `charset-${value}`;
}

async function createContextMenus() {
  const allCharsets = await getAllCharsets();

  chrome.contextMenus.create({
    id: ROOT_MENU_ID,
    title: msg('menuRoot'),
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: STATUS_MENU_ID,
    parentId: ROOT_MENU_ID,
    title: msg('menuSavedNone'),
    contexts: ['page'],
    enabled: false
  });

  chrome.contextMenus.create({
    id: CURRENT_MENU_ID,
    parentId: ROOT_MENU_ID,
    title: msg('menuCurrentUnknown'),
    contexts: ['page'],
    enabled: false
  });

  allCharsets.forEach((charset) => {
    chrome.contextMenus.create({
      id: charsetMenuId(charset.value),
      parentId: ROOT_MENU_ID,
      title: charset.label,
      type: 'radio',
      contexts: ['page']
    });
  });
}

async function ensureContextMenus() {
  chrome.contextMenus.removeAll(async () => {
    await createContextMenus();
  });
}

function buildCharsetHeaderRules(settings) {
  const entries = Object.entries(settings).filter(
    ([domain, charset]) => Boolean(domain) && Boolean(charset)
  );

  return entries.slice(0, 2000).flatMap(([domain, charset], index) => {
    const baseRule = {
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          {
            header: 'content-type',
            operation: 'set',
            value: `text/html; charset=${charset}`
          }
        ]
      }
    };

    return [
      {
        id: DNR_RULE_ID_START + index * 2,
        ...baseRule,
        condition: {
          requestDomains: [domain],
          resourceTypes: ['main_frame']
        }
      },
      {
        id: DNR_RULE_ID_START + index * 2 + 1,
        ...baseRule,
        condition: {
          initiatorDomains: [domain],
          resourceTypes: ['sub_frame']
        }
      }
    ];
  });
}

async function syncCharsetHeaderRules() {
  const settings = await getSiteCharsetSettings();
  const nextRules = buildCharsetHeaderRules(settings);
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: currentRules.map((rule) => rule.id),
    addRules: nextRules
  });
}

async function updateBadge(tabId, charset) {
  if (!tabId) return;

  if (!charset || typeof charset !== 'string') {
    await clearBadge(tabId);
    return;
  }

  await chrome.action.setBadgeText({
    text: charset.substring(0, 3).toUpperCase(),
    tabId
  });

  await chrome.action.setBadgeBackgroundColor({
    color: '#4CAF50',
    tabId
  });
}

async function clearBadge(tabId) {
  if (!tabId) return;
  await chrome.action.setBadgeText({ text: '', tabId });
}

async function getCurrentFrameCharset(tabId, frameId) {
  if (typeof tabId !== 'number') return 'unknown';
  try {
    const response = await chrome.tabs.sendMessage(
      tabId,
      { type: 'get_current_charset' },
      frameId == null ? {} : { frameId }
    );
    return response?.charset || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function updateContextMenuForTab(tab, frameUrl, frameId) {
  if (!tab?.url && !frameUrl) return;

  const charsetScopeUrl = frameUrl || tab.url;
  const domain = getDomainFromUrl(charsetScopeUrl);
  const savedCharset = domain ? await getSiteCharset(domain) : null;
  const currentCharset = await getCurrentFrameCharset(tab.id, frameId);

  const allCharsets = await getAllCharsets();

  const statusTitle = savedCharset ? msg('menuSavedValue', [savedCharset]) : msg('menuSavedNone');
  const currentTitle = currentCharset
    ? msg('menuCurrentValue', [currentCharset])
    : msg('menuCurrentUnknown');

  chrome.contextMenus.update(STATUS_MENU_ID, { title: statusTitle });
  chrome.contextMenus.update(CURRENT_MENU_ID, { title: currentTitle });

  allCharsets.forEach((charset) => {
    chrome.contextMenus.update(charsetMenuId(charset.value), {
      checked: savedCharset === charset.value
    });
  });
}

if (chrome.contextMenus.onShown) {
  chrome.contextMenus.onShown.addListener(async (info, tab) => {
    await updateContextMenuForTab(tab, info.frameUrl, info.frameId);
    if (chrome.contextMenus.refresh) {
      chrome.contextMenus.refresh();
    }
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId.startsWith('charset-')) return;
  if (!tab?.url) return;

  const charset = info.menuItemId.replace('charset-', '');
  const domain = getDomainFromUrl(tab.url);
  if (!domain) return;

  await saveSiteCharset(domain, charset);
  await syncCharsetHeaderRules();

  chrome.tabs
    .sendMessage(tab.id, {
      type: 'apply_charset',
      charset
    })
    .catch(() => {});

  await chrome.tabs.reload(tab.id);

  await updateBadge(tab.id, charset);
  await updateContextMenuForTab(tab, tab.url, info.frameId);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  const domain = getDomainFromUrl(tab.url);
  if (!domain) {
    await clearBadge(tabId);
    return;
  }

  const charset = await getSiteCharset(domain);
  if (!charset) {
    await clearBadge(tabId);
    return;
  }

  await updateBadge(tabId, charset);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab?.url) return;

  const domain = getDomainFromUrl(tab.url);
  if (!domain) {
    await clearBadge(tabId);
    return;
  }

  const charset = await getSiteCharset(domain);
  if (!charset) {
    await clearBadge(tabId);
    return;
  }

  await updateBadge(tabId, charset);
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.type === 'charset_applied') {
    updateBadge(sender.tab?.id, request.charset);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenus();
  syncCharsetHeaderRules().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenus();
  syncCharsetHeaderRules().catch(() => {});
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.customCharsets) {
    ensureContextMenus();
  }
  if (changes.siteCharsetSettings) {
    syncCharsetHeaderRules().catch(() => {});
  }
});