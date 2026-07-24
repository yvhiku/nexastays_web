import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";

test("check-in milestones never render access credentials", () => {
  const source = readFileSync(
    join(process.cwd(), "components/messaging/timeline/CheckinCard.tsx"),
    "utf8",
  );
  for (const credentialKey of ["doorCode", "accessCode", "lockCode"]) {
    assert.equal(
      source.includes(credentialKey),
      false,
      `${credentialKey} must stay in the gated Context Panel`,
    );
  }
});
