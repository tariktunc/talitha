// Needs logic.js loaded first (see manifest content_scripts order).
let enabled = true;
const state = TalithaLogic.newState();

chrome.storage.local.get("enabled").then(({ enabled: v = true }) => {
  enabled = v;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) enabled = changes.enabled.newValue;
});

// The renderer carries no "is-active" marker in the current YouTube layout,
// so the active Shorts video is the one covering the viewport centre.
function activeVideo() {
  const videos = [...document.querySelectorAll("video")];
  const boxes = videos.map((v) => v.getBoundingClientRect());
  const i = TalithaLogic.pickActive(boxes, window.innerWidth, window.innerHeight);
  return i === -1 ? null : videos[i];
}

function goNext() {
  const btn = document.querySelector("#navigation-button-down button");
  if (btn) {
    btn.click();
    return;
  }
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", keyCode: 40, bubbles: true })
  );
}

setInterval(() => {
  if (!enabled || !location.pathname.startsWith("/shorts/")) return;
  const v = activeVideo();
  if (!v) return;

  // YouTube keeps re-enabling loop; switch it off each tick
  if (v.loop) v.loop = false;

  const snapshot = {
    currentTime: v.currentTime,
    duration: v.duration,
    ended: v.ended,
    src: v.currentSrc,
  };
  if (TalithaLogic.tick(state, snapshot, Date.now())) goNext();
}, 250);
