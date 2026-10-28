const toggle = document.getElementById("toggle");
const stateText = document.getElementById("state-text");

const t = (key) => chrome.i18n.getMessage(key);

document.documentElement.lang = chrome.i18n.getUILanguage();
document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

function render(enabled) {
  toggle.checked = enabled;
  stateText.textContent = t(enabled ? "stateOn" : "stateOff");
  document.body.classList.toggle("off", !enabled);
}

chrome.storage.local.get("enabled").then(({ enabled = true }) => render(enabled));

// background.js repaints the badge from the storage change
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
  render(toggle.checked);
});
