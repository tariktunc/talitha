importScripts("logic.js");

async function isEnabled() {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  return enabled;
}

async function paintTab(tab, enabled) {
  if (tab.id == null) return;
  // tab.url is only readable for www.youtube.com (host permission); elsewhere it is undefined
  const b = TalithaLogic.badgeFor(enabled, tab.url);
  await chrome.action.setBadgeText({ tabId: tab.id, text: b.text });
  await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: b.color });
}

async function paintAll() {
  const enabled = await isEnabled();
  // default for tabs that have no tab-specific badge yet: grey OFF
  const d = TalithaLogic.badgeFor(enabled, undefined);
  await chrome.action.setBadgeText({ text: d.text });
  await chrome.action.setBadgeBackgroundColor({ color: d.color });
  for (const tab of await chrome.tabs.query({})) await paintTab(tab, enabled);
}

chrome.runtime.onInstalled.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.storage.local.set({ enabled });
  await paintAll();
});

chrome.runtime.onStartup.addListener(paintAll);

// The popup switch writes "enabled"; every tab's badge follows
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) paintAll();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  paintTab(await chrome.tabs.get(tabId), await isEnabled());
});

// Tab-specific badges reset on navigation, so paint again when the url or load state changes
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.url || info.status) paintTab(tab, await isEnabled());
});
