function paintBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#1a9c3c" : "#888888" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.storage.local.set({ enabled });
  paintBadge(enabled);
});

chrome.runtime.onStartup.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  paintBadge(enabled);
});

// The popup switch writes "enabled"; the badge follows the stored value
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) paintBadge(changes.enabled.newValue);
});
