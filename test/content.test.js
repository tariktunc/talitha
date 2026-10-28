// Runs the real content.js against a fake page, to check the glue between the page and logic.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");

async function runContentScript({ visibility = "visible", pathname = "/shorts/abc", enabled = true }) {
  const clicks = [];
  const video = {
    currentTime: 124.4, // 0.12 s before the end
    duration: 124.521,
    ended: false,
    currentSrc: "blob:a",
    loop: true,
    getBoundingClientRect: () => ({ left: 700, right: 1300, top: 50, bottom: 1050, width: 600 }),
  };
  let poll;
  const context = {
    TalithaLogic: require("../logic.js"),
    chrome: {
      storage: {
        local: { get: async () => ({ enabled }) },
        onChanged: { addListener() {} },
      },
    },
    window: { innerWidth: 1920, innerHeight: 1080 },
    location: { pathname },
    document: {
      visibilityState: visibility,
      querySelectorAll: () => [video],
      querySelector: (sel) => (sel === "#navigation-button-down button" ? { click: () => clicks.push(sel) } : null),
      dispatchEvent() {},
    },
    setInterval: (fn) => { poll = fn; },
    KeyboardEvent: class {},
    Date,
    isFinite,
  };
  vm.runInNewContext(source, context);
  await new Promise((r) => setImmediate(r)); // let the storage read resolve
  poll();
  return { clicks, video };
}

test("visible Shorts tab at the end: clicks 'next' and turns loop off", async () => {
  const { clicks, video } = await runContentScript({});
  assert.equal(clicks.length, 1);
  assert.equal(video.loop, false);
});

test("hidden (background) tab: does not click", async () => {
  const { clicks } = await runContentScript({ visibility: "hidden" });
  assert.equal(clicks.length, 0);
});

test("outside /shorts/: does not click", async () => {
  const { clicks } = await runContentScript({ pathname: "/watch" });
  assert.equal(clicks.length, 0);
});

test("switched off: does not click", async () => {
  const { clicks } = await runContentScript({ enabled: false });
  assert.equal(clicks.length, 0);
});
