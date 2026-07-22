import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createScrollCompactController,
  shouldCompactStickySearch,
  EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD,
  EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS,
} from "../use-scroll-compact";

describe("shouldCompactStickySearch", () => {
  it("stays expanded at or below threshold", () => {
    assert.equal(shouldCompactStickySearch(0), false);
    assert.equal(
      shouldCompactStickySearch(EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD),
      false,
    );
  });

  it("compacts above threshold", () => {
    assert.equal(
      shouldCompactStickySearch(EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD + 1),
      true,
    );
  });
});

describe("createScrollCompactController", () => {
  it("compacts immediately when scrolled down", () => {
    const changes: boolean[] = [];
    const controller = createScrollCompactController({
      onChange: (compact) => changes.push(compact),
    });

    controller.onScroll(120);
    assert.equal(controller.getCompact(), true);
    assert.deepEqual(changes, [true]);
    controller.destroy();
  });

  it("delays expand when scrolling back to top", async () => {
    const changes: boolean[] = [];
    const controller = createScrollCompactController({
      expandDelayMs: EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS,
      onChange: (compact) => changes.push(compact),
    });

    controller.onScroll(120);
    controller.onScroll(0);

    assert.equal(controller.getCompact(), true);
    assert.deepEqual(changes, [true]);

    await new Promise((resolve) =>
      setTimeout(resolve, EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS + 20),
    );

    assert.equal(controller.getCompact(), false);
    assert.deepEqual(changes, [true, false]);
    controller.destroy();
  });

  it("cancels pending expand when user scrolls down again", async () => {
    const changes: boolean[] = [];
    const controller = createScrollCompactController({
      expandDelayMs: EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS,
      onChange: (compact) => changes.push(compact),
    });

    controller.onScroll(120);
    controller.onScroll(0);
    controller.onScroll(120);

    await new Promise((resolve) =>
      setTimeout(resolve, EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS + 20),
    );

    assert.equal(controller.getCompact(), true);
    assert.deepEqual(changes, [true]);
    controller.destroy();
  });
});
