import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isIdentitySessionJwt } from "../jwt-utils";

function b64Json(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

describe("isIdentitySessionJwt", () => {
  it("detects otp_session and identity_session binder tokens", () => {
    const otp = `hdr.${b64Json({ type: "otp_session" })}.sig`;
    const identity = `hdr.${b64Json({ type: "identity_session" })}.sig`;
    const jwt = `hdr.${b64Json({ type: "access" })}.sig`;
    assert.equal(isIdentitySessionJwt(otp), true);
    assert.equal(isIdentitySessionJwt(identity), true);
    assert.equal(isIdentitySessionJwt(jwt), false);
  });
});
