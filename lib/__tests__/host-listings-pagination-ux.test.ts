import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static contract checks for listings pagination UX invariants
 * (query reset + Load More independence from IntersectionObserver).
 */
describe("host listings pagination UX contracts", () => {
  const root = process.cwd();
  const hook = readFileSync(
    join(root, "lib/use-host-cursor-list.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(root, "components/host/listings/HostListingsPage.tsx"),
    "utf8",
  );

  it("queryKey includes filter, search, and sort so changes reset page 1", () => {
    assert.match(page, /JSON\.stringify\(\{[\s\S]*filter[\s\S]*search[\s\S]*sort/);
    assert.match(hook, /setItems\(\[\]\)/);
    assert.match(hook, /setNextCursor\(null\)/);
    assert.match(hook, /queryKey/);
    // loadFirst replaces items; loadMore only appends under same gen
    assert.match(hook, /setItems\(page\.items\)/);
    assert.match(hook, /setItems\(\(prev\) => \[\.\.\.prev, \.\.\.page\.items\]\)/);
    assert.match(hook, /if \(gen !== genRef\.current\) return/);
  });

  it("Load More button calls loadMore independently of IntersectionObserver", () => {
    assert.match(page, /IntersectionObserver/);
    assert.match(page, /onClick=\{\(\) => void loadMore\(\)\}/);
    assert.match(page, /hostPortal\.loadMore/);
    assert.match(page, /hasNext \? \(/);
  });
});
