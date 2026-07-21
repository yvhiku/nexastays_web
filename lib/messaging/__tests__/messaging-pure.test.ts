import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateAttachmentBatch,
  fileDedupKey,
  batchMessageType,
  ATTACHMENT_LIMITS,
} from "../image-pipeline";
import { getMediaUploadMeta } from "../optimistic-media";
import { mergeMessages } from "../selectors/reconcile-messages";
import type { MessageDto } from "../messages-api";

function mockFile(name: string, type: string, sizeBytes: number, lastModified = 1): File {
  const buf = new Uint8Array(sizeBytes);
  return new File([buf], name, { type, lastModified });
}

function baseMessage(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    conversationSequence: 1,
    senderId: "user-1",
    type: "TEXT",
    body: "hello",
    metadata: {},
    payload: {},
    status: "SENT",
    deliveryState: "SENT",
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    isSystem: false,
    clientMessageId: "client-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    isOwn: true,
    presentationVersion: 1,
    attachments: [],
    ...overrides,
  };
}

describe("fileDedupKey", () => {
  it("combines name, size, and lastModified", () => {
    const file = mockFile("photo.jpg", "image/jpeg", 100);
    assert.equal(fileDedupKey(file), "photo.jpg:100:1");
  });
});

describe("validateAttachmentBatch", () => {
  it("accepts a batch of images", () => {
    const files = [mockFile("a.jpg", "image/jpeg", 1024), mockFile("b.jpg", "image/jpeg", 2048)];
    assert.equal(validateAttachmentBatch(files), null);
  });

  it("rejects mixed photos and PDFs", () => {
    const files = [
      mockFile("a.jpg", "image/jpeg", 1024),
      mockFile("doc.pdf", "application/pdf", 2048),
    ];
    assert.match(validateAttachmentBatch(files)!, /mix/i);
  });

  it("rejects too many images", () => {
    const files = Array.from({ length: ATTACHMENT_LIMITS.maxImages + 1 }, (_, i) =>
      mockFile(`img-${i}.jpg`, "image/jpeg", 100),
    );
    assert.match(validateAttachmentBatch(files)!, /Maximum/);
  });

  it("rejects oversized files", () => {
    const files = [mockFile("big.jpg", "image/jpeg", ATTACHMENT_LIMITS.maxFileBytes + 1)];
    assert.match(validateAttachmentBatch(files)!, /20 MB/);
  });
});

describe("batchMessageType", () => {
  it("returns IMAGE for image batches", () => {
    assert.equal(batchMessageType([mockFile("a.jpg", "image/jpeg", 1)]), "IMAGE");
  });

  it("returns FILE for PDF batches", () => {
    assert.equal(batchMessageType([mockFile("a.pdf", "application/pdf", 1)]), "FILE");
  });
});

describe("getMediaUploadMeta", () => {
  it("returns null when no upload state", () => {
    assert.equal(getMediaUploadMeta(baseMessage()), null);
  });

  it("reads uploadState from metadata", () => {
    const meta = getMediaUploadMeta(
      baseMessage({
        metadata: { uploadState: "uploading", uploadProgress: 42, uploadLabel: "2 / 5 uploaded" },
      }),
    );
    assert.deepEqual(meta, {
      uploadState: "uploading",
      uploadProgress: 42,
      uploadLabel: "2 / 5 uploaded",
      uploadError: undefined,
    });
  });

  it("supports legacy upload_state key", () => {
    const meta = getMediaUploadMeta(
      baseMessage({ metadata: { upload_state: "failed", uploadError: "Network error" } }),
    );
    assert.equal(meta?.uploadState, "failed");
    assert.equal(meta?.uploadError, "Network error");
  });
});

describe("mergeMessages", () => {
  it("replaces optimistic message with persisted server message", () => {
    const optimistic = baseMessage({
      id: "optimistic_client-1",
      clientMessageId: "client-1",
      conversationSequence: 999,
      status: "PENDING",
    });
    const persisted = baseMessage({
      id: "server-1",
      clientMessageId: "client-1",
      conversationSequence: 5,
      status: "SENT",
    });
    const merged = mergeMessages([optimistic], [persisted]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, "server-1");
    assert.equal(merged[0].isOwn, true);
  });

  it("prefers incoming attachments when optimistic ids present", () => {
    const existing = baseMessage({
      clientMessageId: "client-2",
      attachments: [{ id: "optimistic_att_1" } as MessageDto["attachments"][0]],
    });
    const incoming = baseMessage({
      clientMessageId: "client-2",
      attachments: [{ id: "real-att-1" } as MessageDto["attachments"][0]],
    });
    const merged = mergeMessages([existing], [incoming], { preferIncomingAttachments: true });
    assert.equal(merged[0].attachments[0].id, "real-att-1");
  });
});
