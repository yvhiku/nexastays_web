import assert from "node:assert/strict";
import test from "node:test";

import type { WizardPhoto } from "../host-listing-wizard/form-types";
import {
  coverPhotoId,
  enqueuePhotos,
  hasUnfinishedUploads,
  markFailed,
  markUploaded,
  markUploading,
  mediaBodyFromPhotos,
  movePhoto,
  removePhoto,
  reorderPhotos,
  retryPhoto,
  setCover,
  validatePhotoFile,
} from "../host-listing-wizard/photo-queue";

function fakeFile(name: string, type = "image/jpeg", size = 1024): File {
  return { name, type, size } as unknown as File;
}

function photo(id: string, over: Partial<WizardPhoto> = {}): WizardPhoto {
  return {
    id,
    file: null,
    assetId: `asset-${id}`,
    preview: `blob:${id}`,
    category: "OTHER",
    isCover: false,
    uploadStatus: "uploaded",
    ...over,
  };
}

test("file validation rejects wrong type and oversize, accepts JPEG/PNG/WebP under 5 MB", () => {
  assert.equal(validatePhotoFile(fakeFile("a.gif", "image/gif")), "type");
  assert.equal(validatePhotoFile(fakeFile("a.jpg", "image/jpeg", 6 * 1024 * 1024)), "size");
  assert.equal(validatePhotoFile(fakeFile("a.png", "image/png")), null);
  assert.equal(validatePhotoFile(fakeFile("a.webp", "image/webp")), null);
});

test("enqueuePhotos adds pending tiles with client ids and reports rejections", () => {
  let n = 0;
  const { photos, added, rejected } = enqueuePhotos(
    [photo("existing")],
    [fakeFile("ok.jpg"), fakeFile("bad.gif", "image/gif"), fakeFile("big.jpg", "image/jpeg", 9e6)],
    () => "blob:preview",
    () => `client-${++n}`,
  );
  assert.equal(photos.length, 2);
  assert.equal(added.length, 1);
  assert.equal(added[0].id, "client-1");
  assert.equal(added[0].uploadStatus, "pending");
  assert.equal(added[0].assetId, undefined);
  assert.deepEqual(
    rejected.map((r) => r.reasonKey),
    ["type", "size"],
  );
});

test("markUploaded applies by id and is a no-op when the tile was removed", () => {
  const start = [photo("a", { uploadStatus: "uploading", file: fakeFile("a.jpg") })];
  const done = markUploaded(start, "a", "srv-1");
  assert.equal(done[0].uploadStatus, "uploaded");
  assert.equal(done[0].assetId, "srv-1");
  assert.equal(done[0].file, null);

  const removed = removePhoto(start, "a", () => undefined);
  assert.deepEqual(markUploaded(removed, "a", "srv-1"), removed);
  assert.deepEqual(markFailed(removed, "a", "x"), removed);
});

test("remove revokes the blob preview and drops the tile", () => {
  const revoked: string[] = [];
  const next = removePhoto([photo("a"), photo("b")], "a", (u) => revoked.push(u));
  assert.deepEqual(revoked, ["blob:a"]);
  assert.deepEqual(next.map((p) => p.id), ["b"]);
});

test("reorder and move preserve upload status and ignore unknown ids", () => {
  const list = [
    photo("a"),
    photo("b", { uploadStatus: "uploading", assetId: undefined }),
    photo("c", { uploadStatus: "pending", assetId: undefined }),
  ];
  const reordered = reorderPhotos(list, ["c", "zzz", "a"]);
  assert.deepEqual(reordered.map((p) => p.id), ["c", "a", "b"]);
  assert.equal(reordered[0].uploadStatus, "pending");

  const moved = movePhoto(list, "b", 1);
  assert.deepEqual(moved.map((p) => p.id), ["a", "c", "b"]);
  assert.deepEqual(movePhoto(list, "a", -1), list); // edge is a no-op
});

test("cover falls back to the first tile and setCover is exclusive", () => {
  const list = [photo("a"), photo("b"), photo("c")];
  assert.equal(coverPhotoId(list), "a");
  const starred = setCover(list, "c");
  assert.equal(coverPhotoId(starred), "c");
  assert.equal(starred.filter((p) => p.isCover).length, 1);
  assert.equal(coverPhotoId([]), null);
});

test("retryPhoto re-queues a failed tile only when it still has its file", () => {
  const failed = photo("a", { uploadStatus: "error", uploadError: "x", file: fakeFile("a.jpg"), assetId: undefined });
  const hydratedFailed = photo("b", { uploadStatus: "error", file: null });
  const next = retryPhoto([failed, hydratedFailed], "a");
  assert.equal(next[0].uploadStatus, "pending");
  assert.equal(next[0].uploadError, undefined);
  assert.equal(retryPhoto([hydratedFailed], "b")[0].uploadStatus, "error");
});

test("mediaBodyFromPhotos sends only uploaded tiles, in order, with sort_order = index", () => {
  const list = [
    photo("a", { category: "BEDROOM" }),
    photo("b", { uploadStatus: "uploading", assetId: undefined }),
    photo("c", { uploadStatus: "error", assetId: undefined }),
    photo("d", { isCover: true }),
  ];
  const body = mediaBodyFromPhotos(list, "walk-1");
  assert.deepEqual(
    body.media.map((m) => [m.asset_id, m.kind, m.sort_order, m.is_cover]),
    [
      ["asset-a", "PHOTO", 0, false],
      ["asset-d", "PHOTO", 1, true],
      ["walk-1", "WALKTHROUGH", 2, undefined],
    ],
  );
  assert.equal(body.media[0].category, "BEDROOM");
});

test("hasUnfinishedUploads reflects pending/uploading only", () => {
  assert.equal(hasUnfinishedUploads([photo("a")]), false);
  assert.equal(hasUnfinishedUploads([photo("a"), photo("b", { uploadStatus: "pending" })]), true);
  assert.equal(hasUnfinishedUploads(markUploading([photo("b", { uploadStatus: "pending" })], "b")), true);
  assert.equal(hasUnfinishedUploads([photo("c", { uploadStatus: "error" })]), false);
});
