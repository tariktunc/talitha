// Pure decision logic for Talitha. No DOM or chrome.* access, so Node can test it.
const TalithaLogic = {
  NEAR_END_SECONDS: 0.35,
  // Wider than a 1 s poll, so a throttled background tab still catches the wrap
  WRAP_WINDOW_SECONDS: 1.2,
  DEBOUNCE_MS: 1500,

  newState() {
    return { lastTime: 0, src: "", advancedAt: -Infinity };
  },

  // Index of the box covering the viewport centre, or -1.
  pickActive(boxes, vw, vh) {
    const cx = vw / 2;
    const cy = vh / 2;
    return boxes.findIndex(
      (r) => r.width > 0 && r.left <= cx && r.right >= cx && r.top <= cy && r.bottom >= cy
    );
  },

  // The content script only runs on www.youtube.com, so that is the only host that counts.
  isYouTube(url) {
    return typeof url === "string" && url.startsWith("https://www.youtube.com/");
  },

  // Toolbar badge for one tab: green ON only on YouTube while enabled, otherwise grey OFF.
  badgeFor(enabled, url) {
    const on = enabled && this.isYouTube(url);
    return { text: on ? "ON" : "OFF", color: on ? "#1a9c3c" : "#888888" };
  },

  // One poll tick. Returns true when the page should advance to the next Short.
  // v = { currentTime, duration, ended, src, visible }  (visible: false = background tab)
  tick(state, v, now) {
    if (!isFinite(v.duration) || v.duration === 0) return false;

    if (v.src !== state.src) {
      state.src = v.src;
      state.lastTime = 0;
    }

    // YouTube re-enables loop and wraps to 0 without firing "ended", so advance
    // just before the end; ended / wrap-around stay as a fallback.
    const nearEnd = v.currentTime > 0.5 && v.duration - v.currentTime < this.NEAR_END_SECONDS;
    const wrapped =
      state.lastTime > v.duration - this.WRAP_WINDOW_SECONDS && v.currentTime < state.lastTime - 1;
    state.lastTime = v.currentTime;

    // Background tab: keep tracking the time (so coming back is no false wrap), never advance
    if (v.visible === false) return false;

    if (!(nearEnd || v.ended || wrapped)) return false;
    if (now - state.advancedAt < this.DEBOUNCE_MS) return false;
    state.advancedAt = now;
    return true;
  },
};

if (typeof module !== "undefined") module.exports = TalithaLogic;
