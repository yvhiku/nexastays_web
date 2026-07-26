import assert from "node:assert/strict";
import test from "node:test";
import {
  appendedMessagesAfterTail,
  evaluateInitialScrollFrame,
  isConversationNearBottom,
} from "../scroll-policy";

test("conversation remains auto-scroll eligible within 200px", () => {
  assert.equal(isConversationNearBottom(0), true);
  assert.equal(isConversationNearBottom(200), true);
  assert.equal(isConversationNearBottom(201), false);
});

test("counts only messages appended after the previous tail", () => {
  const messages = [
    { id: "older" },
    { id: "previous-tail" },
    { id: "new-one" },
    { id: "new-two" },
  ];
  assert.equal(appendedMessagesAfterTail("previous-tail", messages), 2);
  assert.equal(appendedMessagesAfterTail("missing", messages), 0);
});

test("initial positioning corrects overflowing and reflowed timelines", () => {
  const first = evaluateInitialScrollFrame(
    { lastScrollHeight: -1, lastClientHeight: -1, stableSince: 0 },
    { scrollHeight: 1200, clientHeight: 600, distanceFromBottom: 600 },
    10,
  );
  assert.equal(first.shouldCorrect, true);
  assert.equal(first.stabilized, false);

  const reflow = evaluateInitialScrollFrame(
    first.state,
    { scrollHeight: 1500, clientHeight: 600, distanceFromBottom: 300 },
    100,
  );
  assert.equal(reflow.shouldCorrect, true);
  assert.equal(reflow.state.stableSince, 100);
});

test("initial positioning stabilizes only after 250ms within two pixels", () => {
  const state = {
    lastScrollHeight: 1200,
    lastClientHeight: 600,
    stableSince: 100,
  };
  assert.equal(
    evaluateInitialScrollFrame(
      state,
      { scrollHeight: 1200, clientHeight: 600, distanceFromBottom: 2 },
      349,
    ).stabilized,
    false,
  );
  assert.equal(
    evaluateInitialScrollFrame(
      state,
      { scrollHeight: 1200, clientHeight: 600, distanceFromBottom: 2 },
      350,
    ).stabilized,
    true,
  );
});
