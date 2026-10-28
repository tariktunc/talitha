const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(read("manifest.json"));
const localeNames = fs.readdirSync(path.join(root, "_locales"));
const locales = Object.fromEntries(
  localeNames.map((n) => [n, JSON.parse(read(`_locales/${n}/messages.json`))])
);

test("default_locale exists in _locales", () => {
  assert.ok(localeNames.includes(manifest.default_locale));
});

test("every locale has the same keys as the default locale", () => {
  const base = Object.keys(locales[manifest.default_locale]).sort();
  for (const [name, msgs] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(msgs).sort(), base, `keys differ in ${name}`);
  }
});

test("every message is a non-empty string", () => {
  for (const [name, msgs] of Object.entries(locales)) {
    for (const [key, v] of Object.entries(msgs)) {
      assert.equal(typeof v.message, "string", `${name}/${key}`);
      assert.ok(v.message.trim().length > 0, `${name}/${key} is empty`);
    }
  }
});

test("every __MSG_x__ in manifest.json has a message", () => {
  const keys = [...read("manifest.json").matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
  assert.ok(keys.length > 0);
  for (const name of localeNames) {
    for (const k of keys) assert.ok(locales[name][k], `${name} is missing ${k}`);
  }
});

test("every data-i18n key in popup.html and every t() key in popup.js has a message", () => {
  const keys = [
    ...[...read("popup.html").matchAll(/data-i18n="(\w+)"/g)].map((m) => m[1]),
    ...[...read("popup.js").matchAll(/"(state\w+)"/g)].map((m) => m[1]),
  ];
  assert.ok(keys.length > 0);
  for (const name of localeNames) {
    for (const k of keys) assert.ok(locales[name][k], `${name} is missing ${k}`);
  }
});

test("Chrome Web Store limits: name <= 45, description <= 132 characters", () => {
  for (const [name, msgs] of Object.entries(locales)) {
    assert.ok(msgs.extName.message.length <= 45, `${name} name too long`);
    assert.ok(msgs.extDescription.message.length <= 132, `${name} description too long`);
  }
});
