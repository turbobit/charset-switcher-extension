import { getDomainFromUrl } from '../common/utils.js';
import {
  getSiteCharset,
  saveSiteCharset,
  getAllCharsets,
  getSiteCharsetSettings,
  getEnabledDomains,
  addEnabledDomain,
  removeEnabledDomain,
  isDomainEnabled
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

async function ensureContentScript(tabId) {
  if (typeof tabId !== 'number') return false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/content.js']
    });
    return true;
  } catch (error) {
    console.error('Failed to inject content script', error);
    return false;
  }
}

async function applyCharsetToTab(tabId, domain) {
  if (typeof tabId !== 'number' || !domain) return;
  const charset = await getSiteCharset(domain);
  if (!charset) return;
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'apply_charset',
      charset
    });
  } catch {
    // ignore if content script is not ready
  }
}

async function updateBadgeForTab(tabId) {
  if (typeof tabId !== 'number') return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) {
      await clearBadge(tabId);
      return;
    }

    const domain = getDomainFromUrl(tab.url);
    if (!domain) {
      await clearBadge(tabId);
      return;
    }

    const enabled = await isDomainEnabled(domain);
    if (!enabled) {
      await chrome.action.setBadgeText({ text: 'ADD', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#9E9E9E', tabId });
      return;
    }

    const charset = await getSiteCharset(domain);
    if (!charset) {
      await chrome.action.setBadgeText({ text: 'ON', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#2196F3', tabId });
      return;
    }

    await updateBadge(tabId, charset);
  } catch {
    await clearBadge(tabId);
  }
}

function getDomainOrigins(domain) {
  if (!domain) return [];
  return [`https://${domain}/*`, `http://${domain}/*`];
}

function getContentScriptId(domain) {
  return `charset-switcher-${domain}`;
}

function containsPermissions(permissions) {
  return new Promise((resolve) => {
    chrome.permissions.contains(permissions, resolve);
  });
}

function requestPermissions(permissions) {
  return new Promise((resolve) => {
    chrome.permissions.request(permissions, resolve);
  });
}

async function ensureSitePermissions(domain) {
  const origins = getDomainOrigins(domain);
  if (!origins.length) return false;
  const alreadyGranted = await containsPermissions({ origins });
  if (alreadyGranted) return true;
  return requestPermissions({ origins });
}

async function registerContentScriptForDomain(domain) {
  if (!domain) return;
  const scriptId = getContentScriptId(domain);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
  } catch {
    //
  }

  try {
    await chrome.scripting.registerContentScripts([
      {
        id: scriptId,
        js: ['src/content/content.js'],
        matches: getDomainOrigins(domain),
          allFrames: true,
          matchAboutBlank: true,
        runAt: 'document_start',
        world: 'MAIN',
        persistAcrossSessions: true
      }
    ]);
  } catch (error) {
    console.error('Failed to register content script', error, domain);
  }
}

async function unregisterContentScriptForDomain(domain) {
  if (!domain) return;
  const scriptId = getContentScriptId(domain);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
  } catch {
    //
  }
}

async function ensureDomainEnabled(tabId, domain) {
  if (!domain) return false;
  const enabled = await isDomainEnabled(domain);
  if (enabled) {
    await ensureContentScript(tabId);
    return true;
  }

  const permissionGranted = await ensureSitePermissions(domain);
  if (!permissionGranted) {
    return false;
  }

  await registerContentScriptForDomain(domain);
  await addEnabledDomain(domain);
  await ensureContentScript(tabId);
  await applyCharsetToTab(tabId, domain);
  return true;
}

async function disableDomain(domain) {
  if (!domain) return;
  await unregisterContentScriptForDomain(domain);
  await removeEnabledDomain(domain);
}

async function ensureScriptsForStoredDomains() {
  const domains = await getEnabledDomains();
  await Promise.all(
    domains.map(async (domain) => {
      const granted = await containsPermissions({ origins: getDomainOrigins(domain) });
      if (!granted) return;
      await registerContentScriptForDomain(domain);
    })
  );
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
    const targetUrl = info.frameUrl || tab?.url;
    const domain = getDomainFromUrl(targetUrl);
    if (domain && tab?.id) {
      const enabled = await isDomainEnabled(domain);
      if (enabled) {
        await ensureContentScript(tab.id);
      }
    }
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

  const enabled = await ensureDomainEnabled(tab.id, domain);
  if (!enabled) return;
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

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url) return;
  const domain = getDomainFromUrl(tab.url);
  if (!domain) {
    await clearBadge(tab.id);
    return;
  }

  const enabled = await isDomainEnabled(domain);
  if (enabled) {
    await disableDomain(domain);
    await updateBadgeForTab(tab.id);
    return;
  }

  const granted = await ensureDomainEnabled(tab.id, domain);
  await updateBadgeForTab(tab.id);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await updateBadgeForTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'loading') return;
  await updateBadgeForTab(tabId);
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.type === 'charset_applied') {
    const tabId = sender.tab?.id;
    if (typeof tabId === 'number') {
      updateBadgeForTab(tabId).catch(() => {});
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenus();
  syncCharsetHeaderRules().catch(() => {});
  ensureScriptsForStoredDomains().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenus();
  syncCharsetHeaderRules().catch(() => {});
  ensureScriptsForStoredDomains().catch(() => {});
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.customCharsets) {
    ensureContextMenus();
  }
  if (changes.siteCharsetSettings) {
    syncCharsetHeaderRules().catch(() => {});
  }
});