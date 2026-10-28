const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "popup.html"), "utf8");

test("footer links to blakfy.com in a new tab, safely", () => {
  const footer = html.match(/<footer>([\s\S]*?)<\/footer>/)[1];
  const a = footer.match(/<a\s+([^>]*)>([^<]*)<\/a>/);
  assert.ok(a, "footer has no link");
  assert.match(a[1], /href="https:\/\/blakfy\.com"/);
  assert.match(a[1], /target="_blank"/);
  assert.match(a[1], /rel="noopener noreferrer"/);
  assert.equal(a[2].trim(), "operated by Blakfy Studio");
});
