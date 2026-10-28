const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("manifest icons are real PNGs of the declared size", () => {
  const entries = Object.entries(manifest.icons);
  assert.deepEqual(entries.map(([size]) => size).sort(), ["128", "16", "48"]);
  for (const [size, file] of entries) {
    const buf = fs.readFileSync(path.join(root, file));
    assert.ok(buf.subarray(0, 8).equals(PNG_SIGNATURE), `${file} is not a PNG`);
    assert.equal(buf.readUInt32BE(16), Number(size), `${file} width`);
    assert.equal(buf.readUInt32BE(20), Number(size), `${file} height`);
  }
});

test("toolbar action uses the same icon files", () => {
  assert.deepEqual(manifest.action.default_icon, manifest.icons);
});

test("icon.svg source exists", () => {
  assert.match(fs.readFileSync(path.join(root, "icons", "icon.svg"), "utf8"), /<svg/);
});
