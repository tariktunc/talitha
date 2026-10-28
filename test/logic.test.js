const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logic.js");

const box = (left, top, width, height) => ({
  left, top, width, height, right: left + width, bottom: top + height,
});
const vid = (over) => ({ currentTime: 10, duration: 30, ended: false, src: "a", ...over });

test("pickActive: video covering the viewport centre wins", () => {
  const boxes = [box(0, -1000, 500, 900), box(700, 64, 554, 984), box(0, 1100, 500, 900)];
  assert.equal(L.pickActive(boxes, 1920, 1080), 1);
});

test("pickActive: no video at the centre returns -1", () => {
  assert.equal(L.pickActive([box(0, 0, 100, 100)], 1920, 1080), -1);
  assert.equal(L.pickActive([], 1920, 1080), -1);
});

test("pickActive: zero-width (hidden) video is ignored", () => {
  assert.equal(L.pickActive([box(960, 540, 0, 0)], 1920, 1080), -1);
});

test("tick: mid-video does not advance", () => {
  assert.equal(L.tick(L.newState(), vid({ currentTime: 12 }), 0), false);
});

test("tick: invalid duration (NaN, 0, Infinity) does not advance", () => {
  for (const duration of [NaN, 0, Infinity]) {
    assert.equal(L.tick(L.newState(), vid({ duration, currentTime: 1 }), 0), false);
  }
});

test("tick: near the end advances", () => {
  assert.equal(L.tick(L.newState(), vid({ duration: 124.521, currentTime: 124.3 }), 0), true);
});

test("tick: 0.5 s before the end does not advance yet", () => {
  assert.equal(L.tick(L.newState(), vid({ duration: 124.521, currentTime: 124.0 }), 0), false);
});

test("tick: very start of a video never counts as near-end", () => {
  assert.equal(L.tick(L.newState(), vid({ duration: 0.4, currentTime: 0.2 }), 0), false);
});

test("tick: ended flag advances", () => {
  assert.equal(L.tick(L.newState(), vid({ ended: true }), 0), true);
});

test("tick: wrap-around to the start after the end advances", () => {
  const s = L.newState();
  s.src = "a";
  s.lastTime = 29.8;
  assert.equal(L.tick(s, vid({ currentTime: 0.2 }), 0), true);
});

test("tick: user seeking back mid-video does not advance", () => {
  const s = L.newState();
  s.src = "a";
  s.lastTime = 20;
  assert.equal(L.tick(s, vid({ currentTime: 3 }), 0), false);
});

test("tick: debounce allows one advance per 1.5 s", () => {
  const s = L.newState();
  const end = vid({ currentTime: 29.9 });
  assert.equal(L.tick(s, end, 1000), true);
  assert.equal(L.tick(s, end, 1250), false);
  assert.equal(L.tick(s, end, 2499), false);
  assert.equal(L.tick(s, end, 2500), true);
});

test("tick: a new video resets lastTime, so no false wrap on the new src", () => {
  const s = L.newState();
  s.src = "a";
  s.lastTime = 29.9;
  assert.equal(L.tick(s, vid({ src: "b", currentTime: 0.1 }), 0), false);
});

// Replays a playing, looping video (the shape measured on the live page):
// plays to `duration`, wraps to 0 with no "ended" event, keeps going.
// Polls every `pollMs` from `phase` ms; returns the video time of the first advance.
function firstAdvanceTime(duration, pollMs, phase) {
  const s = L.newState();
  const startAt = duration - 3; // video time at wall-clock 0
  for (let wall = phase; wall < 8000; wall += pollMs) {
    const t = startAt + wall / 1000;
    const currentTime = t <= duration ? t : t - duration; // wrapped
    const wrappedAlready = t > duration;
    if (L.tick(s, vid({ duration, currentTime, ended: false }), wall)) {
      return { wrappedAlready };
    }
  }
  return null;
}

test("loop replay, 250 ms polling: always advances before the wrap", () => {
  for (let phase = 0; phase < 250; phase += 10) {
    const r = firstAdvanceTime(124.521, 250, phase);
    assert.ok(r, `no advance at phase ${phase}`);
    assert.equal(r.wrappedAlready, false, `advanced only after wrap at phase ${phase}`);
  }
});

test("loop replay, 1000 ms polling (throttled background tab): still advances", () => {
  for (let phase = 0; phase < 1000; phase += 25) {
    const r = firstAdvanceTime(124.521, 1000, phase);
    assert.ok(r, `missed the end at phase ${phase}`);
  }
});
