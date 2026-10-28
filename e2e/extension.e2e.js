// End-to-end test: loads the real extension into Chromium and drives it.
// Run with `npm run test:e2e`. Needs playwright-core and an installed Playwright Chromium.
// The YouTube tests need network; if no Short loads they are reported as skipped.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright-core");

const EXT = path.join(__dirname, "..");

async function launch(locale) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "talitha-e2e-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium", // new headless mode, the only headless mode that runs extensions
    headless: true,
    locale,
    args: [
      `--lang=${locale}`, // browser UI language, which chrome.i18n follows (the locale option only affects pages)
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent("serviceworker");
  const id = new URL(sw.url()).host;
  const close = async () => {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  };
  return { context, sw, id, close };
}

async function until(read, expected, ms = 5000) {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    last = await read();
    if (last === expected) return last;
    await new Promise((r) => setTimeout(r, 100));
  }
  return last;
}

const badge = (sw) => sw.evaluate(() => chrome.action.getBadgeText({}));
const stored = (sw) => sw.evaluate(() => chrome.storage.local.get("enabled").then((r) => r.enabled));

describe("popup, badge and storage (English)", () => {
  let ext;
  before(async () => { ext = await launch("en-US"); });
  after(async () => { await ext.close(); });

  test("manifest name and description come from the English locale", async () => {
    const m = await ext.sw.evaluate(() => chrome.runtime.getManifest());
    assert.equal(m.name, "Talitha – Auto Shorts");
    assert.match(m.description, /next YouTube Short/);
  });

  test("freshly installed: enabled and badge ON", async () => {
    assert.equal(await until(() => stored(ext.sw), true), true);
    assert.equal(await until(() => badge(ext.sw), "ON"), "ON");
  });

  test("popup shows the footer and the English texts", async () => {
    const page = await ext.context.newPage();
    await page.goto(`chrome-extension://${ext.id}/popup.html`);
    assert.equal(await page.textContent("footer a"), "operated by Blakfy Studio");
    assert.equal(await page.getAttribute("footer a", "href"), "https://blakfy.com");
    assert.equal(await page.textContent("h1"), "Talitha Auto Shorts");
    assert.equal(await page.textContent("#state-text"), "On");
    await page.close();
  });

  test("footer link opens blakfy.com in a new tab", { timeout: 60000 }, async (t) => {
    const page = await ext.context.newPage();
    await page.goto(`chrome-extension://${ext.id}/popup.html`);
    const [opened] = await Promise.all([
      ext.context.waitForEvent("page"),
      page.click("footer a"),
    ]);
    try {
      await opened.waitForURL(/^https:\/\/(www\.)?blakfy\.com/, { timeout: 20000, waitUntil: "commit" });
    } catch (e) {
      t.skip(`blakfy.com did not load: ${e.message.split("\n")[0]}`);
    }
    await opened.close();
    await page.close();
  });

  test("popup switch turns it off and on; storage and badge follow", async () => {
    const page = await ext.context.newPage();
    await page.goto(`chrome-extension://${ext.id}/popup.html`);

    await page.click(".track");
    assert.equal(await page.textContent("#state-text"), "Off");
    assert.equal(await until(() => stored(ext.sw), false), false);
    assert.equal(await until(() => badge(ext.sw), "OFF"), "OFF");

    // state survives closing and reopening the popup
    await page.close();
    const again = await ext.context.newPage();
    await again.goto(`chrome-extension://${ext.id}/popup.html`);
    assert.equal(await again.textContent("#state-text"), "Off");
    assert.equal(await again.isChecked("#toggle"), false);

    await again.click(".track");
    assert.equal(await again.textContent("#state-text"), "On");
    assert.equal(await until(() => stored(ext.sw), true), true);
    assert.equal(await until(() => badge(ext.sw), "ON"), "ON");
    await again.close();
  });
});

describe("popup (Turkish)", () => {
  let ext;
  before(async () => { ext = await launch("tr-TR"); });
  after(async () => { await ext.close(); });

  test("popup and manifest description use the Turkish locale", async () => {
    const page = await ext.context.newPage();
    await page.goto(`chrome-extension://${ext.id}/popup.html`);
    assert.equal(await page.textContent("#state-text"), "Açık");
    assert.equal(await page.textContent("p"), "YouTube Shorts Otomatik Kaydırıcı");
    await page.click(".track");
    assert.equal(await page.textContent("#state-text"), "Kapalı");
    await page.close();

    const m = await ext.sw.evaluate(() => chrome.runtime.getManifest());
    assert.equal(m.name, "Talitha – Auto Shorts");
    assert.match(m.description, /bir sonrakine geçer/);
  });
});

describe("content script on real YouTube Shorts", () => {
  let ext;
  before(async () => { ext = await launch("en-US"); });
  after(async () => { await ext.close(); });

  async function openShort(t) {
    const page = await ext.context.newPage();
    try {
      await page.goto("https://www.youtube.com/shorts", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(
        () => {
          const v = document.querySelector("video");
          return v && isFinite(v.duration) && v.duration > 4;
        },
        null,
        { timeout: 30000 }
      );
      return page;
    } catch (e) {
      await page.close();
      t.skip(`YouTube Short did not load: ${e.message.split("\n")[0]}`);
      return null;
    }
  }

  const seekNearEnd = (page) =>
    page.evaluate(() => {
      const v = document.querySelector("video");
      v.currentTime = v.duration - 1.5;
      v.play();
    });

  test("enabled: moves to the next Short when the video ends", { timeout: 90000 }, async (t) => {
    const page = await openShort(t);
    if (!page) return;
    const start = new URL(page.url()).pathname;
    await seekNearEnd(page);
    await page.waitForFunction((s) => location.pathname !== s, start, { timeout: 10000 });
    assert.match(new URL(page.url()).pathname, /^\/shorts\//);
    await page.close();
  });

  test("disabled: stays on the same Short at the end", { timeout: 90000 }, async (t) => {
    const page = await openShort(t);
    if (!page) return;
    await ext.sw.evaluate(() => chrome.storage.local.set({ enabled: false }));
    await new Promise((r) => setTimeout(r, 500));
    const start = new URL(page.url()).pathname;
    await seekNearEnd(page);
    await new Promise((r) => setTimeout(r, 5000));
    assert.equal(new URL(page.url()).pathname, start);
    await ext.sw.evaluate(() => chrome.storage.local.set({ enabled: true }));
    await page.close();
  });
});
