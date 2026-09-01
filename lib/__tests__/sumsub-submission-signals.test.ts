import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sumsubSrc = readFileSync(
  join(process.cwd(), "components/kyc/SumsubWebVerification.tsx"),
  "utf8",
);

describe("SumsubWebVerification submission triggers", () => {
  it("does not call onSubmitted from step completion handlers alone", () => {
    assert.match(sumsubSrc, /idCheck\.onStepCompleted/);
    assert.match(sumsubSrc, /idCheck\.stepCompleted/);
    assert.doesNotMatch(
      sumsubSrc,
      /onStepCompleted[\s\S]{0,120}onSubmittedRef\.current\(\)/,
    );
    assert.doesNotMatch(
      sumsubSrc,
      /stepCompleted[\s\S]{0,120}onSubmittedRef\.current\(\)/,
    );
  });

  it("calls onSubmitted only on applicant submitted events or review awaiting decision", () => {
    assert.match(sumsubSrc, /idCheck\.onApplicantSubmitted/);
    assert.match(sumsubSrc, /markApplicantSubmitted/);
    assert.match(sumsubSrc, /isReviewAwaitingDecision/);
  });

  it("bootstraps Sumsub once per source (no email/phone/lang remount loop)", () => {
    assert.match(sumsubSrc, /\}, \[source\]\);/);
  });
});
